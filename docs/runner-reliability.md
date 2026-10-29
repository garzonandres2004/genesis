# Runner reliability analysis

Scope: three reliability risks in the overnight runner, what is mitigated, and
what is only documented. Nothing here changes the running cron job.

## 1. Concurrency

**Guarantee (scheduler).** A scheduled run does not start on top of a
still-running occurrence of the same job; it is skipped or queued by the
scheduler.

**Residual window (not covered by that guarantee).** Two workers (for example a
scheduled run and a manual or resumed one) can both read the task as `queued`
from `main` before either has pushed its `startRun` record to the task branch.
Both then dispatch a builder on the same branch. The scheduler cannot prevent
this because the two workers are not occurrences of the same job.

**Mitigation (documented only, NOT implemented in the running cron).**
Before dispatching, check the task branch's remote state, not just main's
record (for example `git ls-remote origin <task-branch>` and, if it exists, the
run records on it). The `startRun` push must land before the builder starts, so
that a second worker's check sees it. A push rejected as non-fast-forward means
another worker won and this one must stand down. This narrows the window to the
push itself; it is a best-effort lock, not a transactional one.

**Status.** Analysis only. No code in this branch enforces it, and no overnight
evidence is claimed either way.

## 2. Duplicate PR

**Crash window.** `gh pr create` can return (PR exists on GitHub) and the runner
can die before the task record update recording the PR URL lands. On restart the
task looks like it has no PR, and a naive retry creates a second one.

**Mitigation.** Always run the adoption check before creating a PR:
`node scripts/pr-adopt.mjs <branch>` prints the open PR URL or `none`. If a URL
is printed, adopt it (record it on the task) instead of creating a PR. Closed
PRs do not count. If several open PRs exist, the first is returned and a
warning is printed on stderr.

**Status.** Helper (`scripts/pr-adopt.mjs`) implemented and unit-tested against
fixture JSON (`scripts/pr-adopt.test.mjs`). The live `gh pr list` call has not
been exercised by this branch. Whether a real crash exercised the adoption path
depends on the overnight run and is not known here. The helper is not yet wired
into the runner; wiring it in is a follow-up.

## 3. Preflight check

`node scripts/preflight.mjs` runs before any work starts and prints a JSON
summary (per check: name, status `pass|fail|warn`, detail) plus one
human-readable line. Exit 0 only if every required check passes.

| Check | Basis |
| --- | --- |
| `claude-binary` | `claude` found on PATH (`command -v claude`) |
| `claude-version` | `claude --version` parses as semver and is >= 2.1.312 |
| `claude-auth` | presence-only markers (below) |
| `github-auth` | `gh auth status` exits 0 |
| `repo-state` | inside a git repo, `origin` exists, `git ls-remote origin HEAD` succeeds |

**Auth markers (presence only; supplied by the orchestrator, not independently
verified by this branch).** (a) the file `~/.claude/.credentials.json` exists
and is non-empty (stat only, never opened); or (b) the top-level key
`oauthAccount` exists in `~/.claude.json` (key name only; the value is never
reported). Neither present: `fail`. Markers unreadable due to permissions:
`warn` ("unverified"), which does not fail the run. Limit: a marker proves a
login was once performed, not that the token is still valid or unexpired.

**Recover-once rule.** If the binary is missing, exactly one
`npm install -g @anthropic-ai/claude-code@2.1.312` is attempted, then the
binary is re-checked. Still missing: exit 1, message names the missing
dependency and the manual step, no task state is changed. The guard is
`recoveryDecision(missing, attemptsMade)`, which returns `reinstall` only when
`attemptsMade` is 0. A version mismatch is not a missing binary and is never
auto-reinstalled.

**What was verified how.**
- Unit tests with fixtures/temp dirs: version parsing and comparison, exit-code
  rule, recover-once guard, auth marker logic (temp HOME inside the worktree),
  and the orchestration in `runPreflight` using injected fake probes.
- NOT verified by live run in this branch: the real `claude --version` output
  format (fixture `2.1.312 (Claude Code)` is assumed), `command -v claude`,
  the real `npm install -g`, `gh auth status`, and `git ls-remote` shell-outs.
  Those are thin wrappers (`defaultProbes`) and need a first live run of
  `node scripts/preflight.mjs` to confirm.
- Preflight is not yet wired into the runner or cron.
