# 00 — SIE Specification (consolidated draft)

- **Status:** DRAFT — Proposed (for review). Not Founder-approved. Not
  verified. This document is the Stage 3 task T0 deliverable; it becomes a
  "reviewed draft" only after the independent verification in brief §8 and
  the human review its risk class requires.
- **Version:** 0.1-draft, 2026-11-06.
- **Owner (canonical subject):** Register ADR-12 assigns "Incident and lesson
  lifecycle" to the "New SIE Specification". ADR-12 is itself Proposed and
  F-24 (canonical document ownership) is Open (Register §5). Drafted by the
  Stage 3 builder (Claude Code); the Founder decides acceptance.
- **Authorization:** Stage 3 execution authorized by the Founder 2026-11-06
  ~09:40 MST by approving the §11 authorization boundary of the Stage 3
  Execution Brief. This document is task T0 under that boundary. At the time
  of writing, the copy of Register v1.2.1 read by the builder carries no
  "Stage 3 execution authorized" amendment; the decision record for this
  authorization is the coordinator's record of the Founder's approval, and
  recording it in the Register is outside T0.
- **Risk class:** Governance (brief §9 T0) — human review required (D2).
- **Supersedes:** nothing. Nothing in this document replaces WP-04 v1.1, the
  Register, or any Founder decision.

---

## 0. Read this first

### 0.1 What this document is, and what it is not

This is the single consolidated SIE implementation reference that brief §2
requires before any Stage 3 coding (T1–T8). It consolidates three inputs:
the SIE baseline WP-04 v1.1 (as far as it is available — see 0.4), the SIE
Implementation Preparation DRAFT (the "prep draft"), and its Correction
Addendum (the "addendum"), which governs where the two disagree.

- **It claims no operational evidence.** No detector result, incident,
  validation, lesson, reuse, evaluation, or improvement is claimed anywhere in
  this document. Everything here is design. In the Evaluation Catalog §7
  evidence levels reproduced in Register Appendix A, a design document is at
  most "Structural evidence" — "A design document proves intent, not
  execution."
- **It authorizes no live loop.** Nothing in this document starts, schedules,
  simulates, or authorizes the first live loop or any live loop turn. The
  first live loop is a separately authorized step after Stage 3 (brief §5.5,
  §10 item 10). See §15.
- **It authorizes nothing else either.** No implementation beyond the Stage 3
  boundary, no Runner change, no database, no service, no daemon, no
  deployment, no spending, no production contact.
- **It decides no open finding.** F-36, F-14, F-10, H1–H6, SIE-01–SIE-07 and
  every other open item stay open (§19).

### 0.2 Provenance labels (AC-T0-1)

Every rule in this document carries one of these labels, with its source
cited next to it. Where parts of one rule have different provenance (for
example a [REF] rule with [P] addendum semantics), each part is labeled
separately. Rule-group headings that carry a label (for example "[P]" on a
table caption) label every row beneath them unless a row states otherwise.

| Label | Meaning in this document |
|---|---|
| **[DECIDED]** | Founder-decided. Used only for: the approved wording of D1–D8 (Register §10), quoted; B1/B2; or the Stage 3 authorization of 2026-11-06 (the brief's §10 hard limits and §11 boundary as approved). The specific decision is named each time. |
| **[REF]** | Attributed to WP-04 v1.1. **Every [REF] in this document is UNVERIFIED against WP-04 verbatim.** None is a quotation of WP-04. Each is carried from the prep draft's own [REF] reconstruction and must be checked against WP-04 v1.1 before the task that depends on it starts (§2). |
| **[P]** | Proposal, not decided. The source is named: "prep" (prep draft [P]), "addendum CR-0n" (governing correction, itself PROPOSED pending re-review), "Stage 2 spec NN" (Proposed), "advisor" (relayed advisor direction — a proposal), or "this spec" (introduced by this Specification to carry an input forward). |
| **[OPEN]** | Undecided. Owner and what unblocks it are in §19. |

Notes on labels:

- **Naming collision.** The Register's contradiction register uses CR-01–CR-12;
  the addendum uses CR-01–CR-04 for unrelated corrections. In this document
  "**Register CR-nn**" and "**addendum CR-0n**" are always written in full.
  (The brief §4 phrase "the prep draft's CR-01 independent-reuse-judgment
  rule" refers to **Register** CR-01; the brief §5.3 "CR-01: eligibility …"
  refers to **addendum** CR-01.)
- **[BASE]** items (October 29 baseline, reconstructed — prep "Basis") do not
  appear as rules here. Seed records (T5) will carry [BASE] provenance where
  applicable, with the prep's reconstruction caveat.
- Register text that is neither a D1–D8 decision nor tied to an open finding
  (for example Register §1 governing principles) is cited by section and
  labeled [DECIDED] only where it is part of the canonical record adopted by
  B1 as a principle, not a proposal. Register text that is tied to an open
  finding (for example the CR-09 status lists, tied to F-10) is labeled [P]
  with that dependency stated.

### 0.3 Sources

| Short name | Document | Status | Available to the builder? |
|---|---|---|---|
| Register | Genesis Architecture Reconciliation & Founder Decision Register v1.2.1 (1,414 lines as read) | Canonical (B1, 2026-11-05) | Yes (Founder workspace file; no copy in this repo) |
| Brief | Genesis Stage 3 Execution Brief (`stage-3-brief-EXECUTION-DRAFT.md`, 1,015 lines as read) | Authorization boundary (§11) approved 2026-11-06 ~09:40 MST | Yes (orchestrator goal files) |
| Prep | Genesis SIE Implementation Preparation — DRAFT and PROPOSED (626 lines) | DRAFT, PROPOSED; nothing in it approved | Yes (Founder workspace file) |
| Addendum | … Correction Addendum — DRAFT and PROPOSED (CR-01–CR-04 + 7 nonblocking refinements; 144 lines) | DRAFT, PROPOSED; governs over prep where they disagree, pending re-review | Yes (Founder workspace file) |
| Advisor | Relayed advisor direction, 2026-11-06 (copy verified against the source message; file name retains "UNVERIFIED") | Its 7 decisions and the Phase 1/2/3 breakdown are PROPOSALS | Yes (orchestrator goal files) |
| WP-04 | SIE baseline WP-04 v1.1 (REVIEW PASSED, PROPOSED) | Baseline; not a Founder decision | **No.** Its full text is in the ChatGPT planning conversation, not in any local file. |
| Stage 2 specs | `docs/stage-2/04-contracts.md`, `docs/stage-2/05-verifier-identity-runtime.md` | Proposed | Yes (this repo, merged PR #35) |
| Stage 1 specs | `docs/stage-1/11-records-separation.md` (F-14 proposal) | Proposed | Yes (this repo, merged PR #34) |
| Repo code | `scripts/events.mjs`, `scripts/task-state.mjs`, `tasks/schema.md` | As merged on main 152fced | Yes (read only; not changed) |

The builder did not compute SHA-256 hashes of the out-of-repo sources. The
verifier should record the hashes of the versions it checks against.

### 0.4 The WP-04 gap, stated once

WP-04 v1.1 is the approved-in-principle SIE baseline this Specification must
not weaken (D1 preservation requirement). **No WP-04 text was available to the
builder.** Every statement here that the prep draft attributes to WP-04 is
carried as [REF] and is a reconstruction, not a quotation. The Register itself
contains no WP-04 text (it names the SIE standards — "lifecycle, watch
requirements, exposure requirements, recurrence rules, and evidence standards"
— without stating them). Consequently:

- All eight brief §2.2 points are **flagged as still missing** (§2). None is
  quoted from WP-04.
- The brief's T0 entry criterion "WP-04 v1.1 retrieved and available for
  verbatim quotation" is **not met**. This Specification proceeds under
  AC-T0-2's "explicitly flagged as still missing" branch, and each dependent
  task (T1, T2, T3, T5, T7) carries the gap as a precondition (§2, last
  table).
- Where the prep draft and the addendum disagree with each other, the addendum
  governs. Where either might disagree with WP-04, this document **cannot
  tell**, and says so rather than resolving it (§17).

---

## 1. Scope, milestones, and the SIE phase reconciliation

### 1.1 Stage 3 scope

- **SC-1 [DECIDED — D1; Register §2, §8].** "Milestone A remains in Stage 3"
  (D1 approved wording). Register §2 and §8 state Stage 3's objective as
  "Implement the approved SIE design and demonstrate Milestone A."
- **SC-2 [DECIDED — D1].** "Milestone B may be recognized during or after
  Stages 4–5 only when its existing evidence requirements are satisfied. It is
  not a prerequisite for the first product." No Stage 3 task, test, or claim
  satisfies any part of Milestone B (brief §1).
- **SC-3 [DECIDED — D1].** "Do not manufacture incidents or unnecessary
  tasks. Preserve existing SIE validation standards." These are conditions of
  the approval, "not commentary" (Register §10 D1, conditions carried).
- **SC-4 [DECIDED — Stage 3 authorization, brief §11].** Stage 3 is SIE
  implementation + Milestone A demonstration only. Milestone B, SIE Phase 2/3
  work (in the advisor's sense), the first live loop, Stage S, Stages 4–7 and
  Stage R are not authorized.

### 1.2 Milestone definitions

- **SC-5 [DECIDED — D1, approving the Register CR-01 resolution].**
  "**Milestone A — Functional SIE:** The approved incident and lesson
  mechanisms work, including evidence capture, human classification, lifecycle
  management, and evaluation records."
- **SC-6 [DECIDED — D1, approving the Register CR-01 resolution].**
  "**Milestone B — Validated learning:** Real incidents, sufficient exposure,
  completed watch periods, recurrence requirements, legitimate later reuse,
  and documented evaluation satisfy the approved SIE criteria."
- **SC-7 [DECIDED — Register §1 principle 8, B1].** "SIE cannot automatically
  classify incidents or promote lessons." Note that SC-5 includes "human
  classification" as a Milestone A mechanism.
- **SC-8 [P — prep §1].** Milestone A covers, functionally: detector, incident
  records, diagnosis, fix linkage, procedure, schema, INDEX, safety/negative
  behavior. Milestone B covers validation, lessons, reuse, evaluation,
  compounding on real operational evidence after a full watch window.

### 1.3 The SIE phase reconciliation (AC-T0-3) — CONFLICT, surfaced

**The two positions.**

- **Prep draft §1 (tagged [D1/REF] by the prep):** "SIE Phase 1 passes only
  when BOTH pass, reported separately." — i.e. SIE Phase 1 = Milestone A +
  Milestone B. The addendum's nonblocking refinement 1 repeats this reading:
  "Milestone A may pass independently, while SIE Phase 1's combined A+B
  completion remains separate and Milestone B does not gate roadmap Stage 4."
- **Advisor direction (PROPOSAL):** "SIE Phase 1 — Functional engine"
  (detection, incident records, diagnosis, fix tracking, lesson staging,
  INDEX, functional safety tests); "SIE Phase 2 — Validated learning"; "SIE
  Phase 3 — Improvement and compounding". The advisor states: "This is my
  proposed phase breakdown, not an established Register decision."
- **Brief §3.1 reconciliation [P]:** the prep's "both pass" line describes the
  SIE's overall first phase in the WP-04 sense, not the Stage 3 exit; under
  the proposed breakdown SIE Phase 1 = functional engine = Milestone A; "If
  WP-04 v1.1 itself defines Phase 1 as A+B … that finding must be surfaced as
  a conflict for Founder review."

**What the local evidence shows.** Two independent local sources — the prep
draft (which tags the A+B line [D1/REF], i.e. as baseline material) and the
addendum (written after the first external review) — both read "SIE Phase 1"
as A+B. The prep draft also states its "SIE Phase 1/2/3" naming discipline is
"[P, following WP-04 v1.1]", which indicates WP-04 uses SIE phase names.
Neither is WP-04 text, so this is **not confirmed**, but it is a material
indication that **WP-04 v1.1 may define SIE Phase 1 as A+B**, which would
conflict with the advisor's breakdown. This is surfaced here for Founder
review as conflict **C-1** (§17). It is not resolved by this document.

Note also: D1's approved wording does not mention SIE phases at all. The
prep's [D1/REF] tag on the A+B line is therefore at most [REF]; D1 does not
decide it.

**What this Specification adopts, and why it does not need the phase label.**

- **SC-9 [DECIDED — D1; Register §2/§8; brief §11].** The **Stage 3 exit rule
  is: Milestone A demonstrated** (on synthetic fixtures, with independently
  verified results — brief §5, T8). This rests on D1 and Register §2/§8
  directly. It does not depend on what "SIE Phase 1" means.
- **SC-10 [P — advisor; approved as the Stage 3 *working* breakdown only,
  brief §11 item 3, "subject to the §3.1 reconciliation"].** Within Stage 3
  documents, "SIE Phase 1 (functional engine)" may be used as a working label
  for the Milestone A work. It does not decide the phases for any later stage
  (brief §11 item 3).
- **SC-11 [P — this spec].** To avoid silently redefining WP-04's phases,
  Stage 3 artifacts **name milestones, not phases**, in every exit claim,
  test result, and report: "Milestone A demonstrated", never "SIE Phase 1
  passed". The prep's A+B line is preserved as history and is not followed as
  the Stage 3 exit rule.
- **SC-12 [OPEN — C-1].** Whether WP-04 v1.1 defines SIE Phase 1 as A+B, and
  if so how the advisor's breakdown is reconciled with it, is a Founder
  decision after WP-04 is quoted (§2 point 7). Either answer leaves SC-9
  unchanged.

### 1.4 Test groups and milestones

| Group | Tests | Milestone | In Stage 3? | Provenance |
|---|---|---|---|---|
| A — functional | DET, INC, DIA, FIX | A | Yes, on fixtures only | [REF] (prep §1) |
| B — safety/negative | N-VAL, N-LES, N-HIST, N-REU, N-EVAL, GOV | A | Yes, all six, on fixtures/draft records only | [REF] that Group B is required for Milestone A (prep §5); designs [P] |
| C — validated learning | VAL, LES, REU, EVA (positive) | B | **No.** Named only so it is not claimed. | [REF] (prep §1) |

- **SC-13 [P — prep §5.5; brief §5].** Functional (Milestone A) and
  validated-learning (Milestone B) results are reported separately and never
  merged into a single pass claim.

---

## 2. The eight WP-04 verbatim points (brief §2.2) — AC-T0-2

**Result: 0 of 8 quoted from WP-04 v1.1. 8 of 8 flagged as still missing.**
For each point: what is available locally (always a reconstruction, never
WP-04 text), the gap, and which Stage 3 task cannot finish correctly until the
gap is closed. The text in "Available locally" is quoted from the prep draft
(or the Register, where stated) — **it is not WP-04 wording.**

### Point 1 — The six detector rules R1–R6

- **Available locally:** prep §2.1 pseudocode headings, each tagged "[REF,
  WP-04 v1.1]": "R1: blocked-with-blockers"; "R2: failed/interrupted runs";
  "R3: attempts >= 2"; "R4: same blocker/event across >= 2 tasks"; "R5:
  retry_exhausted"; "R6: stuck in_progress > 2 ticks". Candidate-vs-failure
  distinction: "[P, following WP-04 v1.1]". R4/R6 exact-match semantics:
  addendum CR-04 [P].
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: each rule's exact wording;
  the thresholds as WP-04 states them (≥ 2 attempts; ≥ 2 tasks; > 2 ticks);
  WP-04's own statement of the candidate-vs-failure distinction; whether
  WP-04 names exactly six rules; whether WP-04 says anything about R4 key
  equality or R6 tick measurement (if it does, addendum CR-04 must be checked
  against it).
- **Blocks:** T1 (AC-T1-1 requires "Every WP-04 detector rule has exactly one
  implementation branch").

### Point 2 — The watch rule, watch start, and "next 10 tasks"

- **Available locally:** prep §2.3: "Watch = 30 days OR next 10 tasks,
  whichever FIRST [REF, WP-04 v1.1]". Watch start: prep §6 H5 says "fix merge
  [recommended in WP-04 v1.1] vs. first post-merge CI run"; prep §2.3 carries
  a "UNIFIED WATCH RULE [REF, not approved]": start at the later of
  fix-presence and record-creation. Extension: "Watch extends by FULL windows
  on insufficient exposure [REF]". Task counting: prep §6 SIE-02: "WP-04 v1.1
  states 'next 10 tasks' without this qualification."
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: the exact watch rule
  wording; WP-04's watch-start rule and whether WP-04 recommends or decides
  fix merge; the source and status of the "unified" rule (the prep marks it
  [REF] yet "not approved", so its origin is unclear); WP-04's extension rule
  wording; whether WP-04 qualifies "next 10 tasks" at all.
- **This Specification's handling:** all three watch-start readings are
  preserved as OPEN (§7, WAT-2); no reading is adopted; every watch
  computation names its reading and is labeled provisional.
- **Blocks:** T2 (final watch computation), T6 (N-VAL window cases are
  testable on fixtures under each reading, but no reading is final).

### Point 3 — The first-live-loop trigger

- **Available locally:** prep §7 item 3 and AC-P3-2: "the first real
  post-November-5 failure (or a seed-docs inconsistency if none occurs in 30
  days)", stated by the prep as what "WP-04 v1.1 does". SIE-05 [OPEN]: the
  criteria for "seed-docs inconsistency" "are not specified". Addendum
  refinement 7: specify the threshold through SIE-05 "before using that
  fallback operationally".
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: the exact trigger
  wording; what WP-04 counts as a "real … failure"; what the 30 days are
  counted from; any criteria WP-04 gives for a seed-docs inconsistency.
- **Blocks:** T3 (AC-T3-2: "states the first-live-loop trigger exactly as
  WP-04 v1.1 does"). Does not block Stage 3's exit, because Stage 3 does not
  start the loop (§15).

### Point 4 — The seven SIE capabilities and the loop as ordinary runner tasks

- **Available locally:** prep "Basis", tagged "[REF, WP-04 v1.1]": "Seven
  capabilities: Observe, Diagnose, Improve, Learn, Reuse, Evaluate, Compound.
  The loop runs as ordinary runner tasks. No new service, daemon, or database
  is introduced. The detector is read-only."
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: WP-04's definition of each
  capability (the names are reconstructed; no definitions are available at
  all); WP-04's wording of "ordinary runner tasks"; how WP-04 maps capabilities
  to milestones or phases.
- **Blocks:** nothing in T1–T8 depends on capability definitions directly;
  T3 (procedure) should cite them once quoted. Recorded so the Specification
  does not appear to define them.

### Point 5 — The seed corpus list

- **Available locally:** **the list itself is not available anywhere
  locally.** The prep refers to "WP-04 v1.1 seed corpus list" (SIE-P1, SIE-P5
  entries), says seed records are drafted "for all ten corpus items plus the
  truncated-base-SHA candidate" (SIE-P5 exit), and describes only the
  truncated-base-SHA item (prep §4.7: "UNVERIFIED CANDIDATE (operator-class
  error) [REF]").
- **Gap: STILL MISSING — WP-04 verbatim, entire list.** Missing: all ten
  corpus items (names, dates, sources); whether the truncated-base-SHA item is
  one of the ten or an eleventh item (the prep's "ten … plus" wording suggests
  eleventh, unconfirmed). **This Specification does not reconstruct the list
  and does not guess its contents.**
- **Blocks:** T5 entirely (its brief entry criterion is "WP-04 seed corpus
  list quoted").

### Point 6 — The Graphiti conjunctive trigger

- **Available locally:** prep "Basis", [REF]: "Retrieval is via grep until the
  Graphiti conjunctive trigger is met (50–100+ records AND an acted-on
  superseded fact OR a grep-unanswerable query class) — that trigger is NOT
  met [REF]."
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: the exact threshold
  ("50–100+" is a range, not a threshold — which number applies?); the
  operator grouping (the prep's text reads "A AND B OR C", which is ambiguous:
  "(A AND B) OR C" vs. "A AND (B OR C)"); what counts as an "acted-on
  superseded fact" and a "grep-unanswerable query class"; whether "NOT met" is
  WP-04's statement or a later assessment.
- **Blocks:** T7 (AC-T7 retrieval procedure must state the re-examination
  condition). The trigger being "not met" is uncontroversial at zero records;
  the wording is still needed.

### Point 7 — Whether WP-04 defines SIE Phases 1/2/3, and how

- **Available locally:** the indications in §1.3 (prep [D1/REF] A+B line;
  addendum refinement 1; prep naming discipline "[P, following WP-04 v1.1]").
- **Gap: STILL MISSING — WP-04 verbatim.** Missing: whether WP-04 defines SIE
  phases; if so, their contents and pass conditions; specifically whether
  SIE Phase 1 = A + B.
- **Handling:** §1.3 — surfaced as conflict C-1; Stage 3 exit rests on
  Milestone A (SC-9), not on a phase label.
- **Blocks:** nothing in T1–T8 (SC-9, SC-11); blocks treating the advisor's
  breakdown as decided beyond Stage 3.

### Point 8 — The exact SIE lifecycle, watch, exposure, recurrence, and evidence standards

- **Available locally:** prep §2.2 (transitions), §2.3 (watch), §3.1–§3.4
  (fields, evidence links), as corrected by addendum CR-01–CR-03 — all
  reconstructions or proposals. The Register adds only: the preservation
  requirement (Register CR-01: "Existing approved SIE lifecycle, watch
  requirements, exposure requirements, recurrence rules, and evidence
  standards must not be weakened"); the status lists (Register CR-09); and
  "REOPENED and the approved second-recurrence rule must be retained"
  (Register CR-09). The Register refers to an "approved second-recurrence
  rule" but does not state it.
- **Gap: STILL MISSING — WP-04 verbatim, all five standards.** Without them,
  **no reader can check that this Specification weakens nothing**: §3 below
  reproduces the standards *as reconstructed*, and that reproduction is
  itself unverified.
- **Blocks:** T2 (lifecycle and watch), T6 (Group B refusals encode these
  standards), and any claim that Stage 3 preserved the D1 standards.

### Summary table

| # | Point | Quoted from WP-04? | Locally available | Task blocked until quoted |
|---|---|---|---|---|
| 1 | Detector rules R1–R6 | No — MISSING | Prep reconstruction (names, thresholds) | T1 |
| 2 | Watch rule / start / "next 10 tasks" | No — MISSING | Prep reconstruction; 3 readings | T2 (final computation), T6 (window cases) |
| 3 | First-live-loop trigger | No — MISSING | Prep reconstruction | T3 |
| 4 | Seven capabilities; ordinary runner tasks | No — MISSING | Names only (prep) | None directly; T3 should cite |
| 5 | Seed corpus list | No — MISSING | **Nothing** (list absent locally) | T5 (entirely) |
| 6 | Graphiti conjunctive trigger | No — MISSING | Prep paraphrase (ambiguous grouping) | T7 |
| 7 | SIE Phases in WP-04 | No — MISSING | Indirect indications (§1.3) | None in Stage 3; later-stage phase use |
| 8 | Lifecycle, watch, exposure, recurrence, evidence standards | No — MISSING | Prep reconstruction + Register preservation clause | T2, T6; any D1-preservation claim |

**Closing evidence for every point:** the passage quoted verbatim from WP-04
v1.1 into a revision of this Specification, with its location in WP-04, and a
reviewer check that each [REF] rule here matches it (or a conflict entry in
§17 where it does not).

---

## 3. SIE standards preserved (D1 preservation requirement)

- **ST-1 [DECIDED — D1].** "Preserve existing SIE validation standards."
  Register CR-01: "Existing approved SIE lifecycle, watch requirements,
  exposure requirements, recurrence rules, and evidence standards must not be
  weakened."
- **ST-2 [DECIDED — Stage 3 authorization, brief §10 item 7].** "No
  weakening of the approved SIE lifecycle, watch, exposure, recurrence, or
  evidence standards."
- **ST-3 [P — this spec].** Because WP-04 is unavailable (§2 point 8), this
  Specification preserves the standards in the only way it can: it carries
  every reconstructed standard **at least as strictly** as the prep draft and
  addendum state it, adds no relaxation, and where two readings exist keeps
  both open rather than choosing the looser one. Every place where a
  correction tightens the prep (addendum CR-01, CR-02, CR-03, CR-04) is
  applied. No standard below may be relaxed by T1–T8 without a Founder
  decision recorded first.

The standards, as reconstructed (each detailed in the section named):

| Standard | Reconstructed content | Provenance | Detail |
|---|---|---|---|
| Lifecycle | OPEN → FIXED → WATCH → VALIDATED, with REOPENED from FIXED, WATCH, VALIDATED only; never from OPEN | [REF] states; [P] transition evidence (prep §2.2); addendum CR-03 removes OPEN → REOPENED | §6 |
| Watch | 30 days OR next 10 tasks, whichever first; start rule OPEN (3 readings); extension by full windows | [REF] (30d/10 tasks; full-window extension); [OPEN] start (H5) and counting (SIE-02) | §7 |
| Exposure | Operational evidence inside the watch window only; record creation alone = zero exposure; fixture/synthetic/pre-window evidence never counts | [REF] (prep §2.3) | §7, §10 |
| Recurrence | A second recurrence mandates deeper review; REOPENED and the second-recurrence rule retained | [REF] (prep §2.3); Register CR-09 (retention); procedure [OPEN] SIE-07 | §6, §7 |
| Evidence / validation | Validation requires the window end condition reached AND sufficient in-window operational exposure AND all six validation elements | Elements [P] (prep §2.2); conjunctive rule [P] addendum CR-01 | §8, §10 |

---

## 4. Status vocabulary (Register CR-09) — kept separate

### 4.1 The systems

- **VOC-1 [P — Register CR-09 lists; adoption as the rule is F-10, OPEN;
  Stage 2 spec 05 F-10 proposal].** Stage 3 uses these values exactly and
  keeps the systems separate (brief §2.1, §7.2):

| System | Values | Used in |
|---|---|---|
| SIE incident lifecycle | OPEN, FIXED, WATCH, VALIDATED, REOPENED | SIE incident records only |
| SIE lesson states | CANDIDATE, UNVALIDATED-STAGED, VALIDATED | SIE lesson records only |
| Task verification outcome | PASS, FAIL, BLOCKED, NEEDS APPROVAL | Verification Reports for Stage 3 tasks |
| Evaluation verdict | PASS, CONDITIONAL PASS, FAIL, INCONCLUSIVE | Benchmark/evaluation verdicts only — none in Stage 3 |
| Claim assessment (Stage 2 spec 05 proposal) | Verified, Unverified, Contradicted, Not Assessed | Read-only verification of stated claims |

- **VOC-2 [P — Stage 2 spec 05 F-10 proposal].** A value from one system is
  never used in another; a record that carries a status names its system.
  In particular: a Stage 3 task verification PASS is never written as, or
  read as, an incident VALIDATED or a lesson VALIDATED; a Group A/B test
  result is a test result, not an SIE status.
- **VOC-3 [DECIDED — Register CR-09 text, B1].** "The complete approved SIE
  Specification must govern transitions and definitions." This document is
  that Specification in draft; it is not yet approved, so it does not yet
  govern (see the Status line at the top).
- **VOC-4 [P — Register CR-09; [REF] prep].** "REOPENED and the approved
  second-recurrence rule must be retained."

### 4.2 Vocabulary conflicts found (surfaced, not silently resolved)

- **VOC-5 [P — this spec] — case and exact strings (conflict C-4).** The prep
  draft uses lowercase status strings (`open`, `fixed`, `watch`, `validated`,
  `reopened`, `unvalidated-staged`) and states that `unvalidated-staged` is the
  exact header string "[REF]". Register CR-09 uses OPEN … REOPENED and
  UNVALIDATED-STAGED. Proposal: **records store the CR-09 form exactly**
  (`OPEN`, …, `UNVALIDATED-STAGED`); the prep's lowercase forms are not used
  as stored values. Whether WP-04 mandates a specific case is unknown until
  §2 point 8 is closed.
- **VOC-6 [OPEN] — the lesson state CANDIDATE (conflict C-5).** Register
  CR-09 lists CANDIDATE as a lesson state. The prep draft defines **no**
  CANDIDATE lesson record, field value, transition, or INDEX section: its
  lesson `status` allows only `unvalidated-staged` or `validated`, and
  "candidate_lesson_content" in `stage_lesson` is input material, not a
  record state. This Specification does **not** invent CANDIDATE semantics.
  Working position [P — this spec]: CANDIDATE is reserved as a valid lesson
  state value; no Stage 3 mechanism creates, transitions, or tests a
  CANDIDATE lesson record until its definition is quoted from WP-04 or
  decided. The INDEX (§12) has no CANDIDATE section for the same reason.
- **VOC-7 [P — this spec] — "candidate" means two different things.** A
  **detector candidate** (§5, DET rules) is an observation that a detector
  rule fired. A **CANDIDATE lesson** is a lesson
  state. They are unrelated. Records and reports always write "detector
  candidate" for the former and "lesson state CANDIDATE" for the latter.

---

## 5. Detector (R1–R6) — read-only, candidate-only

### 5.1 Rules

| Rule | Reconstructed statement | Threshold | Provenance | Semantics |
|---|---|---|---|---|
| R1 | blocked-with-blockers | status blocked AND blockers non-empty | [REF] | unchanged (addendum) |
| R2 | failed/interrupted runs | event type `task_failed` or `run_interrupted` | [REF] | unchanged |
| R3 | attempts ≥ 2 | attempt count ≥ 2 | [REF] | unchanged |
| R4 | same blocker/event across ≥ 2 tasks | exact recorded key on ≥ 2 distinct tasks | [REF] rule; [P] addendum CR-04 semantics | DET-6 |
| R5 | retry_exhausted | event type `retry_exhausted` | [REF] | unchanged |
| R6 | stuck in_progress > 2 ticks | tick-index distance ≥ 3 | [REF] rule; [P] addendum CR-04 semantics | DET-7 |

- **DET-1 [P — prep AC-P1-1].** Every WP-04 detector rule has exactly one
  implementation branch, and no additional matching rule is introduced.
  (Which rules WP-04 contains: §2 point 1, MISSING.)
- **DET-2 [P — prep §2.1, "following WP-04 v1.1"; [REF] origin unverified].**
  Candidate-vs-failure: "A candidate is an exact-match observation that a rule
  fired. A runner-caused failure is a judgment reached only after diagnosis
  that (a) identifies a runner defect in the frozen failure categories, (b)
  reproduces or re-reads the evidence for it, and (c) survives independent
  verification subject to D2. No detector output, no candidate count, and no
  candidate recurrence ever performs that judgment automatically."
- **DET-3 [P — prep AC-P1-2; addendum CR-04 "Unchanged"].** No rule emits a
  "runner-caused failure" verdict; every rule emits at most a detector
  candidate.
- **DET-4 [P — prep §2.1].** The detector must never: modify a source record;
  reclassify an existing record; backfill an event log; infer a cause from a
  match; count candidates as failures in any report; trigger a fix, a retry,
  a merge, or a lesson by itself.
- **DET-5 [P — prep AC-P1-3; addendum refinement 6; SIE-03 OPEN].** Read-only
  boundary: the detector reads existing Runner task records and events only
  (SIE-03 working scope) and never writes them. Reading Runner source records
  is distinct from **creating SIE detector-candidate records**, which is the
  detector's only write, into the SIE record area (§11) — never into `tasks/`
  or `events.jsonl`.
- **DET-6 [P — addendum CR-04 correction 1] — R4 exact match.** R4 fires ONLY
  on exact equality of a recorded identifier or value as it appears in an
  existing record (no inferred similarity, no fuzzy matching, no normalization
  beyond the recorded value itself), on ≥ 2 distinct tasks. Missing, blank, or
  incomparable keys → NO candidate; the scan records "insufficient evidence:
  key missing or incomparable". Every R4 candidate retains the exact key value
  and exact source pointers per task. R4 never determines runner causation.
- **DET-7 [P — addendum CR-04 correction 2] — R6 tick index.** R6 measures
  distance in the authoritative recorded tick index (number of recorded ticks
  between last-progress tick and current tick), not wall-clock time and not
  an assumed schedule. Strictly greater than 2: distance 2 does NOT match;
  3 or more matches. Missing last-progress tick, last-progress tick not in the
  index, or current tick not determinable → NO candidate; the scan records
  "insufficient evidence: tick position not determinable". Missing values are
  never classified as stuck. Every R6 candidate retains task id,
  last-progress tick, current tick, and tick-index references.
- **DET-8 [P — addendum refinement 3; identifier design: this spec].**
  Deterministic detector-candidate identifier, so repeated scans cannot create
  duplicate candidate records. Proposed inputs: rule id + the exact sorted
  source pointers (+ the exact key value for R4; + task id and last-progress
  tick, **not** current tick, for R6, so one stuck episode yields one
  candidate). Format is T1's choice. Whether a still-stuck task should produce
  a new candidate on later scans is [OPEN] (T1 to propose; no Founder decision
  needed unless it changes what counts as a recurrence).
- **DET-9 [P — prep SIE-P1].** A detector-candidate record carries: rule
  matched; source evidence pointers; task identifiers; timestamps as
  recorded; match description; no interpretation. Plus DET-6/DET-7 retained
  values, and the DET-8 identifier.

### 5.2 Pseudocode (prep §2.1 with addendum CR-04 applied) [P]

```
FUNCTION detect_candidates(existing_records) RETURNS (candidate_list, insufficient_list):
    # READ-ONLY over Runner task records and events (DET-5, SIE-03).
    # NEVER returns a runner-caused-failure verdict (DET-3).
    # Every match returns a DETECTOR CANDIDATE (DET-9) with a deterministic id (DET-8).
    candidates = []; insufficient = []

    # R1 blocked-with-blockers [REF]
    FOR EACH t IN existing_records.task_records:
        IF t.status == "blocked" AND t.blockers IS NON-EMPTY:
            candidates.APPEND(candidate("R1", evidence=[t.id, t.blockers]))

    # R2 failed/interrupted runs [REF]
    FOR EACH e IN existing_records.events:
        IF e.type IN ("task_failed", "run_interrupted"):
            candidates.APPEND(candidate("R2", evidence=[e.id, e.task_id]))

    # R3 attempts >= 2 [REF]
    FOR EACH t IN existing_records.task_records:
        IF t.<recorded attempt count> >= 2:
            candidates.APPEND(candidate("R3", evidence=[t.id, attempt count]))

    # R4 same recorded key on >= 2 distinct tasks [REF rule; addendum CR-04 semantics]
    FOR EACH source_item IN blocker_and_event_items(existing_records):
        IF key(source_item) IS MISSING OR BLANK OR INCOMPARABLE:
            insufficient.APPEND("insufficient evidence: key missing or incomparable", source_item)
    FOR EACH exact_key IN exact_equal_groups(comparable items):   # no normalization
        IF count_distinct_tasks(exact_key) >= 2:
            candidates.APPEND(candidate("R4",
                evidence=[exact_key, [(task_id, source_pointer) ...]]))

    # R6 stuck in_progress > 2 ticks [REF rule; addendum CR-04 semantics]
    FOR EACH t IN existing_records.task_records WHERE t.status == "in_progress":
        IF t.last_progress_tick MISSING
           OR t.last_progress_tick NOT IN tick_index
           OR current_tick(tick_index) NOT DETERMINABLE:
            insufficient.APPEND("insufficient evidence: tick position not determinable", t.id)
        ELSE IF index_distance(t.last_progress_tick, current_tick) >= 3:
            candidates.APPEND(candidate("R6",
                evidence=[t.id, t.last_progress_tick, current_tick, tick_index refs]))

    # R5 retry_exhausted [REF]
    FOR EACH e IN existing_records.events:
        IF e.type == "retry_exhausted":
            candidates.APPEND(candidate("R5", evidence=[e.id, e.task_id]))

    RETURN (candidates, insufficient)     # insufficient entries are records, not candidates
```

### 5.3 Repository observations for T1 (facts, not rules)

These are observations of the merged code on main 152fced, recorded so T1
reconciles field names instead of assuming them. They decide nothing.

- `scripts/events.mjs` `EVENT_TYPES` includes `task_failed`,
  `run_interrupted`, and `retry_exhausted` — the event types the
  reconstructed R2 and R5 name.
- `tasks/schema.md` task `status` values are `queued | in_progress | blocked
  | completed`. `scripts/task-state.mjs` records the attempt count as
  `attempts` (not the prep's `attempt_count`).
- No recorded tick index was found in the repository's task records or event
  log (a search of `scripts/` for "tick" finds only test comments). If no
  authoritative tick index is readable within the SIE-03 scope, **R6 under
  DET-7 emits "insufficient evidence" for every in-progress task** rather than
  inferring ticks from timestamps. Where the tick sequence lives (for example
  the scheduler's own store, which Stage V took counts from without
  re-querying) and whether the detector may read it is a SIE-03 question
  [OPEN].

---

## 6. Incident records and lifecycle

### 6.1 Transitions (prep §2.2 with addendum CR-03 applied)

- **INC-1 [REF states; P transitions — prep AC-P2-1 as corrected by addendum
  CR-03].** States are exactly OPEN, FIXED, WATCH, VALIDATED, REOPENED.
  REOPENED is reachable from FIXED, WATCH, and VALIDATED only — **never from
  OPEN**. If WP-04 v1.1 is later found to require OPEN → REOPENED, that is a
  conflict to surface (addendum CR-03), not something to re-add silently.

```
STATES: OPEN, FIXED, WATCH, VALIDATED, REOPENED          # CR-09 form (VOC-5)

OPEN -> FIXED:
    REQUIRES fix_reference (commit, PR, or procedure-change id)
         AND fix_description (what changed, in which artifact)
    FORBIDS claiming validation; claiming the fix is proven effective;
            closing on a merged PR alone.

FIXED -> WATCH:
    REQUIRES fix_presence_evidence (fix present in the live system, not merely merged)
         AND record_creation_time
    NOTE watch start per §7 (WAT-2, H5 OPEN). Do not assume a start instant.

WATCH -> VALIDATED:
    REQUIRES the CR-01 eligibility conditions (§8, VAL-1) AND a recorded
             sufficiency judgment.
    FORBIDS validation on a merged PR alone; on zero recurrence alone; on
            fixture evidence; on a staged lesson; by upgrading a record in place.

FIXED -> REOPENED, WATCH -> REOPENED:            # addendum CR-03 correction 2
    REQUIRES recurrence_evidence (a new occurrence of the observed behavior,
             with a specific evidence pointer) AND a stated reason.
    EFFECT  watch restarts only under §7 rules; recurrence_count += 1;
            a second recurrence triggers mandatory deeper review (SIE-07 OPEN).

VALIDATED -> REOPENED:                            # addendum CR-03 correction 2
    REQUIRES corrected_verdict_evidence (specific evidence invalidating an
             earlier conclusion or verdict) AND a stated reason
             -- OR recurrence_evidence (new occurrence), recorded as such.
    EFFECT  prior VALIDATED status preserved in history, annotated superseded
            with reason; never silently overwritten.
            A corrected verdict alone does NOT increment recurrence_count and
            does NOT by itself establish a recurrence.

Corrected verdict on a FIXED/WATCH record (before validation completes):
    an ANNOTATION carrying corrected_verdict_evidence; not a recurrence.

OPEN -> REOPENED: DELETED (addendum CR-03 correction 1). Not a fallback.
```

- **INC-2 [P — addendum CR-03 correction 2].** Recurrence evidence and
  corrected-verdict evidence are different evidence types, stored in
  different fields. A record is never moved backward without a stated reason
  and an evidence pointer, for either type.
- **INC-3 [P — prep §2.2, addendum CR-03; [REF] for the prep's original
  "new evidence contradicting the validation"].** The prep's `validated ->
  reopened` accepted "new_evidence contradicting the validation, or a
  corrected verdict". This spec keeps both paths into REOPENED from VALIDATED
  (a new recurrence, or a corrected verdict) but records them in their
  separate fields; only a recurrence increments `recurrence_count`. Whether
  WP-04 treats a post-validation recurrence differently is unknown (§2 point
  8).
- **INC-4 [P — prep §2.2 "Separation rule"].** Observed facts, hypotheses, and
  reproduction-supported conclusions are stored in separate fields and never
  merged. A hypothesis that later gains reproduction support is recorded as a
  new conclusion entry citing the reproduction evidence; the original
  hypothesis entry is preserved, annotated, never rewritten.
- **INC-5 [P — addendum refinement 2].** Immutable record versions,
  independently verifiable evidence links, append-only correction history.
- **INC-6 [DECIDED — Register §1 principle 8, B1; P — prep].** No incident is
  classified automatically. Opening an incident from a detector candidate is
  a recorded human/orchestrator judgment (`detector_rule` +
  `candidate_record_id` + who opened it and why).

### 6.2 Incident record fields (prep §3.1, CR-09 values, addendum CR-03 field) [P]

Missing required field → record incomplete, returned without verdict (prep §3).

| Field | Required? | Content and rules |
|---|---|---|
| `incident_id` | Required | Stable id, proposed `INC-YYYY-NNN`; never reused. |
| `status` | Required | Exactly one of `OPEN`, `FIXED`, `WATCH`, `VALIDATED`, `REOPENED` (VOC-5). |
| `title` | Required | Observed behavior, not presumed cause. |
| `observed_facts` | Required | Each with a source pointer; no interpretation. |
| `hypotheses` | Required (may be empty with stated reason) | Each labeled hypothesis, with author and date; never presented as findings. |
| `reproduction_supported_conclusions` | Required (empty until reproduction) | Each cites reproduction evidence; never filled from a hypothesis alone. |
| `detector_rule` | Required if detector-sourced | R1–R6, or `manual` with reason. |
| `candidate_record_id` | Required if detector-sourced | The detector-candidate record (DET-8 id). |
| `fix_reference` | Required for FIXED and later | Commit, PR, or procedure-change id. A merged PR never implies validation. |
| `fix_description` | Required for FIXED and later | What changed, where. |
| `fix_presence_evidence` | Required for WATCH and later | Fix present in the live system, not merely merged. |
| `record_creation_time` | Required | Used by §7. |
| `watch_start` | Required for WATCH and later | Computed per §7; **the reading applied (W-A/W-B/W-C) is named**; labeled PROVISIONAL while H5 is open (WAT-4). |
| `watch_window` | Required for WATCH and later | Start, end condition, extensions (each a full window), current window number, task-counting rule applied (SIE-02). |
| `exposure_evidence_link` | Required for VALIDATED; non-empty | Operational, in-window, specific (§10). Never fixture/synthetic. |
| `regression_test` | Required for VALIDATED | Identifier and passing result post-fix. |
| `reproduction_evidence` | Required for VALIDATED | Reproduced failure, or documented reproduction analysis with its limit stated. |
| `independent_verification` | Required for VALIDATED | Verifier identity, method, target commit/artifact, verdict. Until the D2 operational verifier role is decided: `NOT SATISFIED — D2 role pending`, and the incident is NOT labeled independently validated (H4). |
| `sufficiency_judgment` | Required for VALIDATED | Judgment text: why the evidence suffices, by whom (judge role OPEN pending D2), date. A structural check never substitutes (H6). |
| `recurrence_count` | Required | Incremented by recurrence evidence only (INC-2). |
| `recurrence_evidence` | Required for each FIXED/WATCH → REOPENED | Specific pointer + reason (addendum CR-03). |
| `corrected_verdict_evidence` | Required for VALIDATED → REOPENED by correction, and for correction annotations | Specific pointer + reason; not recurrence (addendum CR-03). *Field name from addendum CR-03; not in prep §3.1.* |
| `provenance` | Required | Per field where they differ. |
| `history` | Required | Append-only: each status change with reason, evidence pointer, date. |

---

## 7. Watch computation

- **WAT-1 [REF].** Watch = 30 days OR next 10 tasks, whichever first.
  Unverified against WP-04 (§2 point 2).
- **WAT-2 [OPEN — H5; all readings preserved].** Watch start, three readings:
  - **W-A — fix merge** (prep H5: "[recommended in WP-04 v1.1]").
  - **W-B — first post-merge CI run** (prep H5 alternative).
  - **W-C — unified rule: later of fix-presence and record-creation** (prep
    §2.3: "[REF, not approved]").
  No reading is adopted by this Specification. Note: W-A and W-B do not
  mention record creation; W-C does. Prep boundary note (a) — pre-record
  evidence does not count as exposure — follows from W-C and from the
  exposure rule (EXP-2) independently: pre-record evidence cannot be
  post-record exposure under any reading. **[P — this spec]**: EXP-2 applies
  under every reading.
- **WAT-3 [OPEN — SIE-02].** What counts as one of the "next 10 tasks". Prep
  working text: "runner tasks observed in the window, counted from the window
  start, in the sequence in which they occur" — the unqualified reading.
  Candidate qualifications (all tasks; same project; tasks touching the fixed
  area) remain open.
- **WAT-4 [P — addendum CR-01 "Preserved as OPEN"; brief §7.4 H5].** Every
  watch computation names the start reading and the counting rule it applied.
  A computation under an undecided rule is labeled **PROVISIONAL**, never
  final.
- **WAT-5 [REF].** Watch extends by FULL windows on insufficient exposure —
  a full 30-days-or-10-tasks window, not a partial top-up; each extension
  re-applies the end-condition and exposure tests (addendum CR-01).
- **WAT-6 [REF — prep §2.3; Register CR-09 "approved second-recurrence rule";
  procedure OPEN — SIE-07].** A second recurrence mandates deeper review. It
  does not automatically reopen, validate, or invalidate anything; the review
  decides, with evidence and judgment text. Stage 3 implements the trigger as
  a mechanism only.
- **EXP-1 [REF].** Exposure = operational evidence inside the window ONLY.
  Record creation alone = zero exposure.
- **EXP-2 [REF — prep §2.3].** Fixture evidence, synthetic evidence, and
  pre-window evidence do NOT count as exposure, even if they resemble the
  incident.

### 7.1 Pseudocode (prep §2.3 with addendum CR-01 applied) [P]

```
FUNCTION watch_window(fix_merge_time, first_post_merge_ci_time,
                      fix_presence_time, record_creation_time, reading)
                      RETURNS window:
    # reading MUST be named: "W-A" | "W-B" | "W-C"  (H5 OPEN)
    CASE reading:
        "W-A": start = fix_merge_time
        "W-B": start = first_post_merge_ci_time
        "W-C": start = MAX(fix_presence_time, record_creation_time)   # [REF, not approved]
    IF start NOT ESTABLISHED FROM EXISTING RECORDS:
        RETURN "watch not started: missing <named> evidence"   # never assume a start
    RETURN window(start, reading, provisional = (H5 undecided OR SIE-02 undecided))

FUNCTION watch_end(window, task_sequence, counting_rule) RETURNS end_condition:
    # 30 days OR next 10 tasks, whichever FIRST [REF]
    day_limit  = window.start + 30 days
    task_limit = timestamp at which the 10th task after window.start is observed,
                 counted under counting_rule (SIE-02 OPEN; must be named)
                 (if fewer than 10 occur, day_limit governs)
    RETURN MIN(day_limit, task_limit)

FUNCTION exposure_in_window(window, evidence) RETURNS exposure:
    RETURN FILTER(evidence WHERE timestamp WITHIN window AND is_operational == TRUE)
    # record creation, fixtures, synthetic, pre-window: never counted (EXP-1, EXP-2)

FUNCTION watch_outcome(window, exposure, recurrence_count) RETURNS outcome:
    IF recurrence_count >= 2:
        RETURN "mandatory-deeper-review"          # prep §2.3 branch, retained (WAT-6)
    IF window_end_condition NOT reached:          # addendum CR-01
        RETURN "continue-watch"                   # exposure so far is provisional only
    IF window_end_condition reached AND exposure IS EMPTY:
        RETURN "extend-by-full-window"            # WAT-5
    IF window_end_condition reached AND exposure IS NON-EMPTY
       AND validation_elements_complete:
        RETURN "eligible-for-validation-judgment" # eligibility is not validation
    RETURN "continue-watch"
```

The ordering above (recurrence branch first, then addendum CR-01's branches)
is this Specification's reading of addendum CR-01's instruction to "Replace
the eligibility branch" [P — this spec]. It is stricter than or equal to the
prep in every case.

### 7.2 Boundary notes (prep §2.3 "Worked boundary notes", per reading) [P]

- (a) Fix present before record created: under W-C the watch starts at record
  creation. Under any reading, pre-record operational evidence is not
  exposure (EXP-2).
- (b) Record created before fix present: under W-C the watch starts at fix
  presence; pre-fix evidence does not count.
- (c) Start evidence missing: "watch not started: missing fix-presence or
  record-creation evidence" (or the evidence the named reading needs) —
  never an assumed start.

---

## 8. Validation

- **VAL-1 [P — addendum CR-01, replacing prep §2.2/§2.3 eligibility].**
  Validation eligibility requires ALL of, conjunctively:
  1. The watch window's end condition has been reached (§7).
  2. Sufficient operational evidence inside the window (EXP-1, EXP-2, §10).
  3. All six validation elements:
     (1) reproduced failure, or documented reproduction analysis with its
     limit stated; (2) passing regression test post-fix; (3) independent
     verification, subject to D2 — until the D2 role is approved, recorded
     NOT SATISFIED and the incident is NOT labeled independently validated;
     (4) meaningful exposure; (5) sufficiency judgment text; (6) non-empty
     exposure-evidence link.
- **VAL-2 [P — prep §2.3].** Eligibility is not validation. The sufficiency
  judgment must still be made and recorded.
- **VAL-3 [P — prep §2.2].** Forbidden: validation on a merged PR alone; on
  zero recurrence alone; on fixture evidence; on a staged lesson; by
  upgrading a record in place.
- **VAL-4 [DECIDED — D2].** "Builder explanations are not independent
  evidence." "Human review is required for high-risk, security, governance,
  and first-product decisions."
- **VAL-5 [P — prep §6 H4; Stage 2 spec 05 VI-1–VI-25 Proposed].** Until the
  D2 operational verifier decision, evidence may be prepared but is NOT
  labeled independently validated.
- **VAL-6 [DECIDED — Stage 3 authorization, brief §10 items 9 and 10; D1].**
  No incident reaches VALIDATED in Stage 3. There are no operational
  incidents in Stage 3, Milestone B is out, and synthetic results are never
  claimed as validated learning. The validation path is implemented as a
  mechanism and exercised only by Group B refusals on fixtures.

---

## 9. Lessons

### 9.1 States and creation

- **LES-1 [P — Register CR-09 values; F-10 OPEN].** Lesson states:
  CANDIDATE, UNVALIDATED-STAGED, VALIDATED. CANDIDATE semantics: VOC-6
  [OPEN] — no Stage 3 mechanism uses it.
- **LES-2 [P — addendum CR-02 correction 1] — staging is permitted,
  narrowly.** A lesson may be staged from unvalidated material ONLY when all
  hold: header status exactly `UNVALIDATED-STAGED` (VOC-5; prep form
  `unvalidated-staged`); entry ONLY in INDEX Section 4, never Section 1;
  `validation_claim` = `NONE`; citation as authority for any plan, tool,
  workflow, or compounding change forbidden — permitted uses are format
  testing, INDEX testing, retrieval-procedure testing on fixtures only;
  never counts toward Milestone B, reuse evidence, or improvement metrics.
- **LES-3 [P — addendum CR-02 correction 3, amending prep §2.4].**
  Validated-lesson creation verifies the complete validation reference:

```
REQUIRE validated_incident.status == "VALIDATED"
REQUIRE validated_incident.exposure_evidence_link IS NON-EMPTY
    AND specific (a specific record, event, commit, test result, or log entry)
    AND operational AND inside the watch window (§7, §10)
REQUIRE validated_incident.regression_test identifier AND passing result
REQUIRE validated_incident.sufficiency_judgment text present
REQUIRE validated_incident.independent_verification NOT recorded as NOT SATISFIED
    # until the D2 role is approved, this cannot be met and NO validated
    # lesson may be created
```

  A status string plus a non-empty link, without the above, is insufficient.
- **LES-4 [P — prep §2.4; addendum CR-02].** Never upgrade in place.
  Validation creates a NEW record with a new id; the staged record is cited
  by `supersedes_staged_id` only, annotated "superseded-by: <id>" as an
  appended note, never edited, and its header status remains
  `UNVALIDATED-STAGED` forever. Forbidden: setting a staged record's status
  to VALIDATED; moving it from Section 4 to Section 1; counting it toward
  Milestone B, reuse, or improvement; citing it as authority.
- **LES-5 [P — addendum CR-02 correction 2].** A validated lesson's source is
  always a validated incident, never a staged lesson.
- **LES-6 [DECIDED — Stage 3 authorization, brief §10 item 13; F-23 OPEN].**
  No Stage 3 lesson is promoted to global knowledge. SIE lessons are
  project-local. Register ADR-11: "Project lessons must never automatically
  become global rules."
- **LES-7 [DECIDED — Register §1 principle 8, B1].** SIE cannot
  automatically promote lessons.
- **LES-8 [DECIDED — Stage 3 authorization, brief §11 "EXPLICITLY NOT
  AUTHORIZED"].** No validated lesson is created in Stage 3.

### 9.2 Lesson record fields (prep §3.2) [P]

**Common fields:**

| Field | Required? | Content |
|---|---|---|
| `lesson_id` | Required | Proposed `LES-YYYY-NNN`. A validated lesson never reuses a staged lesson's id. |
| `status` | Required | `UNVALIDATED-STAGED` or `VALIDATED` (VOC-5). `CANDIDATE` reserved, unused (VOC-6). |
| `source_incident_id` | Required | The incident this derives from. |
| `lesson_statement` | Required | One to three sentences; guidance, not proven fact (staged); validated guidance (validated only). |
| `applicability` | Required | When the lesson applies. |
| `non_applicability` | Required, non-empty | When it does NOT apply. Empty = schema failure, for either kind (addendum CR-02 (c)). |
| `review_date` | Required | Re-examination date. |
| `provenance` | Required | Plus staged-vs-validated derivation note. |

**Staged-only:** `validation_claim` = `NONE`; `index_section` =
`unvalidated-staged` only; `citation_use` forbidden as authority; `counting`
never.

**Validated-only:** `supersedes_staged_id` (required if a staged record
preceded it; citation only); `evidence_links` (required, non-empty; includes
the incident's exposure link, regression-test and independent-verification
pointers); `validation_reference` (required; the validated incident and its
sufficiency judgment); `compounding_use` (only validated lessons may be cited
by compounding changes; every compounding change cites its lessons).

---

## 10. Evidence-link requirements (prep §3.4) [P]

- **EVL-1 [P — prep §3.4 item 1] Non-empty for validated.** Empty, placeholder, or fixture link =
  schema failure; blocks validation.
- **EVL-2 [P — prep §3.4 item 2; exposure rule [REF]] Operational only.** Inside the watch window; pre-window, fixture,
  synthetic evidence and record creation never satisfy it.
- **EVL-3 [P — prep §3.4 item 3] Specific, not general.** A specific record, event, commit, test
  result, or log entry — not a whole repository, log file, or general claim.
  A link that cannot be followed to the specific evidence is treated as
  missing (this is the basis of the "unverifiable evidence link" negative
  case, §14.2 N-VAL (f)).
- **EVL-4 [OPEN — SIE-01; P].** Result and waiver/exception in separate
  fields; a waiver never converts FAILED or NOT ASSESSED into PASSED; a
  waiver cannot override a non-waivable security requirement. A proposal, not
  a decided SIE rule.
- **EVL-5 [P — prep §3.4 item 5] Independence.** Evidence produced by the builder of the fix is not
  independent verification evidence ([DECIDED — D2]: "Builder explanations
  are not independent evidence"); the independent-verification field names a
  verifier distinct from the builder (identity OPEN pending D2).
- **EVL-6 [P — prep §3.4 item 6] Preservation.** Mutable evidence gets a durable copy or identifier
  (timestamp; hash where format permits) at validation time; the original is
  never modified.
- **EVL-7 [P — this spec, using Register Appendix A (Catalog §7 evidence
  levels; Catalog version OPEN per D6) and the Stage 2 spec 04 F-13 naming
  proposal].** Every Stage 3 result is labeled with the evidence level it
  actually is: fixture tests are **evidence level: Component** ("Unit tests,
  controlled fixtures, and isolated component behavior"); this Specification
  is **evidence level: Structural**. Nothing in Stage 3 is **evidence level:
  Operational** ("Actual authorized execution with traceable records") or
  Outcome.
- **EVL-8 [OPEN — SIE-06].** Whether SIE validation evidence is packaged
  under the D6 Evaluation Evidence Package (Register Appendix A, pending
  Catalog-version confirmation), a separate SIE package, or both — and who
  assembles it.

---

## 11. Record location — WORKING ASSUMPTION (flagged against F-14)

- **LOC-1 [P — brief §2.1, §7.2, §11 item 9 (working assumption); F-14
  OPEN].** SIE records are **Markdown records plus an INDEX, in the Genesis
  repository**, version-controlled with git history as the audit trail — the
  same "durable, per-record files in the repo" pattern as the Runner's task
  records. Precisely: Runner task records are one JSON file per task in
  `tasks/` plus the append-only `events.jsonl` (`tasks/schema.md`,
  `scripts/events.mjs`); they have no INDEX. The SIE follows the
  one-file-per-record, in-repo pattern, in Markdown, with an INDEX.
- **LOC-2 [P — this spec; illustrative paths only].** Aligned with the Stage 1
  F-14 proposal's project area (`docs/stage-1/11-records-separation.md`:
  `records/projects/<project-id>/knowledge/`), an illustrative layout is:

```
records/projects/genesis/sie/        # illustrative; final path decided with F-14 / in T2
  INDEX.md                            # §12
  candidates/                         # detector-candidate records (DET-8, DET-9)
  incidents/                          # INC-YYYY-NNN.md
  lessons/                            # LES-YYYY-NNN.md (staged and validated, separate ids)
  seed/                               # historical seed observations (T5)
<test fixture directory>/sie-SYNTHETIC/   # fixtures: SEPARATE from all of the above (FXT-1)
tasks/, events.jsonl                  # unchanged: Runner execution records, read-only to the SIE
```

  T0 creates none of these paths. Final paths are chosen in T1/T2 and must be
  reconciled if the Founder decides F-14 otherwise.
- **LOC-3 [DECIDED — Stage 3 authorization, brief §10 items 6 and 12;
  Register ADR-01 constraint; Register §1 principles 4–5].** No second task
  database, no new service, no daemon, no separate execution database. The
  Runner remains the execution-state authority; the SIE never writes Runner
  task records or events; no Runner schema, cron, script, or configuration
  change. "SIE must not introduce a separate execution database or daemon"
  (Register ADR-01).
- **LOC-4 [P — prep "Basis"; [REF]].** The loop runs as ordinary runner
  tasks (§2 point 4, MISSING verbatim).

---

## 12. INDEX (prep §3.3) [P]

```
INDEX.md (Markdown)
├── Header: status of the INDEX itself; generation rule (append-only entries;
│   corrections as annotated supersessions, never silent edits); provenance legend.
├── Section 1: Validated lessons — lesson_id, source incident, applicability summary,
│   review_date, evidence-link pointer.
├── Section 2: Validated incidents (optional cross-reference [P]) — incident_id,
│   validation date, exposure-evidence pointer. Cross-references; no duplication.
├── Section 3: Incidents in WATCH / FIXED / OPEN / REOPENED (working section) —
│   incident_id, status, watch window (if any, with reading named), recurrence_count.
├── Section 4: UNVALIDATED-STAGED lessons (separate, mandatory) — lesson_id, source
│   incident, header status repeated, and "NOT VALIDATED — never cite as authority,
│   never count toward Milestone B." Staged entries appear ONLY here.
├── Section 5: Historical seed observations — seed id, corpus item, status
│   (historical observation), "NOT VALIDATED — fixed is not validated; no
│   retroactive validation."
└── Section 6: Supersessions and corrections (append-only log) — superseded id,
    superseding id, reason, date, evidence. Original text preserved.
```

- **IDX-1 [P — prep §3.3].** Every record file has exactly one primary INDEX
  entry in exactly one section; every entry resolves to an existing file; no
  staged record in Section 1; no validated record in Section 4.
- **IDX-2 [P — addendum refinement 5].** Section 6 references are secondary
  references, not duplicate primary entries.
- **IDX-3 [P — this spec].** Section 3 lists REOPENED incidents too (the prep
  heading names watch/fixed/open only; REOPENED records need a primary home
  and Section 3 is the non-validated working section).
- **IDX-4 [P — prep §4.8].** Fixtures never appear in Sections 1–3 (or in any
  operational INDEX); fixture records live only in the separate fixture
  location (FXT-1).
- **IDX-5 [P — this spec; VOC-6].** No CANDIDATE lesson section exists until
  the CANDIDATE state is defined. Detector-candidate records are not lessons
  and are not INDEX sections 1–6 entries; whether they get an INDEX section is
  a T1/T4 design choice [OPEN, low-impact].
- **IDX-6 [P — prep SIE-P4; H6 OPEN].** The schema + INDEX test (T4) keeps
  structural checks and judgment checks distinct; neither substitutes for the
  other; passing on fixtures proves the test works, not that any real
  incident is handled correctly.

---

## 13. Fixtures (prep §4, with addendum CR-04 controls) — SYNTHETIC

- **FXT-1 [P — prep §4.8; DECIDED — Stage 3 authorization, brief §5.1, §10
  item 9].** Every fixture is labeled SYNTHETIC in its file name or header;
  stored separately from operational and seed records; results reported, if
  at all, as "detector recognition on synthetic input"; never cited as
  exposure, reproduction, or independent-verification evidence; a test that
  passes only on fixtures is reported as "test mechanics verified on
  fixtures", never "system verified".
- **FXT-2 [P — prep §4, absolute].** A fixture never proves a real failure, a
  runner defect, a fix, validation, a lesson, reuse, or improvement.

| Fixture | SYNTHETIC input | Expected output | Proves only | Provenance |
|---|---|---|---|---|
| F-R1 | Task record, status blocked, two invented blockers | 1 R1 candidate | Pattern recognized | [P] prep §4.1 |
| F-R2 | One `task_failed` event, one `run_interrupted` event | 2 R2 candidates | Both types recognized | [P] prep §4.2 |
| F-R3 | attempts 2 and 3; control attempts 1 | 2 R3 candidates; 0 for control | ≥ 2 threshold + control | [P] prep §4.3 |
| F-R4 | Three tasks sharing one exact blocker key; control key on one task | 1 R4 candidate listing 3 tasks; 0 for control | Exact-key grouping, ≥ 2 tasks | [P] prep §4.4 |
| F-R4-INS | (a) key missing on a record; (b) blank key; (c) incomparable recorded forms; (d) two keys differing only in case/whitespace, each on one task | (a)–(c) "insufficient evidence: key missing or incomparable", no candidate; (d) no candidate (different exact keys, no normalization) | CR-04 R4 semantics | [P] this spec, from addendum CR-04 |
| F-R5 | One `retry_exhausted` event | 1 R5 candidate | Type recognized | [P] prep §4.5 |
| F-R6 | in_progress at index distance 3; controls: distance exactly 2; recent progress | 1 R6 candidate (distance 3 only) | Strictly > 2 in the tick index | [P] prep §4.6; distance per addendum CR-04 |
| F-R6-INS | (a) last-progress tick missing; (b) last-progress tick not in index; (c) current tick not determinable | "insufficient evidence: tick position not determinable", no candidate | CR-04 R6 semantics | [P] this spec, from addendum CR-04 |
| F-DUP | The same F-R1…F-R6 inputs scanned twice | Same candidate ids; no duplicate candidate records | Deterministic id (DET-8) | [P] this spec, from addendum refinement 3 |
| F-SHA | Claim-input record with a truncated 37-character base identifier; labeled SYNTHETIC and UNVERIFIED CANDIDATE everywhere | No detector rule claimed. Exercises diagnosis: fact recorded as presented; operator-class-error hypothesis separate from runner-defect hypothesis; no equation with a runner-caused failure; independent evidence required before classification | Diagnosis keeps facts/hypotheses/conclusions distinct; no auto-classification | [P] prep §4.7; historical scenario stays UNVERIFIED CANDIDATE [REF] |

---

## 14. Tests

### 14.1 Group A — functional (Milestone A, fixtures only) [REF test names; P designs]

| Test | Proves, on fixtures only |
|---|---|
| DET | Detector recognizes each rule's fixture (F-R1–F-R6), including controls and CR-04 insufficient-evidence cases |
| INC | Incident record opens with correct fields and status (`OPEN`), from a detector candidate by a recorded judgment (INC-6) |
| DIA | Diagnosis keeps facts, hypotheses, and reproduction-supported conclusions distinct (incl. F-SHA) |
| FIX | Fix linkage records the fix reference without claiming validation (OPEN → FIXED only) |

### 14.2 Group B — safety/negative (all six) [REF that they are required; P designs, addendum corrections applied]

Each negative input must be REFUSED (or refused upgrade/validation/count/
application). If it is accepted, the test FAILS. Inputs are fixtures or draft
records only, never operational data (prep AC-P6-2).

- **N-VAL [P — prep §5.1 + addendum CR-01 + refinement 4].** Refuse
  validation for: (a) merged PR, no regression test; (b) regression test,
  zero exposure; (c) exposure, no sufficiency judgment; (d) everything except
  independent verification (D2 role pending); **(e) all elements present and
  non-empty exposure, but window end condition not reached (addendum
  CR-01)**; **(f) exposure link that cannot be followed to specific evidence
  (EVL-3; refinement 4 "unverifiable evidence links")**; **(g) a corrected
  verdict recorded as a recurrence, incrementing `recurrence_count` (addendum
  CR-03; refinement 4 "corrected-verdict handling")**. Missing element named
  in each refusal. Fails if any path reaches VALIDATED from (a)–(f), or if (g)
  is accepted, or if a merged PR alone, zero recurrence alone, or fixture
  evidence alone produces validation.
- **N-LES [P — addendum CR-02 correction 2 + refinement 4].** Refuse: (a) a
  *validated* lesson citing an incident in OPEN, FIXED, or WATCH; (b) a
  *validated* lesson citing a staged lesson as source; (c) a lesson of either
  kind with empty `non_applicability` (schema rejection); **(d)
  staged-to-validated promotion: setting a staged record's status to
  VALIDATED in place, or moving its entry to Section 1 (refinement 4)**; (e)
  validated-lesson creation without the complete LES-3 validation reference.
  **Not refused:** legitimate staging under LES-2. Fails if any of (a)–(e) is
  accepted, or if LES-2 staging is refused.
- **N-HIST [P — prep §5.3, unchanged].** Refuse: (a) validation of a seed
  record citing only its already-merged historical fix; (b) pre-record
  operational evidence as exposure; (c) in-place relabeling of a seed record
  to VALIDATED.
- **N-REU [P — prep §5.4, unchanged; H2 OPEN].** Refuse: (a) reuse claimed
  from a staged lesson; (b) reuse with no task (manufactured or prescribed
  reuse task); (c) reuse outside the lesson's applicability. "There is no
  prescribed reuse task [REF]; preparation must not invent one." Designed
  against the proposed legitimate-task-only rule, with the assumption marked.
  N-REU tests *refusal*; it demonstrates no reuse.
- **N-EVAL [P — prep §5.5, unchanged].** Refuse or downgrade to "no
  improvement claim supported": improvement citing only a staged lesson; only
  an unvalidated incident; no lesson at all.
- **GOV [P — prep §5.6, unchanged].** Refuse or hold pending Founder
  decision: (a) governance-adjacent compounding change (governance,
  authorization, security policy, first-product decision) without recorded
  Founder approval; (b) a change citing a validated lesson that also expands
  autonomy, permissions, or scope, without Founder approval; (c) a waiver or
  exception to a safety rule granted by a builder or verifier. Founder
  approval is the only pass path ([DECIDED — D2: human review for
  governance]; F-21 OPEN — no delegate appointed, brief §7.3). "Silence,
  delay, or unavailability is never approval" (Register ADR-09 states
  "Silence and timeout never equal approval").

The placement of refinement 4's extra cases inside N-VAL and N-LES is this
Specification's proposal [P — this spec]; the addendum adds the cases without
assigning them to tests.

### 14.3 Group C — NOT in Stage 3

VAL, LES, REU, EVA (positive) are Milestone B tests. **TST-C [DECIDED — Stage
3 authorization, brief §5.4, §11].** No Stage 3 task designs any Group C test
as passable; no Stage 3 result is reported as a Group C pass.

---

## 15. Procedure and the first live loop

- **PRO-1 [P — prep SIE-P3].** A live loop turn (when separately authorized)
  is an ordinary runner task that: reads existing records only; runs the
  detector; files detector candidates; opens or updates incident records by
  recorded judgment; never equates a candidate with a failure; never
  manufactures a failure; escalates governance/security/material-risk/
  authorization-change/designated-gate items to Founder review; records what
  was checked even when nothing was found (a null result is a record, not an
  absence). T3 writes this procedure; T0 only fixes its requirements.
- **PRO-2 [DECIDED — D1; Stage 3 authorization, brief §10 item 8].** No
  manufactured incidents or unnecessary tasks. No faked failures, ever. No
  demo failing test on live systems (H1 OPEN).
- **PRO-3 [REF — UNVERIFIED; §2 point 3].** First-live-loop trigger, as
  reconstructed by the prep: the first real post-November-5 failure, or a
  seed-docs inconsistency if none occurs in 30 days. Fallback criteria
  [OPEN — SIE-05].
- **PRO-4 [P — prep §7 item 3; brief §5.5].** The first live loop starts only
  when (a) the November 5 verdict has been issued and preserved, (b) SIE
  implementation has been explicitly authorized by the Founder, and (c) the
  WP-04 trigger is met. It does not start by passage of time, by completion
  of this Specification or of any Stage 3 task, or by the absence of a
  failure.
- **PRO-5 [DECIDED — Stage 3 authorization, brief §10 item 10, §11].**
  **Stage 3 does not start the first live loop, and this Specification
  authorizes no live loop.** The first live loop is a separately authorized
  step after Stage 3. T8's readiness checklist does not start it and
  distinguishes readiness from authorization.

---

## 16. Retrieval, reuse, compounding, governance

- **RET-1 [REF — UNVERIFIED; §2 point 6].** Retrieval is via grep until the
  Graphiti conjunctive trigger is met; the trigger is NOT met. Exact
  threshold and grouping: MISSING.
- **RET-2 [P — prep AC-P7-3].** Grep results are candidate material for
  judgment, never automatic reuse or automatic lesson promotion.
- **REU-1 [OPEN — F-36; P — Register CR-01 proposed rule, carried as Stage 3
  handling by brief §4/§11 item 7].** Reuse judgment: (1) the applying agent
  documents the lesson used, the decision influenced, and the resulting
  change; (2) an independent verifier evaluates whether the lesson was
  genuinely applied and whether the claimed result is supported; (3) an
  authorized human makes the final classification or validation decision
  where required; (4) the evidence record preserves lesson, task, decision,
  verifier findings, and final judgment. "The verifier cannot validate its
  own work or the work it performed as the applying agent" (Register CR-01).
  **F-36 is not decided by this Specification or by Stage 3 implementation.**
- **REU-2 [P — prep §5.4; H2 OPEN].** Reuse evidence comes only from a
  legitimate task citing a validated lesson, within its applicability. No
  reuse is demonstrated in Stage 3.
- **CMP-1 [REF — prep "Basis"].** Compounding changes plans, tools, or
  workflows only from validated lessons, citing the lesson(s);
  governance-adjacent changes need Founder approval; changes tracing to
  unvalidated incidents are rejected. No compounding change occurs in Stage 3.
- **CMP-2 [DECIDED — D8, for Stage 5 only].** During Stage 5 primary
  repeatability windows, new lesson exposure and process/tool changes are
  queued until between windows. Not applicable in Stage 3; recorded so later
  stages inherit it.

---

## 17. Conflicts and inconsistencies surfaced for review

None of these is resolved by this Specification. Each names what would
resolve it.

| ID | Conflict | Between | Handling here | Resolved by |
|---|---|---|---|---|
| C-1 | SIE Phase 1 = A+B vs. Phase 1 = functional (A) | Prep §1 [D1/REF] + addendum refinement 1 vs. advisor breakdown / brief §3 | Stage 3 exit = Milestone A (SC-9); phases not used in exit claims (SC-11) | WP-04 quote (§2 pt 7) + Founder decision |
| C-2 | Watch start: fix merge vs. first post-merge CI vs. unified later-of rule | Prep H5 ("fix merge [recommended in WP-04]") vs. prep §2.3 unified rule "[REF, not approved]" | All three preserved; computations named and PROVISIONAL (WAT-2, WAT-4) | WP-04 quote (§2 pt 2) + H5 decision |
| C-3 | Prep tags A+B line [D1/REF] but D1's approved wording does not mention phases | Prep §1 vs. Register §10 D1 | Treated as [REF] at most; not as D1 | Correction in a prep revision |
| C-4 | Status string case: `open`/`unvalidated-staged` (prep, "exact header string [REF]") vs. OPEN/UNVALIDATED-STAGED (Register CR-09) | Prep §2.2–§3.2 vs. Register CR-09 | CR-09 form stored (VOC-5) | WP-04 quote (§2 pt 8) + F-10 decision |
| C-5 | Lesson state CANDIDATE exists in Register CR-09 but has no definition, record, transition, or INDEX section in prep/addendum | Register CR-09 vs. prep §2.4/§3.2 | Reserved, unused in Stage 3 (VOC-6) | WP-04 quote + F-10 decision |
| C-6 | "Candidate" names both a detector output and a lesson state | Prep §2.1 vs. Register CR-09 | Always qualified (VOC-7) | Terminology decision (F-10) |
| C-7 | Seed corpus "ten items plus the truncated-base-SHA candidate": is SHA one of ten or an eleventh? | Prep SIE-P5 exit vs. prep §4.7 | Not guessed | WP-04 quote (§2 pt 5) |
| C-8 | Graphiti trigger operator grouping ambiguous ("A AND B OR C") and threshold is a range ("50–100+") | Prep "Basis" | Not interpreted | WP-04 quote (§2 pt 6) |
| C-9 | Prep `validated -> reopened` allowed "new evidence contradicting the validation"; addendum CR-03 assigns VALIDATED → REOPENED to corrected-verdict evidence | Prep §2.2 vs. addendum CR-03 | Both paths kept, separate fields; only recurrence increments count (INC-3) | Addendum re-review |
| C-10 | Prep `watch_outcome` grants eligibility mid-window | Prep §2.3 vs. addendum CR-01 | Addendum governs (§7.1) | Already corrected (addendum, pending re-review) |
| C-11 | Prep `open -> reopened` vs. AC-P2-1 | Prep §2.2 vs. prep AC-P2-1 | Removed per addendum CR-03 | Already corrected (addendum, pending re-review) |
| C-12 | Prep N-LES refused all lesson creation from unvalidated incidents, incl. staging | Prep §5.2 vs. addendum CR-02 | Addendum governs (N-LES, LES-2) | Already corrected (addendum, pending re-review) |
| C-13 | Brief's T0 entry criterion "WP-04 v1.1 retrieved" not met | Brief §9 T0 vs. available sources | Proceeded under AC-T0-2's "flagged as missing" branch | Retrieval of WP-04 text; Founder/coordinator note |
| C-14 | Prep field names (`attempt_count`, `last_progress_tick`) vs. repo records (`attempts`; no recorded tick index found) | Prep §2.1 vs. `scripts/task-state.mjs`, `tasks/schema.md` | Observation only (§5.3); T1 reconciles | T1 + SIE-03 |

Any conflict between this Specification and WP-04 v1.1, a Founder decision
(D1–D8), or the M10 freeze is resolved in favour of the Founder decision and
the freeze; this Specification would then be wrong and must be corrected
(prep §7 item 6; addendum non-authorization item 4).

---

## 18. Stage 3 task mapping (what each task takes from this Specification)

| Task | Uses | Blocked by §2 gap? |
|---|---|---|
| T1 Detector | §5 (DET-1–DET-9), F-R1–F-R6, F-R4-INS, F-R6-INS, F-DUP | Point 1 (exact rules); C-14 |
| T2 Incidents, status machine, watch | §6, §7, §8, VOC-5 | Points 2, 8 (computation stays PROVISIONAL) |
| T3 Procedure | §15 | Point 3 (trigger wording); point 4 should be cited |
| T4 Schema + INDEX tests | §6.2, §9.2, §12 (IDX-1–IDX-6) | — |
| T5 Seed records | §12 Section 5, N-HIST, F-SHA | **Point 5 — entire list missing** |
| T6 Group B | §14.2 | Points 2, 8 (encodes the standards) |
| T7 Staging + retrieval | §9, §12 Section 4, §16 RET-1/RET-2 | Point 6 |
| T8 Demonstration + readiness checklist | §14, §15 PRO-4/PRO-5, EVL-7 | — (reports the open gaps) |

---

## 19. Open items (prep §6; brief §7.4) — all OPEN

Nothing below is decided by this Specification.

| ID | Item | Owner | What unblocks it | Stage 3 handling |
|---|---|---|---|---|
| H1 | Demo failing test: runner task (recommended in WP-04 v1.1 [REF]) vs. orchestrator | Founder (decision); orchestrator (preparation) | Founder decision | Not needed: fixtures only, no live demo failing test |
| H2 | Reuse recognition rule: legitimate-task-only | Founder | Founder decision | N-REU designed against it, assumption marked; no reuse demonstrated |
| H3 | Sample-size threshold (baseline ref ≥5 guided + ≥5 unguided [REF]; = F-26) | Founder, on review advice | Founder decision or review recommendation | No threshold fixed; no sample-size claim |
| H4 | Independent verification subject to D2 | Founder (D2 operational decision); Register (record) | D2 operational verifier decision (Stage 2 spec 05 is a proposal) | Evidence prepared but not labeled independently validated; `NOT SATISFIED — D2 role pending` |
| H5 | Watch start (W-A / W-B / W-C) | Founder, on review advice | Founder decision selecting a reading or approving W-C | All readings preserved; computations PROVISIONAL (WAT-2, WAT-4) |
| H6 | Schema adequacy: structural + judgment | Founder, on review advice; orchestrator | Founder decision | Structural and judgment checks distinct (IDX-6) |
| SIE-01 | Waiver vocabulary in SIE records (separate fields) | Founder, on review advice | Founder decision | Carried as [P] (EVL-4) |
| SIE-02 | "Next 10 tasks" counting | Founder, on review advice | Founder decision or review clarification | Unqualified reading, named, PROVISIONAL (WAT-3) |
| SIE-03 | Detector scope boundary | Founder, on review advice; orchestrator | Founder decision or review clarification | Task records and events only (DET-5); tick-index question (§5.3) |
| SIE-04 | Seed-record authorship and review | Founder; orchestrator | Founder decision or review clarification | Seed records labeled historical observations, not verified |
| SIE-05 | First-live-loop fallback criteria | Founder, on review advice | Founder decision or review clarification | Not needed in Stage 3 (no live loop); needed before live-loop authorization |
| SIE-06 | Evidence package assembly for SIE | Founder; Register (record) | D6 Catalog-version decision + D5 outcome | EVL-8; packaged under D6 contract pending confirmation; owner question open |
| SIE-07 | Mandatory-deeper-review procedure | Founder, on review advice | Founder decision or review clarification | Trigger implemented as mechanism (WAT-6); procedure undefined |
| SIE-D2 | D2 verifier identity / risk classes | Founder; Register | D2 operational decision + ADR-05 definitions | Stage 2 spec 05 used as working method only |
| SIE-D5 | D5 architecture outcome | Founder | D5 outcome (ADR-02) | Transport-neutral; no API/service/DB assumed |
| SIE-D6 | D6 Catalog version | Founder; Register | Exact Catalog version identified | Appendix A referenced, not restated; contract not final |
| F-36 | SIE reuse judgment | Founder | Founder decision | REU-1 proposal; not decided by Stage 3 |
| F-14 | Project-record storage | Founder | Founder decision | LOC-1 working assumption |
| F-10 | Verdict and lesson vocabulary | Founder | Founder decision | VOC-1 used as working rule |
| WP-04 | The eight §2.2 verbatim points | Coordinator (retrieval); Founder (any conflict) | WP-04 v1.1 text quoted into a revision of this Specification | §2; dependent tasks carry the gap |
| SPEC-1 | Whether a still-stuck task yields new R6 candidates on later scans (DET-8) | T1 builder (proposal); Founder only if it affects recurrence | T1 design + review | [OPEN], low impact |

---

## 20. Explicitly NOT decided or authorized here (AC-T0-4)

- **No operational evidence is claimed.** No incident, detector result on
  real data, validation, lesson, reuse, evaluation, or improvement. This
  document is evidence level: Structural at most (EVL-7).
- **No live loop is authorized** — not the first live loop, not any turn
  (PRO-5).
- Nothing here decides: F-36, F-14, F-10, F-16, F-21, F-23, F-34, F-26/H3,
  H1–H6, SIE-01–SIE-07, the D2 operational model, the D5 outcome, the D6
  Catalog version, the SIE phase breakdown beyond Stage 3's working use
  (C-1), or any §2.2 verbatim point (those are confirmed by quotation).
- No Milestone B, Group C, validated lesson, reuse claim, improvement claim,
  or global lesson promotion.
- No Runner change, database, service, daemon, deploy, spending, production
  contact, new model provider, or new infrastructure.
- No WP-04 wording is quoted or invented. Every [REF] is a reconstruction
  carried from the prep draft and is unverified.
