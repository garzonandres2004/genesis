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

## Phase 2/3 research findings (2026-10-28, from current official docs)

- **Temporal:** self-hosting is the worst fit here (needs server processes +
  Postgres on a Docker-less, VM-replaced host). Temporal Cloud is pay-as-you-go
  with no base fee ($50 per million Actions, $150 starter credits, card
  required at signup), but it requires rewriting orchestration as SDK
  workflows plus persistent workers — and it cannot drive Muse/Claude Code
  CLI sessions. Old $100/month Essentials pricing was superseded in
  September 2026; budget from the current pricing page, not old listings.
- **Vercel Workflow SDK is now Workflow Development Kit:** open source
  (Apache-2.0), public beta since October 2025 (useworkflow.dev).
  Vercel-hosted execution is metered (Hobby: 50,000 events/month); steps run
  sandboxed without Node.js modules, so they cannot shell out to the
  `claude`/`gh` CLIs. Poor Phase 2 engine for this architecture; possible
  fit later for durable jobs inside the command-center app itself.
- **Vercel AI SDK:** a free model-calling library, not durable execution
  and not an agent orchestrator. Not needed until Phase 5, and only if the
  dashboard itself needs its own model calls (intents can otherwise go
  through GitHub issues for Muse's crons to pick up).
- **Graphiti:** needs a graph database (Neo4j, FalkorDB, or Neptune; Kuzu
  is deprecated) plus an LLM/embeddings provider (Gemini qualifies, quota
  unknown). The only zero-server path is embedded `falkordblite` (trial
  only). Highest complexity-to-payoff ratio at solo-founder scale.
- **Postgres:** durable means managed, not local. The existing Supabase
  projects are the zero-new-service option, but the free tier pauses after
  1 week of inactivity — which breaks unattended orchestration if core
  state lives there. Pro ($25/month) is the honest fix if Postgres ever
  holds core state, and that needs founder approval as a new paid service.

## Decisions confirmed by that research

- **Phase 2 stays Muse-native** under a strict state protocol: one record
  per task, an explicit status machine, idempotency keys on every side
  effect, an append-only event log, and checkpoint files before any long
  step. This already satisfies the acceptance criteria (recover from
  interruption, retry without duplicating side effects, continue when
  blocked, preserve context between sessions) at solo-founder scale.
  Step-level replay and mid-run signals — the engines' real advantages —
  are not yet needed. If scale later forces an engine, Temporal Cloud
  comes first, and only after workers move off the VM-CLI model.
- **Phase 3 stays Markdown-first, git-backed,** with strict status labels
  (verified / hypothesis / superseded, each dated and sourced).
- **Graphiti trigger (conjunctive, both required):** (1) the decision
  corpus grows past roughly 50–100 records across projects, AND (2) either
  an agent is observed acting on a superseded fact, or a repeated query
  class appears that grep cannot answer (temporal "what was true when" or
  dependency-traversal queries). If triggered: trial `falkordblite`
  embedded first; a managed graph database only with paid-service approval.
