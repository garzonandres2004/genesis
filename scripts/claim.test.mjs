import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { claim, WON, LOST } from './claim.mjs';

const ID = ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false'];
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

// Local-only fixture: a temp bare "remote", a seed clone, and N worker clones.
function fixture(workers = 2) {
  const root = mkdtempSync(join(tmpdir(), 'genesis-claim-'));
  const remote = join(root, 'remote.git');
  git(root, 'init', '-q', '--bare', '-b', 'main', remote);
  const seed = join(root, 'seed');
  git(root, 'clone', '-q', remote, seed);
  writeFileSync(join(seed, 'README'), 'base\n');
  git(seed, 'add', 'README');
  git(seed, ...ID, 'commit', '-q', '-m', 'base');
  git(seed, 'push', '-q', 'origin', 'HEAD:refs/heads/main');
  const baseSha = git(seed, 'rev-parse', 'HEAD');
  const clones = [];
  for (let i = 0; i < workers; i++) {
    const dir = join(root, `worker-${i}`);
    git(root, 'clone', '-q', remote, dir);
    clones.push(dir);
  }
  return { root, remote, seed, baseSha, clones, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const tip = (remote, branch) => {
  const out = git(remote, 'rev-parse', '--verify', '-q', `refs/heads/${branch}`);
  return out;
};
const hasBranch = (remote, branch) => {
  try { git(remote, 'rev-parse', '--verify', '-q', `refs/heads/${branch}`); return true; } catch { return false; }
};

const args = (f, dir, extra = {}) => ({
  repoDir: dir,
  remote: 'origin',
  branch: 'task/t-1',
  baseSha: f.baseSha,
  message: 'claim t-1',
  writeFiles: [{ path: 'tasks/claim-t-1.txt', content: `claimed by ${dir}\n` }],
  ...extra,
});

test('single claim on a fresh remote => WON with the commit SHA', async () => {
  const f = fixture(1);
  try {
    const r = await claim(args(f, f.clones[0]));
    assert.equal(r.status, WON);
    assert.match(r.sha, /^[0-9a-f]{40}$/);
    assert.equal(tip(f.remote, 'task/t-1'), r.sha);
    assert.equal(git(f.remote, 'rev-parse', 'refs/heads/task/t-1^'), f.baseSha);
  } finally {
    f.cleanup();
  }
});

test('claim when the branch already exists => LOST, tip unchanged, nothing pushed', async () => {
  const f = fixture(2);
  try {
    const first = await claim(args(f, f.clones[0]));
    assert.equal(first.status, WON);
    let pushHook = false;
    const second = await claim(args(f, f.clones[1], { hooks: { beforePush: () => { pushHook = true; } } }));
    assert.equal(second.status, LOST);
    assert.equal(second.reason, 'branch_exists');
    assert.equal(pushHook, false, 'fast-fail must happen before any local prep or push');
    assert.equal(tip(f.remote, 'task/t-1'), first.sha);
  } finally {
    f.cleanup();
  }
});

test('diverged existing branch => LOST, remote tip unchanged (no force-push path)', async () => {
  const f = fixture(1);
  try {
    // Another actor created the branch with different content.
    const other = join(f.root, 'other');
    git(f.root, 'clone', '-q', f.remote, other);
    git(other, 'checkout', '-q', '-b', 'task/t-1');
    writeFileSync(join(other, 'other.txt'), 'different\n');
    git(other, 'add', 'other.txt');
    git(other, ...ID, 'commit', '-q', '-m', 'someone else');
    git(other, 'push', '-q', 'origin', 'task/t-1');
    const before = tip(f.remote, 'task/t-1');

    // claim() fast-fails on the existing branch; then drive the push gate
    // directly (skipping the check) to prove the push itself rejects it.
    const r = await claim(args(f, f.clones[0]));
    assert.equal(r.status, LOST);
    assert.equal(tip(f.remote, 'task/t-1'), before);

    const { prepareClaim, pushClaim } = await import('./claim.mjs');
    const prep = await prepareClaim(args(f, f.clones[0]));
    const pushed = await pushClaim({ repoDir: f.clones[0], remote: 'origin', branch: 'task/t-1' });
    assert.equal(pushed, false, 'plain push of a diverged commit must be rejected');
    assert.equal(tip(f.remote, 'task/t-1'), before);
    await prep.restore();
  } finally {
    f.cleanup();
  }
});

test('two-worker race: both pass the check, both push concurrently, exactly one wins (x3)', async () => {
  const outcomes = [];
  for (let round = 0; round < 3; round++) {
    const f = fixture(2);
    try {
      // Barrier: each worker waits in beforePush until BOTH have passed the
      // ls-remote check and committed locally, then both pushes are released
      // in the same tick and run as concurrent git processes.
      let arrived = 0;
      let release;
      const gate = new Promise((res) => { release = res; });
      const beforePush = async () => {
        if (++arrived === 2) release();
        await gate;
      };
      const dispatched = [];
      const worker = async (i) => {
        const r = await claim(args(f, f.clones[i], { hooks: { beforePush } }));
        if (r.status === WON) dispatched.push(i); // fake builder dispatch
        return r;
      };
      const results = await Promise.all([worker(0), worker(1)]);

      const won = results.filter((r) => r.status === WON);
      const lost = results.filter((r) => r.status === LOST);
      assert.equal(arrived, 2, 'both workers must have passed the check before pushing');
      assert.equal(won.length, 1, `round ${round}: exactly one winner`);
      assert.equal(lost.length, 1, `round ${round}: exactly one loser`);
      assert.equal(tip(f.remote, 'task/t-1'), won[0].sha, 'remote tip is the winner commit');
      const winnerIdx = results.indexOf(won[0]);
      assert.deepEqual(dispatched, [winnerIdx], 'loser dispatch callback never called');
      assert.equal(hasBranch(f.clones[1 - winnerIdx], 'task/t-1'), false, 'loser discarded its local attempt');
      outcomes.push(winnerIdx);
    } finally {
      f.cleanup();
    }
  }
  assert.equal(outcomes.length, 3);
});
