# 07 — Escalation model

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 7 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D2 (APPROVED WITH AMENDMENTS), D6
  (APPROVED WITH AMENDMENTS), ADR-05, ADR-09, F-21 (proposal below), F-29,
  F-30.

## Purpose

Define when work must stop and ask, whom it asks, what happens while it
waits, and how disagreements between builder and verifier are settled — so
that no decision is taken by the wrong role, by default, or by silence.

ADR-05 requires "Escalation and disagreement procedures" before Stage 2.
ADR-09: "Every approval must have an identified approver, explicit scope,
evidence requirements, expiry or timeout, recorded decision, and defined
waiting behavior. Silence and timeout never equal approval."

## Scope

**Covers:** escalation triggers and paths; limit-exceeded handling for the
D6 Task Brief additions; builder–verifier disagreement; time limits and
unanswered escalations; protected actions; the F-21 proposal.

**Does not cover:** the risk classes themselves (spec 05 (e)); amendment
rights over records (F-30; Stage 1 spec 08); safety-incident resumption rules
(F-29 Open), beyond requiring that a stop be recorded.

## Definitions used

- **Escalation** — a recorded request, from the role that cannot proceed, to
  a role with authority to decide, stating what is needed.
- **Protected action** — any of: merge to main; deployment; database
  migration; spending; real data; security-policy change; family expansion;
  commercial licensing. (List set by the coordinator's Stage 2 builder
  instructions; it is not itself a Register or Brief list. It overlaps repo `docs/policy.md` §3 and Stage 1 spec 09 AP-4, which
  remain in force. Where those lists name more actions, they also apply.)

## Requirements

### Escalation records and triggers

- **ES-1 Every escalation is a record.** It states: the task and
  authorization references; who raised it; the trigger (ES-2); what decision
  or input is needed; who can decide (ES-3); evidence attached; the
  response-by time (ES-10); and the waiting behavior (ES-10). *Test:* each
  escalation has all fields.
- **ES-2 Triggers.** A role must escalate, not decide, when:
  1. a Task Brief limit is insufficient or exceeded — time, resource/cost,
     model/tool restriction, or scope (ES-4);
  2. the work needs a protected action or anything outside its authorization
     (Stage 1 spec 03 AR-4, AR-6);
  3. the risk class requires human review (spec 05 VI-16);
  4. a verifier returns FAIL and the builder or Muse disputes it (ES-5);
  5. a required input, source document or credential is missing (D6 "Do not
     invent missing source material"; Stage 1 spec 06 EV-7);
  6. scope is ambiguous (narrowest reading applies meanwhile; Stage 1 spec 03
     AR-3);
  7. a Task Brief's "Escalation conditions" field (CR-03) is met;
  8. a safety issue appears (ES-13).
- **ES-3 Paths.** Escalations go up, never sideways to a peer of equal
  authority:

| Raised by | First recipient | Decides | Notes |
|---|---|---|---|
| Builder | Muse | Muse only if the answer is already inside the authorization; otherwise Founder | Builder stops the affected work |
| Verifier | Muse (recorded in the Verification Report) | Per ES-5–ES-9 | Verifier never negotiates its verdict with the builder |
| Research agent | Muse | As builder | |
| Muse | Founder (or a delegate whose written permission covers it, F-21) | Founder / delegate | Muse records the brief with a recommendation |
| Anyone, safety | Stop first, then Muse and Founder | Founder clears resumption | ES-13 |

### Limits exceeded (D6 Task Brief additions)

- **ES-4 Limits are not self-extended.** D6: Task Briefs "require escalation
  when limits are insufficient or exceeded" (Register §10 D6). When a builder,
  verifier or research agent reaches or foresees exceeding:
  - **time limit:** it stops at the limit and the run ends `interrupted` or
    `blocked`, not left running (repo `docs/policy.md` §7);
  - **resource or cost limit:** it stops before incurring more; no spending
    beyond the limit under any circumstance;
  - **model/tool restriction:** it does not use the restricted model or tool,
    and does not route around the restriction through another tool (repo
    `docs/policy.md` §3);
  - **scope:** it does not do out-of-scope work, and records the need.
  Then it escalates under ES-1. Only the authority that set the limit may
  raise it, by a new recorded authorization (Stage 1 spec 03 AR-10). A task
  that overran a limit is High-risk for verification (spec 05 VI-16).

### Disagreement between builder and verifier

- **ES-5 A FAIL stands while disputed.** A verifier FAIL blocks acceptance and
  merge (Register §10 D2) from the moment it is reported until one of ES-7's
  outcomes is recorded. A dispute does not suspend the block.
- **ES-6 Procedure.**
  1. The builder (or Muse) records the dispute against specific findings,
     with evidence — not with explanation alone (D2: "Builder explanations
     are not independent evidence").
  2. Muse launches a **new** verifier session (spec 05 VI-19) with the
     artifact, the disputed findings, and the dispute evidence, each labeled
     as such.
  3. If the new session agrees with the FAIL, the FAIL stands; the builder
     corrects or the task is blocked.
  4. If the new session disagrees, the disagreement is escalated to human
     review (step 5). Two verifier verdicts do not cancel each other; no
     majority rule.
  5. The human reviewer (Founder, or a delegate whose permission covers the
     risk class, F-21) decides on the evidence and records the decision.
- **ES-7 Allowed outcomes, and only these:**
  - corrected artifact re-verified PASS (D2: "Corrected artifacts require
    re-verification");
  - verdict shown erroneous with evidence and corrected by an authorized
    decision (D2: "Erroneous verdicts must be corrected with evidence");
  - a separate Founder decision reconsidering the FAIL (D2: "No override
    without a separate decision"; ADR-05: "documented review, evidence, and an
    authorized decision").
  A builder report, a `completed` task status, or schedule pressure is never
  an outcome (ADR-05).
  - *Note — a Founder decision is not a corrected verdict.* A separate
    Founder reconsideration is a governance decision about the FAIL; it does
    not automatically extinguish the FAIL. The FAIL stays unresolved until a
    corrected artifact passes re-verification or the verdict is shown
    erroneous with evidence. A Founder decision to proceed despite an
    unresolved FAIL is a separate, recorded decision, not a resolution of the
    FAIL itself.
- **ES-8 Who decides.** Muse and the builder never decide a disagreement. A
  delegate may decide only within written permission that names verification
  disputes and the risk class; a disagreement on a Governance, Security or
  First-product item is the Founder's. The Founder retains strategic
  acceptance in every case (Register §10 D2; ADR-05).
- **ES-9 Muse disputes.** If Muse (not the builder) disputes a verdict, the
  same procedure applies; Muse's coordinating role gives it no extra weight
  (ADR-05: Muse "is not automatically the verifier").

### Time limits and unanswered escalations

- **ES-10 Every escalation has a response-by time and a waiting behavior.**
  Proposed defaults, until the Founder sets others:
  - **Waiting behavior:** the affected task is `blocked` with what is needed
    and who can unblock it; unrelated work continues (repo `docs/policy.md`
    §8; `tasks/schema.md` blockers).
  - **Response-by:** the escalation states one. When it passes, Muse
    re-surfaces the escalation to the decider once, with the original record,
    and records that it did so. After that the task stays `blocked`.
  - **Expiry:** an escalation does not expire into approval. It may be
    withdrawn by the raiser (recorded), or closed by a decision.
- **ES-11 No silent default approval.** "Silence and timeout never equal
  approval" (Register ADR-09). An unanswered escalation is never treated as
  "yes", "no objection", or "proceed with the recommendation". Recommended
  defaults stay proposals (Register §5 preamble).

### Protected actions and safety

- **ES-12 No escalation path authorizes a protected action without the
  Founder.** Merge to main, deployment, migration, spending, real data,
  security-policy change, family expansion and commercial licensing need an
  explicit Founder authorization naming the action (Register, Stage 2
  amendment: "No merge to main under this authorization (merge stays
  founder-only)"; Stage 1 spec 09 AP-4). A delegate cannot grant one (F-21
  proposal below). A verifier PASS does not grant one.
- **ES-13 Safety stops are immediate.** Any role may stop work for a safety
  issue without waiting for a decision; the stop is recorded afterwards
  (proposed by analogy with D8 "never delay safety action", as in Stage 1
  spec 03 and spec 08 — the Register states no general rule). Resumption
  needs "evidence-based explicit clearance" (F-29 default, Open); this spec
  does not decide F-29.

## F-21 — Delegated approval

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-21 "Delegated approval". Recommended default: "Bounded human
  delegation; founder-only strategic decisions". Required before: Stage 2.
  Status: Open (Register §5). Basis: ADR-09 (Unresolved).
- **Proposed resolution:**
  1. **Three levels, per ADR-09.** Routine actions pre-authorized within a
     task's fixed scope and limits; bounded delegated decisions by named human
     reviewers with written permissions; Founder-only decisions.
  2. **Delegates are humans.** No agent — Muse, builder, verifier, research
     agent — may hold delegated approval authority. ADR-09: "Bounded delegated
     decisions: assigned human reviewers with written permissions."
  3. **A delegation is an authorization record** (Stage 1 spec 03 AR-1)
     naming: the delegate; the decision types covered (for example: human
     review of Routine and High-risk items; deciding verification disputes for
     those classes; narrowing an authorization); projects covered; limits;
     expiry; reporting duty to the Founder.
  4. **Founder-only, never delegable:** strategic direction, governance
     changes, budget expansion, production risk, external commitments, and
     authority expansion (ADR-09); every protected action (ES-12); Governance,
     Security and First-product human review and disputes (ES-8); appointing
     or removing delegates (Stage 1 spec 08 Tier F item 7); lowering a risk
     class (spec 05 VI-17).
  5. **Delegated decisions are reported and reversible.** Each is recorded,
     reported to the Founder, and reversible by the Founder (Stage 1 spec 08
     Tier D).
  6. **Today the delegate list is empty.** The Register records no delegate.
     Until the Founder appoints one, every decision above the routine level is
     the Founder's.
- **What the Founder would be deciding:** the three levels, the "humans only"
  rule, the delegation record contents, and the never-delegable list.

## Authority boundaries

- **Founder:** decides escalations not covered by a delegation; all protected
  actions; FAIL reconsideration by separate decision; resumption after safety
  stops (F-29 pending); appoints delegates (F-21 pending).
- **Delegated reviewer (none appointed):** decides only within written
  permission.
- **Muse:** records, routes and re-surfaces escalations; decides only what an
  existing authorization already answers; never decides a disagreement.
- **Builder, verifier, research agent:** raise escalations; stop the affected
  work; never decide their own escalation.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| ES-1–ES-3 | Each escalation has the ES-1 fields and went to an ES-3 recipient | Escalation records |
| ES-4 | No run continued past a limit; limit raises have an authorization | Execution records; authorization records |
| ES-5–ES-9 | No acceptance or merge while a FAIL is unresolved; each resolution is an ES-7 outcome | Verification Reports; PR state; decision records |
| ES-10, ES-11 | Unanswered escalations remain `blocked`; none became approval | Task records; escalation records |
| ES-12 | Each protected action cites a Founder authorization | Authorization records |
| F-21 | Each delegated decision cites a delegation record within its bounds | Delegation and decision records |

## Open questions

1. What response-by times should the Founder set (per class, or one default)?
   The Register sets none; ES-10 proposes only the behavior.
2. Where are escalation records kept — in task blockers, PR comments, or a
   project-record area (F-14)? The Register is silent.
3. "Family expansion" and "commercial licensing" are protected actions in
   this spec's list but are not defined in the Register or repo. Their scope
   needs a Founder definition.
4. Does a delegate's decision on a verification dispute need Founder
   confirmation before merge, given merge stays founder-only? Under the
   current authorization it does in practice, since merge is founder-only.

## Explicitly NOT decided here

- F-21 (proposal only), F-29, F-30.
- Any delegate appointment; any response-by value.
- No escalation path grants a protected action, and none creates an exception
  to "verifier FAIL blocks acceptance and merge".
