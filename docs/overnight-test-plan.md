# Overnight Test Plan (Step 6)

Controlled, bounded, unattended validation of Genesis. Runs only after
Steps 4 and 5 pass. Nothing in this plan touches production: all work is
branch-scoped in the genesis repo, delivery is pull requests, and no
production merge happens during the test.

## What the test must demonstrate

- Persistent progress tracking (task records + event log survive restarts).
- Automatic execution of eligible queued tasks without the founder present.
- Independent verification of every result (tests re-run, diffs read).
- Recovery from at least one controlled worker interruption.
- Bounded retries and sensible handling of failure.
- Continuation of unrelated work when a task is blocked.
- No unauthorized production changes.
- No duplicate external side effects (no duplicate PRs, branches, or commits).
- Honest reporting of incomplete work.

## Queue (three tasks + one blocked control)

All tasks live in `tasks/` in the genesis repo, each with acceptance
criteria and a dedicated branch. They touch different parts of the
workflow and do not conflict (different files, different branches).

1. **overnight-01 (code + test):** `scripts/status.mjs` also prints the
   timestamp of the latest event in `events.jsonl` (or "no events yet"
   when the log does not exist), with a test covering both cases.
   Exercises: implement, test, verify, PR.
2. **overnight-02 (docs):** consolidate the remaining Phase 2 work
   (from the Step 7 plan) into `docs/roadmap.md`, one section per
   item with its trigger or dependency. Exercises: a non-code path
   through the same pipeline (branch, review, PR).
3. **overnight-03 (controlled interruption):** a builder session started
   on an isolated branch and deliberately killed mid-run (before any
   commit), to prove the reconciler re-queues the task and a retry
   completes it. Success = the interruption is visible in the event
   log (`run_interrupted` + `task_requeued`), the retry completes,
   and no partial commit or duplicate branch exists. The killed run
   must not have committed anything; the retry starts from a clean
   branch state.
4. **overnight-blocked (control, stays blocked):** a task whose
   acceptance requires a founder decision that is not available
   overnight (for example, a naming decision). It must remain
   `blocked` with its exact unblock need recorded, while tasks 1–3
   complete around it. It proves blocked isolation; it is not a
   failure.

## Runner mechanism

- A scheduled job fires every 30 minutes overnight. Each tick:
  1. Runs `node scripts/reconcile.mjs` (recovers interrupted runs
     within the 3-attempt budget, or blocks them on exhaustion).
  2. Picks the next `queued` task (lowest id first), dispatches a
     builder on its branch with the standard permission flags
     (`--permission-mode acceptEdits` + scoped `--allowedTools`),
     and waits for its report.
  3. Verifies independently (re-runs tests, reads the diff, checks
     for secrets), opens the PR, and records evidence in the task
     record.
  4. If the task's builder fails or is interrupted, records the
     outcome and moves on; it never retries a step that may already
     have committed an external side effect without checking first
     (branch pushed? PR already exists?).
- **Stop conditions.** The runtime has no native stop-after-N-runs,
  so the stop is enforced in the job body: when every queue task is
  `completed` or `blocked` with a recorded reason, later ticks do
  nothing except confirm the queue is done. The job itself is
  removed in the morning report. A tick that finds nothing eligible
  is a no-op, never busywork.
  *Dated note 2026-10-29 (superseded):* the "removed in the morning
  report" sentence above was true of this pre-run plan only. The
  orchestrator's morning-report decision (F3, `docs/phase-2-plan.md`
  D5) is **REMAIN**: the job was not removed and stays in place as the
  standing runner. A tick that finds nothing eligible is now a
  **silent no-op** (no message, no commit). Current behavior is in
  `docs/runner-operations.md`.
- **Time budget.** The test runs one night only. If the queue is not
  done by morning, the morning report says so plainly, with
  per-task status — a short successful run is never described as
  proof of long-term reliability.

## Verification checklist (morning report)

- [ ] Every task record shows its final status with evidence.
- [ ] `events.jsonl` contains the interruption (`run_interrupted` +
      `task_requeued`) and every completion, in order, with no gaps
      the reconciler cannot explain.
- [ ] Each completed task has a PR; listing PRs per branch shows no
      duplicates.
- [ ] The blocked control task is still `blocked` with its reason.
- [ ] No commit landed on `main` except through a reviewed, merged PR.
- [ ] No paid resource was created, no credential changed, no
      production state touched.
- [ ] Anything incomplete is reported as incomplete, with the blocker.

## Known limits (do not overclaim)

- One night proves the recovery loop works, not that it works for
  months. Long-term reliability needs repeated runs.
- The runner is a scheduled agent job, not a process supervisor: if
  the runtime itself is down, ticks do not fire, and the morning
  report must say which ticks were missed (from the job's run
  history), not assume they ran.
- The controlled interruption kills a builder process; it does not
  simulate a VM replacement. VM-replacement recovery (reinstall the
  builder binary, re-fetch state from git) is a separate test, to be
  run deliberately, not claimed from this one.

### Status as of 2026-10-29 (runner now wired)

The three limits above were written before the runner was wired and are
kept as the record of the pre-run plan. They were not about the wiring,
which has since changed (sources: `docs/runner-wiring.md`,
`docs/runner-operations.md`, `docs/runner-reliability.md`,
`docs/runner-regression.md`, `docs/policy.md` section 7). What is true now:

| Topic | When the plan was written | Now (2026-10-29) |
|---|---|---|
| Job lifetime | Removed in the morning report | Remains as the standing runner (F3: REMAIN); schedule stays in place |
| Preflight | Not part of the tick | Wired as step 0 of every tick (`node scripts/preflight.mjs`); nonzero exit stops the tick and reports the `preflight FAILED:` line. Residual: it proves a past login, not a valid token |
| Dispatch | Manual `startRun`-push path | Retired. Claim-first dispatch: the claim CLI (`scripts/claim.mjs`) must return `WON` before any builder is dispatched |
| PR creation | Check by hand whether a PR exists | Adopt-before-create is wired (`scripts/pr-recovery.mjs`, four cases); `gh pr create` runs only when adopt returns `url: null` |
| Empty queue | "No-op" stated as intent | Ticks with nothing queued and nothing to reconcile are silent no-ops (exception: a task record with `report: true` gets one completion note) |

Still true and unchanged: one night (or one live task) does not prove
long-term reliability, ticks do not fire if the runtime is down, and
builder-kill is not a VM-replacement test. The empty-queue selector
("lowest queued id first") lives in the cron body, not in tested code
(`docs/runner-regression.md` row 8).
