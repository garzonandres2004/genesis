// SIE schema, judgment, and INDEX consistency checks (Stage 3 T4).
// Implements docs/stage-3/00-sie-specification.md (0.4-draft) §12 (IDX-1..IDX-6),
// §9.2 (lesson record fields), §6.2 (incident record fields, via T2's
// validateRecord), §10 EVL-1, and §13 FXT-1 / IDX-4, as pure functions over
// plain in-memory objects. Brief §9 T4, AC-T4-1..AC-T4-3.
//
// THE LIMIT OF THESE TESTS (AC-T4-3, prep AC-P4-3, IDX-6):
// Passing on fixtures proves the test works, not that any real incident is
// handled correctly. Every result here is "test mechanics verified on
// fixtures", never "system verified". No input to these checks in Stage 3 is
// an operational record (FXT-1, FXT-2).
//
// STRUCTURE AND JUDGMENT ARE KEPT DISTINCT (AC-T4-1, prep AC-P4-1, H6 OPEN):
// - checkStructure / checkRecordStructure / checkIndex check STRUCTURE ONLY:
//   required fields present, status values in the allowed set, INDEX entries
//   matching record files, staged-section separation. They never read
//   judgment text, and their results carry no "validated", "sufficient", or
//   "judged" verdict. A structurally valid record is NOT thereby validated,
//   sufficient, or judged.
// - checkJudgment / checkJudgments check the REQUIRED JUDGMENT TEXT for
//   validation and sufficiency decisions: text present and non-empty, naming
//   who judged and when. They never call a structural check, and they never
//   report a judgment from structure: a record with no judgment text is never
//   "judged". The judge's identity/role is NOT checked (OPEN pending D2; H4).
//   A present judgment is not a correct judgment and is not a validation.
//
// READ-ONLY BOUNDARY: this module performs no file I/O. It reads only the
// objects and INDEX text passed to it and never mutates them. It creates no
// record location, writes no INDEX, and touches no Runner source record,
// tasks/, or events.jsonl. The record location is a WORKING ASSUMPTION (LOC-1;
// F-14 OPEN). Nothing here presumes the illustrative LOC-2 paths are decided:
// a record "file" is whatever path the caller supplies.
//
// IDX-5 DESIGN CHOICE (T4, not a spec requirement; IDX-5 OPEN, low-impact):
// detector-candidate records get NO INDEX entry. They are not lessons and not
// Sections 1-6 entries; a candidate referenced anywhere in Sections 1-6 fails.
//
// Section 2 is the primary home of a VALIDATED incident. §12 labels Section 2
// "optional cross-reference [P]"; Section 3 excludes VALIDATED, so no other
// section can hold one (T4 report, open items). No incident reaches VALIDATED
// in Stage 3 (VAL-6); the Section 2 path is exercised on hand-built SYNTHETIC
// literals only.

// Incident structure (the 24 §6.2 fields, status in OPEN/FIXED/WATCH/VALIDATED/
// REOPENED, history agreement) is T2's validateRecord, imported, not copied.
import { validateRecord } from './sie-incident.mjs';

export const TEST_LIMIT =
  'Passing on fixtures proves the test works, not that any real incident is handled correctly (AC-T4-3). ' +
  'Test mechanics verified on fixtures; system not verified.';

export const STRUCTURE_NOTE =
  'Structure only. A structurally valid record is NOT thereby validated, sufficient, or judged (AC-T4-1, H6, IDX-6).';

export const JUDGMENT_NOTE =
  'Judgment text only: present, non-empty, naming who judged and when. A present judgment is not a correct judgment ' +
  'and not a validation; the judge role is not checked (OPEN pending D2, H4). Never inferred from structure (AC-T4-1).';

export const IDX5_CHOICE =
  'T4 design choice (IDX-5 OPEN, low-impact; not a spec requirement): detector-candidate records get no INDEX entry; ' +
  'a detector candidate referenced in any of Sections 1-6 fails.';

// §9.2 lesson fields. VOC-5 states; CANDIDATE reserved and unused (VOC-6).
export const LESSON_STATES = Object.freeze(['UNVALIDATED-STAGED', 'VALIDATED']);
export const RESERVED_LESSON_STATES = Object.freeze(['CANDIDATE']);
export const LESSON_COMMON_FIELDS = Object.freeze([
  'lesson_id', 'status', 'source_incident_id', 'lesson_statement', 'applicability',
  'non_applicability', 'review_date', 'provenance',
]);
export const LESSON_STAGED_FIELDS = Object.freeze(['validation_claim', 'index_section', 'citation_use', 'counting']);
export const LESSON_VALIDATED_FIELDS = Object.freeze(['supersedes_staged_id', 'evidence_links', 'validation_reference', 'compounding_use']);
// Builder convention: LES-4 "superseded-by: <id>" is an appended note, never an edit.
export const LESSON_NOTE_FIELDS = Object.freeze(['annotations']);

export const RECORD_KINDS = Object.freeze(['incident', 'lesson', 'seed', 'detector-candidate']);

// §12. Sections 1-5 hold primary entries; Section 6 holds secondary references (IDX-2).
export const SECTIONS = Object.freeze({
  1: 'Validated lessons',
  2: 'Validated incidents',
  3: 'Incidents in WATCH / FIXED / OPEN / REOPENED',
  4: 'UNVALIDATED-STAGED lessons',
  5: 'Historical seed observations',
  6: 'Supersessions and corrections',
});
export const PRIMARY_SECTIONS = Object.freeze(['1', '2', '3', '4', '5']);
const WORKING_INCIDENT_STATES = ['OPEN', 'FIXED', 'WATCH', 'REOPENED']; // IDX-3

// ---- helpers ----

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isValidDate = (v) => isNonEmptyString(v) && !Number.isNaN(Date.parse(v));
const isEmptyValue = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
  || (Array.isArray(v) && v.length === 0) || (isPlainObject(v) && Object.keys(v).length === 0);
const problem = (code, message, extra = {}) => ({ code, message, ...extra });

const ID_FIELD = { incident: 'incident_id', lesson: 'lesson_id', seed: 'seed_id', 'detector-candidate': 'candidate_id' };

export function recordIdOf(desc) {
  const f = isPlainObject(desc) ? ID_FIELD[desc.kind] : undefined;
  const id = f && isPlainObject(desc.record) ? desc.record[f] : undefined;
  return isNonEmptyString(id) ? id : null;
}

// FXT-1 / IDX-4: a fixture is marked by its caller, lives under a fixtures/
// directory, or carries SYNTHETIC in its file name or id.
export function isFixture(desc) {
  if (!isPlainObject(desc)) return false;
  if (desc.fixture === true) return true;
  if (isNonEmptyString(desc.file) && (/(^|[\\/])fixtures[\\/]/.test(desc.file) || /SYNTHETIC/i.test(desc.file))) return true;
  const id = recordIdOf(desc);
  return id !== null && /SYNTHETIC/i.test(id);
}

const FIXTURE_POINTER = /synthetic|fixtures\//i;

// ---- structure (AC-T4-1: structure only) ----

// §6.2 via T2's validateRecord (exact field set, status in STATES,
// status-dependent fields, history agreement), plus the §6.2 / EVL-1 presence
// requirements for VALIDATED evidence fields. sufficiency_judgment is a
// judgment field: its key is required (validateRecord), its text is checked by
// checkJudgment only.
export function checkIncidentStructure(record) {
  const v = validateRecord(record);
  const problems = [...v.problems];
  if (isPlainObject(record) && record.status === 'VALIDATED') {
    const link = record.exposure_evidence_link;
    if (!Array.isArray(link) || link.length === 0) {
      problems.push('VALIDATED requires a non-empty exposure_evidence_link (EVL-1: empty = schema failure)');
    } else if (!link.every((i) => isPlainObject(i) && isNonEmptyString(i.pointer))) {
      problems.push('exposure_evidence_link: each item needs a non-empty pointer (EVL-1, EVL-3)');
    } else if (link.some((i) => i.fixture === true || i.synthetic === true || FIXTURE_POINTER.test(i.pointer))) {
      problems.push('exposure_evidence_link names fixture or synthetic evidence (EVL-1: fixture link = schema failure)');
    }
    for (const k of ['regression_test', 'reproduction_evidence', 'independent_verification']) {
      if (isEmptyValue(record[k])) problems.push(`missing required field "${k}" for VALIDATED (§6.2)`);
    }
  }
  return { valid: problems.length === 0, problems, limit: TEST_LIMIT };
}

// §9.2. Common fields, staged-only and validated-only rules, CR-02 (c).
export function checkLessonStructure(lesson) {
  if (!isPlainObject(lesson)) return { valid: false, problems: ['lesson record is not an object'], limit: TEST_LIMIT };
  const problems = [];
  const allowed = [...LESSON_COMMON_FIELDS, ...LESSON_STAGED_FIELDS, ...LESSON_VALIDATED_FIELDS, ...LESSON_NOTE_FIELDS];
  for (const k of Object.keys(lesson)) if (!allowed.includes(k)) problems.push(`unknown field "${k}" (§9.2 fields only)`);
  for (const k of ['lesson_id', 'source_incident_id', 'lesson_statement', 'applicability']) {
    if (!isNonEmptyString(lesson[k])) problems.push(`missing required field "${k}"`);
  }
  if (!isNonEmptyString(lesson.non_applicability)) {
    problems.push('missing required field "non_applicability": empty = schema failure, for either kind (§9.2, CR-02 (c))');
  }
  if (!isValidDate(lesson.review_date)) problems.push('missing required field "review_date" (a valid date)');
  if (isEmptyValue(lesson.provenance)) problems.push('missing required field "provenance"');
  if (lesson.annotations !== undefined && !Array.isArray(lesson.annotations)) problems.push('annotations must be an append-only list (LES-4)');

  const s = lesson.status;
  if (RESERVED_LESSON_STATES.includes(s)) {
    problems.push(`status "${s}" is reserved and unused until defined (VOC-6, IDX-5); not an allowed lesson status`);
  } else if (!LESSON_STATES.includes(s)) {
    problems.push(`status ${JSON.stringify(s)} is not one of ${LESSON_STATES.join(', ')} (VOC-5)`);
  }

  if (s === 'UNVALIDATED-STAGED') {
    if (lesson.validation_claim !== 'NONE') problems.push('staged lesson requires validation_claim = "NONE" (LES-2, §9.2)');
    if (lesson.index_section !== 'unvalidated-staged') problems.push('staged lesson requires index_section = "unvalidated-staged" (LES-2, §9.2)');
    for (const k of LESSON_VALIDATED_FIELDS) {
      if (!isEmptyValue(lesson[k])) problems.push(`staged lesson carries validated-only field "${k}" (§9.2)`);
    }
  }
  if (s === 'VALIDATED') {
    const links = lesson.evidence_links;
    if (!Array.isArray(links) || links.length === 0
      || !links.every((l) => isNonEmptyString(l) || (isPlainObject(l) && isNonEmptyString(l.pointer)))) {
      problems.push('validated lesson requires non-empty evidence_links, each a specific pointer (§9.2, EVL-1)');
    }
    const ref = lesson.validation_reference;
    if (!isPlainObject(ref) || !isNonEmptyString(ref.incident_id)) {
      problems.push('validated lesson requires validation_reference naming the validated incident (§9.2, LES-3)');
    }
    if (lesson.supersedes_staged_id !== undefined && lesson.supersedes_staged_id !== null) {
      if (!isNonEmptyString(lesson.supersedes_staged_id)) problems.push('supersedes_staged_id must be a non-empty id when present');
      else if (lesson.supersedes_staged_id === lesson.lesson_id) problems.push('a validated lesson never reuses the staged lesson id (LES-4)');
    }
    if (lesson.validation_claim === 'NONE') problems.push('validated lesson carries the staged-only validation_claim "NONE" (§9.2)');
    if (lesson.index_section === 'unvalidated-staged') problems.push('validated lesson carries the staged-only index_section (§9.2)');
  }
  return { valid: problems.length === 0, problems, limit: TEST_LIMIT };
}

// Seed records are drafted in T5; T4 checks only what the INDEX needs.
function checkSeedStructure(seed) {
  const problems = [];
  if (!isPlainObject(seed) || !isNonEmptyString(seed.seed_id)) problems.push('missing required field "seed_id"');
  else if (seed.status === 'VALIDATED') problems.push('a seed record is never VALIDATED (§12 Section 5: fixed is not validated)');
  return { valid: problems.length === 0, problems };
}

function checkCandidateStructure(cand) {
  const ok = isPlainObject(cand) && isNonEmptyString(cand.candidate_id);
  return { valid: ok, problems: ok ? [] : ['missing required field "candidate_id" (DET-8)'] };
}

const STRUCTURE_BY_KIND = {
  incident: checkIncidentStructure,
  lesson: checkLessonStructure,
  seed: checkSeedStructure,
  'detector-candidate': checkCandidateStructure,
};

// desc: { file, kind, record, fixture? } — one record file.
export function checkRecordStructure(desc) {
  if (!isPlainObject(desc)) return { file: null, id: null, valid: false, problems: ['record descriptor is not an object'], limit: TEST_LIMIT };
  const problems = [];
  if (!isNonEmptyString(desc.file)) problems.push('record descriptor needs a file path');
  if (!RECORD_KINDS.includes(desc.kind)) problems.push(`unknown record kind ${JSON.stringify(desc.kind)} (one of ${RECORD_KINDS.join(', ')})`);
  else problems.push(...STRUCTURE_BY_KIND[desc.kind](desc.record).problems);
  return { file: desc.file ?? null, id: recordIdOf(desc), valid: problems.length === 0, problems, limit: TEST_LIMIT };
}

// ---- INDEX (IDX-1..IDX-5) ----

// Parses INDEX Markdown. Builder convention (§12 fixes sections, not line
// syntax): "## Section N: ..." headings; entries are "- " list items whose
// first two `backticked` tokens are, in Sections 1-5, the record id and the
// record file, and in Section 6, the superseded id and the superseding id.
// Other "## " headings become unknown section keys, and list items before any
// section are returned as stray; checkIndex refuses both.
export function parseIndex(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('parseIndex: INDEX text must be a string');
  const sections = {};
  const stray = [];
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const h = /^##\s+(.*\S)\s*$/.exec(line);
    if (h) {
      const m = /^Section\s+([^:\s]+)/i.exec(h[1]);
      current = m ? m[1] : h[1];
      sections[current] ??= [];
      continue;
    }
    if (!/^\s*[-*]\s+/.test(line)) continue;
    const tokens = [...line.matchAll(/`([^`]*)`/g)].map((t) => t[1]);
    if (current === null) { stray.push(line.trim()); continue; }
    sections[current].push(current === '6'
      ? { superseded_id: tokens[0] ?? null, superseding_id: tokens[1] ?? null }
      : { id: tokens[0] ?? null, file: tokens[1] ?? null });
  }
  return { sections, stray };
}

function placement(desc, section) {
  const id = recordIdOf(desc);
  const st = desc.record?.status;
  if (section === '1' && desc.kind === 'lesson' && st === 'UNVALIDATED-STAGED') {
    return problem('STAGED_IN_SECTION_1', `staged record ${id} in Section 1 (Validated lessons) refused: staged entries appear only in Section 4 (IDX-1, LES-2, AC-T4-2)`);
  }
  if (section === '4' && st === 'VALIDATED') {
    return problem('VALIDATED_IN_SECTION_4', `validated record ${id} in Section 4 (UNVALIDATED-STAGED) refused (IDX-1, AC-T4-2)`);
  }
  const ok = (section === '1' && desc.kind === 'lesson' && st === 'VALIDATED')
    || (section === '2' && desc.kind === 'incident' && st === 'VALIDATED')
    || (section === '3' && desc.kind === 'incident' && WORKING_INCIDENT_STATES.includes(st))
    || (section === '4' && desc.kind === 'lesson' && st === 'UNVALIDATED-STAGED')
    || (section === '5' && desc.kind === 'seed');
  return ok ? null : problem('WRONG_SECTION', `${desc.kind} ${id} with status ${JSON.stringify(st)} does not belong in Section ${section} (${SECTIONS[section]}) (§12, IDX-1, IDX-3)`);
}

// index: { sections: { '1': [{ id, file }], ..., '6': [{ superseded_id, superseding_id }] }, stray? }
// records: [{ file, kind, record, fixture? }] — the record files the INDEX must match.
// "Exists" means present in the supplied record set; the caller supplies it.
export function checkIndex({ records, index } = {}) {
  const problems = [];
  const recs = Array.isArray(records) ? records.filter(isPlainObject) : [];
  if (!Array.isArray(records)) problems.push(problem('BAD_INPUT', 'records must be a list of record descriptors'));
  if (!isPlainObject(index) || !isPlainObject(index.sections)) {
    problems.push(problem('BAD_INDEX', 'index must be { sections: { ... } }'));
    return { consistent: false, problems, idx5_choice: IDX5_CHOICE, limit: TEST_LIMIT };
  }
  for (const s of index.stray ?? []) problems.push(problem('STRAY_ENTRY', `INDEX entry outside any section: ${s}`));

  const byFile = new Map();
  const byId = new Map();
  for (const d of recs) {
    if (byFile.has(d.file)) problems.push(problem('DUPLICATE_RECORD_FILE', `record file ${d.file} supplied twice`, { file: d.file }));
    byFile.set(d.file, d);
    const id = recordIdOf(d);
    if (id !== null) {
      if (byId.has(id)) problems.push(problem('DUPLICATE_RECORD_ID', `record id ${id} appears in two files`, { id }));
      byId.set(id, d);
    }
    if (isFixture(d)) {
      problems.push(problem('FIXTURE_IN_RECORD_SET', `fixture ${d.file} is in the record set under test; fixtures live only in the separate fixture location (FXT-1, IDX-4)`, { file: d.file }));
    }
  }

  const primaryCount = new Map(recs.map((d) => [d, 0]));
  for (const [key, entries] of Object.entries(index.sections)) {
    if (!Object.hasOwn(SECTIONS, key)) {
      const why = /candidate/i.test(key) ? ' (no CANDIDATE section exists until CANDIDATE is defined, IDX-5, VOC-6)' : '';
      problems.push(problem('UNKNOWN_SECTION', `unknown INDEX section ${JSON.stringify(key)}${why}; sections are 1-6 (§12)`, { section: key }));
      continue;
    }
    // Fix round 1 (F-T4-1): a section value must be a list of entries. Any
    // other value is refused, never discarded as an empty section.
    if (!Array.isArray(entries)) {
      problems.push(problem('MALFORMED_SECTION', `Section ${key} must be a list of entries, got ${JSON.stringify(entries)}; its content is neither resolved nor counted (§12)`, { section: key }));
      continue;
    }
    for (const e of entries) {
      if (key === '6') { checkSupersession(e, byId, problems); continue; }
      if (!isPlainObject(e) || !isNonEmptyString(e.id) || !isNonEmptyString(e.file)) {
        problems.push(problem('MALFORMED_ENTRY', `Section ${key} entry needs an id and a record file: ${JSON.stringify(e)}`, { section: key }));
        continue;
      }
      const d = byFile.get(e.file);
      if (!d) {
        problems.push(problem('UNRESOLVED_ENTRY', `Section ${key} entry ${e.id} -> ${e.file} does not resolve to an existing record file (IDX-1)`, { section: key, id: e.id }));
        continue;
      }
      primaryCount.set(d, primaryCount.get(d) + 1);
      if (recordIdOf(d) !== e.id) {
        problems.push(problem('ID_MISMATCH', `Section ${key} entry id ${e.id} does not match the record id ${recordIdOf(d)} of ${e.file}`, { section: key, id: e.id }));
      }
      if (isFixture(d)) {
        problems.push(problem('FIXTURE_IN_INDEX', `fixture ${e.file} has an entry in Section ${key}; fixtures never appear in Sections 1-3 or any operational INDEX (IDX-4, FXT-1)`, { section: key, id: e.id }));
      }
      if (d.kind === 'detector-candidate') {
        problems.push(problem('CANDIDATE_IN_INDEX', `detector candidate ${e.id} has an entry in Section ${key}. ${IDX5_CHOICE}`, { section: key, id: e.id }));
        continue;
      }
      const p = placement(d, key);
      if (p) problems.push({ ...p, section: key, id: e.id });
    }
  }

  // IDX-1: exactly one primary entry per record file. Section 6 references never
  // count (IDX-2). Detector candidates get none (IDX-5 choice). Fixtures in the
  // set are already refused above.
  for (const [d, n] of primaryCount) {
    if (d.kind === 'detector-candidate' || isFixture(d)) continue;
    const id = recordIdOf(d) ?? d.file;
    if (n === 0) problems.push(problem('NO_PRIMARY_ENTRY', `record file ${d.file} (${id}) has no primary INDEX entry in Sections 1-5; Section 6 references are secondary and do not count (IDX-1, IDX-2)`, { id }));
    if (n > 1) problems.push(problem('MULTIPLE_PRIMARY_ENTRIES', `record file ${d.file} (${id}) has ${n} primary INDEX entries; exactly one is required (IDX-1)`, { id }));
  }
  return { consistent: problems.length === 0, problems, idx5_choice: IDX5_CHOICE, limit: TEST_LIMIT };
}

// IDX-2: Section 6 entries are secondary references. Each id must resolve to a
// record in the set; a candidate or fixture may not be referenced.
function checkSupersession(e, byId, problems) {
  if (!isPlainObject(e) || !isNonEmptyString(e.superseded_id) || !isNonEmptyString(e.superseding_id)) {
    problems.push(problem('MALFORMED_ENTRY', `Section 6 reference needs a superseded id and a superseding id: ${JSON.stringify(e)}`, { section: '6' }));
    return;
  }
  for (const id of [e.superseded_id, e.superseding_id]) {
    const d = byId.get(id);
    if (!d) problems.push(problem('UNRESOLVED_REFERENCE', `Section 6 reference ${id} does not resolve to a record in the set (IDX-1, IDX-2)`, { section: '6', id }));
    else if (d.kind === 'detector-candidate') problems.push(problem('CANDIDATE_IN_INDEX', `detector candidate ${id} referenced in Section 6. ${IDX5_CHOICE}`, { section: '6', id }));
    else if (isFixture(d)) problems.push(problem('FIXTURE_IN_INDEX', `fixture ${id} referenced in Section 6 (IDX-4, FXT-1)`, { section: '6', id }));
  }
}

// The schema test: per-record structure plus INDEX consistency. Structure only.
export function checkStructure({ records, index } = {}) {
  const recordResults = (Array.isArray(records) ? records : []).map(checkRecordStructure);
  const indexResult = checkIndex({ records, index });
  return {
    structurally_valid: recordResults.every((r) => r.valid) && indexResult.consistent,
    records: recordResults,
    index: indexResult,
    note: STRUCTURE_NOTE,
    limit: TEST_LIMIT,
  };
}

// ---- judgment (AC-T4-1: required judgment text, never inferred from structure) ----

function judgmentGaps(name, j) {
  if (!isPlainObject(j)) return [`${name}: no judgment recorded (text, by, date)`];
  const gaps = [];
  if (!isNonEmptyString(j.text)) gaps.push(`${name}.text: judgment text missing or empty`);
  if (!isNonEmptyString(j.by)) gaps.push(`${name}.by: who judged is missing`);
  if (!isValidDate(j.date)) gaps.push(`${name}.date: when it was judged is missing or not a date`);
  return gaps;
}

// Every judgment result path (checkIncidentJudgment, checkLessonJudgment,
// checkJudgment, including early returns) goes through here and carries the limit.
const result = (outcome, missing = []) => ({ outcome, judged: outcome === 'JUDGMENT_PRESENT', missing, limit: TEST_LIMIT });

// Incident: a validation decision (a history entry to VALIDATED, or status
// VALIDATED) requires the validation judgment (that entry's reason, by, date)
// AND the §6.2 sufficiency_judgment (text, by, date). A recorded sufficiency
// judgment on any record must itself be complete. No decision -> not judged.
export function checkIncidentJudgment(record) {
  if (!isPlainObject(record)) return result('NO_DECISION_RECORDED');
  const history = Array.isArray(record.history) ? record.history : [];
  const validations = history.filter((h) => isPlainObject(h) && h.to === 'VALIDATED');
  const sj = record.sufficiency_judgment;
  const validationDecision = record.status === 'VALIDATED' || validations.length > 0;
  if (!validationDecision && isEmptyValue(sj)) return result('NO_DECISION_RECORDED');
  const missing = judgmentGaps('sufficiency_judgment', sj);
  if (validationDecision) {
    if (validations.length === 0) missing.push('validation judgment: no history entry records the VALIDATED decision');
    for (const h of validations) {
      missing.push(...judgmentGaps(`validation judgment (history seq ${h.seq})`, { text: h.reason, by: h.by, date: h.date }));
    }
  }
  return result(missing.length ? 'JUDGMENT_MISSING' : 'JUDGMENT_PRESENT', missing);
}

// Lesson: validated-lesson creation is a validation decision; it requires the
// validated incident's sufficiency judgment in validation_reference (LES-3,
// §9.2). Staging is not a validation decision (validation_claim NONE, LES-2).
export function checkLessonJudgment(lesson) {
  if (!isPlainObject(lesson) || lesson.status !== 'VALIDATED') return result('NO_DECISION_RECORDED');
  const ref = isPlainObject(lesson.validation_reference) ? lesson.validation_reference : {};
  const missing = judgmentGaps('validation_reference.sufficiency_judgment', ref.sufficiency_judgment);
  return result(missing.length ? 'JUDGMENT_MISSING' : 'JUDGMENT_PRESENT', missing);
}

export function checkJudgment(desc) {
  const id = recordIdOf(desc);
  const base = { file: isPlainObject(desc) ? desc.file ?? null : null, id };
  if (isPlainObject(desc) && desc.kind === 'incident') return { ...base, ...checkIncidentJudgment(desc.record) };
  if (isPlainObject(desc) && desc.kind === 'lesson') return { ...base, ...checkLessonJudgment(desc.record) };
  return { ...base, ...result('NOT_APPLICABLE') };
}

// The judgment test over a record set. It never passes vacuously: a set with
// no recorded validation/sufficiency decision is NO_DECISIONS_TO_JUDGE, not a pass.
export function checkJudgments(records) {
  const results = (Array.isArray(records) ? records : []).map(checkJudgment);
  const decisions = results.filter((r) => r.outcome === 'JUDGMENT_PRESENT' || r.outcome === 'JUDGMENT_MISSING');
  let outcome = 'NO_DECISIONS_TO_JUDGE';
  if (decisions.length) outcome = decisions.some((r) => r.outcome === 'JUDGMENT_MISSING') ? 'JUDGMENT_TEXT_MISSING' : 'JUDGMENT_TEXT_COMPLETE';
  return { outcome, decisions_checked: decisions.length, results, note: JUDGMENT_NOTE, limit: TEST_LIMIT };
}
