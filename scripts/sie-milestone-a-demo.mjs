// sie-milestone-a-demo.mjs — Milestone A demonstration runner (Genesis Stage 3, T8).
//
// Runs each Stage 3 suite separately with `node --test --test-reporter=tap`,
// parses the TAP output into PER-TEST results (test name + pass/fail/skip),
// and writes the demonstration report to the path given by --out.
//
// What this script does NOT do:
// - It does NOT start a live loop, manufacture incidents, touch operational
//   data, or write anywhere except the --out path.
// - It does NOT claim a result it did not observe: every count in the report
//   comes from the parsed run. No pass counts are hardcoded.
// - It does NOT run, design, or report any Group C test (spec §14.3, TST-C).
//   Group C (VAL/LES/REU/EVA positive) is Milestone B work and is NOT in
//   Stage 3; this script asserts no Group C result anywhere.
//
// Evidence level (spec §10, EVL-7): fixture tests are Component; this
// demonstration is Structural. Nothing here is Operational or Outcome.
// Every fixture is SYNTHETIC (spec §13, FXT-1/FXT-2): a passing test on
// fixtures is "test mechanics verified on fixtures", never "system verified".
//
// Exit code: 0 only when every suite ran green AND every expected Group A /
// Group B test was present exactly once AND no test was skipped AND no
// unexpected test appeared. Any failure, missing test, unexpected test,
// unexpected skip, incomplete TAP plan, or non-zero suite exit code exits
// non-zero WITHOUT writing a report (a failed run never writes a passing
// report, and never overwrites an existing report with one).
//
// Usage:
//   node scripts/sie-milestone-a-demo.mjs [--out docs/stage-3/T8-demonstration-report.md]
//
// Mapping rules (stated in the generated report as well):
// - Group A, file scripts/sie-detector.test.mjs: every test is DET.
// - Group A, file scripts/sie-incident.test.mjs, by test-name prefix:
//     * name starts with "INC-4:" -> DIA (diagnosis: facts, hypotheses,
//       and reproduction-supported conclusions kept distinct).
//     * name starts with "DV-2 fix-verified:" OR name contains
//       "OPEN -> FIXED" -> FIX (the fix step: the OPEN -> FIXED transition,
//       the fix reference/claim, or the fix-verified evidence gate).
//     * every other test in the file -> INC (incident record lifecycle:
//       creation, status machine, watch, recurrence, record completeness).
// - Group B, file scripts/sie-safety.test.mjs, by test-name prefix:
//     * "N-VAL" -> N-VAL; "N-LES" -> N-LES; "N-HIST" -> N-HIST;
//       "N-REU" -> N-REU; "N-EVAL" -> N-EVAL; "GOV" -> GOV.
//     * name starts with "structural:" -> STRUCTURAL (supporting check
//       inside the safety file: the module is pure, no I/O; NOT one of the
//       six Group B cases, counted in the file total only).
// - Supporting suites (scripts/sie-schema.test.mjs,
//   scripts/sie-lesson.test.mjs, scripts/sie-seed.test.mjs) are recorded as
//   SUPPORTING evidence, not Milestone A rows (spec §1.4, SC-13: functional
//   and validated-learning results are reported separately, never merged
//   into a single pass claim).
//
// The EXPECTED manifest below lists every Group A and Group B test name
// expected in the run. It is a manifest of NAMES, not of results: it exists
// so the script can detect a test that went missing from a run (a dropped
// test must fail the demo, not silently shrink the denominator). The names
// were extracted from the TAP output of the suites at authoring time; if a
// test is renamed, added, or removed, this manifest must be updated
// deliberately and the change recorded — the script fails rather than
// silently passing a different test set.

import { spawnSync, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED = {
  "sie-detector": [
    "AC-T1-1: exactly six rule branches, R1-R6, and no other",
    "AC-T1-1: each rule builds candidates in exactly one place in the source",
    "AC-T1-2: every output is a detector candidate with only DET-9 fields; none carries a verdict",
    "AC-T1-3: the read-only boundary and the candidate-record distinction are stated in code",
    "AC-T1-3: the only file writes are exclusive-create candidate files (no append, rename, delete, truncate)",
    "AC-T1-3: scanning and writing leave every source record byte-identical",
    "AC-T1-3: refuses to write candidate records inside a task-record directory",
    "AC-T1-3: refuses symlink aliases into a task-record directory, before creating anything",
    "AC-T1-3: the CLI requires explicit paths and writes nothing without --out",
    "AC-T1-4 / F-R4: one R4 candidate on an exact key shared by 3 tasks; the control key gives none",
    "DET-9 / R4: recorded timestamps stay with their own task; they are not DET-8 id inputs",
    "AC-T1-4 / F-R4-INS: missing, blank, incomparable keys give insufficient evidence; case/whitespace variants are different keys",
    "AC-T1-4: R4 never groups blank or incomparable keys, even when they repeat across tasks",
    "AC-T1-4: R4 counts distinct tasks, so one task repeating a key does not fire",
    "AC-T1-4: the R4 event dimension is recorded as not evaluated, not silently skipped",
    "AC-T1-4 / F-R6: fires at tick-index distance 3 only; distance 2 and distance 0 do not",
    "AC-T1-4 / F-R6-INS: undeterminable tick positions give insufficient evidence, never a candidate",
    "AC-T1-4: with no recorded tick index (the repository today), every in_progress task is insufficient evidence",
    "AC-T1-4: R6 ignores tasks that are not in_progress, and a repeated tick makes the position undeterminable",
    "AC-T1-5: fixtures F-R1-F-R6 produce exactly the expected detector candidates (controls produce zero)",
    "AC-T1-5: candidates keep the exact source pointers",
    "F-DUP: repeated scans give the same ids, and a second write creates no records",
    "DET-8: the id depends only on its inputs; R6 uses the last-progress tick, not the current tick",
    "written candidate records are labeled detector candidates and carry the working-basis note"
  ],
  "sie-incident": [
    "AC-T2-1: states are exactly OPEN, FIXED, WATCH, VALIDATED, REOPENED; transition table matches §6.1",
    "AC-T2-1: happy path OPEN -> FIXED -> WATCH, each with its evidence requirement (incl. fix-verified)",
    "AC-T2-1: REOPENED is reachable from FIXED, WATCH, and VALIDATED only",
    "AC-T2-1: OPEN -> REOPENED is refused, naming CR-03",
    "AC-T2-1: every unlisted transition is refused, naming the attempted transition",
    "AC-T2-1: each transition is refused when its required evidence is missing",
    "AC-T2-1: a backward move without a stated reason or evidence pointer is refused",
    "AC-T2-1: OPEN -> FIXED forbids claiming validation or proven effectiveness",
    "AC-T2-1: FIXED -> WATCH never assumes a start; a not-started window is recorded as such",
    "DV-2 fix-verified: FIXED -> WATCH is REFUSED when reproduction_evidence is missing",
    "DV-2 fix-verified: FIXED -> WATCH is REFUSED when reproduction_evidence is a documented-analysis (not a reproduced failure)",
    "DV-2 fix-verified: FIXED -> WATCH is REFUSED when regression_test is missing",
    "DV-2 fix-verified: FIXED -> WATCH is REFUSED when the regression test has only a passing-after result",
    "DV-2 fix-verified: FIXED -> WATCH is REFUSED when the regression test has only a failing-before result",
    "DV-2 fix-verified: FIXED -> WATCH SUCCEEDS when both elements are present (with fix_presence_evidence + watch_window)",
    "DV-2 fix-verified: independent_verification absent does NOT block FIXED -> WATCH",
    "DV-2 fix-verified: independent_verification present is recorded in the history entry and does NOT satisfy VAL-1 element (3)",
    "AC-T2-2: WATCH -> VALIDATED refused with an empty or missing exposure_evidence_link",
    "AC-T2-2: refused before the window end condition, even with every other element present (N-VAL (e))",
    "AC-T2-2: refused when exposure is empty; refused on zero recurrence alone; refused on a merged PR alone",
    "AC-T2-2: refused on fixture, synthetic, staged-lesson, merged-PR, or non-operational evidence as exposure",
    "AC-T2-2: DV-5 — a passing post-fix result without a failing-before result is refused",
    "AC-T2-2: DV-4 — a documented reproduction analysis without a reproduced failure is refused",
    "AC-T2-2: H4 — independent verification is NOT SATISFIED while D2 is pending; never labeled independently validated (N-VAL (d))",
    "AC-T2-2: DV-6 conjunctive — end reached and evidence present are both required; neither alone suffices",
    "AC-T2-2 / F-T2-1: a watch for a different window (different start/end) does not satisfy the end condition",
    "AC-T2-2 / F-T2-1: a watch under a different reading does not satisfy the end condition (Codex counterexample)",
    "AC-T2-2 / F-T2-1: a watch under a different counting rule does not satisfy the end condition",
    "AC-T2-2 / F-T2-1: a watch with a different record-creation time does not satisfy the end condition",
    "AC-T2-2 / F-T2-1: a premature supplied end does not satisfy the end condition",
    "AC-T2-2 / F-T2-1: a legitimate full-window extension of the recorded window is consistent; its end is judged on its own merits",
    "AC-T2-2 / VAL-6: no path reaches VALIDATED on SYNTHETIC input; an in-place upgrade is refused",
    "VAL-1: eligibility check names every element and carries the DV-3 NOT ENFORCED marker, never a satisfied claim",
    "AC-T2-3: recurrence evidence increments recurrence_count and is stored in recurrence_evidence",
    "AC-T2-3: a corrected verdict on FIXED/WATCH is an annotation — no recurrence, no status change, no increment",
    "AC-T2-3: VALIDATED -> REOPENED on recurrence evidence alone is refused (INC-3)",
    "AC-T2-3: VALIDATED -> REOPENED on corrected-verdict evidence keeps the prior VALIDATED status, annotated superseded, with no increment",
    "AC-T2-4: every watch computation names the reading and counting rule and is PROVISIONAL, never final",
    "AC-T2-4: the reading and the counting rule must be named",
    "AC-T2-4: W-A, W-B, W-C starts; W-C = MAX(fix presence, record creation) with the §7.2 boundary cases",
    "AC-T2-4: missing start evidence returns \"watch not started: missing <named> evidence\", never an assumed start",
    "AC-T2-4: watch end = MIN(30-day limit, 10th-task timestamp)",
    "AC-T2-4: exposure counts in-window operational evidence only; excludes fixture, synthetic, pre-window, pre-record, non-operational, record creation",
    "AC-T2-4: watchOutcome follows the §7.1 order exactly",
    "AC-T2-4 / WAT-5: extension is a full window from the previous end; tests are re-applied",
    "AC-T2-5: recurrence_count >= 2 sets the mandatory-deeper-review marker; a first recurrence does not",
    "AC-T2-5: the marker carries no procedure contents, conductor, or outcome (SIE-07 OPEN)",
    "recordFurtherRecurrence: only on REOPENED; FIXED/WATCH must reopen; OPEN has no post-fix occurrence",
    "DV-9: original + one occurrence in a DIFFERENT task -> recurrence exists",
    "DV-9: two occurrences in the SAME task -> no WP-04 recurrence, but \"zero recurrence\" is blocked and REOPENED is still supported",
    "DV-9: no post-fix occurrence -> no recurrence and the zero-recurrence claim is not blocked by evidence",
    "DV-9: event-type occurrences are not_evaluated, never a recurrence verdict",
    "DV-9: blocker keys compare by exact equality; different or missing keys are not the same blocker",
    "INC-4: facts, hypotheses, and conclusions are separate fields; promotion adds a NEW conclusion and preserves the hypothesis",
    "INC-4: a conclusion cannot be created from a hypothesis alone",
    "Record completeness: createIncident builds exactly the §6.2 fields at OPEN with history[0] recording creation",
    "Record completeness: a missing required field is refused, naming the field; no verdict is produced",
    "Immutability: transition does not mutate its input and appends exactly one history entry",
    "Immutability: every step is append-only across the whole lifecycle",
    "Read-only boundary: the module does no file I/O and states the boundary, VAL-6, the C-15 closure, and DV-3 in its header"
  ],
  "sie-safety": [
    "N-VAL (a) failing input: merged PR, no regression test — fix-verified fails naming the regression-test element, and FIXED -> WATCH is refused",
    "N-VAL (a) failing input: regression test that passes before the fix — no failing-before result (DV-5)",
    "N-VAL (b) failing input: regression test present, zero exposure — eligibility fails naming the exposure elements",
    "N-VAL (c) failing input: exposure present, no sufficiency judgment — eligibility fails naming c5",
    "N-VAL (d) failing input: everything except independent verification (D2 role pending) — only c3 fails",
    "N-VAL (e) [AC-T6-5] failing input: non-empty exposure, but window end condition not reached (CR-01) — refused even with non-empty exposure",
    "N-VAL (f) failing input: exposure link that cannot be followed to specific evidence — empty pointer is excluded by T2 naming EVL-3",
    "N-VAL (f) failing input: general-but-nonempty pointer (whole repository / whole log file / directory / general claim) — T2 alone counts it, the thin check refuses it (S-T6-5 gap)",
    "N-VAL (f) failing input: general pointers with incidental markers — empty query/fragment, a view query/fragment, .git suffix, non-numeric colon suffix — refused (F-T6-1)",
    "N-VAL (f) failing input: query selector keys with a missing, empty, or malformed value — the key alone names nothing (F-T6-4)",
    "N-VAL (f) failing input: whole log file / whole repository with a specific-looking ancestor directory — a numeric ancestor never selects an entry within it (F-T6-5)",
    "N-VAL guard: fixture evidence alone never validates (VAL-3)",
    "N-VAL (g) failing input: a corrected verdict recorded as a recurrence — annotateCorrectedVerdict must NOT increment recurrence_count (CR-03)",
    "N-VAL (g) control: a genuine further recurrence DOES increment recurrence_count",
    "N-VAL (g) failing input: recurrence evidence offered to reopen a VALIDATED record — refused; a corrected verdict reopens it WITHOUT incrementing the count (CR-03)",
    "N-LES (a) failing input: validated lesson citing an incident in OPEN — refused",
    "N-LES (a) failing input: validated lesson citing an incident in FIXED — refused",
    "N-LES (a) failing input: validated lesson citing an incident in WATCH — refused naming validated_incident_status",
    "N-LES (b) failing input: validated lesson citing a staged lesson as source — refused (LES-5)",
    "N-LES (c) failing input: lesson of either kind with empty non_applicability — schema rejection (§9.2, CR-02 (c))",
    "N-LES (d) failing input: staged-to-validated promotion — setting a staged record status to VALIDATED in place is refused; moving its entry to Section 1 is refused",
    "N-LES (d) failing input: a staged record RELABELED to VALIDATED — mutable copy and reconstructed record, same id and provenance — is refused; the original remains staged (F-T6-3)",
    "N-LES (e) failing input: validated-lesson creation without the complete LES-3 validation reference — refused naming the missing elements (AC-T6-4)",
    "N-LES not refused [AC-T6-4]: legitimate staging under LES-2 stages successfully",
    "N-HIST (a) failing input: validation of a seed record citing only its already-merged historical fix — refused (SEED-01)",
    "N-HIST (a) failing input: every T5 seed record refuses validation by merged fix (SEED-01…SEED-10 + SEED-SHA)",
    "N-HIST (b) failing input: pre-record operational evidence offered as exposure — refused (SEED-02)",
    "N-HIST (b) failing input: operational evidence offered as exposure for a seed record that has no watch window — refused (SEED-04)",
    "N-HIST (c) failing input: in-place relabeling of a seed record to VALIDATED — refused (SEED-03)",
    "N-HIST failing input: SEED-SHA (UNVERIFIED CANDIDATE) refuses validation as well",
    "N-REU (a) failing input: reuse claimed from a staged lesson — refused [legitimate-task-only assumption marked; DV-7/C-19]",
    "N-REU (b) failing input: reuse with no task — refused; there is no prescribed reuse task [REF, UNVERIFIED — DV-7, C-19]",
    "N-REU (b) failing input: reuse from a manufactured task created to produce a reuse metric — refused [legitimate-task-only assumption marked; DV-7]",
    "N-REU (c) failing input: reuse outside the lesson applicability — refused [legitimate-task-only assumption marked]",
    "N-REU clean case: no refusal fires — and still NO reuse is demonstrated (F-36 OPEN, REU-2)",
    "N-EVAL failing input: improvement citing only a staged lesson — REFUSED",
    "N-EVAL failing input: improvement citing only an unvalidated incident — DOWNGRADED to \"no improvement claim supported\"",
    "N-EVAL failing input: improvement citing no lesson at all — REFUSED",
    "N-EVAL: REFUSED vs DOWNGRADED are distinct, and neither ever supports an improvement claim (S-T6-1, S-T6-8)",
    "GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: governance change without recorded Founder approval — HELD pending Founder decision",
    "GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: authorization, security-policy, and first-product changes without approval — HELD",
    "GOV (b) [AC-T6-3: Founder approval is the only pass path] failing input: change citing a validated lesson that expands autonomy / permissions / scope without approval — HELD",
    "GOV (c) failing input: waiver or exception to a safety rule granted by a builder or verifier — REFUSED (never held, never passed)",
    "GOV [AC-T6-3] approval date must be a valid YYYY-MM-DD calendar date — \"1\" and \"2026-02-30\" never pass (F-T6-2)",
    "GOV [AC-T6-3] silence is never approval: missing, empty, ambiguous, or non-Founder approval is never a pass",
    "GOV control: a routine non-governance change is NOT_GOVERNANCE_ADJACENT — held for nothing, and granted nothing",
    "structural: sie-safety.mjs is a pure module — no file I/O, no network; evidence level stated (EVL-7)"
  ]
};

const SUITES = [
  { file: 'scripts/sie-detector.test.mjs', scope: 'A', label: 'Detector (DET)' },
  { file: 'scripts/sie-incident.test.mjs', scope: 'A', label: 'Incident / diagnosis / fix (INC / DIA / FIX)' },
  { file: 'scripts/sie-safety.test.mjs', scope: 'B', label: 'Safety / negative (all six Group B cases)' },
  { file: 'scripts/sie-schema.test.mjs', scope: 'SUPPORTING', label: 'Schema + INDEX (supporting)' },
  { file: 'scripts/sie-lesson.test.mjs', scope: 'SUPPORTING', label: 'Lesson staging + retrieval (supporting)' },
  { file: 'scripts/sie-seed.test.mjs', scope: 'SUPPORTING', label: 'Seed records (supporting)' },
];

// ---------------------------------------------------------------------------
// Classification (mapping rules, see header)
// ---------------------------------------------------------------------------

function classifyGroupA(file, name) {
  if (file === 'scripts/sie-detector.test.mjs') return 'DET';
  if (file === 'scripts/sie-incident.test.mjs') {
    if (name.startsWith('INC-4:')) return 'DIA';
    if (name.startsWith('DV-2 fix-verified:') || name.includes('OPEN -> FIXED')) return 'FIX';
    return 'INC';
  }
  return null;
}

function classifyGroupB(file, name) {
  if (file !== 'scripts/sie-safety.test.mjs') return null;
  if (name.startsWith('structural:')) return 'STRUCTURAL';
  for (const c of ['N-VAL', 'N-LES', 'N-HIST', 'N-REU', 'N-EVAL', 'GOV']) {
    if (name.startsWith(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// TAP parsing
// ---------------------------------------------------------------------------

function parseTap(suite, stdout) {
  const tests = [];
  const problems = [];
  let plan = null;
  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const m = /^(ok|not ok) (\d+) - (.*)$/.exec(line);
    if (m) {
      let name = m[3];
      let skipped = false;
      const skipMatch = / # SKIP( |:|$)/.exec(name);
      if (skipMatch) {
        skipped = true;
        name = name.slice(0, skipMatch.index);
      }
      tests.push({ name, passed: m[1] === 'ok' && !skipped, failed: m[1] === 'not ok', skipped });
      continue;
    }
    const indented = /^\s+(ok|not ok) \d+ - /.test(line);
    if (indented) {
      problems.push(`unexpected nested (indented) TAP result line in ${suite.file}: ${line.trim()}`);
      continue;
    }
    const p = /^1\.\.(\d+)$/.exec(line);
    if (p) plan = Number(p[1]);
  }
  return { tests, problems, plan };
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  let out = 'docs/stage-3/T8-demonstration-report.md';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') {
      if (i + 1 >= argv.length) throw new Error('--out requires a path argument');
      out = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`unknown argument: ${argv[i]} (usage: node scripts/sie-milestone-a-demo.mjs [--out <path>])`);
    }
  }
  return { raw: out, resolved: resolve(REPO_ROOT, out) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let outPath;
  let outRaw;
  try {
    ({ raw: outRaw, resolved: outPath } = parseArgs(process.argv.slice(2)));
  } catch (err) {
    console.log(`Milestone A demo: FAILED — ${err.message}`);
    process.exitCode = 2;
    return;
  }

  const failures = [];
  const results = [];
  const perCase = new Map();

  for (const suite of SUITES) {
    const cmd = ['node', '--test', '--test-reporter=tap', suite.file];
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', suite.file], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const stdout = run.stdout ?? '';
    const { tests, problems, plan } = parseTap(suite, stdout);
    const exitCode = run.status;

    if (run.error) failures.push(`${suite.file}: could not run node --test (${run.error.message})`);
    if (exitCode !== 0) failures.push(`${suite.file}: node --test exited ${exitCode} (signal: ${run.signal ?? 'none'})`);
    for (const p of problems) failures.push(p);
    if (plan === null) {
      failures.push(`${suite.file}: no TAP plan line (1..N) found — incomplete run`);
    } else if (plan !== tests.length) {
      failures.push(`${suite.file}: TAP plan says ${plan} tests but ${tests.length} top-level results were parsed — incomplete run`);
    }

    const seen = new Map();
    for (const t of tests) {
      seen.set(t.name, (seen.get(t.name) ?? 0) + 1);
      if (t.failed) failures.push(`${suite.file}: FAILED — ${t.name}`);
      if (t.skipped) failures.push(`${suite.file}: SKIPPED — ${t.name} (no skip is permitted in a demo suite)`);
    }
    for (const [name, count] of seen) {
      if (count > 1) failures.push(`${suite.file}: test ran ${count} times — ${name}`);
    }

    if (suite.scope === 'A' || suite.scope === 'B') {
      const manifestKey = suite.file === 'scripts/sie-detector.test.mjs'
        ? 'sie-detector'
        : suite.file === 'scripts/sie-incident.test.mjs'
          ? 'sie-incident'
          : 'sie-safety';
      const expected = EXPECTED[manifestKey];
      const parsedNames = new Set(tests.map((t) => t.name));
      for (const name of expected) {
        if (!parsedNames.has(name)) failures.push(`${suite.file}: MISSING expected test — ${name}`);
      }
      for (const name of parsedNames) {
        if (!expected.includes(name)) failures.push(`${suite.file}: UNEXPECTED test not in the expected manifest — ${name}`);
      }
    }

    const enriched = tests.map((t) => {
      let groupCase = null;
      if (suite.scope === 'A') groupCase = classifyGroupA(suite.file, t.name);
      if (suite.scope === 'B') groupCase = classifyGroupB(suite.file, t.name);
      if ((suite.scope === 'A' || suite.scope === 'B') && groupCase === null) {
        failures.push(`${suite.file}: test could not be mapped to a Group A/B case — ${t.name}`);
      }
      if (groupCase !== null) {
        const key = `${suite.scope}:${groupCase}`;
        perCase.set(key, (perCase.get(key) ?? 0) + 1);
      }
      return { ...t, groupCase };
    });

    const passed = tests.filter((t) => t.passed).length;
    const failed = tests.filter((t) => t.failed).length;
    const skipped = tests.filter((t) => t.skipped).length;
    results.push({
      ...suite,
      command: cmd.join(' '),
      exitCode,
      tests: enriched,
      total: tests.length,
      passed,
      failed,
      skipped,
    });
  }

  const totalTests = results.reduce((n, r) => n + r.total, 0);
  const totalPassed = results.reduce((n, r) => n + r.passed, 0);
  const totalFailed = results.reduce((n, r) => n + r.failed, 0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped, 0);
  // Milestone A scope = Group A + Group B cases only. The one STRUCTURAL
  // supporting check inside the safety file is excluded here; it is counted
  // in the file total and in the demo total, not in any Group B case.
  const milestoneATests = results
    .filter((r) => r.scope === 'A' || r.scope === 'B')
    .flatMap((r) => r.tests)
    .filter((t) => t.groupCase !== 'STRUCTURAL');
  const milestoneATotal = milestoneATests.length;
  const milestoneAPassed = milestoneATests.filter((t) => t.passed).length;
  const structuralCount = (perCase.get('B:STRUCTURAL') ?? 0);
  const supporting = results.filter((r) => r.scope === 'SUPPORTING');
  const supportingTotal = supporting.reduce((n, r) => n + r.total, 0);

  const summaryLine = `Milestone A demo: ${totalPassed} pass / ${totalFailed} fail / ${totalSkipped} skip across ${results.length} suites `
    + `(Milestone A scope ${milestoneAPassed}/${milestoneATotal}; supporting ${supportingTotal}; structural ${structuralCount})`;

  if (failures.length > 0) {
    console.log(`${summaryLine} — FAILED`);
    for (const f of failures) console.log(`  FAIL: ${f}`);
    console.log('No report was written.');
    process.exitCode = 1;
    return;
  }

  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const generatedAt = new Date().toISOString();
  const statusPorcelain = execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const esc = (s) => s.replace(/\|/g, '\\|');

  const caseOrder = ['DET', 'INC', 'DIA', 'FIX', 'N-VAL', 'N-LES', 'N-HIST', 'N-REU', 'N-EVAL', 'GOV'];
  const caseRows = caseOrder
    .filter((c) => perCase.has(`A:${c}`) || perCase.has(`B:${c}`))
    .map((c) => {
      const n = (perCase.get(`A:${c}`) ?? 0) + (perCase.get(`B:${c}`) ?? 0);
      return `| ${c} | ${n} | ${n} | 0 |`;
    })
    .join('\n');

  const suiteRows = results
    .map((r) => `| \`${r.file}\` | ${r.scope === 'SUPPORTING' ? 'Supporting' : `Group ${r.scope}`} | ${r.total} | ${r.passed} | ${r.failed} | ${r.skipped} |`)
    .join('\n');

  const perTestTable = (rows, columns) => {
    const header = `| ${columns.join(' | ')} |\n| ${columns.map(() => '---').join(' | ')} |`;
    return [header, ...rows].join('\n');
  };
  const resultWord = (t) => (t.passed ? 'PASS' : t.failed ? 'FAIL' : 'SKIP');
  const groupATable = perTestTable(
    results.filter((r) => r.scope === 'A').flatMap((r) => r.tests.map((t) => `| ${esc(t.name)} | \`${r.file}\` | ${t.groupCase} | ${resultWord(t)} |`)),
    ['Test', 'File', 'Case', 'Result'],
  );
  const groupBTable = perTestTable(
    results.filter((r) => r.scope === 'B').flatMap((r) => r.tests.map((t) => `| ${esc(t.name)} | \`${r.file}\` | ${t.groupCase} | ${resultWord(t)} |`)),
    ['Test', 'File', 'Case', 'Result'],
  );
  const supportingTables = supporting
    .map((r) => `### ${r.label} — \`${r.file}\` (${r.passed}/${r.total} PASS)\n\n${perTestTable(
      r.tests.map((t) => `| ${esc(t.name)} | ${resultWord(t)} |`),
      ['Test', 'Result'],
    )}`)
    .join('\n\n');

  const commands = results.map((r) => `- \`${r.command}\``).join('\n');

  const report = `# Stage 3 — Milestone A demonstration report (T8)

> GENERATED by \`scripts/sie-milestone-a-demo.mjs\`. Do not hand-edit this file;
> if it needs a correction, fix the script and re-run it.
> Generating command: \`node scripts/sie-milestone-a-demo.mjs --out ${outRaw}\`
> (default --out is \`docs/stage-3/T8-demonstration-report.md\`).
> Generated at ${generatedAt} (UTC) at commit \`${commit}\`.
> Working tree at generation time (\`git status --porcelain\`):
>
> \`\`\`
> ${statusPorcelain.split('\n').join('\n> ')}
> \`\`\`

## Summary

${summaryLine} — PASS.

- Milestone A scope (Group A + Group B): ${milestoneAPassed} / ${milestoneATotal} PASS, 0 fail, 0 skip.
- Structural check inside the safety file (module purity, not a Group B case): ${structuralCount} / ${structuralCount} PASS.
- Supporting suites (schema, lesson staging/retrieval, seed records): ${supportingTotal} / ${supportingTotal} PASS, 0 fail, 0 skip.
- Full demonstration total (six suites run by this script): ${totalPassed} / ${totalTests} PASS, 0 fail, 0 skip.

Every count in this report comes from the parsed TAP output of the runs
listed below. No pass count is hardcoded in the demo script.

## Commands run

${commands}

Each suite was run separately as \`node --test --test-reporter=tap <file>\`
from the repository root, and its TAP output was parsed into per-test
results (test name + pass/fail/skip). The demo fails (non-zero exit, no
report written) if any test fails, if any expected Group A or Group B test
is missing from its run, if any unexpected test appears, if any test is
skipped, or if a TAP plan is incomplete.

## Per-suite totals

| File | Scope | Tests | Pass | Fail | Skip |
| --- | --- | --- | --- | --- | --- |
${suiteRows}

## Per-case totals (Milestone A scope)

| Case | Tests | Pass | Fail |
| --- | --- | --- | --- |
${caseRows}

Mapping rules: every test in \`scripts/sie-detector.test.mjs\` is DET. In
\`scripts/sie-incident.test.mjs\`, a test whose name starts with \`INC-4:\`
is DIA; a test whose name starts with \`DV-2 fix-verified:\` or whose name
contains \`OPEN -> FIXED\` is FIX; every other test in the file is INC. In
\`scripts/sie-safety.test.mjs\`, a test is mapped to its Group B case by its
name prefix (\`N-VAL\`, \`N-LES\`, \`N-HIST\`, \`N-REU\`, \`N-EVAL\`, \`GOV\`);
the one test named \`structural: ...\` is a supporting check inside the
safety file (the module is pure, no I/O) and is NOT one of the six Group B
cases — it is counted in the file total only.

## Group A — per-test results

${groupATable}

## Group B — per-test results

${groupBTable}

## Supporting suites — per-test results (SUPPORTING, not Milestone A rows)

Per spec §1.4 (SC-13), functional (Milestone A) and validated-learning
results are reported separately and never merged into a single pass claim.
The suites below are supporting evidence only; their totals are NOT part
of the Milestone A scope total above.

${supportingTables}

## R4-events [OPEN] carve-out

The detector's event half is NOT implemented, NOT claimed, and NOT
evaluated (Founder Amendment 2026-11-06 ~10:39 MST, spec §0.5 (a)).
The DET rows above are the blocker half only: the detector groups recorded
blocker strings (R4) and reports the event dimension as NOT_EVALUATED
(the test "AC-T1-4: the R4 event dimension is recorded as not evaluated,
not silently skipped" records that disclosure). No event key is defined
anywhere, and no R4 event result is claimed in this report.

## Limit statement (AC-T8-2)

Passing on fixtures proves the mechanisms work on fixtures. It does not
prove validation, lessons, reuse, or improvement, and it is not
Milestone B. A passing test on fixtures is "test mechanics verified on
fixtures", never "system verified" (spec §13, FXT-1/FXT-2). No result in
this report comes from operational data: none exists in Stage 3, no live
loop turn ran, no incident was manufactured, and no failure was faked.

## No Group C, no Milestone B (AC-T8-4)

No Group C test (VAL, LES, REU, EVA positive) was designed, run, or
reported as passed in this demonstration, and no Milestone B claim appears
in this report. Group C is NOT in Stage 3 (spec §14.3, TST-C). Milestone B
requires real incidents, sufficient exposure, completed watch periods,
recurrence requirements, legitimate later reuse, and documented evaluation
(spec §1.2, SC-6); none of those exists in Stage 3.

## Evidence levels (spec §10, EVL-7) and fixtures (spec §13)

- Fixture tests in this demonstration are evidence level: Component
  ("Unit tests, controlled fixtures, and isolated component behavior").
- This demonstration report is evidence level: Structural.
- Nothing in this demonstration is evidence level: Operational ("Actual
  authorized execution with traceable records") or Outcome.
- Every fixture is SYNTHETIC, stored separately from operational and seed
  records, and never cited as exposure, reproduction, or
  independent-verification evidence (FXT-1). A fixture never proves a real
  failure, a runner defect, a fix, validation, a lesson, reuse, or
  improvement (FXT-2).

## Skips

Skips in the six demo suites: 0. The demo permits no skip in its own
suites. The single pre-existing skip in the full \`npm test\` run lives in
\`scripts/preflight.test.mjs\`, outside the six suites this script runs; it
is recorded in the T8 builder report from the separate full-suite run, not
asserted by this script (this script observes only its own six suites).

## Manifest completeness

The demo script carries an expected-name manifest for every test in the
three Group A/B files (131 tests: 130 Group A/B tests + 1 structural
supporting check). This run contained every expected test exactly
once and no unexpected test. The manifest is a list of NAMES, not results;
all results above were observed in this run.
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, report);
  console.log(`${summaryLine} — PASS. Report written to ${outPath} (commit ${commit}).`);
  process.exitCode = 0;
}

main();
