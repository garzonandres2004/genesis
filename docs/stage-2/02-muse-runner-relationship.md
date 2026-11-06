# 02 — Muse–Runner relationship

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 2 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D5 (APPROVED — decision process only;
  architecture outcome open), ADR-02, ADR-03, F-16 (proposal below), F-34
  (proposal below).

## Purpose

Define how the coordination role (Muse) and the execution-state role
(Runner) work together: how work passes from one to the other, how Genesis
associates project, authorization, risk and verification information with
Runner tasks (ADR-03), and how much execution may run at once (F-34).

Stage 1 spec `docs/stage-1/10-muse-runner-information.md` stated *what
information* each side needs (MR-1–MR-15). This spec states *the
relationship*: who does what, in which order, under which rules. It builds on
spec 10 and does not change it.

## Scope

**Covers:**
- The relationship rules that hold under the proposed D5 outcome in
  `01-muse-identity.md`, and those that hold under any outcome.
- An evaluation of ADR-03 options A/B/C on the evidence available, and the
  F-16 proposal.
- The F-34 proposal as the execution-concurrency rule for this relationship.

**Does not cover:**
- The D5 outcome (spec 01; Founder decision pending).
- Interface form (`03-interface.md`).
- Contract field definitions (`04-contracts.md`).
- Any Runner change. "No Runner changes are authorized" (Register ADR-03).
  The F-16 proposal names a change for the Founder to consider; it does not
  make it.

## Requirements (hold under any D5 outcome)

- **RL-1 Runner rules are not bypassed.** "Muse must not bypass Runner's claim
  and task-transition rules or independently write execution state" (Register
  ADR-02). Restates Stage 1 MR-1–MR-2. *Test:* see spec 01 MI-7.
- **RL-2 Submission is the only entry.** Work enters execution only by an
  authorized submission carrying a Task Brief (`04-contracts.md`) and an
  authorization reference (Stage 1 spec 03 AR-7; MR-4). *Test:* every task
  record created can be traced to a Task Brief and an authorization record
  dated before it.
- **RL-3 Submission checks its required references.** A submission that lacks
  project identity, task identity, authorization reference, risk
  classification or verification requirement (MR-5) is rejected, not queued.
  *Test:* when implemented, a submission missing any of the five fails with a
  stated reason (code plus tests; not built under this authorization).
- **RL-4 One claim per run.** Execution begins only after a claim Runner
  records as won (repo `docs/atomic-claim.md`: a `LOST` worker "stands down
  before any builder dispatch"; Stage V V2-C1 Verified claim-first dispatch).
- **RL-5 Results return as records, not as status claims.** The builder's
  result reaches coordination as a Builder Report plus evidence references
  (MR-9; CR-03). Runner's status is not acceptance (spec 01 MI-11).
- **RL-6 Verification sits between execution and acceptance.** Runner records
  the run; an independent verifier evaluates the exact artifact
  (`05-verifier-identity-runtime.md`); a verifier FAIL blocks acceptance and
  merge (Register §10 D2). Today the orchestrator's own re-run of tests
  (repo `docs/runner-operations.md` §1 step 5) is orchestrator verification,
  "not ... independent verification" (Register ADR-05; Stage V A-3).
- **RL-7 Failures surface; they are not absorbed.** Interrupted, failed,
  blocked and retry-exhausted outcomes reach coordination with reasons
  (MR-10, MR-13; repo `docs/policy.md` §7–§8). Escalation follows
  `07-escalation-model.md`.
- **RL-8 Recovery is from durable records.** After an interrupted session,
  coordination resumes from execution records and project records alone (MR-12;
  Stage 1 spec 01 PI-6), using Runner's reconcile and adopt paths (repo
  `docs/runner-operations.md` §2–§3), never by re-dispatch on guesswork.
- **RL-9 Concurrency follows F-34.** See below. The relationship is designed
  for one worker until a separate authorization changes that.

## The relationship as a sequence (under the proposed D5 outcome)

Under spec 01's proposal (roles in one runtime), the relationship is the
existing live execution path (repo `docs/runner-operations.md` §1), with the
role of each step made explicit:

| # | Step | Role | Rule |
|---|---|---|---|
| 1 | Compose Task Brief under an authorization | Muse | RL-2; spec 04 |
| 2 | Submit (create `queued` task record) | Muse, via the submission path | RL-2, RL-3 |
| 3 | Preflight, queue read, reconcile | Runner rules | `docs/runner-operations.md` §1 steps 0–2 |
| 4 | Claim | Runner rules | RL-4 |
| 5 | Dispatch builder in task worktree | Muse, only after `WON` | RL-4 |
| 6 | Record run outcome and evidence | Runner rules (requested by Muse) | RL-1; spec 01 MI-7, MI-12 |
| 7 | Independent verification of exact artifact | Verifier | RL-6; spec 05 |
| 8 | Human review where the risk class requires it | Founder or delegated reviewer | spec 05 (e); spec 07 |
| 9 | Adopt-or-create PR | Runner rules (`pr-recovery.mjs`), Muse opens PR | `docs/runner-operations.md` §1 steps 7–8 |
| 10 | Merge | Whoever the merge authority names; under Stages 1–2, Founder only | Register, Stage 2 amendment |

Steps 7 and 8 do not exist in the live path today as separate roles (Stage V
A-3: "Independent verifier not implemented"). Adding them changes how the
orchestrator works, not Runner's rules. Implementing it needs its own
authorization; this spec does not authorize it.

Under option (A) or (B) in spec 01, the same steps and roles apply; only the
boundary each arrow crosses changes, and spec 03 would be redone.

## F-16 — Runner extension (ADR-03 options A/B/C)

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-16 "Runner extension". Recommended default: "Evaluate hybrid
  approach after Stage V". Required before: Stage 2 design. Status: Open
  (Register §5). ADR-03 (Unresolved): "Evaluate the hybrid model first, but
  do not select it until the current Runner architecture has been inspected
  under Stage V."
- **Timing:** Stage V is complete (Register, Stage 1 amendment entry
  criteria). ADR-03's precondition is therefore met **to the extent Stage V
  inspected Runner**. What Stage V inspected: repo documents, task records,
  `events.jsonl`, the cron definition file, and Runner scripts as cited
  (V1-C4 cites `claim.mjs:88-113`, `task-state.mjs:17-26`; V2, V3). What it
  did not: "The live cron body ... was not directly inspected" (Stage V, "What
  Stage V did NOT verify"). This builder did no further Runner inspection.

### What the evidence shows about the current Runner

- The execution record (`tasks/*.json`) already carries `project`, `repo`,
  `role`, `acceptance`, `evidence`, `blockers` (repo `tasks/schema.md`).
  So one of ADR-03's four associations — Project ID — already lives on the
  task, as a plain field.
- It carries **no** authorization reference, risk class, or verification
  requirement field (repo `tasks/schema.md`).
- Runner enforces transitions in code and treats illegal transitions as
  errors (repo `tasks/schema.md`; Stage V V1-C4).

### Options evaluated

| Option | On this evidence | Assessment |
|---|---|---|
| A — Extend Runner's schema with full project/authorization data | Would copy authorization scope, limits and verification requirements into execution records. Conflicts with Stage 1 spec 11 RS-2 ("Single authority per fact") and RS-1. Touches "critical execution infrastructure" (ADR-03). | Not proposed. |
| B — Linked records only; no new fields on tasks | Preserves Runner untouched, but Runner then cannot check RL-3 at submission, and a task's governing authorization is found only by searching project records. The existing `project` field already departs from pure B. | Not proposed as the target; it is the **current interim state** until a Runner change is authorized. |
| C — Hybrid | Runner holds execution-critical fields and *references*; project and authorization content stays in project records (Stage 1 spec 11 F-14 proposal). | **Proposed.** |

### Proposed resolution

- Adopt **option C (hybrid)** as the association model.
- **Execution record holds references only**, each by stable identifier and
  version where the target can change (Stage 1 spec 11 RS-3): project
  identifier (existing `project` field); authorization reference; risk class
  (a value from the spec 05 proposal, once decided); verification-requirement
  reference (pointing at the Task Brief's "Required tests and verification
  level").
- **Project and authorization content stays in project records.** Scope,
  limits, exclusions, approver and expiry are read from the authorization
  record, not copied (Stage 1 spec 03; spec 11 RS-2).
- **Runner uses the references to refuse, not to decide.** At submission,
  missing references fail RL-3. Runner never interprets authorization scope;
  that is coordination's and the verifier's job.
- **This is a Runner change.** Adding three reference fields to the task
  record schema touches `tasks/schema.md`, `task-state.mjs` and their tests.
  It needs a separate Founder authorization (ADR-03: "No Runner changes are
  authorized"). Until then, option B applies: references are recorded in the
  Task Brief and project records, and the verifier checks them.
- **Why C:** it keeps one authority per fact (Stage 1 RS-2), keeps Runner's
  change small (references, no new behavior beyond refusal), and makes every
  task traceable to its authorization from the execution record itself (Stage
  1 spec 06 EV-11).

## F-34 — Parallel execution default

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-34 "Parallel execution default". Recommended default:
  "Preserve parallel OFF; concurrency remains 1 unless separately authorized".
  Required before: Stage 2 and benchmark design. Status: Open (Register §5).
- **Current constraint:** "Parallel execution is OFF. Default worker
  concurrency is therefore 1. Any change requires the relevant governance
  decision and authorization" (Register §6, Resource limits). Repo
  `docs/runner-operations.md` §6 and `docs/atomic-claim.md` §5 state the same
  for the live runner.
- **Proposed resolution, as this relationship's concurrency rule:**
  1. At most one task is in `in_progress` across the runtime at any time, and
     at most one builder is dispatched at a time.
  2. One task per tick (repo `docs/runner-operations.md` §1).
  3. Verification of a completed run (step 7 above) does not count as a
     second execution worker, because a verifier does not write execution
     state or branches (spec 05). This is a clarification the Founder should
     confirm (open question 3), not an expansion.
  4. Raising concurrency needs: a Founder authorization naming the new limit;
     the GitHub-server race test the runner plan requires first (repo
     `docs/runner-operations.md` §6, trigger T1); and a re-opening of the D5
     outcome (spec 01, revisit triggers).
  5. A resource limit must be enforceable, not merely documented (Register §6).
     Today the limit is held by the single cron and single-worker policy.
- **What the Founder would be deciding:** that concurrency 1 is the recorded
  default for Stage 2 onward, changeable only by a separate authorization.

## Authority boundaries

- **Founder:** decides F-16, F-34 and the D5 outcome; authorizes any Runner
  change; holds merge to main (Register, Stage 2 amendment).
- **Muse:** composes, submits, dispatches after `WON`, requests transitions,
  coordinates verification. Does not write execution state outside Runner
  rules; does not verify its own coordination as independent verification.
- **Runner:** claims, transitions, events, reconcile, retry limits; refuses
  incomplete submissions once RL-3 is implemented.
- **Verifier:** evaluates; writes no execution state (spec 05).

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| RL-1 | As spec 01 MI-7 | Git history |
| RL-2, RL-3 | Each task record traces to a Task Brief and prior authorization | Task records; authorization records |
| RL-4 | Each dispatch follows a `WON` claim commit | `events.jsonl`; claim commits |
| RL-5, RL-6 | No acceptance cites only Runner status or a builder report | Verification reports; delivery records |
| RL-7, RL-8 | Walk one interrupted run end to end | Verification report |
| F-34 | Runner config/cron shows one worker; no overlapping `in_progress` runs in `events.jsonl` | Execution records (read-only check) |

## Open questions

1. Does the Founder accept option C, and if so, authorize the three-field
   Runner change separately — or keep option B as the steady state?
2. What does the live cron body do in step 6 (record outcome)? (Spec 01
   MI-12; Stage V G-13.)
3. F-34 item 3: does a read-only verifier session count against concurrency 1?
   This spec proposes not. The Register does not say.
4. Where is a submission rejected under option B, before the Runner change
   exists — by Muse's own check, which is not independent? Recorded as a
   limitation of the interim state.
5. Step 2 has Muse create a `queued` task record. Today the orchestrator
   writes that file directly (repo `tasks/schema.md`, "Who writes task
   records"). This spec reads submission through a defined path that applies
   RL-3 as Runner-mediated, not as Muse "independently" writing execution
   state (ADR-02). Whether the Founder reads it the same way, or wants
   creation itself performed by Runner code, is open.

## Explicitly NOT decided here

- F-16, F-34 (proposals only); the D5 outcome.
- Any Runner, schema, script, cron, or task-record change.
- Merge authority beyond what the Stage 2 authorization already states.
