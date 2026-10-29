# Durable Execution: Evaluation and Decision

## Decision

**JSON task records in git + an append-only JSONL event log + a task state
machine + a reconciler.** No database, no workflow engine, no new service.

Implemented in `scripts/task-state.mjs`, `scripts/events.mjs`, and
`scripts/reconcile.mjs`. Record format and rules: `tasks/schema.md`.

## Problem

Genesis work must survive interruption: a builder session dies, the VM
restarts, a run is half done. After any of these we must be able to say
what happened, retry safely a bounded number of times, and never repeat a
side effect (open a second PR, post twice).

## Constraints that decide this

1. **Single orchestrator writer.** Only the orchestrator (and the
   reconciler, run by it) writes task records. Builders never do. There is
   no concurrent-writer problem to solve.
2. **Home persists; `/var` and the VM do not.** State must live in the
   repo checkout under home (and in git). Anything that keeps state in
   `/var` or a local server process is lost on VM replacement.
3. **No Docker.** Rules out self-hosted engines and local stacks that ship
   as containers (Temporal dev server, Supabase local stack).
4. **No new paid services without approval** (`docs/policy.md`), and no
   new infrastructure without a recorded decision (`AGENTS.md`).
5. **Builders are CLI sessions, not SDK workers.** An engine whose
   durability comes from running your code inside its worker/SDK runtime
   does not fit a `claude` CLI process the orchestrator launches and
   may lose.

## Evaluation

| Option | Verdict | Reason |
|---|---|---|
| SQLite | Reject for now | Real durability and transactions, but the database file is binary: no readable diffs, poor merge behaviour in git, and a stray copy on a non-persistent path is silent data loss. Its main benefit (concurrent-safe writes, queries) addresses needs we do not have with one writer. Needs a driver or Node's experimental `node:sqlite`, which conflicts with "no dependencies". |
| Managed PostgreSQL (Supabase) | Reject | A new external service and credential to hold, with network failure modes, for state that is a few dozen small records. Needs approval as a paid/new service and a secret, and the local stack needs Docker, which the VM lacks. The only local Postgres is outside home and is wiped on restart. Violates constraints 2, 3, and 4. |
| Temporal | Reject | Needs a server cluster (Docker or hosted, paid) plus worker processes using its SDK. Builders are CLI sessions, so there is no worker to make deterministic or replayable. Heavy infrastructure for a single-writer system. |
| Vercel Workflow SDK (Workflow Development Kit) | Reject | Durability comes from running steps inside Vercel's runtime, which ties work to a Vercel deployment and its billing, and expects code-defined steps run as workers. Our long-running unit is an external CLI session. Production deploys are also a denied operation without founder approval (`docs/policy.md` section 3). |
| Versioned JSON + JSONL in git | **Adopt** | Lives in home and in git, so it survives VM loss. Human-readable, diffable, greppable, reviewable in a PR. No dependency, service, or cost. The single-writer rule makes plain files safe. Durability gaps (no transactions, no locking) are covered by the append-only log, per-run ids, idempotency keys, and an idempotent reconciler. |

## How it provides durability

- **State machine.** Illegal transitions throw. `completed` is terminal.
  `in_progress -> queued` is only allowed through reconciliation and
  consumes a retry attempt.
- **Run ids.** `<task-id>/run-<attempt>-<ISO timestamp>`: stable, unique,
  and referenced by every event for that run.
- **Event log.** `events.jsonl` is append-only. Events are the source of
  truth for "did this run finish?".
- **Reconciler.** An `in_progress` task whose latest run has `task_started`
  but no `task_completed`/`task_failed`/`task_blocked` was interrupted. It
  is re-queued if `attempts < 3`, otherwise blocked as "retry budget
  exhausted". Re-running it changes nothing: interrupted runs already have
  a `run_interrupted` event.
- **Idempotency keys.** Before a side effect, `claimSideEffect(task, key)`.
  If it returns false, return the existing result instead of redoing it.

## Known limits

- No atomic multi-file writes. The reconciler writes task files before
  appending events, so a crash between the two leaves the task already
  recovered, never stuck.
- A run that crashes before its `task_started` event is not detected.
  The orchestrator appends `task_started` when it launches a run.
- `events.jsonl` grows without bound. It is small at current volume.
- `claimSideEffect` protects only callers that use it, and only one
  orchestrator process at a time.

## Triggers to revisit

Reopen this decision (and record the new one here and in
`docs/architecture.md`) when any of these becomes true:

- **Concurrent writers.** More than one process must write task state at
  once (parallel orchestrators, builders updating records). Move to SQLite
  first, then Postgres if writers span machines.
- **Query needs beyond grep.** Routine questions such as "all blocked tasks
  older than N days by project" that `status.mjs` plus grep cannot answer
  cheaply. Move to SQLite.
- **Multi-day sagas.** Workflows that must wait days on timers or external
  events, compensate on failure, or fan out across many steps with
  durable timers. Evaluate Temporal or the Workflow SDK then.
- **Log size.** `events.jsonl` becomes slow to scan or painful to review in
  diffs; add rotation by archiving closed months, never by rewriting.
