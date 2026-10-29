# Phase 2 plan

Task record: `phase2-plan`. This document consolidates the repo's planning,
design, and result documents and all task records into one plan for the rest
of Phase 2. It does not replace them: where it says "per X", X is the
authority for that fact. Status is as of branch `phase2/plan`, cut from
`origin/main` at `e54f948` (PR #21 merged). Source dates are 2026-10-28 and
2026-10-29.

## 0. Read this first: honesty boundaries

These are limits on what this plan claims. They are acceptance criteria of
the plan, not caveats.

1. **The original Step 7 plan does not exist in this repo.** `docs/roadmap.md`
   records this ("The Step 7 plan is not in this repo"), and
   `tasks/overnight-02.json` carries it as a morning-review caveat. The only
   mentions are in `tasks/overnight-02.json` and `docs/overnight-test-plan.md`,
   which refer to it without containing it. This plan does not reconstruct it.
   See section 7 for what is missing and what cannot be planned until it
   exists.
2. **Parallel execution is OFF.** The claim guard (`scripts/claim.mjs`) and
   the adoption flow (`scripts/pr-recovery.mjs`) now exist, but neither is
   authorization to run more than one worker. One worker per tick stays in
   force until a later orchestrator/user directive says otherwise
   (`docs/atomic-claim.md` section 5; `tasks/phase2-atomic-claim.json`).
3. **The overnight cron's future is undecided.** Whether it remains, is
   paused, or is removed is the orchestrator's morning-review decision. This
   plan does not state or imply the outcome. (`docs/overnight-test-plan.md`
   says the job "is removed in the morning report"; that was a plan written
   before the morning directive and is not a decision. See D5.)
4. **No live GitHub crash-after-PR was reproduced.** The fixture
   (`scripts/pr-recovery.test.mjs`, stubbed `gh`) proves the logic. The live
   path is only partly proven: `pr-adopt` found an existing PR on a real
   branch, and the orchestrator read `headRefOid` from real `gh` on PR #20
   (read-only) (`tasks/phase2-crash-pr-recovery.json`).
5. **Claim and adoption are not wired into the runner.** They are tested
   building blocks. The runner still uses the manual startRun-push and the
   manual "check for an existing PR" rule (sections 5 and 6, items F1, F2).
6. **Not verified by this builder:** the content of the scheduled cron body
   (including the step-0 preflight text). The builder has no access to the
   schedule and was told not to touch it. "Preflight is step 0 of the cron
   body" is taken from the orchestrator's morning-directive outcome, not
   independently read. See M2.

**Dated note (2026-10-29, later the same day):** item 5 is resolved by M5/M6
(claim and adoption are now wired into the live runner; the orchestrator
verified the rewritten cron body via `cron.view`; the builder still did not
read it). Item 3 now has a recorded recommendation (REMAIN, see F3); the
schedule remains in place. Item 4 is unchanged: still no live crash-after-PR
reproduced, though `pr-recovery` adopted a real open PR (scratch PR #26).
Items 1, 2 and 6's Step 7 and parallel-OFF limits are unchanged. The original
wording above is preserved.

### Phase labels used below

The brief refers to work as P2/P3/P4. These labels are not defined in any
repo source; this plan reads them as: **P1** preflight script (PR #14, with
the reliability analysis), **P2** preflight wired into the runner (PR #19 plus
cron step 0), **P3** atomic claim (PR #20), **P4** crash-after-PR adoption
(PR #21). That mapping is this plan's inference. The PR numbers and task ids
are the authoritative references.

## 1. Where things stand

Done and evidenced (task records are authoritative):

| Item | Evidence |
|---|---|
| Demo pipeline end to end | `demo-end-to-end-001`: PR #2 merged, 6 tests then |
| Step 4 durable execution | `step4-durable-execution`: PR #8 merged, 22 tests then |
| Step 5 substation test wiring | `step5-substation-tests`: substation PR #8 opened, deliberately not merged (frozen main) |
| Overnight 01, 02, 03 | PRs #15, #16, #17 merged; 24 tests at the time; `overnight-03` proved kill, `run_interrupted` + `task_requeued`, retry completes (`docs/interruption-recovery-proof.md`) |
| Blocked isolation | `overnight-blocked` stayed `blocked` while 01-03 completed |
| Preflight script + reliability analysis | PR #14 merged (`docs/runner-reliability.md`) |
| Preflight wiring tests + contract | `phase2-wire-preflight`: PR #19 merged |
| Atomic claim | `phase2-atomic-claim`: PR #20 merged |
| Crash-after-PR adoption | `phase2-crash-pr-recovery`: PR #21 merged |

Current suite on this branch (run by the builder, `npm test`): **62 tests,
61 pass, 0 fail, 1 skipped** (the unreadable-auth-markers case skips when run
as root; the preflight record verified it separately as user `nobody`).

Not done: everything in section 5, and the roadmap's open items (section 4,
milestones M7 to M9).

## 2. Milestones, in dependency order

Each milestone lists what it depends on and an acceptance check someone can
run or read. "Verified" means the orchestrator re-ran or read it
independently, per `AGENTS.md`; a builder report alone does not close a
milestone.

### M0. Durable base (DONE)

- **Depends on:** nothing.
- **Delivers:** task records in git, event log, state machine, reconciler,
  idempotency keys (`docs/durable-execution.md`, `tasks/schema.md`).
- **Acceptance (met):** PR #8 merged; `npm test` passes; reconcile smoke test
  on the live repo reported `1 tasks, 0 changed, 0 events appended`
  (`tasks/step4-durable-execution.json`). Re-check: `node scripts/reconcile.mjs`
  twice in a row changes nothing the second time.

### M1. Unattended-run proof, one night (DONE, bounded claim)

- **Depends on:** M0, Step 5.
- **Acceptance (met, per task records):** `overnight-01/02/03` completed with
  merged PRs and orchestrator-verified evidence; `events.jsonl` shows
  `run_interrupted` then `task_requeued` for
  `overnight-03/run-1-2026-10-29T07:17:15.913Z`; `overnight-blocked` still
  `blocked`. Re-check: `node scripts/status.mjs`.
- **Claim limit:** one night shows the recovery loop works, not that it holds
  for months (`docs/overnight-test-plan.md`, "Known limits"). The
  verification checklist in that doc is the orchestrator's morning report; its
  results are not reproduced here.

### M2. Preflight before dispatch (DONE, with one unverified link)

- **Depends on:** M0.
- **Acceptance:**
  - `node scripts/preflight.test.mjs` scenarios all pass: successful startup,
    missing binary with reinstall succeeding, failed reinstall (exactly 1
    install), failed auth (fail) and unreadable markers (warn), unavailable
    repo in three sub-cases, plus the no-leak test
    (`tasks/phase2-wire-preflight.json`: 21/21 as `nobody`, 0 skipped).
  - PR #19 merged after orchestrator verification (met).
  - Cron body step 0 invokes `node scripts/preflight.mjs` per the contract in
    `docs/runner-preflight-wiring.md` (reported by the orchestrator as done;
    **not independently read by this builder**; the orchestrator can confirm
    by reading the job body).
- **Open limit:** an auth marker proves a past login, not a currently valid
  token (`docs/runner-preflight-wiring.md`, "Limits").

### M3. Atomic claim primitive (DONE, fixture-proven)

- **Depends on:** M0.
- **Acceptance (met):** `scripts/claim.test.mjs` runs a two-worker barrier
  race on temp bare remotes: exactly one `WON` and one `LOST` per round,
  remote tip equals the winner's SHA, loser's fake dispatch never called,
  loser's local branch gone; 24 race rounds total across builder and
  orchestrator runs, no flakiness; no `--force`, `--force-with-lease`, or `+`
  refspec in `claim.mjs` (grep); push failure with the branch absent throws
  rather than reporting `LOST`. PR #20 merged.
- **Not proven:** a GitHub-server race (tests use local bare remotes);
  `claim()` re-checks the remote tip and does not rely on rejection message
  text (`tasks/phase2-atomic-claim.json`).

### M4. Crash-after-PR adoption primitive (DONE, fixture-proven)

- **Depends on:** `scripts/pr-adopt.mjs` (PR #14).
- **Acceptance (met):** `scripts/pr-recovery.test.mjs` (7 tests): run 1
  `pr-create` with the URL discarded, run 2 `adoptPr` returns the exact URL
  and head SHA with `anomaly: null`, `pr-create` count is 1 across both runs,
  empty-PATH guard proves no real `gh` spawned. PR #21 merged.
- **Not proven:** no live GitHub crash reproduced (section 0, item 4).

### M5. Claim-first dispatch in the runner (DONE, 2026-10-29; follow-up F1)

**Status update (2026-10-29): DONE.** Evidence: PR #23 (merged `97b01fc`)
added the claim/adopt CLIs, runner fixture, CLI tests and orchestration
integration tests (suite 62 -> 82: 81 pass, 0 fail, 1 pre-existing root
skip); the orchestrator rewrote the cron body (claim-first dispatch, preflight
step 0, old manual startRun-push retired; verified via `cron.view`); live task
PR #25 (merged `b8501d2`) ran claim WON (`1f03187`, branch
`runner/live-test-01`) before dispatch; a live second claim returned
`LOST` / `branch_exists` with the remote tip unchanged (`4073625`). Parallel
execution stayed OFF. **Remaining gap:** a live two-tick race was not staged
(ticks are 30 minutes apart and a small task completes within one tick);
concurrency stays fixture-proven (`claim.test.mjs` race, 24 rounds, one winner
each) plus live-LOST-proven. See `docs/runner-operations.md`. The original
acceptance text below is preserved as written.


- **Depends on:** M3, M2 (preflight stays step 0; claim comes after it).
- **Delivers:** the runner replaces the manual startRun-push with
  `claim()` and dispatches only on `WON`. One task per tick; parallelism
  untouched.
- **Acceptance (to be met):**
  1. The cron body diff shows `claim()` invoked after preflight and before
     any builder dispatch, and the manual startRun-push removed.
  2. A dry run on a scratch task or fixture shows `WON` leads to dispatch and
     `LOST` or a thrown push failure leads to no dispatch, no PR, no task-state
     change beyond the claim.
  3. The claim commit's `writeFiles` produce the same `tasks/<id>.json` and
     `events.jsonl` content the manual startRun-push produced (so
     `node scripts/reconcile.mjs` still sees `task_started` for the run).
  4. `npm test` count is at least 62 with 0 fail after any code change.
  5. The orchestrator's record states parallel execution remained OFF.

### M6. Adopt-before-create in the runner (DONE, 2026-10-29; follow-up F2)

**Status update (2026-10-29): DONE.** Evidence: PR #23 (merged `97b01fc`)
orchestration cases (c) crash-after-create => adopt finds it, create count
stays 1; (e) several open PRs => first + anomaly, no create; (e2) `gh` failure
at adopt => exit 1, no create. The cron body implements the four adopt cases
(verified via `cron.view`). Live task PR #25: adopt CLI returned null =>
exactly one PR created. Live adopt on a real open PR: scratch PR #26 on
`scratch/adopt-test` returned url, `headSha`
`aa78145012a03557a01d7ee88c4f67eff8e1dd70`, `anomaly: null`, exit 0; #26 then
closed unmerged, branch left in place. **Remaining gap:** a live
crash-after-create was not reproduced; adoption logic is fixture-proven
(create count 1) plus live-adopt-proven on a real open PR. Acceptance item 3
(URL recorded in the task record) is met for PR #25 per its task record. The
original acceptance text below is preserved as written.


- **Depends on:** M4. Independent of M5; either order is safe, but doing M5
  first keeps one change per review.
- **Delivers:** the runner calls `adoptPr` before any `gh pr create`.
- **Acceptance (to be met):**
  1. The runner text/code shows `adoptPr` before PR creation, creating only
     on `null`.
  2. A non-null result with `anomaly` is surfaced and no PR is created; a
     throw from `gh` (the default runner uses `execFileSync`, so a failing
     `gh` throws; this is the builder's reading of `scripts/pr-recovery.mjs`,
     not stated in a source doc) is treated as "unknown" and also does not
     create a PR.
  3. On adoption, the URL is recorded in the task record (orchestrator-owned
     write).
  4. A scratch-branch run (not a production branch) shows adoption of an
     open PR. This is still not a reproduced crash; the record must say so.

### M7. Reliability beyond one night (OPEN; gated on the cron decision D5)

**Status note (2026-10-29): stays OPEN.** One live task (PR #25) plus silent
no-op ticks with 0 consecutive failures is not a reliability series; repeated
runs are still needed, and the numeric target (F6) is still unset.


- **Depends on:** M1, and the orchestrator's decision on the overnight cron
  (a recurring runner is the vehicle for repeated runs). If the cron is not
  continued, another repeated-run mechanism has to be chosen; the plan does
  not choose.
- **Acceptance (to be set when D5 is decided):** the minimum meaningful
  version is a stated number of consecutive unattended nights or ticks with
  the `docs/overnight-test-plan.md` checklist passing each time. The number
  is not in any source; it is for the orchestrator to set. Until then this
  milestone has no numeric target, by design.

### M8. VM-replacement recovery test (OPEN; deliberate, not scheduled)

**Status note (2026-10-29): stays OPEN.** The deliberate test has not been
run, and there is no on-demand trigger for a platform VM replacement
(`docs/runner-operations.md` section 7). Four alternatives are tested, none a
VM replacement: fixture SIGKILL + reconcile + retry; real builder kill
(overnight-03); tick continuity across restarts; binary-loss recovery via
preflight's single reinstall (00:14 Oct 29 restart).


- **Depends on:** M2 (preflight's reinstall path is part of what it
  exercises).
- **Source:** `docs/overnight-test-plan.md` "Known limits",
  `docs/roadmap.md` item 7. Neither gives a procedure beyond "reinstall the
  builder binary, re-fetch state from git".
- **Acceptance (to be written when run):** a recorded run after a real
  replacement shows preflight reinstalling once, state recovered from git,
  and the reconciler leaving no stuck task. Only claimed once actually run.
  Note the interruption test (overnight-03) killed a process; it was not a
  VM replacement.

### M9. Step 7 reconciliation (BLOCKED on a missing document)

**Status note (2026-10-29): stays BLOCKED.** The Step 7 document is still
missing.

- **Depends on:** the Step 7 plan being supplied (section 7).
- **Acceptance:** each Step 7 item is either present in `docs/roadmap.md`
  with its trigger or dependency, or recorded as already covered, with a
  source. Not startable until the document exists.

### Gated, not scheduled

- **Parallel execution.** Not a milestone of this plan. Needs a separate
  directive (section 0, item 2). If authorized, see revisit trigger T1: the
  claim-guard evidence (M3) is necessary but not shown to be sufficient.
- **Deferred track** (engine, managed Postgres, Graphiti, Gemini API,
  browser subscriptions, Vercel AI SDK): each has a trigger in section 4 and
  none is scheduled.

### Dependency order at a glance

```
M0 -> M1
M0 -> M2 -> M5 (needs M3)      M3 -> M5
M0 -> M3
M4 -> M6
M1 + D5 -> M7
M2 -> M8
Step 7 doc -> M9
(M5, M6 done) -> a parallel-execution directive could then be considered (T1)
```

## 3. Risks and current status

Statuses: **CLOSED** (shown closed by merged, verified work), **NARROWED**
(reduced but a stated part remains), **OPEN**.

### 3.1 The two residual windows from `docs/runner-reliability.md`, updated

`docs/runner-reliability.md` was written before P3 and P4 and has not been
edited. Its statements are preserved below, with what changed.

**Window 1: concurrency (two workers both read `queued` before either
pushes `startRun`).**

- *Source says:* mitigation "documented only, NOT implemented"; "Analysis
  only. No code in this branch enforces it"; the `ls-remote` check plus push
  is "a best-effort lock, not a transactional one."
- *What P3 changed:* `scripts/claim.mjs` now provides a push-as-compare-and-swap
  claim. `docs/atomic-claim.md` states that the `ls-remote` check is only an
  optimization and "the residual window is the push itself, which is the
  single atomic operation." That is a stronger characterization than the
  reliability doc's "best-effort." It is backed by the race test (M3), not by
  assertion.
- *What remains:* (a) the live runner still uses the manual startRun-push
  until F1 lands, so the live window is the same as before; (b) the race was
  tested on local bare remotes, not against GitHub; (c) `claimSideEffect`
  still protects only one orchestrator process at a time
  (`docs/durable-execution.md`).
- **Status (original, 2026-10-29 morning): NARROWED in code, OPEN in the live
  runner.** The plan followed `docs/atomic-claim.md` on the nature of the
  primitive (it is tested) and `docs/runner-reliability.md` on live status
  (nothing was wired). Parallel stays OFF, so the exposure is also bounded by
  operations: one worker per tick.
- **Status update (2026-10-29): WIRED in the live runner; live-proven on one
  task + fixture suite; long-term reliability still unproven.** Remaining (a)
  is resolved (M5). Remaining (b) and (c) still stand. Resolves the "nothing
  is wired" live-state note in D2 (dated note added there).

**Window 2: duplicate PR (`gh pr create` returns, runner dies before the URL
is recorded).**

- *Source says:* `pr-adopt` helper "not yet wired into the runner"; "The live
  `gh pr list` call has not been exercised by this branch"; whether a real
  crash exercised the adoption path "is not known here".
- *What P4 changed:* `adoptPr` adds the head-SHA check and anomaly reporting
  on top of `pr-adopt`'s parsing, and a fixture proves create-once across a
  crash and recovery. The `headRefOid` field was confirmed by the
  orchestrator against real read-only `gh` output.
- *What remains:* (a) not wired (F2); (b) no live crash reproduced; (c) only
  OPEN PRs are adopted, so a PR already closed or merged for the branch
  yields `null` and a caller would create a new one, which is intended by
  design but worth a human glance if it happens; (d) `adoptPr` assumes `gh`
  succeeds, and the caller must not create on a throw (M6 item 2).
- **Status (original): NARROWED in code, OPEN in the live runner.**
- **Status update (2026-10-29): WIRED in the live runner; live-proven on one
  task + fixture suite; long-term reliability still unproven.** Remaining (a)
  is resolved (M6). (b) still stands: no live crash reproduced. (c) and (d)
  are unchanged; (d) is now enforced by the four-case adopt rule (`gh`
  failure => no create), proven by orchestration test (e2).

### 3.2 Other risks

| # | Risk | Status | Basis |
|---|---|---|---|
| R1 | Runner starts without a working Claude binary, auth, GitHub access, or repo | **NARROWED**: preflight is tested and reported as step 0. Residual: markers prove a past login, not a valid token, so an expired-token failure can still occur at dispatch | `docs/runner-preflight-wiring.md` "Limits"; M2 |
| R2 | Interrupted run is not recovered | **CLOSED for the tested path**: kill, `run_interrupted`, `task_requeued`, retry completes (one instance). Not shown for months or after VM replacement | `docs/interruption-recovery-proof.md`; M1, M8 |
| R3 | Crash before `task_started` is undetected | **Disputed between sources** (D1). Plan treats as NARROWED: the orchestrator appends `task_started` at launch, and claim-first dispatch (F1) would make the claim commit carry it | `docs/durable-execution.md`, `tasks/step4-durable-execution.json` |
| R4 | No atomic multi-file writes | **OPEN (documented limit)**: task-files-before-events ordering makes a crash recoverable, not atomic. Claim commits write both files in one git commit, which is atomic for the claim path only | `docs/durable-execution.md`; `docs/atomic-claim.md` |
| R5 | `events.jsonl` growth | **OPEN, watch only** | Revisit table T5 |
| R6 | Retry of a step that already had an external side effect | **NARROWED**: PR creation covered by P4 once wired; branch push covered by claim semantics. Other side effects rely on `claimSideEffect` (single-process) | `docs/policy.md` section 8 |
| R7 | One night mistaken for long-term reliability | **OPEN**: M7 | `docs/overnight-test-plan.md` |
| R8 | Missed ticks if the runtime is down | **OPEN**: the runner is a scheduled agent job, not a supervisor; reports must read run history, not assume | `docs/overnight-test-plan.md` |
| R9 | Missing original Step 7 items | **OPEN (unknowable from the repo)** | Section 7 |
| R10 | Preview verification for substation is unavailable | **OPEN** (D6): no Vercel integration on that repo; build verified as the substitute | `tasks/step5-substation-tests.json` |
| R11 | Builder harness denials stop work | **MITIGATED by practice**: builders refuse to route around denials; scoped `--permission-mode acceptEdits` + `--allowedTools` worked on retry | `tasks/demo-end-to-end-001.json`, `tasks/step4-durable-execution.json`; `docs/policy.md` section 3 |
| R12 | Cron body drifts from the docs describing it | **OPEN**: the cron body is outside the repo and not covered by tests; this plan could not read it | Section 0, item 6 |

## 4. Deferred technology track (unchanged; no new decisions)

Carried from `docs/roadmap.md`, `docs/architecture.md`, and
`docs/durable-execution.md`. Nothing here is scheduled.

| Item | Trigger | Constraint |
|---|---|---|
| Durable workflow engine (Temporal Cloud first, only after workers leave the VM-CLI model) | A workload crons/records cannot express (multi-day sagas, durable timers, compensation, wide fan-out) | New paid service needs founder approval; self-hosted Temporal and Workflow Development Kit are not a fit (no Docker; steps cannot shell out to `claude`/`gh`) |
| SQLite then Postgres for task state | More than one process writing task state; queries `status.mjs` plus grep cannot answer; log size | Local Postgres is ephemeral; managed Postgres needs founder approval (Supabase free tier pauses after a week idle; Pro is $25/month per the 2026-10-28 research, to be re-checked against current pricing before use) |
| Graphiti knowledge graph (Phase 3) | Both: decision corpus past about 50 to 100 records across projects, AND an agent seen acting on a superseded fact or a repeated grep-proof query class | Trial embedded `falkordblite` first; managed graph DB needs approval |
| Gemini API / Gemini Pro / Perplexity Pro | Founder-installed key plus known quota; founder login plus terms that permit use | None assumed working (verified absent 2026-10-28) |
| Vercel AI SDK (Phase 5) | The dashboard needs its own model calls | Not needed otherwise |

## 5. Follow-up work items (NOT done)

| ID | Item | Owner | Depends on | Status |
|---|---|---|---|---|
| F1 | Wire `scripts/claim.mjs` into runner dispatch: replace the manual startRun-push with claim-first dispatch (`WON` dispatches; `LOST` or throw stops the tick) | **Orchestrator** owns the cron body and the decision to change it (`docs/atomic-claim.md` section 6: "A future cron-body step will replace the manual startRun-push"). A future builder may prepare any supporting repo code or docs on a branch; it must not edit the schedule | M3, M2 | **DONE 2026-10-29.** Milestone M5 (evidence there) |
| F2 | Wire `scripts/pr-recovery.mjs` `adoptPr` into runner PR creation (adopt-before-create) | **Orchestrator** (`docs/crash-pr-recovery.md`: "owned by the orchestrator"); builder support as for F1. Policy section 5 already says only the orchestrator opens PRs | M4 | **DONE 2026-10-29.** Milestone M6 (evidence there) |
| F3 | Overnight cron: remain, pause, or remove | **Orchestrator, morning review. PENDING. This plan does not pre-decide it** | The morning-review evidence | **Recommendation recorded 2026-10-29: REMAIN** (standing runner, silent cheap no-op ticks), per the orchestrator's morning report; the schedule remains in place. F3 stays open only for a future decision to change that, not for the remain/pause/remove question itself. Decision D5 |
| F4 | Reconcile `docs/runner-reliability.md` with P3/P4 outcomes (section 3.1 here does so in the plan only; the source doc is unedited) | A future builder on a docs task, assigned by the orchestrator | none | OPEN, optional |
| F5 | Provide the Step 7 plan document, or confirm it was never written | **Orchestrator / founder** (only they can say where it was meant to live) | none | OPEN. Unblocks M9 |
| F6 | Set the numeric target for repeated-run reliability | **Orchestrator** | F3 | OPEN. Unblocks M7 |

Order recommendation (not a decision): F3 first because M7 hangs on it; F1
before F2 only to keep reviews single-purpose.

## 6. Revisit triggers

When one of these becomes true, the named section is re-opened, not quietly
patched.

| ID | Trigger | Re-open |
|---|---|---|
| T1 | A second worker, parallel tick, or concurrent builder is authorized | Section 3.1 window 1, M3, M5. The race test used local remotes; run a GitHub-server race first. Re-check `docs/policy.md` section 4 (separate worktrees, no shared database tests) and the file-store trigger in T5 |
| T2 | A real crash-after-PR occurs in production use | Section 3.1 window 2, M4, M6. Record the actual `gh pr list` output and whether `adoptPr` adopted correctly; update section 0, item 4 |
| T3 | A new runner failure mode appears (anything the reconciler, preflight, claim, or adoption does not cover; or a preflight pass followed by an auth failure at dispatch) | Section 3.2, `docs/runner-reliability.md`; add a risk row and a test before a fix |
| T4 | The overnight cron's future is decided (D5) | M7, F3, F6. Also edit the stale "removed in the morning report" line's treatment (D5) |
| T5 | A file-store trigger fires: more than one process writes task state; queries beyond grep; `events.jsonl` slow to scan | Section 4, `docs/durable-execution.md` "Triggers to revisit" |
| T6 | A workload needs multi-day sagas, durable timers, or compensation | Section 4, engine row; needs founder approval before any paid service |
| T7 | The Step 7 plan document is supplied | Section 7, M9; re-check every discrepancy in section 8 |
| T8 | The VM is replaced or the claude binary is reinstalled outside preflight | M8, R1, R11 |
| T9 | GitHub changes the `gh pr list --json` shape or `headRefOid` field | M4, M6 |
| T10 | Claude Code version floor changes (pinned 2.1.312) | M2, `scripts/preflight.mjs` `MIN_VERSION` |
| T11 | Substation main unfreezes, or a Vercel integration is connected to it | Step 5 outcome and R10 |
| T12 | A secret is found in a file, log, or report | Stop and report; `AGENTS.md`, `docs/policy.md` section 6 |

## 7. Missing information (labeled, not invented)

1. **Step 7 plan document.** Absent from the repo; the roadmap records it,
   and `tasks/overnight-02.json` (evidence, CAVEAT) says it was checked on
   `origin/main` and the queue branches. This plan has no Step 7 content.
   Consequences:
   - Any Phase 2 item that lived only in Step 7 is missing from the roadmap
     and from this plan.
   - The roadmap's 8 open items are a consolidation of other sources, not a
     copy of Step 7.
   - Milestone ordering in section 2 reflects dependencies in the existing
     code and docs only; a Step 7 priority order, if one existed, is
     unknown.
   - Cannot be planned until it exists: any Step 7 scope, sequencing, owners,
     deadlines, or acceptance criteria.
2. **Cron body text.** Not in the repo, not read by this builder. Its
   step-0 preflight text and the manual startRun-push are known only through
   task records and docs.
3. **Number of repeated runs that counts as "reliable".** No source states
   one (M7, F6).
4. **VM-replacement test procedure.** Only a one-line description exists (M8).
5. **Checkpoint files before long steps.** `docs/architecture.md` lists them
   as part of the strict state protocol; `docs/roadmap.md` notes no source
   describes them as implemented. This plan does not claim them.
6. **Morning-report results.** The verification checklist outcomes live in the
   orchestrator's report, not in the repo.
7. **Policy for who writes the cron-body change** (builder vs orchestrator) is
   inferred from `docs/policy.md` section 1 and the docs' "owned by the
   orchestrator" language, not stated for the cron specifically.
8. **Live `gh` shell-out status of `preflight`.** `docs/runner-reliability.md`
   says the live shell-outs were not verified in its branch;
   `docs/runner-preflight-wiring.md` says they were verified by orchestrator
   runs. Reported by sources, not re-run here.

## 8. Source discrepancies, preserved

For each: what each side says, and which one this plan follows and why.

**D1. Crash before `task_started`.** `docs/durable-execution.md` ("Known
limits") says such a run "is not detected"; the orchestrator appends the
event at launch. `docs/roadmap.md` item 5 repeats it as an open limit.
`tasks/step4-durable-execution.json` lists "including crash-before-task_started"
in acceptance and says interruption detection "no longer depends on a
task_started event existing" and is covered by its own test. *Plan follows:*
the task record for what the reconciler code does (it has a test and
orchestrator review), and the doc for the operational caveat that the
orchestrator should still append `task_started` at launch. Neither source
edited; the roadmap itself flags this for reconciliation.

**D2. `docs/runner-reliability.md` is outdated by P3/P4.** It says the
concurrency mitigation is "NOT implemented" and "analysis only", and that
`pr-adopt` is not wired and has no live evidence. Since it was written,
`claim.mjs` (PR #20) and `pr-recovery.mjs` (PR #21) exist. *Plan follows:*
the later task records and design docs for code state, the reliability doc
for live-runner state (nothing wired). Section 3.1. *Dated note
2026-10-29:* the live-runner half is resolved: both guards are now wired (M5,
M6); the reliability doc remains unedited and is still outdated on that point.

**D3. Preflight "not yet wired".** `docs/runner-reliability.md` says
preflight is not wired into the runner or cron. `docs/runner-preflight-wiring.md`
gives the step-0 text as "proposed; the orchestrator applies it after merge."
The morning-directive outcome says it is step 0 of the cron body. *Plan
follows:* the directive outcome as the most recent, but marks it unverified by
the builder (M2).

**D4. How strong is the claim lock?** `docs/runner-reliability.md`: "best-effort
lock, not a transactional one." `docs/atomic-claim.md`: the push is a
compare-and-swap and the one atomic operation. *Plan follows:*
`docs/atomic-claim.md`, because it is tested (24 race rounds), with the
limitation that it is tested on local remotes only. The older text described
a check-then-push design, which `atomic-claim.md` also says is not atomic on
its own.

**D5. Overnight cron lifetime.** `docs/overnight-test-plan.md` says the job
"is removed in the morning report." The brief says remain, pause, or remove
is the orchestrator's morning-review decision. *Plan follows:* the brief; the
test-plan line is a pre-run plan. No outcome is stated here. *Dated note
2026-10-29:* the orchestrator's morning-report recommendation is REMAIN
(standing runner); the schedule remains in place (F3). The test-plan line is
therefore stale, and `docs/overnight-test-plan.md` is unedited.

**D6. Vercel previews.** `docs/architecture.md` lists "Vercel preview
deployments via the existing GitHub–Vercel integration" and
`docs/capability-matrix.md` lists preview deploys, verified on the torus
project. `tasks/step5-substation-tests.json` found no preview and no
integration on `substation-rush-hour` (checked twice). *Plan follows:* the
Step 5 record for substation specifically; the architecture claim holds only
for repos where the integration is connected (torus was the verified one).

**D7. Step 6 status.** `docs/roadmap.md` says Step 6 is "not claimed done
here" and shows Step 5 PR "not merged by design." Task records show
overnight-01/02/03 completed and merged. *Plan follows:* task records for the
three queue tasks. It does not call Step 6 passed overall, because the
morning-report checklist results are not in the repo (section 7, item 6) and
`overnight-test-plan.md` limits what one night proves.

**D8. Workflow engine name and timing.** `docs/architecture.md` and
`docs/durable-execution.md` say "Vercel Workflow SDK" in places and "Workflow
Development Kit" in others; the architecture doc says the engine decision is
"deferred to Phase 2", while `docs/roadmap.md` and the later research keep it
deferred with a trigger. *Plan follows:* the roadmap and the research findings
(deferred, trigger-based, current name Workflow Development Kit).

**D9. Who wires claim and adoption.** The task records say wiring is
"deferred to the Phase 2 plan as follow-up"; the docs say it is an
orchestrator step. *Plan follows:* both: the work item is assigned here
(F1, F2), with the orchestrator as owner of the cron body.

**D10. Test counts.** Records cite 6 (demo), 22 (Step 4), 24 (overnight), 51
total / 50 pass (preflight branch), 55 / 54 (claim branch), 61 pass + 1 skip
(adoption branch). These are different branches at different times, not a
conflict. Current main-based count on this branch: 62 tests, 61 pass, 1
skip. *Plan follows:* the per-record numbers for their milestones, and 62 /
61 / 0 / 1 as the live baseline.

**D11. Step 5 stale checkout correction.** `tasks/step5-substation-tests.json`
records its own correction: the original claim about the substation `test`
script came from a stale local checkout; acceptance still met. *Plan
follows:* the correction.

**D12. PR delivery wording.** `tasks/phase2-plan.json` acceptance says work
lands on `phase2/plan` "via PR". The builder brief for this task says not to
open a PR. *Plan follows:* the brief; opening the PR is the orchestrator's
step (`docs/policy.md` section 5).

**D13. Roadmap's "policy.md not re-read".** `docs/roadmap.md` item 2 says
`docs/policy.md` was not re-read for it. This plan read `docs/policy.md` for
the PR, retry, isolation, and denial rules; it did not re-verify the roadmap's
research figures (pricing, quotas), which stay as of 2026-10-28.

## 9. Source map

| Plan section | Source docs | Task records |
|---|---|---|
| 0 Honesty boundaries | `docs/roadmap.md` (sourcing note), `docs/atomic-claim.md` s5, `docs/crash-pr-recovery.md`, `docs/overnight-test-plan.md`, `docs/policy.md` s1, s5 | `overnight-02`, `phase2-plan`, `phase2-atomic-claim`, `phase2-crash-pr-recovery` |
| 1 Where things stand | `docs/interruption-recovery-proof.md`, `docs/roadmap.md` (context) | `demo-end-to-end-001`, `step4-durable-execution`, `step5-substation-tests`, `overnight-01/02/03/blocked`, `phase2-wire-preflight`, `phase2-atomic-claim`, `phase2-crash-pr-recovery` |
| 2 M0 | `docs/durable-execution.md`, `tasks/schema.md` | `step4-durable-execution` |
| 2 M1 | `docs/overnight-test-plan.md`, `docs/interruption-recovery-proof.md` | `overnight-01/02/03`, `overnight-blocked` |
| 2 M2 | `docs/runner-preflight-wiring.md`, `docs/runner-reliability.md` s3 | `phase2-wire-preflight` |
| 2 M3 | `docs/atomic-claim.md` | `phase2-atomic-claim` |
| 2 M4 | `docs/crash-pr-recovery.md`, `docs/runner-reliability.md` s2 | `phase2-crash-pr-recovery` |
| 2 M5, M6 | `docs/atomic-claim.md` s6, `docs/crash-pr-recovery.md` "Runner usage" | `phase2-atomic-claim`, `phase2-crash-pr-recovery` |
| 2 M7, M8 | `docs/overnight-test-plan.md` "Known limits", `docs/roadmap.md` items 6, 7 | `overnight-01/02/03` |
| 2 M9 | `docs/roadmap.md` (sourcing note) | `overnight-02` |
| 3.1 Residual windows | `docs/runner-reliability.md` s1, s2, `docs/atomic-claim.md` s2, s3, `docs/crash-pr-recovery.md` | `phase2-atomic-claim`, `phase2-crash-pr-recovery` |
| 3.2 Other risks | `docs/durable-execution.md`, `docs/runner-preflight-wiring.md`, `docs/overnight-test-plan.md`, `docs/policy.md` s3, s7, s8, `docs/capability-matrix.md` | `step4-durable-execution`, `step5-substation-tests`, `demo-end-to-end-001` |
| 4 Deferred technology | `docs/architecture.md`, `docs/roadmap.md` items 2 to 4, 8, `docs/durable-execution.md`, `docs/capability-matrix.md` | none |
| 5 Follow-ups | `docs/atomic-claim.md` s6, `docs/crash-pr-recovery.md`, `docs/overnight-test-plan.md`, `docs/policy.md` s1, s5 | `phase2-atomic-claim`, `phase2-crash-pr-recovery`, `phase2-plan` |
| 6 Revisit triggers | `docs/durable-execution.md` "Triggers to revisit", `docs/roadmap.md` item 3, `docs/architecture.md`, `docs/policy.md` s4 | `phase2-atomic-claim`, `phase2-crash-pr-recovery`, `step5-substation-tests` |
| 7 Missing information | `docs/roadmap.md`, `docs/architecture.md`, `docs/runner-reliability.md`, `docs/runner-preflight-wiring.md` | `overnight-02`, `phase2-plan` |
| 8 Discrepancies | all docs listed above | `step4-durable-execution`, `step5-substation-tests`, `phase2-plan`, `overnight-02` |

Coverage check for the orchestrator: all nine docs named in the task
(`roadmap`, `architecture`, `capability-matrix`, `durable-execution`,
`overnight-test-plan`, `runner-reliability`, `runner-preflight-wiring`,
`atomic-claim`, `crash-pr-recovery`) appear in the map, as do `policy.md` and
`interruption-recovery-proof.md` (read as extra context) and all 11 task
records (`demo-end-to-end-001`, `overnight-01/02/03`, `overnight-blocked`,
`phase2-atomic-claim`, `phase2-crash-pr-recovery`, `phase2-plan`,
`phase2-wire-preflight`, `step4-durable-execution`, `step5-substation-tests`).
