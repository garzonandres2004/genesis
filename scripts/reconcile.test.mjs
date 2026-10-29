import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcile, runReconcile } from './reconcile.mjs';
import { appendEvent, readEvents } from './events.mjs';

const NOW = '2026-10-28T12:00:00.000Z';
const run = (n) => ({ id: `t-1/run-${n}-2026-10-28T10:0${n}:00.000Z`, started_at: '2026-10-28T10:00:00.000Z', outcome: null });
const started = (r) => ({ type: 'task_started', task_id: 't-1', run_id: r.id, timestamp: NOW, detail: '' });

function interrupted(attempts) {
  const r = run(attempts);
  return { task: { id: 't-1', status: 'in_progress', attempts, runs: [r], blockers: [] }, events: [started(r)], r };
}

function fixture(tasks, events = []) {
  const root = mkdtempSync(join(tmpdir(), 'genesis-reconcile-'));
  mkdirSync(join(root, 'tasks'));
  for (const t of tasks) writeFileSync(join(root, 'tasks', `${t.id}.json`), JSON.stringify(t));
  for (const e of events) appendEvent(e, join(root, 'events.jsonl'));
  return root;
}

test('interrupted run with budget left is re-queued', () => {
  const { task, events, r } = interrupted(1);
  const { tasks, newEvents } = reconcile([task], events, NOW);
  assert.equal(tasks[0].status, 'queued');
  assert.equal(tasks[0].runs[0].outcome, 'interrupted');
  assert.deepEqual(newEvents.map((e) => e.type), ['run_interrupted', 'task_requeued']);
  assert.ok(newEvents.every((e) => e.run_id === r.id));
});

test('open run with no events at all (crash before task_started) is re-queued, then stable', () => {
  const { task } = interrupted(1);
  const root = fixture([task], []);
  const first = runReconcile({ root, now: NOW });
  const taskFile = join(root, 'tasks', 't-1.json');
  const saved = JSON.parse(readFileSync(taskFile, 'utf8'));
  assert.equal(saved.status, 'queued');
  assert.equal(saved.runs[0].outcome, 'interrupted');
  assert.deepEqual(first.newEvents.map((e) => e.type), ['run_interrupted', 'task_requeued']);

  const taskAfter = readFileSync(taskFile, 'utf8');
  const eventsAfter = readFileSync(join(root, 'events.jsonl'), 'utf8');
  const second = runReconcile({ root, now: '2026-10-28T13:00:00.000Z' });
  assert.equal(second.newEvents.length, 0);
  assert.equal(readFileSync(taskFile, 'utf8'), taskAfter);
  assert.equal(readFileSync(join(root, 'events.jsonl'), 'utf8'), eventsAfter);
});

test('retry exhaustion: attempts = 3 blocks the task with retry_exhausted', () => {
  const { task, events } = interrupted(3);
  const { tasks, newEvents } = reconcile([task], events, NOW);
  assert.equal(tasks[0].status, 'blocked');
  assert.equal(tasks[0].runs[0].outcome, 'interrupted');
  assert.match(tasks[0].blockers.at(-1), /retry budget exhausted/);
  assert.deepEqual(newEvents.map((e) => e.type), ['run_interrupted', 'retry_exhausted']);
  assert.equal(newEvents[1].detail, 'retry budget exhausted');
});

test('runs with a terminal event are not interrupted', () => {
  for (const type of ['task_completed', 'task_failed', 'task_blocked']) {
    const { task, events, r } = interrupted(1);
    const { tasks, newEvents } = reconcile([task], [...events, { type, task_id: 't-1', run_id: r.id }], NOW);
    assert.equal(tasks[0], task);
    assert.equal(newEvents.length, 0);
  }
});

test('recovery after restart: re-queued on disk, second reconcile changes nothing', () => {
  const { task, events } = interrupted(1);
  const root = fixture([task], events);
  runReconcile({ root, now: NOW });
  const taskFile = join(root, 'tasks', 't-1.json');
  assert.equal(JSON.parse(readFileSync(taskFile, 'utf8')).status, 'queued');

  const taskAfter = readFileSync(taskFile, 'utf8');
  const eventsAfter = readFileSync(join(root, 'events.jsonl'), 'utf8');
  const second = runReconcile({ root, now: '2026-10-28T13:00:00.000Z' });
  assert.equal(second.newEvents.length, 0);
  assert.equal(readFileSync(taskFile, 'utf8'), taskAfter);
  assert.equal(readFileSync(join(root, 'events.jsonl'), 'utf8'), eventsAfter);
});

test('blocked, completed, and queued tasks are left untouched', () => {
  const mk = (id, status) => ({ id, status, attempts: 1, runs: [run(1)] });
  const tasks = [mk('b', 'blocked'), mk('c', 'completed'), mk('q', 'queued')];
  // Even a dangling started event must not matter for non-in_progress tasks.
  const events = tasks.map((t) => ({ type: 'task_started', task_id: t.id, run_id: t.runs[0].id }));
  const root = fixture(tasks, events);
  const before = tasks.map((t) => readFileSync(join(root, 'tasks', `${t.id}.json`), 'utf8'));
  const result = runReconcile({ root, now: NOW });
  assert.equal(result.newEvents.length, 0);
  tasks.forEach((t, i) => assert.equal(readFileSync(join(root, 'tasks', `${t.id}.json`), 'utf8'), before[i]));
});

test('event log is append-only: original lines remain an exact prefix', () => {
  const { task, events } = interrupted(1);
  const other = { id: 'other', status: 'queued' };
  const root = fixture([task, other], [{ type: 'task_completed', task_id: 'zzz', run_id: 'zzz/run-1-x' }, ...events]);
  const file = join(root, 'events.jsonl');
  const before = readFileSync(file, 'utf8');
  runReconcile({ root, now: NOW });
  const after = readFileSync(file, 'utf8');
  assert.ok(after.startsWith(before));
  assert.ok(after.length > before.length);
  assert.equal(readEvents(file).length, before.trim().split('\n').length + 2);
});

test('appendEvent creates the file, validates types, and records fields', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'genesis-events-')), 'events.jsonl');
  const e = appendEvent({ type: 'task_started', task_id: 'x', run_id: 'x/run-1-t', detail: 'hi' }, file);
  assert.deepEqual(readEvents(file), [e]);
  assert.match(e.timestamp, /^\d{4}-\d\d-\d\dT/);
  assert.throws(() => appendEvent({ type: 'nope', task_id: 'x' }, file), /Unknown event type/);
});

test('the real completed demo task is never rewritten', () => {
  const { task, events } = interrupted(1);
  const demo = { ...task, id: 'demo-end-to-end-001', runs: [{ ...task.runs[0], id: 'demo-end-to-end-001/run-1-x' }] };
  const { tasks, newEvents } = reconcile([demo], [{ ...events[0], task_id: demo.id, run_id: demo.runs[0].id }], NOW);
  assert.equal(tasks[0], demo);
  assert.equal(newEvents.length, 0);
});
