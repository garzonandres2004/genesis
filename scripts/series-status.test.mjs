import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeriesStatus } from './series-status.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'series-status.mjs');

function board(tasks, events = []) {
  const root = mkdtempSync(join(tmpdir(), 'genesis-series-'));
  mkdirSync(join(root, 'tasks'));
  for (const t of tasks) writeFileSync(join(root, 'tasks', `${t.id}.json`), JSON.stringify(t));
  writeFileSync(join(root, 'events.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + (events.length ? '\n' : ''));
  return root;
}
const task = (id, status, attempts, outcomes = [], blockers = []) => ({
  id, status, attempts, blockers,
  runs: outcomes.map((outcome, i) => ({ id: `${id}/run-${i + 1}`, started_at: 'x', outcome })),
});
const ev = (type, task_id, detail = '') => ({ type, task_id, run_id: `${task_id}/run-1`, timestamp: '2026-10-29T00:00:00.000Z', detail });

test('all-completed board: counts and no failure categories', () => {
  const root = board(
    [task('a', 'completed', 1, ['completed']), task('b', 'completed', 1, ['completed'])],
    [ev('task_started', 'a'), ev('task_completed', 'a'), ev('task_started', 'b'), ev('task_completed', 'b')],
  );
  const s = buildSeriesStatus(root);
  assert.deepEqual(s.counts, { total: 2, attempted: 2, completed: 2, blocked: 0 });
  assert.equal(s.tasks[0].attempts, 1);
  assert.deepEqual(s.tasks[0].run_outcomes, { completed: 1 });
  assert.deepEqual(s.failure_categories.by_blocker_text, {});
  for (const k of ['task_failed', 'run_interrupted', 'retry_exhausted', 'anomaly']) {
    assert.equal(s.failure_categories.by_event_type[k].count, 0);
  }
  assert.deepEqual(s.warnings, []);
});

test('interrupted + blocked board groups by blocker text and event type', () => {
  const root = board(
    [
      task('i', 'blocked', 3, ['interrupted', 'interrupted', 'interrupted'], ['retry budget exhausted']),
      task('n', 'blocked', 0, [], ['Needs founder decision']),
      task('q', 'blocked', 0, [], ['Needs founder decision']),
      task('ok', 'completed', 1, ['completed']),
    ],
    [
      ev('run_interrupted', 'i', 'open run with no terminal event found'),
      ev('run_interrupted', 'i', 'open run with no terminal event found'),
      ev('retry_exhausted', 'i', 'attempts 3 of 3'),
      ev('anomaly_surfaced', 'ok', '2 open PRs for branch'),
    ],
  );
  const s = buildSeriesStatus(root);
  assert.deepEqual(s.counts, { total: 4, attempted: 2, completed: 1, blocked: 3 });
  assert.deepEqual(s.tasks.find((t) => t.id === 'i').run_outcomes, { interrupted: 3 });
  const b = s.failure_categories.by_blocker_text;
  assert.equal(b['Needs founder decision'].count, 2);
  assert.deepEqual(b['Needs founder decision'].task_ids, ['n', 'q']);
  const e = s.failure_categories.by_event_type;
  assert.equal(e.run_interrupted.count, 2);
  assert.equal(e.run_interrupted.by_detail['open run with no terminal event found'].count, 2);
  assert.equal(e.retry_exhausted.count, 1);
  assert.equal(e.anomaly.count, 1);
  assert.deepEqual(e.anomaly.task_ids, ['ok']);
});

test('board with a failed run reports raw failure, no classification', () => {
  const root = board(
    [task('f', 'in_progress', 1, ['failed'])],
    [ev('task_started', 'f'), ev('task_failed', 'f', 'tests failed')],
  );
  const s = buildSeriesStatus(root);
  assert.deepEqual(s.tasks[0].run_outcomes, { failed: 1 });
  assert.equal(s.failure_categories.by_event_type.task_failed.count, 1);
  assert.equal(s.failure_categories.by_event_type.task_failed.by_detail['tests failed'].count, 1);
  assert.doesNotMatch(JSON.stringify(s), /runner[-_ ]caused|task[-_ ]caused|classif/i);
});

test('CLI prints one JSON object and --prefix scopes tasks and events', () => {
  const root = board(
    [task('m-1', 'completed', 1, ['completed']), task('x-1', 'blocked', 0, [], ['b'])],
    [ev('task_failed', 'x-1', 'boom')],
  );
  const out = JSON.parse(execFileSync('node', [script, root, '--prefix', 'm-'], { encoding: 'utf8' }));
  assert.equal(out.counts.total, 1);
  assert.equal(out.failure_categories.by_event_type.task_failed.count, 0);
  const all = JSON.parse(execFileSync('node', [script, root], { encoding: 'utf8' }));
  assert.equal(all.counts.total, 2);
});

test('missing events file and unparseable lines produce warnings, not crashes', () => {
  const root = board([task('a', 'queued', 0)]);
  writeFileSync(join(root, 'events.jsonl'), 'not json\n');
  const s = buildSeriesStatus(root);
  assert.equal(s.warnings.length, 1);
  assert.equal(s.counts.attempted, 0);
});
