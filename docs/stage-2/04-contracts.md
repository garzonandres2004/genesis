# 04 — Contracts

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 4 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D6 (APPROVED WITH AMENDMENTS), F-04
  (decided under D6; record below), F-13 (proposal below), F-35, CR-03,
  CR-12.

## Purpose

Set out the handoff contract objects — Task Brief, Builder Report,
Verification Report, Delivery Record, and the separate Evaluation Evidence
Package — exactly as D6 approved them, show where each sits in the Stage 2
workflow, and state precisely what keeps the contract from being final.

## D6 position (stated exactly)

- **Source fields: approved.** D6: "the source requirements are approved"
  (Register CR-03, Founder decision note).
- **Additions: approved individually**, each with the applicability rule in
  the D6 record (Register §10 D6, "Approved additions and applicability
  rules"). Listed below per object.
- **Not final.** "The contract is not final until the exact Evaluation Catalog
  version is identified (D6 condition)" (Register CR-03). "Appendix A cites
  'Genesis Evaluation & Benchmark Test Catalog v1, §7'; confirming that
  citation as the exact canonical version is still required before the
  contract is final" (Register §10 D6, adoption conditions).
- **No invented source material.** "Do not invent missing source material"
  (Register §10 D6). The Operating Model §5.5/§5.6 and the Muse Handoff, which
  CR-03 cites as the field sources, were not available to this builder. The
  field lists below are taken from the Register's reproduction of them, not
  from those documents.

This spec reproduces the Register's lists so the contract is readable in one
place. Where this spec and the Register differ, the Register governs.

## Scope

**Covers:**
- The five contract objects, their fields as recorded in Register CR-03 and
  §10 D6, and the D6 applicability rules.
- Which role produces and consumes each object.
- The F-04 record and the F-13 proposal.

**Does not cover:**
- Storage or file format of contract objects (F-14; Stage 1 spec 11).
- Defining or narrowing Evaluation Catalog §7. Appendix A is referenced, not
  restated (CT-11).
- Risk-class values (spec 05) or verdict vocabulary (F-10, spec 05), except
  where the contract names the field.

## Requirements

### Task Brief — produced by Muse, consumed by builder, Runner, verifier

- **CT-1 Source fields (approved).** Project and task identity. Objective and
  expected outcome. Inputs. Evidence requirements. Expected output and
  expected artifacts. Acceptance criteria. Authorized scope and exclusions.
  Repository and environment identity. Starting commit or artifact version.
  Dependencies. Required tests and verification level. Risk classification.
  Authorization reference. Escalation conditions. (Register CR-03.)
- **CT-2 Approved additions (D6).** Explicit time limits. Explicit resource
  and cost limits. Model/tool restrictions. Structured scope-compliance
  requirements. **Applicability rule:** "Reference approved defaults and
  require escalation when limits are insufficient or exceeded" (Register §10
  D6). Escalation paths: `07-escalation-model.md`.
- **CT-3 Gap: no approved defaults exist yet.** D6 says to reference
  "approved defaults" for time, resource/cost and model/tool limits. The
  Register records none; F-28 "Model and session limits" is Open (Register
  §5), and benchmark resource limits belong to Stage S (Register §6). Until
  defaults are approved, each Task Brief states its limits explicitly and
  cites the authorization that sets them; a brief without a stated limit is
  incomplete, not unlimited.
  *Test (CT-1–CT-3):* every Task Brief has every field, or "N/A" with reason
  where an applicability rule allows it; limits are explicit numbers or named
  authorization references.

### Builder Report — produced by builder, consumed by Muse and verifier

- **CT-4 Source fields (approved).** Task and project identity. Builder
  identity. Starting commit. Implementation summary. Files and components
  changed. Resulting commit or artifact reference. Tests and results. Known
  failures. Remaining limitations. Outstanding issues. Deviations and
  escalations. Supporting evidence. (Register CR-03.)
  "Known failures," "Remaining limitations," and "Outstanding issues" stay
  three distinct fields (Register CR-03).
- **CT-5 Approved additions (D6).** Model/tool version. Explicit unverified
  areas. Structured scope-compliance statement. **Applicability rule:**
  "Explicitly state when version information is unavailable" (Register §10
  D6).
- **CT-6 A Builder Report is a claim.** "Builder explanations are not
  independent evidence" (Register §10 D2). It is input to verification, never
  a substitute for it.

### Verification Report — produced by verifier, consumed by acceptance

- **CT-7 Source fields (approved).** Task and project identity. Exact commit
  or artifact evaluated. Requirements evaluated. Tests independently executed
  or inspected. Findings and severity. Security considerations. Evidence
  references. Unverified areas. Reviewer identity. Required corrections.
  Verification result. (Register CR-03.)
  "Evidence references" is a restored source field and "must not be dropped
  again without a recorded source decision"; "Tests independently executed or
  inspected" "must not be weakened to merely 'tests and checks performed'"
  (Register CR-03).
- **CT-8 Approved additions (D6).** Verdict rationale. Verification method.
  Independence declaration. Evidence-to-acceptance mapping. (Register §10 D6;
  CR-03 heading these "Standardized verdict rationale", "Explicit
  verification method and independence declaration", "Structured
  evidence-to-acceptance-criterion mapping".) What the independence
  declaration must state is proposed in `05-verifier-identity-runtime.md`.
  **Acceptance rule:** "A verifier FAIL blocks acceptance and merge. A failed
  verification cannot be overridden by the builder's report or by a task
  being marked complete" (Register CR-03).

### Delivery Record — produced by Muse as recorder, decided by acceptance authority

- **CT-9 Source fields (approved).** Project and release identity. Delivered
  artifact/version. Accepted requirements. CI results. Merge or release
  reference. Verification reference. Remaining risks. Founder decisions
  required. Required follow-up. Deployment and handover status. Known
  limitations. Supporting evidence. Approval reference where applicable.
  (Register CR-03.)
- **CT-10 Approved additions (D6).** Operational owner. Maintenance
  responsibility. Backup and recovery reference where relevant. Formal
  acceptance authority and decision record. **Applicability rule:** "Allow N/A
  where appropriate. Preserve the distinction between a sourced approval
  reference and formal acceptance authority" (Register §10 D6). The two
  "must not be merged" (Register CR-03).

### Evaluation Evidence Package — separate per-benchmark object

- **CT-11 §7 governs; no summary replaces it.** The package is "a
  per-benchmark evaluation artifact. It is not the same object as a Delivery
  Record" (Register CR-03). Its requirements are Evaluation Catalog §7,
  reproduced verbatim in Register Appendix A, or referenced by "its exact
  canonical version and section. A summary cannot replace it" (Register §10
  D6). This spec references Register Appendix A; it does not restate or
  abbreviate §7.
- **CT-12 The CR-03 summary list is an index only.** Where it and §7 differ,
  §7 governs. Its items "Evidence references", "Evaluation period" and
  "Metric results" are "register additions, not Catalog requirements, and
  must be labeled as such wherever they are used" (Register CR-03).
- **CT-13 The package is not used before Stage S.** It is per-benchmark;
  benchmark work is not authorized (Register, Stage 2 amendment scope limits).
  It is specified here only so the contract set is complete.

### Rules across all objects

- **CT-14 No field silently dropped, merged or renamed.** Every source field
  and approved addition is present in its object, or marked N/A with reason
  where an applicability rule allows it (Register §7 revision rule 2).
- **CT-15 Sourced and added fields stay labeled.** The contract keeps the
  "source-versus-addition distinction" (Register CR-03 status note).
- **CT-16 Objects reference, not copy.** A Verification Report references the
  Builder Report and Task Brief by identifier and version (Stage 1 spec 11
  RS-3); it does not restate their content as its own findings.
- **CT-17 Status vocabularies are not mixed.** A Verification Report's
  "Verification result" uses task verification outcomes; a benchmark verdict
  uses evaluation verdicts (Register CR-09; F-10 proposal in spec 05).

## F-04 — Handoff contract fields (decided under D6)

F-04 is **not** an open finding. Register §5: F-04 "Handoff contract fields",
recommended default "Restore all source fields; separately approve
additions", status "APPROVED WITH AMENDMENTS 2026-10-30 (D6; see §10 decision
record)". This spec records that decision; it does not re-decide it.

- **What D6 decided:** the source fields above (including the restored
  "Evidence references" and "Approval reference where applicable"); the
  additions above with their applicability rules; that §7 is included
  verbatim or referenced by exact version, never summarized.
- **What remains open:** the exact Evaluation Catalog version. Stage V found
  "Only 'v1', no date/hash/revision" (Stage V report, G-12, V7-C4) and that
  Appendix A "text-agrees with Catalog §7, but that is text agreement, not
  version validation" (Stage V, Package H). Closing evidence: an exact version
  reference (date, hash or revision) for "Genesis Evaluation & Benchmark Test
  Catalog v1", confirmed by the Founder. Until then the contract is not final.

## F-13 — Evaluation taxonomy

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-13 "Evaluation taxonomy". Recommended default: "Reconcile
  domain count and distinguish evaluation/evidence levels". Required before:
  Stage 2. Status: Open (Register §5). Basis: Register CR-12; Stage V D-5,
  VF-7 (domain-count mismatch confirmed).
- **Proposed resolution:**
  1. **One canonical taxonomy.** Each evaluation domain carries the CR-12
     fields: unique identifier; definition; included capabilities; excluded
     capabilities; evaluation method; evidence requirements; acceptance
     criteria; roadmap stage mapping.
  2. **Domain count follows F-35.** The Muse Handoff lists 15 domains and the
     Catalog 14; the difference is bounded autonomy, split out in the Handoff
     and inside domain F in the Catalog (Register CR-12). The count is 14 or
     15 depending on the Founder's F-35 decision ("Decide whether it is
     separate or part of domain F"; Open). This proposal does not decide F-35.
     Until it is decided, references use the Catalog's domain identifiers.
  3. **Evidence levels are named, not numbered.** Evidence levels are cited by
     their names — Structural, Component, Workflow, Operational, Outcome
     (Register Appendix A, §7; CR-12 "The evidence-level labels agree") —
     written as "evidence level: Workflow", never "Level 3".
  4. **Evaluation levels keep a distinct prefix.** The Catalog's L1–L5
     evaluation levels keep the "L" prefix and are written as "evaluation
     level L3", never "Level 3". Bare "Level n" is not used in any Genesis
     record.
  5. **Other label families stay separate** (Register CR-11): roadmap Stage
     numbers, Catalog Gate numbers, M10 as the reliability window name,
     maturity levels only under a distinct label with explicit mapping.
- **Gap:** the Catalog's domain definitions and its L1–L5 evaluation-level
  definitions were not available to this builder. Items 1, 2 and 4 are
  therefore structural rules; populating the taxonomy needs the Catalog at
  its confirmed version (F-04 remaining item above). Nothing is invented.
- **What the Founder would be deciding:** the naming rules (3–5), the field
  structure (1), and that the count follows F-35 (2).

## Authority boundaries

- **Founder:** confirms the Catalog version (D6 condition); decides F-13 and
  F-35; holds formal acceptance authority unless delegated (F-21, spec 07).
- **Muse:** produces Task Briefs and Delivery Records; cannot mark any field
  N/A outside an applicability rule.
- **Builder:** produces Builder Reports; cannot certify its own work.
- **Verifier:** produces Verification Reports; its FAIL blocks acceptance and
  merge.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| CT-1–CT-10, CT-14, CT-15 | Field-by-field check of each object against this list and Register CR-03 | Verification report |
| CT-3 | Each limit is an explicit value or cites an authorization | Task Brief |
| CT-6, CT-8 | No acceptance rests on a Builder Report alone; FAIL blocks | Delivery record; PR state |
| CT-11–CT-13 | §7 referenced by exact version; register additions labeled | Evaluation Evidence Package (Stage S onward) |
| CT-16, CT-17 | Result fields reference by id and use only their own vocabulary | Verification and evaluation records |

## Open questions

1. The exact Evaluation Catalog version (D6 condition; Stage V G-12). Founder.
2. F-35: bounded autonomy as a separate domain or inside domain F.
3. Who sets approved defaults for Task Brief limits, and when? F-28 places
   model and session limits before Stage S; D6 needs defaults for every Task
   Brief now.
4. The Operating Model §5.5/§5.6 field definitions (descriptions, not just
   names) were not available. Field meanings here are read from the field
   names only.

## Explicitly NOT decided here

- The contract is not declared final. F-04's remaining item (Catalog version)
  is open.
- F-13 (proposal only), F-35, F-28, F-10.
- Any storage, file format or schema for contract objects.
- Evaluation Catalog §7 is not restated, abbreviated or narrowed.
