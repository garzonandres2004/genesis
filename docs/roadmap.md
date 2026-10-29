# Roadmap — remaining Phase 2 work

One list for the next phase to start from. Every item is **OPEN** unless it
says otherwise; nothing here is claimed done without a source that shows it.

## Sourcing note

- **The Step 7 plan is not in this repo.** The only mentions of it are the
  overnight-02 task record and `docs/overnight-test-plan.md`, which refer to
  it without containing it. This document therefore does not reproduce
  Step 7; it consolidates what the repo sources below say is deferred or
  still to be proven. If the real Step 7 plan has items not listed here,
  they are missing from this file and must be added from that plan.
- Sources read: `docs/architecture.md` (deferred items; Phase 2/3 research
  findings; confirmed decisions), `docs/durable-execution.md` (known limits,
  triggers to revisit), `docs/overnight-test-plan.md` (known limits),
  `docs/capability-matrix.md` (Phase 2+ candidates), and
  `tasks/step4-durable-execution.json` / `tasks/step5-substation-tests.json`
  for the status of earlier steps.
- Status is as of this branch. Dates in the sources are 2026-10-28.

## Context: already done (not remaining work)

- Step 4, minimum durable execution: **done**. Task records in git, event
  log, state machine, reconciler. Merged as PR #8 per
  `tasks/step4-durable-execution.json`; decision in `docs/durable-execution.md`.
- Step 5, substation test wiring: **done** (PR opened, not merged by design;
  substation main is frozen) per `tasks/step5-substation-tests.json`.
- Step 6, overnight test: **not claimed done here.** Its outcome is recorded
  by the orchestrator in the task records and morning report, not in this file.

## Open items

### 1. Keep Phase 2 Muse-native under the strict state protocol — OPEN (ongoing)

- **What:** one record per task, an explicit status machine, idempotency keys
  on every side effect, an append-only event log, checkpoint files before any
  long step (`docs/architecture.md`, "Decisions confirmed by that research").
- **Status:** most of the protocol exists (Step 4). Checkpoint files before
  long steps are not described as implemented in any source read; treat that
  part as open.
- **Dependency:** none beyond the above. Stays in force until an engine
  trigger (item 2) fires.

### 2. Durable workflow engine (Temporal vs Workflow Development Kit) — OPEN, deferred

- **Trigger:** a workload that crons/hooks/task records cannot express, such
  as multi-day sagas with durable timers, compensation on failure, or wide
  fan-out (`docs/architecture.md`; `docs/durable-execution.md` "Multi-day sagas").
- **Dependency:** if an engine is needed, Temporal Cloud comes first, and only
  after workers move off the VM-CLI model. Temporal Cloud is a new paid
  service and needs founder approval (`docs/policy.md` governs; not re-read
  for this document). Budget from the current pricing page, not old listings.
- **Not a fit now:** self-hosted Temporal (no Docker, VM-replaced host);
  Workflow Development Kit (steps cannot shell out to `claude`/`gh`).
- **Later possibility:** Workflow Development Kit for durable jobs inside the
  command-center app itself, if that app exists.

### 3. Revisit triggers for the file-based state store — OPEN (watch only)

No action until a trigger fires (`docs/durable-execution.md`):

| Trigger | Move to |
|---|---|
| More than one process must write task state at once | SQLite first, then Postgres if writers span machines |
| Routine queries that `status.mjs` plus grep cannot answer cheaply | SQLite |
| `events.jsonl` slow to scan or painful to review in diffs | Rotation by archiving closed months, never rewriting |

### 4. Managed Postgres for task state — OPEN, deferred

- **Trigger:** query or scale needs exceed files (`docs/architecture.md`).
- **Dependency:** founder approval of a new paid service. The existing
  Supabase free tier pauses after 1 week of inactivity, which would break
  unattended orchestration; Pro ($25/month) is the honest fix if Postgres
  ever holds core state. Local Postgres is ephemeral and is not an option.

### 5. Known gaps in the durable layer — OPEN (documented limits)

From `docs/durable-execution.md`, "Known limits". None has a scheduled fix;
each is recorded so it is not mistaken for solved:

- No atomic multi-file writes (ordering makes a crash recoverable, not atomic).
- A run that crashes before its `task_started` event is not detected by the
  reconciler unless the orchestrator appends that event at launch.
- `claimSideEffect` protects only callers that use it, and only one
  orchestrator process at a time.
- `events.jsonl` grows without bound (see item 3 for the trigger).

Note: `tasks/step4-durable-execution.json` lists crash-before-`task_started`
detection as covered by its own test, while `docs/durable-execution.md` still
lists it as a limit. The two sources disagree; reconcile them when this item
is next touched.

### 6. Prove reliability beyond one night — OPEN

- **Source:** `docs/overnight-test-plan.md`, "Known limits".
- One night shows the recovery loop works, not that it holds for months;
  that needs repeated runs.
- **Dependency:** the outcome of the first overnight run.

### 7. VM-replacement recovery test — OPEN

- **Source:** `docs/overnight-test-plan.md`, "Known limits".
- The controlled interruption kills a builder process; it does not simulate a
  VM replacement (reinstall builder binary, re-fetch state from git). That is
  a separate test to run deliberately.
- **Dependency:** none stated; run deliberately and only claim it once run.

### 8. Gemini API and browser subscriptions — OPEN, blocked on the founder

- **Gemini API:** needs a key installed through the secure flow plus a known
  quota. No key was present at audit (2026-10-28). Not assumed working.
- **Gemini Pro / Perplexity Pro (browser):** need a login the founder
  completes and terms that permit this use. No API; limits unverified.
- **Source:** `docs/architecture.md` (deferred list), `docs/capability-matrix.md`.

## Beyond Phase 2 (recorded for ordering, not Phase 2 work)

- **Knowledge graph (Graphiti) — Phase 3, OPEN, deferred.** Conjunctive
  trigger, both required: (1) decision corpus past roughly 50–100 records
  across projects, AND (2) an agent observed acting on a superseded fact, or
  a repeated query class grep cannot answer (temporal "what was true when" or
  dependency traversal). If triggered, trial embedded `falkordblite` first; a
  managed graph database only with paid-service approval. Until then Phase 3
  stays Markdown-first with status labels (verified / hypothesis /
  superseded, each dated and sourced).
- **Vercel AI SDK — Phase 5, OPEN.** Only if the dashboard needs its own
  model calls; intents can otherwise go through GitHub issues.
