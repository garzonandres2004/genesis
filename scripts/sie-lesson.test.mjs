// Tests for SIE lesson staging + grep retrieval (Stage 3 T7, AC-T7-1..AC-T7-3).
// Every input is SYNTHETIC: lesson records and INDEX sets built inline, and
// incident records built with the T2 module from SYNTHETIC inputs. Records
// shaped like operational records carry "T7TEST" ids and "t7-test-only/"
// paths; they are SYNTHETIC test inputs, not operational records, and their
// provenance says so.
//
// LIMIT (EVL-7, AC-T4-3): passing on fixtures proves the test works, not that
// any real incident is handled correctly. A pass here is "test mechanics
// verified on fixtures", never "system verified". No operational INDEX or
// record location is read or written (F-14 OPEN; LOC-1 is a working
// assumption). No validated lesson is created by any test (LES-8); the
// validated-lesson literals are hand-built SYNTHETIC inputs that exercise
// the refusal paths only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createIncident, transition, recordValidationEvidence, watchWindow, watchEnd,
  SIE02_UNQUALIFIED,
} from './sie-incident.mjs';
import { checkLessonStructure, checkIndex } from './sie-schema.mjs';
import {
  TEST_LIMIT, EVIDENCE_LEVEL, GRAPHITI_TRIGGER_QUOTED, GRAPHITI_NOT_MET_PROVENANCE,
  STAGED_STATUS, CITATION_USE_FORBIDDEN, COUNTING_NEVER, PERMITTED_USES, LessonRefusal,
  countSentences, stageLesson, annotateSuperseded, supersedingIdOf,
  createValidatedLesson, buildRetrievalQuery, classifyRetrievalResult,
  classifyRetrievalResults, graphitiTriggerStatus,
} from './sie-lesson.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'sie-lesson.mjs'), 'utf8');

const DAY = 24 * 60 * 60 * 1000;
const at = (base, days) => new Date(Date.parse(base) + days * DAY).toISOString();
const RC = '2026-01-10T00:00:00.000Z';
const FP = '2026-01-12T00:00:00.000Z';
const PROV = { all: 'SYNTHETIC test input (T7 mechanics only)', derivation_note: 'SYNTHETIC: staged from unvalidated material; guidance, not proven fact' };
const JUDGMENT = { text: 'SYNTHETIC judgment text', by: 'SYNTHETIC-judge', date: at(FP, 31) };

// ---- SYNTHETIC incident records, built with the T2 module (T4 pattern) ----

const openInc = (n) => createIncident({
  incident_id: `INC-T7TEST-00${n}`,
  title: 'SYNTHETIC: task recorded blocked',
  observed_facts: [{ fact: 'SYNTHETIC fact', source_pointer: 'test-only://task/a' }],
  hypotheses: [{ id: 'H-1', text: 'SYNTHETIC hypothesis', author: 'SYNTHETIC-author', date: RC }],
  detector_rule: 'R1',
  candidate_record_id: 'CAND-R1-0000000000000000',
  record_creation_time: RC,
  provenance: PROV,
}, { opened_by: 'SYNTHETIC-orchestrator', reason: 'SYNTHETIC: T7 test input' });
const fixedInc = (n) => transition(openInc(n), 'FIXED', {
  reason: 'SYNTHETIC fix', evidence: 'test-only://pr/1', date: at(RC, 1), fix_reference: 'test-only://pr/1', fix_description: 'SYNTHETIC change',
});
const fixVerifiedEvidence = {
  reproduction_evidence: { kind: 'reproduced-failure', pointer: 'test-only://repro/1' },
  regression_test: { id: 't', before: { result: 'fail', pointer: 'test-only://run/0' }, after: { result: 'pass', pointer: 'test-only://run/1' } },
};
const watchInc = (n) => transition(recordValidationEvidence(fixedInc(n), fixVerifiedEvidence,
  { reason: 'SYNTHETIC evidence', evidence: 'test-only://ev', date: at(FP, 2) }), 'WATCH', {
  reason: 'SYNTHETIC fix present', evidence: 'test-only://presence/1', date: FP,
  fix_presence_evidence: { pointer: 'test-only://presence/1', time: FP },
  watch_window: watchWindow(null, null, FP, RC, 'W-C', SIE02_UNQUALIFIED),
});
// Watch end after the 30-day window (window starts 2026-01-12, ends 2026-02-11).
const endedWatch = (record) => watchEnd(record.watch_window, [], SIE02_UNQUALIFIED, '2026-02-12T00:00:00.000Z');
// A WATCH record with every LES-3 element except independent verification:
// in-window operational exposure + sufficiency judgment recorded on a clone.
// NOT produced by the validation path (which refuses while D2 is pending).
function nearlyValidatedInc(n) {
  const w = structuredClone(watchInc(n));
  w.exposure_evidence_link = [{ pointer: 'test-only://operational-shaped/3', timestamp: at(FP, 3), is_operational: true, kind: 'run-event' }];
  w.sufficiency_judgment = JUDGMENT;
  return w;
}

// A VALIDATED-status incident record, hand-built as a SYNTHETIC literal:
// nearlyValidatedInc with its status overridden and a matching history
// entry appended (T2's validateRecord requires the last history entry's
// `to` to equal the status, VAL-3 / INC-5). NOT produced by the validation
// path (VAL-6: no incident reaches VALIDATED in Stage 3); it exercises the
// D2-only refusal path only (F-T7-4). The T2 module accepts VALIDATED as a
// known state; the record is otherwise the complete nearly-validated WATCH
// record above.
function validatedStatusInc(n) {
  const w = nearlyValidatedInc(n);
  return {
    ...w,
    status: 'VALIDATED',
    history: [...w.history, {
      seq: w.history.length,
      type: 'SYNTHETIC',
      from: 'WATCH',
      to: 'VALIDATED',
      reason: 'SYNTHETIC: hand-built fixture status for the D2-only refusal path; NOT produced by the validation path (VAL-6)',
      evidence_pointer: 'test-only://synthetic/validated-status',
      by: 'SYNTHETIC-test',
      date: at(FP, 32),
    }],
  };
}

// ---- SYNTHETIC lessons ----

const stagedInput = (over = {}) => ({
  lesson_id: 'LES-2026-001', status: 'UNVALIDATED-STAGED', source_incident_id: 'INC-T7TEST-003',
  lesson_statement: 'SYNTHETIC staged guidance. It applies in this narrow case.',
  applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
  review_date: '2026-06-01', provenance: PROV,
  ...over,
});
const validatedLessonInput = (over = {}) => ({
  lesson_id: 'LES-2026-002', status: 'VALIDATED', source_incident_id: 'INC-T7TEST-003',
  lesson_statement: 'SYNTHETIC validated guidance (hand-built literal; LES-8: no validated lesson is created in Stage 3).',
  applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
  review_date: '2026-06-01', provenance: PROV,
  supersedes_staged_id: 'LES-2026-001',
  evidence_links: [{ pointer: 'test-only://operational-shaped/3' }],
  validation_reference: { incident_id: 'INC-T7TEST-003', sufficiency_judgment: JUDGMENT },
  compounding_use: 'none',
  ...over,
});

const refusesWith = (fn, code, fragment) => {
  assert.throws(fn, (e) => {
    assert.equal(e.name, 'LessonRefusal', `expected a LessonRefusal, got ${e}`);
    assert.equal(e.code, code, `expected code ${code}, got ${e.code}: ${e.message}`);
    if (fragment) assert.match(e.message, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `refusal message should name ${fragment}`);
    return true;
  });
};

// ---- staging: success ----

test('staging success: valid unvalidated material stages with all LES-2 fields fixed', () => {
  const staged = stageLesson(stagedInput());
  assert.equal(staged.status, 'UNVALIDATED-STAGED');
  assert.equal(staged.validation_claim, 'NONE');
  assert.equal(staged.index_section, 'unvalidated-staged');
  assert.equal(staged.citation_use, 'FORBIDDEN_AS_AUTHORITY');
  assert.equal(staged.counting, 'never');
  assert.deepEqual(staged.annotations, []);
  assert.equal(staged.lesson_id, 'LES-2026-001');
  assert.equal(staged.source_incident_id, 'INC-T7TEST-003');
  assert.ok(Object.isFrozen(staged), 'staged record is deep-frozen');
  assert.ok(Object.isFrozen(staged.provenance));
  // The permitted uses are a module-level constant, not a record field
  // (§9.2 fixes the record fields; T4 refuses unknown fields).
  assert.deepEqual(PERMITTED_USES,
    ['format-testing', 'index-testing', 'retrieval-procedure-testing-on-fixtures-only']);
  const structure = checkLessonStructure(staged);
  assert.equal(structure.valid, true, `T4 structure check passes: ${structure.problems.join('; ')}`);
});

test('staging success: omitted staged-only fields are set by the procedure, not defaulted silently from the caller', () => {
  const { validation_claim, index_section, citation_use, counting, ...rest } = stagedInput();
  const staged = stageLesson(rest);
  assert.equal(staged.validation_claim, 'NONE');
  assert.equal(staged.index_section, 'unvalidated-staged');
  assert.equal(staged.citation_use, CITATION_USE_FORBIDDEN);
  assert.equal(staged.counting, COUNTING_NEVER);
});

test('staging success: one-sentence and three-sentence statements stage; counting helper agrees', () => {
  assert.equal(countSentences('One sentence.'), 1);
  assert.equal(countSentences('First sentence. Second sentence! Third sentence?'), 3);
  assert.equal(stageLesson(stagedInput({ lesson_statement: 'One sentence.' })).lesson_statement, 'One sentence.');
  assert.equal(stageLesson(stagedInput({ lesson_statement: 'First sentence. Second sentence! Third sentence?' })).lesson_statement,
    'First sentence. Second sentence! Third sentence?');
});

// ---- staging: refusals, one per LES-2 failure ----

test('staging refusal: wrong status (VALIDATED) is refused, never staged', () => {
  refusesWith(() => stageLesson(stagedInput({ status: 'VALIDATED' })), 'STAGING_REFUSED', 'UNVALIDATED-STAGED');
});

test('staging refusal: CANDIDATE status is refused (reserved and unused, VOC-6, F-10)', () => {
  refusesWith(() => stageLesson(stagedInput({ status: 'CANDIDATE' })), 'STAGING_REFUSED', 'UNVALIDATED-STAGED');
});

test('staging refusal: validation_claim != NONE is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ validation_claim: 'VALIDATED' })), 'STAGING_REFUSED', 'validation_claim');
});

test('staging refusal: wrong index_section is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ index_section: 'validated' })), 'STAGING_REFUSED', 'index_section');
});

test('staging refusal: citation_use other than forbidden is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ citation_use: 'AUTHORITY' })), 'STAGING_REFUSED', 'citation_use');
});

test('staging refusal: counting other than never is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ counting: 'toward-milestone-b' })), 'STAGING_REFUSED', 'counting');
});

test('staging refusal: empty non_applicability is a schema failure for a staged lesson', () => {
  refusesWith(() => stageLesson(stagedInput({ non_applicability: '' })), 'STAGING_REFUSED', 'non_applicability');
  refusesWith(() => stageLesson(stagedInput({ non_applicability: '   ' })), 'STAGING_REFUSED', 'non_applicability');
});

test('staging refusal: missing required field is refused and named', () => {
  const { source_incident_id, ...rest } = stagedInput();
  refusesWith(() => stageLesson(rest), 'STAGING_REFUSED', 'source_incident_id');
});

test('staging refusal: lesson_statement outside 1-3 sentences is refused', () => {
  refusesWith(() => stageLesson(stagedInput({
    lesson_statement: 'First sentence. Second sentence. Third sentence. Fourth sentence.',
  })), 'STAGING_REFUSED', '1–3 sentences');
});

test('staging refusal: lesson_id outside LES-YYYY-NNN is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ lesson_id: 'LES-1' })), 'STAGING_REFUSED', 'LES-YYYY-NNN');
});

test('staging refusal: provenance without the staged-vs-validated derivation note is refused', () => {
  refusesWith(() => stageLesson(stagedInput({ provenance: { all: 'SYNTHETIC' } })), 'STAGING_REFUSED', 'derivation_note');
});

test('staging refusal: unknown field is refused, never silently kept', () => {
  refusesWith(() => stageLesson(stagedInput({ evidence_links: [] })), 'STAGING_REFUSED', 'unknown field');
});

test('staging refusal: non-empty caller-supplied annotations are refused at staging (S-11)', () => {
  refusesWith(() => stageLesson(stagedInput({ annotations: [{ annotation: 'superseded-by: LES-2026-002', superseding_lesson_id: 'LES-2026-002' }] })), 'STAGING_REFUSED', 'annotations');
  refusesWith(() => stageLesson(stagedInput({ annotations: [{ note: 'superseded-by: LES-2026-002' }] })), 'STAGING_REFUSED', 'annotations');
});

// ---- AC-T7-2: INDEX placement ----

test('AC-T7-2: a staged record\'s INDEX entry lives only in the unvalidated-staged section (Section 4)', () => {
  const staged = stageLesson(stagedInput());
  const file = 't7-test-only/lessons/LES-2026-001.md';
  const desc = { kind: 'lesson', file, record: staged };
  const inSection4 = checkIndex({ records: [desc], index: { sections: { 4: [{ id: 'LES-2026-001', file }] } } });
  assert.equal(inSection4.consistent, true, `Section 4 placement is consistent: ${JSON.stringify(inSection4.problems)}`);
  const inSection1 = checkIndex({ records: [desc], index: { sections: { 1: [{ id: 'LES-2026-001', file }] } } });
  assert.equal(inSection1.consistent, false);
  assert.ok(inSection1.problems.some((p) => p.code === 'STAGED_IN_SECTION_1'), 'Section 1 placement fails STAGED_IN_SECTION_1');
  const inBoth = checkIndex({ records: [desc], index: { sections: { 1: [{ id: 'LES-2026-001', file }], 4: [{ id: 'LES-2026-001', file }] } } });
  assert.equal(inBoth.consistent, false);
  assert.ok(inBoth.problems.some((p) => p.code === 'MULTIPLE_PRIMARY_ENTRIES'), 'two primary entries fail MULTIPLE_PRIMARY_ENTRIES');
  assert.equal(staged.index_section, 'unvalidated-staged');
});

// ---- LES-4: never upgrade in place ----

test('AC-T7-1: annotateSuperseded appends the note, leaves the original unchanged, and the header status stays UNVALIDATED-STAGED', () => {
  const staged = stageLesson(stagedInput());
  const before = structuredClone(staged);
  const annotated = annotateSuperseded(staged, 'LES-2026-002', { date: '2026-06-02' });
  assert.deepEqual(staged, before, 'original staged record is unchanged');
  assert.equal(staged.status, 'UNVALIDATED-STAGED');
  assert.equal(annotated.status, 'UNVALIDATED-STAGED', 'the annotated record still carries UNVALIDATED-STAGED, never VALIDATED');
  assert.equal(annotated.annotations.length, 1);
  assert.equal(annotated.annotations[0].annotation, 'superseded-by: LES-2026-002');
  assert.equal(annotated.annotations[0].superseding_lesson_id, 'LES-2026-002');
  assert.equal(supersedingIdOf(annotated), 'LES-2026-002');
  assert.equal(supersedingIdOf(staged), null);
  assert.ok(Object.isFrozen(annotated));
  assert.notEqual(annotated, staged);
});

test('annotateSuperseded refuses a non-staged record, a self-supersession, and a duplicate annotation', () => {
  const staged = stageLesson(stagedInput());
  refusesWith(() => annotateSuperseded(validatedLessonInput(), 'LES-2026-003'), 'NOT_STAGED_LESSON', 'not a staged lesson');
  refusesWith(() => annotateSuperseded(staged, 'LES-2026-001'), 'SELF_SUPERSESSION', 'never supersedes itself');
  refusesWith(() => annotateSuperseded(staged, 'LES-99'), 'INVALID_LESSON_ID', 'LES-YYYY-NNN');
  const once = annotateSuperseded(staged, 'LES-2026-002');
  refusesWith(() => annotateSuperseded(once, 'LES-2026-002'), 'ALREADY_SUPERSEDED', 'already annotated');
});

test('supersedingIdOf reads the T4 note shape as well as the T7 annotation shape (F-T7-2)', () => {
  // T4's fixture shape: { note: 'superseded-by: <id>' }.
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001', annotations: [{ note: 'superseded-by: LES-2026-002' }] }), 'LES-2026-002');
  // T7's own textual shape without superseding_lesson_id.
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001', annotations: [{ annotation: 'superseded-by: LES-2026-002' }] }), 'LES-2026-002');
  // T7's stored shape with the id field.
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001', annotations: [{ annotation: 'superseded-by: LES-2026-002', superseding_lesson_id: 'LES-2026-002' }] }), 'LES-2026-002');
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001', annotations: [] }), null);
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001', annotations: [{ note: 'unrelated note' }] }), null);
  assert.equal(supersedingIdOf({ lesson_id: 'LES-2026-001' }), null);
});

test('annotateSuperseded refuses a duplicate when the existing annotation is a textual note without superseding_lesson_id (F-T7-2)', () => {
  const staged = stageLesson(stagedInput());
  const withNote = { ...structuredClone(staged), annotations: [{ note: 'superseded-by: LES-2026-002' }] };
  refusesWith(() => annotateSuperseded(withNote, 'LES-2026-002'), 'ALREADY_SUPERSEDED', 'already annotated');
  const withText = { ...structuredClone(staged), annotations: [{ annotation: 'superseded-by: LES-2026-002' }] };
  refusesWith(() => annotateSuperseded(withText, 'LES-2026-002'), 'ALREADY_SUPERSEDED', 'already annotated');
  // A different superseding id is still a new annotation, not a duplicate.
  assert.equal(annotateSuperseded(withNote, 'LES-2026-003').annotations.length, 2);
});

test('AC-T7-1: creating a validated lesson from a staged lesson is refused (LES-5)', () => {
  const staged = stageLesson(stagedInput());
  const watch = endedWatch(watchInc(3));
  refusesWith(() => createValidatedLesson({
    lesson: validatedLessonInput(), source: { kind: 'staged-lesson', record: staged }, watch,
  }), 'STAGED_LESSON_SOURCE', 'never a staged lesson');
});

test('AC-T7-1: creating a validated lesson with a staged-status lesson is refused, never upgraded in place (LES-4)', () => {
  const staged = stageLesson(stagedInput());
  const watch = endedWatch(watchInc(3));
  refusesWith(() => createValidatedLesson({
    lesson: { ...staged, source_incident_id: 'INC-T7TEST-003' },
    source: { kind: 'incident', record: watchInc(3) }, watch,
  }), 'WRONG_STATUS', 'never upgraded in place');
});

test('validated-lesson creation without the complete LES-3 reference is refused, naming the missing elements', () => {
  const record = watchInc(3); // WATCH, no exposure, no sufficiency judgment
  const watch = endedWatch(record);
  const lesson = validatedLessonInput({ validation_reference: { incident_id: 'INC-T7TEST-003' } });
  refusesWith(() => createValidatedLesson({ lesson, source: { kind: 'incident', record }, watch }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'c6_exposure_evidence_link');
  try {
    createValidatedLesson({ lesson, source: { kind: 'incident', record }, watch });
    assert.fail('expected refusal');
  } catch (e) {
    assert.ok(e.details.failing.includes('c5_sufficiency_judgment'), 'missing sufficiency judgment is named');
    assert.ok(e.details.failing.includes('c3_independent_verification'), 'missing independent verification is named');
  }
});

test('validated-lesson creation with every LES-3 element except independent verification is refused on D2 (LES-3, LES-8)', () => {
  // The source is a VALIDATED-status SYNTHETIC literal (F-T7-4): the
  // pre-fix test supplied a WATCH incident here, so the D2-only refusal
  // was reported without the required validated incident status ever being
  // checked. A WATCH source is covered by the next test instead.
  const record = validatedStatusInc(3);
  const watch = endedWatch(record);
  const lesson = validatedLessonInput();
  refusesWith(() => createValidatedLesson({ lesson, source: { kind: 'incident', record }, watch }),
    'INDEPENDENT_VERIFICATION_NOT_SATISFIED', 'D2 role pending');
});

test('validated-lesson creation with a WATCH source is refused naming the missing validated-status element (F-T7-4)', () => {
  // Otherwise-complete reference (exposure + sufficiency judgment on the
  // record), but the source incident is WATCH, not VALIDATED: LES-3's
  // first requirement (validated_incident.status == "VALIDATED") is
  // missing, so the refusal names it and is NOT the D2-only refusal.
  const record = nearlyValidatedInc(3);
  const watch = endedWatch(record);
  const lesson = validatedLessonInput();
  refusesWith(() => createValidatedLesson({ lesson, source: { kind: 'incident', record }, watch }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'validated_incident_status');
  try {
    createValidatedLesson({ lesson, source: { kind: 'incident', record }, watch });
    assert.fail('expected refusal');
  } catch (e) {
    assert.ok(e.details.failing.includes('validated_incident_status'), 'missing validated incident status is named');
    assert.ok(!e.details.failing.includes('c3_independent_verification') || e.details.failing.length > 1,
      'the refusal is not the D2-only refusal');
  }
});

test('validated-lesson creation refuses a validation reference naming a different incident (F-T7-4)', () => {
  const record = validatedStatusInc(3);
  const watch = endedWatch(record);
  const wrongIncident = validatedLessonInput({
    validation_reference: { incident_id: 'INC-T7TEST-999', sufficiency_judgment: JUDGMENT },
  });
  refusesWith(() => createValidatedLesson({ lesson: wrongIncident, source: { kind: 'incident', record }, watch }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'validation_reference_incident_identity');
  try {
    createValidatedLesson({ lesson: wrongIncident, source: { kind: 'incident', record }, watch });
    assert.fail('expected refusal');
  } catch (e) {
    assert.ok(e.details.failing.includes('validation_reference_incident_identity'), 'mismatched reference identity is named');
  }
  // A reference naming no incident at all is refused earlier, by T4's
  // structure check (LESSON_STRUCTURE); the T7 cross-check above covers
  // the mismatch, which T4 does not check.
  const noIncident = validatedLessonInput({
    validation_reference: { sufficiency_judgment: JUDGMENT },
  });
  refusesWith(() => createValidatedLesson({ lesson: noIncident, source: { kind: 'incident', record }, watch }),
    'LESSON_STRUCTURE', 'naming the validated incident');
});

test('validated-lesson creation refuses a source incident id mismatch and a missing watch computation', () => {
  const record = nearlyValidatedInc(3);
  const watch = endedWatch(record);
  refusesWith(() => createValidatedLesson({
    lesson: validatedLessonInput({ source_incident_id: 'INC-T7TEST-999' }),
    source: { kind: 'incident', record }, watch,
  }), 'SOURCE_MISMATCH', 'does not match');
  refusesWith(() => createValidatedLesson({
    lesson: validatedLessonInput(), source: { kind: 'incident', record },
  }), 'MISSING_WATCH_COMPUTATION', 'watch computation');
});

// ---- retrieval: query forms ----

const IDX = 't7-test-only/INDEX.md';

test('retrieval query: by-applicability forms are section-scoped and never silently mix Sections 1 and 4', () => {
  const q1 = buildRetrievalQuery({ kind: 'by-applicability', keyword: 'runner choice', section: '1', index_file: IDX });
  const q4 = buildRetrievalQuery({ kind: 'by-applicability', keyword: 'runner choice', section: '4', index_file: IDX });
  assert.match(q1.command, /Section 1:/);
  assert.match(q4.command, /Section 4:/);
  assert.notEqual(q1.command, q4.command);
  assert.equal(q1.mixed_sections, false);
  assert.equal(q1.disposition, 'CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY');
  assert.equal(q1.automatic_reuse, false);
  assert.equal(q1.automatic_promotion, false);
  const both = buildRetrievalQuery({ kind: 'by-applicability', keyword: 'runner choice', section: 'both', index_file: IDX });
  assert.equal(both.mixed_sections, true);
  assert.equal(both.commands.length, 2);
  assert.match(both.commands[0], /Section 1:/);
  assert.match(both.commands[1], /Section 4:/);
  refusesWith(() => buildRetrievalQuery({ kind: 'by-applicability', keyword: 'x', index_file: IDX }),
    'MISSING_SECTION_SCOPE', 'never silently mix');
});

test('retrieval query: by-source-incident form searches the named section for the incident id', () => {
  const q = buildRetrievalQuery({ kind: 'by-source-incident', incident_id: 'INC-T7TEST-003', section: '4', index_file: IDX });
  assert.match(q.command, /Section 4:/);
  assert.match(q.command, /INC-T7TEST-003/);
  assert.equal(q.pattern, 'INC-T7TEST-003');
  refusesWith(() => buildRetrievalQuery({ kind: 'by-source-incident', section: '1', index_file: IDX }),
    'MISSING_INCIDENT_ID', 'incident_id');
});

test('retrieval query: by-superseded-id finds the old record in a synthetic Section 6 supersession log (F-T7-3)', () => {
  // Synthetic Section 6 supersession log (inline, SYNTHETIC): LES-2026-001
  // superseded by LES-2026-002, and a second entry where LES-2026-001 is
  // the SUPERSEDING id instead, so the direction of the lookup is
  // observable.
  const section6Log = [
    '## Section 6: Supersessions and corrections',
    '- LES-2026-001 superseded by LES-2026-002, reason: corrected guidance, date: 2026-06-02, evidence: test-only://ev/1',
    '- LES-2026-003 superseded by LES-2026-001, reason: corrected guidance, date: 2026-06-03, evidence: test-only://ev/2',
  ].join('\n');
  const q = buildRetrievalQuery({ kind: 'by-superseded-id', superseded_id: 'LES-2026-001', index_file: IDX });
  assert.equal(q.section, '6');
  // Lookup is by the OLD record's identity, not the annotation text.
  assert.equal(q.pattern, 'LES-2026-001');
  assert.notEqual(q.pattern, 'superseded-by: LES-2026-001');
  assert.match(q.command, /Section 6:/);
  assert.match(q.command, /LES-2026-001/);
  assert.doesNotMatch(q.command, /superseded-by: LES-2026-001/);
  // Retrieval against the synthetic log: the fixed-string pattern matches
  // the entry whose SUPERSEDED id is LES-2026-001.
  const hits = section6Log.split('\n').filter((line) => line.includes(q.pattern));
  const supersededEntry = hits.find((line) => line.startsWith('- LES-2026-001 superseded by'));
  assert.ok(supersededEntry, 'the entry superseding LES-2026-001 is found');
  assert.match(supersededEntry, /superseded by LES-2026-002/);
  // The bare id also appears as a superseding id in another entry; the
  // operator confirms the entry's superseded-id field (candidate material
  // for judgment, RET-2).
  assert.equal(hits.length, 2);
  // The pre-fix pattern would have found nothing at all in the log: the
  // log contains no "superseded-by: LES-2026-001" text, so the old
  // direction missed the supersession entirely.
  assert.equal(section6Log.split('\n').filter((line) => line.includes('superseded-by: LES-2026-001')).length, 0);
  refusesWith(() => buildRetrievalQuery({ kind: 'by-superseded-id', index_file: IDX }),
    'MISSING_SUPERSEDED_ID', 'superseded_id');
});

test('retrieval query: by-superseding-id is the distinct reverse lookup (F-T7-3)', () => {
  const q = buildRetrievalQuery({ kind: 'by-superseding-id', superseding_id: 'LES-2026-002', index_file: IDX });
  assert.equal(q.section, '6');
  assert.equal(q.pattern, 'superseded-by: LES-2026-002');
  assert.match(q.command, /Section 6:/);
  assert.match(q.command, /superseded-by: LES-2026-002/);
  // Retrieval against synthetic annotated-record content: the pattern
  // finds the record superseded BY LES-2026-002 and no other.
  const recordLines = [
    'lesson_id: LES-2026-001',
    'superseded-by: LES-2026-002',
    'lesson_id: LES-2026-003',
    'superseded-by: LES-2026-001',
  ];
  assert.deepEqual(recordLines.filter((line) => line.includes(q.pattern)), ['superseded-by: LES-2026-002']);
  refusesWith(() => buildRetrievalQuery({ kind: 'by-superseding-id', index_file: IDX }),
    'MISSING_SUPERSEDING_ID', 'superseding_id');
});

test('retrieval query: index-section form dumps exactly the requested section, excluding the next section heading (F-T7-5)', () => {
  // Synthetic INDEX content (inline, SYNTHETIC): a staged entry in
  // Section 4, with Section 5 following it.
  const syntheticIndex = [
    '# Test INDEX (SYNTHETIC)',
    '## Section 1: Validated lessons',
    '- LES-2026-002 validated entry',
    '## Section 4: UNVALIDATED-STAGED lessons',
    '- LES-2026-001 staged entry',
    '## Section 5: Historical seed observations',
    '- SEED-1 historical entry',
    '',
  ].join('\n');
  const q = buildRetrievalQuery({ kind: 'index-section', section: '4', index_file: IDX });
  assert.doesNotMatch(q.command, /grep/);
  // Run the range the query actually builds against the synthetic INDEX.
  const range = q.command.match(/^sed -n '([^']*)'/)[1];
  const out = execFileSync('sed', ['-n', range], { input: syntheticIndex, encoding: 'utf8' });
  assert.match(out, /## Section 4:/);
  assert.match(out, /LES-2026-001 staged entry/);
  assert.doesNotMatch(out, /## Section 5:/);
  assert.doesNotMatch(out, /SEED-1/);
  assert.doesNotMatch(out, /LES-2026-002/);
  // The same terminating-heading-excluding range scopes the Section 4
  // keyword query, so the next section's heading can no longer match it.
  const kq = buildRetrievalQuery({ kind: 'by-applicability', keyword: 'runner choice', section: '4', index_file: IDX });
  assert.ok(kq.command.includes(`sed -n '${range}'`), 'keyword query uses the same range');
  refusesWith(() => buildRetrievalQuery({ kind: 'index-section', section: '7', index_file: IDX }),
    'BAD_SECTION', 'must name one section');
});

test('retrieval query: index_file is required; no default record location is invented (F-14)', () => {
  refusesWith(() => buildRetrievalQuery({ kind: 'by-applicability', keyword: 'x', section: '1' }),
    'MISSING_INDEX_FILE', 'index_file is required');
  refusesWith(() => buildRetrievalQuery({ kind: 'nope', index_file: IDX }), 'BAD_KIND', 'kind must be one of');
});

// ---- retrieval: classification (AC-T7-3) ----

test('AC-T7-3: every retrieval result is candidate material for judgment only, never automatic reuse or promotion', () => {
  const staged = stageLesson(stagedInput());
  const results = classifyRetrievalResults([
    { id: 'LES-2026-001', section: '4', record: staged },
    { id: 'LES-2026-002', section: '1' },
    { id: 'INC-T7TEST-003', section: '3' },
  ]);
  assert.equal(results.length, 3);
  for (const r of results) {
    assert.equal(r.disposition, 'CANDIDATE_MATERIAL_FOR_JUDGMENT_ONLY');
    assert.equal(r.automatic_reuse, false);
    assert.equal(r.automatic_promotion, false);
  }
  assert.equal(results[0].staged, true);
  assert.equal(results[0].citable_as_authority, false);
  assert.equal(results[0].counts_toward_milestone_b, false);
  assert.equal(results[0].current_guidance, true);
  assert.equal(results[1].staged, false);
});

test('AC-T7-3: a T4-shaped supersession note flags the result superseded, never current guidance (F-T7-2)', () => {
  const r = classifyRetrievalResult({ id: 'LES-2026-001', section: '4', record: { annotations: [{ note: 'superseded-by: LES-2026-002' }] } });
  assert.equal(r.superseded, true);
  assert.equal(r.superseding_id, 'LES-2026-002');
  assert.equal(r.current_guidance, false);
  refusesWith(() => classifyRetrievalResult({ id: 'LES-2026-001', record: { annotations: [{ note: 'superseded-by: LES-2026-002' }] } }, { as_current_guidance: true }),
    'SUPERSEDED_AS_CURRENT_GUIDANCE', 'must never be returned as current guidance');
});

test('AC-T7-3: a superseded result is flagged with the superseding id and is never current guidance unflagged', () => {
  const annotated = annotateSuperseded(stageLesson(stagedInput()), 'LES-2026-002');
  const r = classifyRetrievalResult({ id: 'LES-2026-001', section: '4', record: annotated });
  assert.equal(r.superseded, true);
  assert.equal(r.superseding_id, 'LES-2026-002');
  assert.equal(r.current_guidance, false);
  assert.match(r.note, /Superseded by LES-2026-002/);
  const byField = classifyRetrievalResult({ id: 'LES-2026-001', superseded_by: 'LES-2026-002' });
  assert.equal(byField.superseded, true);
  assert.equal(byField.superseding_id, 'LES-2026-002');
  refusesWith(() => classifyRetrievalResult({ id: 'LES-2026-001', record: annotated }, { as_current_guidance: true }),
    'SUPERSEDED_AS_CURRENT_GUIDANCE', 'must never be returned as current guidance');
});

// ---- Graphiti trigger ----

test('Graphiti trigger: the current Stage 3 record count does not meet it under either recorded reading', () => {
  const s = graphitiTriggerStatus(11, false, false);
  assert.equal(s.wp04_trigger_quoted, GRAPHITI_TRIGGER_QUOTED);
  assert.equal(s.record_count_band, 'below the stated "50–100+" range');
  assert.equal(s.count_in_stated_range, false);
  assert.equal(s.reading_a__count_and_acted_or_unanswerable, false);
  assert.equal(s.reading_b__count_and_acted_or_unanswerable, false);
  assert.equal(s.trigger_met, false);
  assert.equal(s.status, 'NOT_MET_UNDER_BOTH_RECORDED_READINGS');
  assert.equal(s.retrieval_method, 'grep');
  assert.equal(s.not_met_statement_provenance, GRAPHITI_NOT_MET_PROVENANCE);
});

test('Graphiti trigger: a count at or above the top of the range plus an acted-on superseded fact meets it under both readings', () => {
  const s = graphitiTriggerStatus(100, true, false);
  assert.equal(s.trigger_met, true);
  assert.equal(s.status, 'MET_UNDER_BOTH_RECORDED_READINGS');
  assert.match(s.retrieval_method, /RE-EXAMINE/);
});

test('Graphiti trigger: count in range plus a grep-unanswerable query class meets it under both readings', () => {
  const s = graphitiTriggerStatus(100, false, true);
  assert.equal(s.trigger_met, true);
  assert.equal(s.status, 'MET_UNDER_BOTH_RECORDED_READINGS');
});

test('Graphiti trigger: below-range count with a grep-unanswerable query class splits the readings, so the verdict is UNDECIDED (C-8)', () => {
  const s = graphitiTriggerStatus(10, false, true);
  assert.equal(s.reading_a__count_and_acted_or_unanswerable, true);
  assert.equal(s.reading_b__count_and_acted_or_unanswerable, false);
  assert.equal(s.trigger_met, null);
  assert.equal(s.status, 'UNDECIDED_GROUPING_OPEN_C8');
  assert.equal(s.retrieval_method, 'grep');
});

test('Graphiti trigger: no single threshold is chosen, so no count in the unresolved 50-99 band can report the trigger met (C-8, F-T7-1)', () => {
  // The semantic requirement, not just labels or band boundaries: (60,
  // true, false) used to report MET; with the threshold unresolved it
  // must report no verdict at all.
  for (const count of [50, 60, 99]) {
    const s = graphitiTriggerStatus(count, true, false);
    assert.equal(s.count_in_stated_range, null, `count ${count} leaves the count predicate unresolved`);
    assert.equal(s.trigger_met, null, `count ${count} with an acted-on superseded fact reports no verdict`);
    assert.equal(s.status, 'UNDECIDED_THRESHOLD_OPEN_C8');
    assert.equal(s.retrieval_method, 'grep');
    assert.match(s.record_count_band, /unresolved/);
  }
  // A grep-unanswerable query class in the band is likewise undecided:
  // reading A would fire on it alone, reading B still needs the count.
  const u = graphitiTriggerStatus(60, false, true);
  assert.equal(u.reading_a__count_and_acted_or_unanswerable, true);
  assert.equal(u.reading_b__count_and_acted_or_unanswerable, null);
  assert.equal(u.trigger_met, null);
  assert.equal(u.status, 'UNDECIDED_THRESHOLD_OPEN_C8');
  // With neither conjunct nor disjunct true, both readings are false
  // whatever the count predicate is, so NOT met is still reported.
  const n = graphitiTriggerStatus(60, false, false);
  assert.equal(n.trigger_met, false);
  assert.equal(n.status, 'NOT_MET_UNDER_BOTH_RECORDED_READINGS');
  // Band boundaries: below 50 the predicate is false; at or above 100 it
  // is true (any threshold in the range is met); only inside the band is
  // it unresolved. No single threshold inside the range is chosen.
  assert.equal(graphitiTriggerStatus(49, false, false).count_in_stated_range, false);
  assert.equal(graphitiTriggerStatus(50, false, false).count_in_stated_range, null);
  assert.equal(graphitiTriggerStatus(99, false, false).count_in_stated_range, null);
  assert.equal(graphitiTriggerStatus(100, false, false).count_in_stated_range, true);
  assert.equal(graphitiTriggerStatus(100, true, false).trigger_met, true);
  assert.match(graphitiTriggerStatus(50, false, false).range_handling, /no single threshold chosen/);
});

test('Graphiti trigger: bad inputs are refused, never defaulted', () => {
  refusesWith(() => graphitiTriggerStatus(-1, false, false), 'BAD_INPUT', 'non-negative integer');
  refusesWith(() => graphitiTriggerStatus(11, 'yes', false), 'BAD_INPUT', 'must be booleans');
});

// ---- module boundary and evidence level ----

test('module boundary: no file I/O, no record location, no network; evidence level stated (EVL-7)', () => {
  assert.doesNotMatch(source, /node:fs|readFileSync|writeFileSync|createReadStream/);
  assert.doesNotMatch(source, /records\/projects\//);
  assert.doesNotMatch(source, /fetch\s*\(|https?:\/\//);
  assert.match(source, /EVL-7/);
  assert.match(source, /Component/);
  assert.match(source, /Structural/);
  assert.match(TEST_LIMIT, /[Tt]est mechanics verified on fixtures/);
  assert.match(EVIDENCE_LEVEL, /Component/);
});

test('module boundary: the module imports T2/T4, it does not copy their logic', () => {
  assert.match(source, /from '\.\/sie-incident\.mjs'/);
  assert.match(source, /from '\.\/sie-schema\.mjs'/);
  assert.match(source, /checkValidationEligibility/);
  assert.match(source, /checkLessonStructure/);
  assert.doesNotMatch(source, /TRANSITIONS\s*=/);
});
