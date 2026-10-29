import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendEvent } from './events.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'status.mjs');

function runStatus(eventsFile) {
  return execFileSync('node', [script], {
    encoding: 'utf8',
    env: { ...process.env, GENESIS_EVENTS_FILE: eventsFile },
  });
}

test('status prints the timestamp of the latest event when the log exists', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'genesis-status-')), 'events.jsonl');
  appendEvent({ type: 'task_started', task_id: 't-1', timestamp: '2026-10-28T10:00:00.000Z' }, file);
  appendEvent({ type: 'task_completed', task_id: 't-1', timestamp: '2026-10-28T11:30:00.000Z' }, file);
  const out = runStatus(file);
  assert.match(out, /Last event: 2026-10-28T11:30:00\.000Z/);
  assert.doesNotMatch(out, /no events yet/);
});

test('status prints "no events yet" when the log does not exist', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'genesis-status-')), 'events.jsonl');
  assert.match(runStatus(file), /Last event: no events yet/);
});
