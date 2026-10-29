# Architecture — Genesis Phase 1 (and what comes after)

## Phase 1 decision: Muse-native orchestration, no new engine

Phase 1 runs entirely on capabilities already verified in the Phase 0 audit
(see `docs/capability-matrix.md`):

- **Orchestration:** Muse's own scheduled crons, event hooks, child agents,
  goals/tracking, and GitHub issues/PRs. Task state lives in `tasks/*.json`
  in this repo (versioned, auditable, recoverable from git history).
- **Implementation:** Claude Code CLI, spawned per task on isolated branches.
- **Validation:** the project's own test/build/lint/security commands,
  re-run by the orchestrator — never trusted from a builder report alone.
- **Delivery:** GitHub pull requests + Vercel preview deployments via the
  existing GitHub–Vercel integration (deploy workflows already proven on
  substation-rush-hour).
- **Knowledge:** versioned Markdown + structured JSON in this repo.
  Searchable, diffable, and already the workflow the founder uses.

## Deliberately deferred (with the trigger that earns each one)

- **Durable workflow engine (Temporal vs Vercel Workflow SDK):** deferred to
  Phase 2. Muse-native crons/hooks/subagents already provide scheduling,
  retries, checkpoints (git + task records), and recovery. A dedicated engine
  earns adoption only when a workload appears that crons/hooks cannot express
  (e.g., long-running multi-day workflows with complex sagas) — a research
  comparison is running to make that call on evidence, not hype.
- **Knowledge graph (Graphiti):** deferred to Phase 3. Markdown + structured
  records cover facts, decisions, and history today. A graph earns adoption
  only when retrieval across projects measurably fails on flat records.
- **Postgres for task state:** deferred. Local Postgres on this VM is
  ephemeral (wiped by VM replacements) and there is no Docker, so a local
  database is currently the *least* durable option, not the most. Task state
  in git is durable today. A managed Postgres earns adoption when query or
  scale needs exceed files — not before.
- **Gemini API / browser subscriptions:** not wired in Phase 1. No Gemini,
  Google, or Perplexity API key is installed in this environment (verified
  2026-10-28), and the Pro subscriptions are browser-only with no API.
  Gemini API use waits for a key installed through the secure flow plus a
  known quota; browser use of the Pro subscriptions waits for a login the
  founder completes and terms that permit it. Neither is assumed working.

## Tradeoffs accepted in Phase 1

- **Files over a database:** simpler, versioned, and durable here — but no
  concurrent-write safety. Mitigation: one orchestrator writes task records;
  builders never edit them directly.
- **Crons/hooks over a workflow engine:** less expressive (no sagas, no
  distributed transactions) — but zero new infrastructure, zero new cost,
  and already proven in this environment.
- **Single orchestrator:** Muse is a single point of coordination, which is
  a bottleneck in theory — but the founder's workload is a handful of repos
  and one builder stream, so coordination cost is far below engine cost.
- **GitHub as the system of record for code, git as the record for tasks:**
  two stores, but with a clean split (code vs. task state) and no duplicated
  facts between them.

## Invariants (hold across all phases)

1. Verification is independent of generation. Whoever writes code never
   certifies it.
2. Every state change is traceable: task record → branch → PR → checks →
   preview → merge → memory update.
3. No silent retries: bounded retries with backoff, then a recorded blocked
   task and unrelated work continues.
4. No secret ever enters a file, a log, or a report.
5. Production is a deliberate act with checks and rollback, never a side
   effect of a routine task.
