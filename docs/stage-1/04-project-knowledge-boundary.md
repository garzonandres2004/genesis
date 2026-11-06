# 04 — Project-specific knowledge boundary

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 4 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-22, F-23.

## Purpose

Define what knowledge belongs to one project and must stay inside it, so that
one project's context, decisions, data and lessons do not leak into another
project or silently become Genesis-wide rules.

Register ADR-01 requires that "Global knowledge must be separated from
project-specific context." ADR-10 states: "A shared Muse service must not
imply shared project authority, credentials, private context, or execution
state." ADR-11 states: "Project lessons must never automatically become
global rules."

## Scope

**Covers:**
- What counts as project-specific knowledge.
- The rules for keeping it inside the project.
- How project knowledge may leave the project (only through the global
  promotion boundary in `05-global-knowledge-boundary.md`).

**Does not cover:**
- The global side of the boundary (spec 05).
- Factory-level isolation (ADR-10, F-22; Stage 5/6 design).
- The SIE incident and lesson lifecycle. The SIE design is approved in
  principle only (Brief) and "The complete approved SIE Specification must
  govern transitions and definitions" (Register CR-09).

## Requirements

- **PK-1 Default classification is project-specific.** Any knowledge produced
  while working on a project is project-specific unless and until it is
  promoted through the global boundary (spec 05). Basis: ADR-11 ("Project
  lessons must never automatically become global rules").
- **PK-2 What is project-specific.** At least: the project's objectives,
  requirements, context, decisions, architecture and status (ADR-01 project
  record content); its authorization records; its evidence; references to its
  execution records; its repository and environment identities; any data
  classification for it (ADR-08 lists "Data classification"); credential
  *names and scopes* (never values; repo `docs/policy.md` §6); and its
  lessons and incidents before promotion.
- **PK-3 Private context does not cross projects.** One project's private
  context, credentials, authority and execution state are not available to
  work on another project by default (ADR-10). Cross-project access needs an
  explicit authorization naming both projects (see `09-access-permissions.md`).
  *Test:* a task brief for project A references no project B record unless an
  authorization covering both is cited.
- **PK-4 Project authority does not transfer.** A decision or authorization
  given for one project does not apply to another (DR-6 "no inferred
  adjacency" in `02-decision-register.md`). For example, the Stage DB
  authorization covers Supabase project `tfciwyiylwmcngeblgmk` only and names
  Tyburon production as out of scope (Register, Stage DB amendment).
- **PK-5 Sensitive content stays out of knowledge records.** Project knowledge
  records hold no secret values (repo `docs/policy.md` §6) and no row content
  from databases (Register §10 D4: "Absolute prohibition on accessing row
  content"). They may hold aggregate results only where an authorization
  permitted them (Register, Stage DB amendment).
- **PK-6 Lessons stay labeled with their origin.** A project lesson records
  its originating project, the evidence that validated it inside that
  project, and its known applicability limits (ADR-11 step 1; ADR-01 global
  knowledge needs "provenance and applicability limits", which must therefore
  exist from the start).
- **PK-7 Project knowledge is not execution state.** Knowledge records may
  cite task and run identifiers; they never change task status or events
  (Register §1 principles 4–5; see `11-records-separation.md`).
- **PK-8 Status labels on every item.** Each knowledge item carries an
  approval/evidence status (Register §1 "Approval terminology") and a date.
  Repo `docs/architecture.md` already commits Phase 3 knowledge to "strict
  status labels (verified / hypothesis / superseded, each dated and sourced)".
  Which label set governs is an open question below.

## Authority boundaries

- **Founder:** owns strategic project knowledge (objectives, decisions,
  authorizations). Approves any cross-project access.
- **Muse (coordinator):** maintains project knowledge as recorder within the
  amendment rules (spec 08). Must not move knowledge between projects without
  authorization.
- **Builders / verifiers:** read the project knowledge their task needs. Write
  only through their reports, which the recorder files.
- **Research agents:** produce outputs into a project (ADR-06 output fields);
  they "do not control project decisions, execution state, or authorization"
  (ADR-06).
- **Nobody** may promote project knowledge to global knowledge except through
  the boundary in spec 05.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| PK-1, PK-6 | Every lesson record shows origin project, validating evidence, applicability limits | Project knowledge record |
| PK-3, PK-4 | Review task briefs and context bundles for cross-project references without a covering authorization | Verification report |
| PK-5 | Secret scan and review for row content in knowledge records | Verification report; CI secret check where present |
| PK-7 | Diff review: no knowledge-record change modifies `tasks/` or `events.jsonl` | Git history |
| PK-8 | Each item carries a status label and date | Project knowledge record |

## Open questions

1. Two label sets exist: Register §1 approval terminology (Founder-approved,
   historically demonstrated, proposed, unresolved, authorized, blocked) and
   the repo's Phase 3 labels (verified / hypothesis / superseded). They answer
   different questions (approval vs. truth status). Should knowledge items
   carry both? The Register does not say.
2. Without F-22, "project" and "factory" are not distinguished. If one factory
   hosts several projects, is the isolation boundary at the project or the
   factory? (ADR-10: "A second project inside the same factory does not prove
   multi-factory capability.")
3. Is Genesis platform knowledge (for example, Runner operations docs in this
   repo) project-specific to "genesis", or global? The Register is silent.
4. How SIE incidents and lessons map onto PK-6 depends on the SIE
   Specification, which does not yet exist (Register ADR-12: "The SIE
   Specification does not currently exist among the six documents").

## Explicitly NOT decided here

- F-22, F-23. The SIE lifecycle. Any storage location (F-14), retrieval
  mechanism, or knowledge-graph adoption (repo `docs/architecture.md` keeps
  Graphiti deferred behind its conjunctive trigger).
