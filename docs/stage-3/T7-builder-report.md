# T7 Builder Report — Lesson staging + grep retrieval

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

**The limit of these tests (EVL-7, AC-T4-3): passing on fixtures proves the
test works, not that any real incident is handled correctly.** Every result
below is "test mechanics verified on fixtures", never "system verified". No
input is an operational record. No validated lesson was created (LES-8), no
incident reached VALIDATED (VAL-6), no lesson was promoted to global
knowledge (LES-6/LES-7), and no compounding change was made (CMP-1).

## Identity

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T7 — Lesson staging + retrieval; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Starting commit | `e2e06b8` (branch `stage-3/sie-milestone-a`; T5 fix round 1, Codex PASS; PR #36 open, not merged) |
| Resulting commit | "Stage 3 T7: lesson staging + grep retrieval (AC-T7-1..AC-T7-3)" on `stage-3/sie-milestone-a`, then fix round 1 (below). The verifier must take the exact SHA from the branch, not from this report |

## Fix round 1 (Codex round 1, F-T7-1–F-T7-5)

Codex round 1 (verdict 2026-11-06 ~13:37 MST, on commit `bb6f1cb`) returned
NEEDS FIXES with five findings. This round fixes exactly those five, in the
same three T7 files only, and changes no open-finding status: C-8 (grouping
and threshold) stays open; F-36, F-10, F-14, C-16, C-19, C-20, and D2 are
untouched; no validated lesson or VALIDATED incident is created (the
VALIDATED-status incident in the tests is a hand-built SYNTHETIC literal
with a matching synthetic history entry, not produced by any validation
path — see the test comment).

| Finding | Fix |
|---|---|
| F-T7-1 MAJOR (S-8 effectively selected threshold 50) | `graphitiTriggerStatus` now uses a THREE-VALUED count predicate: below 50 it is false (below every threshold in the range); at or above 100 it is true (meets every threshold in the range); from 50 to 99 it is unresolved (`null`). Both readings are evaluated with three-valued logic; a verdict is reported only when both agree on a Boolean. A count in the 50–99 band with an acted-on superseded fact (or a grep-unanswerable query class) now reports `trigger_met: null`, status `UNDECIDED_THRESHOLD_OPEN_C8`, retrieval stays `grep`. The one band case that still settles: with neither conjunct nor disjunct true, both readings are false whatever the predicate is, so NOT met is reported. The "no single threshold chosen" test now asserts this semantic requirement (not just labels/band boundaries). The pre-fix claim that (60, true, false) met the trigger is withdrawn |
| F-T7-2 MAJOR (T4-style supersession notes ignored) | One shared parser (`parseSupersededByNote` / `annotationSupersedingId`) reads the LES-4 note text from both the `annotation` and the `note` fields. It is used by BOTH `supersedingIdOf` (detection/classification) and the duplicate guard in `annotateSuperseded`, so a textual annotation without `superseding_lesson_id` is never missed in either place. New compatibility tests cover the T4 `{ note: … }` shape in detection, classification (superseded, never current guidance unflagged), and duplicate refusal |
| F-T7-3 MAJOR (lookup by superseded ID searched for the superseding ID) | `by-superseded-id` now searches Section 6 for the OLD record's identity (pattern = the superseded id itself). The pre-fix form searched for `superseded-by: <superseded id>`, which is the annotation text of records superseded BY that id — the reverse direction. A new distinct kind, `by-superseding-id` (input `superseding_id`, pattern `superseded-by: <id>`), is the reverse lookup. The old test (which asserted the constructed string) is replaced by a test verifying retrieval against a synthetic Section 6 supersession log, plus a reverse-lookup test against synthetic annotated-record content |
| F-T7-4 MAJOR (LES-3 completeness overstated) | `createValidatedLesson` now checks two T7-level LES-3 requirements alongside the delegated T2 elements: the source incident's status must be `VALIDATED` (element `validated_incident_status`; LES-3's first requirement, which T2 does not require) and `validation_reference.incident_id` must name the same incident as the source (element `validation_reference_incident_identity`; T2 reads only the sufficiency judgment, and T4 requires the id to be present but does not cross-check it). The "every LES-3 element except independent verification" test now uses a VALIDATED-status SYNTHETIC literal (the pre-fix version supplied a WATCH incident, so the D2-only refusal was reported without the validated-status element ever being checked); new tests show a WATCH source refused naming `validated_incident_status` and a mismatched reference refused naming `validation_reference_incident_identity` |
| F-T7-5 MINOR (section ranges include the next section's heading) | `sectionRange` now deletes the terminating heading line (`{ /^## Section N+1:/d; p; }`) instead of printing it. The index-section test now runs the range the query actually builds against inline synthetic INDEX content and asserts the next section's heading and entries are absent; the same range scopes the keyword queries, so a heading can no longer match them either |

Also added (Codex round 1, S-11): a dedicated test asserting staging
refuses non-empty caller-supplied `annotations`.
| Risk class | **Routine** (Brief §9 T7) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST |
| Specification | `docs/stage-3/00-sie-specification.md`, version 0.5-draft (§9.1 LES-1–LES-8, §9.2, §12 IDX-1–IDX-6, §16 RET-1/RET-2, §2 point 6, §14 N-LES, §10 EVL-1–EVL-7, §11 LOC-1–LOC-4, §6.2, §1.4) |

## Scope

Brief §9 T7 only: the staged-lesson template, the staging procedure, the
never-upgrade-in-place rule, and the grep retrieval procedure, with the
condition under which the Graphiti trigger would be re-examined (§2.2
item 6). No T0–T6 or T8 work. This build changed no existing file. T2
(`scripts/sie-incident.mjs`) and T4 (`scripts/sie-schema.mjs`) were read
and imported, not modified.

## What was built

`scripts/sie-lesson.mjs` is a pure, dependency-free Node ES module. Its
only imports are from T2/T4 (`checkValidationEligibility`,
`D2_ROLE_STATUS`, `D2_NOT_SATISFIED` from `scripts/sie-incident.mjs`;
`checkLessonStructure` from `scripts/sie-schema.mjs`). It does no file
I/O, no network access, and performs no grep: it builds query forms and
classifies results; the operator/runner executes the grep commands. It
creates no record location (F-14 OPEN) and writes no INDEX. Every function
refuses with a named `LessonRefusal` code (never a bare falsy result) when
its preconditions fail, and every refusal names its reason.

Inputs are plain objects. A staged lesson is built by `stageLesson`; a
validated lesson is never built — `createValidatedLesson` is a refusal
mechanism (see below).

| Function | What it does |
|---|---|
| `stageLesson(input)` | Builds a staged lesson record from unvalidated material ONLY when all LES-2 conditions hold. Fixes `status` = `UNVALIDATED-STAGED`, `validation_claim` = `NONE`, `index_section` = `unvalidated-staged`, `citation_use` = `FORBIDDEN_AS_AUTHORITY`, `counting` = `never`. Refuses (`STAGING_REFUSED`, naming every problem) on: wrong status (including the reserved `CANDIDATE`), `validation_claim` != `NONE`, wrong `index_section`, non-forbidden `citation_use`, non-`never` `counting`, empty `non_applicability`, missing required field, `lesson_statement` outside 1–3 sentences, `lesson_id` outside `LES-YYYY-NNN`, provenance without the derivation note, unknown field, non-empty caller-supplied annotations. The returned record is deep-frozen. The permitted uses (`PERMITTED_USES`: format testing, INDEX testing, retrieval-procedure testing on fixtures only) are a module-level constant, not a record field (decision S-5) |
| `annotateSuperseded(stagedLesson, newLessonId, { date }?)` | LES-4. Returns a NEW frozen record with `"superseded-by: <id>"` appended to `annotations`; the input object is unchanged and its header status stays `UNVALIDATED-STAGED` forever. Refuses a non-staged record (`NOT_STAGED_LESSON`), a self-supersession, a malformed superseding id, and a duplicate annotation of the same id (`ALREADY_SUPERSEDED`). The duplicate guard uses the shared "superseded-by" parser (fix round 1, F-T7-2), so a textual annotation without `superseding_lesson_id` still counts as an existing supersession |
| `supersedingIdOf(lesson)` | Reads the superseding id from a record's annotations (or `null`), through the shared parser: the LES-4 note text is read from either the `annotation` or the `note` field, so T4's `{ note: 'superseded-by: …' }` shape is accepted as well as T7's own shape (fix round 1, F-T7-2) |
| `createValidatedLesson({ lesson, source, watch })` | LES-3 / LES-5 / LES-8. NEVER returns a validated lesson in Stage 3. Refusal order: staged source (`STAGED_LESSON_SOURCE`, LES-5) → non-VALIDATED lesson status (`WRONG_STATUS`, LES-4) → T4 structure failure (`LESSON_STRUCTURE`) → source-incident mismatch (`SOURCE_MISMATCH`) → missing watch computation (`MISSING_WATCH_COMPUTATION`) → incomplete LES-3 reference via T2's `checkValidationEligibility` PLUS two T7-level LES-3 requirements (fix round 1, F-T7-4): source incident status must be `VALIDATED` (`validated_incident_status`) and `validation_reference.incident_id` must name the same incident as the source (`validation_reference_incident_identity`) → `INCOMPLETE_VALIDATION_REFERENCE`, naming the failing elements; `INCOMPLETE_RECORD` if the incident itself is incomplete) → only independent verification missing (`INDEPENDENT_VERIFICATION_NOT_SATISFIED`, D2 pending) → defensive final refusal (`NO_VALIDATED_LESSON_IN_STAGE_3`, LES-8) even for a fully eligible reference |
| `buildRetrievalQuery(input)` | The five grep query forms (see "Grep command forms"). Section scoping: lesson queries must name `"1"`, `"4"`, or explicitly `"both"`; a missing/invalid section is refused (`MISSING_SECTION_SCOPE`), never silently mixed. `"both"` returns two separate section-scoped commands. `index_file` is required — no default path is invented (F-14). Patterns are passed to `grep -F` (fixed strings). `by-superseded-id` searches Section 6 for the OLD record's id (fix round 1, F-T7-3); `by-superseding-id` is the distinct reverse lookup. Section ranges exclude the terminating heading (fix round 1, F-T7-5) |
| `classifyRetrievalResult(result, { as_current_guidance }?)` / `classifyRetrievalResults(results, opts?)` | Marks every result `CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY`, `automatic_reuse: false`, `automatic_promotion: false` (RET-2, AC-T7-3). A result annotated `superseded-by` is flagged `superseded: true` with the superseding id surfaced and `current_guidance: false`. Asking for a superseded record as current guidance is refused (`SUPERSEDED_AS_CURRENT_GUIDANCE`) |
| `graphitiTriggerStatus(recordCount, actedOnSupersededFact, grepUnanswerableQueryClass)` | Evaluates the WP-04 trigger exactly as written (see "Graphiti re-examination condition"). The count predicate is three-valued (fix round 1, F-T7-1): below 50 false, at or above 100 true, 50–99 unresolved (`null`). Both operator groupings are evaluated side by side with three-valued logic; a verdict is reported only when they agree on a Boolean. Bad inputs are refused (`BAD_INPUT`) |
| `countSentences(text)` | Naive terminal-punctuation sentence counter for the §9.2 1–3 sentence rule (decision S-2) |

## Spec sections implemented

- §9.1 LES-1 (states; `CANDIDATE` refused as reserved, VOC-6), LES-2
  (staging, narrowly), LES-3 (complete validation reference, via T2's
  `checkValidationEligibility`), LES-4 (never upgrade in place), LES-5
  (validated source is always a validated incident), LES-6/LES-7 (no
  promotion; enforced by never producing a validated lesson), LES-8 (no
  validated lesson in Stage 3; enforced by the refusal mechanism).
- §9.2 lesson record fields (common, staged-only, validated-only;
  `non_applicability` non-empty for either kind, CR-02 (c)).
- §12 IDX-1 (exactly one primary entry; no staged record in Section 1;
  no validated record in Section 4) — verified through T4's `checkIndex`
  in the tests; IDX-2 (Section 6 as the supersession log for the
  by-superseded-id query).
- §16 RET-1 (grep until the Graphiti trigger; the "NOT met" assessment
  labeled as the prep's, DV-7) and RET-2 (candidate material only).
- §2 point 6 (Graphiti trigger quoted as-is; grouping and threshold not
  interpreted, C-8).
- §10 EVL-7 (evidence levels stated in the module header, the test-file
  header, `TEST_LIMIT`, `EVIDENCE_LEVEL`, and this report).
- §13 FXT-1/FXT-2 (fixtures labeled SYNTHETIC, fixtures only in the test
  file, never in an operational INDEX).
- §14 N-LES (d) staged-to-validated promotion refused; (b) validated
  lesson citing a staged lesson refused; (c) empty `non_applicability`
  refused; (e) validated-lesson creation without the complete LES-3
  reference refused. Legitimate staging under LES-2 is not refused.

## Per-AC evidence (claims — the verifier decides)

| AC | Builder claim | Evidence the verifier can inspect |
|---|---|---|
| AC-T7-1 | **Met.** No procedure step edits a staged record's status to validated. `stageLesson` only ever sets `UNVALIDATED-STAGED`; `annotateSuperseded` returns a new object whose status is still `UNVALIDATED-STAGED` and leaves the original unchanged (asserted by deep equality); `createValidatedLesson` refuses a staged-status lesson with `WRONG_STATUS` and never returns a record | `stageLesson`, `annotateSuperseded`, `createValidatedLesson`. Tests "AC-T7-1: annotateSuperseded appends the note…", "AC-T7-1: creating a validated lesson from a staged lesson is refused (LES-5)", "AC-T7-1: creating a validated lesson with a staged-status lesson is refused, never upgraded in place (LES-4)" |
| AC-T7-2 | **Met.** A staged record's INDEX entry lives only in the unvalidated-staged section. The staged record carries `index_section` = `unvalidated-staged` only, and T4's `checkIndex` confirms: Section 4 placement is consistent; Section 1 placement fails `STAGED_IN_SECTION_1`; placement in both fails `MULTIPLE_PRIMARY_ENTRIES` | `stageLesson` (`index_section`), `checkIndex` (T4, imported). Test "AC-T7-2: a staged record's INDEX entry lives only in the unvalidated-staged section (Section 4)" |
| AC-T7-3 | **Met.** The retrieval procedure states that grep results are candidate material for judgment, never automatic reuse or automatic lesson promotion. Every query form carries `disposition: CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY`, `automatic_reuse: false`, `automatic_promotion: false`; every classified result carries the same three fields; a superseded result is flagged with its superseding id and is never current guidance unflagged — including when the supersession note is in T4's `{ note: … }` shape (fix round 1, F-T7-2) | `buildRetrievalQuery`, `classifyRetrievalResult`, `classifyRetrievalResults`. Tests "AC-T7-3: every retrieval result is candidate material for judgment only…", "AC-T7-3: a superseded result is flagged with the superseding id…", "AC-T7-3: a T4-shaped supersession note flags the result superseded, never current guidance (F-T7-2)" |

Additional coverage asked for by the task brief:

- **Staging refusals:** one test per LES-2 failure (wrong status,
  `CANDIDATE`, `validation_claim`, `index_section`, `citation_use`,
  `counting`, empty `non_applicability`, missing field, 4-sentence
  statement, bad `lesson_id`, missing derivation note, unknown field,
  non-empty caller-supplied `annotations` — S-11, added in fix round 1).
  Every refusal asserts the named `LessonRefusal` code and that the
  message names the reason.
- **Validated-lesson refusals:** staged source, staged status, incomplete
  LES-3 reference (naming `c6_exposure_evidence_link`,
  `c5_sufficiency_judgment`, `c3_independent_verification`), a WATCH source
  refused naming `validated_incident_status` (F-T7-4), a validation
  reference naming a different incident refused naming
  `validation_reference_incident_identity` (F-T7-4; a reference naming no
  incident is refused earlier by T4's structure check), complete reference
  except D2 (now on a VALIDATED-status SYNTHETIC literal, F-T7-4), source
  mismatch, missing watch.
- **Retrieval queries:** all five forms, section restriction never mixing
  Sections 1 and 4, `index_file` required, `BAD_SECTION` for an invalid
  section number; the by-superseded-id form verified against a synthetic
  Section 6 log (F-T7-3), the index-section form verified by running its
  range against synthetic INDEX content (F-T7-5).
- **Graphiti trigger:** each conjunct/disjunct evaluated as written; the
  tri-state count predicate and the unresolved 50–99 band (F-T7-1); the
  current low record count does not meet it; the split-readings case is
  `UNDECIDED_GROUPING_OPEN_C8` and the in-band case is
  `UNDECIDED_THRESHOLD_OPEN_C8`.
- **Module boundary:** source contains no file-I/O, network, or
  record-location literal; the module imports T2/T4 and does not copy
  their logic (no `TRANSITIONS`).

## Grep command forms (exact commands an operator runs)

`<INDEX.md>` is the INDEX file the operator supplies; no default path is
invented (F-14 OPEN). The commands use the T4 INDEX line syntax
(`## Section N: ...` headings; see `sie-schema.mjs` `parseIndex`). Section
scoping is done with `sed -n` over the heading range, then `grep -F`
(fixed strings, so keywords need no regex escaping). Applicability
keyword search is case-insensitive (`-i`); id searches are exact.

| Form | Command (with `INDEX.md` as the supplied INDEX file) |
|---|---|
| (a) Lessons by applicability keyword, Section 1 (validated) | `sed -n '/^## Section 1:/,/^## Section 2:/{ /^## Section 2:/d; p; }' 'INDEX.md' \| grep -n -i -F -- 'runner choice'` |
| (a) Lessons by applicability keyword, Section 4 (staged) | `sed -n '/^## Section 4:/,/^## Section 5:/{ /^## Section 5:/d; p; }' 'INDEX.md' \| grep -n -i -F -- 'runner choice'` |
| (b) Lessons by source incident id, Section 4 (staged) | `sed -n '/^## Section 4:/,/^## Section 5:/{ /^## Section 5:/d; p; }' 'INDEX.md' \| grep -n -F -- 'INC-2026-001'` |
| (c) Superseded records by id, Section 6 | `sed -n '/^## Section 6:/,$/p' 'INDEX.md' \| grep -n -F -- 'LES-2026-001'` |
| (c2) Records superseded BY an id (reverse lookup), Section 6 | `sed -n '/^## Section 6:/,$/p' 'INDEX.md' \| grep -n -F -- 'superseded-by: LES-2026-002'` |
| (d) INDEX-section-scoped lookup, Section 4 | `sed -n '/^## Section 4:/,/^## Section 5:/{ /^## Section 5:/d; p; }' 'INDEX.md'` |

Notes:

- Form (c) finds the Section 6 secondary reference (IDX-2) by the OLD
  record's identity: a Section 6 entry lists the superseded id. The
  pre-fix form searched for `superseded-by: LES-2026-001`, which is the
  annotation text of records superseded BY that id — the reverse
  direction (F-T7-3). The bare id also appears as a superseding id in
  other entries, so the operator confirms the entry's superseded-id
  field; results are candidate material for judgment (RET-2). The same
  id run over lesson record files finds the annotated record itself (its
  header carries its own lesson_id).
- Form (c2) is the distinct reverse lookup (F-T7-3): records superseded
  BY the given replacement id. The same fixed-string pattern run over
  lesson record files finds the annotated records themselves.
- Forms (a), (b), (d) exclude the terminating heading: the `sed` range
  deletes the next section's heading line instead of printing it
  (F-T7-5), so a Section 4 dump no longer includes `## Section 5: ...`
  and a keyword search can no longer return that heading as a match.
- Form (a)/(b) with section `"both"` (explicit request only) produces two
  separate section-scoped commands, one per section; their results are
  kept separate and must never be merged without judgment.
- The module builds these forms and classifies their results; it does not
  run them and does not read the repo. A result is candidate material for
  judgment only (RET-2): a human judges whether it applies. A superseded
  result must carry its supersession flag.

## Graphiti re-examination condition (as implemented)

WP-04 v1.1, quoted as-is (spec §2 point 6, retrieval 2026-11-06):

> "Search stays grep-based and Markdown-first until the Graphiti
> conjunctive trigger fires (50–100+ records AND an agent acting on a
> superseded fact, or a grep-unanswerable query class)."

`graphitiTriggerStatus(recordCount, actedOnSupersededFact, grepUnanswerableQueryClass)`:

- **Range handling (C-8, corrected in fix round 1, F-T7-1).** The count
  predicate is three-valued against WP-04's own "50–100+" wording. A
  count below 50 is below every threshold in the range (predicate false);
  a count at or above 100 meets every threshold in the range (predicate
  true); a count from 50 to 99 leaves the predicate unresolved (`null`),
  because the threshold could still be above the count. **No single
  threshold inside the range is chosen, and no count in the 50–99 band
  can report the trigger met.** The pre-fix form used `recordCount >= 50`
  as a Boolean, which silently decided the threshold at 50: (60, true,
  false) reported MET although a threshold of 100 was still unresolved.
  That claim is withdrawn.
- **Grouping (C-8).** Both readings are evaluated side by side with
  three-valued logic and returned: reading A = (count-predicate AND
  acted-on-superseded-fact) OR grep-unanswerable-query-class; reading B =
  count-predicate AND (acted-on-superseded-fact OR
  grep-unanswerable-query-class). A trigger verdict is reported only when
  both readings agree on a Boolean
  (`MET_UNDER_BOTH_RECORDED_READINGS` /
  `NOT_MET_UNDER_BOTH_RECORDED_READINGS`). When they disagree as
  Booleans, the status is `UNDECIDED_GROUPING_OPEN_C8`; when either
  reading is unresolved because the count sits in the 50–99 band, the
  status is `UNDECIDED_THRESHOLD_OPEN_C8`. In both undecided cases
  `trigger_met` is `null` and the retrieval method stays `grep` until a
  decision is made.
- **Current Stage 3 count.** With a low record count (11 in the test) and
  neither condition, both readings are false:
  `NOT_MET_UNDER_BOTH_RECORDED_READINGS`, retrieval stays `grep`.
- **DV-7 honesty label (C-19).** Whether the trigger is "NOT met" is the
  prep draft's statement (RET-1), **not WP-04's**: the retrieved WP-04 text
  does not say it. The result carries `not_met_statement_provenance`
  (`GRAPHITI_NOT_MET_PROVENANCE`) saying exactly that. This module does
  not attribute "NOT met" to WP-04.

## What is NOT claimed

- **No validated lesson was created.** `createValidatedLesson` refuses on
  every path in Stage 3 (LES-8). The validated-lesson literals in the tests
  are hand-built SYNTHETIC inputs that exercise the refusal paths only;
  they were not produced by any validation path.
- **No incident reached VALIDATED** (VAL-6). The WATCH incidents in the
  tests are built with the T2 module from SYNTHETIC inputs.
- **No lesson promoted to global knowledge** (LES-6/LES-7). SIE lessons
  are project-local; this module promotes nothing.
- **No compounding change** (CMP-1), **no reuse demonstrated** (REU-2).
  Retrieval results are candidate material for judgment only.
- **No open finding decided:** F-36 (reuse judgment), F-10 (CANDIDATE
  stays reserved and unused, VOC-6), F-14 (no record location created or
  assumed), C-8 (grouping/threshold not interpreted), C-16 (DV-3
  meaningful exposure: inherited from T2's `checkValidationEligibility`,
  which carries the DV3 marker and does not enforce the two-user
  condition), C-19 (DV-7 "NOT met" labeled as the prep's), C-20 (DV-8
  grouping / DV-9 threshold: untouched), or the D2 operational verifier
  role (pending; the D2 refusal is the operative ground).
- **No R4 event key invented**, no detector event half claimed, no live
  loop started, no incident manufactured. C-7 and C-15 stay closed (not
  reopened).
- **Passing on fixtures proves the test works, not that any real incident
  is handled correctly.** No result here is "system verified" (EVL-7).

## Builder-flagged items (silent-spec decisions for the coordinator to confirm or correct)

Each decision below is one the spec leaves open; the module states it in
its comments as `SILENT-SPEC DECISION S-n`. None decides an open finding.

| # | Decision | Basis |
|---|---|---|
| S-1 | `citation_use` literal is `'FORBIDDEN_AS_AUTHORITY'` | §9.2 requires the prohibition in a checkable field but fixes no literal. T4's fixture used the prose string `'forbidden as authority'`; this module fixes a machine-checkable constant in the same style as the other enums. If the coordinator prefers the T4 prose string, the constant and its tests change together |
| S-2 | Sentence counting is naive terminal-punctuation counting (`countSentences`) | §9.2 fixes "1–3 sentences" but no counting rule. Abbreviations ("Dr.", "e.g.") over-count. Lesson statements in tests avoid them. A stricter counter would need a decided rule |
| S-3 | The staged-vs-validated derivation note is required as `provenance.derivation_note` (non-empty) | §9.2 says provenance carries "plus staged-vs-validated derivation note" but fixes no field name. This module fixes the name so the requirement is checkable |
| S-4 | LES-4 annotation entry shape is `{ annotation: 'superseded-by: <id>', superseding_lesson_id: <id>, date? }`; the date is included only when supplied. The READER accepts both this shape and T4's fixture shape (`{ note: 'superseded-by: …' }`) through one shared parser, used by both detection and the duplicate guard (fix round 1, F-T7-2) | LES-4 fixes only the note text. This differs from T4's fixture shape (`{ note: 'superseded-by: …' }`); T4's `checkLessonStructure` requires only that `annotations` be a list, so both shapes pass structure. `supersedingIdOf` accepts both shapes |
| S-5 | Permitted uses are a module-level constant (`PERMITTED_USES`), not a record field | §9.2 fixes the record fields, and T4's `checkLessonStructure` refuses unknown fields — an early version of this module put `permitted_uses` on the record and the T4 structure check failed. The record carries the prohibition (`citation_use`); the procedure carries the permitted-uses list |
| S-6 | `createValidatedLesson` refuses on every path in Stage 3, including a defensive `NO_VALIDATED_LESSON_IN_STAGE_3` refusal for a fully eligible reference | LES-8 forbids creating a validated lesson in Stage 3, whatever the reference. The D2 refusal is the operative ground today (c3 always fails while D2 is pending); the final refusal keeps LES-8 enforced even if D2 were decided |
| S-7 | Retrieval: `index_file` is required (no default path invented); section `"both"` is allowed only as an explicit request and returns two separate commands; the superseded-id query scopes to Section 6 (IDX-2) and searches for the OLD record's id, with `by-superseding-id` as the distinct reverse lookup (fix round 1, F-T7-3); section ranges exclude the terminating heading (fix round 1, F-T7-5); patterns use `grep -F`, case-insensitive only for applicability keywords | F-14 OPEN (no record location decided); "never silently mix" Sections 1 and 4; §12 Section 6 is the supersessions log. The `grep -F` choice avoids regex-escaping questions |
| S-8 | Graphiti range: the count predicate is three-valued — below 50 false, at or above 100 true, 50–99 unresolved (`null`); verdict only when both groupings agree on a Boolean; otherwise `UNDECIDED_THRESHOLD_OPEN_C8` (in-band) or `UNDECIDED_GROUPING_OPEN_C8` (readings disagree as Booleans), with `trigger_met: null` and retrieval staying `grep` (fix round 1, F-T7-1) | C-8: grouping and threshold recorded, not interpreted. Only counts outside the whole stated range settle the predicate; a count inside the range settles nothing. The pre-fix form (lower bound 50 as a Boolean) silently decided the threshold at 50 and is withdrawn |
| S-9 | Classification: section `'4'` → `staged: true`, `citable_as_authority: false`, `counts_toward_milestone_b: false`; section `'1'` → `staged: false`; any other section → those three fields are `null` (not claimed) | LES-2 fixes the staged prohibitions; the spec says nothing about what a Section 1 result implies for citability/counting beyond being validated, so the module does not claim it |
| S-10 | `annotateSuperseded` refuses a duplicate annotation of the same id (`ALREADY_SUPERSEDED`) and requires the superseding id to match `LES-YYYY-NNN` | LES-4 annotations are append-only; a second identical annotation would be a second supersession. The id-format check mirrors the §9.2 `lesson_id` form |
| S-11 | Staging refuses non-empty caller-supplied `annotations` (a staged lesson starts with none). A dedicated test now asserts the refusal (fix round 1) | LES-4 annotations are appended later, never at staging; accepting a caller-supplied annotation at staging would let a note predate the record |

Also inherited, not decided here: the LES-3 element check reuses T2's
`checkValidationEligibility`, so it inherits T2's watch-consistency
requirement (F-T2-1: a watch computation inconsistent with the incident's
recorded window satisfies nothing) and T2's DV-3 marker (the two-user
meaningful-exposure condition is NOT enforced, C-16 OPEN).

## Tests and results (builder-observed; re-run required by the verifier)

The builder ran these from the repo root on the uncommitted tree just
before committing fix round 1:

- `node --test scripts/sie-lesson.test.mjs`: **45 tests, 45 pass, 0 fail,
  0 skipped.**
- `npm test` (`node --test scripts/*.test.mjs`): **278 tests, 277 pass,
  0 fail, 1 skipped.** The skip is the pre-existing one. 233 pre-T7 + 45
  T7 = 278.
- `node scripts/status.mjs`: **exit 0**. It prints "Genesis tasks: 15
  total" (blocked 1, completed 14), unchanged.

All results are **test mechanics verified on fixtures**. They do not verify
the system, and they are not validated learning (EVL-7: evidence level
Component at most).

## Mutation check

The builder copied `scripts/sie-lesson.mjs` and
`scripts/sie-lesson.test.mjs` to a temp directory outside the repo
(`/tmp/t7-mutation/`), applied 6 single breaking edits to the temp module
copy, and ran the T7 suite against each. The temp copy was deleted
afterwards; nothing was left in the repo.

| # | Breaking edit (temp copy only) | Result |
|---|---|---|
| 1 | `stageLesson`: accept `validation_claim: 'VALIDATED'` (drop the `!= 'NONE'` refusal) | T7 suite fails (the validation_claim refusal test) |
| 2 | `stageLesson`: set `counting: 'toward-milestone-b'` in the built record | T7 suite fails (the staging-success test: `counting` is `'never'`) |
| 3 | `annotateSuperseded`: set the returned record's `status` to `'VALIDATED'` | T7 suite fails (the AC-T7-1 annotation test: status stays `UNVALIDATED-STAGED`) |
| 4 | `createValidatedLesson`: skip the staged-source check | T7 suite fails (the LES-5 refusal test) |
| 5 | `classifyRetrievalResult`: return `automatic_reuse: true` | T7 suite fails (the AC-T7-3 classification test) |
| 6 | `graphitiTriggerStatus`: report only reading A as the verdict | T7 suite fails (the split-readings UNDECIDED test) |

**6 of 6 mutations caught by the new tests.** No temp copy remains in the
repo (`git status` shows only the three new files).

### Fix round 1 mutation check

The builder repeated the same procedure for the fix round: copied
`scripts/sie-lesson.mjs` and `scripts/sie-lesson.test.mjs` to a temp
directory outside the repo (`/tmp/t7-fix1-mutation/`), applied 6 single
breaking edits to the temp module copy, and ran the T7 suite against each.
The temp copy was deleted afterwards; nothing was left in the repo.

| # | Breaking edit (temp copy only) | Result |
|---|---|---|
| 1 | `graphitiTriggerStatus`: restore the pre-fix Boolean `recordCount >= 50` count predicate (F-T7-1) | T7 suite fails (the "no single threshold chosen" test: (60, true, false) reports MET) |
| 2 | `supersedingIdOf`: ignore the `note` field again (F-T7-2) | T7 suite fails (the T4 note-shape detection and classification tests) |
| 3 | `annotateSuperseded`: duplicate guard checks only `superseding_lesson_id` again (F-T7-2) | T7 suite fails (the textual-note duplicate test) |
| 4 | `by-superseded-id`: restore the pre-fix `superseded-by: ${input.superseded_id}` pattern (F-T7-3) | T7 suite fails (the synthetic Section 6 log test) |
| 5 | `createValidatedLesson`: drop the validated-incident-status check (F-T7-4) | T7 suite fails (the WATCH-source test) |
| 6 | `createValidatedLesson`: drop the reference-identity cross-check (F-T7-4) | T7 suite fails (the mismatched-reference test) |
| 7 | `sectionRange`: drop the terminating-heading deletion (F-T7-5) | T7 suite fails (the exact-section test: the sed output includes `## Section 5:`) |

**7 of 7 fix-round-1 mutations caught by the new tests.** (The
pre-existing round-0 mutation table above is unchanged.)

## Files written

| File | Lines |
|---|---|
| `scripts/sie-lesson.mjs` | 637 |
| `scripts/sie-lesson.test.mjs` | 666 |
| `docs/stage-3/T7-builder-report.md` | 432 |

No fixture files were added to the repository. Every test input is a
SYNTHETIC record or INDEX built inline. No other file was modified,
including the Specification, `scripts/sie-incident.mjs`,
`scripts/sie-schema.mjs`, their tests, existing fixtures, `tasks/`,
`events.jsonl`, CI, and Runner scripts.

## Scope-compliance statement

- **T7 only.** Three new files (the module, its tests, and this report).
  No existing file touched.
- **Read-only boundary.** The module does no file I/O and imports only
  T2/T4. The tests' only I/O is reading the module source. No Runner
  source record, `tasks/`, or `events.jsonl` was touched.
- **Not done:** no PR opened or closed, no PR comment, no merge, no
  deploy, no provisioning, no spending, no database, no production
  contact, no Runner/CI change, no new dependency, provider, server, or
  agent. No network calls apart from the instructed `git push`.
- **No secrets** in any file, log, or the commit message.

## Verdict rationale (builder's, not a verification verdict)

The builder submits T7 **for verification**. AC-T7-1 to AC-T7-3 are claimed
met on SYNTHETIC inputs, as test mechanics only. The builder does not assign
a verification outcome.

## Verification method (to be run by the coordinator/verifier)

1. Read the full diff `e2e06b8..<head>`. Confirm that only these three
   files were added: `git diff --stat e2e06b8..<head>` should list exactly
   `scripts/sie-lesson.mjs`, `scripts/sie-lesson.test.mjs`, and
   `docs/stage-3/T7-builder-report.md`, and `git diff --diff-filter=M
   e2e06b8..<head>` should be empty (nothing modified).
2. Re-run at that commit:
   - `node --test scripts/sie-lesson.test.mjs`: expect **45 tests, 45
     pass, 0 fail, 0 skipped**.
   - `npm test`: expect **278 tests, 277 pass, 0 fail, 1 skipped** (the
     pre-existing skip).
   - `node scripts/status.mjs`: exit 0, "Genesis tasks: 15 total".
3. Read `scripts/sie-lesson.mjs` against Spec §9 (LES-1–LES-8, §9.2),
   §12, §16 RET-1/RET-2, and §2 point 6. Check AC-T7-1–AC-T7-3 against
   the code, not only the tests. In particular:
   - confirm no code path sets a staged record's status to VALIDATED;
   - confirm `createValidatedLesson` cannot return a lesson on any path;
   - confirm the Graphiti function reports both readings and only
     verdicts when they agree on a Boolean, and that no count in the
     50–99 band can report the trigger met;
   - confirm `supersedingIdOf` and the duplicate guard share one parser
     that reads both the `annotation` and the `note` fields;
   - confirm `by-superseded-id` searches for the old record's id and
     `by-superseding-id` is the distinct reverse lookup;
   - confirm the LES-3 check requires the source incident status
     VALIDATED and the reference identity to match;
   - confirm section ranges exclude the terminating heading.
4. Mutation spot-check, suggested: restore the pre-fix Boolean
   `recordCount >= 50` predicate in `graphitiTriggerStatus`, or drop the
   validated-incident-status check in `createValidatedLesson`, and
   confirm the new tests fail.
5. Judge the silent-spec decisions S-1–S-11 (above), especially S-1 (the
   `citation_use` literal vs. T4's prose fixture string), S-4 (the
   annotation entry shape vs. T4's fixture shape), and S-8 (the Graphiti
   range handling).
6. Record source hashes, an independence declaration (Stage 2 spec 05
   VI-9), and skipped checks separately from passed ones.

## Evidence-to-acceptance mapping

| AC | Evidence |
|---|---|
| AC-T7-1 | `stageLesson` (status always `UNVALIDATED-STAGED`), `annotateSuperseded` (new object, original unchanged, status stays), `createValidatedLesson` (`WRONG_STATUS` refusal); the three "AC-T7-1" tests |
| AC-T7-2 | `stageLesson` (`index_section: 'unvalidated-staged'`), T4 `checkIndex` (`STAGED_IN_SECTION_1`, `MULTIPLE_PRIMARY_ENTRIES`); the "AC-T7-2" test |
| AC-T7-3 | `buildRetrievalQuery` (`disposition`, `automatic_reuse: false`, `automatic_promotion: false` on every form), `classifyRetrievalResult` / `classifyRetrievalResults` (same fields on every result; superseded flagging); the two "AC-T7-3" tests |
| Staging refusals (LES-2) | `stageLesson` `STAGING_REFUSED` with named problems; the twelve refusal tests |
| Validated-lesson refusals (LES-3/LES-5/LES-8) | `createValidatedLesson` (`STAGED_LESSON_SOURCE`, `WRONG_STATUS`, `INCOMPLETE_VALIDATION_REFERENCE` incl. the T7-level `validated_incident_status` and `validation_reference_incident_identity` elements, `INDEPENDENT_VERIFICATION_NOT_SATISFIED`, `SOURCE_MISMATCH`, `MISSING_WATCH_COMPUTATION`); the seven refusal tests, incl. the WATCH-source and mismatched-reference tests (F-T7-4) |
| Retrieval query forms (RET-2) | `buildRetrievalQuery` (five kinds, section scoping, `index_file` required); the seven query tests, incl. the synthetic Section 6 log test (F-T7-3) and the synthetic-INDEX exact-section test (F-T7-5) |
| Graphiti trigger (§2 pt 6, C-8, DV-7) | `graphitiTriggerStatus` (both readings, three-valued count predicate, provenance label); the six Graphiti tests, incl. the rewritten "no single threshold chosen" semantic test (F-T7-1) |
| Staging refusal, non-empty annotations (S-11) | `stageLesson` `STAGING_REFUSED` on caller-supplied `annotations`; the dedicated S-11 test |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat e2e06b8..<head>` |
