// Tests for SIE incident records, status machine, and watch computation
// (Stage 3 T2, AC-T2-1..AC-T2-5). All inputs are SYNTHETIC records built inline.
// A pass means "mechanism verified on synthetic input" (test mechanics verified
// on fixtures), not "system verified" and not validated learning. No incident
// reaches VALIDATED through the mechanism (VAL-6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STATES, RECORD_FIELDS, TRANSITIONS, READINGS, SIE02_UNQUALIFIED, D2_NOT_SATISFIED, DV3_MARKER, DEEPER_REVIEW_MARKER,
  EVENT_NOT_EVALUATED, IncidentRefusal, createIncident, validateRecord, transition, recordFurtherRecurrence,
  deeperReviewStatus, annotateCorrectedVerdict, promoteHypothesisToConclusion, recordValidationEvidence,
  evaluateRecurrence, evaluateRecordRecurrence, watchWindow, watchEnd, exposureInWindow, watchOutcome,
  extendByFullWindow, checkValidationEligibility, checkWatchConsistency,
} from './sie-incident.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'sie-incident.mjs'), 'utf8');

const RULE = SIE02_UNQUALIFIED;
const DAY = 24 * 60 * 60 * 1000;
const at = (base, days) => new Date(Date.parse(base) + days * DAY).toISOString();

const RC = '2026-01-10T00:00:00.000Z'; // SYNTHETIC record creation
const FP = '2026-01-12T00:00:00.000Z'; // SYNTHETIC fix presence (after record creation)

const fields = (over = {}) => ({
  incident_id: 'INC-SYNTHETIC-001',
  title: 'SYNTHETIC: task recorded blocked on the same blocker string',
  observed_facts: [{ fact: 'SYNTHETIC: task SYNTHETIC-a recorded blocker "SYNTHETIC-blocker"', source_pointer: 'tasks/SYNTHETIC-a.json' }],
  hypotheses: [{ id: 'H-1', text: 'SYNTHETIC hypothesis: prompt wording', author: 'SYNTHETIC-author', date: RC }],
  detector_rule: 'R1',
  candidate_record_id: 'CAND-R1-SYNTHETIC',
  record_creation_time: RC,
  provenance: { all: 'SYNTHETIC test input (T2 mechanics only)' },
  ...over,
});
const CREATION = { opened_by: 'SYNTHETIC-orchestrator', reason: 'SYNTHETIC: opened from a detector candidate for test mechanics' };

const openRec = () => createIncident(fields(), CREATION);
const fixedRec = () => transition(openRec(), 'FIXED', {
  reason: 'SYNTHETIC fix', evidence: 'SYNTHETIC-PR-1', date: at(RC, 1),
  fix_reference: 'SYNTHETIC-PR-1', fix_description: 'SYNTHETIC: changed prompt text in SYNTHETIC-file',
});
const windowC = () => watchWindow(null, null, FP, RC, 'W-C', RULE);
const watchRec = () => transition(fixedRec(), 'WATCH', {
  reason: 'SYNTHETIC fix present', evidence: 'SYNTHETIC-presence-1', date: FP,
  fix_presence_evidence: { pointer: 'SYNTHETIC-presence-1', time: FP }, watch_window: windowC(),
});

// SYNTHETIC test input shaped like operational evidence (is_operational: true),
// used only to exercise the filter's keep-branch. It is not operational
// evidence. Its pointer avoids the word the filter excludes on.
const opItem = (days, over = {}) => ({ pointer: `test-only://operational-shaped/${days}`, timestamp: at(FP, days), is_operational: true, kind: 'run-event', _label: 'SYNTHETIC', ...over });

const evidenceValues = (over = {}) => ({
  reproduction_evidence: { kind: 'reproduced-failure', pointer: 'SYNTHETIC-repro-1' },
  regression_test: { id: 'SYNTHETIC-test-1', before: { result: 'fail', pointer: 'SYNTHETIC-run-before' }, after: { result: 'pass', pointer: 'SYNTHETIC-run-after' } },
  independent_verification: { verifier: 'SYNTHETIC-verifier', method: 'SYNTHETIC', target: 'SYNTHETIC', verdict: 'SYNTHETIC' },
  exposure_evidence_link: [opItem(3)],
  ...over,
});
const withEvidence = (rec, over) => recordValidationEvidence(rec, evidenceValues(over), { reason: 'SYNTHETIC evidence', evidence: 'SYNTHETIC-ev', date: at(FP, 2) });
const JUDGMENT = { text: 'SYNTHETIC judgment text', by: 'SYNTHETIC-judge', date: at(FP, 31) };
const endedWatch = () => watchEnd(windowC(), [], RULE, at(FP, 31)); // day limit reached
const midWatch = () => watchEnd(windowC(), [], RULE, at(FP, 10)); // end not reached

const recEv = (task_id, over = {}) => ({ pointer: `SYNTHETIC-occ-${task_id}`, task_id, reason: 'SYNTHETIC recurrence', kind: 'blocker', key: 'SYNTHETIC-blocker', ...over });
const reopen = (rec, task_id) => transition(rec, 'REOPENED', { reason: 'SYNTHETIC recurrence', evidence: `SYNTHETIC-occ-${task_id}`, date: at(FP, 5), recurrence_evidence: recEv(task_id) });

// SYNTHETIC literal record in VALIDATED status, built by hand to exercise the
// VALIDATED -> REOPENED mechanics. It was NOT produced by the validation path
// (which refuses while D2 is pending) and is not a validation (VAL-6).
function syntheticValidatedLiteral() {
  const w = structuredClone(withEvidence(watchRec()));
  w.status = 'VALIDATED';
  w.sufficiency_judgment = JUDGMENT;
  w.history.push({ seq: w.history.length, type: 'transition', from: 'WATCH', to: 'VALIDATED', reason: 'SYNTHETIC hand-built literal, not a validation', evidence_pointer: 'SYNTHETIC', date: at(FP, 31) });
  return w;
}

const refuses = (fn, re) => assert.throws(fn, (e) => e instanceof IncidentRefusal && re.test(e.message));

// ---- AC-T2-1: status machine ----

test('AC-T2-1: states are exactly OPEN, FIXED, WATCH, VALIDATED, REOPENED; transition table matches §6.1', () => {
  assert.deepEqual([...STATES], ['OPEN', 'FIXED', 'WATCH', 'VALIDATED', 'REOPENED']);
  assert.deepEqual(JSON.parse(JSON.stringify(TRANSITIONS)), {
    OPEN: ['FIXED'], FIXED: ['WATCH', 'REOPENED'], WATCH: ['VALIDATED', 'REOPENED'], VALIDATED: ['REOPENED'], REOPENED: [],
  });
});

test('AC-T2-1: happy path OPEN -> FIXED -> WATCH, each with its evidence requirement', () => {
  const o = openRec();
  assert.equal(o.status, 'OPEN');
  const f = fixedRec();
  assert.equal(f.status, 'FIXED');
  assert.equal(f.fix_reference, 'SYNTHETIC-PR-1');
  const w = watchRec();
  assert.equal(w.status, 'WATCH');
  assert.equal(w.fix_presence_evidence.pointer, 'SYNTHETIC-presence-1');
  assert.equal(w.watch_start.reading, 'W-C');
  assert.equal(w.watch_start.label, 'PROVISIONAL');
  assert.equal(w.watch_start.time, FP);
  assert.deepEqual(w.history.map((h) => h.to), ['OPEN', 'FIXED', 'WATCH']);
});

test('AC-T2-1: REOPENED is reachable from FIXED, WATCH, and VALIDATED only', () => {
  assert.equal(reopen(fixedRec(), 'SYNTHETIC-b').status, 'REOPENED');
  assert.equal(reopen(watchRec(), 'SYNTHETIC-b').status, 'REOPENED');
  const v = transition(syntheticValidatedLiteral(), 'REOPENED', {
    reason: 'SYNTHETIC corrected verdict', evidence: 'SYNTHETIC-cv-1', date: at(FP, 40),
    corrected_verdict_evidence: { pointer: 'SYNTHETIC-cv-1', reason: 'SYNTHETIC: earlier conclusion invalidated' },
  });
  assert.equal(v.status, 'REOPENED');
});

test('AC-T2-1: OPEN -> REOPENED is refused, naming CR-03', () => {
  refuses(() => transition(openRec(), 'REOPENED', { reason: 'x', evidence: 'SYNTHETIC', date: RC, recurrence_evidence: recEv('SYNTHETIC-b') }), /OPEN -> REOPENED.*CR-03/);
});

test('AC-T2-1: every unlisted transition is refused, naming the attempted transition', () => {
  const recs = { OPEN: openRec(), FIXED: fixedRec(), WATCH: watchRec(), VALIDATED: syntheticValidatedLiteral(), REOPENED: reopen(fixedRec(), 'SYNTHETIC-b') };
  const opts = { reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: at(FP, 50) };
  for (const from of STATES) {
    for (const to of [...STATES, 'CLOSED']) {
      if (TRANSITIONS[from]?.includes(to) || (from === 'OPEN' && to === 'REOPENED')) continue;
      refuses(() => transition(recs[from], to, opts), new RegExp(`${from} -> ${to} refused: not a permitted transition`));
    }
  }
});

test('AC-T2-1: each transition is refused when its required evidence is missing', () => {
  const base = { reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: at(FP, 1) };
  refuses(() => transition(openRec(), 'FIXED', { ...base, fix_description: 'd' }), /missing fix_reference/);
  refuses(() => transition(openRec(), 'FIXED', { ...base, fix_reference: 'r' }), /missing fix_description/);
  refuses(() => transition(fixedRec(), 'WATCH', { ...base, watch_window: windowC() }), /missing fix_presence_evidence/);
  refuses(() => transition(fixedRec(), 'WATCH', { ...base, fix_presence_evidence: { pointer: 'p' } }), /missing watch_window/);
  // sufficiency judgment missing (everything else in place)
  assert.throws(() => transition(withEvidence(watchRec()), 'VALIDATED', { ...base, watch: endedWatch() }),
    (e) => e.details.failing.includes('c5_sufficiency_judgment'));
  refuses(() => transition(fixedRec(), 'REOPENED', base), /recurrence_evidence needs a specific evidence pointer/);
  refuses(() => transition(watchRec(), 'REOPENED', { ...base, recurrence_evidence: recEv('SYNTHETIC-b', { reason: '' }) }), /a stated reason/);
  refuses(() => transition(watchRec(), 'REOPENED', { ...base, recurrence_evidence: recEv('SYNTHETIC-b', { task_id: '' }) }), /task id/);
  refuses(() => transition(syntheticValidatedLiteral(), 'REOPENED', base), /corrected_verdict_evidence .* required/);
  refuses(() => transition(syntheticValidatedLiteral(), 'REOPENED', { ...base, corrected_verdict_evidence: { pointer: 'p' } }), /corrected_verdict_evidence .* required/);
});

test('AC-T2-1: a backward move without a stated reason or evidence pointer is refused', () => {
  const ev = { recurrence_evidence: recEv('SYNTHETIC-b'), date: at(FP, 5) };
  refuses(() => transition(watchRec(), 'REOPENED', { ...ev, evidence: 'SYNTHETIC' }), /stated reason is required/);
  refuses(() => transition(watchRec(), 'REOPENED', { ...ev, reason: 'SYNTHETIC' }), /evidence pointer is required/);
  refuses(() => transition(watchRec(), 'FIXED', { reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: at(FP, 5) }), /WATCH -> FIXED refused/);
});

test('AC-T2-1: OPEN -> FIXED forbids claiming validation or proven effectiveness', () => {
  const base = { reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: at(RC, 1), fix_reference: 'SYNTHETIC-PR', fix_description: 'd' };
  refuses(() => transition(openRec(), 'FIXED', { ...base, validated: true }), /FORBIDS claiming validation/);
  refuses(() => transition(openRec(), 'FIXED', { ...base, proven_effective: true }), /FORBIDS/);
  refuses(() => transition(openRec(), 'FIXED', { ...base, sufficiency_judgment: JUDGMENT }), /FORBIDS/);
  assert.equal(transition(openRec(), 'FIXED', base).status, 'FIXED'); // a merged PR moves to FIXED only
});

test('AC-T2-1: FIXED -> WATCH never assumes a start; a not-started window is recorded as such', () => {
  const missing = watchWindow(null, null, null, RC, 'W-C', RULE);
  const w = transition(fixedRec(), 'WATCH', {
    reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: FP, fix_presence_evidence: { pointer: 'SYNTHETIC-p' }, watch_window: missing,
  });
  assert.equal(w.watch_start.started, false);
  assert.equal(w.watch_start.time, null);
  assert.equal(w.watch_start.message, 'watch not started: missing fix-presence evidence');
});

// ---- AC-T2-2: no VALIDATED without a link, or before the window end ----

test('AC-T2-2: WATCH -> VALIDATED refused with an empty or missing exposure_evidence_link', () => {
  const opts = { reason: 'SYNTHETIC', evidence: 'SYNTHETIC', date: at(FP, 31), watch: endedWatch(), sufficiency_judgment: JUDGMENT };
  for (const rec of [watchRec(), withEvidence(watchRec(), { exposure_evidence_link: [] })]) {
    assert.throws(() => transition(rec, 'VALIDATED', opts), (e) => e.details.failing.includes('c6_exposure_evidence_link') && /c6_exposure_evidence_link: exposure_evidence_link is empty/.test(e.message));
  }
});

test('AC-T2-2: refused before the window end condition, even with every other element present (N-VAL (e))', () => {
  const rec = withEvidence(watchRec());
  const check = checkValidationEligibility(rec, midWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(check.eligible, false);
  assert.equal(check.elements.a_window_end_reached.satisfied, false);
  for (const k of ['b_operational_exposure_in_window', 'c1_reproduced_failure', 'c2_regression_test_fail_before_pass_after', 'c4_meaningful_exposure', 'c5_sufficiency_judgment', 'c6_exposure_evidence_link']) {
    assert.equal(check.elements[k].satisfied, true, k);
  }
  assert.throws(() => transition(rec, 'VALIDATED', { reason: 'S', evidence: 'S', date: at(FP, 10), watch: midWatch(), sufficiency_judgment: JUDGMENT }),
    (e) => e.code === 'NOT_ELIGIBLE' && /a_window_end_reached: window end condition not reached/.test(e.message));
});

test('AC-T2-2: refused when exposure is empty; refused on zero recurrence alone; refused on a merged PR alone', () => {
  const opts = { reason: 'S', evidence: 'S', date: at(FP, 31), watch: endedWatch(), sufficiency_judgment: JUDGMENT };
  // Exposure only outside the window: link non-empty, exposure empty.
  const outside = withEvidence(watchRec(), { exposure_evidence_link: [opItem(-5)] });
  assert.throws(() => transition(outside, 'VALIDATED', opts), (e) => e.details.failing.includes('b_operational_exposure_in_window') && e.details.failing.includes('c4_meaningful_exposure'));
  // Zero recurrence alone: recurrence_count 0, nothing else recorded.
  const zero = watchRec();
  assert.equal(zero.recurrence_count, 0);
  assert.throws(() => transition(zero, 'VALIDATED', { ...opts, sufficiency_judgment: undefined }), (e) => e.details.failing.length >= 6);
  // Merged PR alone: the only evidence is the fix reference (a PR).
  const prOnly = fixedRec();
  refuses(() => transition(prOnly, 'VALIDATED', opts), /FIXED -> VALIDATED refused/);
  assert.throws(() => transition(watchRec(), 'VALIDATED', { ...opts, sufficiency_judgment: undefined }), (e) => e.code === 'NOT_ELIGIBLE');
});

test('AC-T2-2: refused on fixture, synthetic, staged-lesson, merged-PR, or non-operational evidence as exposure', () => {
  const opts = { reason: 'S', evidence: 'S', date: at(FP, 31), watch: endedWatch(), sufficiency_judgment: JUDGMENT };
  const bad = [
    opItem(3, { kind: 'fixture' }), opItem(3, { kind: 'synthetic' }), opItem(3, { synthetic: true }),
    opItem(3, { pointer: 'scripts/fixtures/sie-SYNTHETIC/x.json' }), opItem(3, { kind: 'staged-lesson' }),
    opItem(3, { kind: 'merged-pr' }), opItem(3, { is_operational: undefined }), opItem(3, { is_operational: 'yes' }),
  ];
  for (const item of bad) {
    const rec = withEvidence(watchRec(), { exposure_evidence_link: [item] });
    assert.throws(() => transition(rec, 'VALIDATED', opts), (e) => e.details.failing.includes('b_operational_exposure_in_window'), JSON.stringify(item));
  }
});

test('AC-T2-2: DV-5 — a passing post-fix result without a failing-before result is refused', () => {
  const rec = withEvidence(watchRec(), { regression_test: { id: 'SYNTHETIC-t', after: { result: 'pass', pointer: 'SYNTHETIC-after' } } });
  const check = checkValidationEligibility(rec, endedWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(check.elements.c2_regression_test_fail_before_pass_after.satisfied, false);
  assert.match(check.elements.c2_regression_test_fail_before_pass_after.reason, /DV-5/);
  const failBeforeOnly = withEvidence(watchRec(), { regression_test: { id: 'SYNTHETIC-t', before: { result: 'fail', pointer: 'SYNTHETIC-b' } } });
  assert.equal(checkValidationEligibility(failBeforeOnly, endedWatch()).elements.c2_regression_test_fail_before_pass_after.satisfied, false);
});

test('AC-T2-2: DV-4 — a documented reproduction analysis without a reproduced failure is refused', () => {
  const rec = withEvidence(watchRec(), { reproduction_evidence: { kind: 'documented-analysis', pointer: 'SYNTHETIC-analysis', limit: 'SYNTHETIC' } });
  const check = checkValidationEligibility(rec, endedWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(check.elements.c1_reproduced_failure.satisfied, false);
  assert.match(check.elements.c1_reproduced_failure.reason, /DV-4/);
});

test('AC-T2-2: H4 — independent verification is NOT SATISFIED while D2 is pending; never labeled independently validated (N-VAL (d))', () => {
  const rec = withEvidence(watchRec());
  assert.equal(openRec().independent_verification, D2_NOT_SATISFIED);
  const check = checkValidationEligibility(rec, endedWatch(), { sufficiency_judgment: JUDGMENT });
  assert.deepEqual(check.failing, ['c3_independent_verification']);
  assert.match(check.elements.c3_independent_verification.reason, /NOT SATISFIED — D2 role pending/);
  assert.equal(check.independently_validated, false);
  assert.throws(() => transition(rec, 'VALIDATED', { reason: 'S', evidence: 'S', date: at(FP, 31), watch: endedWatch(), sufficiency_judgment: JUDGMENT }),
    (e) => e.code === 'NOT_ELIGIBLE' && /D2 role pending/.test(e.message));
});

test('AC-T2-2: DV-6 conjunctive — end reached and evidence present are both required; neither alone suffices', () => {
  const noEvidence = withEvidence(watchRec(), { exposure_evidence_link: [opItem(-1)] });
  const endOnly = checkValidationEligibility(noEvidence, endedWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(endOnly.elements.a_window_end_reached.satisfied, true);
  assert.equal(endOnly.elements.b_operational_exposure_in_window.satisfied, false);
  assert.equal(endOnly.eligible, false);
  const evidenceOnly = checkValidationEligibility(withEvidence(watchRec()), midWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(evidenceOnly.elements.a_window_end_reached.satisfied, false);
  assert.equal(evidenceOnly.elements.b_operational_exposure_in_window.satisfied, true);
  assert.equal(evidenceOnly.eligible, false);
  // watchOutcome: evidence mid-window never closes the watch early.
  const ex = exposureInWindow(midWatch(), [opItem(3)]);
  assert.equal(watchOutcome(midWatch(), ex, 0, true).outcome, 'continue-watch');
});

// F-T2-1 (fix round 1): the supplied watch must be the record's recorded
// watch_window (W-C, start FP, record creation RC, RULE) or a WAT-5 extension of it.
const assertWindowRefused = (watch, field) => {
  const rec = withEvidence(watchRec());
  const check = checkValidationEligibility(rec, watch, { sufficiency_judgment: JUDGMENT });
  assert.equal(check.eligible, false);
  assert.equal(check.watch_consistency.consistent, false);
  const a = check.elements.a_window_end_reached;
  assert.equal(a.satisfied, false, field);
  assert.match(a.reason, /inconsistent with the recorded watch_window/);
  assert.ok(a.mismatches.some((m) => m.startsWith(field)), `${field}: ${a.mismatches.join('; ')}`);
  // no exposure is filtered through a mismatched watch
  assert.equal(check.elements.b_operational_exposure_in_window.satisfied, false);
  assert.match(check.elements.b_operational_exposure_in_window.reason, /not assessed/);
  assert.throws(() => transition(rec, 'VALIDATED', { reason: 'S', evidence: 'S', date: at(FP, 40), watch, sufficiency_judgment: JUDGMENT }),
    (e) => e.code === 'NOT_ELIGIBLE' && e.details.failing.includes('a_window_end_reached') && e.message.includes(`a_window_end_reached: supplied watch computation is inconsistent`) && e.message.includes(field));
};

test('AC-T2-2 / F-T2-1: a watch for a different window (different start/end) does not satisfy the end condition', () => {
  // Same reading and rule, but a window starting a day earlier (fix presence at FP - 1 day).
  const other = watchEnd(watchWindow(null, null, at(FP, -1), RC, 'W-C', RULE), [], RULE, at(FP, 30));
  assert.equal(other.end_condition_reached, true); // reached for ITS window, not the recorded one
  assertWindowRefused(other, 'start');
  // A hand-shifted "extension" that does not start at the recorded window's end.
  const shifted = { ...extendByFullWindow(watchEnd(windowC(), [], RULE, at(FP, 31))), start: at(FP, 25) };
  assertWindowRefused(watchEnd(shifted, [], RULE, at(FP, 60)), 'start');
});

test('AC-T2-2 / F-T2-1: a watch under a different reading does not satisfy the end condition (Codex counterexample)', () => {
  // Recorded: W-C from Jan 12 (ends Feb 11). Supplied: W-A from Jan 1 (ends Jan 31), as of Feb 1.
  const wa = watchEnd(watchWindow('2026-01-01T00:00:00.000Z', null, null, RC, 'W-A', RULE), [], RULE, '2026-02-01T00:00:00.000Z');
  assert.equal(wa.end_condition_reached, true);
  assertWindowRefused(wa, 'reading');
  // January 15 exposure is not smuggled in through the supplied window.
  const rec = withEvidence(watchRec(), { exposure_evidence_link: [opItem(3)] });
  assert.equal(checkValidationEligibility(rec, wa).elements.b_operational_exposure_in_window.satisfied, false);
});

test('AC-T2-2 / F-T2-1: a watch under a different counting rule does not satisfy the end condition', () => {
  const rule2 = 'SYNTHETIC alternative counting rule';
  assertWindowRefused(watchEnd(watchWindow(null, null, FP, RC, 'W-C', rule2), [], rule2, at(FP, 31)), 'counting_rule');
});

test('AC-T2-2 / F-T2-1: a watch with a different record-creation time does not satisfy the end condition', () => {
  // Start is still FP (MAX(FP, RC - 1 day)); only the record-creation time differs.
  const w = watchEnd(watchWindow(null, null, FP, at(RC, -1), 'W-C', RULE), [], RULE, at(FP, 31));
  assert.equal(w.start, FP);
  assertWindowRefused(w, 'record_creation_time');
});

test('AC-T2-2 / F-T2-1: a premature supplied end does not satisfy the end condition', () => {
  // Mid-window watch relabeled as ended.
  assertWindowRefused({ ...midWatch(), end_condition_reached: true }, 'end_condition_reached');
  // End time moved before the recorded window's day limit with no task limit.
  assertWindowRefused({ ...midWatch(), end_time: at(FP, 9), end_condition_reached: true }, 'end_time');
  // A task limit claimed without 10 tasks counted.
  assertWindowRefused({ ...midWatch(), task_limit: at(FP, 9), end_time: at(FP, 9), end_condition_reached: true }, 'task_limit');
  // The honest mid-window watch is consistent and simply not reached.
  const honest = checkValidationEligibility(withEvidence(watchRec()), midWatch(), { sufficiency_judgment: JUDGMENT });
  assert.equal(honest.watch_consistency.consistent, true);
  assert.match(honest.elements.a_window_end_reached.reason, /window end condition not reached/);
});

test('AC-T2-2 / F-T2-1: a legitimate full-window extension of the recorded window is consistent; its end is judged on its own merits', () => {
  const rec = withEvidence(watchRec(), { exposure_evidence_link: [opItem(35)] });
  assert.deepEqual(checkWatchConsistency(rec, endedWatch()), { consistent: true, mismatches: [] });
  const second = extendByFullWindow(endedWatch());
  // Mid second window: consistent, end not reached.
  const mid2 = checkValidationEligibility(rec, watchEnd(second, [], RULE, at(FP, 45)), { sufficiency_judgment: JUDGMENT });
  assert.equal(mid2.watch_consistency.consistent, true);
  assert.equal(mid2.elements.a_window_end_reached.satisfied, false);
  assert.match(mid2.elements.a_window_end_reached.reason, /window end condition not reached/);
  // Second window ended: consistent, end reached, in-window exposure counted; only D2 (c3) fails.
  const end2 = watchEnd(second, [], RULE, at(FP, 61));
  const ok = checkValidationEligibility(rec, end2, { sufficiency_judgment: JUDGMENT });
  assert.equal(ok.watch_consistency.consistent, true);
  assert.equal(ok.elements.a_window_end_reached.satisfied, true);
  assert.equal(ok.elements.b_operational_exposure_in_window.satisfied, true);
  assert.deepEqual(ok.failing, ['c3_independent_verification']);
  // A third window chained from the second is also consistent.
  const third = watchEnd(extendByFullWindow(end2), [], RULE, at(FP, 91));
  assert.equal(third.window_number, 3);
  assert.equal(checkWatchConsistency(rec, third).consistent, true);
  // An extension whose lineage is stripped is refused.
  const { prior_windows: _drop, ...stripped } = end2;
  assert.equal(checkWatchConsistency(rec, stripped).consistent, false);
});

test('AC-T2-2 / VAL-6: no path reaches VALIDATED on SYNTHETIC input; an in-place upgrade is refused', () => {
  const rec = withEvidence(watchRec());
  assert.throws(() => { rec.status = 'VALIDATED'; }, TypeError); // records are frozen
  const upgraded = { ...structuredClone(rec), status: 'VALIDATED' };
  refuses(() => transition(upgraded, 'REOPENED', { reason: 'S', evidence: 'S', date: at(FP, 40), corrected_verdict_evidence: { pointer: 'p', reason: 'r' } }), /upgrade in place refused/);
  assert.equal(checkValidationEligibility(upgraded, endedWatch()).verdict, null);
});

test('VAL-1: eligibility check names every element and carries the DV-3 NOT ENFORCED marker, never a satisfied claim', () => {
  const check = checkValidationEligibility(withEvidence(watchRec()), endedWatch(), { sufficiency_judgment: JUDGMENT });
  assert.deepEqual(Object.keys(check.elements), [
    'a_window_end_reached', 'b_operational_exposure_in_window', 'c1_reproduced_failure', 'c2_regression_test_fail_before_pass_after',
    'c3_independent_verification', 'c4_meaningful_exposure', 'c5_sufficiency_judgment', 'c6_exposure_evidence_link',
  ]);
  assert.equal(check.dv3.meaningful_exposure_wp04_two_user_condition, 'NOT ENFORCED — C-16 OPEN');
  assert.equal(check.elements.c4_meaningful_exposure.dv3, DV3_MARKER);
  assert.ok(!JSON.stringify(check.dv3).includes('"satisfied":true'));
  assert.match(source, /VAL-6 \[DECIDED\]: NO INCIDENT REACHES VALIDATED IN STAGE 3/);
});

// ---- AC-T2-3: recurrence vs corrected-verdict evidence ----

test('AC-T2-3: recurrence evidence increments recurrence_count and is stored in recurrence_evidence', () => {
  const r = reopen(watchRec(), 'SYNTHETIC-b');
  assert.equal(r.recurrence_count, 1);
  assert.equal(r.recurrence_evidence.length, 1);
  assert.equal(r.recurrence_evidence[0].task_id, 'SYNTHETIC-b');
  assert.deepEqual(r.corrected_verdict_evidence, []);
});

test('AC-T2-3: a corrected verdict on FIXED/WATCH is an annotation — no recurrence, no status change, no increment', () => {
  for (const rec of [fixedRec(), watchRec()]) {
    const a = annotateCorrectedVerdict(rec, { corrected_verdict_evidence: { pointer: 'SYNTHETIC-cv', reason: 'SYNTHETIC' }, date: at(FP, 4) });
    assert.equal(a.status, rec.status);
    assert.equal(a.recurrence_count, 0);
    assert.deepEqual(a.recurrence_evidence, []);
    assert.equal(a.corrected_verdict_evidence.length, 1);
    assert.equal(a.history.at(-1).type, 'annotation');
    assert.equal(a.history.at(-1).to, undefined);
  }
  // Supplied to a FIXED/WATCH -> REOPENED transition, it is refused (N-VAL (g)).
  refuses(() => transition(watchRec(), 'REOPENED', { reason: 'S', evidence: 'S', date: at(FP, 4), corrected_verdict_evidence: { pointer: 'p', reason: 'r' } }), /annotation, not a recurrence/);
});

test('AC-T2-3: VALIDATED -> REOPENED on recurrence evidence alone is refused (INC-3)', () => {
  refuses(() => transition(syntheticValidatedLiteral(), 'REOPENED', { reason: 'S', evidence: 'S', date: at(FP, 40), recurrence_evidence: recEv('SYNTHETIC-b') }), /INC-3/);
  refuses(() => recordFurtherRecurrence(syntheticValidatedLiteral(), { recurrence_evidence: recEv('SYNTHETIC-b'), reason: 'S', evidence: 'S', date: at(FP, 40) }), /INC-3/);
});

test('AC-T2-3: VALIDATED -> REOPENED on corrected-verdict evidence keeps the prior VALIDATED status, annotated superseded, with no increment', () => {
  const lit = syntheticValidatedLiteral();
  const r = transition(lit, 'REOPENED', {
    reason: 'SYNTHETIC: earlier verdict invalidated', evidence: 'SYNTHETIC-cv-1', date: at(FP, 40),
    corrected_verdict_evidence: { pointer: 'SYNTHETIC-cv-1', reason: 'SYNTHETIC' },
  });
  assert.equal(r.recurrence_count, 0);
  assert.deepEqual(r.recurrence_evidence, []);
  assert.equal(r.corrected_verdict_evidence.length, 1);
  assert.deepEqual(r.history.slice(0, lit.history.length), lit.history); // VALIDATED entry preserved
  const last = r.history.at(-1);
  assert.deepEqual(last.supersedes, { history_seq: lit.history.length - 1, status: 'VALIDATED', annotation: 'SUPERSEDED', reason: 'SYNTHETIC: earlier verdict invalidated' });
  assert.equal(evaluateRecordRecurrence(r, { task_id: 'SYNTHETIC-a', kind: 'blocker', key: 'SYNTHETIC-blocker' }).recurrence_exists, false);
});

// ---- AC-T2-4: watch computation ----

test('AC-T2-4: every watch computation names the reading and counting rule and is PROVISIONAL, never final', () => {
  const results = [];
  for (const reading of READINGS) {
    const w = watchWindow(RC, at(RC, 1), FP, RC, reading, RULE);
    const e = watchEnd(w, [], RULE, at(FP, 40));
    const x = exposureInWindow(e, [opItem(3)]);
    results.push(w, e, x, watchOutcome(e, x, 0, false), watchOutcome(e, x, 2, false), extendByFullWindow(e));
  }
  results.push(watchWindow(null, null, null, null, 'W-A', RULE));
  for (const r of results) {
    assert.ok(READINGS.includes(r.reading));
    assert.equal(r.counting_rule, RULE);
    assert.equal(r.provisional, true);
    assert.equal(r.label, 'PROVISIONAL');
    assert.deepEqual(r.undecided, ['H5', 'SIE-02']);
    assert.ok(!/final/i.test(JSON.stringify(r)));
  }
  assert.ok(!/provisional:\s*false/.test(source));
  assert.ok(!/'FINAL'|"FINAL"/i.test(source));
});

test('AC-T2-4: the reading and the counting rule must be named', () => {
  refuses(() => watchWindow(RC, null, FP, RC, undefined, RULE), /reading must be named/);
  refuses(() => watchWindow(RC, null, FP, RC, 'W-D', RULE), /reading must be named/);
  refuses(() => watchWindow(RC, null, FP, RC, 'W-A', ''), /counting rule must be named/);
  refuses(() => watchEnd(windowC(), [], 'another-rule'), /counted under/);
  refuses(() => exposureInWindow({ started: true, start: FP }, []), /does not name its reading/);
});

test('AC-T2-4: W-A, W-B, W-C starts; W-C = MAX(fix presence, record creation) with the §7.2 boundary cases', () => {
  assert.equal(watchWindow(at(RC, 3), null, null, RC, 'W-A', RULE).start, at(RC, 3));
  assert.equal(watchWindow(null, at(RC, 4), null, RC, 'W-B', RULE).start, at(RC, 4));
  // (a) fix present before the record was created: start at record creation
  assert.equal(watchWindow(null, null, at(RC, -5), RC, 'W-C', RULE).start, RC);
  // (b) record created before the fix was present: start at fix presence
  assert.equal(watchWindow(null, null, FP, RC, 'W-C', RULE).start, FP);
});

test('AC-T2-4: missing start evidence returns "watch not started: missing <named> evidence", never an assumed start', () => {
  const cases = [
    [watchWindow(null, at(RC, 1), FP, RC, 'W-A', RULE), 'watch not started: missing fix-merge evidence'],
    [watchWindow(RC, null, FP, RC, 'W-B', RULE), 'watch not started: missing first-post-merge-CI evidence'],
    [watchWindow(RC, RC, null, RC, 'W-C', RULE), 'watch not started: missing fix-presence evidence'],
    [watchWindow(RC, RC, FP, null, 'W-C', RULE), 'watch not started: missing record-creation evidence'],
    [watchWindow(RC, RC, 'not-a-date', '', 'W-C', RULE), 'watch not started: missing fix-presence and record-creation evidence'],
  ];
  for (const [w, msg] of cases) {
    assert.equal(w.started, false);
    assert.equal(w.start, null);
    assert.equal(w.message, msg);
    const e = watchEnd(w, [], RULE, at(FP, 100));
    assert.equal(e.end_time, null);
    assert.equal(e.end_condition_reached, false);
  }
});

test('AC-T2-4: watch end = MIN(30-day limit, 10th-task timestamp)', () => {
  const w = windowC();
  // fewer than 10 tasks: the day limit governs
  const few = watchEnd(w, Array.from({ length: 9 }, (_, i) => ({ task_id: `SYNTHETIC-t${i}`, observed_at: at(FP, i + 1) })), RULE, at(FP, 31));
  assert.equal(few.task_limit, null);
  assert.equal(few.end_time, at(FP, 30));
  assert.match(few.governed_by, /^day_limit/);
  assert.equal(few.end_condition_reached, true);
  // 10th task before 30 days: the task limit governs; duplicates and pre-start tasks are not counted
  const seq = [{ task_id: 'SYNTHETIC-pre', observed_at: at(FP, -1) }, { task_id: 'SYNTHETIC-t0', observed_at: at(FP, 0.5) }];
  for (let i = 0; i < 10; i += 1) seq.push({ task_id: `SYNTHETIC-t${i}`, observed_at: at(FP, i + 1) });
  const ten = watchEnd(w, seq, RULE, at(FP, 12));
  assert.equal(ten.task_limit, at(FP, 10));
  assert.equal(ten.end_time, at(FP, 10));
  assert.equal(ten.governed_by, 'task_limit');
  assert.equal(ten.end_condition_reached, true);
  // 10th task after 30 days: the day limit governs
  const late = watchEnd(w, Array.from({ length: 10 }, (_, i) => ({ task_id: `SYNTHETIC-t${i}`, observed_at: at(FP, 25 + i) })), RULE, at(FP, 40));
  assert.equal(late.end_time, at(FP, 30));
  assert.equal(late.governed_by, 'day_limit');
  // end is never assumed reached without an as-of instant
  assert.equal(watchEnd(w, [], RULE).end_condition_reached, false);
  assert.equal(watchEnd(w, [], RULE, at(FP, 29)).end_condition_reached, false);
});

test('AC-T2-4: exposure counts in-window operational evidence only; excludes fixture, synthetic, pre-window, pre-record, non-operational, record creation', () => {
  const e = watchEnd(windowC(), [], RULE, at(FP, 31));
  const keep = opItem(3);
  const items = [
    keep,
    opItem(3, { kind: 'record-creation' }),
    opItem(3, { kind: 'fixture' }),
    opItem(3, { synthetic: true }),
    opItem(-1),
    opItem(31),
    opItem(3, { is_operational: undefined }),
    opItem(3, { pointer: '' }),
    opItem(3, { timestamp: 'never' }),
  ];
  const x = exposureInWindow(e, items);
  assert.deepEqual(x.exposure, [keep]);
  assert.equal(x.excluded.length, items.length - 1);
  assert.equal(x.dv3, DV3_MARKER);
  // Under W-A the window may start before record creation: pre-record evidence is still excluded (EXP-2).
  const wa = watchEnd(watchWindow(at(RC, -10), null, null, RC, 'W-A', RULE), [], RULE, at(RC, 30));
  const preRecord = { ...opItem(0), timestamp: at(RC, -2) };
  const r = exposureInWindow(wa, [preRecord]);
  assert.deepEqual(r.exposure, []);
  assert.match(r.excluded[0].reason, /pre-record/);
});

test('AC-T2-4: watchOutcome follows the §7.1 order exactly', () => {
  const ended = endedWatch();
  const ex = exposureInWindow(ended, [opItem(3)]);
  const none = exposureInWindow(ended, []);
  assert.equal(watchOutcome(ended, ex, 2, true).outcome, 'mandatory-deeper-review');
  assert.equal(watchOutcome(midWatch(), ex, 1, true).outcome, 'continue-watch');
  assert.equal(watchOutcome(ended, none, 0, true).outcome, 'extend-by-full-window');
  const elig = watchOutcome(ended, ex, 0, true);
  assert.equal(elig.outcome, 'eligible-for-validation-judgment');
  assert.match(elig.note, /eligibility is not validation/);
  assert.equal(watchOutcome(ended, ex, 0, false).outcome, 'continue-watch');
  assert.equal(watchOutcome(ended, ex, 0, 'yes').outcome, 'continue-watch');
});

test('AC-T2-4 / WAT-5: extension is a full window from the previous end; tests are re-applied', () => {
  const ended = endedWatch();
  const next = extendByFullWindow(ended);
  assert.equal(next.start, ended.end_time);
  assert.equal(next.window_number, 2);
  const e2 = watchEnd(next, [], RULE, at(FP, 45));
  assert.equal(e2.end_time, at(FP, 60));
  assert.equal(e2.end_condition_reached, false);
  assert.deepEqual(exposureInWindow(e2, [opItem(3)]).exposure, []); // first-window evidence is pre-window now
  refuses(() => extendByFullWindow(midWatch()), /not reached its end condition/);
});

// ---- AC-T2-5: second-recurrence trigger ----

test('AC-T2-5: recurrence_count >= 2 sets the mandatory-deeper-review marker; a first recurrence does not', () => {
  const first = reopen(watchRec(), 'SYNTHETIC-b');
  assert.equal(first.recurrence_count, 1);
  assert.equal(deeperReviewStatus(first).mandatory_deeper_review, false);
  assert.equal(watchOutcome(endedWatch(), [], 1, false).outcome, 'extend-by-full-window');
  const second = recordFurtherRecurrence(first, { recurrence_evidence: recEv('SYNTHETIC-c'), reason: 'SYNTHETIC second occurrence', evidence: 'SYNTHETIC-occ-c', date: at(FP, 8) });
  assert.equal(second.recurrence_count, 2);
  assert.equal(second.status, 'REOPENED');
  const s = deeperReviewStatus(second);
  assert.equal(s.mandatory_deeper_review, true);
  assert.equal(s.marker.triggered_at_recurrence_count, 2);
  assert.equal(watchOutcome(endedWatch(), [], 2, false).outcome, 'mandatory-deeper-review');
});

test('AC-T2-5: the marker carries no procedure contents, conductor, or outcome (SIE-07 OPEN)', () => {
  assert.deepEqual(Object.keys(DEEPER_REVIEW_MARKER).sort(), ['effect', 'mandatory_deeper_review', 'procedure', 'rule', 'threshold']);
  assert.match(DEEPER_REVIEW_MARKER.procedure, /OPEN — SIE-07/);
  assert.match(DEEPER_REVIEW_MARKER.threshold, /DV-9/);
  for (const k of ['conductor', 'outcome', 'steps', 'reviewer', 'decision']) assert.ok(!(k in DEEPER_REVIEW_MARKER), k);
});

test('recordFurtherRecurrence: only on REOPENED; FIXED/WATCH must reopen; OPEN has no post-fix occurrence', () => {
  const opts = { recurrence_evidence: recEv('SYNTHETIC-c'), reason: 'S', evidence: 'S', date: at(FP, 8) };
  refuses(() => recordFurtherRecurrence(watchRec(), opts), /use transition/);
  refuses(() => recordFurtherRecurrence(openRec(), opts), /no post-fix occurrence/);
  refuses(() => recordFurtherRecurrence(reopen(fixedRec(), 'SYNTHETIC-b'), { ...opts, reason: '' }), /stated reason/);
});

// ---- DV-9 counting ----

const original = { original: true, task_id: 'SYNTHETIC-a', kind: 'blocker', key: 'SYNTHETIC-blocker', pointer: 'SYNTHETIC-orig' };

test('DV-9: original + one occurrence in a DIFFERENT task -> recurrence exists', () => {
  const r = evaluateRecurrence([original, recEv('SYNTHETIC-b')]);
  assert.equal(r.recorded_occurrences, 2);
  assert.equal(r.distinct_tasks, 2);
  assert.equal(r.cross_task_condition_holds, true);
  assert.equal(r.recurrence_exists, true);
  assert.equal(r.zero_recurrence_claim_blocked, true);
});

test('DV-9: two occurrences in the SAME task -> no WP-04 recurrence, but "zero recurrence" is blocked and REOPENED is still supported', () => {
  const r = evaluateRecurrence([original, recEv('SYNTHETIC-a')]);
  assert.equal(r.recorded_occurrences, 2);
  assert.equal(r.distinct_tasks, 1);
  assert.equal(r.cross_task_condition_holds, false);
  assert.equal(r.recurrence_exists, false);
  assert.equal(r.zero_recurrence_claim_blocked, true);
  const reopened = reopen(watchRec(), 'SYNTHETIC-a'); // same task as the original
  assert.equal(reopened.status, 'REOPENED');
  assert.equal(reopened.recurrence_count, 1);
});

test('DV-9: no post-fix occurrence -> no recurrence and the zero-recurrence claim is not blocked by evidence', () => {
  const r = evaluateRecurrence([original]);
  assert.equal(r.recurrence_exists, false);
  assert.equal(r.zero_recurrence_claim_blocked, false);
});

test('DV-9: event-type occurrences are not_evaluated, never a recurrence verdict', () => {
  const ev = { task_id: 'SYNTHETIC-b', kind: 'event', pointer: 'SYNTHETIC-events.jsonl#L1' };
  const mixed = evaluateRecurrence([original, ev]);
  assert.equal(mixed.not_evaluated.length, 1);
  assert.equal(mixed.not_evaluated[0].reason, EVENT_NOT_EVALUATED);
  assert.equal(mixed.recorded_occurrences, 1); // the event occurrence is not counted for the blocker half
  assert.equal(mixed.recurrence_exists, false);
  assert.equal(mixed.zero_recurrence_claim_blocked, true);
  const eventOnly = evaluateRecurrence([{ ...ev, original: true, task_id: 'SYNTHETIC-a' }, ev]);
  assert.equal(eventOnly.dimension, 'event');
  assert.equal(eventOnly.recurrence_exists, null);
  assert.equal(eventOnly.cross_task_condition_holds, null);
  assert.equal(eventOnly.not_evaluated.length, 2);
  assert.ok(!/event_key|eventKey/.test(source)); // no R4 event key invented
});

test('DV-9: blocker keys compare by exact equality; different or missing keys are not the same blocker', () => {
  const r = evaluateRecurrence([original, recEv('SYNTHETIC-b', { key: 'synthetic-blocker' }), recEv('SYNTHETIC-c', { key: '' })]);
  assert.equal(r.recurrence_exists, false);
  assert.equal(r.different_key.length, 1);
  assert.equal(r.insufficient.length, 1);
  refuses(() => evaluateRecurrence([recEv('SYNTHETIC-b')]), /exactly one original/);
});

// ---- INC-4 separation ----

test('INC-4: facts, hypotheses, and conclusions are separate fields; promotion adds a NEW conclusion and preserves the hypothesis', () => {
  const rec = fixedRec();
  const before = structuredClone(rec.hypotheses[0]);
  const p = promoteHypothesisToConclusion(rec, 'H-1', { conclusion: 'SYNTHETIC conclusion', reproduction_evidence: 'SYNTHETIC-repro-1', by: 'SYNTHETIC-author', date: at(RC, 2) });
  assert.equal(p.reproduction_supported_conclusions.length, 1);
  const c = p.reproduction_supported_conclusions[0];
  assert.equal(c.cites_hypothesis, 'H-1');
  assert.equal(c.reproduction_evidence, 'SYNTHETIC-repro-1');
  assert.equal(p.hypotheses.length, 1);
  for (const k of Object.keys(before)) assert.deepEqual(p.hypotheses[0][k], before[k], k); // never rewritten
  assert.equal(p.hypotheses[0].annotations[0].conclusion_id, c.id);
  assert.deepEqual(p.observed_facts, rec.observed_facts);
  assert.equal(p.status, rec.status);
});

test('INC-4: a conclusion cannot be created from a hypothesis alone', () => {
  refuses(() => promoteHypothesisToConclusion(fixedRec(), 'H-1', { conclusion: 'c', by: 'b', date: RC }), /never filled from a hypothesis alone/);
  refuses(() => createIncident(fields({ reproduction_supported_conclusions: [{ text: 'c' }] }), CREATION), /must be empty at creation/);
});

// ---- Record completeness ----

test('Record completeness: createIncident builds exactly the §6.2 fields at OPEN with history[0] recording creation', () => {
  const r = openRec();
  assert.deepEqual(Object.keys(r), [...RECORD_FIELDS]);
  assert.equal(RECORD_FIELDS.length, 24);
  assert.equal(r.status, 'OPEN');
  assert.equal(r.recurrence_count, 0);
  assert.deepEqual(r.recurrence_evidence, []);
  assert.deepEqual(r.corrected_verdict_evidence, []);
  assert.equal(r.history.length, 1);
  assert.equal(r.history[0].type, 'created');
  assert.equal(r.history[0].reason, CREATION.reason);
  assert.equal(r.history[0].date, RC);
  assert.equal(validateRecord(r).complete, true);
});

test('Record completeness: a missing required field is refused, naming the field; no verdict is produced', () => {
  for (const k of ['incident_id', 'title', 'observed_facts', 'hypotheses', 'record_creation_time', 'provenance', 'detector_rule']) {
    const f = fields();
    delete f[k];
    assert.throws(() => createIncident(f, CREATION), (e) => e.code === 'INCOMPLETE_RECORD' && e.message.includes(`missing required field "${k}`), k);
  }
  refuses(() => createIncident(fields({ candidate_record_id: undefined }), CREATION), /missing required field "candidate_record_id"/);
  refuses(() => createIncident(fields(), { reason: 'r' }), /opened_by/);
  refuses(() => createIncident(fields({ hypotheses: [] }), CREATION), /stated reason/);
  assert.equal(createIncident(fields({ hypotheses: [] }), { ...CREATION, hypotheses_empty_reason: 'SYNTHETIC: none yet' }).history[0].hypotheses_empty_reason, 'SYNTHETIC: none yet');
  assert.equal(createIncident(fields({ detector_rule: { rule: 'manual', reason: 'SYNTHETIC' }, candidate_record_id: undefined }), CREATION).candidate_record_id, null);
  refuses(() => createIncident(fields({ status: 'VALIDATED' }), CREATION), /start at OPEN/);
  refuses(() => createIncident(fields({ extra: 1 }), CREATION), /unknown field/);
  const incomplete = { ...structuredClone(openRec()) };
  delete incomplete.provenance;
  const check = checkValidationEligibility(incomplete, endedWatch());
  assert.equal(check.verdict, null);
  assert.equal(check.incomplete, true);
  refuses(() => transition(incomplete, 'FIXED', { reason: 'S', evidence: 'S', date: RC, fix_reference: 'r', fix_description: 'd' }), /missing required field "provenance"/);

  // F-T2-2 (fix round 1): null, empty, and malformed mandatory VALUES in an
  // existing record (all 24 keys present) are refused, naming the field.
  const fixOpts = { reason: 'S', evidence: 'S', date: RC, fix_reference: 'r', fix_description: 'd' };
  const mutate = (base, change) => { const r = structuredClone(base); change(r); return r; };
  const cases = [
    ['incident_id', (r) => { r.incident_id = null; }],
    ['title', (r) => { r.title = ''; }],
    ['observed_facts', (r) => { r.observed_facts = []; }],
    ['observed_facts', (r) => { delete r.observed_facts[0].source_pointer; }],
    ['observed_facts', (r) => { r.observed_facts[0].source_pointer = ''; }],
    ['provenance', (r) => { r.provenance = null; }],
    ['provenance', (r) => { r.provenance = {}; }],
    ['detector_rule', (r) => { r.detector_rule = null; }],
    ['detector_rule', (r) => { r.detector_rule = 'R9'; }],
    ['candidate_record_id', (r) => { r.detector_rule = 'R3'; r.candidate_record_id = ''; }],
    ['candidate_record_id', (r) => { r.detector_rule = 'R3'; r.candidate_record_id = null; }],
    ['detector_rule', (r) => { r.detector_rule = { rule: 'manual' }; r.candidate_record_id = null; }],
    ['record_creation_time', (r) => { r.record_creation_time = null; }],
    ['record_creation_time', (r) => { r.record_creation_time = 'not-a-date'; }],
    ['hypotheses', (r) => { r.hypotheses = []; }], // empty without history[0].hypotheses_empty_reason
    ['hypotheses', (r) => { r.hypotheses[0].author = ''; }],
  ];
  for (const [field, change] of cases) {
    const bad = mutate(openRec(), change);
    assert.equal(Object.keys(bad).length, 24, field);
    const v = validateRecord(bad);
    assert.equal(v.complete, false, field);
    assert.ok(v.problems.some((p) => p.includes(`"${field}"`)), `${field}: ${v.problems.join('; ')}`);
    const c = checkValidationEligibility(bad, endedWatch());
    assert.equal(c.verdict, null, field);
    assert.equal(c.incomplete, true, field);
    let result;
    assert.throws(() => { result = transition(bad, 'FIXED', fixOpts); }, (e) => e.code === 'INCOMPLETE_RECORD' && e.message.includes(`"${field}"`), field);
    assert.equal(result, undefined, field);
  }
  // An empty hypotheses list WITH the creation reason stays complete.
  const noHyp = createIncident(fields({ hypotheses: [] }), { ...CREATION, hypotheses_empty_reason: 'SYNTHETIC: none yet' });
  assert.equal(validateRecord(noHyp).complete, true);
  // Codex counterexample: all six values blanked at once; FIXED is refused, naming each.
  const codex = mutate(openRec(), (r) => {
    r.incident_id = null; r.title = ''; r.observed_facts = []; r.provenance = null; r.detector_rule = null; r.record_creation_time = null;
  });
  assert.throws(() => transition(codex, 'FIXED', fixOpts), (e) => e.code === 'INCOMPLETE_RECORD'
    && ['incident_id', 'title', 'observed_facts', 'provenance', 'detector_rule', 'record_creation_time'].every((k) => e.message.includes(`"${k}"`)));
  // Status-dependent values on a WATCH record: malformed watch_window, watch_start, fix_presence_evidence.
  const watchCases = [
    ['watch_window', (r) => { r.watch_window = { started: true, start: FP }; }], // names no reading or counting rule
    ['watch_window', (r) => { r.watch_window = { ...r.watch_window, start: 'never' }; }],
    ['watch_window', (r) => { r.watch_window = {}; }],
    ['watch_start', (r) => { r.watch_start = { reading: 'W-C' }; }],
    ['fix_presence_evidence', (r) => { r.fix_presence_evidence = { pointer: '' }; }],
    ['fix_reference', (r) => { r.fix_reference = ''; }],
  ];
  for (const [field, change] of watchCases) {
    const bad = mutate(withEvidence(watchRec()), change);
    const v = validateRecord(bad);
    assert.equal(v.complete, false, field);
    assert.ok(v.problems.some((p) => p.includes(`"${field}"`)), `${field}: ${v.problems.join('; ')}`);
    assert.equal(checkValidationEligibility(bad, endedWatch(), { sufficiency_judgment: JUDGMENT }).verdict, null, field);
    let result;
    assert.throws(() => { result = transition(bad, 'VALIDATED', { reason: 'S', evidence: 'S', date: at(FP, 31), watch: endedWatch(), sufficiency_judgment: JUDGMENT }); },
      (e) => e.code === 'INCOMPLETE_RECORD' && e.message.includes(`"${field}"`), field);
    assert.equal(result, undefined, field);
    refuses(() => annotateCorrectedVerdict(bad, { corrected_verdict_evidence: { pointer: 'p', reason: 'r' }, date: at(FP, 4) }), new RegExp(`"${field}"`));
    refuses(() => recordValidationEvidence(bad, { regression_test: null }, { reason: 'S', evidence: 'S', date: at(FP, 4) }), new RegExp(`"${field}"`));
  }
  // Valid records at every lifecycle stage still pass, including the SYNTHETIC VALIDATED literal.
  for (const r of [openRec(), fixedRec(), watchRec(), withEvidence(watchRec()), reopen(watchRec(), 'SYNTHETIC-b'), syntheticValidatedLiteral()]) {
    assert.deepEqual(validateRecord(r), { complete: true, problems: [] }, r.status);
  }
});

// ---- Immutability / history ----

test('Immutability: transition does not mutate its input and appends exactly one history entry', () => {
  const plain = structuredClone(watchRec()); // unfrozen input
  const snapshot = structuredClone(plain);
  const r = transition(plain, 'REOPENED', { reason: 'SYNTHETIC', evidence: 'SYNTHETIC-occ', date: at(FP, 5), recurrence_evidence: recEv('SYNTHETIC-b') });
  assert.deepEqual(plain, snapshot);
  assert.equal(r.history.length, plain.history.length + 1);
  assert.deepEqual(r.history.slice(0, plain.history.length), plain.history);
  const last = r.history.at(-1);
  assert.equal(last.reason, 'SYNTHETIC');
  assert.equal(last.evidence_pointer, 'SYNTHETIC-occ');
  assert.equal(last.date, at(FP, 5));
  assert.ok(Object.isFrozen(r) && Object.isFrozen(r.history));
});

test('Immutability: every step is append-only across the whole lifecycle', () => {
  const steps = [openRec()];
  steps.push(fixedRec());
  steps.push(watchRec());
  steps.push(withEvidence(steps[2]));
  steps.push(annotateCorrectedVerdict(steps[3], { corrected_verdict_evidence: { pointer: 'SYNTHETIC-cv', reason: 'S' }, date: at(FP, 4) }));
  steps.push(reopen(steps[4], 'SYNTHETIC-b'));
  for (let i = 1; i < steps.length; i += 1) {
    assert.equal(steps[i].history.length, steps[i - 1].history.length + 1);
    assert.deepEqual(steps[i].history.slice(0, -1), steps[i - 1].history);
  }
  refuses(() => transition(steps[3], 'REOPENED', { reason: 'S', evidence: 'S', recurrence_evidence: recEv('SYNTHETIC-b') }), /valid date is required/);
});

test('Read-only boundary: the module does no file I/O and states the boundary, VAL-6, C-15, and DV-3 in its header', () => {
  assert.ok(!/from 'node:fs'|from "node:fs"|require\(/.test(source));
  assert.ok(!/\bimport\b/.test(source.split('\n').filter((l) => !l.startsWith('//')).join('\n')));
  assert.match(source, /READ-ONLY BOUNDARY/);
  assert.match(source, /never writes\s*\n?\/\/\s*into tasks\/ or events\.jsonl/);
  assert.match(source, /C-15 \/ DV-2 OPEN/);
  assert.match(source, /C-16 \/ DV-3 OPEN/);
});
