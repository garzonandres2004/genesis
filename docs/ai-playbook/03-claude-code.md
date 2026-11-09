# Lesson 3: Claude Code, the main builder

Verified 2026-11-09 against code.claude.com docs (features overview, headless, CLI reference). Run `claude --help` to confirm on the VM.

## 3.1 The extension layers and when to use each

| Layer | What it does | Use it when | Genesis example |
|---|---|---|---|
| `CLAUDE.md` | Always-on project rules, loaded every session | Claude gets a convention wrong twice | Build and test commands, branch rules, "never touch main" |
| `.claude/rules/` | Rules scoped to file paths | Rules only matter in one folder | Rules for `scripts/` vs `docs/` |
| Skills (`SKILL.md`) | On-demand knowledge or a `/command` workflow | You paste the same procedure a third time | `/verify-task`, `/write-builder-report` |
| Subagents | Isolated worker with its own context, returns a summary | Noisy work you will not need again: searching, reading many files, running suites | A read-only reviewer subagent |
| Dynamic workflows | A script that runs many subagents and cross-checks findings | Work bigger than a handful of subagents | Audit a whole repo before Cutline starts |
| Hooks | Script, HTTP call, prompt or subagent on a lifecycle event | Something must happen every time with no judgment | Block edits to `.env`, block pushes to main, run tests after edits |
| MCP | Connect to outside services | Claude needs data from a system it cannot see | Supabase, Vercel, GitHub |
| Plugins | Package skills, hooks, subagents and MCP into one install | A second repo needs the same setup | A "genesis-builder" plugin shared across Cutline, Family Wealth OS, Obra Pública |

Key rule from the docs: an instruction in `CLAUDE.md` is a request, not a guarantee. A `PreToolUse` hook that blocks the action is enforcement. Every rule in `docs/policy.md` section 3 that can be a hook should be a hook.

Keep `CLAUDE.md` under about 200 lines. Move reference material into skills, which load only when used.

## 3.2 Share AGENTS.md with Claude Code

Genesis keeps its working contract in `AGENTS.md`, which Codex reads. Claude Code loads `CLAUDE.md`. Add a short `CLAUDE.md` at each repo root that imports the shared file with `@AGENTS.md`, plus anything Claude-specific. See `templates/CLAUDE.md`. One source of truth, both builders follow it.

## 3.3 Dispatching Claude Code from Muse (headless)

Confirmed flags (CLI reference, 2026-11-09):

| Flag | Why Muse uses it |
|---|---|
| `-p` | Non-interactive run, exits when done, exit code 0 on success |
| `--output-format json` | Returns `result`, `session_id` and `total_cost_usd` so you can record cost per task |
| `--json-schema '<schema>'` | Forces the final report into a fixed shape, found in `structured_output`. Check the field exists before using it |
| `--model sonnet` / `opus` / `haiku` | Model choice per task |
| `--effort low/medium/high/xhigh/max` | Thinking effort. Raise it before switching to a bigger model |
| `--fallback-model` | Keeps the run alive if the main model is overloaded |
| `--permission-mode` | `acceptEdits`, `auto` (a classifier reviews each action), `dontAsk` (deny anything that would prompt), `plan` |
| `--permission-prompts none` | Unattended runs: anything that would need a human is denied and Claude is told not to retry |
| `--allowedTools "..."` | Pre-approve specific tools, for example `"Read,Edit,Bash(npm test *),Bash(git diff *)"` |
| `--max-turns N` | Hard stop on runaway loops |
| `--max-budget-usd N` | Stop when estimated spend hits a cap (subagent spend counts) |
| `-w <name>` / `--worktree` | Isolated git worktree per task |
| `--append-system-prompt-file <file>` | Add the Task Brief rules without replacing Claude Code's defaults |
| `--resume <session_id>` | Continue the same run for a fix round, keeping its context |
| `--bare` | Skip local hooks, skills, plugins and CLAUDE.md for reproducible scripted runs. Needs an API key, not the subscription login, so not the default in Genesis |

### Standard builder dispatch (template)

```bash
claude -p "$(cat briefs/TASK-ID.md)" \
  --model sonnet --effort medium \
  --fallback-model opus \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Bash(npm test *),Bash(npm run *),Bash(git status *),Bash(git diff *),Bash(git add *),Bash(git -c *)" \
  --permission-prompts none \
  --max-turns 60 \
  --output-format json \
  --json-schema "$(cat templates/builder-report.schema.json)" \
  > runs/TASK-ID.attempt-N.json
```

`Bash(git -c *)` is broad enough to allow a push. Use this template only together with the guardrail hooks (lesson 13, item 4) that block pushes to main and `git config`.

Then record `session_id`, `total_cost_usd` and the exit code in the task record through Runner rules, and verify independently (lesson 9).

### Read-only reviewer dispatch (template)

```bash
git diff main...HEAD | claude -p "Review this diff against the Task Brief in briefs/TASK-ID.md. List defects with file:line, severity, and a failing scenario. No style nits." \
  --model opus --effort high \
  --permission-mode dontAsk --allowedTools "Read,Grep,Glob" \
  --output-format json
```

Use this only when Codex is unavailable. A reviewer from the same family as the builder catches less.

## 3.4 Model and effort choice

Genesis default (README): Sonnet for building, Haiku for background chores, Opus only when it earns it. A practical ladder:

1. Haiku: formatting, renames, log summaries, inventory scripts.
2. Sonnet at medium effort: normal features and fixes.
3. Sonnet at high effort: tricky logic, after one failed attempt.
4. Opus at high effort, fresh session: after two failed attempts, architecture, security sensitive code.
5. Opus at max effort or a dynamic workflow: only for the rare big audit, with a budget cap.

Record which rung solved each task. After a month the data tells you where to start.

## 3.5 Context management

* The docs say it plainly: most failures come from a full, noisy context window.
* One task per session. Start fresh for each new task.
* Use subagents for exploration so only the summary returns.
* Compact on purpose, while there is still room, and add what to do next to the compact instruction. Quality is worst right before auto compaction.
* For a fix round, resume the same session only if its context is still clean. If it went in circles, start fresh with a short summary of what failed.

## 3.6 VM facts to remember

* The Claude Code binary is VM-ephemeral. Check `claude --version` at the start of every run and reinstall if it is missing.
* No Docker, local Postgres is wiped on VM replacement, no sandbox. Narrow `--allowedTools` and worktrees are the isolation you have.
* Git has no identity configured. Builders commit with one-off `-c` flags, never `git config`.

## 3.7 Useful built-ins and plugins

* Bundled skills include `/code-review`, `/batch` and `/debug`.
* The official Codex plugin for Claude Code adds `/codex:review`, `/codex:adversarial-review`, `/codex:rescue`, `/codex:status`, `/codex:result`, `/codex:cancel` and `/codex:transfer`. It needs Codex logged in on the same machine (lesson 4).
* The plugin's optional review gate blocks Claude from stopping until Codex approves. Its own docs warn it can loop and drain usage. Only enable it on a monitored, budget-capped run.
