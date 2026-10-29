# Runner operations

How the live Genesis runner behaves, what it does when something goes wrong,
and what has and has not been proven. Written 2026-10-29 after the first live
task (PR #25). For exact CLI syntax see `docs/runner-wiring.md`; this doc does
not repeat it.

**Sourcing.** The cron body lives outside the repo and the builder who wrote
this doc did not read it. Its description here comes from the orchestrator's
report (rewritten and verified via `cron.view`): preflight step 0, claim-first
dispatch, adopt-before-create with four cases, one task per tick,
single-worker policy, `report:true` exception to silent no-op ticks, 30-minute
cadence. The old manual startRun-push path is retired. Orchestrator correction
2026-10-29: the step order in section 1 and the attempt-counting rule in
section 2 were checked against the live cron body via `cron.view`. Anything
not in that description or in the repo docs is labeled as missing.

## 1. The live execution path

One task per tick, every 30 minutes. In order:

| Step | Action | Stops the tick when |
|---|---|---|
| 0 | `node scripts/preflight.mjs` (`docs/runner-preflight-wiring.md`) | exit != 0: report the `preflight FAILED:` line, change nothing |
| 1 | Fetch, then read the queue from `origin/main` (lowest `queued` id first). Also check each non-completed task's branch for pushed `in_progress` state needing reconcile. None queued and nothing to reconcile: silent no-op (section 5) | queue done |
| 2 | `node scripts/reconcile.mjs` on any branch with an open run (section 2); commit and push reconcile outputs to that branch. A re-queued task becomes eligible in this same tick; a newly blocked task does not | n/a |
| 3 | Claim CLI in the task worktree (`scripts/claim.mjs`) | LOST or error: no dispatch |
| 4 | Dispatch the builder in that worktree, only after `WON` | n/a |
| 5 | Orchestrator verifies independently: re-run tests, read the diff, secret scan | verification fails: task blocked with reason, no PR |
| 6 | Orchestrator records the run outcome (`completed`, evidence with commit SHA and test counts) in the task record and pushes to the task branch | n/a |
| 7 | Adopt CLI (`scripts/pr-recovery.mjs`): create, adopt, surface, or stop | any case except "create" |
| 8 | `gh pr create`, only when adopt returned `url: null`; then record the adopted or created PR URL in the task record and push to the task branch | anomaly or `gh` failure: no create, no merge |
| 9 | Wait for CI (bounded, section 3), then merge only if green and verified | CI red or pending: no merge |
| 10 | If the record carries `report: true`, send one brief completion note after merging; otherwise end silently | n/a |

Exact commands, arguments, output shapes and exit codes: `docs/runner-wiring.md`
sections 1 to 4. Only the orchestrator writes task records and opens PRs
(`docs/policy.md` sections 1 and 5).

**Additions from the stabilization-gate audit (2026-10-29).** The orchestrator
audited the live cron body (`cron.view`, job `genesis-overnight-test`, 08:47)
against this doc and found no material discrepancies. A repo-side read of this
doc against the same claims found no contradictions but three omissions, added
here. They are cron-body facts reported by the orchestrator; this repo cannot
confirm them.

- The cron body numbers its steps 0 to 4 and 5a to 5j; the table above groups
  the same actions into steps 0 to 10. The order is the same.
- **Builder failure** (distinct from verification failure): the run is recorded
  as `task_failed` and the task becomes `blocked` with the reason recorded.
  There is no PR, and nothing is retried silently. (A builder that exceeds 20
  minutes is the interrupted path instead, section 3.) The code half of this is
  tested (`docs/runner-regression.md`, rows 3 and 4); the decision to record a
  failure is cron-body prose.
- **Claim files.** Before the claim CLI runs, the worker prepares the claim
  commit's files: the task record after `startRun` (attempts +1, an open run),
  the full `events.jsonl`, and a `task_started` event. This is why attempts are
  counted at claim (section 2).
- **Hard rules** in the cron body: no push to `main`, no force-push, never
  delete a branch, one task per tick, parallel execution OFF, never print
  credentials.

First live run: PR #25, merged `b8501d2` (tick 08:16 MDT, 2026-10-29). See
the evidence table at the end of this doc.

## 2. Recovery behavior

**Reconcile.** `node scripts/reconcile.mjs` finds an `in_progress` task whose
latest run has `task_started` but no terminal event, appends `run_interrupted`
and `task_requeued`, and re-queues it while `attempts < 3`. At 3 attempts the
task becomes `blocked` ("retry budget exhausted"). Re-running changes nothing
(`docs/durable-execution.md`).

**Claim outcomes.**

- `WON` (exit 0): dispatch.
- `LOST` (exit 0, `branch_exists` or `push_rejected`): stand down. No push, no
  dispatch, no PR, no task-state change. A normal outcome, not an error.
- Throw / error (exit 1, empty stdout): state unknown. No dispatch, no PR, no
  retry in the same tick.

**Adopt, four cases** (`docs/runner-wiring.md` section 3):

1. exit 0, `url: null`: create the PR.
2. exit 0, `url` set, no anomaly: adopt that URL, do not create.
3. exit 0, `url` set with `anomaly` (several open PRs, or head mismatch):
   surface it; do not create, do not merge. With several open PRs the first is
   reported alongside the anomaly.
4. exit 1: `gh` failed; state unknown; do not create.

**Attempt-scoped retry branches.** A retry cannot reuse the earlier attempt's
claim branch (`branch_exists`). Retries use flat attempt-scoped names:
`<task-branch>-attempt-2`. The nested form `<task-branch>/attempt-2` fails,
because git cannot create a ref beneath an existing ref of the same name.
Stale claim branches are never reused and never deleted.

**Two recovery paths, kept distinct.**

| | Interrupted, no PR | Crash after PR created |
|---|---|---|
| Symptom | Run has `task_started`, no terminal event; no PR | `gh pr create` succeeded; runner died before the URL was recorded; task record says no PR |
| Mechanism | Reconcile: `run_interrupted` + `task_requeued`; retry on a new attempt-scoped branch | Adopt CLI finds the open PR for the same branch and the runner records its URL |
| Branch | New flat attempt-scoped branch | Same branch as the original |
| Counts an attempt | Yes (re-queue consumes one) | No. Attempts are counted at claim (`startRun`, attempts +1) and never changed by adoption; adoption records only the PR URL. In the crash-after-PR case the run was already completed at verification before adopt |
| Proven | Fixture test (d); real builder kill (overnight-03) | Fixture (create count stays 1); live adopt on a real open PR (scratch #26). A live crash-after-create was **not** reproduced |

## 3. Retry limits

- **Task attempts: 3** (initial + 2 retries), then `blocked` with a recorded
  reason (`docs/policy.md` section 7).
- **Builder: 20-minute interrupt rule.** A builder run exceeding 20 minutes is
  treated as interrupted and handled by reconcile. (Stated in the live cron
  body, orchestrator-verified; not in any repo doc.)
- **Preflight: one reinstall, never a loop.** `MAX_REINSTALL_ATTEMPTS = 1`,
  inside the script only. The runner never reinstalls separately or re-runs
  preflight to try again.
- **CI wait: about 5 minutes, bounded.** If checks are still pending, the PR
  is left open, not merged, and not polled indefinitely. (Stated in the live
  cron body, orchestrator-verified.)
- **No silent retries of failures.** Failed verification becomes `blocked`
  with the exact reason and evidence, or is fixed within the budget with a
  recorded reason. Nothing that may already have had an external side effect
  is retried without checking first (branch pushed? PR exists?).

## 4. Known failure modes and the required response

| Failure | Required response |
|---|---|
| Preflight fails | Tick stops. No dispatch, no task change, no extra reinstall. Report the `preflight FAILED:` line verbatim. A human fixes it |
| Claim throws | No dispatch, no PR, no retry this tick |
| Claim LOST | Stand down; nothing changes |
| Adopt anomaly | Surface to the orchestrator. No create, no merge |
| `gh` failure at adopt | No create; stop |
| CI red | No merge. Task is not complete |
| Stale head under strict branch protection | Merge `main` into the branch first, re-verify, wait for CI green again, then merge |
| Claim commits carry the helper's identity (`Claude (builder)`, `noreply@anthropic.com`) | By design and cosmetic. The commit content is what matters. Do not change git config |
| `MODULE_NOT_FOUND` or missing scripts | Scripts must run from a **fresh `origin/main` checkout or worktree**, never the main clone's stale working tree. Observed once: the first live adopt check failed with `MODULE_NOT_FOUND` because the main clone's old working tree predates `pr-recovery.mjs`; the redo from a fresh worktree succeeded. Not a product failure |
| Claude binary missing after a restart | Preflight's single reinstall handles it (precedent: the 00:14 Oct 29 restart). If the reinstall fails, the tick stops |

Expired token: preflight's auth check proves a past login only
(`docs/runner-preflight-wiring.md`, Limits), so an auth failure at dispatch is
still possible after a preflight pass. This is a revisit trigger (T3 in the
plan), not a handled case.

### Source-doc notes (not edited)

- Resolved 2026-10-29 (stabilization gate): `docs/runner-wiring.md` section 2
  used to offer "or delete the stale claim branch first," and its header named
  a `phase2-runner-wiring` task with no record in `tasks/`. Both were removed
  from that doc (dated correction note there). Retries use flat
  attempt-scoped names and nothing is deleted.
- `docs/runner-reliability.md` and `docs/overnight-test-plan.md` are partly
  outdated by the live wiring (already tracked as D2, D3, D5 in
  `docs/phase-2-plan.md`).

## 5. No-op behavior

When the queue is done (every task `completed`, or `blocked` with a recorded
reason), ticks are **silent no-ops**: no message, no commit, no busywork. The
07:46 MDT tick on 2026-10-29 ran the new body this way.

Exception: the `report:true` setting on a task. A tick that merges such a task
sends one brief note about the merge and nothing else.

## 6. Single-worker policy

Parallel execution is **OFF**: one worker, one task per tick. The claim and
adopt guards make that safe; they are not authorization to run more. Turning
parallelism on needs a separate orchestrator/user directive (and, per the
plan's trigger T1, a GitHub-server race test first, since the race test used
local bare remotes). This doc does not enable it.

## 7. VM-replacement limitation

There is **no on-demand trigger** for a platform VM replacement. Restarts are
platform-initiated and unpredictable, so a deliberate VM-replacement-during-a-
tick test cannot be scheduled. **VM replacement has not been tested.**

The closest valid alternatives, all tested:

1. Fixture SIGKILL + real `reconcile.mjs` + retry (orchestration test (d)).
2. Real builder kill + reconcile + retry (overnight-03; old manual path).
3. Tick continuity across restarts (live run records: the scheduler resumes
   across ticks by design).
4. Binary-loss recovery via preflight's single reinstall (00:14 Oct 29
   restart: claude binary missing, restored once, auth intact).

## 8. Scratch and test hygiene

- Scratch PRs are closed unmerged (PR #26 was).
- Scratch branches are left in place per the no-deletion rule
  (`scratch/adopt-test` remains on the remote).
- Scratch work never touches a production branch or a real task's branch.

## Evidence

| Claim | Evidence |
|---|---|
| CLIs, fixture, tests | PR #23 merged `97b01fc`; suite 62 -> 82 (81 pass, 0 fail, 1 pre-existing root skip). Cases: (a) happy path in order, one claim commit + one PR create; (a2) preflight failure => exit 1, nothing follows; (b) second claim => LOST, no dispatch (sequential; simultaneity is `claim.test.mjs`, 24 rounds, one winner each); (c) crash-after-create => adopt finds it, create count stays 1; (d) SIGKILL fake builder => reconcile marks interrupted + re-queues, second reconcile no-op, retry completes, outcomes [interrupted, completed]; (e) several open PRs => first + anomaly, no create; (e2) gh failure at adopt => exit 1, no create |
| First live task | PR #25 merged `b8501d2` (08:16 MDT): preflight passed; claim WON `1f03187` on `runner/live-test-01`; builder docs-only (`docs/live-runner-proof.md`, 34 lines, `ad1475b`); orchestrator verification 82 / 81 pass / 0 fail / 1 skipped, diff 1 file +34/-0, secret scan clean; adopt null => one PR; test check green; merged; record completed, attempts 1, runs [completed], final record commit `4073625` |
| Live claim-LOST | Second claim on `runner/live-test-01` returned `{"status":"LOST","reason":"branch_exists","sha":null}`, exit 0; remote tip `4073625` before and after |
| Live adopt | Scratch PR #26 on `scratch/adopt-test`: `{"url":".../pull/26","headSha":"aa78145012a03557a01d7ee88c4f67eff8e1dd70","anomaly":null}`, exit 0; PR #26 closed unmerged |
| Tick continuity | 07:46 MDT silent no-op under the new body; 08:16 MDT live task; earlier ticks silent, 0 consecutive failures |
| Precedents | overnight-03 kill + reconcile + retry; 00:14 Oct 29 restart binary reinstall |

## Missing or unverified

- A live two-tick race (ticks are 30 minutes apart; a small task finishes in
  one tick) and a live crash-after-create were not staged.
- Long-term reliability: one live task is not a series.
- VM replacement: untested (section 7).
