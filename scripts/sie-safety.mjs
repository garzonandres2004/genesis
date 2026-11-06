// SIE safety / negative tests — Group B refusal and downgrade functions
// (Stage 3 T6, spec 0.5-draft §14.2). A pure module: no file I/O, no network,
// no imports from the T2/T4/T7 modules (the N-VAL and N-LES refusals already
// enforced there are exercised through those modules by the test file, not
// re-implemented here). It implements ONLY the refusal/downgrade functions
// that do not already exist: N-HIST, N-REU, N-EVAL, GOV — plus one thin
// named check for the single specified N-VAL refusal no existing function
// enforces (S-T6-5).
//
// EVIDENCE LEVEL (EVL-7): fixture tests are evidence level Component
// ("Unit tests, controlled fixtures, and isolated component behavior"); this
// module is evidence level Structural. Nothing here is Operational or
// Outcome. A passing test on fixtures is "test mechanics verified on
// fixtures", never "system verified" (FXT-1/FXT-2).
//
// ASSUMPTIONS MARKED (do not treat as decided):
// - Legitimate-task-only reuse rule (N-REU): designed against the PROPOSED
//   rule that reuse evidence comes only from a legitimate task citing a
//   validated lesson (REU-2). "There is no prescribed reuse task [REF]" stays
//   UNVERIFIED (DV-7, C-19); this module must NOT invent a prescribed reuse
//   task. F-36 (reuse judgment) is NOT decided here.
// - D2 operational verifier role is PENDING: independent verification can
//   never be satisfied while it is pending (VAL-5, H4).
// - DV-8 / C-20 OPEN: no grouping is assumed for WP-04 VAL-1/VAL-2. No
//   N-VAL result claims to satisfy them as Group A/B rows, nor treats them
//   as deferred Group C.
// - C-16 / DV-3 OPEN: no result claims WP-04's two-user meaningful-exposure
//   condition is satisfied.
// - No validated lesson is created (LES-8). No incident reaches VALIDATED
//   (VAL-6). No compounding change occurs (CMP-1). No reuse is demonstrated
//   (REU-2). No Group C test is designed as passable (§14.3).
//
// SILENT-SPEC DECISIONS (see the T6 builder report for the full list):
// - S-T6-1: N-EVAL outcome mapping (staged-lesson-only REFUSED,
//   unvalidated-incident-only DOWNGRADED, no-lesson REFUSED).
// - S-T6-2: N-REU clean case returns NO_REFUSAL with reuse_demonstrated
//   false; the negative checks are necessary, not sufficient (F-36 OPEN).
// - S-T6-3: GOV outcome mapping (governance/scope-expansion without
//   approval HELD_PENDING_FOUNDER_DECISION; waiver by builder/verifier
//   REFUSED).
// - S-T6-4: recorded Founder approval shape { recorded: true,
//   by: "Founder", reference: non-empty, date: valid }.
// - S-T6-5: N-VAL (f) thin check is a SHAPE check only (no I/O can follow a
//   link); it refuses empty/placeholder/fixture/whole-repo/whole-log-file/
//   directory/general-claim pointers.
// - S-T6-6: N-HIST takes a validation-attempt descriptor (seed records carry
//   no creation time or incident fields, T5).
// - S-T6-7: N-REU applicability is caller-judged (within_applicability);
//   missing judgment is a refusal.
// - S-T6-8: N-EVAL refuses a validated-lesson citation as a Group C guard.
// - S-T6-9: a waiver passes only on a recorded Founder approval granted by
//   the Founder; a bare granted_by claim is never approval.
// - S-T6-10: N-LES (d) in-place promotion has no API to refuse; enforcement
//   is the frozen staged record + WRONG_STATUS + STAGED_IN_SECTION_1.

export const EVIDENCE_LEVEL = 'Component (fixture tests); Structural (this module). Nothing here is Operational or Outcome (EVL-7).';

// The legitimate-task-only rule N-REU is designed against, with its
// provenance marked. The "no prescribed reuse task" statement is [REF] and
// stays UNVERIFIED (DV-7, C-19); this module invents no prescribed task.
export const LEGITIMATE_TASK_ASSUMPTION = Object.freeze({
  rule: 'Reuse evidence comes only from a legitimate task citing a validated lesson, within its applicability (REU-2, proposed legitimate-task-only rule, H2 OPEN).',
  prescribed_reuse_task: 'UNVERIFIED [REF] (DV-7, C-19): "There is no prescribed reuse task" is not verified verbatim; a task created primarily to produce a reuse metric is not proof of organic learning.',
  decided: 'Nothing here decides F-36 (reuse judgment). N-REU tests refusal only; it demonstrates no reuse.',
});

export const TEST_LIMIT =
  'Every Group B result here is a refusal, hold, or downgrade on SYNTHETIC fixtures or draft-record descriptors — never a validation, lesson, reuse, or improvement.';

export class SafetyRefusal extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SafetyRefusal';
    this.code = code;
    this.details = details;
  }
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isValidDate = (v) => isNonEmptyString(v) && !Number.isNaN(Date.parse(v));

function badInput(what) {
  throw new SafetyRefusal('BAD_INPUT', `${what} refused: input must be an object naming the attempt (§14.2)`);
}

// ---- N-VAL (f): unverifiable evidence link (EVL-3) — the one thin check ----
//
// GAP FOUND (stated explicitly, per the T6 brief): T2's exposureInWindow
// refuses only the EMPTY-pointer case ("link cannot be followed to specific
// evidence (EVL-3)"). A NON-EMPTY but general pointer — a whole repository,
// a whole log file, a directory, or a general claim — is counted as exposure
// by T2, although EVL-3 says "a link that cannot be followed to the specific
// evidence is treated as missing" and a specific record, event, commit, test
// result, or log entry is required. This thin named check closes that gap.
// It is a SHAPE check only (S-T6-5): this module performs no I/O and cannot
// truly follow a link. A pointer passes only when it names a specific item:
// a `#` fragment or `?` query naming an entry, a commit-hash-like segment
// (7-40 hex chars), an id segment (numeric, or INC-/LES-/CAND-/record-/
// event-/test-/run-/task-/incident-/lesson-prefixed), a file path naming a
// specific file, or a `:line`/`:entry` suffix. Everything else — empty,
// placeholder, fixture/synthetic, whole repository, whole log file,
// directory, bare host, general claim — is refused as unverifiable.

const PLACEHOLDER_POINTERS = new Set(['todo', 'tbd', 'placeholder', 'example', 'n/a', 'none', 'null']);

function stripScheme(pointer) {
  const m = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/(.*)$/.exec(pointer);
  return m ? m[1] : pointer;
}

function hasSpecificItemMarker(pointer) {
  if (pointer.includes('#') || pointer.includes('?')) return true;
  const rest = stripScheme(pointer);
  // The first segment after stripping the scheme is the host, not an item:
  // "github.com" must not count as a specific file. Only later segments can
  // name the specific record, event, commit, test result, or log entry.
  const segments = rest.split('/').filter((s) => s !== '').slice(1);
  for (const seg of segments) {
    if (seg.includes(':')) return true; // :line / :entry suffix (e.g. app.log:4521)
    const base = seg.split(':')[0];
    if (/^[0-9a-f]{7,40}$/i.test(base)) return true; // commit-hash-like
    if (/^\d+$/.test(base)) return true; // numeric id
    if (/^(INC-|LES-|CAND-|record-|event-|test-|run-|task-|incident-|lesson-)/i.test(base)) return true;
    if (/\.[a-zA-Z0-9]{2,}$/.test(base) && !/\.log$/i.test(base)) return true; // specific file (a .log alone is a whole log file, refused above)
  }
  return false;
}

export function refuseUnverifiableEvidenceLink(link) {
  const pointer = isPlainObject(link) ? link.pointer : link;
  const what = 'evidence link';
  if (!isNonEmptyString(pointer)) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: the link is empty; a link that cannot be followed to specific evidence is treated as missing (EVL-3)`);
  }
  const p = pointer.trim();
  if (PLACEHOLDER_POINTERS.has(p.toLowerCase())) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: the pointer ${JSON.stringify(p)} is a placeholder, not a specific record, event, commit, test result, or log entry (EVL-3)`);
  }
  if (/synthetic|fixtures?\//i.test(p)) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: fixture or synthetic evidence is never exposure (EXP-2, EVL-2); pointer ${JSON.stringify(p)} names fixture/synthetic evidence`);
  }
  if (p.endsWith('/')) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: pointer ${JSON.stringify(p)} names a directory, not a specific record, event, commit, test result, or log entry (EVL-3)`);
  }
  const rest = stripScheme(p);
  if (!rest.includes('/')) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: pointer ${JSON.stringify(p)} is a bare host or general claim with no specific item (EVL-3)`);
  }
  if (/\.log$/i.test(p)) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: pointer ${JSON.stringify(p)} names a whole log file, not a specific log entry (EVL-3)`);
  }
  if (!hasSpecificItemMarker(p)) {
    throw new SafetyRefusal('UNVERIFIABLE_EVIDENCE_LINK',
      `${what} refused: pointer ${JSON.stringify(p)} names only a whole repository or general location; it cannot be followed to a specific record, event, commit, test result, or log entry (EVL-3)`);
  }
  return { verifiable: true, pointer: p, basis: 'names a specific record, event, commit, test result, or log entry (EVL-3); shape check only, the link was not followed (no I/O)' };
}

// ---- N-HIST: seed-record refusal (spec §14.2, §12 Section 5) ----
//
// A seed record is historical evidence, never an incident record (§6.2) and
// never VALIDATED. Every validation attempt on one is refused; this function
// never returns a validated seed — it throws on every path. The descriptor
// is a plain object (S-T6-6); the module never reads seed Markdown files.
//   { seed_id, corpus_item, status, recorded_at?, attempt: {
//       kind: 'validate-by-fix' | 'validate-by-evidence' | 'relabel-to-validated',
//       fix?: { merged?: boolean, reference?: string },
//       evidence?: { pointer?, timestamp?, kind?: 'pre-record' | 'operational', pre_record?: boolean },
//       target_status?: string, recorded_at? } }

function isPreRecordEvidence(evidence, recordedAt) {
  if (!isPlainObject(evidence)) return false;
  if (evidence.pre_record === true) return true;
  if (evidence.kind === 'pre-record') return true;
  const t = Date.parse(evidence.timestamp ?? '');
  const r = Date.parse(recordedAt ?? '');
  return !Number.isNaN(t) && !Number.isNaN(r) && t < r;
}

export function refuseSeedValidation(desc) {
  if (!isPlainObject(desc)) badInput('seed validation');
  if (!isNonEmptyString(desc.seed_id)) {
    throw new SafetyRefusal('BAD_INPUT', 'seed validation refused: the descriptor must name a seed_id (§12 Section 5)');
  }
  const id = desc.seed_id;
  if (desc.status === 'VALIDATED') {
    throw new SafetyRefusal('SEED_NEVER_VALIDATED',
      `seed validation refused: seed record ${id} carries status VALIDATED; a seed record is never VALIDATED (§12 Section 5: fixed is not validated; no retroactive validation)`,
      { seed_id: id });
  }
  const attempt = desc.attempt;
  if (!isPlainObject(attempt) || !isNonEmptyString(attempt.kind)) {
    throw new SafetyRefusal('BAD_INPUT', `seed validation refused: the attempt on ${id} must name its kind: "validate-by-fix" | "validate-by-evidence" | "relabel-to-validated"`);
  }
  if (attempt.kind === 'relabel-to-validated' || attempt.target_status === 'VALIDATED') {
    throw new SafetyRefusal('SEED_NEVER_VALIDATED',
      `seed validation refused: in-place relabeling of seed record ${id} to VALIDATED is refused; a seed record is never VALIDATED and is never upgraded in place (§12 Section 5, VAL-3)`,
      { seed_id: id });
  }
  if (attempt.kind === 'validate-by-fix') {
    if (isPlainObject(attempt.fix) && attempt.fix.merged === true) {
      throw new SafetyRefusal('SEED_FIX_NOT_VALIDATION',
        `seed validation refused: seed record ${id} cites only its already-merged historical fix; already-merged fixes are fixed, not validated; no retroactive validation is claimed (§12 Section 5)`,
        { seed_id: id });
    }
    throw new SafetyRefusal('SEED_FIX_NOT_VALIDATION',
      `seed validation refused: seed record ${id} offers no already-merged fix as a basis, and a seed record cannot be validated in any case (§12 Section 5: fixed is not validated; no retroactive validation)`,
      { seed_id: id });
  }
  if (attempt.kind === 'validate-by-evidence') {
    const recordedAt = attempt.recorded_at ?? desc.recorded_at;
    if (isPreRecordEvidence(attempt.evidence, recordedAt)) {
      throw new SafetyRefusal('SEED_PRE_RECORD_EVIDENCE',
        `seed validation refused: pre-record operational evidence offered as exposure for seed record ${id} is refused; pre-record evidence is never exposure (EXP-2, §7.2 (a)); a seed record has no watch window and no incident status to attach exposure to`,
        { seed_id: id });
    }
    throw new SafetyRefusal('SEED_NO_EXPOSURE',
      `seed validation refused: evidence offered as exposure for seed record ${id} is refused; a seed record is historical evidence, not an incident record (§6.2) — it has no watch window, so no evidence can be in-window exposure for it (EXP-1, EXP-2)`,
      { seed_id: id });
  }
  throw new SafetyRefusal('BAD_INPUT', `seed validation refused: unknown attempt kind ${JSON.stringify(attempt.kind)} on ${id}`);
}

// ---- N-REU: reuse refusal (spec §14.2, §16 REU-1/REU-2) ----
//
// Refuses (a) reuse claimed from a staged lesson; (b) reuse with no task
// (manufactured or prescribed reuse task); (c) reuse outside the lesson's
// applicability. Designed against the proposed legitimate-task-only rule,
// with the assumption marked (LEGITIMATE_TASK_ASSUMPTION above; DV-7, C-19
// unverified). The clean case returns NO_REFUSAL — NOT a reuse demonstration
// (S-T6-2): REU-1 judgment (independent verifier + authorized human) is OPEN
// (F-36), and no reuse is demonstrated in Stage 3 (REU-2).
//   { lesson: { lesson_id, status, applicability?, non_applicability? },
//     task?: { task_id?, legitimate?: boolean, created_to_produce_reuse_metric?: boolean } | null,
//     within_applicability?: boolean }

const noReuse = (outcome, reason, extra = {}) => ({
  outcome, reuse_demonstrated: false, reason, ...extra,
});

export function refuseReuseClaim(claim) {
  if (!isPlainObject(claim)) badInput('reuse claim');
  const lesson = claim.lesson;
  if (!isPlainObject(lesson) || !isNonEmptyString(lesson.lesson_id)) {
    throw new SafetyRefusal('BAD_INPUT', 'reuse claim refused: the claim must name a lesson (lesson_id, status)');
  }
  if (lesson.status === 'UNVALIDATED-STAGED') {
    return noReuse('REFUSED',
      `reuse refused: lesson ${lesson.lesson_id} is UNVALIDATED-STAGED; a staged lesson is never reuse evidence — it never counts toward reuse evidence (REU-2, LES-2)`,
      { rule: 'N-REU (a)', lesson_id: lesson.lesson_id });
  }
  if (lesson.status !== 'VALIDATED') {
    return noReuse('REFUSED',
      `reuse refused: lesson ${lesson.lesson_id} has status ${JSON.stringify(lesson.status)}, not VALIDATED; reuse evidence comes only from a validated lesson (REU-2)`,
      { rule: 'N-REU (a)', lesson_id: lesson.lesson_id });
  }
  const task = claim.task;
  if (!isPlainObject(task) || !isNonEmptyString(task.task_id)) {
    return noReuse('REFUSED',
      `reuse refused: no task is named; reuse evidence comes only from a legitimate task citing a validated lesson (REU-2, legitimate-task-only rule). There is no prescribed reuse task [REF, UNVERIFIED — DV-7, C-19]; preparation must not invent one`,
      { rule: 'N-REU (b)', lesson_id: lesson.lesson_id });
  }
  if (task.created_to_produce_reuse_metric === true) {
    return noReuse('REFUSED',
      `reuse refused: task ${task.task_id} was created primarily to produce a reuse metric; a task created primarily to produce a reuse metric is not proof of organic learning (§2.9, DV-7)`,
      { rule: 'N-REU (b)', lesson_id: lesson.lesson_id, task_id: task.task_id });
  }
  if (task.legitimate === false) {
    return noReuse('REFUSED',
      `reuse refused: task ${task.task_id} is not a legitimate task; reuse evidence comes only from a legitimate task (REU-2)`,
      { rule: 'N-REU (b)', lesson_id: lesson.lesson_id, task_id: task.task_id });
  }
  if (claim.within_applicability === false) {
    return noReuse('REFUSED',
      `reuse refused: the claimed reuse of lesson ${lesson.lesson_id} is outside the lesson's applicability (non_applicability: ${isNonEmptyString(lesson.non_applicability) ? lesson.non_applicability : 'not stated'}); reuse outside applicability is refused (REU-2)`,
      { rule: 'N-REU (c)', lesson_id: lesson.lesson_id });
  }
  if (claim.within_applicability !== true) {
    return noReuse('REFUSED',
      `reuse refused: applicability of lesson ${lesson.lesson_id} to the claimed reuse is not established; reuse outside the lesson's applicability cannot be ruled out, so no reuse is claimed (REU-2, S-T6-7)`,
      { rule: 'N-REU (c)', lesson_id: lesson.lesson_id });
  }
  return {
    outcome: 'NO_REFUSAL',
    reuse_demonstrated: false,
    reason: `No N-REU refusal fired for lesson ${lesson.lesson_id} on task ${task.task_id}. This is NOT a reuse demonstration: the REU-1 judgment (independent verifier + authorized human) is OPEN (F-36), and no reuse is demonstrated in Stage 3 (REU-2).`,
    lesson_id: lesson.lesson_id,
    task_id: task.task_id,
  };
}

// ---- N-EVAL: improvement refusal / downgrade (spec §14.2, §10 EVL) ----
//
// Refuses, or downgrades to "no improvement claim supported", an improvement
// claim citing (a) only a staged lesson; (b) only an unvalidated incident;
// (c) no lesson at all. REFUSED vs DOWNGRADED are distinct (S-T6-1): a
// staged lesson cited as authority is forbidden outright (LES-2); an
// unvalidated incident is real material but insufficient, so the claim is
// downgraded rather than refused; a claim with no basis at all is refused.
// A validated-lesson citation is also refused (S-T6-8): improvement from a
// validated lesson is a Group C EVA claim, and no validated lesson exists in
// Stage 3 (LES-8). No outcome ever supports an improvement claim.
//   { kind: 'staged-lesson' | 'unvalidated-incident' | 'none' | 'validated-lesson',
//     lesson_id?, incident_id? }

export function assessImprovementClaim(claim) {
  if (!isPlainObject(claim)) badInput('improvement claim');
  const unsupported = (outcome, reason) => ({
    outcome, improvement_claim_supported: false, claim: 'no improvement claim supported', reason,
  });
  switch (claim.kind) {
    case 'staged-lesson':
      return unsupported('REFUSED',
        `improvement claim refused: it cites only staged lesson ${claim.lesson_id ?? '(unnamed)'}; citation of a staged lesson as authority for any plan, tool, workflow, or compounding change is forbidden, and a staged lesson never counts toward improvement metrics (LES-2)`);
    case 'unvalidated-incident':
      return unsupported('DOWNGRADED',
        `improvement claim downgraded: it cites only unvalidated incident ${claim.incident_id ?? '(unnamed)'}; an unvalidated incident is real material but supports no improvement claim — no improvement claim supported (N-EVAL)`);
    case 'none':
      return unsupported('REFUSED',
        'improvement claim refused: it cites no lesson at all; with no basis there is nothing to assess — no improvement claim supported (N-EVAL)');
    case 'validated-lesson':
      return unsupported('REFUSED',
        `improvement claim refused: it cites validated lesson ${claim.lesson_id ?? '(unnamed)'}; improvement from a validated lesson is a Group C EVA claim, and no validated lesson is created in Stage 3 (LES-8, §14.3) — not assessable here`);
    default:
      throw new SafetyRefusal('BAD_INPUT',
        `improvement claim refused: the claim must name its basis kind: "staged-lesson" | "unvalidated-incident" | "none" | "validated-lesson"; got ${JSON.stringify(claim.kind)}`);
  }
}

// ---- GOV: governance refusal / hold (spec §14.2, §16 CMP-1) ----
//
// Refuses, or holds pending Founder decision: (a) a governance-adjacent
// compounding change (governance, authorization, security policy,
// first-product decision) without recorded Founder approval; (b) a change
// citing a validated lesson that also expands autonomy, permissions, or
// scope, without Founder approval; (c) a waiver or exception to a safety
// rule granted by a builder or verifier. Founder approval is the ONLY pass
// path (AC-T6-3): a change WITH a recorded Founder approval passes the GOV
// check, naming the approval — the function never grants approval itself.
// Silence, delay, or unavailability is never approval (Register ADR-09): a
// missing/empty/ambiguous approval field is a refusal or hold, never a pass.
//   { kind: 'governance' | 'authorization' | 'security-policy' | 'first-product'
//         | 'compounding' | 'waiver' | 'other',
//     expands?: boolean, expands_autonomy?: boolean, expands_permissions?: boolean,
//     expands_scope?: boolean, cites_validated_lesson?: boolean,
//     granted_by?: string, founder_approval?: { recorded?: boolean, by?: string,
//       reference?: string, date?: string } | null }

const GOVERNANCE_KINDS = Object.freeze(['governance', 'authorization', 'security-policy', 'first-product']);
const GOV_KINDS = Object.freeze([...GOVERNANCE_KINDS, 'compounding', 'waiver', 'other']);

// A recorded Founder approval (S-T6-4): recorded, by the Founder, with a
// non-empty reference and a valid date. Anything else — missing, empty,
// ambiguous, granted by anyone else — is not approval.
export function isRecordedFounderApproval(founderApproval) {
  if (!isPlainObject(founderApproval)) return false;
  return founderApproval.recorded === true
    && founderApproval.by === 'Founder'
    && isNonEmptyString(founderApproval.reference)
    && isValidDate(founderApproval.date);
}

export function checkGovernanceChange(change) {
  if (!isPlainObject(change)) badInput('governance change');
  if (!isNonEmptyString(change.kind) || !GOV_KINDS.includes(change.kind)) {
    throw new SafetyRefusal('BAD_INPUT',
      `governance change refused: kind must be one of ${GOV_KINDS.join(', ')}; got ${JSON.stringify(change.kind)} (an unnamed or unknown kind is never passed)`);
  }
  const approval = isRecordedFounderApproval(change.founder_approval)
    ? change.founder_approval.reference.trim()
    : null;
  const expands = change.expands === true
    || change.expands_autonomy === true
    || change.expands_permissions === true
    || change.expands_scope === true;
  const held = (reason) => ({
    outcome: 'HELD_PENDING_FOUNDER_DECISION', passes_gov_check: false, founder_approval: null, reason,
  });

  if (change.kind === 'waiver') {
    // GOV (c). The pass path is a recorded Founder approval granted by the
    // Founder (S-T6-9); a bare granted_by claim is never approval.
    if (change.granted_by === 'Founder' && approval !== null) {
      return { outcome: 'PASS', passes_gov_check: true, founder_approval: approval, reason: `waiver passes the GOV check on recorded Founder approval ${approval}; the function recognizes the approval, it does not grant it (AC-T6-3)` };
    }
    return {
      outcome: 'REFUSED', passes_gov_check: false, founder_approval: null,
      reason: `waiver or exception to a safety rule refused: granted by ${JSON.stringify(change.granted_by ?? null)}, not by the Founder on a recorded approval; a waiver granted by a builder or verifier is void (GOV (c)). Silence, delay, or unavailability is never approval (ADR-09)`,
    };
  }

  if (GOVERNANCE_KINDS.includes(change.kind) || expands) {
    // GOV (a) and (b). Founder approval is the only pass path (AC-T6-3).
    if (approval !== null) {
      return { outcome: 'PASS', passes_gov_check: true, founder_approval: approval, reason: `change passes the GOV check on recorded Founder approval ${approval}; the function recognizes the approval, it does not grant it (AC-T6-3)` };
    }
    const what = GOVERNANCE_KINDS.includes(change.kind)
      ? `a ${change.kind} change`
      : 'a change expanding autonomy, permissions, or scope';
    const cites = change.cites_validated_lesson === true ? ' citing a validated lesson' : '';
    return held(`${what}${cites} is held pending Founder decision: no recorded Founder approval was supplied; Founder approval is the only pass path (GOV (a)/(b), AC-T6-3). Silence, delay, or unavailability is never approval (ADR-09)`);
  }

  // Not governance-adjacent and not scope-expanding: not a GOV case. This
  // grants nothing — a compounding change is separately forbidden in Stage 3
  // (CMP-1), and this GOV check does not approve it.
  return {
    outcome: 'NOT_GOVERNANCE_ADJACENT', passes_gov_check: false, founder_approval: null,
    reason: change.kind === 'compounding'
      ? 'not a GOV case (no governance-adjacent kind, no expansion); this grants nothing — no compounding change occurs in Stage 3 (CMP-1)'
      : 'not a GOV case (no governance-adjacent kind, no expansion, no waiver); no Founder approval is needed for the GOV check, and none is granted',
  };
}
