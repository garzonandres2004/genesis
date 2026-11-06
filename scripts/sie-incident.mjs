// SIE incident records, status machine, and watch computation (Stage 3 T2).
// Implements docs/stage-3/00-sie-specification.md (0.4-draft) §6 (INC-1..INC-6,
// §6.2 fields), §7 (WAT-1..WAT-6, EXP-1, EXP-2, the §7.1 pseudocode, the §7.2
// boundary notes) and §8 (VAL-1..VAL-6), as pure functions over plain
// in-memory incident-record objects.
//
// READ-ONLY BOUNDARY (LOC-3; SIE-03 working scope, OPEN):
// - This module performs no file I/O. It never reads, modifies, reclassifies,
//   backfills, renames, or deletes a Runner source record, and it never writes
//   into tasks/ or events.jsonl.
// - It operates only on incident records passed to it and returns new record
//   objects; it never mutates its input. Returned records are deep-frozen, so a
//   record cannot be upgraded in place (VAL-3).
// - It creates no operational record directory and writes no operational
//   incident records. Record location is F-14 (OPEN); T2 creates none.
//
// VAL-6 [DECIDED]: NO INCIDENT REACHES VALIDATED IN STAGE 3. There are no
// operational incidents in Stage 3, Milestone B is out, and synthetic results
// are never claimed as validated learning. The validation path is a mechanism
// only. While the D2 verifier role is pending, VAL-1 element (3) is always
// "NOT SATISFIED — D2 role pending" (H4), so WATCH -> VALIDATED is always
// refused. Nothing this module returns on fixture input is a validation.
//
// LIFECYCLE ORDER — C-15 / DV-2 OPEN (Founder ruling required). WP-04 v1.1
// reads "fixed → validated → watched" ("A validated incident enters watch");
// brief AC-T2-1 reads "open → fixed → watch → validated". This module follows
// the brief's order (AC-T2-1). The order is NOT settled; if the Founder rules
// otherwise, this status machine is reworked.
//
// MEANINGFUL EXPOSURE — C-16 / DV-3 OPEN (Founder ruling required). WP-04's
// "at least 2 unrelated users in the live system" is an additional mandatory
// requirement that this design does NOT enforce. "Unrelated users" is not
// defined here and no threshold is enforced. Every exposure and eligibility
// result carries the DV3 marker below; none claims DV-3 is satisfied.
//
// RECURRENCE — DV-9: counting is WP-04's cross-task definition (>= 2
// occurrences of the same blocker across >= 2 distinct tasks; the original
// counts as one). The second-recurrence threshold (recurrence_count >= 2,
// WAT-6, AC-T2-5) is kept UNCHANGED as the working threshold; what a "second
// recurrence" means under cross-task counting is OPEN (DV-9, C-20). Event-type
// occurrences are not evaluated: "same event" depends on the [OPEN] R4 event
// key (CR-04; Founder Amendment §0.5 (a)). No event key is defined here.
//
// WATCH COMPUTATIONS ARE PROVISIONAL. H5 (watch start, decision 5) and SIE-02
// ("next 10 tasks" counting) are both OPEN, so every watch computation names
// its reading and counting rule and is labeled PROVISIONAL. No code path here
// produces a non-provisional watch computation (WAT-4, AC-T2-4).

export const STATES = Object.freeze(['OPEN', 'FIXED', 'WATCH', 'VALIDATED', 'REOPENED']); // CR-09 form (VOC-5)

// §6.2, in table order. A record carries exactly these fields.
export const RECORD_FIELDS = Object.freeze([
  'incident_id', 'status', 'title', 'observed_facts', 'hypotheses',
  'reproduction_supported_conclusions', 'detector_rule', 'candidate_record_id',
  'fix_reference', 'fix_description', 'fix_presence_evidence', 'record_creation_time',
  'watch_start', 'watch_window', 'exposure_evidence_link', 'regression_test',
  'reproduction_evidence', 'independent_verification', 'sufficiency_judgment',
  'recurrence_count', 'recurrence_evidence', 'corrected_verdict_evidence',
  'provenance', 'history',
]);

// §6.1 INC-1 (prep §2.2 as corrected by addendum CR-03). OPEN -> REOPENED is
// deleted (CR-03 correction 1) and is not a fallback.
export const TRANSITIONS = Object.freeze({
  OPEN: Object.freeze(['FIXED']),
  FIXED: Object.freeze(['WATCH', 'REOPENED']),
  WATCH: Object.freeze(['VALIDATED', 'REOPENED']),
  VALIDATED: Object.freeze(['REOPENED']),
  REOPENED: Object.freeze([]),
});

export const READINGS = Object.freeze(['W-A', 'W-B', 'W-C']); // WAT-2, H5 OPEN

// Open decisions that make every watch computation provisional (WAT-4).
export const OPEN_DECISIONS = Object.freeze({ H5: 'OPEN', 'SIE-02': 'OPEN' });

// WAT-3 prep working text ("the unqualified reading"). Named, not adopted.
export const SIE02_UNQUALIFIED =
  'SIE-02 unqualified reading (PROVISIONAL): runner tasks observed in the window, counted from the window start, in the sequence in which they occur';

export const WATCH_DAYS = 30; // WAT-1 [REF]
export const WATCH_TASKS = 10; // WAT-1 [REF]
const DAY_MS = 24 * 60 * 60 * 1000;

// H4 / VAL-5: until the D2 operational verifier role is approved.
export const D2_ROLE_STATUS = 'PENDING';
export const D2_NOT_SATISFIED = 'NOT SATISFIED — D2 role pending';

export const DV3_MARKER = Object.freeze({
  meaningful_exposure_wp04_two_user_condition: 'NOT ENFORCED — C-16 OPEN',
  note: 'WP-04 v1.1: "the incident must have been exercised by at least 2 unrelated users in the live system". ' +
    'Additional mandatory requirement NOT enforced by this design; "unrelated users" is undefined. ' +
    'No Stage 3 validation may claim to satisfy DV-3 (Spec §2.9 DV-3, §8 VAL-1 element (4)).',
});

// WAT-6 / SIE-07: mechanism only. Carries no procedure, conductor, or outcome.
export const DEEPER_REVIEW_MARKER = Object.freeze({
  mandatory_deeper_review: true,
  rule: 'WAT-6',
  threshold: 'recurrence_count >= 2 (working threshold, unchanged; what a "second recurrence" is under cross-task counting is OPEN — DV-9, C-20)',
  procedure: 'OPEN — SIE-07 (not defined here)',
  effect: 'Does not reopen, validate, or invalidate anything; the review decides, with evidence and judgment text.',
});

export const EVENT_NOT_EVALUATED =
  'not evaluated: "same event" depends on the [OPEN] R4 event key (CR-04; Founder Amendment §0.5 (a)); event-type recurrence is never claimed';

// Exposure-excluded evidence kinds (EXP-1, EXP-2, EVL-1, EVL-2, VAL-3).
const NON_EXPOSURE_KINDS = Object.freeze({
  'record-creation': 'record creation is never exposure (EXP-1)',
  fixture: 'fixture evidence is never exposure (EXP-2, EVL-2)',
  synthetic: 'synthetic evidence is never exposure (EXP-2, EVL-2)',
  'staged-lesson': 'a staged lesson is never validation evidence (VAL-3)',
  'merged-pr': 'a merged PR is never exposure; validation on a merged PR alone is forbidden (VAL-3)',
});

export class IncidentRefusal extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'IncidentRefusal';
    this.code = code;
    this.details = details;
  }
}

// ---- helpers ----

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function toMs(v) {
  if (!isNonEmptyString(v)) return null;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : ms;
}

const iso = (ms) => new Date(ms).toISOString();

function deepFreeze(v) {
  if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) deepFreeze(v[k]);
  }
  return v;
}

function requireDate(date, what) {
  if (toMs(date) === null) throw new IncidentRefusal('MISSING_DATE', `${what} refused: a valid date is required (INC-5 history)`);
}

function requirePointer(v) {
  return isPlainObject(v) && isNonEmptyString(v.pointer);
}

function requireCountingRule(countingRule) {
  if (!isNonEmptyString(countingRule)) {
    throw new IncidentRefusal('UNNAMED_COUNTING_RULE', 'watch computation refused: the task-counting rule must be named (SIE-02 OPEN, WAT-4)');
  }
}

// Every watch computation carries this (WAT-4, AC-T2-4). H5 and SIE-02 are
// OPEN, so the label is always PROVISIONAL. There is deliberately no branch
// that produces any other label: deciding H5/SIE-02 needs a code change here.
function watchRule(reading, countingRule) {
  const undecided = Object.keys(OPEN_DECISIONS).filter((k) => OPEN_DECISIONS[k] === 'OPEN');
  return { reading, counting_rule: countingRule, provisional: true, label: 'PROVISIONAL', undecided };
}

function ruleOf(window) {
  if (!isPlainObject(window) || !READINGS.includes(window.reading) || !isNonEmptyString(window.counting_rule)) {
    throw new IncidentRefusal('UNNAMED_WATCH_RULE', 'watch computation refused: the input window does not name its reading and counting rule (WAT-4)');
  }
  return watchRule(window.reading, window.counting_rule);
}

// ---- §6.2 record model ----

const DETECTOR_RULES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
const LATER_FIELDS = [
  'fix_reference', 'fix_description', 'fix_presence_evidence', 'watch_start', 'watch_window',
  'exposure_evidence_link', 'regression_test', 'reproduction_evidence', 'sufficiency_judgment',
];

// Builds a new OPEN record with exactly the §6.2 fields. A missing required
// field makes the record incomplete: it is refused, naming the field, and no
// verdict is produced (prep §3). Nothing required is silently defaulted.
// `creation` is INC-6's recorded judgment: who opened it and why.
export function createIncident(fields, creation = {}) {
  if (!isPlainObject(fields)) throw new IncidentRefusal('INCOMPLETE_RECORD', 'incomplete record: fields must be an object');
  const missing = [];
  const problems = [];

  const unknown = Object.keys(fields).filter((k) => !RECORD_FIELDS.includes(k));
  if (unknown.length) problems.push(`unknown field(s) ${unknown.join(', ')} (§6.2 fields only)`);

  if (!isNonEmptyString(fields.incident_id)) missing.push('incident_id');
  if (!isNonEmptyString(fields.title)) missing.push('title');
  if (toMs(fields.record_creation_time) === null) missing.push('record_creation_time');
  if (!isPlainObject(fields.provenance) || Object.keys(fields.provenance).length === 0) missing.push('provenance');

  if (!Array.isArray(fields.observed_facts) || fields.observed_facts.length === 0) missing.push('observed_facts');
  else if (!fields.observed_facts.every((f) => isPlainObject(f) && isNonEmptyString(f.fact) && isNonEmptyString(f.source_pointer))) {
    problems.push('observed_facts: each fact needs a source_pointer (§6.2)');
  }

  if (!Array.isArray(fields.hypotheses)) missing.push('hypotheses');
  else if (fields.hypotheses.length === 0 && !isNonEmptyString(creation.hypotheses_empty_reason)) {
    missing.push('hypotheses (empty requires a stated reason: hypotheses_empty_reason)');
  } else if (!fields.hypotheses.every((h) => isPlainObject(h) && ['id', 'text', 'author', 'date'].every((k) => isNonEmptyString(h[k])))) {
    problems.push('hypotheses: each needs id, text, author, date (§6.2)');
  }

  if (fields.reproduction_supported_conclusions !== undefined
    && !(Array.isArray(fields.reproduction_supported_conclusions) && fields.reproduction_supported_conclusions.length === 0)) {
    problems.push('reproduction_supported_conclusions must be empty at creation; conclusions are added only with reproduction evidence (INC-4)');
  }

  const dr = fields.detector_rule;
  if (dr === undefined || dr === null) missing.push('detector_rule');
  else if (DETECTOR_RULES.includes(dr)) {
    if (!isNonEmptyString(fields.candidate_record_id)) missing.push('candidate_record_id');
  } else if (!(isPlainObject(dr) && dr.rule === 'manual' && isNonEmptyString(dr.reason))) {
    problems.push('detector_rule must be R1-R6 or { rule: "manual", reason } (§6.2)');
  }

  if (fields.status !== undefined && fields.status !== 'OPEN') problems.push('new records start at OPEN');
  if (fields.recurrence_count !== undefined && fields.recurrence_count !== 0) problems.push('new records start at recurrence_count 0');
  for (const k of ['recurrence_evidence', 'corrected_verdict_evidence']) {
    if (fields[k] !== undefined && !(Array.isArray(fields[k]) && fields[k].length === 0)) problems.push(`${k} must be empty at creation`);
  }
  if (fields.history !== undefined) problems.push('history is built by this module (INC-5); it cannot be supplied');
  for (const k of LATER_FIELDS) {
    if (fields[k] !== undefined && fields[k] !== null) problems.push(`${k} is set only by its transition or evidence step, not at creation`);
  }
  if (fields.independent_verification !== undefined && fields.independent_verification !== D2_NOT_SATISFIED) {
    problems.push(`independent_verification is "${D2_NOT_SATISFIED}" until the D2 role is approved (H4)`);
  }

  if (!isNonEmptyString(creation.opened_by)) missing.push('opened_by (INC-6: who opened it)');
  if (!isNonEmptyString(creation.reason)) missing.push('reason (INC-6: why it was opened)');

  if (missing.length || problems.length) {
    const named = missing.map((m) => `missing required field "${m}"`).concat(problems);
    throw new IncidentRefusal('INCOMPLETE_RECORD', `incomplete record, returned without a verdict (§6.2): ${named.join('; ')}`, { missing, problems });
  }

  const created = {
    seq: 0,
    type: 'created',
    from: null,
    to: 'OPEN',
    reason: creation.reason,
    evidence_pointer: DETECTOR_RULES.includes(dr) ? fields.candidate_record_id : `manual: ${dr.reason}`,
    by: creation.opened_by,
    date: fields.record_creation_time,
  };
  if (fields.hypotheses.length === 0) created.hypotheses_empty_reason = creation.hypotheses_empty_reason;

  const record = {};
  for (const k of RECORD_FIELDS) record[k] = null;
  Object.assign(record, structuredClone(fields), {
    status: 'OPEN',
    reproduction_supported_conclusions: [],
    candidate_record_id: fields.candidate_record_id ?? null,
    independent_verification: D2_NOT_SATISFIED,
    recurrence_count: 0,
    recurrence_evidence: [],
    corrected_verdict_evidence: [],
    history: [created],
  });
  return deepFreeze(record);
}

// Structural completeness of an existing record. Incomplete records get no
// verdict. Also refuses a status that does not match the append-only history
// (a record "upgraded in place", VAL-3 / INC-5).
export function validateRecord(record) {
  const problems = [];
  if (!isPlainObject(record)) return { complete: false, problems: ['record is not an object'] };
  const keys = Object.keys(record);
  for (const k of RECORD_FIELDS) if (!keys.includes(k)) problems.push(`missing required field "${k}"`);
  for (const k of keys) if (!RECORD_FIELDS.includes(k)) problems.push(`unknown field "${k}" (§6.2 fields only)`);
  if (!STATES.includes(record.status)) problems.push(`status "${record.status}" is not one of ${STATES.join(', ')}`);
  if (!Number.isInteger(record.recurrence_count) || record.recurrence_count < 0) problems.push('recurrence_count must be a non-negative integer');
  for (const k of ['observed_facts', 'hypotheses', 'reproduction_supported_conclusions', 'recurrence_evidence', 'corrected_verdict_evidence']) {
    if (!Array.isArray(record[k])) problems.push(`${k} must be a list`);
  }
  if (!Array.isArray(record.history) || record.history.length === 0) {
    problems.push('history must be a non-empty append-only list');
  } else {
    const lastStatus = [...record.history].reverse().find((h) => h && h.to !== undefined && h.to !== null);
    if (!lastStatus || lastStatus.to !== record.status) {
      problems.push(`status "${record.status}" does not match the history (upgrade in place refused, VAL-3 / INC-5)`);
    }
    if (Array.isArray(record.recurrence_evidence)
      && record.recurrence_count !== record.recurrence_evidence.length) {
      problems.push('recurrence_count does not equal the number of recorded recurrence_evidence entries (INC-2)');
    }
  }
  if (['FIXED', 'WATCH', 'VALIDATED', 'REOPENED'].includes(record.status)) {
    for (const k of ['fix_reference', 'fix_description']) if (!isNonEmptyString(record[k])) problems.push(`missing required field "${k}" for ${record.status}`);
  }
  if (['WATCH', 'VALIDATED'].includes(record.status)) {
    for (const k of ['fix_presence_evidence', 'watch_start', 'watch_window']) if (record[k] == null) problems.push(`missing required field "${k}" for ${record.status}`);
  }
  return { complete: problems.length === 0, problems };
}

function requireComplete(record, what) {
  const v = validateRecord(record);
  if (!v.complete) {
    throw new IncidentRefusal('INCOMPLETE_RECORD', `${what} refused: incomplete record, returned without a verdict: ${v.problems.join('; ')}`, { problems: v.problems });
  }
}

function appendHistory(record, entry) {
  const next = structuredClone(record);
  next.history.push({ seq: next.history.length, ...entry });
  return next;
}

function refuseUnknownOpts(opts, allowed, from, to, forbids) {
  const extra = Object.keys(opts).filter((k) => !allowed.includes(k));
  if (extra.length) {
    throw new IncidentRefusal('FORBIDDEN_CLAIM', `transition ${from} -> ${to} refused: it does not accept ${extra.join(', ')}${forbids ? ` (${forbids})` : ''}`, { extra });
  }
}

// ---- §6.1 status machine ----

const COMMON_OPTS = ['reason', 'evidence', 'date', 'by'];

// Pure: returns a new frozen record and appends exactly one history entry
// (reason, evidence pointer, date — INC-5). Never mutates its input.
export function transition(record, to, opts = {}) {
  requireComplete(record, `transition to ${to}`);
  const from = record.status;
  if (from === 'OPEN' && to === 'REOPENED') {
    throw new IncidentRefusal('CR03_DELETED', 'transition OPEN -> REOPENED refused: deleted by addendum CR-03 correction 1; not a fallback');
  }
  if (!STATES.includes(to) || !TRANSITIONS[from].includes(to)) {
    throw new IncidentRefusal('NOT_PERMITTED', `transition ${from} -> ${to} refused: not a permitted transition (§6.1 INC-1)`);
  }
  if (!isNonEmptyString(opts.reason)) throw new IncidentRefusal('MISSING_REASON', `transition ${from} -> ${to} refused: a stated reason is required (INC-2, INC-5)`);
  if (!isNonEmptyString(opts.evidence)) throw new IncidentRefusal('MISSING_EVIDENCE_POINTER', `transition ${from} -> ${to} refused: an evidence pointer is required (INC-2, INC-5)`);
  requireDate(opts.date, `transition ${from} -> ${to}`);

  const entry = { type: 'transition', from, to, reason: opts.reason, evidence_pointer: opts.evidence, date: opts.date };
  if (isNonEmptyString(opts.by)) entry.by = opts.by;
  const key = `${from}>${to}`;

  if (key === 'OPEN>FIXED') {
    refuseUnknownOpts(opts, [...COMMON_OPTS, 'fix_reference', 'fix_description'], from, to,
      'OPEN -> FIXED FORBIDS claiming validation, claiming the fix is proven effective, or closing on a merged PR alone');
    const missing = ['fix_reference', 'fix_description'].filter((k) => !isNonEmptyString(opts[k]));
    if (missing.length) throw new IncidentRefusal('MISSING_EVIDENCE', `transition OPEN -> FIXED refused: missing ${missing.join(' and ')} (§6.1)`, { missing });
    const next = appendHistory(record, entry);
    next.status = 'FIXED';
    next.fix_reference = opts.fix_reference;
    next.fix_description = opts.fix_description;
    return deepFreeze(next);
  }

  if (key === 'FIXED>WATCH') {
    refuseUnknownOpts(opts, [...COMMON_OPTS, 'fix_presence_evidence', 'watch_window'], from, to);
    const missing = [];
    if (!requirePointer(opts.fix_presence_evidence)) missing.push('fix_presence_evidence');
    if (toMs(record.record_creation_time) === null) missing.push('record_creation_time');
    if (!isPlainObject(opts.watch_window)) missing.push('watch_window (a named watchWindow() computation; §6.2 watch_start/watch_window)');
    if (missing.length) throw new IncidentRefusal('MISSING_EVIDENCE', `transition FIXED -> WATCH refused: missing ${missing.join(' and ')} (§6.1)`, { missing });
    const rule = ruleOf(opts.watch_window);
    const next = appendHistory(record, { ...entry, watch_rule: rule });
    next.status = 'WATCH';
    next.fix_presence_evidence = structuredClone(opts.fix_presence_evidence);
    // WAT-2: the start is never assumed. A not-started window is recorded as such.
    next.watch_start = opts.watch_window.started
      ? { ...rule, started: true, time: opts.watch_window.start }
      : { ...rule, started: false, time: null, message: opts.watch_window.message };
    next.watch_window = structuredClone(opts.watch_window);
    return deepFreeze(next);
  }

  if (key === 'WATCH>VALIDATED') {
    refuseUnknownOpts(opts, [...COMMON_OPTS, 'sufficiency_judgment', 'watch'], from, to,
      'WATCH -> VALIDATED FORBIDS validation on a merged PR alone, zero recurrence alone, fixture evidence, a staged lesson, or by upgrading in place');
    const check = checkValidationEligibility(record, opts.watch, { sufficiency_judgment: opts.sufficiency_judgment });
    if (!check.eligible) {
      const why = check.failing.map((n) => `${n}: ${check.elements[n].reason}`).join('; ');
      throw new IncidentRefusal('NOT_ELIGIBLE', `transition WATCH -> VALIDATED refused (VAL-1, conjunctive): ${why}`, { failing: check.failing, check });
    }
    // Unreachable while D2_ROLE_STATUS is PENDING (VAL-6). Kept as the mechanism.
    const next = appendHistory(record, { ...entry, eligibility: check });
    next.status = 'VALIDATED';
    next.sufficiency_judgment = structuredClone(opts.sufficiency_judgment);
    return deepFreeze(next);
  }

  if (key === 'FIXED>REOPENED' || key === 'WATCH>REOPENED') {
    refuseUnknownOpts(opts, [...COMMON_OPTS, 'recurrence_evidence', 'corrected_verdict_evidence'], from, to);
    if (opts.corrected_verdict_evidence !== undefined) {
      throw new IncidentRefusal('NOT_RECURRENCE', `transition ${from} -> REOPENED refused: corrected-verdict evidence on a ${from} record is an annotation, not a recurrence and not a status change (CR-03, INC-2); use annotateCorrectedVerdict`);
    }
    const ev = checkRecurrenceEvidence(opts.recurrence_evidence, `transition ${from} -> REOPENED`);
    const next = appendHistory(record, entry);
    next.status = 'REOPENED';
    return deepFreeze(addRecurrence(next, ev));
  }

  // VALIDATED > REOPENED
  refuseUnknownOpts(opts, [...COMMON_OPTS, 'corrected_verdict_evidence', 'recurrence_evidence'], from, to);
  if (opts.recurrence_evidence !== undefined) {
    throw new IncidentRefusal('INC3_NOT_OPERATIVE', 'transition VALIDATED -> REOPENED refused: recurrence-based reopening from VALIDATED is not operative (INC-3, addendum CR-03; the prep path is an unapplied proposal, C-9). Only corrected_verdict_evidence reopens a VALIDATED record');
  }
  const cv = opts.corrected_verdict_evidence;
  if (!requirePointer(cv) || !isNonEmptyString(cv.reason)) {
    throw new IncidentRefusal('MISSING_EVIDENCE', 'transition VALIDATED -> REOPENED refused: corrected_verdict_evidence (specific pointer + reason) is required (CR-03)');
  }
  const validatedAt = [...record.history].reverse().find((h) => h.to === 'VALIDATED');
  const next = appendHistory(record, {
    ...entry,
    supersedes: { history_seq: validatedAt.seq, status: 'VALIDATED', annotation: 'SUPERSEDED', reason: opts.reason },
  });
  next.status = 'REOPENED';
  next.corrected_verdict_evidence.push(structuredClone(cv));
  // A corrected verdict never increments recurrence_count (CR-03, INC-2).
  return deepFreeze(next);
}

function checkRecurrenceEvidence(ev, what) {
  const problems = [];
  if (!requirePointer(ev)) problems.push('a specific evidence pointer');
  else {
    if (!isNonEmptyString(ev.task_id)) problems.push('the task id of the occurrence (DV-9)');
    if (!isNonEmptyString(ev.reason)) problems.push('a stated reason');
    if (!['blocker', 'event'].includes(ev.kind)) problems.push('kind "blocker" or "event"');
    if (ev.kind === 'blocker' && !isNonEmptyString(ev.key)) problems.push('the recorded blocker key');
  }
  if (problems.length) throw new IncidentRefusal('MISSING_EVIDENCE', `${what} refused: recurrence_evidence needs ${problems.join(', ')} (CR-03, INC-2)`, { problems });
  return structuredClone(ev);
}

// INC-2: recurrence evidence is stored in its own field and increments
// recurrence_count by 1. At >= 2 the WAT-6 marker is placed on the history
// entry that recorded it (mechanism only, SIE-07).
function addRecurrence(next, ev) {
  next.recurrence_evidence.push(ev);
  next.recurrence_count += 1;
  if (next.recurrence_count >= 2) {
    next.history[next.history.length - 1].deeper_review = { ...DEEPER_REVIEW_MARKER, triggered_at_recurrence_count: next.recurrence_count };
  }
  return next;
}

// Records a further post-fix occurrence on a REOPENED record, without a status
// change. §6.1 defines no transition out of REOPENED, so without this the WAT-6
// threshold could not be reached on one record. FLAGGED FOR REVIEW (T2 report,
// open items): it applies INC-2 ("each post-fix new occurrence is recorded as
// recurrence_evidence ... and increments recurrence_count") and nothing more.
export function recordFurtherRecurrence(record, { recurrence_evidence, reason, evidence, date } = {}) {
  requireComplete(record, 'recording recurrence evidence');
  if (record.status === 'FIXED' || record.status === 'WATCH') {
    throw new IncidentRefusal('USE_TRANSITION', `recording recurrence evidence on a ${record.status} record refused: it reopens the record; use transition(record, "REOPENED", ...) (§6.1)`);
  }
  if (record.status === 'VALIDATED') {
    throw new IncidentRefusal('INC3_NOT_OPERATIVE', 'recording recurrence evidence on a VALIDATED record refused: recurrence-based reopening from VALIDATED is not operative (INC-3)');
  }
  if (record.status !== 'REOPENED') {
    throw new IncidentRefusal('NOT_POST_FIX', 'recording recurrence evidence on an OPEN record refused: there is no fix yet, so no post-fix occurrence (INC-2)');
  }
  if (!isNonEmptyString(reason)) throw new IncidentRefusal('MISSING_REASON', 'recording recurrence evidence refused: a stated reason is required');
  if (!isNonEmptyString(evidence)) throw new IncidentRefusal('MISSING_EVIDENCE_POINTER', 'recording recurrence evidence refused: an evidence pointer is required');
  requireDate(date, 'recording recurrence evidence');
  const ev = checkRecurrenceEvidence(recurrence_evidence, 'recording recurrence evidence');
  const next = appendHistory(record, { type: 'recurrence-evidence', reason, evidence_pointer: evidence, date });
  return deepFreeze(addRecurrence(next, ev));
}

// WAT-6 reader. The marker is carried by the history entry; this returns it.
export function deeperReviewStatus(record) {
  const entry = [...record.history].reverse().find((h) => h.deeper_review);
  return entry
    ? { mandatory_deeper_review: true, recurrence_count: record.recurrence_count, marker: entry.deeper_review, history_seq: entry.seq }
    : { mandatory_deeper_review: false, recurrence_count: record.recurrence_count };
}

// A corrected verdict on a FIXED/WATCH record (before validation completes) is
// an ANNOTATION carrying corrected_verdict_evidence: not a recurrence, not a
// status change, never an increment of recurrence_count (CR-03, INC-2).
export function annotateCorrectedVerdict(record, { corrected_verdict_evidence, date } = {}) {
  requireComplete(record, 'corrected-verdict annotation');
  if (record.status === 'VALIDATED') {
    throw new IncidentRefusal('USE_TRANSITION', 'corrected-verdict annotation on a VALIDATED record refused: use transition(record, "REOPENED", { corrected_verdict_evidence }) (CR-03)');
  }
  if (record.status !== 'FIXED' && record.status !== 'WATCH') {
    throw new IncidentRefusal('NOT_PERMITTED', `corrected-verdict annotation on a ${record.status} record refused: §6.1 defines it for FIXED/WATCH records only`);
  }
  const cv = corrected_verdict_evidence;
  if (!requirePointer(cv) || !isNonEmptyString(cv.reason)) {
    throw new IncidentRefusal('MISSING_EVIDENCE', 'corrected-verdict annotation refused: corrected_verdict_evidence (specific pointer + reason) is required');
  }
  requireDate(date, 'corrected-verdict annotation');
  const next = appendHistory(record, { type: 'annotation', annotation: 'corrected-verdict', reason: cv.reason, evidence_pointer: cv.pointer, date });
  next.corrected_verdict_evidence.push(structuredClone(cv));
  return deepFreeze(next);
}

// INC-4: a hypothesis that gains reproduction support becomes a NEW conclusion
// entry citing the reproduction evidence. The hypothesis entry is preserved
// (its original fields unchanged) and annotated; it is never rewritten.
export function promoteHypothesisToConclusion(record, hypothesisId, { conclusion, reproduction_evidence, by, date } = {}) {
  requireComplete(record, 'hypothesis promotion');
  if (record.status === 'VALIDATED') {
    throw new IncidentRefusal('NOT_PERMITTED', 'hypothesis promotion on a VALIDATED record refused: a validated record is not upgraded in place; corrections go through corrected_verdict_evidence');
  }
  const idx = record.hypotheses.findIndex((h) => h.id === hypothesisId);
  if (idx < 0) throw new IncidentRefusal('NOT_FOUND', `hypothesis promotion refused: no hypothesis "${hypothesisId}"`);
  if (!isNonEmptyString(reproduction_evidence)) {
    throw new IncidentRefusal('NO_REPRODUCTION', 'hypothesis promotion refused: a conclusion is never filled from a hypothesis alone; reproduction evidence is required (INC-4, §6.2)');
  }
  if (!isNonEmptyString(conclusion) || !isNonEmptyString(by)) {
    throw new IncidentRefusal('MISSING_EVIDENCE', 'hypothesis promotion refused: conclusion text and author are required');
  }
  requireDate(date, 'hypothesis promotion');
  const next = appendHistory(record, { type: 'annotation', annotation: 'hypothesis-promoted', reason: `hypothesis ${hypothesisId} gained reproduction support`, evidence_pointer: reproduction_evidence, date });
  const conclusionId = `C-${next.reproduction_supported_conclusions.length + 1}`;
  next.reproduction_supported_conclusions.push({ id: conclusionId, text: conclusion, cites_hypothesis: hypothesisId, reproduction_evidence, by, date });
  const h = next.hypotheses[idx];
  h.annotations = [...(h.annotations ?? []), { annotation: 'promoted-to-conclusion', conclusion_id: conclusionId, reproduction_evidence, date }];
  return deepFreeze(next);
}

// Records VAL-1 evidence fields on a FIXED/WATCH record. No status change; the
// previous value (if any) is kept in the history entry (INC-5).
const EVIDENCE_FIELDS = ['reproduction_evidence', 'regression_test', 'independent_verification', 'exposure_evidence_link'];
export function recordValidationEvidence(record, values, { reason, evidence, date } = {}) {
  requireComplete(record, 'recording validation evidence');
  if (record.status !== 'FIXED' && record.status !== 'WATCH') {
    throw new IncidentRefusal('NOT_PERMITTED', `recording validation evidence on a ${record.status} record refused: FIXED/WATCH only`);
  }
  const keys = isPlainObject(values) ? Object.keys(values) : [];
  const bad = keys.filter((k) => !EVIDENCE_FIELDS.includes(k));
  if (keys.length === 0 || bad.length) throw new IncidentRefusal('NOT_PERMITTED', `recording validation evidence refused: fields must be among ${EVIDENCE_FIELDS.join(', ')}`);
  if ('exposure_evidence_link' in values && !Array.isArray(values.exposure_evidence_link)) {
    throw new IncidentRefusal('MISSING_EVIDENCE', 'recording validation evidence refused: exposure_evidence_link must be a list of evidence items');
  }
  if (!isNonEmptyString(reason) || !isNonEmptyString(evidence)) {
    throw new IncidentRefusal('MISSING_REASON', 'recording validation evidence refused: a stated reason and evidence pointer are required');
  }
  requireDate(date, 'recording validation evidence');
  const previous = {};
  for (const k of keys) previous[k] = record[k];
  const next = appendHistory(record, { type: 'annotation', annotation: 'validation-evidence', fields: keys, previous, reason, evidence_pointer: evidence, date });
  for (const k of keys) next[k] = structuredClone(values[k]);
  return deepFreeze(next);
}

// ---- DV-9 recurrence evaluation ----

// occurrences: [{ original?: true, task_id, kind: 'blocker' | 'event', key, pointer }]
// with exactly one original. A WP-04 recurrence exists iff >= 2 occurrences of
// the same blocker (exact key equality, as R4) across >= 2 distinct tasks, the
// original counted as one. Event-type occurrences are not evaluated.
export function evaluateRecurrence(occurrences) {
  if (!Array.isArray(occurrences)) throw new IncidentRefusal('BAD_INPUT', 'evaluateRecurrence: occurrences must be a list');
  const originals = occurrences.filter((o) => o && o.original === true);
  if (originals.length !== 1) throw new IncidentRefusal('BAD_INPUT', 'evaluateRecurrence: exactly one original occurrence is required (the original counts as one, DV-9)');
  const original = originals[0];
  const postFix = occurrences.filter((o) => o !== original);
  const base = {
    basis: 'DV-9 (0.4-draft): WP-04 "2 or more occurrences of the same blocker or event across 2 or more tasks"; original counted as one',
    threshold_note: 'Working second-recurrence threshold recurrence_count >= 2 unchanged; its meaning under cross-task counting is OPEN (DV-9, C-20)',
    post_fix_occurrences_recorded: postFix.length,
    // Any recorded post-fix occurrence blocks a "zero recurrence" claim (no loosening).
    zero_recurrence_claim_blocked: postFix.length > 0,
  };
  const notEvaluated = occurrences.filter((o) => o && o.kind === 'event').map((o) => ({ task_id: o.task_id ?? null, pointer: o.pointer ?? null, reason: EVENT_NOT_EVALUATED }));
  if (original.kind === 'event') {
    return { ...base, dimension: 'event', recorded_occurrences: null, distinct_tasks: null, cross_task_condition_holds: null, recurrence_exists: null, not_evaluated: notEvaluated, insufficient: [], different_key: [] };
  }
  const insufficient = [];
  const differentKey = [];
  const same = [];
  for (const o of occurrences.filter((x) => x && x.kind !== 'event')) {
    if (o.kind !== 'blocker' || !isNonEmptyString(o.key) || !isNonEmptyString(o.task_id)) {
      insufficient.push({ task_id: o?.task_id ?? null, pointer: o?.pointer ?? null, reason: 'insufficient evidence: kind, key, or task id missing or incomparable' });
    } else if (o.key !== original.key) {
      differentKey.push({ task_id: o.task_id, pointer: o.pointer ?? null, reason: 'not the same blocker (exact key differs)' });
    } else same.push(o);
  }
  const originalUsable = same.includes(original);
  const distinct = new Set(same.map((o) => o.task_id)).size;
  const holds = originalUsable && same.length >= 2 && distinct >= 2;
  return {
    ...base,
    dimension: 'blocker',
    recorded_occurrences: same.length,
    distinct_tasks: distinct,
    cross_task_condition_holds: originalUsable ? holds : null,
    recurrence_exists: originalUsable ? holds : null,
    not_evaluated: notEvaluated,
    insufficient,
    different_key: differentKey,
  };
}

// Convenience: the record's recorded recurrence evidence plus its original occurrence.
export function evaluateRecordRecurrence(record, originalOccurrence) {
  return evaluateRecurrence([{ ...originalOccurrence, original: true }, ...record.recurrence_evidence]);
}

// ---- §7.1 watch computation ----

// WAT-2 (H5 OPEN): the reading must be named. The counting rule (SIE-02 OPEN)
// is also named here so that every computation carries both (WAT-4). A start
// not established from the given records is never assumed (§7.2 (c)).
export function watchWindow(fixMergeTime, firstPostMergeCiTime, fixPresenceTime, recordCreationTime, reading, countingRule) {
  if (!READINGS.includes(reading)) {
    throw new IncidentRefusal('UNNAMED_READING', 'watch computation refused: the reading must be named: "W-A" | "W-B" | "W-C" (H5 OPEN, WAT-2)');
  }
  requireCountingRule(countingRule);
  const rule = watchRule(reading, countingRule);
  const rc = toMs(recordCreationTime);
  let start = null;
  let missing = null;
  if (reading === 'W-A') {
    start = toMs(fixMergeTime);
    if (start === null) missing = 'fix-merge';
  } else if (reading === 'W-B') {
    start = toMs(firstPostMergeCiTime);
    if (start === null) missing = 'first-post-merge-CI';
  } else {
    // W-C: WP-04 v1.1 unified rule, "the later of the two instants"; subject to decision 5 (OPEN).
    const fp = toMs(fixPresenceTime);
    const names = [fp === null && 'fix-presence', rc === null && 'record-creation'].filter(Boolean);
    if (names.length) missing = names.join(' and ');
    else start = Math.max(fp, rc);
  }
  if (missing) {
    return { ...rule, started: false, start: null, message: `watch not started: missing ${missing} evidence` };
  }
  return { ...rule, started: true, start: iso(start), record_creation_time: rc === null ? null : iso(rc), window_number: 1 };
}

// WAT-1: 30 days OR the next 10 tasks, whichever FIRST. taskSequence holds
// { task_id, observed_at } for the tasks the caller selected under the named
// counting rule (SIE-02 OPEN). A task counts once, from its first observation
// strictly after the window start. With fewer than 10, the day limit governs.
// end_condition_reached is true only when asOf is given and at/after the end.
export function watchEnd(window, taskSequence, countingRule, asOf) {
  requireCountingRule(countingRule);
  const rule = ruleOf(window);
  if (window.counting_rule !== countingRule) {
    throw new IncidentRefusal('MIXED_COUNTING_RULE', `watch computation refused: window counted under "${window.counting_rule}", end requested under "${countingRule}" (WAT-4)`);
  }
  if (!window.started) {
    return { ...rule, started: false, message: window.message, end_time: null, end_condition_reached: false };
  }
  const start = toMs(window.start);
  const asOfMs = toMs(asOf);
  const dayLimit = start + WATCH_DAYS * DAY_MS;
  const seen = new Map();
  for (const t of Array.isArray(taskSequence) ? taskSequence : []) {
    const at = toMs(t?.observed_at);
    if (!isNonEmptyString(t?.task_id) || at === null || at <= start) continue;
    if (asOfMs !== null && at > asOfMs) continue;
    if (!seen.has(t.task_id) || seen.get(t.task_id) > at) seen.set(t.task_id, at);
  }
  const times = [...seen.values()].sort((a, b) => a - b);
  const taskLimit = times.length >= WATCH_TASKS ? times[WATCH_TASKS - 1] : null;
  const end = taskLimit === null ? dayLimit : Math.min(dayLimit, taskLimit);
  let governedBy = 'day_limit (fewer than 10 tasks observed)';
  if (taskLimit !== null) governedBy = taskLimit < dayLimit ? 'task_limit' : taskLimit === dayLimit ? 'day_limit and task_limit (equal)' : 'day_limit';
  return {
    ...rule,
    started: true,
    start: window.start,
    record_creation_time: window.record_creation_time ?? null,
    window_number: window.window_number ?? 1,
    day_limit: iso(dayLimit),
    task_limit: taskLimit === null ? null : iso(taskLimit),
    tasks_counted: times.length,
    end_time: iso(end),
    governed_by: governedBy,
    as_of: asOfMs === null ? null : iso(asOfMs),
    end_condition_reached: asOfMs !== null && asOfMs >= end,
  };
}

// EXP-1, EXP-2: operational evidence inside the window ONLY. Each item must
// carry an explicit is_operational: true flag; anything else is excluded, not
// assumed operational. Record creation, fixtures, synthetic, pre-window, and
// pre-record evidence are never counted (EXP-2 applies under every reading).
export function exposureInWindow(window, evidence) {
  const rule = ruleOf(window);
  const exposure = [];
  const excluded = [];
  const items = Array.isArray(evidence) ? evidence : [];
  const start = window.started ? toMs(window.start) : null;
  const rc = toMs(window.record_creation_time);
  const end = toMs(window.end_time);
  for (const item of items) {
    const reason = exclusionReason(item, window, start, rc, end);
    if (reason) excluded.push({ item, reason });
    else exposure.push(item);
  }
  return { ...rule, exposure, excluded, dv3: DV3_MARKER };
}

function exclusionReason(item, window, start, rc, end) {
  if (!isPlainObject(item)) return 'not an evidence item';
  if (!window.started) return `watch not started (${window.message})`;
  if (NON_EXPOSURE_KINDS[item.kind]) return NON_EXPOSURE_KINDS[item.kind];
  if (item.synthetic === true || item.fixture === true) return 'synthetic or fixture evidence is never exposure (EXP-2)';
  if (isNonEmptyString(item.pointer) && /synthetic|fixtures\//i.test(item.pointer)) return 'pointer names synthetic or fixture evidence; never exposure (EXP-2)';
  if (item.is_operational !== true) return 'no explicit is_operational: true flag; evidence is never assumed operational (EXP-1)';
  if (!isNonEmptyString(item.pointer)) return 'link cannot be followed to specific evidence (EVL-3)';
  const t = toMs(item.timestamp);
  if (t === null) return 'no valid timestamp; cannot be placed inside the window';
  if (t < start) return 'pre-window evidence (EXP-2)';
  if (rc === null) return 'record creation time unknown; cannot show the evidence is post-record (EXP-2)';
  if (t < rc) return 'pre-record evidence (EXP-2, §7.2 (a))';
  if (end !== null && t > end) return 'after the window end';
  return null;
}

// §7.1 watch_outcome, in exactly this order:
// 1. recurrence_count >= 2 -> mandatory-deeper-review (WAT-6)
// 2. end condition NOT reached -> continue-watch (CR-01; DV-6 conjunctive)
// 3. end reached AND exposure empty -> extend-by-full-window (WAT-5)
// 4. end reached AND exposure non-empty AND elements complete -> eligible-for-validation-judgment
// 5. otherwise -> continue-watch
export function watchOutcome(window, exposure, recurrenceCount, validationElementsComplete) {
  const rule = ruleOf(window);
  if (!Number.isInteger(recurrenceCount) || recurrenceCount < 0) {
    throw new IncidentRefusal('BAD_INPUT', 'watch outcome refused: recurrence_count must be a non-negative integer');
  }
  const list = Array.isArray(exposure) ? exposure : (exposure?.exposure ?? []);
  const out = (outcome, note, extra = {}) => ({ ...rule, outcome, note, ...extra });
  if (recurrenceCount >= 2) {
    return out('mandatory-deeper-review', 'WAT-6 working threshold; meaning under cross-task counting OPEN (DV-9)', { marker: DEEPER_REVIEW_MARKER });
  }
  if (window.end_condition_reached !== true) {
    return out('continue-watch', 'end condition not reached; evidence mid-window never closes the watch early; exposure so far is provisional only (CR-01, DV-6)');
  }
  if (list.length === 0) {
    return out('extend-by-full-window', 'end reached with no in-window operational exposure: extend by a full 30-days-or-10-tasks window (WAT-5)');
  }
  if (validationElementsComplete === true) {
    return out('eligible-for-validation-judgment', 'eligibility is not validation; the sufficiency judgment must still be made and recorded (VAL-2)', { dv3: DV3_MARKER });
  }
  return out('continue-watch', 'end reached with exposure, but validation elements are not complete');
}

// WAT-5: extension by a FULL window, starting where the previous one ended.
// watchEnd and exposureInWindow are re-applied to the new window.
export function extendByFullWindow(endResult) {
  const rule = ruleOf(endResult);
  if (!endResult.started || endResult.end_condition_reached !== true) {
    throw new IncidentRefusal('NOT_ENDED', 'window extension refused: the current window has not reached its end condition (WAT-5)');
  }
  return {
    ...rule,
    started: true,
    start: endResult.end_time,
    record_creation_time: endResult.record_creation_time ?? null,
    window_number: (endResult.window_number ?? 1) + 1,
    extends_window_starting: endResult.start,
  };
}

// ---- §8 VAL-1 eligibility (conjunctive) ----

// Returns each element satisfied / not satisfied with its reason. `watch` is a
// watchEnd() result for this record. An incomplete record gets no verdict.
export function checkValidationEligibility(record, watch, { sufficiency_judgment } = {}) {
  const v = validateRecord(record);
  if (!v.complete) return { verdict: null, incomplete: true, eligible: false, problems: v.problems };

  const el = {};
  const set = (name, satisfied, reason, extra = {}) => { el[name] = { satisfied, reason, ...extra }; };
  let rule = null;
  let exposure = { exposure: [], excluded: [] };
  try {
    rule = ruleOf(watch);
    exposure = exposureInWindow(watch, record.exposure_evidence_link);
  } catch {
    rule = null;
  }

  // (a) window end condition reached (§7; CR-01; DV-6)
  if (!rule) set('a_window_end_reached', false, 'no named watch computation supplied (WAT-4)');
  else if (!watch.started) set('a_window_end_reached', false, watch.message ?? 'watch not started');
  else if (watch.end_condition_reached !== true) set('a_window_end_reached', false, `window end condition not reached (end ${watch.end_time}, as of ${watch.as_of ?? 'not given'}); absence of recurrence alone is never sufficient (CR-01, DV-6)`);
  else set('a_window_end_reached', true, `end reached (${watch.governed_by})`);

  // (b) operational evidence inside the window (EXP-1, EXP-2, §10)
  const n = exposure.exposure.length;
  set('b_operational_exposure_in_window', n > 0, n > 0 ? `${n} in-window operational item(s)` : 'no in-window operational evidence (EXP-1, EXP-2)', { excluded: exposure.excluded });

  // (c1) reproduced failure (DV-4: documented analysis alone does not satisfy)
  const re = record.reproduction_evidence;
  if (requirePointer(re) && re.kind === 'reproduced-failure') set('c1_reproduced_failure', true, 'reproduced failure recorded');
  else if (isPlainObject(re) && re.kind === 'documented-analysis') set('c1_reproduced_failure', false, 'a documented reproduction analysis without a reproduced failure does not satisfy this element (DV-4)');
  else set('c1_reproduced_failure', false, 'no reproduced failure recorded');

  // (c2) regression test fails before the fix AND passes after (DV-5)
  const rt = record.regression_test;
  const before = isPlainObject(rt) && requirePointer(rt.before) && rt.before.result === 'fail';
  const after = isPlainObject(rt) && requirePointer(rt.after) && rt.after.result === 'pass';
  if (before && after && isNonEmptyString(rt.id)) set('c2_regression_test_fail_before_pass_after', true, 'fails before the fix and passes after it');
  else if (after && !before) set('c2_regression_test_fail_before_pass_after', false, 'a passing post-fix result alone does not satisfy this element; no failing-before result (DV-5)');
  else set('c2_regression_test_fail_before_pass_after', false, 'no regression test with a failing-before and passing-after result (DV-5)');

  // (c3) independent verification, subject to D2 (H4, VAL-5)
  if (D2_ROLE_STATUS === 'PENDING') set('c3_independent_verification', false, `${D2_NOT_SATISFIED} (H4); the incident is NOT labeled independently validated`);
  else set('c3_independent_verification', false, 'D2 role decided, but no verification rule is implemented for it');

  // (c4) meaningful exposure: operative rules only; DV-3 NOT ENFORCED
  set('c4_meaningful_exposure', n > 0, n > 0
    ? 'in-window operational exposure present under the operative rules (EXP-1, EXP-2); DV-3 two-user condition NOT ENFORCED'
    : 'no in-window operational exposure', { dv3: DV3_MARKER });

  // (c5) sufficiency judgment text (VAL-2; judge role OPEN pending D2; H6)
  const sj = sufficiency_judgment ?? record.sufficiency_judgment;
  const sjOk = isPlainObject(sj) && isNonEmptyString(sj.text) && isNonEmptyString(sj.by) && toMs(sj.date) !== null;
  set('c5_sufficiency_judgment', sjOk, sjOk ? 'judgment text recorded' : 'no sufficiency judgment (text, by, date) recorded');

  // (c6) non-empty exposure-evidence link (AC-T2-2; EVL-1)
  const link = record.exposure_evidence_link;
  const linkOk = Array.isArray(link) && link.length > 0;
  set('c6_exposure_evidence_link', linkOk, linkOk ? 'non-empty' : 'exposure_evidence_link is empty or missing (EVL-1)');

  const failing = Object.keys(el).filter((k) => !el[k].satisfied);
  return {
    eligible: failing.length === 0,
    verdict: failing.length === 0 ? 'eligible-for-validation-judgment' : 'not-eligible',
    elements: el,
    failing,
    independently_validated: false,
    watch_rule: rule ?? 'no named watch computation supplied',
    dv3: DV3_MARKER,
    note: 'Eligibility is not validation (VAL-2). No incident reaches VALIDATED in Stage 3 (VAL-6).',
  };
}
