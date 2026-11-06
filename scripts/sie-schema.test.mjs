// Tests for SIE schema, judgment, and INDEX consistency checks (Stage 3 T4,
// AC-T4-1..AC-T4-3). Every input is SYNTHETIC: records and INDEX sets built
// inline (or written to a temporary directory created and removed by the test).
// Records shaped like operational records carry "T4TEST" ids and
// "t4-test-only/" paths so that the fixture-detection rule (IDX-4) can be
// exercised separately; they are SYNTHETIC test inputs, not operational
// records, and their provenance says so.
//
// LIMIT (AC-T4-3): passing on fixtures proves the test works, not that any
// real incident is handled correctly. A pass here is "test mechanics verified
// on fixtures", never "system verified". No operational INDEX or record
// location is read or written (F-14 OPEN; LOC-1 is a working assumption).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createIncident, transition, recordValidationEvidence, watchWindow, validateRecord, SIE02_UNQUALIFIED,
} from './sie-incident.mjs';
import {
  TEST_LIMIT, STRUCTURE_NOTE, IDX5_CHOICE, SECTIONS, checkStructure, checkRecordStructure, checkIncidentStructure,
  checkLessonStructure, checkIndex, parseIndex, checkJudgment, checkJudgments, checkIncidentJudgment, checkLessonJudgment,
  isFixture,
} from './sie-schema.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'sie-schema.mjs'), 'utf8');

const DAY = 24 * 60 * 60 * 1000;
const at = (base, days) => new Date(Date.parse(base) + days * DAY).toISOString();
const RC = '2026-01-10T00:00:00.000Z';
const FP = '2026-01-12T00:00:00.000Z';
const PROV = { all: 'SYNTHETIC test input (T4 mechanics only)' };
const JUDGMENT = { text: 'SYNTHETIC judgment text', by: 'SYNTHETIC-judge', date: at(FP, 31) };

// ---- SYNTHETIC incident records, built with the T2 module ----

const openInc = (n) => createIncident({
  incident_id: `INC-T4TEST-00${n}`,
  title: 'SYNTHETIC: task recorded blocked',
  observed_facts: [{ fact: 'SYNTHETIC fact', source_pointer: 'test-only://task/a' }],
  hypotheses: [{ id: 'H-1', text: 'SYNTHETIC hypothesis', author: 'SYNTHETIC-author', date: RC }],
  detector_rule: 'R1',
  candidate_record_id: 'CAND-R1-0000000000000000',
  record_creation_time: RC,
  provenance: PROV,
}, { opened_by: 'SYNTHETIC-orchestrator', reason: 'SYNTHETIC: T4 test input' });
const fixedInc = (n) => transition(openInc(n), 'FIXED', {
  reason: 'SYNTHETIC fix', evidence: 'test-only://pr/1', date: at(RC, 1), fix_reference: 'test-only://pr/1', fix_description: 'SYNTHETIC change',
});
const watchInc = (n) => transition(fixedInc(n), 'WATCH', {
  reason: 'SYNTHETIC fix present', evidence: 'test-only://presence/1', date: FP,
  fix_presence_evidence: { pointer: 'test-only://presence/1', time: FP },
  watch_window: watchWindow(null, null, FP, RC, 'W-C', SIE02_UNQUALIFIED),
});
const reopenedInc = (n) => transition(fixedInc(n), 'REOPENED', {
  reason: 'SYNTHETIC recurrence', evidence: 'test-only://occ/b', date: at(FP, 5),
  recurrence_evidence: { pointer: 'test-only://occ/b', task_id: 'T4TEST-b', reason: 'SYNTHETIC', kind: 'blocker', key: 'k' },
});

// Hand-built SYNTHETIC literal in VALIDATED status. NOT produced by the
// validation path (which refuses while D2 is pending) and not a validation
// (VAL-6). Its exposure pointer is shaped like an operational pointer only to
// exercise the structural keep-branch.
function validatedIncLiteral(n, { judgment = JUDGMENT, by = 'SYNTHETIC-judge' } = {}) {
  const w = structuredClone(recordValidationEvidence(watchInc(n), {
    reproduction_evidence: { kind: 'reproduced-failure', pointer: 'test-only://repro/1' },
    regression_test: { id: 't', before: { result: 'fail', pointer: 'test-only://run/0' }, after: { result: 'pass', pointer: 'test-only://run/1' } },
    exposure_evidence_link: [{ pointer: 'test-only://operational-shaped/3', timestamp: at(FP, 3), is_operational: true, kind: 'run-event' }],
  }, { reason: 'SYNTHETIC evidence', evidence: 'test-only://ev', date: at(FP, 2) }));
  w.status = 'VALIDATED';
  w.sufficiency_judgment = judgment;
  const entry = { seq: w.history.length, type: 'transition', from: 'WATCH', to: 'VALIDATED', reason: 'SYNTHETIC validation judgment text (hand-built literal)', evidence_pointer: 'test-only://v', date: at(FP, 31) };
  if (by !== null) entry.by = by;
  w.history.push(entry);
  return w;
}

// ---- SYNTHETIC lessons, seed, candidate ----

const stagedLesson = (over = {}) => ({
  lesson_id: 'LES-T4TEST-001', status: 'UNVALIDATED-STAGED', source_incident_id: 'INC-T4TEST-003',
  lesson_statement: 'SYNTHETIC staged guidance', applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
  review_date: '2026-06-01', provenance: PROV, validation_claim: 'NONE', index_section: 'unvalidated-staged',
  citation_use: 'forbidden as authority', counting: 'never',
  annotations: [{ note: 'superseded-by: LES-T4TEST-002', date: at(FP, 32) }],
  ...over,
});
const validatedLessonLiteral = (over = {}) => ({
  lesson_id: 'LES-T4TEST-002', status: 'VALIDATED', source_incident_id: 'INC-T4TEST-005',
  lesson_statement: 'SYNTHETIC validated guidance (hand-built literal; LES-8: no validated lesson is created in Stage 3)',
  applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y', review_date: '2026-06-01', provenance: PROV,
  supersedes_staged_id: 'LES-T4TEST-001', evidence_links: [{ pointer: 'test-only://operational-shaped/3' }],
  validation_reference: { incident_id: 'INC-T4TEST-005', sufficiency_judgment: JUDGMENT }, compounding_use: 'none',
  ...over,
});

const d = (kind, file, record, extra = {}) => ({ kind, file, record, ...extra });
const F = {
  inc1: 't4-test-only/incidents/INC-T4TEST-001.md',
  inc2: 't4-test-only/incidents/INC-T4TEST-002.md',
  inc3: 't4-test-only/incidents/INC-T4TEST-003.md',
  inc4: 't4-test-only/incidents/INC-T4TEST-004.md',
  inc5: 't4-test-only/incidents/INC-T4TEST-005.md',
  les1: 't4-test-only/lessons/LES-T4TEST-001.md',
  les2: 't4-test-only/lessons/LES-T4TEST-002.md',
  seed: 't4-test-only/seed/SEED-T4TEST-01.md',
  cand: 't4-test-only/candidates/CAND-R1-0123456789abcdef.md',
};

function baselineRecords() {
  return [
    d('incident', F.inc1, openInc(1)),
    d('incident', F.inc2, fixedInc(2)),
    d('incident', F.inc3, watchInc(3)),
    d('incident', F.inc4, reopenedInc(4)),
    d('incident', F.inc5, validatedIncLiteral(5)),
    d('lesson', F.les1, stagedLesson()),
    d('lesson', F.les2, validatedLessonLiteral()),
    d('seed', F.seed, { seed_id: 'SEED-T4TEST-01', status: 'historical observation' }),
    d('detector-candidate', F.cand, { candidate_id: 'CAND-R1-0123456789abcdef' }),
  ];
}

function baselineIndex() {
  return {
    sections: {
      1: [{ id: 'LES-T4TEST-002', file: F.les2 }],
      2: [{ id: 'INC-T4TEST-005', file: F.inc5 }],
      3: [1, 2, 3, 4].map((n) => ({ id: `INC-T4TEST-00${n}`, file: F[`inc${n}`] })),
      4: [{ id: 'LES-T4TEST-001', file: F.les1 }],
      5: [{ id: 'SEED-T4TEST-01', file: F.seed }],
      6: [{ superseded_id: 'LES-T4TEST-001', superseding_id: 'LES-T4TEST-002' }],
    },
  };
}

const INDEX_MD = `# INDEX — SYNTHETIC T4 test input (not an operational INDEX)

## Section 1: Validated lessons
- \`LES-T4TEST-002\` \`${F.les2}\` source INC-T4TEST-005
## Section 2: Validated incidents
- \`INC-T4TEST-005\` \`${F.inc5}\`
## Section 3: Incidents in WATCH / FIXED / OPEN / REOPENED
- \`INC-T4TEST-001\` \`${F.inc1}\` OPEN
- \`INC-T4TEST-002\` \`${F.inc2}\` FIXED
- \`INC-T4TEST-003\` \`${F.inc3}\` WATCH (W-C, PROVISIONAL)
- \`INC-T4TEST-004\` \`${F.inc4}\` REOPENED
## Section 4: UNVALIDATED-STAGED lessons
- \`LES-T4TEST-001\` \`${F.les1}\` UNVALIDATED-STAGED — NOT VALIDATED, never cite as authority
## Section 5: Historical seed observations
- \`SEED-T4TEST-01\` \`${F.seed}\` NOT VALIDATED
## Section 6: Supersessions and corrections
- superseded \`LES-T4TEST-001\` by \`LES-T4TEST-002\`
`;

const codes = (res) => res.problems.map((p) => p.code);
const editIndex = (fn) => { const ix = structuredClone(baselineIndex()); fn(ix.sections); return ix; };
const indexWith = (fn, records = baselineRecords()) => checkIndex({ records, index: editIndex(fn) });

// ---- AC-T4-3: the limit is stated ----

test('AC-T4-3: the test design states its own limit in the module, the test file, and every result', () => {
  assert.match(TEST_LIMIT, /Passing on fixtures proves the test works, not that any real incident is handled correctly/);
  assert.match(TEST_LIMIT, /Test mechanics verified on fixtures; system not verified/);
  const flat = (text) => text.replace(/\n\/\/ ?/g, ' ').replace(/\s+/g, ' ');
  assert.match(flat(source), /Passing on fixtures proves the test works, not that any real incident is handled correctly/);
  const header = flat(readFileSync(fileURLToPath(import.meta.url), 'utf8').slice(0, 1200));
  assert.match(header, /passing on fixtures proves the test works, not that any real incident is handled correctly/);
  const recs = baselineRecords();
  assert.equal(checkStructure({ records: recs, index: baselineIndex() }).limit, TEST_LIMIT);
  assert.equal(checkIndex({ records: recs, index: baselineIndex() }).limit, TEST_LIMIT);
  assert.equal(checkJudgments(recs).limit, TEST_LIMIT);
  // Fix round 1 (F-T4-2): every per-record structural and judgment result
  // carries the limit too — passes, failures, early returns, and no-decision outcomes.
  const brokenInc = structuredClone(openInc(1)); delete brokenInc.title;
  const results = {
    'checkIncidentStructure pass': checkIncidentStructure(openInc(1)),
    'checkIncidentStructure fail': checkIncidentStructure(brokenInc),
    'checkIncidentStructure non-object': checkIncidentStructure(null),
    'checkLessonStructure pass': checkLessonStructure(stagedLesson()),
    'checkLessonStructure fail': checkLessonStructure(stagedLesson({ non_applicability: '' })),
    'checkLessonStructure non-object (early return)': checkLessonStructure(null),
    'checkRecordStructure pass': checkRecordStructure(recs[0]),
    'checkRecordStructure fail': checkRecordStructure({ kind: 'note', file: 'x.md', record: {} }),
    'checkRecordStructure non-object (early return)': checkRecordStructure(null),
    'checkIncidentJudgment present': checkIncidentJudgment(validatedIncLiteral(5)),
    'checkIncidentJudgment missing': checkIncidentJudgment(validatedIncLiteral(5, { judgment: null })),
    'checkIncidentJudgment no decision': checkIncidentJudgment(openInc(1)),
    'checkIncidentJudgment non-object (early return)': checkIncidentJudgment(null),
    'checkLessonJudgment present': checkLessonJudgment(validatedLessonLiteral()),
    'checkLessonJudgment missing': checkLessonJudgment(validatedLessonLiteral({ validation_reference: { incident_id: 'INC-T4TEST-005' } })),
    'checkLessonJudgment no decision (early return)': checkLessonJudgment(stagedLesson()),
    'checkJudgment incident': checkJudgment(recs[0]),
    'checkJudgment lesson missing': checkJudgment(d('lesson', F.les2, validatedLessonLiteral({ validation_reference: {} }))),
    'checkJudgment not applicable': checkJudgment(recs.find((x) => x.kind === 'seed')),
    'checkJudgment non-object': checkJudgment(null),
  };
  for (const [name, r] of Object.entries(results)) assert.equal(r.limit, TEST_LIMIT, `${name} carries the limit`);
  assert.equal(results['checkIncidentStructure fail'].valid, false);
  assert.equal(results['checkLessonStructure non-object (early return)'].valid, false);
  assert.equal(results['checkRecordStructure non-object (early return)'].valid, false);
  assert.equal(results['checkIncidentJudgment no decision'].outcome, 'NO_DECISION_RECORDED');
  assert.equal(results['checkLessonJudgment no decision (early return)'].outcome, 'NO_DECISION_RECORDED');
  assert.equal(results['checkJudgment not applicable'].outcome, 'NOT_APPLICABLE');
  assert.equal(results['checkJudgment lesson missing'].outcome, 'JUDGMENT_MISSING');
  for (const r of checkJudgments(recs).results) assert.equal(r.limit, TEST_LIMIT);
  for (const r of checkStructure({ records: recs, index: baselineIndex() }).records) assert.equal(r.limit, TEST_LIMIT);
});

// ---- Schema test (structure only) ----

test('Schema: the SYNTHETIC baseline set is structurally valid and its INDEX is consistent', () => {
  const r = checkStructure({ records: baselineRecords(), index: baselineIndex() });
  assert.deepEqual(r.index.problems, []);
  assert.deepEqual(r.records.filter((x) => !x.valid), []);
  assert.equal(r.structurally_valid, true);
  assert.equal(r.note, STRUCTURE_NOTE);
});

test('Schema: incident structure is T2 validateRecord — missing field, unknown field, and bad status fail, naming the field', () => {
  const missing = structuredClone(openInc(1)); delete missing.title;
  assert.match(checkIncidentStructure(missing).problems.join('; '), /missing required field "title"/);
  const extra = { ...structuredClone(openInc(1)), severity: 'high' };
  assert.match(checkIncidentStructure(extra).problems.join('; '), /unknown field "severity"/);
  const bad = structuredClone(openInc(1)); bad.status = 'CLOSED';
  assert.match(checkIncidentStructure(bad).problems.join('; '), /status "CLOSED" is not one of OPEN, FIXED, WATCH, VALIDATED, REOPENED/);
  const nullId = structuredClone(openInc(1)); nullId.incident_id = null;
  assert.equal(checkIncidentStructure(nullId).valid, false);
  // Exactly T2's problems for a non-VALIDATED record: no second field list.
  for (const rec of [missing, extra, bad, nullId, openInc(1), watchInc(3)]) {
    assert.deepEqual(checkIncidentStructure(rec).problems, validateRecord(rec).problems);
  }
});

test('Schema: VALIDATED incident needs its §6.2 evidence fields present; EVL-1 empty or fixture link fails', () => {
  assert.equal(checkIncidentStructure(validatedIncLiteral(5)).valid, true);
  const empty = validatedIncLiteral(5); empty.exposure_evidence_link = [];
  assert.match(checkIncidentStructure(empty).problems.join('; '), /EVL-1/);
  const fx = validatedIncLiteral(5); fx.exposure_evidence_link = [{ pointer: 'scripts/fixtures/sie-SYNTHETIC/F-R1-SYNTHETIC/x.json' }];
  assert.match(checkIncidentStructure(fx).problems.join('; '), /fixture or synthetic/);
  const noRegression = validatedIncLiteral(5); noRegression.regression_test = null;
  assert.match(checkIncidentStructure(noRegression).problems.join('; '), /"regression_test" for VALIDATED/);
});

test('Schema: lesson structure per §9.2 — non_applicability, status set, staged-only and validated-only rules', () => {
  assert.deepEqual(checkLessonStructure(stagedLesson()).problems, []);
  assert.deepEqual(checkLessonStructure(validatedLessonLiteral()).problems, []);
  const fails = (rec, re) => {
    const r = checkLessonStructure(rec);
    assert.equal(r.valid, false, `expected failure for ${re}`);
    assert.match(r.problems.join('; '), re);
  };
  fails(stagedLesson({ non_applicability: '' }), /non_applicability.*CR-02 \(c\)/);
  fails(validatedLessonLiteral({ non_applicability: '   ' }), /non_applicability/);
  fails(stagedLesson({ status: 'CANDIDATE' }), /reserved and unused.*VOC-6/);
  fails(stagedLesson({ status: 'validated-ish' }), /not one of UNVALIDATED-STAGED, VALIDATED/);
  fails(stagedLesson({ validation_claim: 'PARTIAL' }), /validation_claim = "NONE"/);
  fails(stagedLesson({ index_section: 'validated' }), /index_section = "unvalidated-staged"/);
  fails(stagedLesson({ evidence_links: [{ pointer: 'x' }] }), /validated-only field "evidence_links"/);
  fails(validatedLessonLiteral({ evidence_links: [] }), /non-empty evidence_links/);
  fails(validatedLessonLiteral({ validation_reference: undefined }), /validation_reference naming the validated incident/);
  fails(validatedLessonLiteral({ supersedes_staged_id: 'LES-T4TEST-002' }), /never reuses the staged lesson id/);
  fails(validatedLessonLiteral({ validation_claim: 'NONE' }), /staged-only validation_claim/);
  fails(stagedLesson({ review_date: 'soon' }), /review_date/);
  fails(stagedLesson({ authority: 'yes' }), /unknown field "authority"/);
  const noId = stagedLesson(); delete noId.lesson_id;
  fails(noId, /"lesson_id"/);
});

test('Schema: record descriptors need a file and a known kind', () => {
  assert.match(checkRecordStructure({ kind: 'incident', record: openInc(1) }).problems.join(), /file path/);
  assert.match(checkRecordStructure({ kind: 'note', file: 'x.md', record: {} }).problems.join(), /unknown record kind/);
  assert.equal(checkRecordStructure(d('seed', F.seed, { seed_id: 'S', status: 'VALIDATED' })).valid, false);
});

// ---- AC-T4-1: structure and judgment are distinct ----

test('AC-T4-1: a structurally complete VALIDATED incident with empty sufficiency_judgment PASSES the schema test and FAILS the judgment test', () => {
  for (const judgment of [null, {}, { text: '', by: 'SYNTHETIC-judge', date: at(FP, 31) }]) {
    const rec = validatedIncLiteral(5, { judgment });
    const recs = baselineRecords().map((x) => (x.file === F.inc5 ? d('incident', F.inc5, rec) : x));
    const schema = checkStructure({ records: recs, index: baselineIndex() });
    assert.equal(schema.structurally_valid, true, 'structure passes');
    const j = checkJudgment(d('incident', F.inc5, rec));
    assert.equal(j.outcome, 'JUDGMENT_MISSING');
    assert.equal(j.judged, false);
    assert.match(j.missing.join('; '), /sufficiency_judgment/);
    assert.equal(checkJudgments(recs).outcome, 'JUDGMENT_TEXT_MISSING');
  }
});

test('AC-T4-1: judgment text must name who judged and when; the validation decision needs its own judgment text', () => {
  const noBy = checkIncidentJudgment(validatedIncLiteral(5, { judgment: { text: 'SYNTHETIC', date: at(FP, 31) } }));
  assert.match(noBy.missing.join('; '), /sufficiency_judgment\.by: who judged/);
  const noDate = checkIncidentJudgment(validatedIncLiteral(5, { judgment: { text: 'SYNTHETIC', by: 'SYNTHETIC-judge', date: 'later' } }));
  assert.match(noDate.missing.join('; '), /sufficiency_judgment\.date: when/);
  const noValidationBy = validatedIncLiteral(5, { by: null });
  assert.equal(checkIncidentStructure(noValidationBy).valid, true, 'structure passes');
  const j = checkIncidentJudgment(noValidationBy);
  assert.equal(j.outcome, 'JUDGMENT_MISSING');
  assert.match(j.missing.join('; '), /validation judgment \(history seq \d+\)\.by: who judged/);
  assert.equal(checkIncidentJudgment(validatedIncLiteral(5)).outcome, 'JUDGMENT_PRESENT');
  // A recorded sufficiency judgment on a not-yet-validated record must itself be complete.
  const partial = structuredClone(watchInc(3)); partial.sufficiency_judgment = { text: 'SYNTHETIC' };
  assert.equal(checkIncidentJudgment(partial).outcome, 'JUDGMENT_MISSING');
});

test('AC-T4-1: a structurally complete validated lesson without sufficiency judgment text PASSES structure and FAILS judgment', () => {
  // Fix round 1 (F-T4-3): omitted, null, {}, and empty-text judgments.
  const cases = {
    omitted: { incident_id: 'INC-T4TEST-005' },
    null: { incident_id: 'INC-T4TEST-005', sufficiency_judgment: null },
    '{}': { incident_id: 'INC-T4TEST-005', sufficiency_judgment: {} },
    'empty text': { incident_id: 'INC-T4TEST-005', sufficiency_judgment: { text: '', by: 'SYNTHETIC-judge', date: at(FP, 31) } },
  };
  for (const [name, validation_reference] of Object.entries(cases)) {
    const les = validatedLessonLiteral({ validation_reference });
    assert.equal(checkLessonStructure(les).valid, true, `${name}: lesson structure passes`);
    const recs = baselineRecords().map((x) => (x.file === F.les2 ? d('lesson', F.les2, les) : x));
    const schema = checkStructure({ records: recs, index: baselineIndex() });
    assert.equal(schema.index.consistent, true, `${name}: INDEX consistent`);
    assert.equal(schema.structurally_valid, true, `${name}: schema test passes`);
    const j = checkJudgment(d('lesson', F.les2, les));
    assert.equal(j.outcome, 'JUDGMENT_MISSING', `${name}: judgment fails`);
    assert.equal(j.judged, false);
    assert.match(j.missing.join('; '), /validation_reference\.sufficiency_judgment/);
    assert.equal(checkJudgments(recs).outcome, 'JUDGMENT_TEXT_MISSING', `${name}: set judgment fails`);
  }
  assert.equal(checkJudgment(d('lesson', F.les2, validatedLessonLiteral())).outcome, 'JUDGMENT_PRESENT');
});

test('AC-T4-1: the judgment test never passes on structure alone — no structurally valid record without judgment text is judged', () => {
  const plain = [
    d('incident', F.inc1, openInc(1)), d('incident', F.inc2, fixedInc(2)), d('incident', F.inc3, watchInc(3)),
    d('incident', F.inc4, reopenedInc(4)), d('lesson', F.les1, stagedLesson()),
    d('seed', F.seed, { seed_id: 'SEED-T4TEST-01' }), d('detector-candidate', F.cand, { candidate_id: 'CAND-R1-0123456789abcdef' }),
  ];
  for (const x of plain) {
    assert.equal(checkRecordStructure(x).valid, true, `${x.file} is structurally valid`);
    const j = checkJudgment(x);
    assert.equal(j.judged, false, `${x.file} is not judged`);
    assert.notEqual(j.outcome, 'JUDGMENT_PRESENT');
  }
  // No vacuous pass: a set with no decisions is not a judgment pass.
  const set = checkJudgments(plain);
  assert.equal(set.outcome, 'NO_DECISIONS_TO_JUDGE');
  assert.equal(set.decisions_checked, 0);
  // Structural results carry no judgment / validation / sufficiency verdict.
  const s = checkStructure({ records: baselineRecords(), index: baselineIndex() });
  const keys = JSON.stringify(Object.keys(s)) + JSON.stringify(Object.keys(s.records[0])) + JSON.stringify(Object.keys(s.index));
  assert.doesNotMatch(keys, /judg|validated|sufficien/i);
});

test('AC-T4-1: neither check substitutes for the other — judgment present does not make a broken record structurally valid', () => {
  const broken = validatedIncLiteral(5); delete broken.title;
  assert.equal(checkIncidentStructure(broken).valid, false);
  assert.equal(checkIncidentJudgment(broken).outcome, 'JUDGMENT_PRESENT');
  // The two code paths are separate: judgment functions call no structural check.
  for (const fn of [checkIncidentJudgment, checkJudgment, checkJudgments]) {
    assert.doesNotMatch(fn.toString(), /validateRecord|checkStructure|checkRecordStructure|checkIncidentStructure|checkLessonStructure|checkIndex/);
  }
  assert.doesNotMatch(checkIncidentStructure.toString(), /sufficiency_judgment\.|\.text\b/);
});

// ---- AC-T4-2: staged / validated section separation ----

test('AC-T4-2: a staged lesson in Section 1 (validated lessons) fails', () => {
  const moved = indexWith((s) => { s[1].push(s[4].pop()); });
  assert.equal(moved.consistent, false);
  assert.ok(codes(moved).includes('STAGED_IN_SECTION_1'));
  // Listed in both Section 1 and Section 4 also fails (and is two primary entries).
  const both = indexWith((s) => { s[1].push({ id: 'LES-T4TEST-001', file: F.les1 }); });
  assert.ok(codes(both).includes('STAGED_IN_SECTION_1'));
  assert.ok(codes(both).includes('MULTIPLE_PRIMARY_ENTRIES'));
});

test('AC-T4-2: a validated record in Section 4 (UNVALIDATED-STAGED) fails — validated lesson and validated incident', () => {
  const lesson = indexWith((s) => { s[4].push(s[1].pop()); });
  assert.equal(lesson.consistent, false);
  assert.ok(codes(lesson).includes('VALIDATED_IN_SECTION_4'));
  const incident = indexWith((s) => { s[4].push(s[2].pop()); });
  assert.ok(codes(incident).includes('VALIDATED_IN_SECTION_4'));
});

// ---- INDEX consistency ----

test('INDEX: a record with zero primary entries fails; a record with two primary entries fails', () => {
  const zero = indexWith((s) => { s[3] = s[3].filter((e) => e.id !== 'INC-T4TEST-002'); });
  assert.deepEqual(codes(zero), ['NO_PRIMARY_ENTRY']);
  const twoSections = indexWith((s) => { s[2].push({ id: 'INC-T4TEST-001', file: F.inc1 }); });
  assert.ok(codes(twoSections).includes('MULTIPLE_PRIMARY_ENTRIES'));
  const sameSection = indexWith((s) => { s[3].push({ id: 'INC-T4TEST-001', file: F.inc1 }); });
  assert.deepEqual(codes(sameSection), ['MULTIPLE_PRIMARY_ENTRIES']);
});

test('INDEX: every entry resolves to an existing record file whose id matches', () => {
  const missingFile = indexWith((s) => { s[3].push({ id: 'INC-T4TEST-009', file: 't4-test-only/incidents/INC-T4TEST-009.md' }); });
  assert.deepEqual(codes(missingFile), ['UNRESOLVED_ENTRY']);
  const wrongId = indexWith((s) => { s[3][0].id = 'INC-T4TEST-099'; });
  assert.deepEqual(codes(wrongId), ['ID_MISMATCH']);
  const malformed = indexWith((s) => { s[3].push({ id: 'INC-T4TEST-001' }); });
  assert.deepEqual(codes(malformed), ['MALFORMED_ENTRY']);
  const dupFile = checkIndex({ records: [...baselineRecords(), d('incident', F.inc1, openInc(1))], index: baselineIndex() });
  assert.ok(codes(dupFile).includes('DUPLICATE_RECORD_FILE'));
});

test('INDEX: a section value that is not a list is refused as MALFORMED_SECTION, never treated as empty (F-T4-1)', () => {
  // Codex counterexample: Section 6 as a bare object with ids that resolve to nothing.
  const s6 = indexWith((s) => { s[6] = { superseded_id: 'MISSING', superseding_id: 'ALSO-MISSING' }; });
  assert.equal(s6.consistent, false);
  assert.deepEqual(codes(s6), ['MALFORMED_SECTION']);
  assert.equal(s6.problems[0].section, '6');
  // A primary section that is not a list: refused, and its record has no primary entry.
  const s1 = indexWith((s) => { s[1] = { id: 'LES-T4TEST-002', file: F.les2 }; });
  assert.equal(s1.consistent, false);
  assert.deepEqual(codes(s1).sort(), ['MALFORMED_SECTION', 'NO_PRIMARY_ENTRY']);
  // Every other non-list shape, in every section, is refused the same way.
  for (const section of ['1', '2', '3', '4', '5', '6']) {
    for (const bad of [null, undefined, 'LES-T4TEST-002', 7, true, {}]) {
      const r = indexWith((s) => { s[section] = bad; });
      assert.equal(r.consistent, false, `Section ${section} = ${String(bad)}`);
      assert.ok(codes(r).includes('MALFORMED_SECTION'), `Section ${section} = ${String(bad)}`);
    }
  }
  // An empty list is still a valid (empty) section.
  assert.equal(indexWith((s) => { s[6] = []; }).consistent, true);
});

test('INDEX: Section 6 references are secondary, not duplicate primary entries (IDX-2)', () => {
  // Baseline: LES-T4TEST-001 has a Section 4 entry AND a Section 6 reference — consistent.
  assert.equal(checkIndex({ records: baselineRecords(), index: baselineIndex() }).consistent, true);
  const extraRefs = indexWith((s) => { s[6].push({ superseded_id: 'INC-T4TEST-001', superseding_id: 'INC-T4TEST-002' }); });
  assert.equal(extraRefs.consistent, true);
  // A Section 6 reference does not satisfy the primary-entry requirement.
  const onlyIn6 = indexWith((s) => { s[4] = []; });
  assert.deepEqual(codes(onlyIn6), ['NO_PRIMARY_ENTRY']);
  const unresolved = indexWith((s) => { s[6].push({ superseded_id: 'LES-T4TEST-404', superseding_id: 'LES-T4TEST-002' }); });
  assert.deepEqual(codes(unresolved), ['UNRESOLVED_REFERENCE']);
});

test('INDEX: Section 3 holds OPEN, FIXED, WATCH, and REOPENED incidents only; Section 2 holds VALIDATED incidents only (IDX-3)', () => {
  const statuses = baselineRecords().filter((x) => baselineIndex().sections[3].some((e) => e.file === x.file)).map((x) => x.record.status);
  assert.deepEqual(statuses.sort(), ['FIXED', 'OPEN', 'REOPENED', 'WATCH']);
  assert.ok(codes(indexWith((s) => { s[3].push(s[2].pop()); })).includes('WRONG_SECTION'));
  assert.ok(codes(indexWith((s) => { s[2].push(s[3].shift()); })).includes('WRONG_SECTION'));
  assert.ok(codes(indexWith((s) => { s[3].push(s[4].pop()); })).includes('WRONG_SECTION'));
  assert.ok(codes(indexWith((s) => { s[1].push(s[2].pop()); })).includes('WRONG_SECTION'));
  assert.ok(codes(indexWith((s) => { s[5].push(s[3].shift()); })).includes('WRONG_SECTION'));
  assert.ok(codes(indexWith((s) => { s[3].push(s[5].pop()); })).includes('WRONG_SECTION'));
});

test('INDEX: fixtures never appear in Sections 1-3 or any INDEX under test (IDX-4, FXT-1)', () => {
  const fx = (file, rec) => d('incident', file, rec);
  const fxFile = 'scripts/fixtures/sie-SYNTHETIC/INC-T4TEST-007.md';
  const recs = [...baselineRecords(), fx(fxFile, openInc(7))];
  for (const section of ['1', '2', '3', '4', '5']) {
    const r = checkIndex({ records: recs, index: editIndex((s) => { s[section].push({ id: 'INC-T4TEST-007', file: fxFile }); }) });
    assert.ok(codes(r).includes('FIXTURE_IN_INDEX'), `fixture in Section ${section}`);
    assert.ok(codes(r).includes('FIXTURE_IN_RECORD_SET'));
  }
  // Marked by flag, by SYNTHETIC in the name, or by SYNTHETIC in the id.
  assert.equal(isFixture(d('incident', 'x/INC-1.md', openInc(1), { fixture: true })), true);
  assert.equal(isFixture(d('lesson', 'x/LES-SYNTHETIC-1.md', stagedLesson())), true);
  assert.equal(isFixture(d('lesson', 'x/LES-1.md', stagedLesson({ lesson_id: 'LES-SYNTHETIC-1' }))), true);
  assert.equal(isFixture(d('incident', F.inc1, openInc(1))), false);
  // A fixture in the record set but not indexed still fails: it is in the wrong place.
  assert.deepEqual(codes(checkIndex({ records: recs, index: baselineIndex() })), ['FIXTURE_IN_RECORD_SET']);
  // A fixture referenced in Section 6 fails too.
  const ref = checkIndex({ records: recs, index: editIndex((s) => { s[6].push({ superseded_id: 'INC-T4TEST-007', superseding_id: 'INC-T4TEST-001' }); }) });
  assert.ok(codes(ref).includes('FIXTURE_IN_INDEX'));
});

test('IDX-5 design choice: detector candidates get no INDEX entry; a candidate in Sections 1-6 fails; no CANDIDATE section exists', () => {
  assert.match(IDX5_CHOICE, /design choice/);
  assert.match(IDX5_CHOICE, /not a spec requirement/);
  // Baseline: candidate in the record set, no entry, consistent.
  assert.equal(checkIndex({ records: baselineRecords(), index: baselineIndex() }).consistent, true);
  for (const section of ['1', '2', '3', '4', '5']) {
    const r = indexWith((s) => { s[section].push({ id: 'CAND-R1-0123456789abcdef', file: F.cand }); });
    assert.ok(codes(r).includes('CANDIDATE_IN_INDEX'), `candidate in Section ${section}`);
  }
  const in6 = indexWith((s) => { s[6].push({ superseded_id: 'CAND-R1-0123456789abcdef', superseding_id: 'INC-T4TEST-001' }); });
  assert.ok(codes(in6).includes('CANDIDATE_IN_INDEX'));
  const candSection = indexWith((s) => { s.CANDIDATE = []; });
  assert.deepEqual(codes(candSection), ['UNKNOWN_SECTION']);
  assert.match(candSection.problems[0].message, /IDX-5/);
  assert.deepEqual(codes(indexWith((s) => { s[7] = []; })), ['UNKNOWN_SECTION']);
  assert.deepEqual(Object.keys(SECTIONS), ['1', '2', '3', '4', '5', '6']);
});

test('INDEX Markdown: parsed sections match the in-memory INDEX; stray entries and unknown headings are refused', () => {
  const parsed = parseIndex(INDEX_MD);
  assert.deepEqual(parsed.sections, JSON.parse(JSON.stringify(baselineIndex().sections)));
  assert.equal(checkIndex({ records: baselineRecords(), index: parsed }).consistent, true);
  const stray = parseIndex(`- \`INC-T4TEST-001\` \`${F.inc1}\`\n${INDEX_MD}`);
  assert.ok(codes(checkIndex({ records: baselineRecords(), index: stray })).includes('STRAY_ENTRY'));
  const cand = parseIndex(`${INDEX_MD}## Candidate lessons\n`);
  assert.deepEqual(codes(checkIndex({ records: baselineRecords(), index: cand })), ['UNKNOWN_SECTION']);
  const moved = parseIndex(INDEX_MD.replace(`## Section 1: Validated lessons\n`, `## Section 1: Validated lessons\n- \`LES-T4TEST-001\` \`${F.les1}\`\n`));
  assert.ok(codes(checkIndex({ records: baselineRecords(), index: moved })).includes('STAGED_IN_SECTION_1'));
});

test('INDEX in a temporary SYNTHETIC directory: entries resolve to files on disk; a deleted file fails resolution', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sie-t4-test-'));
  try {
    const recs = baselineRecords();
    for (const x of recs) {
      mkdirSync(join(dir, dirname(x.file)), { recursive: true });
      writeFileSync(join(dir, x.file), `<!-- SYNTHETIC T4 test input -->\n\`\`\`json\n${JSON.stringify(x.record, null, 2)}\n\`\`\`\n`);
    }
    writeFileSync(join(dir, 'INDEX.md'), INDEX_MD);
    const onDisk = () => {
      const files = readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.md') && f !== 'INDEX.md').map((f) => f.split('\\').join('/'));
      return recs.filter((x) => files.includes(x.file)).map((x) => ({
        ...x, record: JSON.parse(/```json\n([\s\S]*)\n```/.exec(readFileSync(join(dir, x.file), 'utf8'))[1]),
      }));
    };
    const index = parseIndex(readFileSync(join(dir, 'INDEX.md'), 'utf8'));
    assert.equal(checkStructure({ records: onDisk(), index }).structurally_valid, true);
    unlinkSync(join(dir, F.inc2));
    const r = checkIndex({ records: onDisk(), index });
    assert.deepEqual(codes(r), ['UNRESOLVED_ENTRY']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Boundary ----

test('Boundary: no file I/O in the module; incident fields and status machine imported from T2, not copied; inputs never mutated', () => {
  assert.doesNotMatch(source, /from 'node:fs'|require\(|writeFile|readFile|mkdir/);
  assert.match(source, /import \{ validateRecord \} from '\.\/sie-incident\.mjs'/);
  assert.doesNotMatch(source, /'incident_id', 'status', 'title'/);
  assert.doesNotMatch(source, /TRANSITIONS/);
  assert.doesNotMatch(source, /records\/projects\/genesis\/sie/);
  const recs = baselineRecords();
  const index = baselineIndex();
  const before = JSON.stringify({ recs, index });
  const frozen = (v) => { if (v && typeof v === 'object') { Object.freeze(v); Object.values(v).forEach(frozen); } return v; };
  frozen(recs); frozen(index);
  checkStructure({ records: recs, index });
  checkJudgments(recs);
  assert.equal(JSON.stringify({ recs, index }), before);
});
