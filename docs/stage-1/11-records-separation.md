# 11 — Separation between project records and execution records

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 11 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-14 (full proposal below), F-16, F-06.

## Purpose

Keep records about *what the project is and what has been decided and
authorized* separate from records about *what execution did*, so that each
has one authority, facts are not duplicated between them, and changing one
can never silently change the other.

Register ADR-01 ("Proposed design direction") separates logical records "by
authority and purpose": project record; authorization record; execution
record ("Runner-owned task state and events"); evidence record; global
knowledge. Constraints: "Runner remains the execution-state authority";
"Muse must not become a competing task database"; "SIE must not introduce a
separate execution database or daemon"; "Do not create a second task database
merely to solve project-context persistence."

## Scope

**Covers:**
- Logical separation rules between record classes.
- The F-14 proposal: where project records live, in what format, owned by
  whom.

**Does not cover:**
- How Runner tasks reference project/authorization records (ADR-03; F-16
  Open; Stage 2 design).
- Any change to execution records or Runner. "No Runner changes are
  authorized" (ADR-03).
- Creating any directory or record. Stage 1 under this authorization is spec
  work only.

## Current state (observed in this repo)

- Execution records: `tasks/*.json` (one per task) and `events.jsonl`
  (append-only event log), written only by the orchestrator and the
  reconciler (`tasks/schema.md`). Phase 1 architecture keeps task state "in
  `tasks/*.json` in this repo (versioned, auditable, recoverable from git
  history)" (`docs/architecture.md`).
- Knowledge: "versioned Markdown + structured JSON in this repo"
  (`docs/architecture.md`).
- No project-record, decision-record or authorization-record area exists in
  this repo. The canonical Register and the Stage 1 Brief are held outside it
  (see `README.md`).

## Requirements

- **RS-1 Distinct record classes.** Project, authorization, execution,
  evidence and global knowledge records are distinct classes with distinct
  owners (ADR-01; spec 08 ownership table). *Test:* each record belongs to
  exactly one class.
- **RS-2 Single authority per fact.** Each fact has one authoritative record.
  Task status lives only in execution records; decisions only in decision
  records; authorizations only in authorization records. Other records
  reference, not copy. Repo `docs/architecture.md` already holds this for code
  vs. task state ("no duplicated facts between them"). *Test:* no project
  record states a task's current status as its own field.
- **RS-3 References are by stable identifier and version.** Cross-class links
  use permanent identifiers (task id, run id, decision id, authorization id,
  commit SHA), and name a version where the target can change (spec 07 CF-8).
- **RS-4 Separate write paths.** Project-record changes never modify
  execution records, and execution-record changes never modify project
  records. Separate writers per spec 08/09. *Test:* no single change touches
  both a project-record path and `tasks/` or `events.jsonl`, unless an
  authorization names both.
- **RS-5 Evidence reconciliation vs execution reconciliation.** Reading
  execution records to compare with evidence is read-only; changing task
  state, requeueing, adopting work or modifying events is execution
  reconciliation and needs separate authorization (Register CR-06).
- **RS-6 No second execution store.** Project-record storage must not hold
  task state, queues or claims (ADR-01; D5 "Do not assume ... second state
  database").
- **RS-7 Durable and recoverable.** Both classes survive session end and VM
  replacement (spec 01 PI-6). Repo `docs/architecture.md`: local Postgres on
  this VM is wiped by VM replacement; git-backed files are durable here.
- **RS-8 Auditable history.** "Authorization and decision history must be
  auditable" (ADR-01): every change to a project, decision or authorization
  record is attributable and preserved (spec 08 OA-3, OA-4).
- **RS-9 Global knowledge stored apart from project records.** Global
  knowledge is not stored inside any project's record area (ADR-01; specs
  04–05).

## F-14 — Project-record storage

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-14 "Project-record storage". Recommended default: "Decide
  after Stage V". Required before: Stage 1 implementation. Status: Open
  (Register §5). ADR-01 status Unresolved: "The physical storage location
  remains undecided."
- **Timing:** Stage V is complete (Register, Stage 1 amendment entry
  criteria). Nothing is created until F-14 is decided and its implementation
  is authorized.

### Proposed location

In the Genesis repository (`garzonandres2004/genesis`), in a top-level area
separate from execution records:

```
records/
  projects/
    <project-id>/
      project.md          # identity and persistent context (spec 01)
      decisions/          # one file per decision (spec 02)
      authorizations/     # one file per authorization (spec 03)
      evidence/           # evidence reference index (spec 06)
      knowledge/          # project-specific knowledge and lessons (spec 04)
  global-knowledge/       # promoted global items only (spec 05)
tasks/                    # unchanged: execution records (Runner)
events.jsonl              # unchanged: execution event log (Runner)
```

Path names are illustrative of the separation; final names belong to the
implementation step once F-14 is decided. One project's area holds only that
project's records (spec 04 PK-3).

### Proposed format

- Markdown with a fixed header block (spec 07 CF-1: status, owner, version,
  last review date, supporting decision, superseded, unresolved) and the
  record-type fields from specs 01–06.
- One record per file where records are amended independently (decisions,
  authorizations), so diffs stay small and reviewable.
- Git history is the audit trail. Amendments are new commits; history is
  never rewritten (spec 08 OA-4). Evidence entries are append-only (spec 06
  EV-1).
- No secret values, no database row content (repo `docs/policy.md` §6;
  Register §10 D4).

### Proposed ownership

- Content ownership per spec 08: Founder for decisions, authorizations and
  strategic project content; Muse as recorder; evidence owned by its preparer;
  global knowledge by an appointed knowledge owner.
- Changes arrive by branch and pull request. Changes to decision,
  authorization or governance records are governance changes and receive
  human review (D2). A verifier FAIL blocks merge (D2). Merge to main follows
  whatever merge authority the Founder sets; under the Stage 1 authorization it
  is founder-only.
- Execution records keep their existing owner and rules (`tasks/schema.md`).

### Why this option

- Matches the existing, already-proven Phase 1 storage decision: versioned
  files in git, durable on this VM, reviewable by PR (`docs/architecture.md`).
- Adds no service, database or paid resource (ADR-01; D5; repo `AGENTS.md`
  "No new paid services, no new databases").
- Puts records where the D2 verification flow (branch, PR, independent
  verifier) already operates.

### Options considered, not proposed

| Option | Why not proposed |
|---|---|
| Database (local or managed Postgres/Supabase) | ADR-01: no second task database for context persistence; D5: no storage product assumed; local Postgres wiped by VM replacement; managed Postgres is a new paid service needing Founder approval (`docs/architecture.md`, `docs/roadmap.md`) |
| Extend execution records (`tasks/*.json`) with project fields | Mixes classes (RS-1, RS-2); touches Runner, which is not authorized (ADR-03) |
| Keep records only in the Founder's workspace files, outside any repo | Not reachable by the PR/verifier flow D2 requires; no shared history for other roles |
| A separate repository for records | Viable; adds a second repo to keep consistent. Open question 2 |

### Known risks of the proposal

- Git history is only as immutable as branch protection makes it (repo
  `docs/policy.md` §9). The proposal depends on protection being on.
- Files offer no concurrent-write safety (`docs/architecture.md` tradeoffs);
  acceptable while one recorder writes and concurrency is 1 (Register §6).
- The repo is public (`gh repo view garzonandres2004/genesis` reported
  `"visibility":"PUBLIC"` on 2026-11-06). Records stored here are therefore
  public, including Founder decision records and authorizations. Open
  question 1.

## Authority boundaries

- **Founder:** decides F-14 and any storage location; any Runner change.
- **Muse:** records within spec 08 tiers; cannot place task state in project
  records or project facts in execution records.
- **Runner:** sole authority over execution records.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| RS-1, RS-2, RS-6 | Inspect record areas: no task status or claims in project records; no project facts in `tasks/` | Verification report |
| RS-3 | Cross-links resolve to existing ids/commits | Verification report |
| RS-4, RS-5 | Diff review: no change spans both classes without a covering authorization | Git history; PR record |
| RS-7, RS-8 | Fresh clone recovers all records with full history | Verification report (after implementation) |
| RS-9 | Global items only under the global area | Inspection |

## Open questions

1. Visibility: the Genesis repo is public (see "Known risks"). Should
   decision and authorization records be stored here, in a private repo, or
   redacted? The Register is silent; this affects F-14 directly.
2. Same repo or a dedicated records repo? The Register is silent.
3. Should the canonical Register move into `records/`? (Spec 02, open
   question 1.)
4. Whether F-06's "evidence-only" reconciliation default (Open) should be
   adopted generally, not only for Stage 0, as RS-5 assumes.

## Explicitly NOT decided here

- F-14 (proposal only), F-16 / ADR-03, F-06.
- Final path names, file schemas, tooling. No directory is created.
- Any change to `tasks/`, `events.jsonl`, `scripts/`, or Runner.
