# Lesson 4: Codex, the independent reviewer and second builder

Verified 2026-11-09 against the Codex CLI command reference and the codex-plugin-cc README. Run `codex --help` and `codex exec --help` to confirm.

## 4.1 Why Codex matters in Genesis

* It is a different model family from the builder. That is what makes its review independent. Two Claude instances share blind spots more often.
* Today Codex is "text-supplied": the Founder pastes material in and pastes the verdict back. That works, but every review round costs him minutes and adds delay. Lesson 13 lists the one-time setup that lets Muse run Codex on the VM.

## 4.2 Instructions file

* Codex reads `AGENTS.md`: a global one in the Codex home folder, then the repo root, then the nearest one in subfolders (closest wins).
* Genesis already has `AGENTS.md`. Keep it the shared contract for both builders (lesson 3.2).
* Put in it: package manager, test and build commands, branch rules, files never to touch, review expectations. Keep it short and specific.

## 4.3 Commands Muse will use (once Codex is on the VM)

| Command | Use |
|---|---|
| `codex review --base main` | Review the branch against main |
| `codex review --uncommitted` | Review staged, unstaged and untracked changes |
| `codex review --commit <SHA>` | Review one exact commit. Best for the Genesis same-commit rule |
| `codex review "custom instructions"` | Review with your own focus. The docs say `--uncommitted`, `--base`, `--commit` and a custom prompt conflict, so pick one. For a focused review of one exact commit, use the `codex exec` verifier template below on a worktree checked out at that commit |
| `codex exec "task"` | Non-interactive run |
| `codex exec --sandbox read-only "..."` | Analysis with no writes |
| `codex exec -o verdict.md "..."` | Write the final message to a file |
| `codex exec --output-schema schema.json "..."` | Force the final answer into a JSON shape |
| `codex exec --json "..."` | Stream events as JSON lines for logs |
| `codex exec --ephemeral "..."` | Do not save the session to disk |
| `codex exec resume --last` | Continue the last exec session (fix rounds) |
| `-m <model>` | Pick the model, for example `gpt-6.1-terra` (needs CLI 0.159.0 or later) |
| `-C <dir>` | Set the working directory |

Global options: `--sandbox` accepts `read-only`, `workspace-write`, `danger-full-access`. `--ask-for-approval` accepts `on-request` or `never`. For reviews, always use `read-only`.

### Standard verifier run (template)

```bash
codex exec --sandbox read-only -C "$WORKTREE" \
  --output-schema templates/review-verdict.schema.json \
  -o runs/TASK-ID.codex-verdict.json \
  "$(cat templates/review-request.md) $(cat briefs/TASK-ID.md)"
```

## 4.4 Model choice in Codex (as of 2026-11-09)

* GPT-6.1 Terra (released 2026-10-26): fast and efficient, strongest at writing, visual understanding and computer use. OpenAI says the same allowance covers more tasks than GPT-6.1 Sol or GPT-6 Astra. Good default for routine reviews.
* GPT-6.1 Sol and GPT-6 Astra: for complex code and long reasoning. Use for adversarial review of risky changes.
* These models are in Codex and ChatGPT Work, not in regular ChatGPT chat.

## 4.5 Codex inside Claude Code (plugin)

Install inside a Claude Code session (needs Codex logged in on that machine):

```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

Then the builder session can call `/codex:review --base main`, `/codex:adversarial-review <focus>` (read-only, challenges design and assumptions), or hand a stuck task to Codex with `/codex:rescue`. Muse still records the verdict and decides; a verdict is input, not acceptance.

## 4.6 Writing a good review request

* Give the verifier the Task Brief and the exact commit first. Give the Builder Report last and label it "claims to check".
* Ask for findings with file:line, severity, and a concrete failing scenario. Ban style nits unless asked.
* Ask for a verdict word from a fixed set: PASS, NEEDS FIXES, FAIL.
* A new round goes to a fresh session so it does not anchor on its own earlier verdict.
* See `templates/review-request.md`.

## 4.7 Text relay until the VM setup is done

When the Founder must carry the review, give him one file built from `templates/relay-packet.md`: the brief, the commit SHA, the diff (or a link to the PR), the review request, and the exact answer format. One paste in, one paste back.
