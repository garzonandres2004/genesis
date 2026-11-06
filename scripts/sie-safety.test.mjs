// Tests for the SIE safety / negative cases — all six Group B tests (Stage 3
// T6, AC-T6-1..AC-T6-5, spec 0.5-draft §14.2). Every input is SYNTHETIC:
// incident records built with the T2 module from SYNTHETIC inputs, lessons
// built with the T7 module, seed descriptors quoted from the T5 draft seed
// records (SEED-01…SEED-10 + SEED-SHA; the Markdown files are NOT read),
// and governance/reuse/evaluation claims built inline. Every fixture is
// labeled SYNTHETIC; fixtures live only in this file.
//
// AC-T6-1: each test states its failing input in the test name or a leading
// comment — the input whose acceptance would fail the test.
// AC-T6-2: no test depends on operational data; all use fixtures or draft
// records.
// AC-T6-3: the GOV tests name Founder approval as the only pass path.
// AC-T6-4: N-LES refuses a validated lesson from an unvalidated incident and
// without the complete LES-3 reference; legitimate LES-2 staging is not refused.
// AC-T6-5: N-VAL refuses validation before the watch window's end condition
// is reached, even with non-empty exposure (CR-01).
//
// DV-8 / C-20 OPEN: these tests must NOT assume a grouping for WP-04
// VAL-1/VAL-2. They do not claim to satisfy them as Group A/B rows, nor
// treat them as deferred Group C. §1.4 is unchanged.
// C-16 / DV-3 OPEN: no result here claims WP-04's two-user meaningful-
// exposure condition is satisfied.
//
// LIMIT (EVL-7, AC-T4-3): passing on fixtures proves the test works, not that
// any real incident is handled correctly. A pass here is "test mechanics
// verified on fixtures", never "system verified". No validated lesson is
// created (LES-8); no incident reaches VALIDATED (VAL-6); no lesson is
// promoted to global knowledge (LES-6/LES-7); no compounding change is made
// (CMP-1); no reuse is demonstrated (REU-2); no Group C test is designed as
// passable (§14.3).
//
// N-VAL and N-LES are exercised through the existing T2/T4/T7 functions
// (imported, not re-implemented). The new sie-safety.mjs functions cover
// N-HIST, N-REU, N-EVAL, GOV, plus the one thin named check no existing
// function enforces: refuseUnverifiableEvidenceLink for N-VAL (f) (S-T6-5).
// The legitimate-task-only rule N-REU is designed against is a PROPOSED rule
// with the assumption marked (DV-7, C-19: "no prescribed reuse task" stays
// UNVERIFIED); each N-REU test that relies on it says so.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IncidentRefusal, createIncident, transition, recordFurtherRecurrence,
  annotateCorrectedVerdict, recordValidationEvidence,
  watchWindow, watchEnd, exposureInWindow, watchOutcome,
  checkValidationEligibility, checkFixVerified, SIE02_UNQUALIFIED,
  D2_NOT_SATISFIED,
} from './sie-incident.mjs';
import { checkLessonStructure, checkLessonJudgment, checkIndex, checkRecordStructure } from './sie-schema.mjs';
import {
  LessonRefusal, stageLesson, annotateSuperseded, createValidatedLesson,
} from './sie-lesson.mjs';
import {
  EVIDENCE_LEVEL, LEGITIMATE_TASK_ASSUMPTION, SafetyRefusal,
  refuseUnverifiableEvidenceLink, refuseSeedValidation,
  refuseReuseClaim, assessImprovementClaim, checkGovernanceChange,
  isRecordedFounderApproval,
} from './sie-safety.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const safetySource = readFileSync(join(here, 'sie-safety.mjs'), 'utf8');

const DAY = 24 * 60 * 60 * 1000;
const at = (base, days) => new Date(Date.parse(base) + days * DAY).toISOString();
const RC = '2026-01-10T00:00:00.000Z'; // SYNTHETIC record creation
const FP = '2026-01-12T00:00:00.000Z'; // SYNTHETIC fix presence (after record creation)
const RULE = SIE02_UNQUALIFIED;
const PROV = { all: 'SYNTHETIC test input (T6 mechanics only)', derivation_note: 'SYNTHETIC: staged from unvalidated material; guidance, not proven fact' };
const JUDGMENT = { text: 'SYNTHETIC judgment text', by: 'SYNTHETIC-judge', date: at(FP, 31) };

// ---- SYNTHETIC incident records, built with the T2 module (T7 pattern) ----

const openInc = (n) => createIncident({
  incident_id: `INC-T6TEST-00${n}`,
  title: 'SYNTHETIC: task recorded blocked',
  observed_facts: [{ fact: 'SYNTHETIC fact', source_pointer: 'test-only://task/a' }],
  hypotheses: [{ id: 'H-1', text: 'SYNTHETIC hypothesis', author: 'SYNTHETIC-author', date: RC }],
  detector_rule: 'R1',
  candidate_record_id: 'CAND-R1-0000000000000000',
  record_creation_time: RC,
  provenance: PROV,
}, { opened_by: 'SYNTHETIC-orchestrator', reason: 'SYNTHETIC: T6 test input' });
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
// Watch end NOT reached: as of day 10 of the window (AC-T6-5, CR-01).
const midWatch = (record) => watchEnd(record.watch_window, [], SIE02_UNQUALIFIED, at(FP, 10));
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
// nearlyValidatedInc with its status overridden and a matching history entry
// appended (T2's validateRecord requires the last history entry's `to` to
// equal the status). NOT produced by the validation path (VAL-6: no incident
// reaches VALIDATED in Stage 3); it exercises the corrected-verdict path only.
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
      reason: 'SYNTHETIC: hand-built fixture status for the corrected-verdict path; NOT produced by the validation path (VAL-6)',
      evidence_pointer: 'test-only://synthetic/validated-status',
      by: 'SYNTHETIC-test',
      date: at(FP, 32),
    }],
  };
}
const recEv = (taskId, over = {}) => ({ pointer: `SYNTHETIC-occ-${taskId}`, task_id: taskId, reason: 'SYNTHETIC recurrence', kind: 'blocker', key: 'SYNTHETIC-blocker', ...over });
const correctedVerdict = (over = {}) => ({ pointer: 'test-only://corrected/1', reason: 'SYNTHETIC: earlier verdict was wrong', ...over });

// ---- SYNTHETIC lessons (T7 pattern, T6 ids) ----

const stagedInput = (over = {}) => ({
  lesson_id: 'LES-2026-101', status: 'UNVALIDATED-STAGED', source_incident_id: 'INC-T6TEST-003',
  lesson_statement: 'SYNTHETIC staged guidance. It applies in this narrow case.',
  applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
  review_date: '2026-06-01', provenance: PROV,
  ...over,
});
const validatedLessonInput = (over = {}) => ({
  lesson_id: 'LES-2026-102', status: 'VALIDATED', source_incident_id: 'INC-T6TEST-003',
  lesson_statement: 'SYNTHETIC validated guidance (hand-built literal; LES-8: no validated lesson is created in Stage 3).',
  applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
  review_date: '2026-06-01', provenance: PROV,
  supersedes_staged_id: 'LES-2026-101',
  evidence_links: [{ pointer: 'test-only://operational-shaped/3' }],
  validation_reference: { incident_id: 'INC-T6TEST-003', sufficiency_judgment: JUDGMENT },
  compounding_use: 'none',
  ...over,
});

// ---- T5 seed descriptors (quoted from docs/stage-3/seed/INDEX-section-5-DRAFT.md; files NOT read) ----

const SEED_DESCRIPTORS = [
  { seed_id: 'SEED-01', corpus_item: 'overnight-03 kill and recovery' },
  { seed_id: 'SEED-02', corpus_item: 'stale-checkout MODULE_NOT_FOUND' },
  { seed_id: 'SEED-03', corpus_item: 'wiring deletion contradiction' },
  { seed_id: 'SEED-04', corpus_item: 'policy §7 backoff claim' },
  { seed_id: 'SEED-05', corpus_item: 'policy §9 repo-plus-workflow staleness' },
  { seed_id: 'SEED-06', corpus_item: 'step-4 versus durable-doc crash-before-task_started disagreement' },
  { seed_id: 'SEED-07', corpus_item: 'race precision correction (24 versus 3)' },
  { seed_id: 'SEED-08', corpus_item: 'claim-commit identity cosmetic note' },
  { seed_id: 'SEED-09', corpus_item: 'thin event log' },
  { seed_id: 'SEED-10', corpus_item: 'test outputs not durably stored' },
  { seed_id: 'SEED-SHA', corpus_item: 'truncated-base-SHA item (prep §4.7), UNVERIFIED CANDIDATE' },
];
const seedAttempt = (seed, attempt) => ({ ...seed, status: 'historical observation', attempt });

// ---- GOV fixtures ----

const FOUNDER_APPROVAL = () => ({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-founder-approval-1', date: '2026-11-06' });

// ---- refusal-assertion helpers ----

const incidentRefuses = (fn, code, re) => assert.throws(fn, (e) => e instanceof IncidentRefusal && e.code === code && re.test(e.message));
const lessonRefuses = (fn, code, fragment) => {
  assert.throws(fn, (e) => {
    assert.equal(e.name, 'LessonRefusal', `expected a LessonRefusal, got ${e}`);
    assert.equal(e.code, code, `expected code ${code}, got ${e.code}: ${e.message}`);
    if (fragment) assert.match(e.message, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `refusal message should name ${fragment}`);
    return true;
  });
};
const safetyRefuses = (fn, code, fragment) => {
  assert.throws(fn, (e) => {
    assert.equal(e.name, 'SafetyRefusal', `expected a SafetyRefusal, got ${e}`);
    assert.equal(e.code, code, `expected code ${code}, got ${e.code}: ${e.message}`);
    if (fragment) assert.match(e.message, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `refusal message should name ${fragment}`);
    return true;
  });
};

// =====================================================================
// N-VAL (a)–(g) — refuse validation (spec §14.2, §8 VAL-1–VAL-6, §7, §10)
// =====================================================================

test('N-VAL (a) failing input: merged PR, no regression test — fix-verified fails naming the regression-test element, and FIXED -> WATCH is refused', () => {
  // Failing input: a FIXED record whose only fix evidence is the merged PR.
  const fixed = fixedInc(1);
  const fv = checkFixVerified(fixed);
  assert.equal(fv.verified, false);
  assert.ok(fv.missing.includes('regression_test'), 'missing must name regression_test');
  assert.match(fv.elements.c2_regression_test_fail_before_pass_after.reason, /regression test/);
  // The merged PR alone cannot carry the record into WATCH (DV-2 door 1).
  incidentRefuses(
    () => transition(fixed, 'WATCH', {
      reason: 'SYNTHETIC fix present', evidence: 'test-only://presence/1', date: FP,
      fix_presence_evidence: { pointer: 'test-only://presence/1', time: FP },
      watch_window: watchWindow(null, null, FP, RC, 'W-C', SIE02_UNQUALIFIED),
    }),
    'FIX_NOT_VERIFIED', /fix not verified.*regression_test/,
  );
});

test('N-VAL (a) failing input: regression test that passes before the fix — no failing-before result (DV-5)', () => {
  // Failing input: a regression test with pass-before AND pass-after.
  const fixed = recordValidationEvidence(fixedInc(2), {
    regression_test: { id: 't', before: { result: 'pass', pointer: 'test-only://run/0' }, after: { result: 'pass', pointer: 'test-only://run/1' } },
  }, { reason: 'SYNTHETIC evidence', evidence: 'test-only://ev', date: at(FP, 2) });
  const fv = checkFixVerified(fixed);
  assert.equal(fv.verified, false);
  assert.match(fv.elements.c2_regression_test_fail_before_pass_after.reason, /no failing-before result/);
});

test('N-VAL (b) failing input: regression test present, zero exposure — eligibility fails naming the exposure elements', () => {
  // Failing input: fix-verified WATCH record, exposure_evidence_link empty.
  const w = watchInc(3);
  const check = checkValidationEligibility(w, endedWatch(w), { sufficiency_judgment: JUDGMENT });
  assert.equal(check.eligible, false);
  assert.ok(check.failing.includes('b_operational_exposure_in_window'), `failing must name b_operational_exposure_in_window, got ${check.failing}`);
  assert.ok(check.failing.includes('c6_exposure_evidence_link'), `failing must name c6_exposure_evidence_link, got ${check.failing}`);
  assert.match(check.elements.b_operational_exposure_in_window.reason, /no in-window operational evidence/);
  incidentRefuses(
    () => transition(w, 'VALIDATED', { reason: 'SYNTHETIC validation', evidence: 'test-only://ev', date: at(FP, 31), sufficiency_judgment: JUDGMENT, watch: endedWatch(w) }),
    'NOT_ELIGIBLE', /b_operational_exposure_in_window/,
  );
  assert.equal(w.status, 'WATCH', 'the record must not reach VALIDATED');
});

test('N-VAL (c) failing input: exposure present, no sufficiency judgment — eligibility fails naming c5', () => {
  // Failing input: in-window exposure recorded, sufficiency judgment absent.
  const w = structuredClone(watchInc(4));
  w.exposure_evidence_link = [{ pointer: 'test-only://operational-shaped/3', timestamp: at(FP, 3), is_operational: true, kind: 'run-event' }];
  const check = checkValidationEligibility(w, endedWatch(w));
  assert.equal(check.eligible, false);
  assert.ok(check.failing.includes('c5_sufficiency_judgment'), `failing must name c5_sufficiency_judgment, got ${check.failing}`);
  assert.match(check.elements.c5_sufficiency_judgment.reason, /no sufficiency judgment/);
  incidentRefuses(
    () => transition(w, 'VALIDATED', { reason: 'SYNTHETIC validation', evidence: 'test-only://ev', date: at(FP, 31), watch: endedWatch(w) }),
    'NOT_ELIGIBLE', /c5_sufficiency_judgment/,
  );
});

test('N-VAL (d) failing input: everything except independent verification (D2 role pending) — only c3 fails', () => {
  // Failing input: all VAL-1 elements except independent verification.
  const w = nearlyValidatedInc(5);
  const check = checkValidationEligibility(w, endedWatch(w));
  assert.equal(check.eligible, false);
  assert.deepEqual(check.failing, ['c3_independent_verification']);
  assert.match(check.elements.c3_independent_verification.reason, new RegExp(D2_NOT_SATISFIED.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  incidentRefuses(
    () => transition(w, 'VALIDATED', { reason: 'SYNTHETIC validation', evidence: 'test-only://ev', date: at(FP, 31), sufficiency_judgment: JUDGMENT, watch: endedWatch(w) }),
    'NOT_ELIGIBLE', /c3_independent_verification/,
  );
});

test('N-VAL (e) [AC-T6-5] failing input: non-empty exposure, but window end condition not reached (CR-01) — refused even with non-empty exposure', () => {
  // Failing input: the nearly-validated record, as of day 10 of the window.
  // "Nearly validated" here means in-window exposure + sufficiency judgment
  // recorded; independent verification is still missing (D2 role pending),
  // so this setup does NOT claim all elements are present — it establishes
  // the window-end refusal with non-empty exposure (fix round 1, F-T6-1
  // verdict note on AC-T6-5 wording).
  const w = nearlyValidatedInc(6);
  const mid = midWatch(w);
  assert.equal(mid.end_condition_reached, false, 'the window end must not be reached');
  const check = checkValidationEligibility(w, mid);
  assert.equal(check.eligible, false);
  assert.ok(check.failing.includes('a_window_end_reached'), `failing must name a_window_end_reached, got ${check.failing}`);
  assert.match(check.elements.a_window_end_reached.reason, /window end condition not reached/);
  // Exposure is genuinely non-empty mid-window — and still does not validate.
  assert.equal(check.elements.b_operational_exposure_in_window.satisfied, true);
  const outcome = watchOutcome(mid, exposureInWindow(mid, w.exposure_evidence_link), 0, true);
  assert.equal(outcome.outcome, 'continue-watch');
  assert.match(outcome.note, /end condition not reached/);
  incidentRefuses(
    () => transition(w, 'VALIDATED', { reason: 'SYNTHETIC validation', evidence: 'test-only://ev', date: at(FP, 10), sufficiency_judgment: JUDGMENT, watch: mid }),
    'NOT_ELIGIBLE', /a_window_end_reached/,
  );
});

test('N-VAL (f) failing input: exposure link that cannot be followed to specific evidence — empty pointer is excluded by T2 naming EVL-3', () => {
  // Failing input: the only exposure item has an empty pointer.
  const w = structuredClone(nearlyValidatedInc(7));
  const emptyItem = { pointer: '', timestamp: at(FP, 3), is_operational: true, kind: 'run-event' };
  w.exposure_evidence_link = [emptyItem];
  const end = endedWatch(w);
  const filtered = exposureInWindow(end, w.exposure_evidence_link);
  assert.equal(filtered.exposure.length, 0);
  assert.equal(filtered.excluded.length, 1);
  assert.match(filtered.excluded[0].reason, /link cannot be followed to specific evidence \(EVL-3\)/);
  const check = checkValidationEligibility(w, end);
  assert.equal(check.eligible, false);
  assert.ok(check.failing.includes('b_operational_exposure_in_window'));
  safetyRefuses(() => refuseUnverifiableEvidenceLink(emptyItem), 'UNVERIFIABLE_EVIDENCE_LINK', 'EVL-3');
});

test('N-VAL (f) failing input: general-but-nonempty pointer (whole repository / whole log file / directory / general claim) — T2 alone counts it, the thin check refuses it (S-T6-5 gap)', () => {
  // Failing inputs: pointers that name no specific record, event, commit,
  // test result, or log entry.
  const general = [
    'github.com/org/repo',
    'https://github.com/org/repo',
    'logs/',
    'logs/app.log',
    'exposure happened',
    'TODO',
    'fixtures/synthetic-evidence',
  ];
  for (const pointer of general) {
    // The fixture/synthetic pointer names EXP-2/EVL-2 instead of EVL-3; the
    // rest name EVL-3. Each is refused with the same code either way.
    safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer }), 'UNVERIFIABLE_EVIDENCE_LINK');
  }
  for (const pointer of ['github.com/org/repo', 'https://github.com/org/repo', 'logs/', 'logs/app.log', 'exposure happened', 'TODO']) {
    safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer }), 'UNVERIFIABLE_EVIDENCE_LINK', 'EVL-3');
  }
  // The gap, stated plainly: T2's exposure filter counts the whole-repo
  // pointer as in-window operational exposure (it checks only non-emptiness).
  const w = structuredClone(nearlyValidatedInc(8));
  const repoItem = { pointer: 'github.com/org/repo', timestamp: at(FP, 3), is_operational: true, kind: 'run-event' };
  const counted = exposureInWindow(endedWatch(w), [repoItem]);
  assert.equal(counted.exposure.length, 1, 'T2 counts a general pointer as exposure — the thin check is what refuses it');
  // The thin check closes only the shape cases it covers; it does not
  // rewire T2's exposure or eligibility path (fix round 1, F-T6-1).
  // Positive controls: pointers naming a specific item pass the thin check.
  for (const pointer of [
    'test-only://operational-shaped/3',
    'repo/commit/0123abcd',
    'tasks/INC-2026-001.json',
    'INC-2026-001.json',
    'logs/app.log:4521',
    'run/test-1#result',
    'report-2026-01-12.json',
    'https://example.com/logs/app.log?line=4521',
    'https://github.com/org/repo/commit/0123abcd',
    'https://github.com/org/repo/issues/123',
    'https://github.com/org/repo/blob/main/notes#L10',
  ]) {
    assert.equal(refuseUnverifiableEvidenceLink({ pointer }).verifiable, true, `${pointer} names a specific item`);
  }
});

test('N-VAL (f) failing input: general pointers with incidental markers — empty query/fragment, a view query/fragment, .git suffix, non-numeric colon suffix — refused (F-T6-1)', () => {
  // Failing inputs (Codex round 1, F-T6-1): each carries a marker the old
  // shape check mistook for specificity — an empty query, an empty fragment,
  // a query naming a repository view, a .git repository suffix, or a colon
  // suffix that is not a line/entry number. None names a specific record,
  // event, commit, test result, or log entry.
  const incidental = [
    'https://github.com/org/repo?',
    'https://github.com/org/repo#',
    'https://github.com/org/repo?tab=readme',
    'https://github.com/org/repo.git',
    'https://example.com/logs/app.log:garbage',
    'https://github.com/org/repo#readme',
    'https://github.com/org/repo?foo=bar',
  ];
  for (const pointer of incidental) {
    safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer }), 'UNVERIFIABLE_EVIDENCE_LINK', 'EVL-3');
  }
  // The reasons name the shape: a whole log file, a whole repository, a
  // repository view.
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/logs/app.log:garbage' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole log file');
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://github.com/org/repo.git' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository');
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://github.com/org/repo?tab=readme' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository or general location');
  // Positive controls for the same markers, validated: a query pair naming
  // a specific item, a line-anchor fragment, and a numeric colon suffix
  // each pass — the marker alone is not what passes; the selector is.
  assert.equal(refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/logs/app.log?line=4521' }).verifiable, true);
  assert.equal(refuseUnverifiableEvidenceLink({ pointer: 'https://github.com/org/repo/blob/main/notes#L10' }).verifiable, true);
  assert.equal(refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/logs/app.log:4521' }).verifiable, true);
  // Bare-host control: a pointer with no path and no selector is refused.
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'github.com' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'bare host');
});

test('N-VAL (f) failing input: query selector keys with a missing, empty, or malformed value — the key alone names nothing (F-T6-4)', () => {
  // Failing inputs (Codex round 2, F-T6-4): a recognized selector key with
  // no value, an empty value, or a value that does not match the selector's
  // expected shape. The round-1 hasSpecificQuery returned true for the key
  // alone, so every one of these passed as "specific" — none names an item.
  // QUERY VALUE RULES (S-T6-5): line/entry require a numeric value
  // (optionally a range); commit/sha require a hash-like or id-prefixed
  // value; id/record/event/test/run/task/incident/lesson require a
  // hash-like, numeric, or id-prefixed value.
  const badQueries = [
    'https://github.com/org/repo?line', // bare key, no value at all
    'https://github.com/org/repo?line=', // empty value
    'https://github.com/org/repo?line=garbage', // line value must be numeric
    'https://github.com/org/repo?line=0123abcd', // line value must be numeric, not hash-like
    'https://github.com/org/repo?entry=', // empty value
    'https://github.com/org/repo?entry=abc', // entry value must be numeric
    'https://github.com/org/repo?commit=', // empty value
    'https://github.com/org/repo?commit=garbage', // commit value must be hash-like or id-shaped
    'https://github.com/org/repo?sha=', // empty value
    'https://github.com/org/repo?id=', // empty value
    'https://github.com/org/repo?id=garbage', // id value must be hash-like, numeric, or id-shaped
    'https://github.com/org/repo?record=', // empty value
  ];
  for (const pointer of badQueries) {
    safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer }), 'UNVERIFIABLE_EVIDENCE_LINK', 'EVL-3');
  }
  // The reasons name the shape: a bare key / empty / malformed query is a
  // general location, not a specific item.
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://github.com/org/repo?line=garbage' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository or general location');
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://github.com/org/repo?commit=' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository or general location');
  // Positive controls for the same keys, validated values: the value — not
  // the key — is what names the item. A range is a numeric line value; a
  // second pair cannot rescue a bad first pair, but a valid pair anywhere
  // in the query does name an item.
  for (const pointer of [
    'https://github.com/org/repo?line=4521',
    'https://github.com/org/repo?line=4521-4530',
    'https://github.com/org/repo?entry=12',
    'https://github.com/org/repo?commit=0123abcd',
    'https://github.com/org/repo?sha=0123abcd',
    'https://github.com/org/repo?id=INC-2026-001',
    'https://github.com/org/repo?record=123',
    'https://github.com/org/repo?test=test-1',
    'https://github.com/org/repo?line=garbage&commit=0123abcd',
  ]) {
    assert.equal(refuseUnverifiableEvidenceLink({ pointer }).verifiable, true, `${pointer} names a specific item`);
  }
});

test('N-VAL (f) failing input: whole log file / whole repository with a specific-looking ancestor directory — a numeric ancestor never selects an entry within it (F-T6-5)', () => {
  // Failing inputs (Codex round 2, F-T6-5): the last segment is a whole log
  // file or a whole repository, and the only "specific" marker is an
  // ancestor directory. The round-1 ordering let itemSegments.some
  // (isSpecificSegment) pass on the numeric ancestor before the whole-log /
  // whole-repository refusal ran — https://example.com/2026/app.log is a
  // demonstrable regression against the deleted implementation, which
  // rejected a pointer ending in .log first. A numeric ancestor does not
  // select an entry within a whole log.
  const ancestorBypass = [
    'https://example.com/2026/app.log',
    'https://example.com/123/repo.git',
    'https://example.com/0123abcd/app.log', // hash-like ancestor is no selector either
    'https://example.com/INC-2026-001/repo.git', // id-prefixed ancestor is no selector either
  ];
  for (const pointer of ancestorBypass) {
    safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer }), 'UNVERIFIABLE_EVIDENCE_LINK', 'EVL-3');
  }
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/2026/app.log' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole log file');
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/123/repo.git' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository');
  // Positive controls: a genuinely selected entry inside a log still
  // passes — the whole-log refusal is escaped only by an actual item
  // selector within the file itself: a numeric :line suffix, a validated
  // query pair, or a fragment naming an entry. The same escape applies to
  // a whole repository with a commit selector naming a specific commit.
  for (const pointer of [
    'https://example.com/2026/app.log:4521',
    'https://example.com/2026/app.log?line=4521',
    'https://example.com/2026/app.log#L10',
    'https://example.com/123/repo.git?commit=0123abcd',
  ]) {
    assert.equal(refuseUnverifiableEvidenceLink({ pointer }).verifiable, true, `${pointer} names a specific entry within the file/repository`);
  }
  // The escape requires a VALIDATED selector: a malformed query value on a
  // whole log does not rescue it (F-T6-4 meets F-T6-5).
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/2026/app.log?line=garbage' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole log file');
  safetyRefuses(() => refuseUnverifiableEvidenceLink({ pointer: 'https://example.com/123/repo.git?commit=' }), 'UNVERIFIABLE_EVIDENCE_LINK', 'whole repository');
});

test('N-VAL guard: fixture evidence alone never validates (VAL-3)', () => {
  // Failing input: the only exposure item is synthetic/fixture evidence.
  const w = structuredClone(watchInc(9));
  w.exposure_evidence_link = [{ pointer: 'test-only://synthetic/3', timestamp: at(FP, 3), is_operational: true, kind: 'run-event', synthetic: true }];
  const filtered = exposureInWindow(endedWatch(w), w.exposure_evidence_link);
  assert.equal(filtered.exposure.length, 0);
  assert.match(filtered.excluded[0].reason, /synthetic or fixture evidence is never exposure/);
  const check = checkValidationEligibility(w, endedWatch(w), { sufficiency_judgment: JUDGMENT });
  assert.equal(check.eligible, false);
  assert.ok(check.failing.includes('b_operational_exposure_in_window'));
});

test('N-VAL (g) failing input: a corrected verdict recorded as a recurrence — annotateCorrectedVerdict must NOT increment recurrence_count (CR-03)', () => {
  // Failing input: corrected-verdict evidence offered where a recurrence
  // would increment the count. The count must stay 0 and the status WATCH.
  const w = watchInc(1);
  assert.equal(w.recurrence_count, 0);
  const annotated = annotateCorrectedVerdict(w, { corrected_verdict_evidence: correctedVerdict(), date: at(FP, 4) });
  assert.equal(annotated.recurrence_count, 0, 'a corrected verdict never increments recurrence_count');
  assert.equal(annotated.corrected_verdict_evidence.length, 1);
  assert.equal(annotated.status, 'WATCH');
  assert.equal(w.recurrence_count, 0, 'the input record is unchanged');
  // The same evidence offered as a recurrence transition is refused.
  incidentRefuses(
    () => transition(w, 'REOPENED', { reason: 'SYNTHETIC corrected verdict', evidence: 'test-only://corrected/1', date: at(FP, 4), corrected_verdict_evidence: correctedVerdict() }),
    'NOT_RECURRENCE', /not a recurrence/,
  );
});

test('N-VAL (g) control: a genuine further recurrence DOES increment recurrence_count', () => {
  // Control: the (g) refusal must not swallow genuine recurrences.
  const w = watchInc(2);
  const reopened = transition(w, 'REOPENED', { reason: 'SYNTHETIC recurrence', evidence: 'SYNTHETIC-occ-a', date: at(FP, 5), recurrence_evidence: recEv('a') });
  assert.equal(reopened.recurrence_count, 1);
  const further = recordFurtherRecurrence(reopened, { recurrence_evidence: recEv('b'), reason: 'SYNTHETIC recurrence', evidence: 'SYNTHETIC-occ-b', date: at(FP, 6) });
  assert.equal(further.recurrence_count, 2);
  assert.equal(further.recurrence_evidence.length, 2);
});

test('N-VAL (g) failing input: recurrence evidence offered to reopen a VALIDATED record — refused; a corrected verdict reopens it WITHOUT incrementing the count (CR-03)', () => {
  // Failing input: recurrence_evidence against a VALIDATED-status literal.
  const v = validatedStatusInc(3);
  assert.equal(v.recurrence_count, 0);
  incidentRefuses(
    () => transition(v, 'REOPENED', { reason: 'SYNTHETIC recurrence', evidence: 'SYNTHETIC-occ-a', date: at(FP, 33), recurrence_evidence: recEv('a') }),
    'INC3_NOT_OPERATIVE', /not operative/,
  );
  const reopened = transition(v, 'REOPENED', { reason: 'SYNTHETIC corrected verdict', evidence: 'test-only://corrected/1', date: at(FP, 33), corrected_verdict_evidence: correctedVerdict() });
  assert.equal(reopened.status, 'REOPENED');
  assert.equal(reopened.recurrence_count, 0, 'a corrected verdict never increments recurrence_count');
  assert.equal(reopened.corrected_verdict_evidence.length, 1);
});

// =====================================================================
// N-LES (a)–(e) — refuse validated-lesson creation (spec §14.2, §9, §12)
// =====================================================================

test('N-LES (a) failing input: validated lesson citing an incident in OPEN — refused', () => {
  // Failing input: source incident status OPEN.
  const source = openInc(1);
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput({ source_incident_id: 'INC-T6TEST-001' }),
      source: { kind: 'incident', record: source },
      watch: watchEnd(watchWindow(null, null, FP, RC, 'W-C', SIE02_UNQUALIFIED), [], SIE02_UNQUALIFIED, at(FP, 31)),
    }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'a_window_end_reached',
  );
});

test('N-LES (a) failing input: validated lesson citing an incident in FIXED — refused', () => {
  // Failing input: source incident status FIXED.
  const source = fixedInc(2);
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput({ source_incident_id: 'INC-T6TEST-002' }),
      source: { kind: 'incident', record: source },
      watch: watchEnd(watchWindow(null, null, FP, RC, 'W-C', SIE02_UNQUALIFIED), [], SIE02_UNQUALIFIED, at(FP, 31)),
    }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'a_window_end_reached',
  );
});

test('N-LES (a) failing input: validated lesson citing an incident in WATCH — refused naming validated_incident_status', () => {
  // Failing input: source incident status WATCH (not VALIDATED, LES-3).
  const source = watchInc(3);
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput({ source_incident_id: 'INC-T6TEST-003' }),
      source: { kind: 'incident', record: source },
      watch: endedWatch(source),
    }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'validated_incident_status',
  );
});

test('N-LES (b) failing input: validated lesson citing a staged lesson as source — refused (LES-5)', () => {
  // Failing input: the source is a staged lesson, by kind and by record.
  const staged = stageLesson(stagedInput());
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput(),
      source: { kind: 'staged-lesson', record: staged },
      watch: endedWatch(watchInc(3)),
    }),
    'STAGED_LESSON_SOURCE', 'never a staged lesson',
  );
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput(),
      source: { kind: 'incident', record: staged },
      watch: endedWatch(watchInc(3)),
    }),
    'STAGED_LESSON_SOURCE', 'never a staged lesson',
  );
});

test('N-LES (c) failing input: lesson of either kind with empty non_applicability — schema rejection (§9.2, CR-02 (c))', () => {
  // Failing input: empty non_applicability on a staged lesson.
  const stagedBad = checkLessonStructure(stagedInput({ non_applicability: '' }));
  assert.equal(stagedBad.valid, false);
  assert.ok(stagedBad.problems.some((p) => p.includes('non_applicability')), `problems must name non_applicability, got ${stagedBad.problems}`);
  assert.throws(() => stageLesson(stagedInput({ non_applicability: '' })), (e) => e instanceof LessonRefusal && /non_applicability/.test(e.message));
  // Failing input: empty non_applicability on a validated lesson.
  const validatedBad = checkLessonStructure(validatedLessonInput({ non_applicability: '   ' }));
  assert.equal(validatedBad.valid, false);
  assert.ok(validatedBad.problems.some((p) => p.includes('non_applicability')));
});

test('N-LES (d) failing input: staged-to-validated promotion — setting a staged record status to VALIDATED in place is refused; moving its entry to Section 1 is refused', () => {
  // Failing input: a staged record whose status is set to VALIDATED in place.
  const staged = stageLesson(stagedInput());
  assert.throws(() => { staged.status = 'VALIDATED'; }, TypeError, 'the staged record is deep-frozen; it cannot be upgraded in place');
  assert.equal(staged.status, 'UNVALIDATED-STAGED', 'the header status remains UNVALIDATED-STAGED forever (LES-4)');
  // The same staged lesson offered as a validated lesson is refused.
  lessonRefuses(
    () => createValidatedLesson({
      lesson: { ...staged },
      source: { kind: 'incident', record: watchInc(3) },
      watch: endedWatch(watchInc(3)),
    }),
    'WRONG_STATUS', 'never upgraded in place',
  );
  // Failing input: the staged record's entry moved to INDEX Section 1.
  const desc = { file: 'lessons/LES-2026-101.md', kind: 'lesson', record: staged };
  const inSection1 = checkIndex({ records: [desc], index: { sections: { 1: [{ id: 'LES-2026-101', file: 'lessons/LES-2026-101.md' }] } } });
  assert.equal(inSection1.consistent, false);
  assert.ok(inSection1.problems.some((p) => p.code === 'STAGED_IN_SECTION_1'), `problems must include STAGED_IN_SECTION_1, got ${JSON.stringify(inSection1.problems)}`);
  // Control: the same staged record in Section 4 is consistent.
  const inSection4 = checkIndex({ records: [desc], index: { sections: { 4: [{ id: 'LES-2026-101', file: 'lessons/LES-2026-101.md' }] } } });
  assert.equal(inSection4.consistent, true, JSON.stringify(inSection4.problems));
  // Annotation is not promotion: superseding annotates, the status stays staged.
  const annotated = annotateSuperseded(staged, 'LES-2026-102', { date: '2026-02-01' });
  assert.equal(annotated.status, 'UNVALIDATED-STAGED');
  assert.equal(staged.status, 'UNVALIDATED-STAGED');
});

test('N-LES (d) failing input: a staged record RELABELED to VALIDATED — mutable copy and reconstructed record, same id and provenance — is refused; the original remains staged (F-T6-3)', () => {
  // Failing input: the staged record relabeled VALIDATED while retaining its
  // identity (lesson_id LES-2026-101) and provenance. The old test only
  // proved rejection of an UNCHANGED staged input (WRONG_STATUS); this one
  // actually relabels it (Codex round 1, F-T6-3).
  const staged = stageLesson(stagedInput());
  const source = nearlyValidatedInc(3);
  const watch = endedWatch(source);
  // (1) A naive relabel — status flipped only, staged-only fields intact —
  // is refused at the structure: a VALIDATED record cannot carry the
  // staged-only validation_claim "NONE" / index_section, nor omit the
  // validated-only evidence_links / validation_reference.
  const naiveRelabel = { ...staged, status: 'VALIDATED' };
  assert.notEqual(naiveRelabel, staged, 'the relabel is a mutable copy, not the frozen original');
  lessonRefuses(
    () => createValidatedLesson({ lesson: naiveRelabel, source: { kind: 'incident', record: source }, watch }),
    'LESSON_STRUCTURE', 'validation_claim',
  );
  // (2) A fully-shaped relabeled copy — status VALIDATED, validated-only
  // fields supplied, staged-only fields cleared — reaches the substantive
  // refusal: its source incident is WATCH, not VALIDATED, so the Stage 3
  // final refusal (D2/LES-8) blocks it, naming validated_incident_status.
  const relabeledCopy = {
    ...staged,
    status: 'VALIDATED',
    validation_claim: undefined,
    index_section: undefined,
    evidence_links: [{ pointer: 'test-only://operational-shaped/3' }],
    validation_reference: { incident_id: 'INC-T6TEST-003', sufficiency_judgment: JUDGMENT },
  };
  lessonRefuses(
    () => createValidatedLesson({ lesson: relabeledCopy, source: { kind: 'incident', record: source }, watch }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'validated_incident_status',
  );
  // (3) A reconstructed record — a fresh literal with the same lesson_id and
  // provenance as the staged original, status VALIDATED — is refused the
  // same way. Freezing the returned object never covered this path.
  const reconstructed = {
    lesson_id: 'LES-2026-101', status: 'VALIDATED', source_incident_id: 'INC-T6TEST-003',
    lesson_statement: 'SYNTHETIC staged guidance. It applies in this narrow case.',
    applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y',
    review_date: '2026-06-01', provenance: PROV,
    evidence_links: [{ pointer: 'test-only://operational-shaped/3' }],
    validation_reference: { incident_id: 'INC-T6TEST-003', sufficiency_judgment: JUDGMENT },
    compounding_use: 'none',
  };
  lessonRefuses(
    () => createValidatedLesson({ lesson: reconstructed, source: { kind: 'incident', record: source }, watch }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'validated_incident_status',
  );
  // The original remains staged: relabeling a copy or reconstructing a
  // record never touches the staged original — identity and provenance
  // untouched, status UNVALIDATED-STAGED.
  assert.equal(staged.status, 'UNVALIDATED-STAGED', 'the original remains staged after every relabel attempt');
  assert.equal(staged.lesson_id, 'LES-2026-101');
  assert.deepEqual(staged.provenance, PROV);
});

test('N-LES (e) failing input: validated-lesson creation without the complete LES-3 validation reference — refused naming the missing elements (AC-T6-4)', () => {
  // Failing input: WATCH source with no exposure and no sufficiency judgment.
  const source = watchInc(3);
  lessonRefuses(
    () => createValidatedLesson({
      lesson: validatedLessonInput({ source_incident_id: 'INC-T6TEST-003' }),
      source: { kind: 'incident', record: source },
      watch: endedWatch(source),
    }),
    'INCOMPLETE_VALIDATION_REFERENCE', 'b_operational_exposure_in_window',
  );
  // The reference without a sufficiency judgment is also a judgment failure.
  const noJudgment = checkLessonJudgment(validatedLessonInput({ validation_reference: { incident_id: 'INC-T6TEST-003' } }));
  assert.equal(noJudgment.outcome, 'JUDGMENT_MISSING');
  assert.ok(noJudgment.missing.some((m) => m.includes('sufficiency_judgment')));
});

test('N-LES not refused [AC-T6-4]: legitimate staging under LES-2 stages successfully', () => {
  const staged = stageLesson(stagedInput());
  assert.equal(staged.status, 'UNVALIDATED-STAGED');
  assert.equal(staged.validation_claim, 'NONE');
  assert.equal(staged.index_section, 'unvalidated-staged');
  assert.equal(staged.citation_use, 'FORBIDDEN_AS_AUTHORITY');
  assert.equal(staged.counting, 'never');
  assert.equal(checkLessonStructure(staged).valid, true);
});

// =====================================================================
// N-HIST (a)–(c) — refuse seed validation (spec §14.2, §12 Section 5)
// =====================================================================

test('N-HIST (a) failing input: validation of a seed record citing only its already-merged historical fix — refused (SEED-01)', () => {
  // Failing input: SEED-01 "overnight-03 kill and recovery" + merged fix.
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[0], { kind: 'validate-by-fix', fix: { merged: true, reference: 'SYNTHETIC-merged-fix' } })),
    'SEED_FIX_NOT_VALIDATION', 'already-merged historical fix',
  );
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[0], { kind: 'validate-by-fix', fix: { merged: true, reference: 'SYNTHETIC-merged-fix' } })),
    'SEED_FIX_NOT_VALIDATION', 'no retroactive validation',
  );
});

test('N-HIST (a) failing input: every T5 seed record refuses validation by merged fix (SEED-01…SEED-10 + SEED-SHA)', () => {
  // Failing input: each seed descriptor + an already-merged historical fix.
  for (const seed of SEED_DESCRIPTORS) {
    safetyRefuses(
      () => refuseSeedValidation(seedAttempt(seed, { kind: 'validate-by-fix', fix: { merged: true } })),
      'SEED_FIX_NOT_VALIDATION', 'already-merged historical fix',
    );
  }
});

test('N-HIST (b) failing input: pre-record operational evidence offered as exposure — refused (SEED-02)', () => {
  // Failing input: SEED-02 "stale-checkout MODULE_NOT_FOUND" + evidence
  // flagged pre-record, and the same evidence by timestamp before recording.
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[1], {
      kind: 'validate-by-evidence',
      evidence: { pointer: 'test-only://operational-shaped/1', timestamp: at(RC, -5), kind: 'pre-record', pre_record: true },
      recorded_at: RC,
    })),
    'SEED_PRE_RECORD_EVIDENCE', 'pre-record',
  );
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[1], {
      kind: 'validate-by-evidence',
      evidence: { pointer: 'test-only://operational-shaped/1', timestamp: at(RC, -5) },
      recorded_at: RC,
    })),
    'SEED_PRE_RECORD_EVIDENCE', 'EXP-2',
  );
});

test('N-HIST (b) failing input: operational evidence offered as exposure for a seed record that has no watch window — refused (SEED-04)', () => {
  // Failing input: SEED-04 + operational evidence that is not pre-record.
  // A seed record is not an incident record, so no evidence can be exposure.
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[3], {
      kind: 'validate-by-evidence',
      evidence: { pointer: 'test-only://operational-shaped/1', timestamp: at(RC, 5), kind: 'operational' },
      recorded_at: RC,
    })),
    'SEED_NO_EXPOSURE', 'no watch window',
  );
});

test('N-HIST (c) failing input: in-place relabeling of a seed record to VALIDATED — refused (SEED-03)', () => {
  // Failing input: SEED-03 "wiring deletion contradiction" relabeled VALIDATED.
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[2], { kind: 'relabel-to-validated', target_status: 'VALIDATED' })),
    'SEED_NEVER_VALIDATED', 'never VALIDATED',
  );
  // T4 corroborates structurally: a seed record with status VALIDATED fails.
  const structural = checkRecordStructure({ file: 'seed/SEED-03.md', kind: 'seed', record: { seed_id: 'SEED-03', status: 'VALIDATED' } });
  assert.equal(structural.valid, false);
  assert.ok(structural.problems.some((p) => p.includes('never VALIDATED')));
});

test('N-HIST failing input: SEED-SHA (UNVERIFIED CANDIDATE) refuses validation as well', () => {
  // Failing input: SEED-SHA + an already-merged historical fix.
  safetyRefuses(
    () => refuseSeedValidation(seedAttempt(SEED_DESCRIPTORS[10], { kind: 'validate-by-fix', fix: { merged: true } })),
    'SEED_FIX_NOT_VALIDATION', 'already-merged historical fix',
  );
});

// =====================================================================
// N-REU (a)–(c) — refuse reuse (spec §14.2, §16 REU-1/REU-2)
// The legitimate-task-only assumption is marked in each test that relies on
// it (DV-7, C-19: "no prescribed reuse task" stays UNVERIFIED).
// =====================================================================

const stagedLessonForReuse = () => ({ lesson_id: 'LES-2026-101', status: 'UNVALIDATED-STAGED', applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y' });
const validatedLessonForReuse = () => ({ lesson_id: 'LES-2026-102', status: 'VALIDATED', applicability: 'SYNTHETIC: when X', non_applicability: 'SYNTHETIC: not when Y' });
const legitimateTask = () => ({ task_id: 'SYNTHETIC-task-1', legitimate: true });

test('N-REU (a) failing input: reuse claimed from a staged lesson — refused [legitimate-task-only assumption marked; DV-7/C-19]', () => {
  // Failing input: a staged lesson + a legitimate task + in-applicability.
  const r = refuseReuseClaim({ lesson: stagedLessonForReuse(), task: legitimateTask(), within_applicability: true });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.reuse_demonstrated, false);
  assert.match(r.reason, /staged lesson is never reuse evidence/);
  assert.equal(r.rule, 'N-REU (a)');
});

test('N-REU (b) failing input: reuse with no task — refused; there is no prescribed reuse task [REF, UNVERIFIED — DV-7, C-19]', () => {
  // Failing input: a validated lesson + no task at all.
  const r = refuseReuseClaim({ lesson: validatedLessonForReuse(), task: null, within_applicability: true });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.reuse_demonstrated, false);
  assert.match(r.reason, /no task is named/);
  assert.match(r.reason, /no prescribed reuse task/);
  assert.equal(r.rule, 'N-REU (b)');
});

test('N-REU (b) failing input: reuse from a manufactured task created to produce a reuse metric — refused [legitimate-task-only assumption marked; DV-7]', () => {
  // Failing input: a task created primarily to produce a reuse metric.
  const r = refuseReuseClaim({
    lesson: validatedLessonForReuse(),
    task: { task_id: 'SYNTHETIC-task-2', legitimate: true, created_to_produce_reuse_metric: true },
    within_applicability: true,
  });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.reuse_demonstrated, false);
  assert.match(r.reason, /not proof of organic learning/);
  assert.equal(r.rule, 'N-REU (b)');
});

test('N-REU (c) failing input: reuse outside the lesson applicability — refused [legitimate-task-only assumption marked]', () => {
  // Failing input: a validated lesson + legitimate task + outside applicability.
  const r = refuseReuseClaim({ lesson: validatedLessonForReuse(), task: legitimateTask(), within_applicability: false });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.reuse_demonstrated, false);
  assert.match(r.reason, /outside the lesson's applicability/);
  assert.match(r.reason, /not when Y/);
  assert.equal(r.rule, 'N-REU (c)');
  // Applicability never judged is also a refusal, not a pass (S-T6-7).
  const unjudged = refuseReuseClaim({ lesson: validatedLessonForReuse(), task: legitimateTask() });
  assert.equal(unjudged.outcome, 'REFUSED');
  assert.match(unjudged.reason, /not established/);
});

test('N-REU clean case: no refusal fires — and still NO reuse is demonstrated (F-36 OPEN, REU-2)', () => {
  // Control: the negative checks are necessary, not sufficient (S-T6-2).
  const r = refuseReuseClaim({ lesson: validatedLessonForReuse(), task: legitimateTask(), within_applicability: true });
  assert.equal(r.outcome, 'NO_REFUSAL');
  assert.equal(r.reuse_demonstrated, false, 'a clean negative check is not a reuse demonstration');
  assert.match(r.reason, /NOT a reuse demonstration/);
  assert.match(r.reason, /F-36/);
});

// =====================================================================
// N-EVAL — refuse / downgrade improvement claims (spec §14.2, §10 EVL)
// =====================================================================

test('N-EVAL failing input: improvement citing only a staged lesson — REFUSED', () => {
  const r = assessImprovementClaim({ kind: 'staged-lesson', lesson_id: 'LES-2026-101' });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.improvement_claim_supported, false);
  assert.equal(r.claim, 'no improvement claim supported');
  assert.match(r.reason, /staged lesson/);
  assert.match(r.reason, /forbidden/);
});

test('N-EVAL failing input: improvement citing only an unvalidated incident — DOWNGRADED to "no improvement claim supported"', () => {
  const r = assessImprovementClaim({ kind: 'unvalidated-incident', incident_id: 'INC-T6TEST-003' });
  assert.equal(r.outcome, 'DOWNGRADED');
  assert.equal(r.improvement_claim_supported, false);
  assert.equal(r.claim, 'no improvement claim supported');
  assert.match(r.reason, /unvalidated incident/);
});

test('N-EVAL failing input: improvement citing no lesson at all — REFUSED', () => {
  const r = assessImprovementClaim({ kind: 'none' });
  assert.equal(r.outcome, 'REFUSED');
  assert.equal(r.improvement_claim_supported, false);
  assert.equal(r.claim, 'no improvement claim supported');
  assert.match(r.reason, /no lesson at all/);
});

test('N-EVAL: REFUSED vs DOWNGRADED are distinct, and neither ever supports an improvement claim (S-T6-1, S-T6-8)', () => {
  const staged = assessImprovementClaim({ kind: 'staged-lesson', lesson_id: 'LES-2026-101' });
  const incident = assessImprovementClaim({ kind: 'unvalidated-incident', incident_id: 'INC-T6TEST-003' });
  const none = assessImprovementClaim({ kind: 'none' });
  assert.notEqual(staged.outcome, incident.outcome, 'staged-lesson (REFUSED) must differ from unvalidated-incident (DOWNGRADED)');
  assert.equal(none.outcome, 'REFUSED');
  for (const r of [staged, incident, none]) assert.equal(r.improvement_claim_supported, false);
  // Group C guard: a validated-lesson citation is refused, never passed (S-T6-8).
  const validated = assessImprovementClaim({ kind: 'validated-lesson', lesson_id: 'LES-2026-102' });
  assert.equal(validated.outcome, 'REFUSED');
  assert.equal(validated.improvement_claim_supported, false);
  assert.match(validated.reason, /Group C/);
});

// =====================================================================
// GOV (a)–(c) — governance refusal / hold (spec §14.2, §16 CMP-1)
// AC-T6-3: Founder approval is the ONLY pass path for governance-adjacent
// changes. Silence, delay, or unavailability is never approval (ADR-09).
// =====================================================================

test('GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: governance change without recorded Founder approval — HELD pending Founder decision', () => {
  const held = checkGovernanceChange({ kind: 'governance', founder_approval: null });
  assert.equal(held.outcome, 'HELD_PENDING_FOUNDER_DECISION');
  assert.equal(held.passes_gov_check, false);
  assert.equal(held.founder_approval, null);
  assert.match(held.reason, /Founder approval is the only pass path/);
  // The same change WITH recorded Founder approval passes, naming it.
  const passed = checkGovernanceChange({ kind: 'governance', founder_approval: FOUNDER_APPROVAL() });
  assert.equal(passed.outcome, 'PASS');
  assert.equal(passed.passes_gov_check, true);
  assert.equal(passed.founder_approval, 'SYNTHETIC-founder-approval-1');
});

test('GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: authorization, security-policy, and first-product changes without approval — HELD', () => {
  for (const kind of ['authorization', 'security-policy', 'first-product']) {
    const held = checkGovernanceChange({ kind, founder_approval: null });
    assert.equal(held.outcome, 'HELD_PENDING_FOUNDER_DECISION', `${kind} without approval must be held`);
    const passed = checkGovernanceChange({ kind, founder_approval: FOUNDER_APPROVAL() });
    assert.equal(passed.outcome, 'PASS', `${kind} with Founder approval must pass`);
  }
});

test('GOV (b) [AC-T6-3: Founder approval is the only pass path] failing input: change citing a validated lesson that expands autonomy / permissions / scope without approval — HELD', () => {
  for (const expand of ['expands_autonomy', 'expands_permissions', 'expands_scope']) {
    const held = checkGovernanceChange({ kind: 'compounding', cites_validated_lesson: true, [expand]: true, founder_approval: null });
    assert.equal(held.outcome, 'HELD_PENDING_FOUNDER_DECISION', `${expand} without approval must be held`);
    assert.match(held.reason, /citing a validated lesson/);
    const passed = checkGovernanceChange({ kind: 'compounding', cites_validated_lesson: true, [expand]: true, founder_approval: FOUNDER_APPROVAL() });
    assert.equal(passed.outcome, 'PASS');
  }
});

test('GOV (c) failing input: waiver or exception to a safety rule granted by a builder or verifier — REFUSED (never held, never passed)', () => {
  for (const grantedBy of ['builder', 'verifier']) {
    const r = checkGovernanceChange({ kind: 'waiver', granted_by: grantedBy, founder_approval: null });
    assert.equal(r.outcome, 'REFUSED', `a waiver granted by a ${grantedBy} must be refused`);
    assert.equal(r.passes_gov_check, false);
    assert.match(r.reason, /granted by a builder or verifier is void/);
  }
  // A waiver with a recorded Founder approval granted by the Founder passes (S-T6-9).
  const founderWaiver = checkGovernanceChange({ kind: 'waiver', granted_by: 'Founder', founder_approval: FOUNDER_APPROVAL() });
  assert.equal(founderWaiver.outcome, 'PASS');
});

test('GOV [AC-T6-3] approval date must be a valid YYYY-MM-DD calendar date — "1" and "2026-02-30" never pass (F-T6-2)', () => {
  // Failing inputs (Codex round 1, F-T6-2): Date.parse alone accepted the
  // non-date-shaped string "1" and normalized the impossible calendar date
  // "2026-02-30" (read as 2026-03-02). Both are rejected here, through
  // isRecordedFounderApproval AND through the GOV decision.
  for (const badDate of ['1', '2026-02-30', '2026-13-01', '2026-02-29', '2026-04-31', '11/06/2026', '', '   ', '20261106', 20261106, null]) {
    assert.equal(
      isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: badDate }),
      false, `date ${JSON.stringify(badDate)} must not be a valid approval date`,
    );
  }
  // Missing date is not a valid date either.
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-x' }), false);
  // Valid calendar dates pass, including a leap-day date in a leap year.
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: '2026-11-06' }), true);
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: '2024-02-29' }), true);
  // Through the GOV decision: a governance change whose approval carries an
  // invalid date is HELD, never passed; a waiver with one is REFUSED.
  for (const badDate of ['1', '2026-02-30']) {
    const held = checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: badDate } });
    assert.equal(held.outcome, 'HELD_PENDING_FOUNDER_DECISION', `governance change with date ${JSON.stringify(badDate)} must be held, not passed`);
    const refused = checkGovernanceChange({ kind: 'waiver', granted_by: 'Founder', founder_approval: { recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: badDate } });
    assert.equal(refused.outcome, 'REFUSED', `waiver with date ${JSON.stringify(badDate)} must be refused, not passed`);
  }
  // Through the GOV decision, valid dates pass — including the leap day.
  assert.equal(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: '2024-02-29' } }).outcome, 'PASS');
});

test('GOV [AC-T6-3] silence is never approval: missing, empty, ambiguous, or non-Founder approval is never a pass', () => {
  // Missing approval.
  assert.notEqual(checkGovernanceChange({ kind: 'governance', founder_approval: null }).outcome, 'PASS');
  assert.notEqual(checkGovernanceChange({ kind: 'governance' }).outcome, 'PASS');
  // Empty approval object.
  assert.notEqual(checkGovernanceChange({ kind: 'governance', founder_approval: {} }).outcome, 'PASS');
  // Ambiguous approval: by Founder but no reference.
  assert.notEqual(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'Founder', date: '2026-11-06' } }).outcome, 'PASS');
  // Ambiguous approval: reference but not recorded.
  assert.notEqual(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: false, by: 'Founder', reference: 'SYNTHETIC-x', date: '2026-11-06' } }).outcome, 'PASS');
  // Approval recorded by a builder, not the Founder.
  assert.notEqual(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'builder', reference: 'SYNTHETIC-x', date: '2026-11-06' } }).outcome, 'PASS');
  // Adversarial strictness (Codex round 1, F-T6-2 — kept, and now tested):
  // recorded === true rejects the string "yes"; by === 'Founder' rejects
  // lowercase "founder"; trimming rejects a whitespace-only reference.
  assert.equal(isRecordedFounderApproval({ recorded: 'yes', by: 'Founder', reference: 'SYNTHETIC-x', date: '2026-11-06' }), false, 'recorded: "yes" is not recorded: true');
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'founder', reference: 'SYNTHETIC-x', date: '2026-11-06' }), false, 'by: "founder" is not by: "Founder"');
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: '   ', date: '2026-11-06' }), false, 'a whitespace-only reference is not a reference');
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', date: '2026-11-06' }), false, 'a missing reference is not a reference');
  assert.equal(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: 'yes', by: 'Founder', reference: 'SYNTHETIC-x', date: '2026-11-06' } }).outcome, 'HELD_PENDING_FOUNDER_DECISION');
  assert.equal(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'founder', reference: 'SYNTHETIC-x', date: '2026-11-06' } }).outcome, 'HELD_PENDING_FOUNDER_DECISION');
  assert.equal(checkGovernanceChange({ kind: 'governance', founder_approval: { recorded: true, by: 'Founder', reference: '   ', date: '2026-11-06' } }).outcome, 'HELD_PENDING_FOUNDER_DECISION');
  // A bare granted_by claim is never a recorded approval (S-T6-9).
  assert.equal(isRecordedFounderApproval(null), false);
  assert.equal(isRecordedFounderApproval({}), false);
  assert.equal(isRecordedFounderApproval({ recorded: true, by: 'Founder', reference: 'SYNTHETIC-x', date: '2026-11-06' }), true);
  assert.equal(checkGovernanceChange({ kind: 'waiver', granted_by: 'Founder', founder_approval: null }).outcome, 'REFUSED');
});

test('GOV control: a routine non-governance change is NOT_GOVERNANCE_ADJACENT — held for nothing, and granted nothing', () => {
  const r = checkGovernanceChange({ kind: 'other' });
  assert.equal(r.outcome, 'NOT_GOVERNANCE_ADJACENT');
  assert.equal(r.passes_gov_check, false, 'NOT_GOVERNANCE_ADJACENT is not a pass of anything');
  assert.equal(r.founder_approval, null);
  // A compounding change with no governance-adjacent kind and no expansion is
  // still not approved by this check: CMP-1 forbids it separately.
  const compounding = checkGovernanceChange({ kind: 'compounding', cites_validated_lesson: true });
  assert.equal(compounding.outcome, 'NOT_GOVERNANCE_ADJACENT');
  assert.match(compounding.reason, /CMP-1/);
});

// =====================================================================
// Structural: the safety module is pure (no file I/O, no network)
// =====================================================================

test('structural: sie-safety.mjs is a pure module — no file I/O, no network; evidence level stated (EVL-7)', () => {
  assert.ok(!/readFileSync|writeFileSync|createReadStream|createWriteStream/.test(safetySource), 'no file I/O in the safety module');
  assert.ok(!/node:fs|node:http|node:https|fetch\(|XMLHttpRequest/.test(safetySource), 'no network in the safety module');
  assert.ok(!/process\.env/.test(safetySource), 'no environment/secret access in the safety module');
  assert.match(EVIDENCE_LEVEL, /Component/);
  assert.match(EVIDENCE_LEVEL, /Structural/);
  assert.match(EVIDENCE_LEVEL, /Nothing here is Operational or Outcome/);
  assert.match(LEGITIMATE_TASK_ASSUMPTION.prescribed_reuse_task, /UNVERIFIED/);
  assert.match(LEGITIMATE_TASK_ASSUMPTION.prescribed_reuse_task, /DV-7/);
});
