// Atomic task claim. The guarantee comes from the git ref update itself: a
// non-force push that creates (or fast-forwards) a branch is a single
// compare-and-swap on that ref, serialized by git on the remote. The ls-remote
// check below is only a fast-fail optimization; the PUSH is the gate.
//
// This helper never dispatches a builder, never opens a PR, and never
// force-pushes. Callers dispatch only after it returns { status: 'WON' }.
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

export const WON = 'WON';
export const LOST = 'LOST';

const AUTHOR = { name: 'Claude (builder)', email: 'noreply@anthropic.com' };

function git(repoDir, args, { allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repoDir, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err && !allowFail) {
        err.message = `git ${args[0]} failed: ${String(stderr || err.message).trim()}`;
        return reject(err);
      }
      resolve({ ok: !err, stdout: stdout ?? '', stderr: stderr ?? '' });
    });
  });
}

async function remoteHasBranch(repoDir, remote, branch) {
  const { stdout } = await git(repoDir, ['ls-remote', '--heads', remote, `refs/heads/${branch}`]);
  return stdout.trim().length > 0;
}

async function remoteTip(repoDir, remote, branch) {
  const { stdout } = await git(repoDir, ['ls-remote', '--heads', remote, `refs/heads/${branch}`]);
  return stdout.trim().split(/\s+/)[0] || null;
}

// files: [{ path, content }] (paths relative to repoDir) or async (repoDir) => void.
async function applyFiles(repoDir, writeFiles) {
  if (typeof writeFiles === 'function') {
    await writeFiles(repoDir);
    await git(repoDir, ['add', '-A']);
    return;
  }
  const files = writeFiles ?? [];
  for (const f of files) {
    const abs = join(repoDir, f.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, f.content);
  }
  if (files.length) await git(repoDir, ['add', '--', ...files.map((f) => f.path)]);
}

// Local half of a claim: branch from baseSha, write files, commit. Nothing is
// pushed. Returns { sha, restore } where restore() discards the local attempt.
export async function prepareClaim({ repoDir, branch, baseSha, message, writeFiles }) {
  const named = await git(repoDir, ['symbolic-ref', '-q', '--short', 'HEAD'], { allowFail: true });
  const origin = named.ok ? named.stdout.trim() : (await git(repoDir, ['rev-parse', 'HEAD'])).stdout.trim();

  const restore = async () => {
    await git(repoDir, ['checkout', '-q', '--detach', origin], { allowFail: true });
    if (named.ok) await git(repoDir, ['checkout', '-q', origin], { allowFail: true });
    await git(repoDir, ['branch', '-D', branch], { allowFail: true });
  };

  await git(repoDir, ['checkout', '-q', '-B', branch, baseSha]);
  try {
    await applyFiles(repoDir, writeFiles);
    // The nonce makes every worker's commit unique, so two workers can never
    // produce byte-identical commits that a push would treat as "up to date".
    const body = `${message}\n\nClaim-Nonce: ${randomBytes(8).toString('hex')}`;
    await git(repoDir, [
      '-c', `user.name=${AUTHOR.name}`, '-c', `user.email=${AUTHOR.email}`, '-c', 'commit.gpgsign=false',
      'commit', '-q', '--allow-empty', '-m', body,
    ]);
  } catch (err) {
    await restore();
    throw err;
  }
  const sha = (await git(repoDir, ['rev-parse', 'HEAD'])).stdout.trim();
  return { sha, restore };
}

// The gate. Plain `git push` (never --force, never --force-with-lease, never
// a `+` refspec): git rejects it unless the update is a fast-forward of the
// remote ref, and serializes concurrent updates with a ref lock.
export async function pushClaim({ repoDir, remote, branch }) {
  const res = await git(repoDir, ['push', '--porcelain', remote, `HEAD:refs/heads/${branch}`], { allowFail: true });
  return res.ok;
}

export async function claim({ repoDir, remote = 'origin', branch, baseSha, message, writeFiles, hooks = {} }) {
  if (!branch || !baseSha || !message) throw new Error('claim requires branch, baseSha and message');

  // (a) Fast-fail optimization only. Not a guarantee.
  if (await remoteHasBranch(repoDir, remote, branch)) {
    return { status: LOST, reason: 'branch_exists', sha: null };
  }

  // (b) Prepare locally.
  const { sha, restore } = await prepareClaim({ repoDir, branch, baseSha, message, writeFiles });

  if (hooks.beforePush) await hooks.beforePush({ sha });

  // (c) The push is the compare-and-swap.
  const pushed = await pushClaim({ repoDir, remote, branch });
  if (pushed && (await remoteTip(repoDir, remote, branch)) === sha) {
    return { status: WON, reason: 'pushed', sha };
  }

  // Rejected (or push "succeeded" but the tip is not ours): the loser stands
  // down. If the branch does not exist remotely, the failure was not a lost
  // race (e.g. unreachable remote) and is surfaced as an error, not LOST.
  const exists = await remoteHasBranch(repoDir, remote, branch);
  await restore();
  if (!exists) throw new Error(`claim push failed and branch ${branch} is absent on ${remote}`);
  return { status: LOST, reason: 'push_rejected', sha: null };
}

// CLI for the scheduled worker: prints exactly one JSON line and exits 0 on
// WON or LOST; on a thrown error prints the error on stderr and exits 1 with
// nothing on stdout. Callers dispatch a builder only on WON.
async function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      repo: { type: 'string' },
      remote: { type: 'string', default: 'origin' },
      branch: { type: 'string' },
      base: { type: 'string' },
      message: { type: 'string' },
      files: { type: 'string' },
    },
    strict: true,
  });
  if (!values.repo || !values.branch || !values.base || !values.message) {
    throw new Error('usage: node scripts/claim.mjs --repo <dir> [--remote <name>] --branch <name> --base <sha> --message <msg> [--files <json-file>]');
  }
  const writeFiles = values.files ? JSON.parse(readFileSync(values.files, 'utf8')) : [];
  if (!Array.isArray(writeFiles)) throw new Error('--files must contain a JSON array of {path, content}');
  const r = await claim({
    repoDir: values.repo,
    remote: values.remote,
    branch: values.branch,
    baseSha: values.base,
    message: values.message,
    writeFiles,
  });
  console.log(JSON.stringify({ status: r.status, reason: r.reason, sha: r.sha }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
