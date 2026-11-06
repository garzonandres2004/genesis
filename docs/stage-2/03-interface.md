# 03 — Interface finalization

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 3 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D5 (APPROVED — decision process only;
  architecture outcome open), D6 (APPROVED WITH AMENDMENTS), ADR-02, ADR-03,
  F-16, F-34.

## Purpose

State the capabilities the boundary between coordination (Muse) and
execution (Runner) must provide, and the requirements each must meet, so that
an interface can be finalized once the D5 architecture outcome is decided.

ADR-02 sets the order: identities, responsibilities, topology, authority
boundary, communication mechanism — "Only after these decisions should the
design specify interfaces. Possible interface forms may include internal
function boundaries, process interfaces, command interfaces, or APIs. No
specific form is selected here, and no API boundary is assumed." The
interface form **follows** the architecture outcome; it does not select it.

## Scope

**Covers:**
- The eight capabilities ADR-02 requires "regardless of implementation", each
  as a requirement with an acceptance check.
- What the interface form would be under spec 01's proposed outcome, stated
  as conditional.

**Does not cover:**
- Selecting an interface form. The D5 outcome is open; spec 01 proposes one,
  the Founder has not decided it. No form is selected here.
- Field-level content of what crosses the interface. That is the contract
  (`04-contracts.md`) and Stage 1 spec 10 (MR-5–MR-13).
- Building anything. No code, CLI, endpoint or schema is created.

## Definitions used

- **Interface** — the defined set of operations by which one role asks the
  other to act or for information, and receives the result. Form-neutral.
- **Interface form** — the ADR-02 alternatives: internal function boundary,
  process interface, command interface, or API.

## Requirements — ADR-02 required capabilities

Each capability holds under any D5 outcome. The test states what must be
demonstrable once an interface exists; none is run under this authorization.

- **IF-1 Persistent project context.** Coordination can obtain the current
  project context from durable records after any session ends (ADR-02; Stage
  1 spec 01 PI-5, PI-6). The interface reads project records; it does not hold
  context in session memory (Stage 1 PI-7).
  *Test:* a fresh session with no history recovers project identity, open
  tasks and their governing authorizations from durable records alone.
- **IF-2 Access to authorized execution-state information.** Coordination can
  read task status, runs, attempts, events and blockers it is authorized to
  see (ADR-02; MR-8). Reads have no side effects.
  *Test:* reading state twice with no intervening execution yields identical
  results and no new commits or events.
- **IF-3 Authorized task-submission mechanism.** One defined operation submits
  work; it requires a Task Brief and the five references in MR-5 and rejects
  submissions lacking them (spec 02 RL-2, RL-3). Submission is idempotent
  under a stable task identifier: resubmitting the same identifier does not
  create a second task (repo `tasks/schema.md` idempotency keys).
  *Test:* a submission missing an authorization reference is rejected with a
  reason; a duplicate submission returns the existing task.
- **IF-4 Result retrieval.** Coordination can retrieve, per run: outcome,
  resulting commit or artifact reference, Builder Report, evidence references
  (ADR-02; MR-9). Retrieval names the exact commit or artifact (Register §10
  D2: "Verification must target the exact commit or artifact").
  *Test:* for a completed run, the retrieved commit SHA matches the branch
  head the verifier evaluated.
- **IF-5 Failure and timeout handling.** Every operation that can fail or
  exceed a time limit returns an explicit failure with a reason, never a
  silent success or an indefinite wait (ADR-02; MR-10; repo `docs/policy.md`
  §7: "No unbounded loops, no unbounded polling"). Time limits come from the
  Task Brief (D6 addition "time limits"); exceeding one triggers escalation
  (`07-escalation-model.md`).
  *Test:* an operation forced past its time limit ends with a recorded
  timeout and the task is `interrupted` or `blocked`, not left running.
- **IF-6 Authentication and permission boundaries.** Every operation is
  attributable to a role, and checks that role's permission before acting
  (ADR-02; Stage 1 spec 09 AP-2, AP-6). Under one runtime, "authentication"
  reduces to role attribution plus code-path restriction (spec 01 MI-8); that
  limit is stated, not hidden.
  *Test:* every write the interface performs carries a role identity (for
  example the one-off git identity, repo `AGENTS.md`) and an authorization
  reference.
- **IF-7 Audit trail.** Every submission, claim, transition, result and
  failure leaves an attributable, append-only record (ADR-02; MR-11; repo
  `tasks/schema.md`: events "Appended (never rewritten)").
  *Test:* a task's full history is reconstructable from git history and
  `events.jsonl`.
- **IF-8 Recovery after interrupted sessions.** After an interruption at any
  step, the interface lets coordination determine what already happened
  (including external side effects) before acting again (ADR-02; MR-12; repo
  `docs/policy.md` §8: "Never silently retry a step that may already have
  committed an external side effect. Check first, then act").
  *Test:* an interruption after a PR was created and before it was recorded
  results in adoption of the existing PR, not a second PR (repo
  `docs/crash-pr-recovery.md`; Stage V V3-C4 notes this is fixture-proven
  only).

## Requirements — properties of any interface

- **IF-9 No bypass.** No operation lets coordination write execution state
  outside Runner's rules (ADR-02; spec 02 RL-1).
- **IF-10 No secret values cross the interface** (MR-14; repo
  `docs/policy.md` §6).
- **IF-11 FAIL survives the interface.** A verifier FAIL and the distinction
  between skipped and passed checks pass through unchanged (MR-15; D2).
- **IF-12 Contract objects are the payload.** Task Brief out, Builder Report
  back, Verification Report to acceptance (`04-contracts.md`). The interface
  does not define its own competing field lists.
- **IF-13 Concurrency-safe at the authorized limit.** The interface is correct
  at concurrency 1 (F-34 proposal, spec 02). It makes no claim of safety
  above that limit until tested.

## Interface form — conditional on the D5 outcome

**No form is selected by this spec.**

If, and only if, the Founder adopts spec 01's proposed outcome (logical roles
within one runtime, with the communication mechanism Stage V verified as
implemented, V1-C3), the interface form that follows is **internal command
and function boundaries**: the existing Runner CLIs (`scripts/claim.mjs`,
`scripts/reconcile.mjs`, `scripts/pr-recovery.mjs`, `scripts/preflight.mjs`)
and the transition module (`scripts/task-state.mjs`), each returning one line
of JSON on stdout plus an exit code (repo `docs/runner-wiring.md`), with git
records as the durable channel. Under that outcome:

| Capability | Existing element (documented) | Gap against IF-n |
|---|---|---|
| IF-1 | Task records in git; no project-record area yet (Stage 1 spec 11) | Project records not created (F-14 Open) |
| IF-2 | `tasks/*.json`, `events.jsonl`, `scripts/status.mjs` | — |
| IF-3 | Orchestrator writes a `queued` task file | No reference check (RL-3); spec 02 F-16 |
| IF-4 | Task record `evidence`, PR-URL fields | No Builder Report object as defined in spec 04 |
| IF-5 | `interrupted` / `blocked` outcomes; retry cap 3 (repo `docs/policy.md` §7) | No per-task time limit field from the Task Brief |
| IF-6 | One-off git identities | Rule-based only (spec 01 MI-8) |
| IF-7 | Git history, append-only `events.jsonl` | Stage V D-8: `events.jsonl` lacks `task_completed` for m10 tasks |
| IF-8 | `reconcile.mjs`, `pr-recovery.mjs` adopt-before-create | Live crash-after-PR not reproduced (Stage V V3-C4) |

The gaps are recorded, not filled. Closing any of them that touches Runner
needs a separate authorization (ADR-03).

If the Founder chooses separate processes or separate systems instead, this
section is void and the form must be designed after spec 01 is redone. An API
would then be one possible form, not a default.

## Authority boundaries

- **Founder:** decides the D5 outcome that determines the form; authorizes any
  implementation of the interface or of Runner changes.
- **Muse:** uses the interface within authorizations; cannot extend it.
- **Runner:** enforces IF-3, IF-9 at its boundary once implemented.
- **Verifier:** checks IF-n against evidence when an interface exists.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| IF-1, IF-8 | Recovery walk from durable records | Verification report (after implementation) |
| IF-2, IF-4, IF-7 | Read-back of a completed task and its history | Execution records; git history |
| IF-3, IF-9 | Negative test: incomplete submission rejected; no write outside Runner rules | Test output (code plus tests, when authorized) |
| IF-5 | Forced-timeout test | Test output |
| IF-6, IF-10, IF-11 | Diff and record review | Verification report |

## Open questions

1. The D5 outcome (spec 01). Until decided, the form section above is
   conditional only.
2. Should a Builder Report be a distinct record (file) or remain fields in the
   task record plus a PR body? Depends on F-14 and spec 04; the Register is
   silent.
3. IF-5: where do per-task time limits live — Task Brief only, or also an
   execution-record reference (spec 02 F-16 proposal)?
4. The Muse Handoff's "task-submission boundary" material (Register §7) was
   not available to this builder.

## Explicitly NOT decided here

- Any interface form. The conditional section is not a selection.
- The D5 outcome; F-16; F-34.
- Any CLI, endpoint, message format, schema or code.
