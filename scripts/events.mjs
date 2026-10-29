// Append-only event log (events.jsonl at the repo root). This module only
// ever appends lines; it never rewrites, truncates, or reorders the file.
import { appendFileSync, existsSync, readFileSync, openSync, readSync, closeSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVENT_TYPES = [
  'task_started',
  'task_completed',
  'task_failed',
  'task_blocked',
  'run_interrupted',
  'task_requeued',
  'retry_exhausted',
];

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const defaultEventsPath = join(repoRoot, 'events.jsonl');

function endsWithNewline(file) {
  const size = statSync(file).size;
  if (size === 0) return true;
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1);
    readSync(fd, buf, 0, 1, size - 1);
    return buf[0] === 0x0a;
  } finally {
    closeSync(fd);
  }
}

export function appendEvent(event, file = defaultEventsPath) {
  if (!EVENT_TYPES.includes(event.type)) throw new Error(`Unknown event type: ${event.type}`);
  if (!event.task_id) throw new Error('Event requires task_id');
  const line = {
    type: event.type,
    task_id: event.task_id,
    ...(event.run_id ? { run_id: event.run_id } : {}),
    timestamp: event.timestamp ?? new Date().toISOString(),
    detail: event.detail ?? '',
  };
  // Guard against a previous torn write: start on a fresh line, never edit it.
  const prefix = existsSync(file) && !endsWithNewline(file) ? '\n' : '';
  appendFileSync(file, `${prefix}${JSON.stringify(line)}\n`);
  return line;
}

export function readEvents(file = defaultEventsPath) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l));
}
