// Genesis task board: reads tasks/*.json and prints status counts + the queue.
// No dependencies. Run with: npm run status
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEvents, defaultEventsPath } from './events.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tasks');
const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
const tasks = [];
for (const f of files) {
  try {
    tasks.push(JSON.parse(await readFile(join(dir, f), 'utf8')));
  } catch (e) {
    console.log(`WARN: could not parse ${f}: ${e.message}`);
  }
}
const counts = {};
for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
console.log(`Genesis tasks: ${tasks.length} total`);
for (const [status, n] of Object.entries(counts).sort()) console.log(`  ${status}: ${n}`);
console.log('');
// Events path is injectable (GENESIS_EVENTS_FILE) so tests never touch the real log.
let events = [];
try {
  events = readEvents(process.env.GENESIS_EVENTS_FILE ?? defaultEventsPath);
} catch (e) {
  console.log(`WARN: could not read events: ${e.message}`);
}
const stamps = events.map((ev) => ev.timestamp).filter(Boolean).sort();
console.log(`Last event: ${stamps.length ? stamps[stamps.length - 1] : 'no events yet'}`);
console.log('');
for (const t of tasks) {
  console.log(`- [${t.status}] ${t.id}: ${t.title} (${t.project}, ${t.branch ?? 'no branch'})`);
  if (t.blockers?.length) for (const b of t.blockers) console.log(`    blocked: ${b}`);
}
