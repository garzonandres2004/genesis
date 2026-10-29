// Regenerates inventory/repos.md from `gh repo list`. No dependencies.
// Usage: node scripts/inventory.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OWNER = 'garzonandres2004';
const FIELDS = 'name,visibility,description,pushedAt,primaryLanguage,defaultBranchRef';
const HEADER = '| Repo | Visibility | Language | Default | Last pushed | Notes |';
const SEPARATOR = '|---|---|---|---|---|---|';

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();

// existing: { notes, fork } from the current file, if the repo is already listed.
export function formatRow(repo, existing = {}) {
  const visibility = titleCase(repo.visibility ?? '') + (existing.fork ? ' (fork)' : '');
  const language = repo.primaryLanguage?.name || '—';
  const branch = repo.defaultBranchRef?.name || '—';
  const pushed = (repo.pushedAt ?? '').slice(0, 10) || '—';
  const notes = existing.notes ?? '';
  return `| ${[repo.name, visibility, language, branch, pushed, notes].map(cell).join(' | ')} |`;
}

export function sortByPushedAtDesc(repos) {
  return [...repos].sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
}

// Splits the file around the table and collects per-repo Notes/fork markers.
export function parseExisting(md) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim() === SEPARATOR);
  if (start === -1) throw new Error('repos.md: table separator row not found');
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;

  const rows = new Map();
  for (const line of lines.slice(start + 1, end)) {
    const cells = line.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
    const [name, visibility = '', , , , notes = ''] = cells;
    rows.set(name, { notes, fork: /\(fork\)/i.test(visibility) });
  }
  return { before: lines.slice(0, start + 1), after: lines.slice(end), rows };
}

export function render(md, repos) {
  const { before, after, rows } = parseExisting(md);
  const body = sortByPushedAtDesc(repos).map((r) => formatRow(r, rows.get(r.name)));
  return [...before, ...body, ...after].join('\n');
}

function main() {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'inventory', 'repos.md');
  const json = execFileSync(
    'gh',
    ['repo', 'list', OWNER, '--limit', '30', '--json', FIELDS],
    { encoding: 'utf8' },
  );
  const repos = JSON.parse(json);
  writeFileSync(file, render(readFileSync(file, 'utf8'), repos));
  console.log(`Wrote ${repos.length} repos to ${file}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
