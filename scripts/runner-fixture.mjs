// Shared fixture for the CLI and runner-orchestration tests (not a test file).
// Everything external is local: a temp bare git remote, a temp HOME, and a
// PATH that contains ONLY symlinks to git/sh/node plus stub `claude` and `gh`.
// Real gh/claude/npm can never be reached because they are not on that PATH.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startRun, finishRun, transition } from './task-state.mjs';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
export const script = (name) => join(SCRIPTS, name);

const ID = ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false'];
export const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function which(name) {
  for (const d of (process.env.PATH ?? '').split(delimiter)) {
    const p = join(d, name);
    if (existsSync(p)) return p;
  }
  throw new Error(`${name} not found on the test host PATH`);
}

const stub = (body) => `#!${process.execPath}\n${body}\n`;

// Stub gh: state in $STUB_DIR/gh.json = { prs: [{url,state,headRefOid,head}], fail, authFail, creates }.
const GH_STUB = stub(`
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = process.env.STUB_DIR;
const a = process.argv.slice(2);
const flag = (n) => { const i = a.indexOf(n); return i < 0 ? null : a[i + 1]; };
const statePath = dir + '/gh.json';
const s = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const label = a[0] === 'auth' ? 'auth' : a[1];
fs.appendFileSync(dir + '/order.log', 'gh:' + label + '\\n');
if (a[0] === 'auth') process.exit(s.authFail ? 1 : 0);
if (s.fail) { console.error('gh: simulated failure'); process.exit(1); }
if (a[0] === 'pr' && a[1] === 'list') {
  const rows = s.prs.filter((p) => p.head === flag('--head')).map(({ url, state, headRefOid }) => ({ url, state, headRefOid }));
  console.log(JSON.stringify(rows));
} else if (a[0] === 'pr' && a[1] === 'create') {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const pr = { url: 'https://example.invalid/pr/' + (s.prs.length + 1), state: 'OPEN', headRefOid: sha, head: flag('--head') };
  s.prs.push(pr);
  s.creates = (s.creates ?? 0) + 1;
  fs.writeFileSync(statePath, JSON.stringify(s));
  console.log(pr.url);
} else { console.error('gh stub: unsupported ' + a.join(' ')); process.exit(2); }
`);

// Stub claude: --version for preflight; otherwise a fake builder run in cwd.
// CLAUDE_STUB_MODE=hang writes its pid then never finishes (for kill tests).
const CLAUDE_STUB = stub(`
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = process.env.STUB_DIR;
const a = process.argv.slice(2);
if (a[0] === '--version') { fs.appendFileSync(dir + '/order.log', 'claude:version\\n'); console.log('2.1.312 (Claude Code)'); process.exit(0); }
const branch = process.env.CLAUDE_STUB_BRANCH;
let seen = 'unknown';
try { seen = execFileSync('git', ['ls-remote', '--heads', 'origin', 'refs/heads/' + branch], { encoding: 'utf8' }).trim() ? 'yes' : 'no'; } catch {}
fs.appendFileSync(dir + '/order.log', 'claude:dispatch remote_has_branch=' + seen + '\\n');
if (process.env.CLAUDE_STUB_MODE === 'hang') {
  fs.writeFileSync(dir + '/builder.pid', String(process.pid));
  setInterval(() => {}, 1000);
} else {
  fs.writeFileSync('built.txt', 'built by fake builder\\n');
  execFileSync('git', ['add', 'built.txt']);
  execFileSync('git', ['-c', 'user.name=Fake Builder', '-c', 'user.email=fake@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'builder work']);
}
`);

export function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'genesis-runner-'));
  const remote = join(root, 'remote.git');
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  const stubDir = join(root, 'stub');
  for (const d of [bin, join(home, '.claude'), stubDir]) mkdirSync(d, { recursive: true });
  // Non-empty marker only; not a real credential.
  writeFileSync(join(home, '.claude', '.credentials.json'), '{"fixture":true}\n');
  for (const t of ['git', 'sh', 'node']) symlinkSync(which(t), join(bin, t));
  writeFileSync(join(bin, 'claude'), CLAUDE_STUB, { mode: 0o755 });
  writeFileSync(join(bin, 'gh'), GH_STUB, { mode: 0o755 });
  writeFileSync(join(stubDir, 'gh.json'), JSON.stringify({ prs: [], creates: 0 }));
  writeFileSync(join(stubDir, 'order.log'), '');

  git(root, 'init', '-q', '--bare', '-b', 'main', remote);
  const seed = join(root, 'seed');
  git(root, 'init', '-q', '-b', 'main', seed);
  git(seed, 'remote', 'add', 'origin', remote);
  writeFileSync(join(seed, 'README'), 'base\n');
  git(seed, 'add', 'README');
  git(seed, ...ID, 'commit', '-q', '-m', 'base');
  git(seed, 'push', '-q', 'origin', 'HEAD:refs/heads/main');
  const baseSha = git(seed, 'rev-parse', 'HEAD');

  const env = {
    PATH: bin, HOME: home, STUB_DIR: stubDir,
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0',
  };
  let n = 0;
  const f = {
    root, remote, bin, home, stubDir, baseSha, env,
    clone() {
      const dir = join(root, `worker-${n++}`);
      git(root, 'clone', '-q', remote, dir);
      return dir;
    },
    // Run a repo script as a child process with the isolated env.
    run(file, args, { cwd, extraEnv = {}, scriptPath = script(file) } = {}) {
      return spawnSync(process.execPath, [scriptPath, ...args], {
        cwd, encoding: 'utf8', env: { ...env, ...extraEnv },
      });
    },
    ghState: () => JSON.parse(readFileSync(join(stubDir, 'gh.json'), 'utf8')),
    setGh(patch) { writeFileSync(join(stubDir, 'gh.json'), JSON.stringify({ ...f.ghState(), ...patch })); },
    order: () => readFileSync(join(stubDir, 'order.log'), 'utf8').split('\n').filter(Boolean),
    mark: (label) => appendFileSync(join(stubDir, 'order.log'), `${label}\n`),
    hasBranch(branch) {
      try { git(remote, 'rev-parse', '--verify', '-q', `refs/heads/${branch}`); return true; } catch { return false; }
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
  return f;
}

// ---- the worker steps, each driven through the real CLI / child process ----

export const parseLine = (stdout) => {
  const lines = stdout.split('\n').filter(Boolean);
  if (lines.length !== 1) throw new Error(`expected exactly one stdout line, got ${lines.length}: ${stdout}`);
  return JSON.parse(lines[0]);
};

export function preflight(f, dir) {
  const r = f.run('preflight.mjs', [], { cwd: dir });
  f.mark(r.status === 0 ? 'preflight:ok' : 'preflight:fail');
  return r;
}

const eventLine = (type, task, run, detail = '') =>
  `${JSON.stringify({ type, task_id: task.id, run_id: run.id, timestamp: run.started_at, detail })}\n`;

// Claim files: the started task record plus the task_started event, the same
// content a manual startRun-push would have produced.
export function startedTask(base, now) {
  const task = startRun(base, now);
  return { task, run: task.runs.at(-1) };
}

export function claimTask(f, { dir, branch, task, run, priorEvents = '', remote = 'origin', base = f.baseSha }) {
  const filesPath = join(f.root, `claim-files-${branch.replaceAll('/', '_')}.json`);
  writeFileSync(filesPath, JSON.stringify([
    { path: `tasks/${task.id}.json`, content: `${JSON.stringify(task, null, 2)}\n` },
    { path: 'events.jsonl', content: priorEvents + eventLine('task_started', task, run, 'claimed') },
  ]));
  const r = f.run('claim.mjs', [
    '--repo', dir, '--remote', remote, '--branch', branch, '--base', base,
    '--message', `claim ${task.id}`, '--files', filesPath,
  ], { cwd: dir });
  f.mark('claim');
  return { ...r, json: r.status === 0 ? parseLine(r.stdout) : null };
}

export function dispatch(f, dir, branch, mode = 'normal') {
  return spawnSync('claude', ['-p', 'build the thing'], {
    cwd: dir, encoding: 'utf8',
    env: { ...f.env, CLAUDE_STUB_BRANCH: branch, CLAUDE_STUB_MODE: mode },
  });
}

// Async variant for kill tests; resolves once the hanging builder has written its pid.
export async function dispatchHanging(f, dir, branch) {
  const child = spawn('claude', ['-p', 'build the thing'], {
    cwd: dir, stdio: 'ignore',
    env: { ...f.env, CLAUDE_STUB_BRANCH: branch, CLAUDE_STUB_MODE: 'hang' },
  });
  const exited = new Promise((res) => child.on('exit', (code, sig) => res({ code, sig })));
  const pidFile = join(f.stubDir, 'builder.pid');
  for (let i = 0; i < 250 && !existsSync(pidFile); i++) await new Promise((r) => setTimeout(r, 20));
  if (!existsSync(pidFile)) { child.kill('SIGKILL'); throw new Error('fake builder never started'); }
  return { child, exited, pid: Number(readFileSync(pidFile, 'utf8')) };
}

export function verify(f, dir) {
  const r = spawnSync(process.execPath, ['-e',
    "const s=require('fs').readFileSync('built.txt','utf8');process.exit(s.includes('built by fake builder')?0:1)"],
  { cwd: dir, env: f.env });
  f.mark(r.status === 0 ? 'verify:pass' : 'verify:fail');
  return r.status === 0;
}

export function adopt(f, dir, branch, extra = []) {
  const r = f.run('pr-recovery.mjs', ['--branch', branch, ...extra], { cwd: dir });
  return { ...r, json: r.status === 0 ? parseLine(r.stdout) : null };
}

export function createPr(f, dir, branch) {
  const r = spawnSync('gh', ['pr', 'create', '--head', branch, '--title', 't', '--body', 'b'], {
    cwd: dir, encoding: 'utf8', env: f.env,
  });
  if (r.status !== 0) throw new Error(`gh pr create stub failed: ${r.stderr}`);
  return r.stdout.trim();
}

// Completed-outcome record: task -> completed with the PR URL as evidence.
export function recordOutcome(f, { dir, task, run, url }) {
  const done = { ...transition(finishRun(task, 'completed'), 'completed'), evidence: [url] };
  writeFileSync(join(dir, 'tasks', `${task.id}.json`), `${JSON.stringify(done, null, 2)}\n`);
  appendFileSync(join(dir, 'events.jsonl'), eventLine('task_completed', task, run, url));
  f.mark('outcome');
  return done;
}

// The full worker, in runner order. Returns what happened at each decision.
export function worker(f, { dir, branch, task, run, priorEvents = '' }) {
  const out = { steps: [] };
  const pf = preflight(f, dir);
  if (pf.status !== 0) return { ...out, stopped: 'preflight', preflight: pf };
  const c = claimTask(f, { dir, branch, task, run, priorEvents });
  out.claim = c;
  if (!c.json || c.json.status !== 'WON') return { ...out, stopped: 'claim' };
  dispatch(f, dir, branch);
  if (!verify(f, dir)) return { ...out, stopped: 'verify' };
  git(dir, 'push', '-q', 'origin', `HEAD:refs/heads/${branch}`);
  const a = adopt(f, dir, branch);
  out.adopt = a;
  if (a.status !== 0) return { ...out, stopped: 'adopt_error' };
  if (a.json.url && a.json.anomaly) return { ...out, stopped: 'anomaly' };
  const url = a.json.url ?? createPr(f, dir, branch);
  out.url = url;
  out.task = recordOutcome(f, { dir, task, run, url });
  return out;
}

// Make `dir` look like a genesis checkout for the real reconcile script: copy
// the scripts it imports so its repoRoot (parent of scripts/) is `dir`.
export function installReconcile(dir) {
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  for (const n of ['reconcile.mjs', 'task-state.mjs', 'events.mjs']) copyFileSync(script(n), join(dir, 'scripts', n));
  return join(dir, 'scripts', 'reconcile.mjs');
}
