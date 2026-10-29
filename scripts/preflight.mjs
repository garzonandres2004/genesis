// Runner startup/preflight check. Verifies required tooling and access before
// any task work starts. Prints a JSON summary plus one human-readable line;
// exits 0 only if every required check passes. Never reads credential values:
// auth is judged by marker presence only.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MIN_VERSION = '2.1.312';
export const PINNED_PACKAGE = `@anthropic-ai/claude-code@${MIN_VERSION}`;
export const MAX_REINSTALL_ATTEMPTS = 1;

export function parseSemver(text) {
  const m = /(?:^|[^\d.])(\d+)\.(\d+)\.(\d+)(?![\d.]*\d)/.exec(String(text ?? '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// -1 / 0 / 1, or null if either side is unparseable.
export function compareVersions(a, b) {
  const pa = Array.isArray(a) ? a : parseSemver(a);
  const pb = Array.isArray(b) ? b : parseSemver(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
}

export function checkVersion(output, min = MIN_VERSION) {
  const v = parseSemver(output);
  if (!v) return { status: 'fail', detail: 'could not parse a version from `claude --version` output' };
  const text = v.join('.');
  if (compareVersions(v, min) < 0) return { status: 'fail', detail: `claude ${text} is older than required ${min}` };
  return { status: 'pass', detail: `claude ${text} >= ${min}` };
}

// Presence-only. The credentials file is never opened (stat only). For
// ~/.claude.json only the top-level key name "oauthAccount" is tested; its
// value is never inspected, copied, or reported.
export function checkAuth(home) {
  const cred = join(home, '.claude', '.credentials.json');
  const main = join(home, '.claude.json');
  let unreadable = false;
  try {
    if (existsSync(cred) && statSync(cred).size > 0) {
      return { status: 'pass', detail: 'credentials marker file present (non-empty)' };
    }
  } catch {
    unreadable = true;
  }
  try {
    if (existsSync(main)) {
      const obj = JSON.parse(readFileSync(main, 'utf8'));
      if (obj && typeof obj === 'object' && Object.hasOwn(obj, 'oauthAccount')) {
        return { status: 'pass', detail: 'oauthAccount key present' };
      }
    }
  } catch (e) {
    if (e.code === 'EACCES' || e.code === 'EPERM') unreadable = true;
  }
  if (unreadable) return { status: 'warn', detail: 'auth unverified: markers not readable (permissions)' };
  return { status: 'fail', detail: 'no Claude Code auth marker found; run `claude` to log in' };
}

// Recover-once guard: reinstall only for a missing binary and only if no
// reinstall has been attempted yet. Never recommends a second one.
export function recoveryDecision(binaryMissing, attemptsMade) {
  if (!binaryMissing) return 'none';
  return attemptsMade < MAX_REINSTALL_ATTEMPTS ? 'reinstall' : 'fail';
}

const REQUIRED = new Set(['claude-binary', 'claude-version', 'claude-auth', 'github-auth', 'repo-state']);

// Checks are required unless they set required: false. Only fails of required
// checks affect the exit code; warns never do.
export function summarize(checks) {
  const failed = checks.filter((c) => c.status === 'fail' && (c.required ?? REQUIRED.has(c.name)));
  const warned = checks.filter((c) => c.status === 'warn');
  const exitCode = failed.length ? 1 : 0;
  const line = exitCode
    ? `preflight FAILED: ${failed.map((c) => `${c.name} (${c.detail})`).join('; ')}`
    : `preflight ok${warned.length ? ` with ${warned.length} warning(s): ${warned.map((c) => c.name).join(', ')}` : ''}`;
  return { checks, exitCode, line };
}

// ---- runtime shell-outs (not exercised by unit tests) ----
function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function ok(cmd, args) {
  try {
    sh(cmd, args);
    return true;
  } catch {
    return false;
  }
}

export function defaultProbes() {
  return {
    claudeOnPath: () => ok('sh', ['-c', 'command -v claude']),
    claudeVersion: () => sh('claude', ['--version']),
    reinstall: () => sh('npm', ['install', '-g', PINNED_PACKAGE]),
    ghAuth: () => ok('gh', ['auth', 'status']),
    isGitRepo: () => ok('git', ['rev-parse', '--is-inside-work-tree']),
    hasOrigin: () => ok('git', ['remote', 'get-url', 'origin']),
    lsRemote: () => ok('git', ['ls-remote', 'origin', 'HEAD']),
    home: homedir(),
  };
}

// Probes are injectable so the orchestration is testable without executing anything.
export function runPreflight(p = defaultProbes()) {
  const checks = [];
  const add = (name, status, detail) => checks.push({ name, status, detail });

  let present = p.claudeOnPath();
  let attempts = 0;
  if (recoveryDecision(!present, attempts) === 'reinstall') {
    attempts++;
    try {
      p.reinstall();
    } catch {
      // the re-check below decides
    }
    present = p.claudeOnPath();
  }
  if (present) {
    add('claude-binary', 'pass', attempts ? 'claude found after one reinstall' : 'claude found on PATH');
    let out = '';
    try {
      out = p.claudeVersion();
    } catch {
      // unparseable -> fail
    }
    const v = checkVersion(out);
    add('claude-version', v.status, v.detail);
  } else {
    add('claude-binary', 'fail',
      `missing dependency: claude. One reinstall attempted and failed. Manual recovery: npm install -g ${PINNED_PACKAGE}`);
    add('claude-version', 'fail', 'skipped: claude binary missing');
  }

  const auth = checkAuth(p.home);
  add('claude-auth', auth.status, auth.detail);

  const gh = p.ghAuth();
  add('github-auth', gh ? 'pass' : 'fail', gh ? 'gh auth status exit 0' : 'gh auth status failed; run `gh auth login`');

  let repo = ['fail', 'not a git repository'];
  if (p.isGitRepo()) {
    if (!p.hasOrigin()) repo = ['fail', 'no origin remote'];
    else if (!p.lsRemote()) repo = ['fail', 'git ls-remote origin HEAD failed'];
    else repo = ['pass', 'git repo, origin reachable'];
  }
  add('repo-state', ...repo);

  return summarize(checks);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { checks, exitCode, line } = runPreflight();
  console.log(JSON.stringify({ checks, exitCode }, null, 2));
  console.log(line);
  process.exit(exitCode);
}
