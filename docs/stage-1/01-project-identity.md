# 01 — Project identity and persistent project context

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 1 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-05 (proposal below), F-14, F-22.

## Purpose

Define what a Genesis project must be identifiable by, and what project
context must persist across sessions, so that any role picking up work
(Founder, Muse, builder, verifier) is working on a known project, under known
authority, with the current context and not a guessed one.

Register ADR-01 requires that "Project records must persist across sessions"
and lists the project record's content as "objectives, requirements, context,
decisions, architecture, and status". ADR-02 lists "Persistent project
context" and "Recovery after interrupted sessions" among the capabilities
required "regardless of implementation".

## Scope

**Covers:**
- The minimum identity of a project.
- The minimum persistent project context and what "persistent" must mean.
- How project identity relates to the other Stage 1 records (decisions,
  authorizations, evidence, execution).
- The F-05 proposal (Stage 1 scope).

**Does not cover:**
- Where or in what format project records are stored (F-14; see
  `11-records-separation.md`).
- Factory definitions or multi-factory isolation (F-22, ADR-10; Stage 5/6
  design).
- Benchmark project selection (F-08) or approach (F-09); those belong to
  Stage S (Register ADR-08; Register, Stage 1 amendment scope limits).
- Any runtime, interface, or schema.

## Definitions used

The Register *proposes* (ADR-10, status Unresolved; F-22 Open): Genesis =
overall engineering platform; Factory = independently governed
software-engineering environment; Project = product or engineering objective
operated within a factory; Task = discrete authorized unit of execution;
Workspace = isolated working environment for a task or project. This spec uses
"project" and "task" in that sense without adopting the ontology. If F-22 is
decided differently, this spec must be revised.

## Requirements

- **PI-1 Unique project identifier.** Every project has one stable project
  identifier that is never reused for another project and never renumbered.
  *Test:* no two project records share an identifier; a renamed project keeps
  its identifier.
- **PI-2 Minimum identity fields.** A project's identity records at least:
  project identifier; name; one-paragraph objective; owner (the person with
  strategic authority over it); repository identity or identities;
  environment identities, if any; current status; and the authorization
  reference(s) under which work on it is permitted.
  Basis: ADR-01 project-record content; ADR-08 lists "Repository and project
  identity" as something the Founder must approve for a benchmark; CR-03 Task
  Brief source fields "Project and task identity" and "Repository and
  environment identity". *Test:* each field is present or explicitly marked
  unknown, never silently blank.
- **PI-3 Identity is evidenced, not assumed.** A claim that two names refer to
  the same product or environment requires positive evidence. Basis: CR-08
  ("No equivalence should be assumed without positive evidence"), and the
  Cutline/estimator identity work recorded in the Register's E-V5-2 + F-08
  amendment. *Test:* any equivalence statement in a project record cites its
  evidence.
- **PI-4 Provisional versus authorized identity.** A project or environment
  selected *provisionally* (for example, for investigation) must be labeled
  provisional and must not be presented as final benchmark authorization.
  Basis: Register §10 D3 ("Distinguish provisional project selection for
  investigation from final benchmark authorization"). *Test:* every selection
  in the record states provisional or final, and cites the decision.
- **PI-5 Persistent project context content.** Persistent context covers at
  least: objectives, requirements, context, decisions (by reference to the
  decision register), architecture, and status (ADR-01). It also lists the
  open findings and unresolved decisions that affect the project (CR-07 asks
  every document to state "Unresolved decisions").
- **PI-6 Persistence means survival across sessions and replacements.**
  Project context must survive the end of an agent session and recovery after
  an interrupted session (ADR-01, ADR-02). In this environment that also
  means surviving VM replacement: repo `docs/architecture.md` records that
  local Postgres on this VM "is ephemeral (wiped by VM replacements)". *Test:*
  a fresh session with no conversation history can recover the project's
  identity and current context from durable records alone.
- **PI-7 Context is not conversation memory.** Context held only in an agent's
  conversation, scratch notes, or memory files does not count as persistent
  project context until it is written to the project record by an authorized
  writer (see `08-ownership-amendment.md`, `09-access-permissions.md`).
- **PI-8 Project context is not execution state.** Project context references
  execution records (tasks, runs, events) by identifier; it does not copy or
  own task state. Basis: Register §1 principles 4–5 (Muse "does not own
  execution state"; Runner "owns durable execution state and task
  transitions") and ADR-01 ("Muse must not become a competing task
  database"). See `11-records-separation.md`.
- **PI-9 Every context item carries status and provenance.** Each item states
  whether it is Founder-approved, historically demonstrated, proposed,
  unresolved, authorized or blocked (Register §1 "Approval terminology"), and
  cites its source. See `06-evidence-provenance.md`.
- **PI-10 Freshness is visible.** Each project context carries a version and a
  last-reviewed date (CR-07). See `07-context-freshness.md`.

## Authority boundaries

- **Founder:** decides a project's existence, objective, and any change to
  them; approves benchmark project identity (ADR-08); retains strategic
  authority (Register §1 principle 3).
- **Muse (coordinator role):** may draft and maintain project context as a
  recorder, within the amendment rules in `08-ownership-amendment.md`. Muse
  may not declare a project selected, approved or authorized.
- **Builders and verifiers:** read project context needed for their task.
  They do not change project identity.
- Whether Muse and Runner are separate systems or roles in one system is open
  (D5). This spec assigns responsibilities to roles, not to systems.

## Evidence and traceability

| Requirement | How it is verified | Where it is recorded |
|---|---|---|
| PI-1, PI-2 | Inspection of project records for unique ids and complete fields | Project record (location per F-14) |
| PI-3, PI-4 | Each equivalence or selection statement cites a decision or evidence item | Project record, decision register |
| PI-6 | Recovery check: a new session recovers identity and context from durable records only | Verification report for the Stage 1 → Stage 2 handover (not run under this authorization) |
| PI-7, PI-8 | Review that context items are in durable records and that task state is referenced, not copied | Verification report |
| PI-9, PI-10 | Each item shows a status label, source, version and review date | Project record |

No requirement here is verified by running code under Stage 1. Verification
under this authorization is document review per D2.

## F-05 — Stage 1 scope

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-05 "Stage 1 scope". Recommended default: "Include authority,
  records, evidence, and knowledge boundaries". Required before: Stage 1.
  Status: Open (Register §5).
- **Proposed resolution:** Stage 1 scope is exactly the 11 CR-04 items
  (Register CR-04 "Proposed resolution"):
  1. Project identity and persistent project context.
  2. Decision register and approval status.
  3. Authorization record model.
  4. Project-specific knowledge boundary.
  5. Global knowledge boundary.
  6. Evidence provenance and traceability.
  7. Context freshness and versioning.
  8. Ownership and amendment rules.
  9. Access and permission requirements.
  10. Muse-to-Runner information requirements.
  11. Separation between project records and execution records.

  Stage 1 defines requirements and authority boundaries. Detailed runtime and
  interface design is finalized between Stage 1 and Stage 2, after the Muse
  identity question (ADR-02) is resolved (Register CR-04).
- **Why this list:** CR-04 records that the North Star's Stage 1 includes "the
  authority model, evidence traceability, and global-versus-project knowledge
  boundary", that Roadmap §7 and Gap Phase B omit parts of it, and that Muse
  Handoff §7 holds project-record material. The 11 items cover all four parts
  of F-05's default (authority: 3, 8, 9; records: 1, 2, 11; evidence: 6, 7;
  knowledge boundaries: 4, 5) plus the Muse information requirements (10).
- **What the Founder would be deciding:** whether this list is the complete
  Stage 1 scope, so that Stage 1 exit is judged against it.

## Open questions

1. The Founder's Stage 1 authorization already lists the same 11
   deliverables (Register, Stage 1 amendment), yet the same amendment says
   F-05 remains OPEN. Does the Founder want to close F-05 by a separate
   decision, or treat it as closed by the authorization? The Register does
   not say. The builder has not treated it as closed.
2. CR-04 says Muse Handoff §7 "contains important project-record material".
   That document was not available to the builder. Its content may add
   identity or context fields not listed in PI-2/PI-5.
3. Is Genesis itself a "project" (the repo's task records use
   `"project": "genesis"`, per `tasks/schema.md`), the platform (ADR-10), or
   both? The Register does not say how the platform's own records relate to
   project records.
4. The Register does not define a project identifier format. None is proposed
   here; that is runtime/interface detail for the Stage 1 → Stage 2 design.
5. Who may be a project "owner" other than the Founder (for example a
   delegated human reviewer under ADR-09) is unresolved (F-21 Open).

## Explicitly NOT decided here

- F-05 itself (proposal only), F-14 (storage), F-22 (factory/project
  ontology), F-08 (benchmark project), F-09 (greenfield/brownfield).
- Any identifier format, schema, file layout, storage product or interface.
- Whether Muse and Runner are separate systems or roles (D5 outcome open).
