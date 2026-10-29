// Genesis task board: reads tasks/*.json and prints status counts + the queue.
// No dependencies. Run with: npm run status
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
for (const t of tasks) {
  console.log(`- [${t.status}] ${t.id}: ${t.title} (${t.project}, ${t.branch ?? 'no branch'})`);
  if (t.blockers?.length) for (const b of t.blockers) console.log(`    blocked: ${b}`);
}
