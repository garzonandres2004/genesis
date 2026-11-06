# Stage 3 — Self-Improvement Engine (SIE) (spec index)

**Status of this directory:** Proposed (for review). Nothing here is
Founder-approved. Every document below is **Proposed** in the sense of
Register §1 "Approval terminology": recommended, not approved. Nothing here is
verified until the independent verification described below has run and its
report is recorded.

**Authorization:** Stage 3 execution was authorized by the Founder on
2026-11-06 ~09:40 MST by approving the §11 authorization boundary of the
Stage 3 Execution Brief: SIE implementation + Milestone A demonstration only,
tasks T0–T8 in sequence, under the D6 contract, with verification per D2. At
the time of writing, the copy of Register v1.2.1 read by the builder carries no
"Stage 3 execution authorized" amendment; recording it there is outside T0.

That authorization does **not** authorize: Milestone B or any Group C test,
validated lesson, reuse claim, or improvement claim; SIE Phase 2 or Phase 3
work; the first live loop; any merge to main (merge stays founder-only, after
verification passes and the required check is green); any deploy,
provisioning, or spending; any production contact; any Runner change; any new
model provider, subscription, server, agent, or infrastructure; any database
work; deciding any open finding; deciding the WP-04 verbatim points; any Stage
S, Stage 4–7, or Stage R work (Brief §11, "EXPLICITLY NOT AUTHORIZED").

**Nothing in `docs/stage-3/` decides an open finding.** F-36, F-14, F-10,
H1–H6, SIE-01–SIE-07 and every other open item remain OPEN. Where a document
proposes a resolution or a working assumption, it is labeled as such.

**No operational evidence and no live loop.** Nothing in this directory claims
operational evidence, and nothing in it authorizes or starts the first live
loop (Specification §15, §20).

## Sources

| Short name | Document | Where it is |
|---|---|---|
| Register | Genesis Architecture Reconciliation & Founder Decision Register v1.2.1. Status: Canonical, adopted 2026-11-05 (B1). 1,414 lines as read. | Outside this repo (Founder workspace files). This repo holds no copy. |
| Brief | Genesis Stage 3 Execution Brief (§11 boundary approved 2026-11-06 ~09:40 MST). | Outside this repo (orchestrator goal files). |
| Prep | Genesis SIE Implementation Preparation — DRAFT and PROPOSED (626 lines). | Outside this repo (Founder workspace files). |
| Addendum | Genesis SIE Implementation Preparation — Correction Addendum — DRAFT and PROPOSED (CR-01–CR-04). Governs over Prep where they disagree. | Outside this repo (Founder workspace files). |
| Advisor | Relayed advisor direction, 2026-11-06 (copy verified against source; its 7 decisions and Phase 1/2/3 breakdown are proposals). | Outside this repo (orchestrator goal files). |
| WP-04 | SIE baseline WP-04 v1.1 (REVIEW PASSED, PROPOSED). | **Not available to the builder** — in the ChatGPT planning conversation only. |
| Stage 1 / Stage 2 specs | `docs/stage-1/`, `docs/stage-2/` (merged PRs #34, #35). | This repo |

The builder did not compute SHA-256 hashes of the out-of-repo sources. The
verifier should record the hashes of the versions it checks against.

**The WP-04 gap.** No WP-04 v1.1 text was available. Every statement the Prep
attributes to WP-04 is carried as **[REF] — unverified against WP-04
verbatim**. All eight Brief §2.2 verbatim points are flagged as still missing
(Specification §2), and the tasks that depend on them carry the gap.

## Documents

| # | File | Covers | Status |
|---|---|---|---|
| 0 | [00-sie-specification.md](00-sie-specification.md) | The single consolidated SIE Specification (task T0): scope and milestones, the SIE phase reconciliation (§1.3), the eight WP-04 verbatim points (§2), standards preserved, CR-09 vocabulary, detector R1–R6, incident lifecycle, watch, validation, lessons, evidence links, record location (working assumption), INDEX, fixtures, Group A/B tests, procedure and first-live-loop limits, conflicts surfaced (§17), open items (§19). | Proposed (for review) |
| — | [T0-builder-report.md](T0-builder-report.md) | Builder Report for T0 (D6 additions). A claim to be checked, not evidence. | Builder claim |

Later Stage 3 tasks (T1–T8) add their artifacts here or at the locations the
Specification names, each on its own verification cycle.

## Provenance labels used

- **[DECIDED]** — D1–D8 approved wording (Register §10), B1/B2, or the Stage 3
  authorization; the decision is named each time.
- **[REF]** — attributed to WP-04 v1.1; in this directory always a
  reconstruction carried from the Prep, unverified.
- **[P]** — proposal (Prep, Addendum, Stage 2 spec, Advisor, or the
  Specification itself), source named.
- **[OPEN]** — undecided; owner and unblocking condition in Specification §19.

"Register CR-nn" and "addendum CR-0n" are always written in full: the two
documents use the same CR numbers for unrelated items.

## What these documents do not decide

- F-36 (reuse judgment), F-14 (record storage — the SIE record location is a
  working assumption), F-10 (vocabulary — CR-09 values used as a working rule),
  F-16, F-21, F-23, F-34, H1–H6, SIE-01–SIE-07, the D2 operational model, the
  D5 outcome, the D6 Catalog version.
- The SIE phase breakdown beyond Stage 3's working use. The Stage 3 exit rule
  is "Milestone A demonstrated" (D1; Register §2/§8), which does not depend on
  how WP-04 defines SIE phases (Specification §1.3, conflict C-1).
- Any WP-04 wording — confirmed only by quotation, never by approval.

## Verification

Per D2 and the Stage 3 authorization (Brief §8): T0 is classified
**Governance** (Brief §9 T0), so human review is required in addition to
independent verification. The verifier (Codex, text-supplied, read-only, per
Brief §8.2) receives the exact commit, the Task Brief, and the Builder Report
labeled as claims; it forms findings from the artifact and the Task Brief
first. A verifier FAIL blocks acceptance and merge. Corrected artifacts are
re-verified by a new verifier session. Merge is the Founder's decision after
verification passes and the required check is green.

The Stage 2 verifier model (`docs/stage-2/05-verifier-identity-runtime.md`,
VI-1–VI-25) is the working method, not decided law; the verifier should state
its own independence (VI-9 as a checklist).
