// Task state machine and record helpers. Pure functions: every helper
// returns a new task object and never mutates its input.

export const STATES = ['queued', 'in_progress', 'blocked', 'completed'];
export const OUTCOMES = ['completed', 'failed', 'interrupted'];
export const MAX_ATTEMPTS = 3;

const TRANSITIONS = {
  queued: ['in_progress'],
  in_progress: ['completed', 'blocked', 'queued'],
  blocked: ['queued', 'in_progress'],
  completed: [],
};

// in_progress -> queued consumes a retry attempt and is only legal when the
// caller declares it is reconciling an interruption.
export function transition(task, to, { reconciliation = false } = {}) {
  const from = task.status;
  if (!STATES.includes(to) || !(from in TRANSITIONS) || !TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal transition: ${from} -> ${to}`);
  }
  if (from === 'in_progress' && to === 'queued' && !reconciliation) {
    throw new Error('Illegal transition: in_progress -> queued (only allowed via reconciliation)');
  }
  return { ...task, status: to };
}

export function runId(task, attempt, now) {
  return `${task.id}/run-${attempt}-${now}`;
}

// Begin a run: moves a queued task to in_progress (an in_progress task keeps
// its status), increments attempts, appends a run with outcome null.
export function startRun(task, now = new Date().toISOString()) {
  if (task.status !== 'queued' && task.status !== 'in_progress') {
    throw new Error(`Cannot start a run on a ${task.status} task`);
  }
  const started = task.status === 'queued' ? transition(task, 'in_progress') : task;
  const attempts = (started.attempts ?? 0) + 1;
  const run = { id: runId(task, attempts, now), started_at: now, outcome: null };
  return { ...started, attempts, runs: [...(started.runs ?? []), run] };
}

// Record the outcome of the latest open run. Status changes go through transition().
export function finishRun(task, outcome) {
  if (!OUTCOMES.includes(outcome)) throw new Error(`Invalid run outcome: ${outcome}`);
  const runs = [...(task.runs ?? [])];
  const i = runs.map((r) => r.outcome).lastIndexOf(null);
  if (i === -1) throw new Error(`Task ${task.id} has no open run to finish`);
  runs[i] = { ...runs[i], outcome };
  return { ...task, runs };
}

// The one deliberate mutation, unlike the pure helpers above: it changes
// task.idempotency_keys in place. Records the key on the task and returns true
// the first time; returns false if already claimed, meaning the caller must
// return the existing result instead of repeating the side effect.
export function claimSideEffect(task, key) {
  task.idempotency_keys ??= [];
  if (task.idempotency_keys.includes(key)) return false;
  task.idempotency_keys.push(key);
  return true;
}
