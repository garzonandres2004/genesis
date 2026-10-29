import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcile, runReconcile } from './reconcile.mjs';
import { appendEvent, readEvents } from './events.mjs';
import { startRun, finishRun, transition } from './task-state.mjs';

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

// Stabilization gate regression tests (docs/runner-regression.md rows 3, 4, 6).
// Fixture-level: they exercise the state machine and reconciler only. Which step
// of a live tick decides "builder failed" or "verification failed" is cron-body
// prose; these tests cover what the code does once that outcome is recorded.

test('retry exhaustion end to end: attempt 3 interrupted => blocked, a further reconcile is a no-op', () => {
  const root = fixture([{ id: 't-1', status: 'queued', attempts: 0, runs: [], blockers: [] }]);
  const taskFile = join(root, 'tasks', 't-1.json');
  const eventsFile = join(root, 'events.jsonl');
  const read = () => JSON.parse(readFileSync(taskFile, 'utf8'));
  for (let n = 1; n <= 3; n++) {
    const begun = startRun(read(), `2026-10-28T1${n}:00:00.000Z`);
    writeFileSync(taskFile, JSON.stringify(begun));
    appendEvent({ type: 'task_started', task_id: 't-1', run_id: begun.runs.at(-1).id }, eventsFile);
    runReconcile({ root, now: `2026-10-28T1${n}:30:00.000Z` });
    assert.equal(read().attempts, n);
    assert.equal(read().status, n < 3 ? 'queued' : 'blocked');
  }
  const final = read();
  assert.deepEqual(final.runs.map((r) => r.outcome), ['interrupted', 'interrupted', 'interrupted']);
  assert.match(final.blockers.at(-1), /retry budget exhausted/);
  assert.equal(readEvents(eventsFile).filter((e) => e.type === 'retry_exhausted').length, 1);
  assert.equal(readEvents(eventsFile).filter((e) => e.type === 'task_requeued').length, 2);

  // the next reconcile changes nothing, and a blocked task cannot start a run
  const taskBefore = readFileSync(taskFile, 'utf8');
  const eventsBefore = readFileSync(eventsFile, 'utf8');
  const again = runReconcile({ root, now: '2026-10-28T20:00:00.000Z' });
  assert.equal(again.newEvents.length, 0);
  assert.equal(readFileSync(taskFile, 'utf8'), taskBefore);
  assert.equal(readFileSync(eventsFile, 'utf8'), eventsBefore);
  assert.throws(() => startRun(final), /Cannot start a run on a blocked task/);
});

test('failed run (builder or verification failure) => outcome failed, blocked with a reason, never re-queued by reconcile', () => {
  const begun = startRun({ id: 't-1', status: 'queued', attempts: 0, runs: [], blockers: [] }, '2026-10-28T10:00:00.000Z');
  const runId = begun.runs[0].id;

  // The run finishes as failed and the task moves in_progress -> blocked. The
  // reason string is written by the orchestrator (prose); the code only keeps it.
  const failed = finishRun(begun, 'failed');
  assert.equal(failed.runs[0].outcome, 'failed');
  const blocked = { ...transition(failed, 'blocked'), blockers: ['verification failed: 2 tests red'] };
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.attempts, 1);

  // reconcile leaves it alone, whether or not the task_failed event was appended
  const failedEvent = { type: 'task_failed', task_id: 't-1', run_id: runId, timestamp: NOW, detail: 'x' };
  for (const events of [[], [failedEvent]]) {
    const { tasks, newEvents } = reconcile([blocked], events, NOW);
    assert.equal(tasks[0], blocked);
    assert.equal(newEvents.length, 0);
  }
  // a task still in_progress with an already-failed run is not treated as interrupted
  const { tasks: t2, newEvents: e2 } = reconcile([failed], [], NOW);
  assert.equal(t2[0], failed);
  assert.equal(e2.length, 0);

  // a failure never re-queues on its own: only blocked -> queued by an explicit decision
  assert.throws(() => transition(failed, 'queued'), /reconciliation/);
  assert.equal(transition(blocked, 'queued').status, 'queued');
});
