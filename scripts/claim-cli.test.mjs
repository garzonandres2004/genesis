// CLI-level tests: the claim CLI is spawned as a child process, the way the
// scheduled worker runs it. Local bare remote only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixture, git, parseLine } from './runner-fixture.mjs';

function claimCli(f, dir, { branch = 'task/t-1', remote = 'origin' } = {}) {
  const files = join(f.root, 'files.json');
  writeFileSync(files, JSON.stringify([{ path: 'tasks/t-1.txt', content: `by ${dir}\n` }]));
  return f.run('claim.mjs', [
    '--repo', dir, '--remote', remote, '--branch', branch, '--base', f.baseSha,
    '--message', 'claim t-1', '--files', files,
  ], { cwd: dir });
}

test('claim CLI: fresh remote => exit 0, one JSON line WON with sha', () => {
  const f = fixture();
  try {
    const r = claimCli(f, f.clone());
    assert.equal(r.status, 0, r.stderr);
    const j = parseLine(r.stdout);
    assert.deepEqual(Object.keys(j), ['status', 'reason', 'sha']);
    assert.equal(j.status, 'WON');
    assert.equal(j.reason, 'pushed');
    assert.equal(git(f.remote, 'rev-parse', 'refs/heads/task/t-1'), j.sha);
  } finally { f.cleanup(); }
});

test('claim CLI: --remote defaults to origin', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    const files = join(f.root, 'files.json');
    writeFileSync(files, '[]');
    const r = f.run('claim.mjs', ['--repo', dir, '--branch', 'task/d', '--base', f.baseSha, '--message', 'm', '--files', files], { cwd: dir });
    assert.equal(parseLine(r.stdout).status, 'WON');
  } finally { f.cleanup(); }
});

test('claim CLI: existing branch => exit 0, LOST, sha null, remote untouched', () => {
  const f = fixture();
  try {
    const won = parseLine(claimCli(f, f.clone()).stdout);
    const r = claimCli(f, f.clone());
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(parseLine(r.stdout), { status: 'LOST', reason: 'branch_exists', sha: null });
    assert.equal(git(f.remote, 'rev-parse', 'refs/heads/task/t-1'), won.sha);
  } finally { f.cleanup(); }
});

test('claim CLI: unreachable remote => exit 1, error on stderr, nothing on stdout', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    git(dir, 'remote', 'set-url', 'origin', join(f.root, 'does-not-exist.git'));
    const r = claimCli(f, dir);
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.ok(r.stderr.length > 0);
  } finally { f.cleanup(); }
});

test('claim CLI: missing required argument => exit 1, nothing on stdout', () => {
  const f = fixture();
  try {
    const r = f.run('claim.mjs', ['--repo', f.root], { cwd: f.root });
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /usage/);
  } finally { f.cleanup(); }
});
