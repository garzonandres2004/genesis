# Stage 1 — Context, records, authority and knowledge (spec index)

**Status of this directory:** Proposed (for review). Nothing here is
Founder-approved. Every spec below is **Proposed** in the sense of Register
§1 "Approval terminology": recommended, not approved.

**Authorization:** Stage 1 execution was authorized by the Founder on
2026-11-05 ~20:59 MST (widget widget-ba60691e, "Approve Stage 1"), recorded in
the Register's "Amendment — Stage 1 execution authorized 2026-11-05". That
authorization covers the 11 CR-04 deliverables as reviewed specs. It does not
authorize Stage 2, Stage 3, Stage S, Stages 4–7, Stage R, SIE implementation,
spending, production contact, deployment, or merge to main (merge stays
founder-only) (Register, Stage 1 amendment; Brief, "What this decision does
NOT do").

**Nothing in `docs/stage-1/` decides an open finding.** The 29 open findings
(F-05–F-14, F-16–F-17, F-19–F-32, F-34–F-36) remain OPEN (Register, Stage 1
amendment, scope limits). Where a spec proposes a resolution, it is labeled
**PROPOSED — Founder decision pending, not decided**.

## Sources

| Short name | Document | Where it is |
|---|---|---|
| Register | Genesis Architecture Reconciliation & Founder Decision Register v1.2.1. Status: Canonical, adopted 2026-11-05 by Founder decision (B1). Read in the version that already contains the "Amendment — Stage 1 execution authorized 2026-11-05". | Outside this repo (Founder workspace files). This repo holds no copy. |
| Brief | Genesis — Stages 1–3 Brief. Status: APPROVED 2026-11-05 ~20:59 MST for Stage 1 only. | Outside this repo (orchestrator goal files). |
| Repo docs | `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/policy.md`, `tasks/schema.md` | This repo |

Citations in the specs read "Register §N", "Register CR-NN", "Register
ADR-NN", "Register §10 Dn", "Register, Stage 1 amendment", "Brief", or a repo
path. The North Star, Operating Model, Muse Handoff, Evaluation Catalog,
Roadmap and Capability & Gap Assessment were **not** available to the builder.
Where the Register points into them (for example "Muse Handoff §7 contains
important project-record material", Register CR-04), the specs record the gap
instead of guessing their content.

The builder could not compute a SHA-256 of the Register or Brief from its
sandbox. The verifier should record the hash of the Register version these
specs were checked against.

## The 11 specs (CR-04 order)

| # | File | Covers | Status |
|---|---|---|---|
| 1 | [01-project-identity.md](01-project-identity.md) | Project identity and persistent project context. Holds the F-05 proposal. | Proposed (for review) |
| 2 | [02-decision-register.md](02-decision-register.md) | Decision register and approval status. Holds the F-14 proposal (decision records). | Proposed (for review) |
| 3 | [03-authorization-record.md](03-authorization-record.md) | Authorization record model. Holds the F-30 proposal (authorizations). | Proposed (for review) |
| 4 | [04-project-knowledge-boundary.md](04-project-knowledge-boundary.md) | Project-specific knowledge boundary. | Proposed (for review) |
| 5 | [05-global-knowledge-boundary.md](05-global-knowledge-boundary.md) | Global knowledge boundary. | Proposed (for review) |
| 6 | [06-evidence-provenance.md](06-evidence-provenance.md) | Evidence provenance and traceability. | Proposed (for review) |
| 7 | [07-context-freshness.md](07-context-freshness.md) | Context freshness and versioning. | Proposed (for review) |
| 8 | [08-ownership-amendment.md](08-ownership-amendment.md) | Ownership and amendment rules. Holds the full F-30 proposal. | Proposed (for review) |
| 9 | [09-access-permissions.md](09-access-permissions.md) | Access and permission requirements. | Proposed (for review) |
| 10 | [10-muse-runner-information.md](10-muse-runner-information.md) | Muse-to-Runner information requirements. | Proposed (for review) |
| 11 | [11-records-separation.md](11-records-separation.md) | Separation between project records and execution records. Holds the full F-14 proposal. | Proposed (for review) |

Every spec has the same sections: Purpose; Scope; Requirements; Authority
boundaries; Evidence and traceability; Open questions; Explicitly NOT decided
here.

## Open Stage 1 findings: where the proposals are

Stage 1's exit criteria require proposed resolutions to be recorded for F-05,
F-14 and F-30 (Register, Stage 1 amendment; Brief, exit criteria). They are
proposals only.

- **F-05 (Stage 1 scope)**, Register §5 default "Include authority, records,
  evidence, and knowledge boundaries", status Open. **PROPOSED — Founder
  decision pending, not decided:** the 11-item CR-04 list, as written in this
  index, *is* the proposed Stage 1 scope. See `01-project-identity.md` §F-05.
  Note: the Founder's Stage 1 authorization already names these 11
  deliverables as the work to be done (Register, Stage 1 amendment). The
  builder does not read that as a decision on F-05. Whether the authorization
  also closes F-05 is a Founder question, recorded in 01's open questions.
- **F-14 (project-record storage)**, Register §5 default "Decide after
  Stage V", required before "Stage 1 implementation", status Open.
  **PROPOSED — Founder decision pending, not decided:** see
  `11-records-separation.md` (paths, format, ownership) and
  `02-decision-register.md` (decision records).
- **F-30 (decision amendment rights)**, Register §5 default "Founder controls
  strategic/governance amendments; delegated amendments must be bounded",
  status Open. **PROPOSED — Founder decision pending, not decided:** see
  `08-ownership-amendment.md` (full tier model) and `03-authorization-record.md`
  (amending authorizations).

## Constraints every spec observes

- Canonical labels are used exactly as the Register records them (D1–D8,
  F-xx, CR-xx, ADR-xx, Stage 0/V/1–7/S/DB/R). Nothing is renamed or renumbered.
- Stage 1 defines requirements and authority boundaries only. The detailed
  runtime and interface design is finalized between Stage 1 and Stage 2,
  after the Muse identity question (ADR-02, D5) is resolved (Register CR-04).
  No spec assumes an API boundary, separate service, second state database or
  storage product (Register §10 D5).
- D2's verifier model is not weakened. D6's contract is not declared final.
  The SIE design stays approved in principle only (Brief).
- No record files, directories, schemas or code are created by Stage 1 under
  this authorization. The F-14 proposal names paths; it does not create them.

## Verification

Per D2 and the Stage 1 authorization: a separate verifier independent of the
builder reviews this directory; a verifier FAIL blocks acceptance and merge;
governance items get human review; the Founder retains strategic acceptance
(Register, Stage 1 amendment; Register §10 D2). These specs touch governance,
so under D2's approved wording ("Human review is required for high-risk,
security, governance, and first-product decisions") human review applies.
