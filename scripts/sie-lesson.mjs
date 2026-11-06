// SIE staged-lesson template, staging procedure, never-upgrade-in-place, and
// grep retrieval (Stage 3 T7).
// Implements docs/stage-3/00-sie-specification.md (0.5-draft) §9 (LES-1..LES-8,
// §9.2 lesson record fields), §12 IDX-1/IDX-2 (Section 4 placement), §16
// RET-1/RET-2, §2 point 6 (Graphiti trigger, quoted as-is), §10 EVL-7, and
// §13 FXT-1/FXT-2, as pure functions over plain in-memory objects. Brief §9
// T7, AC-T7-1..AC-T7-3.
//
// EVIDENCE LEVEL (EVL-7): fixture tests on this module are evidence level
// Component; this work is Structural. Nothing here is Operational or Outcome.
// A passing test on fixtures is "test mechanics verified on fixtures", never
// "system verified" (FXT-1/FXT-2).
//
// PURE-MODULE BOUNDARY: this module performs no file I/O and no network
// access. It imports only from the existing T2/T4 modules
// (checkValidationEligibility, D2 constants from scripts/sie-incident.mjs;
// checkLessonStructure from scripts/sie-schema.mjs) and Node built-ins
// (none needed). It does NOT perform any grep or read the repo: the retrieval
// procedure builds query forms and classifies results; the operator/runner
// executes the grep commands (see buildRetrievalQuery and the T7 report).
// It creates no record location (F-14 OPEN): no illustrative record-path
// literal appears here, and no INDEX is written.
//
// LES-8 [DECIDED]: NO VALIDATED LESSON IS CREATED IN STAGE 3. VAL-6: no
// incident reaches VALIDATED in Stage 3. createValidatedLesson is therefore
// implemented as a refusal mechanism: every path refuses with a named reason.
// The D2 operational verifier role is pending, so independent verification
// can never be satisfied in Stage 3 and validated-lesson creation always
// refuses on that ground at minimum. Nothing this module returns is a
// validated lesson, a reuse, or a compounding change (LES-6/LES-7, CMP-1,
// REU-2).
//
// GRAPHITI TRIGGER (spec §2 point 6, quoted as-is from WP-04 v1.1,
// retrieval 2026-11-06):
//   "Search stays grep-based and Markdown-first until the Graphiti
//   conjunctive trigger fires (50–100+ records AND an agent acting on a
//   superseded fact, or a grep-unanswerable query class)."
// The grouping ("(A AND B) OR C" vs "A AND (B OR C)") and the threshold
// ("50–100+" is a range, not a single number) are recorded as WP-04 wrote
// them and are NOT interpreted (C-8 OPEN). graphitiTriggerStatus evaluates
// BOTH readings side by side and only reports a trigger verdict when they
// agree AND the count predicate is settled: a count inside the unresolved
// 50–99 band settles nothing, so no verdict that depends on it is
// reported (fix round 1, F-T7-1). Whether the trigger is "NOT met" is the
// prep's statement (RET-1), not WP-04's: the retrieved text does not say
// it (DV-7, C-19 OPEN), so that assessment is labeled as the prep's, not
// attributed to WP-04.
//
// CANDIDATE (VOC-6) stays reserved and unused: no function here accepts,
// produces, or classifies a CANDIDATE lesson state (F-10 OPEN).

import { checkValidationEligibility, D2_ROLE_STATUS, D2_NOT_SATISFIED } from './sie-incident.mjs';
import { checkLessonStructure } from './sie-schema.mjs';

export const TEST_LIMIT =
  'Passing on fixtures proves the test works, not that any real incident is handled correctly (AC-T4-3). ' +
  'Test mechanics verified on fixtures; system not verified.';
export const EVIDENCE_LEVEL = 'Component (fixture tests); Structural (this module). Nothing here is Operational or Outcome (EVL-7).';

// WP-04 v1.1 Graphiti trigger, quoted as-is (spec §2 point 6). Grouping and
// threshold NOT interpreted (C-8).
export const GRAPHITI_TRIGGER_QUOTED =
  'Search stays grep-based and Markdown-first until the Graphiti conjunctive trigger fires ' +
  '(50–100+ records AND an agent acting on a superseded fact, or a grep-unanswerable query class).';
export const GRAPHITI_NOT_MET_PROVENANCE =
  'The assessment that the trigger is "NOT met" is the prep draft\'s (RET-1), not WP-04\'s: ' +
  'the retrieved WP-04 text does not say it (spec §2.9 DV-7, C-19 OPEN).';

export const STAGED_STATUS = 'UNVALIDATED-STAGED';
export const VALIDATED_STATUS = 'VALIDATED';
export const STAGED_INDEX_SECTION = 'unvalidated-staged';
// SILENT-SPEC DECISION S-1 (see T7 report): the checkable citation-use value.
// The spec (§9.2) requires the prohibition be carried in a checkable field
// but fixes no literal; T4's fixture used the prose string 'forbidden as
// authority'. This module fixes the machine-checkable constant below.
export const CITATION_USE_FORBIDDEN = 'FORBIDDEN_AS_AUTHORITY';
export const COUNTING_NEVER = 'never';
export const PERMITTED_USES = Object.freeze([
  'format-testing',
  'index-testing',
  'retrieval-procedure-testing-on-fixtures-only',
]);
export const LESSON_ID_PATTERN = /^LES-\d{4}-\d{3}$/; // §9.2 LES-YYYY-NNN

export class LessonRefusal extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'LessonRefusal';
    this.code = code;
    this.details = details;
  }
}

// ---- helpers ----

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isValidDate = (v) => isNonEmptyString(v) && !Number.isNaN(Date.parse(v));

function deepFreeze(v) {
  if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) deepFreeze(v[k]);
  }
  return v;
}

// SILENT-SPEC DECISION S-2 (see T7 report): sentence counting is naive
// terminal-punctuation counting. A sentence is a non-empty segment ending in
// '.', '!' or '?' at end-of-string or before whitespace. Abbreviations
// ("Dr.", "e.g.") are NOT handled and would over-count; lesson statements in
// tests avoid them. The spec fixes "1–3 sentences" but no counting rule.
export function countSentences(text) {
  if (!isNonEmptyString(text)) return 0;
  return text.trim().split(/[.!?]+(?=\s|$)/).map((s) => s.trim()).filter(Boolean).length;
}

// Shell single-quote escaping for the grep command forms. The patterns are
// passed to grep -F (fixed strings), so no regex escaping is needed.
function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

// Section heading range for the T4 INDEX line syntax ("## Section N: ...";
// see sie-schema.mjs parseIndex). Section 6 has no following section.
// The terminating heading is EXCLUDED: sed ranges are inclusive at both
// ends, so the range deletes the next section's heading line instead of
// printing it (fix round 1, F-T7-5). Without the deletion a Section 4
// dump would include "## Section 5: ..." and a keyword search could
// return that heading as a match.
function sectionRange(section) {
  const n = Number(section);
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new LessonRefusal('BAD_SECTION', `retrieval query refused: section must be 1-6, got ${JSON.stringify(section)}`);
  }
  return n === 6
    ? `/^## Section 6:/,$/p`
    : `/^## Section ${n}:/,/^## Section ${n + 1}:/{ /^## Section ${n + 1}:/d; p; }`;
}

function sectionScopedCommand(indexFile, section, grepArgs) {
  return `sed -n ${shellQuote(sectionRange(section))} ${shellQuote(indexFile)} | grep ${grepArgs}`;
}

// ---- §9.2 / LES-2: staged-lesson template and staging procedure ----

const STAGEABLE_FIELDS = Object.freeze([
  'lesson_id', 'status', 'source_incident_id', 'lesson_statement', 'applicability',
  'non_applicability', 'review_date', 'provenance',
  'validation_claim', 'index_section', 'citation_use', 'counting', 'annotations',
]);

// Builds a staged lesson record from unvalidated material ONLY when all
// LES-2 conditions hold. Refuses, with a named reason, when any fails; never
// silently stages. The returned record is deep-frozen. Fixed staged-only
// values (validation_claim NONE, index_section unvalidated-staged,
// citation_use FORBIDDEN_AS_AUTHORITY, counting never) are set by this
// procedure, not taken from the caller: a caller-supplied value that differs
// is refused, not overwritten silently. The permitted uses (PERMITTED_USES)
// are a module-level constant, not a record field: §9.2 fixes the record
// fields, and T4's checkLessonStructure refuses unknown fields, so the
// record carries the prohibition (citation_use) and the procedure carries
// the permitted-uses list.
export function stageLesson(input) {
  if (!isPlainObject(input)) {
    throw new LessonRefusal('BAD_INPUT', 'staging refused: input must be an object (§9.2)');
  }
  const problems = [];
  const unknown = Object.keys(input).filter((k) => !STAGEABLE_FIELDS.includes(k));
  if (unknown.length) problems.push(`unknown field(s) ${unknown.join(', ')} (§9.2 fields only)`);
  if (!LESSON_ID_PATTERN.test(input.lesson_id ?? '')) {
    problems.push('lesson_id must have form LES-YYYY-NNN (§9.2); a validated lesson never reuses a staged lesson\'s id (LES-4)');
  }
  if (input.status !== STAGED_STATUS) {
    problems.push(`status must be exactly "${STAGED_STATUS}" (LES-2); got ${JSON.stringify(input.status)}`);
  }
  if (!isNonEmptyString(input.source_incident_id)) problems.push('missing required field "source_incident_id" (§9.2)');
  const sentences = countSentences(input.lesson_statement);
  if (!isNonEmptyString(input.lesson_statement)) problems.push('missing required field "lesson_statement" (§9.2)');
  else if (sentences < 1 || sentences > 3) {
    problems.push(`lesson_statement must be 1–3 sentences (§9.2); got ${sentences}`);
  }
  if (!isNonEmptyString(input.applicability)) problems.push('missing required field "applicability" (§9.2)');
  if (!isNonEmptyString(input.non_applicability)) {
    problems.push('missing required field "non_applicability": empty = schema failure, for either kind (§9.2, CR-02 (c))');
  }
  if (!isValidDate(input.review_date)) problems.push('missing required field "review_date" (a valid date) (§9.2)');
  if (!isPlainObject(input.provenance) || Object.keys(input.provenance).length === 0) {
    problems.push('missing required field "provenance" (§9.2)');
  } else if (!isNonEmptyString(input.provenance.derivation_note)) {
    // SILENT-SPEC DECISION S-3 (see T7 report): the staged-vs-validated
    // derivation note (§9.2 "provenance plus staged-vs-validated derivation
    // note") is required as provenance.derivation_note, non-empty. The spec
    // fixes no field name for the note.
    problems.push('provenance must carry the staged-vs-validated derivation note as provenance.derivation_note (non-empty) (§9.2)');
  }
  if (input.validation_claim !== undefined && input.validation_claim !== 'NONE') {
    problems.push('staged lesson requires validation_claim = "NONE" (LES-2, §9.2)');
  }
  if (input.index_section !== undefined && input.index_section !== STAGED_INDEX_SECTION) {
    problems.push(`staged lesson requires index_section = "${STAGED_INDEX_SECTION}" (LES-2, §9.2)`);
  }
  if (input.citation_use !== undefined && input.citation_use !== CITATION_USE_FORBIDDEN) {
    problems.push(`staged lesson requires citation_use = "${CITATION_USE_FORBIDDEN}": citation as authority for any plan, tool, workflow, or compounding change is forbidden (LES-2)`);
  }
  if (input.counting !== undefined && input.counting !== COUNTING_NEVER) {
    problems.push('staged lesson requires counting = "never": it never counts toward Milestone B, reuse evidence, or improvement metrics (LES-2)');
  }
  if (input.annotations !== undefined && !(Array.isArray(input.annotations) && input.annotations.length === 0)) {
    problems.push('a staged lesson starts with no annotations; the LES-4 superseded-by note is appended later, never at staging');
  }
  if (problems.length) {
    throw new LessonRefusal('STAGING_REFUSED', `staging refused (LES-2): ${problems.join('; ')}`, { problems });
  }
  return deepFreeze({
    lesson_id: input.lesson_id,
    status: STAGED_STATUS,
    source_incident_id: input.source_incident_id,
    lesson_statement: input.lesson_statement,
    applicability: input.applicability,
    non_applicability: input.non_applicability,
    review_date: input.review_date,
    provenance: structuredClone(input.provenance),
    validation_claim: 'NONE',
    index_section: STAGED_INDEX_SECTION,
    citation_use: CITATION_USE_FORBIDDEN,
    counting: COUNTING_NEVER,
    annotations: [],
  });
}

// ---- LES-4: never upgrade in place ----

// Returns a NEW record object with the LES-4 annotation appended; the input
// object is never mutated (it is frozen by stageLesson, and this function
// clones before appending in any case). The staged record's header status
// remains UNVALIDATED-STAGED forever: no procedure step here edits a staged
// record's status to validated (AC-T7-1). A duplicate supersession of the
// same staged record by the same id is refused: annotations are append-only,
// and a second identical annotation would be a second supersession.
export function annotateSuperseded(stagedLesson, newLessonId, { date } = {}) {
  if (!isPlainObject(stagedLesson) || stagedLesson.status !== STAGED_STATUS) {
    throw new LessonRefusal('NOT_STAGED_LESSON',
      `supersession annotation refused: the record is not a staged lesson (status ${JSON.stringify(stagedLesson?.status)}); only a ${STAGED_STATUS} record is annotated "superseded-by" (LES-4)`);
  }
  if (!LESSON_ID_PATTERN.test(newLessonId ?? '')) {
    throw new LessonRefusal('INVALID_LESSON_ID', `supersession annotation refused: the superseding lesson id must have form LES-YYYY-NNN (§9.2); got ${JSON.stringify(newLessonId)}`);
  }
  if (newLessonId === stagedLesson.lesson_id) {
    throw new LessonRefusal('SELF_SUPERSESSION', 'supersession annotation refused: a lesson never supersedes itself, and a validated lesson never reuses a staged lesson\'s id (LES-4)');
  }
  const existing = Array.isArray(stagedLesson.annotations) ? stagedLesson.annotations : [];
  // The duplicate guard uses the same shared parser as supersedingIdOf
  // (fix round 1, F-T7-2): a textual annotation without
  // superseding_lesson_id still counts as an existing supersession.
  if (existing.some((a) => annotationSupersedingId(a) === newLessonId)) {
    throw new LessonRefusal('ALREADY_SUPERSEDED', `supersession annotation refused: ${stagedLesson.lesson_id} is already annotated as superseded by ${newLessonId}; annotations are append-only (LES-4)`);
  }
  // SILENT-SPEC DECISION S-4 (see T7 report): annotation entry shape.
  // The spec fixes only the note text "superseded-by: <id>" (LES-4). This
  // module stores { annotation, superseding_lesson_id, date? }; the date is
  // included only when the caller supplies one. The READER accepts both
  // this shape and T4's fixture shape { note: 'superseded-by: <id>' },
  // through the shared parser below (fix round 1, F-T7-2).
  const note = { annotation: `superseded-by: ${newLessonId}`, superseding_lesson_id: newLessonId };
  if (date !== undefined) {
    if (!isValidDate(date)) throw new LessonRefusal('BAD_DATE', `supersession annotation refused: date must be a valid date; got ${JSON.stringify(date)}`);
    note.date = date;
  }
  const next = structuredClone(stagedLesson);
  next.annotations = [...existing.map((a) => structuredClone(a)), note];
  return deepFreeze(next);
}

// Shared "superseded-by" note parser (S-4, fix round 1, F-T7-2). One
// parser reads the LES-4 note text from every annotation shape this module
// accepts: T7's own { annotation, superseding_lesson_id } shape and T4's
// fixture shape { note }. Both supersession DETECTION (supersedingIdOf,
// used by classification) and the DUPLICATE guard in annotateSuperseded
// use it, so a textual annotation without superseding_lesson_id is never
// missed in either place.
function parseSupersededByNote(text) {
  if (!isNonEmptyString(text)) return null;
  const m = /^superseded-by:\s*(LES-\d{4}-\d{3})\s*$/.exec(text.trim());
  return m ? m[1] : null;
}

function annotationSupersedingId(a) {
  if (!isPlainObject(a)) return null;
  if (isNonEmptyString(a.superseding_lesson_id)) return a.superseding_lesson_id;
  return parseSupersededByNote(a.annotation) ?? parseSupersededByNote(a.note);
}

// Finds the superseding id in a record's annotations, if any. Returns the id
// string or null. The annotation text is the LES-4 form "superseded-by: <id>",
// read from either the `annotation` or the `note` field (S-4).
export function supersedingIdOf(lesson) {
  if (!isPlainObject(lesson) || !Array.isArray(lesson.annotations)) return null;
  for (const a of lesson.annotations) {
    const id = annotationSupersedingId(a);
    if (id !== null) return id;
  }
  return null;
}

// ---- LES-3 / LES-5 / LES-8: validated-lesson creation (refusal mechanism) ----

// Validated-lesson creation in Stage 3. This function NEVER returns a
// validated lesson: LES-8 forbids creating one in Stage 3, and the D2 role
// is pending, so independent verification can never be satisfied (LES-3).
// It exists to enforce the refusal paths with named reasons:
//   1. source is a staged lesson -> STAGED_LESSON_SOURCE (LES-5)
//   2. lesson is not a VALIDATED-status lesson -> WRONG_STATUS (never
//      upgrade a staged record in place, LES-4 / AC-T7-1)
//   3. lesson structure fails T4's checkLessonStructure -> LESSON_STRUCTURE
//   4. source incident id mismatch -> SOURCE_MISMATCH
//   5. watch computation missing -> MISSING_WATCH_COMPUTATION
//   6. LES-3 reference incomplete (via T2's checkValidationEligibility,
//      imported, not copied) -> INCOMPLETE_VALIDATION_REFERENCE, naming the
//      failing elements; or the record itself incomplete -> INCOMPLETE_RECORD.
//      Two T7-level LES-3 requirements are checked here alongside the
//      delegated elements (fix round 1, F-T7-4): the source incident's
//      status must be VALIDATED (LES-3's first requirement; T2 does not
//      require it), and validation_reference.incident_id must name the same
//      incident as the source (T2 reads only the sufficiency judgment).
//   7. only independent verification missing -> INDEPENDENT_VERIFICATION_NOT_SATISFIED
//      (D2 role pending; LES-8)
//   8. (defensive) even a fully eligible reference -> NO_VALIDATED_LESSON_IN_STAGE_3
//      (LES-8: no validated lesson is created in Stage 3, whatever the reference)
export function createValidatedLesson({ lesson, source, watch } = {}) {
  if (!isPlainObject(source)) {
    throw new LessonRefusal('BAD_SOURCE', 'validated-lesson creation refused: source must be { kind, record } (LES-5: a validated lesson\'s source is always a validated incident, never a staged lesson)');
  }
  if (source.kind === 'staged-lesson' || (isPlainObject(source.record) && source.record.status === STAGED_STATUS)) {
    throw new LessonRefusal('STAGED_LESSON_SOURCE',
      'validated-lesson creation refused: a validated lesson\'s source is always a validated incident, never a staged lesson (LES-5)',
      { source_kind: source.kind });
  }
  if (source.kind !== 'incident' || !isPlainObject(source.record)) {
    throw new LessonRefusal('BAD_SOURCE', `validated-lesson creation refused: source kind must be "incident", got ${JSON.stringify(source.kind)} (LES-5)`);
  }
  if (!isPlainObject(lesson)) {
    throw new LessonRefusal('BAD_INPUT', 'validated-lesson creation refused: lesson must be an object (§9.2)');
  }
  if (lesson.status !== VALIDATED_STATUS) {
    throw new LessonRefusal('WRONG_STATUS',
      `validated-lesson creation refused: the lesson status is ${JSON.stringify(lesson.status)}, not "VALIDATED"; a staged record is never upgraded in place (LES-4, AC-T7-1)`,
      { status: lesson.status });
  }
  const structure = checkLessonStructure(lesson);
  if (!structure.valid) {
    throw new LessonRefusal('LESSON_STRUCTURE', `validated-lesson creation refused: lesson structure fails (§9.2): ${structure.problems.join('; ')}`, { problems: structure.problems });
  }
  if (lesson.source_incident_id !== source.record.incident_id) {
    throw new LessonRefusal('SOURCE_MISMATCH',
      `validated-lesson creation refused: lesson source_incident_id ${JSON.stringify(lesson.source_incident_id)} does not match the validated incident ${JSON.stringify(source.record.incident_id)} (LES-3, LES-5)`);
  }
  if (!isPlainObject(watch)) {
    throw new LessonRefusal('MISSING_WATCH_COMPUTATION',
      'validated-lesson creation refused: no named watch computation supplied; LES-3 requires the incident status VALIDATED with in-window exposure, which cannot be checked without it (WAT-4)');
  }
  const sj = isPlainObject(lesson.validation_reference) ? lesson.validation_reference.sufficiency_judgment : undefined;
  const check = checkValidationEligibility(source.record, watch, { sufficiency_judgment: sj });
  if (check.incomplete) {
    throw new LessonRefusal('INCOMPLETE_RECORD', `validated-lesson creation refused: the source incident record is incomplete: ${check.problems.join('; ')}`, { problems: check.problems });
  }
  // T7-level LES-3 requirements, checked here alongside the delegated T2
  // elements (fix round 1, F-T7-4). LES-3's first requirement is
  // validated_incident.status == "VALIDATED": T2's eligibility check does
  // not require it, so a WATCH record with otherwise complete evidence
  // would otherwise pass this step without that element being reported.
  // The second is reference identity: validation_reference.incident_id
  // must name the same incident as the source. T2 reads only
  // validation_reference.sufficiency_judgment, never the reference's
  // incident_id, and T4's structure check (already run above) requires
  // the id to be present but does not cross-check it against the source —
  // so a reference naming another incident would otherwise pass
  // unchallenged here.
  const extraElements = {};
  const extraFailing = [];
  if (source.record.status !== VALIDATED_STATUS) {
    extraFailing.push('validated_incident_status');
    extraElements.validated_incident_status = { satisfied: false,
      reason: `source incident status is ${JSON.stringify(source.record.status)}, not "VALIDATED" (LES-3: REQUIRE validated_incident.status == "VALIDATED"; LES-5)` };
  }
  const refIncidentId = lesson.validation_reference.incident_id;
  if (refIncidentId !== source.record.incident_id) {
    extraFailing.push('validation_reference_incident_identity');
    extraElements.validation_reference_incident_identity = { satisfied: false,
      reason: `validation_reference.incident_id ${JSON.stringify(refIncidentId)} does not match the source incident ${JSON.stringify(source.record.incident_id)} (LES-3: the reference must identify the same incident)` };
  }
  const allFailing = [...check.failing, ...extraFailing];
  const allElements = { ...check.elements, ...extraElements };
  if (!check.eligible || extraFailing.length > 0) {
    if (allFailing.length === 1 && allFailing[0] === 'c3_independent_verification') {
      throw new LessonRefusal('INDEPENDENT_VERIFICATION_NOT_SATISFIED',
        `validated-lesson creation refused: independent verification is ${D2_NOT_SATISFIED} (D2 role ${D2_ROLE_STATUS}); ` +
        'until the D2 role is approved this cannot be met and no validated lesson may be created (LES-3, LES-8)',
        { failing: allFailing, d2_role_status: D2_ROLE_STATUS });
    }
    throw new LessonRefusal('INCOMPLETE_VALIDATION_REFERENCE',
      `validated-lesson creation refused: the complete LES-3 validation reference is missing: ${allFailing.map((n) => `${n}: ${allElements[n].reason}`).join('; ')}`,
      { failing: allFailing });
  }
  // Defensive: even a fully eligible reference cannot produce a validated
  // lesson in Stage 3 (LES-8). Unreachable while D2 is pending (c3 always
  // fails above); kept so the LES-8 refusal does not depend on D2 alone.
  throw new LessonRefusal('NO_VALIDATED_LESSON_IN_STAGE_3',
    'validated-lesson creation refused: no validated lesson is created in Stage 3 (LES-8), whatever the reference');
}

// ---- §16 RET-2: grep retrieval query forms ----

export const RETRIEVAL_KINDS = Object.freeze(['by-applicability', 'by-source-incident', 'by-superseded-id', 'by-superseding-id', 'index-section']);

// Builds the grep query form for one retrieval. The module builds and
// classifies queries/results; it does NOT run grep and does NOT read the repo
// (see the header boundary). Section scoping (AC-T7-2 / RET-2): a lesson
// query must name its section ('1' validated, '4' staged, or explicitly
// 'both'); a missing or invalid section is refused, never silently mixed.
// 'both' is an explicit request, and its two section-scoped commands are
// returned separately so their results are never merged without judgment.
// index_file is required: the record/INDEX location is F-14 OPEN, so no
// default path is invented.
export function buildRetrievalQuery(input) {
  if (!isPlainObject(input)) {
    throw new LessonRefusal('BAD_INPUT', 'retrieval query refused: input must be an object (RET-2)');
  }
  if (!RETRIEVAL_KINDS.includes(input.kind)) {
    throw new LessonRefusal('BAD_KIND', `retrieval query refused: kind must be one of ${RETRIEVAL_KINDS.join(', ')}; got ${JSON.stringify(input.kind)}`);
  }
  if (!isNonEmptyString(input.index_file)) {
    throw new LessonRefusal('MISSING_INDEX_FILE',
      'retrieval query refused: index_file is required; the record/INDEX location is OPEN (F-14), so no default path is invented');
  }
  const base = {
    kind: input.kind,
    index_file: input.index_file,
    disposition: 'CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY',
    automatic_reuse: false,
    automatic_promotion: false,
    result_note: 'Grep results are candidate material for judgment, never automatic reuse or automatic lesson promotion (RET-2, AC-T7-3).',
  };

  if (input.kind === 'by-applicability') {
    if (!isNonEmptyString(input.keyword)) {
      throw new LessonRefusal('MISSING_KEYWORD', 'retrieval query refused: by-applicability needs a non-empty keyword');
    }
    if (input.section !== '1' && input.section !== '4' && input.section !== 'both') {
      throw new LessonRefusal('MISSING_SECTION_SCOPE',
        `retrieval query refused: by-applicability must name its section: "1" (validated), "4" (staged), or explicitly "both"; got ${JSON.stringify(input.section)} (a query must never silently mix Sections 1 and 4)`);
    }
    const grepArgs = `-n -i -F -- ${shellQuote(input.keyword)}`;
    if (input.section === 'both') {
      const commands = ['1', '4'].map((s) => sectionScopedCommand(input.index_file, s, grepArgs));
      return { ...base, section: 'both', mixed_sections: true, pattern: input.keyword, commands, command: commands.join(' ; '),
        section_note: 'Explicit "both": two separate section-scoped commands; Section 1 and Section 4 results are kept separate and must never be merged without judgment.' };
    }
    return { ...base, section: input.section, mixed_sections: false, pattern: input.keyword,
      command: sectionScopedCommand(input.index_file, input.section, grepArgs) };
  }

  if (input.kind === 'by-source-incident') {
    if (!isNonEmptyString(input.incident_id)) {
      throw new LessonRefusal('MISSING_INCIDENT_ID', 'retrieval query refused: by-source-incident needs a non-empty incident_id');
    }
    if (input.section !== '1' && input.section !== '4' && input.section !== 'both') {
      throw new LessonRefusal('MISSING_SECTION_SCOPE',
        `retrieval query refused: by-source-incident must name its section: "1" (validated), "4" (staged), or explicitly "both"; got ${JSON.stringify(input.section)} (a query must never silently mix Sections 1 and 4)`);
    }
    const grepArgs = `-n -F -- ${shellQuote(input.incident_id)}`;
    if (input.section === 'both') {
      const commands = ['1', '4'].map((s) => sectionScopedCommand(input.index_file, s, grepArgs));
      return { ...base, section: 'both', mixed_sections: true, pattern: input.incident_id, commands, command: commands.join(' ; '),
        section_note: 'Explicit "both": two separate section-scoped commands; Section 1 and Section 4 results are kept separate and must never be merged without judgment.' };
    }
    return { ...base, section: input.section, mixed_sections: false, pattern: input.incident_id,
      command: sectionScopedCommand(input.index_file, input.section, grepArgs) };
  }

  if (input.kind === 'by-superseded-id') {
    if (!isNonEmptyString(input.superseded_id)) {
      throw new LessonRefusal('MISSING_SUPERSEDED_ID', 'retrieval query refused: by-superseded-id needs a non-empty superseded_id');
    }
    // Section 6 is the supersessions-and-corrections log (IDX-2, §12).
    // Lookup is by the OLD record's identity: a Section 6 entry lists the
    // superseded id (with the superseding id, reason, date, evidence), so
    // the pattern is the superseded id itself (fix round 1, F-T7-3). The
    // earlier form searched for "superseded-by: <superseded id>", which is
    // the annotation text a record carries when it is superseded BY that
    // id — the reverse direction: it would miss this record's entry and
    // instead find records superseded by the queried id. Results are
    // candidate material for judgment: the operator confirms the entry's
    // superseded-id field, since the bare id also appears as a superseding
    // id in other entries.
    const pattern = input.superseded_id;
    return { ...base, section: '6', mixed_sections: false, pattern,
      command: sectionScopedCommand(input.index_file, '6', `-n -F -- ${shellQuote(pattern)}`),
      record_scope_note: 'The same id run over lesson record files finds the annotated record itself (its header carries its own lesson_id); the INDEX Section 6 command above finds the secondary reference (IDX-2).' };
  }

  if (input.kind === 'by-superseding-id') {
    if (!isNonEmptyString(input.superseding_id)) {
      throw new LessonRefusal('MISSING_SUPERSEDING_ID', 'retrieval query refused: by-superseding-id needs a non-empty superseding_id');
    }
    // Reverse lookup (fix round 1, F-T7-3; pattern corrected fix round 2,
    // F-T7-6): records superseded BY the given replacement id. Distinct
    // kind and input from by-superseded-id, so the two directions can
    // never be confused. The pattern matches the Section 6 log
    // representation itself: a Section 6 entry reads
    // "- <superseded-id> superseded by <superseding-id>, ...", so the
    // pattern is "superseded by <id>" (space, no hyphen, no colon). The
    // LES-4 annotation text "superseded-by: <id>" is what a lesson
    // record file carries, and it does NOT appear in a Section 6 entry:
    // the pre-fix pattern searched for it and missed every Section 6
    // entry. Unlike the forward bare-id pattern, this pattern is
    // directional: it matches only the superseding slot, never an entry
    // where the queried id is the superseded id.
    const pattern = `superseded by ${input.superseding_id}`;
    return { ...base, section: '6', mixed_sections: false, pattern,
      command: sectionScopedCommand(input.index_file, '6', `-n -F -- ${shellQuote(pattern)}`),
      record_scope_note: 'The INDEX Section 6 command above finds the secondary references (IDX-2). To find the annotated records themselves, the operator runs the LES-4 annotation text "superseded-by: <id>" over lesson record files — a different fixed string from this Section 6 pattern, which does not appear in record files.' };
  }

  // index-section: a whole-section lookup.
  if (input.section === undefined || input.section === null) {
    throw new LessonRefusal('MISSING_SECTION_SCOPE', 'retrieval query refused: index-section must name one section "1"-"6"; none was given');
  }
  if (!['1', '2', '3', '4', '5', '6'].includes(input.section)) {
    throw new LessonRefusal('BAD_SECTION', `retrieval query refused: index-section must name one section "1"-"6"; got ${JSON.stringify(input.section)}`);
  }
  return { ...base, section: input.section, mixed_sections: false, pattern: null,
    command: `sed -n ${shellQuote(sectionRange(input.section))} ${shellQuote(input.index_file)}` };
}

// ---- §16 RET-2: result classification ----

// Marks every retrieval result as candidate material for judgment ONLY.
// Never automatic reuse, never automatic lesson promotion (RET-2, AC-T7-3).
// A result whose record is annotated "superseded-by" is flagged superseded:
// true with the superseding id surfaced, and is never returned as current
// guidance without that flag. Asking for a superseded record as current
// guidance is refused outright.
export function classifyRetrievalResult(result, { as_current_guidance = false } = {}) {
  if (!isPlainObject(result) || !isNonEmptyString(result.id)) {
    throw new LessonRefusal('BAD_RESULT', 'retrieval classification refused: a result needs a non-empty id');
  }
  const supersedingId = supersedingIdOf(result.record) ?? (isNonEmptyString(result.superseded_by) ? result.superseded_by : null);
  const superseded = supersedingId !== null;
  if (superseded && as_current_guidance === true) {
    throw new LessonRefusal('SUPERSEDED_AS_CURRENT_GUIDANCE',
      `retrieval classification refused: ${result.id} is superseded by ${supersedingId} and must never be returned as current guidance without that flag (RET-2)`,
      { id: result.id, superseding_id: supersedingId });
  }
  return {
    id: result.id,
    section: result.section ?? null,
    disposition: 'CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY',
    automatic_reuse: false,
    automatic_promotion: false,
    superseded,
    superseding_id: supersedingId,
    current_guidance: !superseded,
    staged: result.section === '4' ? true : result.section === '1' ? false : null,
    citable_as_authority: result.section === '4' ? false : null,
    counts_toward_milestone_b: result.section === '4' ? false : null,
    note: superseded
      ? `Superseded by ${supersedingId}: use only with the supersession flag; never as current guidance unflagged.`
      : 'Candidate material for judgment only; a human judges whether it applies (RET-2).',
  };
}

export function classifyRetrievalResults(results, opts = {}) {
  if (!Array.isArray(results)) throw new LessonRefusal('BAD_RESULT', 'retrieval classification refused: results must be a list');
  return results.map((r) => classifyRetrievalResult(r, opts));
}

// ---- §2 point 6: Graphiti re-examination condition (C-8, DV-7) ----

// Evaluates the WP-04 trigger EXACTLY as written (GRAPHITI_TRIGGER_QUOTED),
// without interpreting the grouping or picking a single threshold (C-8).
// The count predicate is THREE-VALUED (fix round 1, F-T7-1): WP-04's
// "50–100+" names a range, not a single threshold, so a count only settles
// the predicate when it lies outside the whole range — below 50 it is below
// every threshold in the range (false); at or above 100 it meets every
// threshold in the range (true); from 50 to 99 the threshold could still be
// above the count, so the predicate is UNRESOLVED (null). The earlier form
// used recordCount >= 50 as a Boolean, which silently decided the threshold
// at 50: (60, true, false) reported the trigger met although a threshold of
// 100 was still unresolved. Both operator groupings are evaluated side by
// side with three-valued logic:
//   reading A: (count-predicate AND acted-on-superseded-fact) OR grep-unanswerable-query-class
//   reading B: count-predicate AND (acted-on-superseded-fact OR grep-unanswerable-query-class)
// A trigger verdict is reported only when both readings agree on a Boolean
// (both true: MET; both false: NOT met). When they disagree as Booleans
// the status is UNDECIDED_GROUPING_OPEN_C8; when either reading is
// unresolved because the count sits in the 50–99 band, the status is
// UNDECIDED_THRESHOLD_OPEN_C8. In both undecided cases trigger_met is
// null and grep stays the retrieval method. The one case in the band that
// still settles: with neither conjunct/disjunct true, both readings are
// false whatever the count predicate is, so NOT met is reported. The "NOT
// met" assessment is labeled as the prep's (RET-1), not WP-04's (DV-7,
// C-19).
export function graphitiTriggerStatus(recordCount, actedOnSupersededFact, grepUnanswerableQueryClass) {
  if (!Number.isInteger(recordCount) || recordCount < 0) {
    throw new LessonRefusal('BAD_INPUT', `Graphiti trigger refused: recordCount must be a non-negative integer; got ${JSON.stringify(recordCount)}`);
  }
  if (typeof actedOnSupersededFact !== 'boolean' || typeof grepUnanswerableQueryClass !== 'boolean') {
    throw new LessonRefusal('BAD_INPUT', 'Graphiti trigger refused: actedOnSupersededFact and grepUnanswerableQueryClass must be booleans (an agent acting on a superseded fact, or a grep-unanswerable query class, either happened or did not)');
  }
  // Three-valued count predicate against WP-04's own "50–100+" wording.
  // No single threshold is picked (C-8): only counts outside the whole
  // range settle the predicate.
  const countPredicate = recordCount < 50 ? false : recordCount >= 100 ? true : null;
  const countBand = recordCount < 50
    ? 'below the stated "50–100+" range'
    : recordCount >= 100
      ? 'at or above the top of the stated "50–100+" range: meets any threshold in the range'
      : 'inside the unresolved "50–100+" band: the threshold may still be above the count (C-8)';
  // Kleene three-valued logic (null = unresolved).
  const and3 = (a, b) => (a === false || b === false ? false : (a === null || b === null ? null : true));
  const or3 = (a, b) => (a === true || b === true ? true : (a === null || b === null ? null : false));
  const readingA = or3(and3(countPredicate, actedOnSupersededFact), grepUnanswerableQueryClass);
  const readingB = and3(countPredicate, or3(actedOnSupersededFact, grepUnanswerableQueryClass));
  const thresholdOpen = readingA === null || readingB === null;
  const agreed = readingA === readingB && readingA !== null;
  return {
    wp04_trigger_quoted: GRAPHITI_TRIGGER_QUOTED,
    record_count: recordCount,
    record_count_band: countBand,
    count_in_stated_range: countPredicate,
    range_handling: 'WP-04\'s "50–100+" names a range, not a single threshold (C-8). A count below 50 is below every threshold in the range; a count at or above 100 meets every threshold in the range; a count from 50 to 99 leaves the count predicate unresolved, so no trigger verdict that depends on it is reported; no single threshold chosen.',
    acted_on_superseded_fact: actedOnSupersededFact,
    grep_unanswerable_query_class: grepUnanswerableQueryClass,
    reading_a__count_and_acted_or_unanswerable: readingA,
    reading_b__count_and_acted_or_unanswerable: readingB,
    trigger_met: agreed ? readingA : null,
    status: agreed
      ? (readingA ? 'MET_UNDER_BOTH_RECORDED_READINGS' : 'NOT_MET_UNDER_BOTH_RECORDED_READINGS')
      : thresholdOpen ? 'UNDECIDED_THRESHOLD_OPEN_C8' : 'UNDECIDED_GROUPING_OPEN_C8',
    retrieval_method: agreed && readingA ? 'RE-EXAMINE (trigger met under both recorded readings; Graphiti re-examination is the next step, not a decision made here)' : 'grep',
    not_met_statement_provenance: GRAPHITI_NOT_MET_PROVENANCE,
  };
}
