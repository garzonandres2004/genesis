// Tests for the SIE detector (Stage 3 T1, AC-T1-1..AC-T1-5). All inputs are
// SYNTHETIC fixtures (scripts/fixtures/sie-SYNTHETIC/) or SYNTHETIC records
// built inline. A pass means "detector recognition on synthetic input" (test
// mechanics verified on fixtures), not "system verified".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RULE_BRANCHES, INSUFFICIENT_R4, INSUFFICIENT_R6, candidateId, scan, scanPaths, writeCandidates,
} from './sie-detector.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'sie-detector.mjs');
const source = readFileSync(script, 'utf8');
const FX = join(here, 'fixtures', 'sie-SYNTHETIC');
const ALL_FIXTURES = ['F-R1', 'F-R2', 'F-R3', 'F-R4', 'F-R4-INS', 'F-R5', 'F-R6', 'F-R6-INS', 'F-R6-INS-c'];

function ticksOf(dir) {
  const f = join(dir, 'SYNTHETIC-tick-index.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).ticks : null;
}

function scanFixture(name, { withTicks = true } = {}) {
  const dir = join(FX, `${name}-SYNTHETIC`);
  return scanPaths({
    tasksDir: join(dir, 'tasks'),
    eventsFile: join(dir, 'SYNTHETIC-events.jsonl'),
    root: dir,
    tickIndex: withTicks ? ticksOf(dir) : null,
  });
}

const summary = (r) => r.candidates.map((c) => `${c.rule}:${c.task_ids.join(',')}`).sort();

function fileHashes(dir) {
  const out = {};
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out[p] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return out;
}

const synthetic = (id, fields) => ({ id: `SYNTHETIC-${id}`, pointer: `tasks/SYNTHETIC-${id}.json`, record: { id: `SYNTHETIC-${id}`, blockers: [], ...fields } });

// ---- AC-T1-1: exactly one branch per rule, no additional matching rule ----

test('AC-T1-1: exactly six rule branches, R1-R6, and no other', () => {
  assert.deepEqual(Object.keys(RULE_BRANCHES), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
});

test('AC-T1-1: each rule builds candidates in exactly one place in the source', () => {
  for (const rule of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']) {
    assert.equal(source.split(`makeCandidate('${rule}'`).length - 1, 1, `${rule} candidate construction count`);
  }
  assert.equal(source.match(/makeCandidate\('/g).length, 6, 'no candidate construction outside R1-R6');
});

// ---- AC-T1-2: at most a candidate, never a runner-caused-failure verdict ----

test('AC-T1-2: every output is a detector candidate with only DET-9 fields; none carries a verdict', () => {
  const keys = ['candidate_id', 'match_description', 'note', 'record_type', 'recorded_timestamps', 'retained_values',
    'rule', 'rule_basis', 'rule_name', 'source_pointers', 'task_ids'];
  let seen = 0;
  for (const name of ALL_FIXTURES) {
    for (const c of scanFixture(name).candidates) {
      seen++;
      assert.equal(c.record_type, 'detector-candidate');
      assert.deepEqual(Object.keys(c).sort(), keys);
      assert.match(c.note, /not a runner-caused-failure verdict; no cause is determined/);
      assert.match(c.rule_basis, /UNVERIFIED against WP-04 v1\.1 verbatim/);
    }
  }
  assert.ok(seen > 0);
  assert.doesNotMatch(source, /\b(verdict|cause|classification)\s*:/, 'no verdict/cause field is ever emitted');
});

// ---- AC-T1-3: read-only boundary, stated and enforced ----

test('AC-T1-3: the read-only boundary and the candidate-record distinction are stated in code', () => {
  assert.match(source, /READ-ONLY BOUNDARY/);
  assert.match(source, /never modifies, reclassifies, backfills, renames, or\s*\n\/\/\s*deletes a source record/);
  assert.match(source, /never writes into tasks\/ or events\.jsonl/);
  assert.match(source, /CREATING SIE detector-candidate records/);
  assert.match(source, /Creating candidate records is a different act from reading Runner records/);
});

test('AC-T1-3: the only file writes are exclusive-create candidate files (no append, rename, delete, truncate)', () => {
  assert.doesNotMatch(source, /appendFile|renameSync|unlinkSync|rmSync|truncate|createWriteStream/);
  assert.equal(source.match(/writeFileSync\(/g).length, 1);
  assert.match(source, /writeFileSync\(file, renderCandidate\(c\), \{ flag: 'wx' \}\)/);
});

test('AC-T1-3: scanning and writing leave every source record byte-identical', () => {
  const before = fileHashes(FX);
  const out = mkdtempSync(join(tmpdir(), 'genesis-sie-'));
  for (const name of ALL_FIXTURES) {
    const dir = join(FX, `${name}-SYNTHETIC`);
    writeCandidates(scanFixture(name).candidates, out, { tasksDir: join(dir, 'tasks'), eventsFile: join(dir, 'SYNTHETIC-events.jsonl') });
  }
  assert.deepEqual(fileHashes(FX), before);
});

test('AC-T1-3: refuses to write candidate records inside a task-record directory', () => {
  const tasksDir = join(FX, 'F-R1-SYNTHETIC', 'tasks');
  const { candidates } = scanFixture('F-R1');
  assert.throws(() => writeCandidates(candidates, tasksDir, { tasksDir }), /Refusing to write/);
  assert.throws(() => writeCandidates(candidates, join(tasksDir, 'sub'), { tasksDir }), /Refusing to write/);
  assert.throws(() => writeCandidates(candidates, join(here, '..', 'tasks')), /Refusing to write/);
});

test('AC-T1-3: refuses symlink aliases into a task-record directory, before creating anything', () => {
  const tasksDir = join(FX, 'F-R1-SYNTHETIC', 'tasks');
  const repoTasks = join(here, '..', 'tasks');
  const { candidates } = scanFixture('F-R1');
  const tmp = mkdtempSync(join(tmpdir(), 'genesis-sie-alias-'));
  symlinkSync(tasksDir, join(tmp, 'alias'), 'dir');
  symlinkSync(repoTasks, join(tmp, 'repo-tasks-alias'), 'dir');
  symlinkSync(join(tmp, 'missing-target'), join(tmp, 'dangling'));
  const before = { fixture: readdirSync(tasksDir).sort(), repo: readdirSync(repoTasks).sort() };
  // Output reached through the alias, directly and as a not-yet-existing descendant.
  assert.throws(() => writeCandidates(candidates, join(tmp, 'alias'), { tasksDir }), /Refusing to write/);
  assert.throws(() => writeCandidates(candidates, join(tmp, 'alias', 'new', 'sub'), { tasksDir }), /Refusing to write/);
  // The protected directory itself named through an alias.
  assert.throws(() => writeCandidates(candidates, tasksDir, { tasksDir: join(tmp, 'alias') }), /Refusing to write/);
  // An alias of the repository's own tasks/ is refused with no tasksDir given.
  assert.throws(() => writeCandidates(candidates, join(tmp, 'repo-tasks-alias')), /Refusing to write/);
  assert.throws(() => writeCandidates(candidates, join(tmp, 'dangling', 'out')), /Refusing to write/);
  assert.deepEqual({ fixture: readdirSync(tasksDir).sort(), repo: readdirSync(repoTasks).sort() }, before);
  assert.ok(!existsSync(join(tmp, 'missing-target')), 'nothing created through the dangling symlink');
  // A real output directory beside the aliases still works.
  assert.equal(writeCandidates(candidates, join(tmp, 'out'), { tasksDir: join(tmp, 'alias') }).created.length, 1);
});

test('AC-T1-3: the CLI requires explicit paths and writes nothing without --out', () => {
  assert.throws(() => execFileSync('node', [script], { stdio: 'pipe' }));
  const dir = join(FX, 'F-R1-SYNTHETIC');
  const before = fileHashes(FX);
  const out = JSON.parse(execFileSync('node', [script, '--tasks', join(dir, 'tasks'), '--events', join(dir, 'SYNTHETIC-events.jsonl')], { cwd: dir, encoding: 'utf8' }));
  assert.equal(out.candidates.length, 1);
  assert.deepEqual(fileHashes(FX), before);
});

// ---- AC-T1-4: R4 exact match; R6 tick-index distance; insufficient evidence ----

test('AC-T1-4 / F-R4: one R4 candidate on an exact key shared by 3 tasks; the control key gives none', () => {
  const r4 = scanFixture('F-R4').candidates.filter((c) => c.rule === 'R4');
  assert.equal(r4.length, 1);
  assert.equal(r4[0].retained_values.key, 'SYNTHETIC shared blocker key X');
  assert.deepEqual(r4[0].task_ids, ['SYNTHETIC-fr4-shared-1', 'SYNTHETIC-fr4-shared-2', 'SYNTHETIC-fr4-shared-3']);
  assert.deepEqual(r4[0].retained_values.per_task.map((p) => p.source_pointer), [
    'tasks/SYNTHETIC-fr4-shared-1.json#blockers[0]', 'tasks/SYNTHETIC-fr4-shared-2.json#blockers[0]', 'tasks/SYNTHETIC-fr4-shared-3.json#blockers[0]',
  ]);
  assert.deepEqual(r4[0].recorded_timestamps, { per_task: [1, 2, 3].map((n) => ({
    task_id: `SYNTHETIC-fr4-shared-${n}`, source_pointer: `tasks/SYNTHETIC-fr4-shared-${n}.json#blockers[0]`,
    created: '2026-01-01', updated: '2026-01-01',
  })) });
});

test('DET-9 / R4: recorded timestamps stay with their own task; they are not DET-8 id inputs', () => {
  const r = scan({ tasks: [
    synthetic('ts-b', { blockers: ['SYNTHETIC k'], created: '2026-02-01', updated: '2026-02-03' }),
    synthetic('ts-a', { blockers: ['SYNTHETIC k'], created: '2026-01-01' }),
  ] });
  const [c] = r.candidates;
  assert.deepEqual(c.recorded_timestamps.per_task, [
    { task_id: 'SYNTHETIC-ts-a', source_pointer: 'tasks/SYNTHETIC-ts-a.json#blockers[0]', created: '2026-01-01', updated: null },
    { task_id: 'SYNTHETIC-ts-b', source_pointer: 'tasks/SYNTHETIC-ts-b.json#blockers[0]', created: '2026-02-01', updated: '2026-02-03' },
  ]);
  assert.equal(c.candidate_id, candidateId('R4', ['SYNTHETIC k', ['tasks/SYNTHETIC-ts-a.json#blockers[0]', 'tasks/SYNTHETIC-ts-b.json#blockers[0]']]));
});

test('AC-T1-4 / F-R4-INS: missing, blank, incomparable keys give insufficient evidence; case/whitespace variants are different keys', () => {
  const r = scanFixture('F-R4-INS');
  assert.equal(r.candidates.length, 0);
  const ins = r.insufficient.filter((i) => i.rule === 'R4');
  assert.ok(ins.every((i) => i.reason === INSUFFICIENT_R4));
  assert.deepEqual(ins.map((i) => i.task_id).sort(), [
    'SYNTHETIC-fr4ins-a-missing', 'SYNTHETIC-fr4ins-b-blank', 'SYNTHETIC-fr4ins-c1-object', 'SYNTHETIC-fr4ins-c2-not-list',
  ]);
  assert.ok(!r.insufficient.some((i) => i.task_id.includes('-d')), 'case (d) is not insufficient: the keys are exact and different');
});

test('AC-T1-4: R4 never groups blank or incomparable keys, even when they repeat across tasks', () => {
  const r = scan({ tasks: [
    synthetic('blank-1', { blockers: [''] }), synthetic('blank-2', { blockers: [''] }),
    synthetic('obj-1', { blockers: [{ k: 1 }] }), synthetic('obj-2', { blockers: [{ k: 1 }] }),
    synthetic('num-1', { blockers: [7] }), synthetic('num-2', { blockers: [7] }),
  ] });
  assert.equal(r.candidates.length, 0);
  assert.equal(r.insufficient.filter((i) => i.reason === INSUFFICIENT_R4).length, 6);
});

test('AC-T1-4: R4 counts distinct tasks, so one task repeating a key does not fire', () => {
  const r = scan({ tasks: [synthetic('dup', { blockers: ['SYNTHETIC k', 'SYNTHETIC k'] })] });
  assert.equal(r.candidates.length, 0);
});

test('AC-T1-4: the R4 event dimension is recorded as not evaluated, not silently skipped', () => {
  const r = scan({});
  assert.deepEqual(r.not_evaluated.map((n) => n.rule), ['R4']);
  assert.match(r.not_evaluated[0].scope, /event dimension/);
});

test('AC-T1-4 / F-R6: fires at tick-index distance 3 only; distance 2 and distance 0 do not', () => {
  const r6 = scanFixture('F-R6').candidates.filter((c) => c.rule === 'R6');
  assert.equal(r6.length, 1);
  assert.deepEqual(r6[0].task_ids, ['SYNTHETIC-fr6-distance-3']);
  assert.deepEqual(r6[0].retained_values, {
    last_progress_tick: 'SYNTHETIC-tick-003', current_tick: 'SYNTHETIC-tick-006', distance: 3,
    tick_index_refs: { last_progress_position: 2, current_position: 5 },
  });
});

test('AC-T1-4 / F-R6-INS: undeterminable tick positions give insufficient evidence, never a candidate', () => {
  const ab = scanFixture('F-R6-INS');
  assert.equal(ab.candidates.length, 0);
  assert.deepEqual(ab.insufficient.map((i) => [i.task_id, i.reason]).sort(), [
    ['SYNTHETIC-fr6ins-a-missing-tick', INSUFFICIENT_R6], ['SYNTHETIC-fr6ins-b-not-in-index', INSUFFICIENT_R6],
  ]);
  const c = scanFixture('F-R6-INS-c');
  assert.equal(c.candidates.length, 0);
  assert.deepEqual(c.insufficient.map((i) => [i.task_id, i.reason, i.detail]), [
    ['SYNTHETIC-fr6ins-c-no-current', INSUFFICIENT_R6, 'current tick not determinable from the tick index'],
  ]);
});

test('AC-T1-4: with no recorded tick index (the repository today), every in_progress task is insufficient evidence', () => {
  const r = scanFixture('F-R6', { withTicks: false });
  assert.equal(r.candidates.length, 0);
  assert.equal(r.insufficient.length, 3);
  assert.ok(r.insufficient.every((i) => i.rule === 'R6' && i.reason === INSUFFICIENT_R6));
});

test('AC-T1-4: R6 ignores tasks that are not in_progress, and a repeated tick makes the position undeterminable', () => {
  const ticks = ['SYNTHETIC-t1', 'SYNTHETIC-t2', 'SYNTHETIC-t1', 'SYNTHETIC-t3', 'SYNTHETIC-t4', 'SYNTHETIC-t5'];
  const r = scan({ tickIndex: ticks, tasks: [
    synthetic('queued', { status: 'queued', last_progress_tick: 'SYNTHETIC-t2' }),
    synthetic('dup-tick', { status: 'in_progress', last_progress_tick: 'SYNTHETIC-t1' }),
  ] });
  assert.equal(r.candidates.length, 0);
  assert.deepEqual(r.insufficient.map((i) => i.task_id), ['SYNTHETIC-dup-tick']);
});

// ---- AC-T1-5: each fixture produces exactly the expected candidates ----

test('AC-T1-5: fixtures F-R1-F-R6 produce exactly the expected detector candidates (controls produce zero)', () => {
  assert.deepEqual(summary(scanFixture('F-R1')), ['R1:SYNTHETIC-fr1-blocked']);
  assert.deepEqual(summary(scanFixture('F-R2')), ['R2:SYNTHETIC-fr2-a', 'R2:SYNTHETIC-fr2-b']);
  assert.deepEqual(summary(scanFixture('F-R3')), ['R3:SYNTHETIC-fr3-attempts-2', 'R3:SYNTHETIC-fr3-attempts-3']);
  assert.deepEqual(summary(scanFixture('F-R4')), [
    'R1:SYNTHETIC-fr4-control', 'R1:SYNTHETIC-fr4-shared-1', 'R1:SYNTHETIC-fr4-shared-2', 'R1:SYNTHETIC-fr4-shared-3',
    'R4:SYNTHETIC-fr4-shared-1,SYNTHETIC-fr4-shared-2,SYNTHETIC-fr4-shared-3',
  ]);
  assert.deepEqual(summary(scanFixture('F-R4-INS')), []);
  assert.deepEqual(summary(scanFixture('F-R5')), ['R5:SYNTHETIC-fr5-a']);
  assert.deepEqual(summary(scanFixture('F-R6')), ['R6:SYNTHETIC-fr6-distance-3']);
  assert.deepEqual(summary(scanFixture('F-R6-INS')), []);
  assert.deepEqual(summary(scanFixture('F-R6-INS-c')), []);
  for (const name of ['F-R1', 'F-R2', 'F-R3', 'F-R4', 'F-R5', 'F-R6']) {
    assert.deepEqual(scanFixture(name).insufficient, [], `${name} has no insufficient-evidence entries`);
  }
});

test('AC-T1-5: candidates keep the exact source pointers', () => {
  assert.deepEqual(scanFixture('F-R1').candidates[0].source_pointers, ['tasks/SYNTHETIC-fr1-blocked.json']);
  assert.deepEqual(scanFixture('F-R2').candidates.map((c) => c.source_pointers[0]).sort(), ['SYNTHETIC-events.jsonl#L1', 'SYNTHETIC-events.jsonl#L2']);
  assert.deepEqual(scanFixture('F-R5').candidates[0].source_pointers, ['SYNTHETIC-events.jsonl#L1']);
});

// ---- F-DUP / DET-8: deterministic id, no duplicate candidate records ----

test('F-DUP: repeated scans give the same ids, and a second write creates no records', () => {
  const out = mkdtempSync(join(tmpdir(), 'genesis-sie-'));
  const first = { created: [], existing: [] };
  const second = { created: [], existing: [] };
  const ids1 = [];
  const ids2 = [];
  for (const pass of [first, second]) {
    for (const name of ALL_FIXTURES) {
      const { candidates } = scanFixture(name);
      (pass === first ? ids1 : ids2).push(...candidates.map((c) => c.candidate_id));
      const w = writeCandidates(candidates, out);
      pass.created.push(...w.created);
      pass.existing.push(...w.existing);
    }
  }
  const contents = Object.fromEntries(readdirSync(out).map((f) => [f, readFileSync(join(out, f), 'utf8')]));
  assert.deepEqual(ids2, ids1);
  assert.equal(new Set(ids1).size, ids1.length, 'ids are unique within a scan');
  assert.equal(first.created.length, ids1.length);
  assert.deepEqual(second.created, []);
  assert.deepEqual(second.existing.sort(), [...ids1].sort());
  assert.equal(readdirSync(out).length, ids1.length);
  for (const f of readdirSync(out)) assert.equal(readFileSync(join(out, f), 'utf8'), contents[f]);
});

test('DET-8: the id depends only on its inputs; R6 uses the last-progress tick, not the current tick', () => {
  assert.equal(candidateId('R1', [['tasks/a.json']]), candidateId('R1', [['tasks/a.json']]));
  assert.notEqual(candidateId('R1', [['tasks/a.json']]), candidateId('R1', [['tasks/b.json']]));
  assert.notEqual(candidateId('R1', [['tasks/a.json']]), candidateId('R3', [['tasks/a.json']]));
  const task = synthetic('stuck', { status: 'in_progress', last_progress_tick: 'SYNTHETIC-t1' });
  const now = scan({ tasks: [task], tickIndex: ['SYNTHETIC-t1', 'SYNTHETIC-t2', 'SYNTHETIC-t3', 'SYNTHETIC-t4'] });
  const later = scan({ tasks: [task], tickIndex: ['SYNTHETIC-t1', 'SYNTHETIC-t2', 'SYNTHETIC-t3', 'SYNTHETIC-t4', 'SYNTHETIC-t5'] });
  assert.equal(now.candidates[0].candidate_id, later.candidates[0].candidate_id, 'one stuck episode, one candidate id');
});

test('written candidate records are labeled detector candidates and carry the working-basis note', () => {
  const out = mkdtempSync(join(tmpdir(), 'genesis-sie-'));
  const dir = join(FX, 'F-R5-SYNTHETIC');
  execFileSync('node', [script, '--tasks', join(dir, 'tasks'), '--events', join(dir, 'SYNTHETIC-events.jsonl'), '--out', out], { cwd: dir });
  const files = readdirSync(out);
  assert.equal(files.length, 1);
  assert.match(files[0], /^CAND-R5-[0-9a-f]{16}\.md$/);
  const text = readFileSync(join(out, files[0]), 'utf8');
  assert.match(text, /\*\*DETECTOR CANDIDATE \(rule R5, retry_exhausted\)\.\*\*/);
  assert.match(text, /UNVERIFIED against WP-04 v1\.1 verbatim/);
});
