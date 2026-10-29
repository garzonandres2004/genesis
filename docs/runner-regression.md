# Runner regression coverage

Written 2026-10-29 for the stabilization gate. It maps the eight runner
behaviors that must not regress to the evidence that covers each. Every row
is labeled **FIXTURE** (a test in `scripts/*.test.mjs` that runs in `npm test`
against temp repos and stub `gh`/`claude`) or **LIVE** (a recorded event on
the standing runner). A row never claims more than its evidence shows.

## Boundary

This gate does **not** stage failures against the live runner. Live failure
modes (builder failure, verification failure, retry exhaustion on a real task)
are not triggered on purpose: staging one would disrupt the standing runner
and its real queue, and is out of scope. Those rows are covered by fixtures
for the code, plus prose in the cron body that this repo cannot test.

There is no runner simulator and no tick engine in the repo. The fixture
tests call the real scripts (`preflight.mjs`, `claim.mjs`, `pr-recovery.mjs`,
`reconcile.mjs`) as child processes, or the pure state functions. The
decisions the cron body makes between those calls (for example "the builder
failed, so block the task") are prose and are not tested here.

## Coverage table

| # | Behavior | Label | Coverage | Not covered |
|---|---|---|---|---|
| 1 | Preflight failure | FIXTURE | `runner-orchestration.test.mjs` (a2) "preflight failure stops before any claim, dispatch or PR"; `preflight.test.mjs` scenarios (c) reinstall fails, (d) no auth markers, (e) repo unavailable, "recover-once guard never recommends a second reinstall" | A live preflight failure was never staged. The 00:14 Oct 29 restart was a live preflight pass that reinstalled the missing binary once (LIVE precedent, not a failure) |
| 2 | Claim loss | FIXTURE + LIVE | FIXTURE: `runner-orchestration.test.mjs` (b) "second claim while the first is running => LOST, second dispatch never invoked"; `claim.test.mjs` "claim when the branch already exists => LOST", "diverged existing branch => LOST", "two-worker race ... exactly one wins"; `claim-cli.test.mjs` "existing branch => exit 0, LOST". LIVE: second claim on `runner/live-test-01` returned `LOST`/`branch_exists`, remote tip `4073625` unchanged (PR #25 era) | Race on a real GitHub server (T1, not run). The race test is 3 rounds per run (see correction below) |
| 3 | Builder failure | FIXTURE (code half only) | `reconcile.test.mjs` "failed run (builder or verification failure) => outcome failed, blocked with a reason, never re-queued by reconcile"; also `task-state.test.mjs` "finishRun sets the outcome" (`failed`) and the invalid-transition tests | The decision "builder failed, so record `task_failed` and block with a reason" lives only in the cron body. Not automatable here and not faked. No live failure was staged |
| 4 | Verification failure | FIXTURE (code half only) | Same test as row 3: the state path is identical (run outcome `failed`, `in_progress -> blocked`, blocker string kept, reconcile ignores it). `reconcile.test.mjs` "runs with a terminal event are not interrupted" | Running tests, reading the diff and the secret scan are orchestrator steps, not code. "No PR after a failed verification" is cron-body prose with no test. No live failure staged |
| 5 | PR adoption | FIXTURE + LIVE | FIXTURE: `runner-orchestration.test.mjs` (c) crash after create, create count stays 1; (e) several open PRs => first + anomaly, create never invoked; (e2) gh failure at adopt => exit 1, create never invoked; `adopt-cli.test.mjs` (8 cases); `pr-recovery.test.mjs`; `pr-adopt.test.mjs`. LIVE: scratch PR #26 on `scratch/adopt-test` returned the URL, `headSha` `aa78145012a03557a01d7ee88c4f67eff8e1dd70`, and `anomaly: null` (closed unmerged); adopt `null` on PR #25 led to exactly one PR created | A live crash-after-create and a live anomaly were not staged |
| 6 | Retry exhaustion | FIXTURE | `reconcile.test.mjs` "retry exhaustion: attempts = 3 blocks the task with retry_exhausted"; "retry exhaustion end to end: attempt 3 interrupted => blocked, a further reconcile is a no-op" (three real `startRun` + reconcile cycles, attempts 1 and 2 re-queue, 3 blocks with a `retry_exhausted` event, a following reconcile changes nothing, `startRun` on the blocked task throws) | Exhaustion on a real task never happened and is not staged. Reconcile blocks on exhaustion only for interrupted runs; what happens to a `failed` run is the cron-body decision in rows 3 and 4 |
| 7 | Interrupted-run recovery | FIXTURE + LIVE precedent | FIXTURE: `runner-orchestration.test.mjs` (d) "kill mid-run: real reconcile marks interrupted + re-queues once; retry completes" (SIGKILL, real `reconcile.mjs`, second reconcile no-op, retry on `task/t-1-attempt-2`); `reconcile.test.mjs` (re-queue, crash before `task_started`, restart recovery, append-only log). LIVE precedent: `overnight-03` kill, reconcile, retry (`docs/interruption-recovery-proof.md`; old manual path, before claim-first wiring) | No interruption has happened under the current claim-first body. VM replacement is untested (`docs/runner-operations.md` section 7) |
| 8 | Empty-queue behavior | LIVE only | LIVE: the 07:46 MDT tick on 2026-10-29 ran the new body as a silent no-op, and later ticks stayed silent with 0 consecutive failures (`docs/runner-operations.md` section 5 and Evidence) | **Not covered by any test.** No queue selector exists in code: the "lowest queued id first" rule and "none queued means no-op" are cron-body prose (`scripts/status.mjs` only prints the board). A fixture would invent the thing it tests, so none was written |

## Corrections found while verifying the inputs

- **Race rounds.** The orchestrator brief and the plan cite "24 rounds."
  `claim.test.mjs` in the repo runs **3 rounds per execution** (the test title
  ends "(x3)"). `docs/phase-2-plan.md` M3 describes 24 as a cumulative total
  across builder and orchestrator runs, so the 24 is a history of runs, not a
  loop in the suite. This table cites the 3-round test and does not repeat 24
  as a property of the suite. The plan's wording was left as is.
- **Row 2 simultaneity.** Orchestration case (b) is sequential; only the
  `claim.test.mjs` race exercises simultaneous pushes.
- **Live SHAs.** `4073625` and `aa78145` both resolve as commits in the repo.
  The tick times and the check status are from the recorded evidence in
  `docs/runner-operations.md`; this builder cannot read cron run records.

## Other notes (source docs not edited)

- `docs/runner-reliability.md` still describes the pre-wiring runner and
  says `pr-adopt.mjs` returns the first of several PRs; the live rule is the
  four-case adopt. Tracked as F4 in `docs/phase-2-plan.md`.
- `docs/policy.md` section 7 says attempts back off; no code implements
  backoff. Not a regression-table item, listed so nobody assumes it is tested.

- Resolved 2026-10-29 (M10-01 / F4): `docs/runner-reliability.md` was
  reconciled with the wired runner and `docs/policy.md` section 7 now states
  that no backoff exists. The two notes above are kept as written.

## How to run

`npm test` runs everything above. Baseline on main was 81 pass, 0 fail,
1 skipped (the pre-existing root skip). With this gate's two new tests:
83 pass, 0 fail, 1 skipped.
