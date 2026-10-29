import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRow, sortByPushedAtDesc, parseExisting, render } from './inventory.mjs';

const full = {
  name: 'alpha',
  visibility: 'PRIVATE',
  description: 'Alpha repo',
  pushedAt: '2026-10-14T12:00:00Z',
  primaryLanguage: { name: 'TypeScript' },
  defaultBranchRef: { name: 'main' },
};

test('formatRow: repo with all fields', () => {
  assert.equal(
    formatRow(full, { notes: 'Some note.' }),
    '| alpha | Private | TypeScript | main | 2026-10-14 | Some note. |',
  );
});

test('formatRow: missing language and description', () => {
  const repo = { ...full, name: 'bare', description: '', primaryLanguage: null };
  assert.equal(formatRow(repo), '| bare | Private | — | main | 2026-10-14 |  |');
});

test('formatRow: fork keeps "Public (fork)" and its note', () => {
  const repo = { ...full, name: 'tailwind-landing-page-template', visibility: 'PUBLIC' };
  assert.equal(
    formatRow(repo, { notes: 'Fork of a landing page template.', fork: true }),
    '| tailwind-landing-page-template | Public (fork) | TypeScript | main | 2026-10-14 | Fork of a landing page template. |',
  );
});

test('sortByPushedAtDesc: newest first, input not mutated', () => {
  const input = [
    { name: 'old', pushedAt: '2024-01-01T00:00:00Z' },
    { name: 'new', pushedAt: '2026-01-01T00:00:00Z' },
    { name: 'mid', pushedAt: '2025-01-01T00:00:00Z' },
  ];
  assert.deepEqual(sortByPushedAtDesc(input).map((r) => r.name), ['new', 'mid', 'old']);
  assert.deepEqual(input.map((r) => r.name), ['old', 'new', 'mid']);
});

const doc = [
  '# Title',
  '',
  'Intro text.',
  '',
  '| Repo | Visibility | Language | Default | Last pushed | Notes |',
  '|---|---|---|---|---|---|',
  '| forky | Public (fork) | TypeScript | main | 2024-01-01 | Fork note. |',
  '| alpha | Private | — | main | 2025-01-01 | Alpha note. |',
  '',
  '## Registration rules',
  '',
  '- Keep me.',
  '',
].join('\n');

test('parseExisting: splits around the table and reads notes', () => {
  const { before, after, rows } = parseExisting(doc);
  assert.equal(before.at(-1), '|---|---|---|---|---|---|');
  assert.equal(after[1], '## Registration rules');
  assert.deepEqual(rows.get('forky'), { notes: 'Fork note.', fork: true });
  assert.deepEqual(rows.get('alpha'), { notes: 'Alpha note.', fork: false });
});

test('render: round trip keeps non-table sections, notes, sorting, new repos', () => {
  const repos = [
    { name: 'alpha', visibility: 'PRIVATE', pushedAt: '2025-06-01T00:00:00Z', primaryLanguage: { name: 'Python' }, defaultBranchRef: { name: 'main' } },
    { name: 'forky', visibility: 'PUBLIC', pushedAt: '2024-01-01T00:00:00Z', primaryLanguage: { name: 'TypeScript' }, defaultBranchRef: { name: 'main' } },
    { name: 'fresh', visibility: 'PUBLIC', pushedAt: '2026-01-01T00:00:00Z', primaryLanguage: null, defaultBranchRef: { name: 'main' } },
  ];
  const out = render(doc, repos);
  assert.equal(
    out,
    [
      '# Title',
      '',
      'Intro text.',
      '',
      '| Repo | Visibility | Language | Default | Last pushed | Notes |',
      '|---|---|---|---|---|---|',
      '| fresh | Public | — | main | 2026-01-01 |  |',
      '| alpha | Private | Python | main | 2025-06-01 | Alpha note. |',
      '| forky | Public (fork) | TypeScript | main | 2024-01-01 | Fork note. |',
      '',
      '## Registration rules',
      '',
      '- Keep me.',
      '',
    ].join('\n'),
  );
  assert.equal(render(out, repos), out, 'render is idempotent');
});
