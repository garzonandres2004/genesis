import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transition, startRun, finishRun, claimSideEffect } from './task-state.mjs';

const task = (status, extra = {}) => ({ id: 't-1', status, ...extra });

test('invalid transitions throw and name the transition', () => {
  assert.throws(() => transition(task('queued'), 'completed'), /queued -> completed/);
  assert.throws(() => transition(task('queued'), 'blocked'), /queued -> blocked/);
  for (const to of ['queued', 'in_progress', 'blocked', 'completed']) {
    assert.throws(() => transition(task('completed'), to), new RegExp(`completed -> ${to}`));
  }
  assert.throws(() => transition(task('queued'), 'bogus'), /Illegal transition/);
});

test('valid transitions succeed, including blocked -> queued', () => {
  assert.equal(transition(task('queued'), 'in_progress').status, 'in_progress');
  assert.equal(transition(task('in_progress'), 'completed').status, 'completed');
  assert.equal(transition(task('in_progress'), 'blocked').status, 'blocked');
  assert.equal(transition(task('blocked'), 'queued').status, 'queued');
  assert.equal(transition(task('blocked'), 'in_progress').status, 'in_progress');
});

test('in_progress -> queued only via reconciliation', () => {
  assert.throws(() => transition(task('in_progress'), 'queued'), /reconciliation/);
  assert.equal(transition(task('in_progress'), 'queued', { reconciliation: true }).status, 'queued');
});

test('transition does not mutate its input', () => {
  const t = task('queued');
  transition(t, 'in_progress');
  assert.equal(t.status, 'queued');
});

test('startRun increments attempts and appends an open run with a stable id', () => {
  const now = '2026-10-28T10:00:00.000Z';
  const t = startRun(task('queued'), now);
  assert.equal(t.status, 'in_progress');
  assert.equal(t.attempts, 1);
  assert.deepEqual(t.runs, [{ id: `t-1/run-1-${now}`, started_at: now, outcome: null }]);
  const t2 = startRun(task('queued', { attempts: 1, runs: t.runs }), '2026-10-28T11:00:00.000Z');
  assert.equal(t2.attempts, 2);
  assert.equal(t2.runs.length, 2);
  assert.notEqual(t2.runs[0].id, t2.runs[1].id);
  assert.throws(() => startRun(task('completed')), /completed/);
});

test('finishRun sets the outcome of the open run', () => {
  const t = finishRun(startRun(task('queued')), 'failed');
  assert.equal(t.runs[0].outcome, 'failed');
  assert.throws(() => finishRun(t, 'failed'), /no open run/);
  assert.throws(() => finishRun(startRun(task('queued')), 'weird'), /Invalid run outcome/);
});

test('duplicate claimSideEffect returns false the second time', () => {
  const t = task('in_progress');
  assert.equal(claimSideEffect(t, 'open-pr:branch-x'), true);
  assert.equal(claimSideEffect(t, 'open-pr:branch-x'), false);
  assert.equal(claimSideEffect(t, 'other-key'), true);
  assert.deepEqual(t.idempotency_keys, ['open-pr:branch-x', 'other-key']);
});
