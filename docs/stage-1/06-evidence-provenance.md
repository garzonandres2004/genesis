# 06 — Evidence provenance and traceability

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 6 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related decisions and findings:** D2 (APPROVED WITH AMENDMENTS), D6
  (APPROVED WITH AMENDMENTS), F-07, F-10, F-13.

## Purpose

Define what makes something count as evidence in Genesis, how every claim is
traced to its evidence, and how evidence is kept distinct from claims, so
that "Evidence must support capability claims" (Register §1 principle 9) and
"Independent verification must be distinguishable from builder reporting"
(principle 7).

## Scope

**Covers:**
- Requirements for evidence records and claim-to-evidence links.
- Separation of builder claims, verifier findings, and Founder decisions.
- Rules for gaps and missing evidence.

**Does not cover:**
- The handoff contract fields. Those are set by D6 and CR-03; D6 is not final
  until "the exact Evaluation Catalog version" is identified (Register §10
  D6). This spec references them; it does not restate or finalize them.
- Verifier identity and runtime, risk classes (ADR-05 pre-Stage-2
  definitions; D2 open definition).
- Vocabulary decisions (F-10 verdict and lesson vocabulary, F-13 evaluation
  taxonomy; both Open, Stage 2).

## Requirements

- **EV-1 Evidence records are references, immutable once recorded.** Register
  ADR-01 defines the evidence record as "immutable references to test results,
  commits, CI, and verification". An evidence record points at a fixed
  artifact (commit SHA, CI run, test output, file hash, PR, URL with date).
  Once recorded it is not edited; corrections are new records that reference
  the old one. *Test:* evidence records change only by addition.
- **EV-2 Exact artifact.** Verification targets "the exact commit or artifact"
  (Register §10 D2). Every verification result names the exact commit or
  artifact it evaluated (CR-03 Verification Report source field "Exact commit
  or artifact evaluated").
- **EV-3 Claims are not evidence.** "Builder explanations are not independent
  evidence" (D2). Builder reports are claims (repo `AGENTS.md`, `docs/policy.md`
  §1). A status like "completed" is not evidence by itself (repo
  `tasks/schema.md`: "A task with empty evidence is not done, whatever anyone
  reported").
- **EV-4 Skipped is not passed.** "Distinguish completed PASS checks from
  skipped or neutral checks; skipped checks must not count as successful
  verification" (D2). *Test:* every verification summary lists skipped checks
  separately from passed ones.
- **EV-5 Each claim cites its source.** Every factual claim in a project
  record, decision record, report or spec cites its source (document and
  section, commit, or evidence record). Unsourced claims are labeled as such.
- **EV-6 Approval provenance.** An approval claim references its decision
  record. Otherwise the record distinguishes "asserted prior approval from
  independently evidenced approval" (Register CR-07). "Historically
  demonstrated" is distinct from "Founder-approved" (Register §1).
- **EV-7 Gaps are recorded, not filled.** Where evidence does not exist or
  cannot be safely obtained, the item is recorded as a gap, not filled by
  generating evidence outside the authorized scope (Register B2 amendment:
  "the finding is a gap for separately authorized future testing — never
  filled by generating evidence inside Stage V"). Missing source material is
  not invented (D6 adoption condition: "Do not invent missing source
  material").
- **EV-8 Claim outcome is explicit.** Each assessed claim gets an explicit
  outcome. The Register records one such set for Stage V: Verified /
  Unverified / Contradicted / Not Assessed (Register B2 amendment). Whether
  that set becomes general is open (open question 1).
- **EV-9 Separate status systems are not mixed.** Evaluation verdicts, task
  verification outcomes, SIE incident lifecycle and SIE lesson states are
  separate (Register CR-09). "A task verification result does not
  independently establish an overall benchmark verdict" (CR-09).
- **EV-10 Evidence-to-acceptance mapping.** Acceptance of work maps each
  acceptance criterion to the evidence that satisfies it. Basis: D6 approved
  addition to the Verification Report, "evidence-to-acceptance mapping"; repo
  `tasks/schema.md`: acceptance items must be checkable "by a command, a test,
  a PR check, or a live URL".
- **EV-11 End-to-end trace.** Each delivered change is traceable from
  authorization to evidence: authorization record → task → branch → commit →
  PR → checks → verification report → decision/acceptance. Repo
  `docs/architecture.md` invariant 2 already requires "task record → branch →
  PR → checks → preview → merge → memory update"; this adds the authorization
  and verification links at either end.
- **EV-12 Identity of preparers is recorded.** Who prepared evidence, who
  verified it, and who decided are recorded separately (Register ADR-04: "The
  identity of any evidence preparer must be recorded"; CR-03 "Builder
  identity", "Reviewer identity").
- **EV-13 Verifier FAIL is binding.** "An unresolved FAIL blocks acceptance
  and merge"; "Corrected artifacts require re-verification"; "No override
  without a separate decision" (D2). Evidence records must make a FAIL and its
  resolution traceable.
- **EV-14 Evaluation evidence stays separate.** The Evaluation Evidence
  Package is a per-benchmark object, not the same as a Delivery Record
  (Register CR-03). Its requirements are Evaluation Catalog §7, reproduced or
  referenced by exact version; a summary cannot replace it (D6). Nothing here
  narrows §7.

## Authority boundaries

- **Builder:** produces claims plus supporting evidence references. Cannot
  certify its own work (Register §1 principle 6).
- **Verifier:** evaluates the exact artifact, reports findings and evidence.
  "Cannot approve its own work" (ADR-05). A FAIL blocks acceptance and merge
  (D2).
- **Muse:** coordinates verification "but is not automatically the verifier"
  (ADR-05). Current orchestrator verification "must not be silently relabeled
  as independent verification" (ADR-05).
- **Founder:** "retains strategic acceptance and release authority" (ADR-05);
  decides overrides only by a separate decision (D2).

## Evidence and traceability

This spec is itself verified by checking that each requirement cites its
basis, and by sampling existing records:

| Requirement | Verification | Record |
|---|---|---|
| EV-1, EV-12 | Evidence records only grow; each names preparer | Evidence record history |
| EV-2, EV-4, EV-10, EV-13 | Each verification report names exact artifact, lists skipped checks separately, maps criteria to evidence, shows FAIL resolution | Verification Report (D6 fields) |
| EV-3, EV-6 | No acceptance cites only a builder report; approval claims link decision records | Verification report; decision register |
| EV-5, EV-7 | Spot-check claims for citations; gaps labeled | Any record |
| EV-11 | Walk one delivered change end to end | Verification report |

## Open questions

1. Should the Stage V outcome set (Verified / Unverified / Contradicted / Not
   Assessed) become the general claim-outcome vocabulary, or is that part of
   F-10? The Register does not say.
2. D2 risk classes are undefined ("Reproduce checks according to risk class";
   §10 D2 open definition). Until defined, how much reproduction is required
   for each kind of evidence is unspecified.
3. EV-1 says evidence records are immutable. Git history can be rewritten by
   anyone with write access (repo `docs/policy.md` §9: direct pushes possible
   if branch protection is off). What control makes "immutable" true? This is
   a gap, not a solved property.
4. Where evidence lives (in-repo files, PR/CI links, external artifacts) is
   part of F-14 (see `11-records-separation.md`).

## Explicitly NOT decided here

- The contract (D6) is not final and is not restated. Evaluation Catalog §7
  is not narrowed.
- F-10, F-13, D2 risk classes, verifier identity (ADR-05).
- Any evidence storage, hashing or signing mechanism.
