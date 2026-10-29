# Runner reliability analysis

Scope: three reliability risks in the overnight runner, what is mitigated, and
what is only documented.

> **Correction note (2026-10-29, M10-01 / F4).** This doc was written before
> the runner was wired and described a pre-wiring runner: the concurrency
> mitigation was "documented only," `pr-adopt.mjs` was "not yet wired," and
> preflight was "not yet wired." The live runner now does all three. The
> sections below keep the original analysis and are updated in place with
> dated notes; the current behavior is in `docs/runner-operations.md` (live
> path, recovery, no-op, single-worker policy) and the evidence map in
> `docs/runner-regression.md`. Where they differ from this doc, they govern.

## Live runner summary (2026-10-29)

One task per tick, every 30 minutes. Source: `docs/runner-operations.md`
section 1; the cron body lives outside the repo and is described from the
orchestrator's `cron.view` report.

- **Preflight is step 0.** `node scripts/preflight.mjs` runs first; a nonzero
  exit stops the tick, reports the `preflight FAILED:` line, and changes
  nothing.
- **Claim-first dispatch.** The worker claims the task with
  `scripts/claim.mjs` (one claim commit on a new task branch, pushed) and
  dispatches the builder only after `WON`. `LOST` (`branch_exists` or
  `push_rejected`) means stand down; an error means state unknown, so no
  dispatch and no retry in that tick.
- **Adopt-before-create, four cases** (`scripts/pr-recovery.mjs`,
  `docs/runner-wiring.md` section 3): (1) exit 0, `url: null`: create the PR;
  (2) exit 0, `url` set, no anomaly: adopt it, do not create; (3) exit 0,
  `url` set with `anomaly` (several open PRs or head mismatch): surface it,
  no create, no merge; (4) exit 1, `gh` failed: state unknown, no create.
- **Silent no-op ticks.** When the queue is done, ticks send no message and
  make no commit. Exception: a task with `report: true` gets one brief note
  after it merges.
- **Single-worker policy.** Parallel execution is OFF: one worker, one task
  per tick. The claim and adopt guards make that safe; they are not
  authorization to run more.

## 1. Concurrency

**Guarantee (scheduler).** A scheduled run does not start on top of a
still-running occurrence of the same job; it is skipped or queued by the
scheduler.

**Original residual window (pre-wiring).** Two workers (for example a
scheduled run and a manual or resumed one) could both read the task as
`queued` from `main` before either had pushed its `startRun` record to the
task branch, and both would dispatch a builder on the same branch. The
scheduler cannot prevent this because the two workers are not occurrences of
the same job.

**Mitigation (now implemented: claim-first dispatch).** *Correction
(2026-10-29): the original text said this mitigation was documented only and
not implemented, and proposed a `git ls-remote` check plus a `startRun` push
before the builder. The live runner instead uses the claim CLI
(`scripts/claim.mjs`): the claim commit (task record after `startRun`, full
`events.jsonl`, `task_started` event) is pushed to the task branch, the push
is the lock, and the builder is dispatched only on `WON`. A second claimant
gets `LOST` (`branch_exists` or `push_rejected`) and stands down with no
push, dispatch, PR, or task-state change.* Retries cannot reuse an earlier
claim branch, so they use flat attempt-scoped names
(`<task-branch>-attempt-2`); nothing is deleted.

**Status.** Wired and live. Evidence (`docs/runner-regression.md` row 2):
fixture tests (`claim.test.mjs`, `claim-cli.test.mjs`, orchestration case
(b)) and a live `LOST`/`branch_exists` on `runner/live-test-01`. Not proven:
a race on a real GitHub server (the race test uses local bare remotes; it
runs 3 rounds per execution). Parallelism stays OFF regardless.

## 2. Duplicate PR

**Crash window.** `gh pr create` can return (PR exists on GitHub) and the runner
can die before the task record update recording the PR URL lands. On restart the
task looks like it has no PR, and a naive retry creates a second one.

**Mitigation (adopt-before-create, four cases).** *Correction (2026-10-29):
the original text described `node scripts/pr-adopt.mjs <branch>` printing the
URL or `none`, and said that with several open PRs the first is returned with
a stderr warning. The live runner uses the adopt CLI `scripts/pr-recovery.mjs`
with the four cases listed in the summary above. With several open PRs the
first is still reported, but together with an `anomaly`, and the runner
neither creates nor merges.* The PR is created only in case 1 (`url: null`);
the adopted or created URL is then recorded in the task record. Closed PRs do
not count. `scripts/pr-adopt.mjs` remains the underlying helper
(`pr-adopt.test.mjs`).

**Status.** Wired and live. Fixtures: orchestration (c) crash after create
(create count stays 1), (e) several open PRs, (e2) `gh` failure at adopt;
`adopt-cli.test.mjs`, `pr-recovery.test.mjs`, `pr-adopt.test.mjs`. Live:
scratch PR #26 adopted (closed unmerged); adopt `null` on PR #25 led to one
PR. A live crash-after-create and a live anomaly were **not** reproduced
(`docs/runner-regression.md` row 5).

## 3. Preflight check

Preflight is **step 0 of every tick** (*correction 2026-10-29: originally
"not yet wired into the runner or cron"; it is wired, see
`docs/runner-preflight-wiring.md`*). `node scripts/preflight.mjs` runs before
any work starts and prints a JSON summary (per check: name, status
`pass|fail|warn`, detail) plus one human-readable line. Exit 0 only if every
required check passes. On a nonzero exit the tick reports the
`preflight FAILED:` line and stops with no claim, dispatch, PR, or task
change.

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
- Live: the 00:14 Oct 29 restart was a live preflight pass that reinstalled the
  missing binary once, and the first live task (PR #25) passed preflight.
  *Correction (2026-10-29): the original text listed the real `claude
  --version` output, `npm install -g`, `gh auth status`, and `git ls-remote`
  shell-outs as unverified by live run; they have since run live in the
  standing runner.* A live preflight **failure** was never staged
  (`docs/runner-regression.md` row 1), and an expired token can still fail at
  dispatch after a preflight pass (`docs/runner-operations.md` section 4).

## 4. Where the rest is documented

- Live step table, recovery paths, retry limits, failure modes:
  `docs/runner-operations.md` sections 1 to 4.
- Silent no-op ticks and the `report: true` exception: section 5 there.
- Single-worker policy: section 6 there.
- Retry spacing: no programmatic or exponential backoff exists; a re-queued
  task is retried on a subsequent tick at the 30-minute cadence
  (`docs/policy.md` section 7, corrected 2026-10-29).
- Behavior-to-evidence map: `docs/runner-regression.md`.
