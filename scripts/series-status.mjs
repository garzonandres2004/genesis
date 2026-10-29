// Series status: reads <root>/tasks/*.json + <root>/events.jsonl and prints one
// JSON object with raw per-task attempts/run outcomes, counts, and failure
// categories. It does NOT classify failures (runner-caused vs task-caused);
// that judgment belongs to the orchestrator's close-out (F6 table).
// Usage: node scripts/series-status.mjs [repo-root] [--prefix <task-id-prefix>]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './events.mjs';

const FAILURE_EVENT_TYPES = ['task_failed', 'run_interrupted', 'retry_exhausted'];

function readTasks(root) {
  const dir = join(root, 'tasks');
  const tasks = [];
  const warnings = [];
  if (!existsSync(dir)) return { tasks, warnings };
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    try {
      tasks.push(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    } catch (e) {
      warnings.push(`could not parse tasks/${f}: ${e.message}`);
    }
  }
  return { tasks, warnings };
}

function readEventsLenient(root, warnings) {
  const file = join(root, 'events.jsonl');
  if (!existsSync(file)) return [];
  const events = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (line.trim() === '') return;
    try {
      events.push(JSON.parse(line));
    } catch (e) {
      warnings.push(`could not parse events.jsonl line ${i + 1}: ${e.message}`);
    }
  });
  return events;
}

function bump(map, key, taskId, extra = {}) {
  const entry = (map[key] ??= { count: 0, task_ids: [], ...extra });
  entry.count += 1;
  if (taskId && !entry.task_ids.includes(taskId)) entry.task_ids.push(taskId);
}

export function buildSeriesStatus(root, { prefix = '' } = {}) {
  const { tasks: allTasks, warnings } = readTasks(root);
  const inScope = (id) => String(id ?? '').startsWith(prefix);
  const tasks = allTasks.filter((t) => inScope(t.id));
  const events = readEventsLenient(root, warnings).filter((e) => inScope(e.task_id));

  const perTask = tasks.map((t) => {
    const runs = Array.isArray(t.runs) ? t.runs : [];
    const outcomes = {};
    for (const r of runs) {
      const o = r.outcome ?? 'open';
      outcomes[o] = (outcomes[o] ?? 0) + 1;
    }
    return {
      id: t.id,
      status: t.status,
      attempts: t.attempts ?? 0,
      runs: runs.map((r) => ({ id: r.id, outcome: r.outcome ?? null })),
      run_outcomes: outcomes,
    };
  });

  const counts = { total: tasks.length, attempted: 0, completed: 0, blocked: 0 };
  for (const p of perTask) {
    if (p.attempts > 0 || p.runs.length > 0) counts.attempted += 1;
    if (p.status === 'completed') counts.completed += 1;
    if (p.status === 'blocked') counts.blocked += 1;
  }

  const byBlocker = {};
  for (const t of tasks) {
    for (const b of t.blockers ?? []) bump(byBlocker, String(b), t.id);
  }

  const byEventType = Object.fromEntries(
    [...FAILURE_EVENT_TYPES, 'anomaly'].map((k) => [k, { count: 0, task_ids: [], by_detail: {} }]),
  );
  for (const e of events) {
    const key = FAILURE_EVENT_TYPES.includes(e.type) ? e.type : /^anomal/.test(String(e.type)) ? 'anomaly' : null;
    if (!key) continue;
    byEventType[key].count += 1;
    if (e.task_id && !byEventType[key].task_ids.includes(e.task_id)) byEventType[key].task_ids.push(e.task_id);
    bump(byEventType[key].by_detail, String(e.detail ?? ''), e.task_id);
  }

  const eventTypeCounts = {};
  for (const e of events) eventTypeCounts[e.type] = (eventTypeCounts[e.type] ?? 0) + 1;

  return {
    root,
    prefix,
    tasks: perTask,
    counts,
    failure_categories: { by_blocker_text: byBlocker, by_event_type: byEventType },
    event_type_counts: eventTypeCounts,
    warnings,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let prefix = '';
  let root = repoRoot;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prefix') prefix = args[++i] ?? '';
    else root = resolve(args[i]);
  }
  console.log(JSON.stringify(buildSeriesStatus(root, { prefix }), null, 2));
}
