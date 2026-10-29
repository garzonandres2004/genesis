# Runner preflight wiring

Contract between the scheduled runner and `scripts/preflight.mjs`. The script
checks the claude binary and version, Claude auth markers, GitHub auth, and
repo state. See `scripts/preflight.test.mjs` for the scenarios it is tested on.

## Contract

1. **Run before every dispatch.** The runner invokes `node scripts/preflight.mjs`
   from the genesis repo root BEFORE dispatching any builder for a task.
2. **Non-zero exit means stop safely.** No builder is dispatched, task state is
   left unchanged (no `tasks/*.json` edits, no status changes, no branches), and
   the runner reports the failure line verbatim. The failure line is the last
   line of the script's output and starts with `preflight FAILED:`.
3. **One reinstall, only inside the script.** The script's single-reinstall rule
   (`MAX_REINSTALL_ATTEMPTS = 1`, pinned `@anthropic-ai/claude-code@2.1.312`) is
   the ONLY reinstall allowed. The runner must never reinstall separately, retry
   the script in a loop, or re-run it to "try again" within the same run.
4. **Exit 0 means proceed.** Warnings (for example unreadable auth markers) do
   not fail the run. The runner includes any `with N warning(s)` text in its
   report.

## Step 0 text for the scheduled runner

Proposed text; the orchestrator applies it after merge.

> Step 0 — Preflight. From the genesis repo root, run `node scripts/preflight.mjs`
> once. If it exits non-zero, STOP: do not dispatch any builder, do not change
> any task record or state, do not reinstall anything yourself, and do not retry.
> Report the final output line (starting `preflight FAILED:`) verbatim. If it
> exits 0, continue to step 1. Never print credential values.

## What "stop safely" means per failure mode

In every case: no builder dispatched, task state unchanged, no retry, failure
line reported verbatim.

| Failure | Check | What happened | Stop behavior |
|---|---|---|---|
| Missing binary | `claude-binary` | claude not on PATH; the script attempts its one reinstall | Not a stop by itself: if the reinstall succeeds the run continues normally; if it fails, see Failed reinstall below |
| Failed reinstall | `claude-binary` (detail `missing dependency: claude. One reinstall attempted and failed. Manual recovery: npm install -g ...`) | Reinstall did not produce a binary | Stop; a human runs the manual recovery command. The runner does not retry or reinstall again |
| Failed auth | `claude-auth` | No credentials marker and no `oauthAccount` key | Stop; a human runs `claude` to log in |
| Unavailable repo | `repo-state` | Not a git repo, no `origin` remote, or `git ls-remote origin HEAD` failed | Stop; a human fixes the checkout or network |
| Failed GitHub access | `github-auth` | `gh auth status` non-zero | Stop; a human runs `gh auth login` |

An old or unparseable claude version (`claude-version`) is handled the same way,
without a reinstall.

## Limits

- An auth marker proves a past login, not current token validity. A passing
  `claude-auth` can still be followed by an expired-token failure at dispatch.
- The live shell-out paths (`command -v claude`, `claude --version`,
  `npm install -g`, `gh auth status`, `git ls-remote`) were verified by
  orchestrator runs, not by unit tests. Unit tests use injected probes.
- The unreadable-markers case (warn, not fail) is tested with file permissions
  and is skipped when tests run as root.
