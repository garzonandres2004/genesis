// Restart/interruption recovery. Finds in_progress tasks whose latest run is
// open (outcome null) and never reached a terminal event, then re-queues them (retry
// budget left) or blocks them (budget exhausted). Idempotent: an interrupted
// run gets a run_interrupted event, and runs with one are never re-processed.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transition, finishRun, MAX_ATTEMPTS } from './task-state.mjs';
import { appendEvent, readEvents, repoRoot } from './events.mjs';

const TERMINAL = ['task_completed', 'task_failed', 'task_blocked'];
// Completed history is never rewritten, even if its status were to change.
const PROTECTED = ['demo-end-to-end-001'];

function isInterrupted(task, events) {
  const run = (task.runs ?? []).at(-1);
  if (!run) return null;
  const forRun = events.filter((e) => e.run_id === run.id);
  // A missing task_started event does not matter: a crash between writing the
  // task record and appending the event must not leave the task stuck.
  const settled = forRun.some((e) => TERMINAL.includes(e.type) || e.type === 'run_interrupted');
  return run.outcome == null && !settled ? run : null;
}

// Pure: (tasks, events) -> { tasks, newEvents }. Only changed tasks differ
// from the input (unchanged ones are returned as the same object).
export function reconcile(tasks, events, now = new Date().toISOString()) {
  const newEvents = [];
  const out = tasks.map((task) => {
    if (task.status !== 'in_progress' || PROTECTED.includes(task.id)) return task;
    const run = isInterrupted(task, events);
    if (!run) return task;

    newEvents.push({
      type: 'run_interrupted', task_id: task.id, run_id: run.id, timestamp: now,
      detail: 'open run with no terminal event found',
    });
    let next = finishRun(task, 'interrupted');
    const day = now.slice(0, 10);
    if ((task.attempts ?? 0) < MAX_ATTEMPTS) {
      next = transition(next, 'queued', { reconciliation: true });
      newEvents.push({
        type: 'task_requeued', task_id: task.id, run_id: run.id, timestamp: now,
        detail: `re-queued after interruption (attempt ${task.attempts ?? 0} of ${MAX_ATTEMPTS} used)`,
      });
    } else {
      next = transition(next, 'blocked');
      next = {
        ...next,
        blockers: [...(next.blockers ?? []), 'retry budget exhausted: orchestrator must review and re-queue'],
      };
      newEvents.push({
        type: 'retry_exhausted', task_id: task.id, run_id: run.id, timestamp: now,
        detail: 'retry budget exhausted',
      });
    }
    return { ...next, updated: day };
  });
  return { tasks: out, newEvents };
}

// File-level wrapper. Task files are written before events so a crash between
// the two leaves the task already recovered rather than stuck in_progress.
export function runReconcile({ root = repoRoot, now } = {}) {
  const dir = join(root, 'tasks');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const tasks = files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const eventsPath = join(root, 'events.jsonl');
  const result = reconcile(tasks, readEvents(eventsPath), now);
  result.tasks.forEach((task, i) => {
    if (task !== tasks[i]) writeFileSync(join(dir, files[i]), `${JSON.stringify(task, null, 2)}\n`);
  });
  for (const e of result.newEvents) appendEvent(e, eventsPath);
  return result;
}

function main() {
  const { tasks, newEvents } = runReconcile();
  const changed = new Set(newEvents.map((e) => e.task_id));
  console.log(`reconcile: ${tasks.length} tasks, ${changed.size} changed, ${newEvents.length} events appended`);
  for (const e of newEvents) console.log(`  ${e.type} ${e.task_id}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
