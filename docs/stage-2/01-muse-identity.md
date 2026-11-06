# 01 — Muse identity resolution

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 1 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D5 (APPROVED — decision process only;
  architecture outcome open), ADR-02, ADR-03, F-16, F-34.

## Purpose

Apply the decision process the Founder approved under D5 to the question
ADR-02 asks — "What is Muse operationally, and is Muse a separate system from
Runner or a distinct role operating within the same system?" — and put a
**proposed** architecture outcome in front of the Founder.

D5's approved wording: "Determine Muse and Runner identities,
responsibilities, topology, authority boundaries, and communication mechanism
before specifying interfaces. Do not assume an API, separate service, second
state database, or storage product. Choose the simplest architecture that
satisfies authority separation, persistence, auditability, recovery, and
isolation" (Register §10 D5).

D5 approved the **process only**. "The architecture outcome itself (separate
systems vs. roles, and any communication mechanism) is still OPEN" (Register
§10 D5, scope of this approval). This spec does not decide it. Everything in
the "Proposed outcome" section below is **PROPOSED — Founder decision
pending, not decided**.

## Scope

**Covers:**
- The five steps of the ADR-02 required design sequence, in order.
- The options for step 3 (topology), assessed against D5's five criteria.
- A proposed outcome for the Founder to decide.

**Does not cover:**
- Interfaces. ADR-02: "Only after these decisions should the design specify
  interfaces." See `03-interface.md`, which is conditional on this spec.
- How project/authorization references attach to Runner tasks (ADR-03,
  F-16). See `02-muse-runner-relationship.md`.
- Any change to Runner, task records, scripts or crons. "No Runner changes are
  authorized" (Register ADR-03).

## Definitions used

- **Muse** — the coordination responsibility. Register §1 principle 4: "Muse
  coordinates work but does not own execution state."
- **Runner** — the execution-state responsibility. Register §1 principle 5:
  "Runner owns durable execution state and task transitions."
- **Separate systems** — independently deployed and operated systems with a
  network or service boundary between them.
- **Separate processes** — distinct operating-system processes on one host,
  each with its own lifecycle, communicating through a process boundary.
- **Logical roles within one runtime** — responsibilities held by one
  operating runtime, separated by rules and by which code paths may perform
  which writes, not by a process or network boundary.

These three are the alternatives ADR-02 step 3 names ("separate systems,
separate processes, or logical roles within one runtime"). The definitions
above are this spec's working reading; the Register does not define them
further.

## Evidence used

| Source | What it shows |
|---|---|
| Register ADR-02 | "Current practice describes the orchestrator as the Runner operator. The architecture must not assume that the present relationship is already a networked two-system design." |
| Stage V report, V1-C1 (Contradicted) | Muse-as-orchestrator verified; Runner-as-owner "is not what the repo shows: the orchestrator writes task records and owns PRs/merges". "Runner" exists "as tooling the orchestrator runs", not as a separate owner. |
| Stage V report, V1-C3 (Verified) | Communication as implemented: task JSON + `events.jsonl`, claim commit, CLI JSON-line stdout + exit codes, branches/PRs, evidence/PR-URL fields. "No API, queue, or service." |
| Stage V report, V1-C4 (Not Assessed, partially met) | Claim-before-dispatch and legal-transition enforcement exist in code; "separation of Muse from Runner state ownership" is "Not enforced ... since one actor holds both roles". The live cron body was not read. |
| Stage V report, V1-C5 (Unverified — reported, NOT decided) | The repo "is consistent with a separate-roles-in-one-runtime shape" but this "does not settle the question". |
| Repo `docs/architecture.md` | Phase 1: "Muse-native orchestration, no new engine"; task state in `tasks/*.json` in git; one orchestrator writes task records. |
| Repo `docs/runner-operations.md` §1 | The live execution path: preflight, claim, dispatch, orchestrator verification, record, adopt, PR, CI wait, merge — all run by the orchestrator on one cron. |
| Repo `tasks/schema.md` | Legal state transitions ("Any other transition is illegal and throws"); only the orchestrator and the reconciler write `tasks/`. |

The Stage V report is held outside this repo (orchestrator goal files; see
`README.md`, Sources). This builder read its V1 section and repo documents. It
did **not** inspect the live cron body, Runner code paths beyond their
documentation, or any runtime. Nothing here is a new Runner inspection.

## Step 1 — Muse's operational identity and responsibilities

- **MI-1 Muse is the coordinator.** Responsibilities: hold and maintain
  persistent project context as recorder (Stage 1 spec 01 PI-5, spec 08);
  prepare decision and authorization briefs; record Founder decisions verbatim
  (Stage 1 spec 02); compose Task Briefs (`04-contracts.md`); submit authorized
  work (MR-4); read authorized execution state and results (MR-8, MR-9);
  coordinate — but not perform — independent verification (ADR-05: Muse
  "coordinates verification but is not automatically the verifier"); escalate
  (`07-escalation-model.md`).
  *Test:* every Muse responsibility above traces to a Register or Stage 1
  citation; none is an approval, an authorization grant, or an execution-state
  write.
- **MI-2 Muse is not an approver.** Muse may not approve decisions,
  authorizations, amendments, acceptance, or its own work (Register §1
  principles 3 and 6; Stage 1 spec 08 Tier R).
- **MI-3 Muse is not the execution-state authority** and "must not become a
  competing task database" (Register ADR-01).

## Step 2 — Runner's operational identity and responsibilities

- **MI-4 Runner is the execution-state authority.** Responsibilities: task
  claims, task state transitions, run and attempt accounting, the append-only
  event log, reconciliation of interrupted runs, retry limits, and
  side-effect idempotency (Register §1 principle 5; repo `tasks/schema.md`;
  `docs/runner-operations.md`; `docs/atomic-claim.md`).
- **MI-5 Runner's identity is its rules, not a person or agent.** As
  implemented, Runner is "a set of scripts (`claim.mjs`, `reconcile.mjs`,
  `pr-recovery.mjs`, `preflight.mjs`, `task-state.mjs`) plus a 30-minute cron"
  (Stage V report, V1). This spec reads Runner's operational identity as that
  rule set and the execution records it governs.
- **MI-6 Runner does not decide direction or authorization** (Stage 1 spec 10,
  Authority boundaries).

## Step 3 — Topology: options assessed

D5 names five criteria. Each option is assessed against them on the evidence
above.

| Criterion | (A) Separate systems | (B) Separate processes, one host | (C) Logical roles, one runtime |
|---|---|---|---|
| Authority separation | Strongest in principle (network boundary). Not present today. | Process boundary; still one host, one VM, shared filesystem (repo `docs/policy.md` §9: "No sandbox on this VM"). | Separation by rule and code path only. Stage V V1-C4: "Not enforced" today because one actor holds both roles. Needs MI-9–MI-12 to be real. |
| Persistence | Needs a store per system; D5 forbids assuming one. | Same store (git) shared; no gain. | Git-backed task records, already durable on this VM (repo `docs/architecture.md`). |
| Auditability | Adds a cross-system trail to keep consistent. | Same git trail. | Git history + `events.jsonl` + PRs (Stage V V1-C3). |
| Recovery | Each system needs its own recovery; distributed failure modes. | Process-supervision added; VM replacement still loses processes. | Existing reconcile and adopt paths (repo `docs/runner-operations.md` §2–§3; Stage V V3). |
| Isolation | Strong between the two; does not by itself isolate projects (ADR-10). | Weak (shared host). | Weak between Muse and Runner; project isolation by records and authorization (Stage 1 specs 04, 09). |
| New infrastructure | Requires a service and likely a database or API — excluded from assumption by D5; needs Founder approval (repo `AGENTS.md` "Code"). | Requires a supervised long-lived process; none exists. | None. |

## Proposed outcome

**PROPOSED — Founder decision pending, not decided.**

- **Topology:** Muse and Runner are **logical roles within one runtime** —
  option (C). This is the shape the repo already has (Stage V V1-C5,
  reported) and the simplest option that can satisfy D5's five criteria,
  **provided** the authority boundary is made explicit and checkable (MI-9 to
  MI-12). Without those, option (C) does not meet "authority separation", and
  this proposal should not be adopted.
- **Why not (A) or (B):** each adds infrastructure (a service, a second store
  or a supervised process) that D5 says not to assume, and neither is needed
  at concurrency 1 (F-34 default, Open; `02-muse-runner-relationship.md`).
- **What the Founder would be deciding:** that Genesis treats Muse and Runner
  as roles in one runtime, with Runner's authority held by its rule set and
  execution records, and with MI-9–MI-12 as the boundary. That decision would
  close the D5 outcome item in Register §10 "Remaining open items" (item 5).
- **Revisit triggers (proposed):** the outcome is re-opened by any of: an
  authorization for parallel execution (F-34); Stage 6 multi-factory design
  (ADR-10: "A shared Muse service must not imply shared project authority,
  credentials, private context, or execution state"); Stage 7 external users;
  or evidence that rule-based separation failed (a Muse write to execution
  state outside Runner rules).

## Step 4 — Authority boundary (applies under the proposed outcome)

- **MI-7 Execution-state writes go only through Runner rules.** Every change
  to `tasks/*.json` state fields or to `events.jsonl` is made through Runner's
  transition and claim code (repo `tasks/schema.md`, State transitions), never
  by hand edit. ADR-02: "Muse must not bypass Runner's claim and
  task-transition rules or independently write execution state."
  *Test:* in the git history of a task, every status change and event line is
  attributable to a Runner code path (script output, claim commit, reconcile
  output). Hand edits are a finding.
- **MI-8 Holding both roles is declared, not hidden.** Because one runtime
  holds both roles, every record or report that relies on the separation states
  that it is rule-based, not process- or network-based. Stage V V1-C4 already
  records "Not enforced" for the current state; that limit stays visible until
  MI-9–MI-12 are evidenced.
- **MI-9 Muse acts on execution state only by request.** Muse may submit a
  task, request a transition Runner's rules allow (for example "orchestrator
  unblocks", `tasks/schema.md`), and read state. It may not set a status,
  write an event, or claim a task by any path other than those rules.
- **MI-10 Runner rules reject what they do not allow.** Illegal transitions
  throw (repo `tasks/schema.md`). *Test:* existing tests for
  `task-state.mjs` and `claim.mjs` pass (`npm test`); any new boundary rule
  lands as code plus tests (repo `AGENTS.md`, "Code").
- **MI-11 Acceptance and merge are not Runner transitions.** Runner's
  `completed` status records that acceptance was verified with evidence
  (`tasks/schema.md`); it does not grant acceptance. Acceptance follows D2
  (verifier FAIL blocks; human review by risk class; Founder retains strategic
  acceptance) — see `05-verifier-identity-runtime.md`.
- **MI-12 Gap: the boundary is not yet evidenced.** Whether every current
  orchestrator write to `tasks/` passes through Runner code is **not
  established**: the live cron body was not read (Stage V V1-C4, G-13), and
  `docs/runner-operations.md` §1 step 6 says the orchestrator "records the run
  outcome ... in the task record" without naming the code path. Closing
  evidence: a read of the cron body and a walk of task-record commits. This is
  recorded as a gap; Stage 2 does not generate it.

## Step 5 — Communication and state-transition mechanism

Under the proposed outcome, the mechanism is the one Stage V verified as
implemented (V1-C3): git-versioned task records and `events.jsonl`; the claim
commit; CLI one-line JSON on stdout plus exit codes; branches and pull
requests; evidence and PR-URL fields in the task record. No API, queue, or
service is introduced. **PROPOSED — Founder decision pending, not decided**,
and conditional on the topology proposal above. If the Founder chooses (A) or
(B) instead, this step must be redone before any interface is specified.

## Authority boundaries

- **Founder:** decides the D5 outcome (this spec's proposal) and any Runner
  change (ADR-03).
- **Muse:** prepares the decision package; may not adopt the outcome or act as
  though it were adopted.
- **Runner:** unchanged. No Runner change is made or authorized by this spec.
- **Builder (this spec's author):** wrote a proposal; decides nothing.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| MI-1–MI-6 | Each responsibility cites Register or Stage 1 basis | This spec; verification report |
| MI-7, MI-9 | Walk task-record and `events.jsonl` history; every state change maps to a Runner code path | Git history; verification report (after a Founder decision and authorization) |
| MI-8 | Reports relying on separation state its rule-based nature | Verification reports |
| MI-10 | `npm test` covering `task-state.mjs`, `claim.mjs` | CI and local test output |
| MI-12 | Gap stays listed until closing evidence is recorded | Open questions below |

## Open questions

1. Does the Founder accept option (C) with MI-7–MI-12 as the boundary, or
   prefer (A) or (B)? (D5 outcome; Register §10 "Remaining open items" item 5.)
2. MI-12: what does the live cron body do when it records a run outcome — does
   it call Runner code or edit the record? (Stage V G-13.)
3. The Operating Model (Muse "Chief Orchestrator", Runner "Execution
   Authority", per Stage V V1 document-versus-live comparison) and the Muse
   Handoff were not available to this builder. Their full role definitions may
   add responsibilities not listed in MI-1 or MI-4.
4. Register ADR-12 (Proposed; F-24 Open) assigns "Roles, authority, and
   operating process" to the Operating Model. If the Founder adopts this
   outcome, does the Operating Model need revising to match? Register §7
   already lists "clarify runtime identity" as a Muse Handoff revision.

## Explicitly NOT decided here

- The D5 architecture outcome. The proposal above is not a decision.
- Any interface, API, message, transport or command form (`03-interface.md`).
- F-16 / ADR-03 option; F-34. Any Runner, cron, script or task-record change.
- Any storage product, service, or second state database.
