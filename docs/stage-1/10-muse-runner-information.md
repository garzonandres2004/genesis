# 10 — Muse-to-Runner information requirements

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 10 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related decisions and findings:** D5 (APPROVED — decision process only;
  architecture outcome open), D6, F-16.

## Purpose

State **what information** the coordination responsibility (Muse) and the
execution-state responsibility (Runner) must each be able to obtain from the
other, so that work is dispatched under the right authority and its results
come back traceably — **without** deciding how that information moves.

## Scope

**Covers:**
- Information that must be available from coordination to execution, and from
  execution to coordination.
- Authority rules that hold whatever the architecture.

**Does not cover, and must not be read as deciding:**
- Whether Muse and Runner are separate systems, separate processes, or
  logical roles within one runtime. D5 approved only the decision process:
  "Determine Muse and Runner identities, responsibilities, topology,
  authority boundaries, and communication mechanism before specifying
  interfaces. Do not assume an API, separate service, second state database,
  or storage product" (Register §10 D5). The outcome is open.
- Any interface, message format, API, command set, or transport. ADR-02:
  "Only after these decisions should the design specify interfaces ... no API
  boundary is assumed."
- How project and authorization references attach to Runner tasks (ADR-03,
  F-16; "No Runner changes are authorized").
- The handoff contract (D6; not final until the Evaluation Catalog version is
  identified).

The words "from Muse" and "to Runner" below describe direction of
*information between responsibilities*. They do not imply two systems or a
network boundary. ADR-02 records that "Current practice describes the
orchestrator as the Runner operator."

## Requirements

### Authority rules (hold in every architecture)

- **MR-1 Runner is the execution-state authority.** Register §1 principle 5;
  ADR-01 ("Runner remains the execution-state authority").
- **MR-2 Muse does not write execution state.** "Muse must not bypass Runner's
  claim and task-transition rules or independently write execution state"
  (ADR-02). Muse "coordinates work but does not own execution state" (§1
  principle 4).
- **MR-3 Muse is not a second task database.** "Muse must not become a
  competing task database" (ADR-01). Project records reference execution
  records; they do not mirror task state (spec 11).
- **MR-4 Submission is authorized.** Work enters execution only through an
  "authorized task-submission mechanism" (ADR-02 required capability) and
  under an authorization record (spec 03 AR-2, AR-7).

### Information needed for execution (coordination → execution)

- **MR-5** For each unit of work, the execution side must be able to obtain at
  least: project identity; task identity; authorization reference; risk
  classification; verification requirements. These are the four associations
  ADR-03 asks about ("Project ID, authorization reference, risk class, and
  verification requirements") plus task identity.
- **MR-6** Plus the work definition the Task Brief source fields name (CR-03):
  objective and expected outcome; inputs; evidence requirements; expected
  output and artifacts; acceptance criteria; authorized scope and exclusions;
  repository and environment identity; starting commit or artifact version;
  dependencies; required tests and verification level; escalation conditions.
  And the D6 approved additions: time limits, resource/cost limits,
  model/tool restrictions, scope-compliance requirements. This spec requires
  the information to be *obtainable*; it does not decide where each field is
  held (ADR-03 options A/B/C remain open).
- **MR-7** Version of the governing records relied on (spec 07 CF-5).

### Information needed for coordination (execution → coordination)

- **MR-8 Authorized execution-state information.** Current task status and
  run history the coordinator is authorized to see (ADR-02 "Access to
  authorized execution-state information").
- **MR-9 Results.** Outcome per run, resulting commit or artifact reference,
  and the builder report and evidence references (ADR-02 "Result retrieval";
  CR-03 Builder Report).
- **MR-10 Failures and timeouts.** Failure, interruption, timeout and
  retry-exhaustion signals with reasons (ADR-02 "Failure and timeout
  handling"; repo `tasks/schema.md` event types; repo `docs/policy.md` §7–§8).
- **MR-11 Audit trail.** An attributable record of who submitted, claimed,
  transitioned and completed each task (ADR-02 "Audit trail").
- **MR-12 Recovery state.** Enough durable state to resume coordination after
  an interrupted session without guessing (ADR-02 "Recovery after interrupted
  sessions"; spec 01 PI-6).
- **MR-13 Blocked reasons.** What is needed and who can unblock it (repo
  `tasks/schema.md` blockers; `docs/policy.md` §8).

### Information hygiene

- **MR-14** No secret values in any information passed either way (repo
  `docs/policy.md` §6).
- **MR-15** A verifier FAIL reported back blocks acceptance and merge (D2);
  the information flow must not drop or downgrade a FAIL, and must keep
  skipped checks distinct from passed ones (D2).

## Authority boundaries

- **Founder:** decides D5's outcome and any Runner change (ADR-03: "No Runner
  changes are authorized"). Under this authorization no Runner change is made.
- **Muse:** may request execution of authorized work and read authorized
  execution information; never transitions tasks itself outside Runner's
  rules.
- **Runner:** owns claims and transitions; does not decide project direction
  or authorization.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| MR-1–MR-3 | Diff review: coordination code/records never write task state outside Runner rules | Git history; verification report |
| MR-4, MR-5 | Each task can be traced to an authorization reference, project, risk class, verification requirement | Task Brief; execution records |
| MR-8–MR-13 | Walk one task: status, results, failures, audit entries recoverable from durable records | Verification report (Stage 2) |
| MR-15 | A FAIL in a verification report appears unchanged where acceptance is decided | Verification and delivery records |

## Open questions

1. D5's outcome: separate systems, separate processes, or roles in one
   runtime (Register §10 D5; ADR-02). Every "how" in this spec waits on it.
2. ADR-03 options A/B/C for associating project/authorization/risk/
   verification with tasks (F-16 Open; "Evaluate the hybrid model first, but
   do not select it until the current Runner architecture has been inspected
   under Stage V"). Stage V is complete; whether its findings support any
   option is not stated in the Register.
3. D2 risk classes are undefined, so MR-5's "risk classification" has no
   agreed values yet.
4. Muse Handoff content on the task-submission boundary (Register §7 lists
   "clarify ... task-submission boundary" as a required Muse Handoff
   revision) was not available to the builder.

## Explicitly NOT decided here

- D5's architecture outcome; any interface, API, message, transport or
  command form.
- F-16 / ADR-03 option. Any Runner change.
- D6 contract finalization.
