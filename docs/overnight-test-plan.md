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
