# Stage 2 — Complete engineering workflow (spec index)

**Status of this directory:** Proposed (for review). Nothing here is
Founder-approved. Every spec below is **Proposed** in the sense of Register
§1 "Approval terminology": recommended, not approved.

**Authorization:** Stage 2 execution was authorized by the Founder on
2026-11-06 ~01:04 MST ("yes continue", in reply to Muse's "Stage 2 is next
whenever you want it" after PR #34 merged), recorded in the Register's
"Amendment — Stage 2 execution authorized 2026-11-06". That authorization
covers the seven Stage 2 work items as reviewed specs. It does not authorize
Stage 3, Stage S, Stages 4–7, Stage R, SIE implementation, spending,
provisioning, repo access outside Genesis, production contact, deployment, or
merge to main (merge stays founder-only) (Register, Stage 2 amendment; Brief,
"What this decision does NOT do"). The SIE design stays approved in principle
only (Brief).

**Nothing in `docs/stage-2/` decides an open finding.** The open findings
remain OPEN (Register, Stage 2 amendment, scope limits). Where a spec proposes
a resolution, it is labeled **PROPOSED — Founder decision pending, not
decided**. F-04 is already decided under D6; spec 04 records that decision and
its one remaining open item, and does not re-decide it.

## Sources

| Short name | Document | Where it is |
|---|---|---|
| Register | Genesis Architecture Reconciliation & Founder Decision Register v1.2.1. Status: Canonical, adopted 2026-11-05 by Founder decision (B1). Checked against the version containing the "Amendment — Stage 2 execution authorized 2026-11-06": SHA-256 `08609ae547c4798fd756b73d918d23f9b201be64d9d50986b4c490ecbec56dfb`, 1,413 lines. | Outside this repo (Founder workspace files). This repo holds no copy. |
| Brief | Genesis — Stage 2 Authorization Brief. Status: AUTHORIZED 2026-11-06 ~01:04 MST. | Outside this repo (orchestrator goal files). |
| Stage V report | Stage V — Read-Only Verification Report (B2 execution, 2026-11-05). Cited by claim id (for example V1-C5) and finding id (for example G-12). | Outside this repo (orchestrator goal files). |
| Stage 1 specs | `docs/stage-1/01`–`11` and `README.md` (merged PR #34, f80cc26) | This repo |
| Repo docs | `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/policy.md`, `tasks/schema.md`, `docs/runner-operations.md`, `docs/runner-wiring.md`, `docs/atomic-claim.md`, `docs/crash-pr-recovery.md` | This repo |

The builder could not compute a SHA-256 from its sandbox; the Register hash
above is the value supplied by the coordinator. The verifier should confirm
it against the file.

The Stage V report is used because ADR-03 makes the hybrid evaluation depend
on Stage V's Runner inspection, and the Register itself does not record
Stage V's findings. Specs 01 and 02 cite only what that report states it
inspected, and repeat what it states it did not inspect (the live cron body).
No new Runner inspection was done for Stage 2.

Citations read "Register §N", "Register CR-NN", "Register ADR-NN", "Register
§10 Dn", "Register §5 F-NN", "Register, Stage 2 amendment", "Brief", "Stage V
report" (with claim or finding id), "Stage 1 spec NN", or a repo path. The
North Star, Operating Model, Muse Handoff, Evaluation Catalog, Roadmap and
Capability & Gap Assessment were **not** available to the builder. Where the
Register points into them (for example the CR-03 contract fields sourced from
Operating Model §5.5/§5.6, or Evaluation Catalog §7), the specs use the
Register's own reproduction and record the gap instead of guessing.

## The 7 specs (Stage 2 work-item order)

| # | File | Covers | Status |
|---|---|---|---|
| 1 | [01-muse-identity.md](01-muse-identity.md) | Muse identity resolution: the ADR-02 sequence under D5; proposed (not decided) outcome. | Proposed (for review) |
| 2 | [02-muse-runner-relationship.md](02-muse-runner-relationship.md) | Muse–Runner relationship; ADR-03 A/B/C evaluated. Holds the F-16 and F-34 proposals. | Proposed (for review) |
| 3 | [03-interface.md](03-interface.md) | Interface finalization: ADR-02 required capabilities; form conditional on D5 outcome, not selected. | Proposed (for review) |
| 4 | [04-contracts.md](04-contracts.md) | Contracts (D6, CR-03). Records F-04 (decided under D6). Holds the F-13 proposal. | Proposed (for review) |
| 5 | [05-verifier-identity-runtime.md](05-verifier-identity-runtime.md) | Verifier identity and runtime: ADR-05 items (a)–(h); risk classes. Holds the F-10 proposal. | Proposed (for review) |
| 6 | [06-research-capability.md](06-research-capability.md) | Research capability (ADR-06). Holds the F-19 proposal. | Proposed (for review) |
| 7 | [07-escalation-model.md](07-escalation-model.md) | Escalation model; builder–verifier disagreement. Holds the F-21 proposal. | Proposed (for review) |

Every spec has the same sections as Stage 1: Purpose; Scope; Definitions used
(where needed); Requirements; Authority boundaries; Evidence and
traceability; Open questions; Explicitly NOT decided here.

## Stage 2 findings: where the proposals are

Stage 2's exit criteria require proposed resolutions to be recorded for F-04,
F-10, F-13, F-16, F-19, F-21 and F-34, "for Founder decision where they are
his" (Register, Stage 2 amendment; Brief, exit criteria).

- **F-04 (handoff contract fields)** — **already decided**: APPROVED WITH
  AMENDMENTS 2026-10-30 (D6) (Register §5). Not re-decided. Remaining open:
  the exact Evaluation Catalog version (D6 condition; Stage V G-12). See
  `04-contracts.md` §F-04.
- **F-10 (verdict and lesson vocabulary)** — **PROPOSED — Founder decision
  pending, not decided.** Five separate status systems (the four in CR-09
  plus the Stage V claim-assessment set). See `05-verifier-identity-runtime.md`
  §F-10.
- **F-13 (evaluation taxonomy)** — **PROPOSED — Founder decision pending, not
  decided.** CR-12 field structure; domain count follows F-35; evidence levels
  named, evaluation levels "L"-prefixed. See `04-contracts.md` §F-13.
- **F-16 (Runner extension)** — **PROPOSED — Founder decision pending, not
  decided.** ADR-03 option C (hybrid), references only on the execution
  record; the Runner change needs separate authorization; option B is the
  interim state. See `02-muse-runner-relationship.md` §F-16.
- **F-19 (research-agent access)** — **PROPOSED — Founder decision pending,
  not decided.** Capability-based model; baseline methods with no new provider
  or spend; per-provider Founder approval. See `06-research-capability.md`
  §F-19.
- **F-21 (delegated approval)** — **PROPOSED — Founder decision pending, not
  decided.** ADR-09's three levels; delegates are humans only; never-delegable
  list includes every protected action. See `07-escalation-model.md` §F-21.
- **F-34 (parallel execution default)** — **PROPOSED — Founder decision
  pending, not decided.** Concurrency 1 unless separately authorized. See
  `02-muse-runner-relationship.md` §F-34.

Two further items are proposed because Stage 2 must define them, though they
are not on the F-list above:

- **D5 architecture outcome** (Register §10 "Remaining open items" item 5) —
  **PROPOSED — Founder decision pending, not decided.** Muse and Runner as
  logical roles within one runtime, with an explicit, checkable authority
  boundary. See `01-muse-identity.md`.
- **ADR-05 pre-Stage-2 definitions, including D2 risk classes** (Register §10
  D2 open definition; "Remaining open items" item 6) — **PROPOSED — Founder
  decision pending, not decided.** See `05-verifier-identity-runtime.md`.

## Constraints every spec observes

- Canonical labels are used exactly as the Register records them (D1–D8,
  F-xx, CR-xx, ADR-xx, Stage 0/V/1–7/S/DB/R). Nothing is renamed or
  renumbered.
- No spec assumes an API boundary, separate service, second state database
  or storage product (Register §10 D5). Spec 01 proposes an outcome; spec 03's
  interface form is stated only as conditional on it.
- Stage 2 defines requirements and architecture only. No runtime, schema,
  code, record directory or Runner change is created. "No Runner changes are
  authorized" (Register ADR-03).
- D2's verifier model is not weakened: a verifier FAIL blocks acceptance and
  merge, with no exception. Current orchestrator verification is not
  relabeled as independent verification (Register ADR-05).
- D6's contract is not declared final. Evaluation Catalog §7 is referenced,
  not narrowed.
- No escalation or delegation path authorizes a protected action without the
  Founder.
- No SIE content beyond what the Register states. No Stage 3, Stage S,
  benchmark or Stage R content; F-08 and F-09 are out of scope.
- Where Stage 2 refines a Stage 1 statement, the spec says so and cites both
  (for example spec 05 (c) answers Stage 1 spec 09 open question 1; spec 05
  F-10 answers Stage 1 spec 06 open question 1). No Stage 1 spec is changed.

## Verification

Per D2 and the Stage 2 authorization: a separate verifier independent of the
builder reviews this directory; a verifier FAIL blocks acceptance and merge;
high-risk and governance items get human review; the Founder retains
strategic acceptance (Register, Stage 2 amendment; Register §10 D2). These
specs propose governance rules (verification, escalation, delegation), so
under D2's approved wording ("Human review is required for high-risk,
security, governance, and first-product decisions") human review applies.

The verifier for this directory is not yet defined by the rules it reviews:
spec 05's proposals are not decided, so they cannot be the standard this
directory is held to. The verifier should state its own independence (spec 05
VI-9 is offered as a checklist, not a requirement) and record the Register
hash it checked against.
