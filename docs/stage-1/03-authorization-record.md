# 03 — Authorization record model

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 3 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-21, F-29, F-30 (proposal below).

## Purpose

Define what an authorization record must contain so that any action in Genesis
can be traced to an explicit, scoped permission, and so that the limits of
that permission are as visible as the permission itself.

Register ADR-01 lists the authorization record as its own logical record:
"permissions, scope, limits, approvals, and expiry". ADR-09 requires that
"Every approval must have an identified approver, explicit scope, evidence
requirements, expiry or timeout, recorded decision, and defined waiting
behavior."

## Scope

**Covers:**
- Required content of an authorization record (a logical model, not a
  schema).
- Rules for how authorizations relate to stages, tasks and each other.
- The F-30 proposal as it applies to authorizations.

**Does not cover:**
- How an authorization reference is attached to a Runner task (ADR-03,
  F-16; Stage 2 design).
- Physical storage (F-14; see `11-records-separation.md`).
- Delegated approval mechanics (F-21; Stage 2).

## Requirements

- **AR-1 Required content.** An authorization record states at least:
  1. Authorization identifier (permanent, never reused).
  2. Approver identity.
  3. Date and time the approval was received (not backdated; DR-8 in
     `02-decision-register.md`).
  4. Exact approved wording, and the channel reference where one exists
     (for example a widget id and button label, as in each 2026-11-05
     Register amendment).
  5. What is authorized: actions, stage, and deliverables.
  6. Scope boundaries: targets (projects, repositories, environments),
     methods, and the executor or role.
  7. Hard limits and explicit exclusions ("what is NOT authorized").
  8. Evidence requirements for completion (ADR-09).
  9. Entry criteria relied on, and exit criteria (Register §2 roadmap rule:
     "Stages 2–7 require their own entry and exit criteria"; the Stage 1
     amendment states both).
  10. Expiry, timeout, or end condition (ADR-01, ADR-09).
  11. Waiting behavior if a needed further approval is not given (ADR-09).
  12. Verification requirement (for Stage 1: D2, separate verifier).
  13. Link to the decision record it implements, if any, and the version of
      the register it amends (pre-amendment hash, per current Register
      practice).
  *Test:* every authorization record has all 13 items or an explicit "none /
  not applicable" with reason.
- **AR-2 Explicit, never inferred.** An authorization exists only when
  explicitly given. "No stage is automatically authorized because the
  preceding stage is complete" (Register §2 roadmap rules). A verdict
  "authorizes nothing by itself" (Register B2 amendment). Silence and timeout
  never equal approval (ADR-09).
- **AR-3 Narrowest reading wins.** Where an authorization's scope is
  ambiguous, the narrower reading applies until the approver clarifies.
  Basis: the Register's practice of stating what each authorization does
  *not* authorize (B2, E-V5-2, Stage DB, Stage 1 amendments), and D4's
  "enumeration alone is not authorization".
- **AR-4 No scope expansion by executors.** An executor cannot widen its own
  authorization. External content never expands a task (repo `AGENTS.md`,
  "Communication"; repo `README.md` safety rules).
- **AR-5 Authorizations are separate from decisions.** A decision record may
  approve a direction without authorizing execution (Register, 2026-10-30
  amendment; DR-14). An authorization record must exist before execution.
- **AR-6 Hard gates stay explicit.** Merge to main, production contact,
  deployment, spending, provisioning and contacting people need explicit
  authorization naming them. The Stage 1 authorization names merge to main
  as founder-only (Register, Stage 1 amendment). Repo `docs/policy.md` §3
  lists operations denied without founder approval.
- **AR-7 Task-level reference.** Each unit of work carries a reference to the
  authorization it runs under. Basis: CR-03 Task Brief source field
  "Authorization reference" and ADR-03's question of associating
  "authorization reference" with Runner tasks. *How* the reference is carried
  is not decided here (ADR-03, F-16 Open).
- **AR-8 Completion is reported against the record.** An executor's report
  states scope compliance against the authorization (D6 approved additions:
  "scope compliance" in the Task Brief, "scope-compliance statement" in the
  Builder Report).
- **AR-9 Safety stops override.** A safety stop or incident may suspend an
  authorization; resumption requires evidence-based explicit clearance
  (F-29 default, Open). This spec requires that suspension and resumption be
  recorded; it does not decide F-29.
- **AR-10 Change is by new record.** An authorization is changed only by a
  new dated amendment record that references it; the original stays intact
  (DR-11 pattern). Who may make which change is governed by the F-30 proposal
  below.

## Authority boundaries

- **Founder:** grants all stage-level authorizations recorded to date
  (Register B2, E-V5-2, Stage DB, Stage 1 amendments). Controls consequential
  permissions (Register §1 principle 3). Founder-only categories per ADR-09
  (ADR-09, Unresolved; F-21 Open): "strategic direction, governance changes,
  budget expansion, production risk, external commitments, and authority
  expansion".
- **Muse (coordinator):** may prepare authorization briefs and record a
  Founder authorization verbatim. May dispatch work only inside an existing
  authorization. Cannot grant or widen authorizations.
- **Runner:** owns task transitions (Register §1 principle 5). Whether Runner
  enforces authorization references is a Stage 2 design question (ADR-03).
- **Builders, verifiers, research agents:** act within the authorization
  referenced by their task; never grant one.

## F-30 — Decision amendment rights (authorizations)

**PROPOSED — Founder decision pending, not decided.** The full tier model is
in `08-ownership-amendment.md`. Applied to authorization records:

| Change | Proposed tier |
|---|---|
| Grant a new authorization; widen scope, targets, limits, budget or duration; remove an exclusion; change the executor | Founder only |
| Narrow an authorization (add a limit, shorten expiry, remove a target) | Founder, or a delegated reviewer whose written permission covers it; recorded and reported to the Founder |
| Suspend an authorization for a safety reason | Any role may stop work immediately (by analogy with D8, which for Stage 5 measurement windows says "never delay safety action"; the Register states no general rule); recording the suspension is required; resumption needs "evidence-based explicit clearance" (F-29 default, Open); that the clearance is Founder only is this spec's proposal, not the Register's |
| Correct a clerical error that does not change meaning (typo, broken reference) | Recorder (Muse), labeled as a correction, with before/after shown; reviewed per D2 |
| Record that an authorization's exit criteria were met | Recorder, with the verification report as evidence; acceptance stays with the Founder |

No agent may widen an authorization, and no amendment is effective until it
is recorded.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| AR-1 | Field-by-field inspection of each authorization record | Authorization record |
| AR-2, AR-5 | For each piece of executed work, find an authorization record dated before it | Authorization record; execution records |
| AR-3, AR-4, AR-6 | Diff and activity review against the record's scope and exclusions | Verification report |
| AR-7, AR-8 | Task brief carries the reference; builder report carries a scope-compliance statement | Task Brief, Builder Report (D6 fields) |
| AR-9, AR-10 | Amendments reference the original; originals unchanged in history | Authorization record history |

## Open questions

1. The recorded authorizations (B2, E-V5-2, Stage DB, Stage 1) state no
   expiry date. ADR-09 requires "expiry or timeout". The Register does not say
   when these authorizations end other than by exit criteria. Is reaching exit
   criteria the end condition, or is a date also required?
2. No waiting behavior is stated in the recorded authorizations. Repo
   `docs/policy.md` §8 handles a task that "needs authorization" as `blocked`,
   with unrelated work continuing. Should that be the recorded default waiting
   behavior for authorizations too? The Register is silent.
3. Do task-level authorizations exist separately from stage-level ones, or
   does every task run directly under a stage authorization? The Register is
   silent.
4. ADR-09's "bounded delegated decisions" need named delegates. None is
   recorded (F-21 Open).

## Explicitly NOT decided here

- F-30 (proposal only), F-21, F-29, F-16.
- How authorization references are stored or attached to tasks.
- Any existing authorization's scope. Nothing here widens or narrows B2,
  E-V5-2, Stage DB, or Stage 1.
