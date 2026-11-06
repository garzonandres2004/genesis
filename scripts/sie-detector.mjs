// SIE detector (Stage 3 T1): six exact-match rules R1-R6, candidate-only.
// Implements docs/stage-3/00-sie-specification.md §5 (DET-1..DET-9) and the
// §5.2 pseudocode (prep §2.1 with addendum CR-04 applied).
//
// WORKING BASIS - NOT WP-04-VERIFIED. The six rules are the Specification's
// [REF] reconstructions carried from the prep draft. They are UNVERIFIED
// against WP-04 v1.1 verbatim: the WP-04 text was not available (Spec §0.4,
// §2 point 1). Nothing here presents a rule as WP-04 wording.
//
// READ-ONLY BOUNDARY (DET-4, DET-5; SIE-03 working scope, OPEN):
// - The detector READS existing Runner source records only: task records
//   (one JSON file per task, tasks/*.json) and the append-only event log
//   (events.jsonl). It never modifies, reclassifies, backfills, renames, or
//   deletes a source record, and it never writes into tasks/ or events.jsonl.
// - Its only write is CREATING SIE detector-candidate records (Markdown, one
//   file per candidate) in a separate candidate directory the caller names.
//   Creating candidate records is a different act from reading Runner records
//   and never touches them. Existing candidate files are never overwritten.
//
// CANDIDATE-ONLY (DET-2, DET-3): every branch emits at most a detector
// candidate - an observation that a rule fired on recorded values. No branch
// emits a runner-caused-failure verdict, infers a cause, counts a candidate as
// a failure, or triggers a fix, retry, merge, or lesson. "Detector candidate"
// is unrelated to the lesson state CANDIDATE (VOC-7).
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RULE_BASIS =
  '[REF] reconstruction carried from the prep draft; UNVERIFIED against WP-04 v1.1 verbatim (working basis)';
export const CANDIDATE_NOTE =
  'Detector candidate only: a rule fired on recorded values. Not a failure, not an incident, ' +
  'not a runner-caused-failure verdict; no cause is determined.';
export const INSUFFICIENT_R4 = 'insufficient evidence: key missing or incomparable';
export const INSUFFICIENT_R6 = 'insufficient evidence: tick position not determinable';

const RULE_NAMES = {
  R1: 'blocked-with-blockers',
  R2: 'failed/interrupted runs',
  R3: 'attempts >= 2',
  R4: 'same blocker/event across >= 2 tasks',
  R5: 'retry_exhausted',
  R6: 'stuck in_progress > 2 ticks',
};

const toPosix = (p) => p.split(sep).join('/');

// DET-8: deterministic id from the rule id plus the exact inputs the Spec names
// (sorted source pointers; + exact key for R4; + task id and last-progress tick,
// not current tick, for R6). Same inputs always give the same id.
export function candidateId(rule, inputs) {
  const hash = createHash('sha256').update(JSON.stringify([rule, ...inputs])).digest('hex');
  return `CAND-${rule}-${hash.slice(0, 16)}`;
}

// DET-9: rule matched, source pointers, task ids, timestamps as recorded,
// match description, retained values, DET-8 id. No interpretation field.
function makeCandidate(rule, { idInputs, task_ids, source_pointers, recorded_timestamps, match_description, retained }) {
  return {
    candidate_id: candidateId(rule, idInputs),
    record_type: 'detector-candidate',
    rule,
    rule_name: RULE_NAMES[rule],
    rule_basis: RULE_BASIS,
    match_description,
    task_ids,
    source_pointers,
    recorded_timestamps,
    retained_values: retained,
    note: CANDIDATE_NOTE,
  };
}

function insufficient(rule, reason, detail, task_id, source_pointer) {
  return { rule, reason, detail, task_id, source_pointer };
}

// ---- Reading Runner source records (read-only) ----

// Task records: tasks/*.json, sorted by file name. A file that does not parse
// stops the scan loudly instead of being silently skipped.
export function readTaskRecords(tasksDir, root) {
  if (!tasksDir || !existsSync(tasksDir)) return [];
  return readdirSync(tasksDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const file = join(tasksDir, f);
      let record;
      try {
        record = JSON.parse(readFileSync(file, 'utf8'));
      } catch (e) {
        throw new Error(`Cannot parse task record ${file}: ${e.message}`);
      }
      const id = typeof record.id === 'string' && record.id !== '' ? record.id : basename(f, '.json');
      return { id, pointer: toPosix(relative(root, file)), record };
    });
}

// Events: one JSON object per line. Events carry no id field, so each event's
// source pointer is "<file>#L<line>" (1-based physical line; the log is
// append-only, so line numbers are stable).
export function readEventRecords(eventsFile, root) {
  if (!eventsFile || !existsSync(eventsFile)) return [];
  const label = toPosix(relative(root, eventsFile));
  const out = [];
  readFileSync(eventsFile, 'utf8').split('\n').forEach((line, i) => {
    if (line.trim() === '') return;
    let event;
    try {
      event = JSON.parse(line);
    } catch (e) {
      throw new Error(`Cannot parse event at ${label}#L${i + 1}: ${e.message}`);
    }
    out.push({ pointer: `${label}#L${i + 1}`, event });
  });
  return out;
}

// ---- The six rule branches: exactly one per rule (DET-1) ----

// R1 blocked-with-blockers [REF]: status "blocked" AND blockers non-empty.
function ruleR1({ tasks }) {
  const out = [];
  for (const t of tasks) {
    const { status, blockers } = t.record;
    if (status === 'blocked' && Array.isArray(blockers) && blockers.length > 0) {
      out.push(makeCandidate('R1', {
        idInputs: [[t.pointer]],
        task_ids: [t.id],
        source_pointers: [t.pointer],
        recorded_timestamps: { created: t.record.created ?? null, updated: t.record.updated ?? null },
        match_description: 'status is "blocked" and blockers is non-empty',
        retained: { status, blockers },
      }));
    }
  }
  return { candidates: out, insufficient: [] };
}

// R2 failed/interrupted runs [REF]: event type task_failed or run_interrupted.
function ruleR2({ events }) {
  const out = [];
  for (const e of events) {
    if (e.event.type === 'task_failed' || e.event.type === 'run_interrupted') {
      out.push(makeCandidate('R2', {
        idInputs: [[e.pointer]],
        task_ids: [e.event.task_id ?? null],
        source_pointers: [e.pointer],
        recorded_timestamps: { timestamp: e.event.timestamp ?? null },
        match_description: `event type is "${e.event.type}"`,
        retained: { type: e.event.type, run_id: e.event.run_id ?? null },
      }));
    }
  }
  return { candidates: out, insufficient: [] };
}

// R3 attempts >= 2 [REF]. The repo records the attempt count as `attempts`
// (scripts/task-state.mjs; Spec §5.3, C-14), not the prep's `attempt_count`.
function ruleR3({ tasks }) {
  const out = [];
  for (const t of tasks) {
    const { attempts } = t.record;
    if (typeof attempts === 'number' && attempts >= 2) {
      out.push(makeCandidate('R3', {
        idInputs: [[t.pointer]],
        task_ids: [t.id],
        source_pointers: [t.pointer],
        recorded_timestamps: { created: t.record.created ?? null, updated: t.record.updated ?? null },
        match_description: 'recorded attempts is >= 2',
        retained: { attempts },
      }));
    }
  }
  return { candidates: out, insufficient: [] };
}

// R4 same blocker/event across >= 2 tasks [REF rule; addendum CR-04 semantics, DET-6].
// Key = a recorded blocker string, compared by exact equality: no trimming,
// no case folding, no similarity. Missing, blank, or incomparable keys give
// "insufficient evidence", never a candidate. The event dimension is NOT
// evaluated: the Spec names no event field as the R4 key (see notEvaluated).
function ruleR4({ tasks }) {
  const insuff = [];
  const groups = new Map(); // exact key -> Map(task id -> { at, record })
  for (const t of tasks) {
    const { blockers } = t.record;
    if (!('blockers' in t.record) || blockers === undefined || blockers === null) {
      insuff.push(insufficient('R4', INSUFFICIENT_R4, 'blockers field missing', t.id, t.pointer));
      continue;
    }
    if (!Array.isArray(blockers)) {
      insuff.push(insufficient('R4', INSUFFICIENT_R4, `blockers recorded as ${typeof blockers}, not a list`, t.id, t.pointer));
      continue;
    }
    blockers.forEach((key, i) => {
      const at = `${t.pointer}#blockers[${i}]`;
      if (typeof key !== 'string') {
        insuff.push(insufficient('R4', INSUFFICIENT_R4, `blocker recorded as ${key === null ? 'null' : typeof key}, not a string`, t.id, at));
      } else if (key.trim() === '') {
        insuff.push(insufficient('R4', INSUFFICIENT_R4, 'blocker key is blank', t.id, at));
      } else {
        if (!groups.has(key)) groups.set(key, new Map());
        if (!groups.get(key).has(t.id)) groups.get(key).set(t.id, { at, record: t.record });
      }
    });
  }
  const out = [];
  for (const [key, byTask] of groups) {
    if (byTask.size < 2) continue;
    const ids = [...byTask.keys()].sort();
    const pointers = ids.map((id) => byTask.get(id).at);
    // Timestamps as recorded (DET-9), one entry per contributing task. Not an
    // id input: the DET-8 id stays rule + key + sorted pointers.
    const perTaskTimestamps = ids.map((id) => {
      const { at, record } = byTask.get(id);
      return { task_id: id, source_pointer: at, created: record.created ?? null, updated: record.updated ?? null };
    });
    out.push(makeCandidate('R4', {
      idInputs: [key, [...pointers].sort()],
      task_ids: ids,
      source_pointers: pointers,
      recorded_timestamps: { per_task: perTaskTimestamps },
      match_description: `the exact recorded blocker key appears on ${ids.length} distinct tasks`,
      retained: { key, key_source: 'blockers', per_task: ids.map((id) => ({ task_id: id, source_pointer: byTask.get(id).at })) },
    }));
  }
  return { candidates: out, insufficient: insuff };
}

// R5 retry_exhausted [REF]: event type retry_exhausted.
function ruleR5({ events }) {
  const out = [];
  for (const e of events) {
    if (e.event.type === 'retry_exhausted') {
      out.push(makeCandidate('R5', {
        idInputs: [[e.pointer]],
        task_ids: [e.event.task_id ?? null],
        source_pointers: [e.pointer],
        recorded_timestamps: { timestamp: e.event.timestamp ?? null },
        match_description: 'event type is "retry_exhausted"',
        retained: { type: e.event.type, run_id: e.event.run_id ?? null },
      }));
    }
  }
  return { candidates: out, insufficient: [] };
}

// R6 stuck in_progress > 2 ticks [REF rule; addendum CR-04 semantics, DET-7].
// Distance is counted in a recorded tick index (an ordered list of tick ids;
// the current tick is its last entry), never in wall-clock time. Distance 2
// does not match; 3 or more matches. The task's last-progress tick is read
// from `last_progress_tick` (Spec pseudocode name; no repo record has it).
// No tick index exists in the repository (Spec §5.3) and the CLI reads none,
// so operationally every in_progress task yields "insufficient evidence".
// `tickIndex` is accepted by scan() only so DET-7 can be exercised on
// SYNTHETIC fixtures; no tick source is read or inferred here.
function ruleR6({ tasks, tickIndex }) {
  const out = [];
  const insuff = [];
  const ticks = Array.isArray(tickIndex) ? tickIndex : null;
  const current = ticks && ticks.length > 0 ? ticks[ticks.length - 1] : null;
  const currentOk =
    typeof current === 'string' && current.trim() !== '' && ticks.indexOf(current) === ticks.length - 1;
  for (const t of tasks) {
    if (t.record.status !== 'in_progress') continue;
    const last = t.record.last_progress_tick;
    const no = (detail) => insuff.push(insufficient('R6', INSUFFICIENT_R6, detail, t.id, t.pointer));
    if (typeof last !== 'string' || last.trim() === '') { no('last-progress tick missing'); continue; }
    if (!ticks) { no('no recorded tick index available'); continue; }
    if (!currentOk) { no('current tick not determinable from the tick index'); continue; }
    const at = ticks.indexOf(last);
    if (at === -1) { no('last-progress tick not in the tick index'); continue; }
    if (ticks.lastIndexOf(last) !== at) { no('last-progress tick appears more than once in the tick index'); continue; }
    const distance = ticks.length - 1 - at;
    if (distance >= 3) {
      out.push(makeCandidate('R6', {
        idInputs: [t.id, last, [t.pointer]],
        task_ids: [t.id],
        source_pointers: [t.pointer],
        recorded_timestamps: { created: t.record.created ?? null, updated: t.record.updated ?? null },
        match_description: `status is "in_progress" and tick-index distance is ${distance} (> 2)`,
        retained: { last_progress_tick: last, current_tick: current, distance, tick_index_refs: { last_progress_position: at, current_position: ticks.length - 1 } },
      }));
    }
  }
  return { candidates: out, insufficient: insuff };
}

export const RULE_BRANCHES = { R1: ruleR1, R2: ruleR2, R3: ruleR3, R4: ruleR4, R5: ruleR5, R6: ruleR6 };

// Scope a scan did not cover, recorded so a null result is not mistaken for a check.
const NOT_EVALUATED = [
  {
    rule: 'R4',
    scope: 'event dimension ("same event across >= 2 tasks")',
    reason: 'The Specification names no event field as the R4 key; no key is invented (T1 builder report, open items).',
  },
];

// Pure scan over already-read records. Returns detector candidates (sorted by
// id), insufficient-evidence entries (records, not candidates), and the scope
// not evaluated.
export function scan({ tasks = [], events = [], tickIndex = null } = {}) {
  const candidates = [];
  const insufficientList = [];
  for (const branch of Object.values(RULE_BRANCHES)) {
    const r = branch({ tasks, events, tickIndex });
    candidates.push(...r.candidates);
    insufficientList.push(...r.insufficient);
  }
  candidates.sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
  return { candidates, insufficient: insufficientList, not_evaluated: NOT_EVALUATED };
}

export function scanPaths({ tasksDir, eventsFile, root = process.cwd(), tickIndex = null }) {
  return scan({ tasks: readTaskRecords(tasksDir, root), events: readEventRecords(eventsFile, root), tickIndex });
}

// ---- Creating SIE detector-candidate records (the detector's only write) ----

export function renderCandidate(c) {
  return [
    `# Detector candidate ${c.candidate_id}`,
    '',
    `**DETECTOR CANDIDATE (rule ${c.rule}, ${c.rule_name}).** ${CANDIDATE_NOTE}`,
    '',
    `Rule basis: ${RULE_BASIS}.`,
    '',
    '```json',
    JSON.stringify(c, null, 2),
    '```',
    '',
  ].join('\n');
}

const inside = (child, parent) => child === parent || child.startsWith(parent + sep);

// Filesystem-resolved path: realpath of the deepest existing ancestor, with
// the not-yet-existing remainder appended, so a symlink anywhere along the
// path is followed even when the target directory does not exist yet. A
// dangling symlink cannot be resolved and is refused.
function realResolve(p) {
  let cur = resolve(p);
  const rest = [];
  for (;;) {
    let isLink = false;
    try {
      isLink = lstatSync(cur).isSymbolicLink();
    } catch {
      const parent = dirname(cur);
      if (parent === cur) break;
      rest.unshift(basename(cur));
      cur = parent;
      continue;
    }
    if (isLink && !existsSync(cur)) throw new Error(`Refusing to write through an unresolvable symlink: ${cur}`);
    break;
  }
  return join(realpathSync(cur), ...rest);
}

// Writes each candidate as <candidate_id>.md with exclusive create: an existing
// file is left untouched and reported as existing, so repeated scans never
// duplicate or rewrite a candidate record. Refuses any output location inside
// a tasks directory or on an events file, comparing filesystem-resolved paths
// (symlink aliases included) before anything is created.
export function writeCandidates(candidates, outDir, { tasksDir, eventsFile } = {}) {
  const out = realResolve(outDir);
  const forbidden = [fileURLToPath(new URL('../tasks', import.meta.url)), tasksDir].filter(Boolean).map(realResolve);
  for (const dir of forbidden) {
    if (inside(out, dir)) throw new Error(`Refusing to write candidate records inside a task-record directory: ${outDir} (resolves to ${out})`);
  }
  const events = eventsFile ? realResolve(eventsFile) : null;
  mkdirSync(out, { recursive: true });
  const created = [];
  const existing = [];
  for (const c of candidates) {
    const file = join(out, `${c.candidate_id}.md`);
    if (events && file === events) throw new Error(`Refusing to write over an events file: ${file}`);
    if (existsSync(file)) { existing.push(c.candidate_id); continue; }
    try {
      writeFileSync(file, renderCandidate(c), { flag: 'wx' });
      created.push(c.candidate_id);
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      existing.push(c.candidate_id);
    }
  }
  return { created, existing };
}

// ---- CLI ----
// node scripts/sie-detector.mjs --tasks <dir> --events <file> [--out <dir>]
// Paths are required, with no defaults, so the detector is never pointed at
// operational records by accident (Stage 3 starts no live loop). Without
// --out it prints the scan as JSON and writes nothing. There is no tick-index
// option: no tick source is authorized under SIE-03.
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!['--tasks', '--events', '--out'].includes(flag) || value === undefined) {
      throw new Error(`Usage: node scripts/sie-detector.mjs --tasks <dir> --events <file> [--out <dir>] (bad argument: ${flag})`);
    }
    opts[flag.slice(2)] = value;
  }
  if (!opts.tasks || !opts.events) throw new Error('Usage: node scripts/sie-detector.mjs --tasks <dir> --events <file> [--out <dir>]');
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const result = scanPaths({ tasksDir: opts.tasks, eventsFile: opts.events });
    if (opts.out) {
      const written = writeCandidates(result.candidates, opts.out, { tasksDir: opts.tasks, eventsFile: opts.events });
      console.log(JSON.stringify({ ...written, insufficient: result.insufficient, not_evaluated: result.not_evaluated }, null, 2));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
