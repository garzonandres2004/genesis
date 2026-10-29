import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSemver, compareVersions, checkVersion, checkAuth, recoveryDecision, summarize, runPreflight,
} from './preflight.mjs';

// Fixtures live inside the worktree, never the real ~/.claude.
const ROOT = join(fileURLToPath(new URL('..', import.meta.url)), '.preflight-test-tmp');
mkdirSync(ROOT, { recursive: true });
const fakeHome = () => mkdtempSync(join(ROOT, 'home-'));
test.after(() => rmSync(ROOT, { recursive: true, force: true }));

test('parseSemver', () => {
  assert.deepEqual(parseSemver('2.1.312 (Claude Code)'), [2, 1, 312]);
  assert.deepEqual(parseSemver('v2.1.400\n'), [2, 1, 400]);
  assert.equal(parseSemver(''), null);
  assert.equal(parseSemver('command not found'), null);
  assert.equal(parseSemver('2.1'), null);
  assert.equal(parseSemver(undefined), null);
});

test('checkVersion: unparseable, older, equal, newer', () => {
  assert.equal(checkVersion('garbage').status, 'fail');
  assert.equal(checkVersion('2.1.311 (Claude Code)').status, 'fail');
  assert.equal(checkVersion('1.9.999').status, 'fail');
  assert.equal(checkVersion('2.1.312 (Claude Code)').status, 'pass');
  assert.equal(checkVersion('2.1.313').status, 'pass');
  assert.equal(checkVersion('2.2.0').status, 'pass');
  assert.equal(checkVersion('3.0.0').status, 'pass');
});

test('compareVersions', () => {
  assert.equal(compareVersions('2.1.9', '2.1.10'), -1);
  assert.equal(compareVersions('2.1.312', '2.1.312'), 0);
  assert.equal(compareVersions('2.2.0', '2.1.999'), 1);
  assert.equal(compareVersions('nope', '2.1.312'), null);
});

test('recover-once guard never recommends a second reinstall', () => {
  assert.equal(recoveryDecision(false, 0), 'none');
  assert.equal(recoveryDecision(true, 0), 'reinstall');
  assert.equal(recoveryDecision(true, 1), 'fail');
  assert.equal(recoveryDecision(true, 2), 'fail');
  assert.equal(recoveryDecision(true, 99), 'fail');
});

test('summarize: any required fail => exit 1; warn alone => exit 0', () => {
  const pass = { name: 'claude-binary', status: 'pass', detail: '' };
  assert.equal(summarize([pass]).exitCode, 0);
  assert.equal(summarize([pass, { name: 'github-auth', status: 'fail', detail: 'x' }]).exitCode, 1);
  assert.equal(summarize([pass, { name: 'claude-auth', status: 'warn', detail: 'x' }]).exitCode, 0);
  assert.equal(summarize([{ name: 'extra', status: 'fail', detail: '', required: false }]).exitCode, 0);
  assert.match(summarize([{ name: 'repo-state', status: 'fail', detail: 'no origin remote' }]).line, /repo-state/);
});

test('checkAuth: credentials file non-empty passes', () => {
  const h = fakeHome();
  mkdirSync(join(h, '.claude'));
  writeFileSync(join(h, '.claude', '.credentials.json'), 'x');
  assert.equal(checkAuth(h).status, 'pass');
});

test('checkAuth: empty credentials file does not count', () => {
  const h = fakeHome();
  mkdirSync(join(h, '.claude'));
  writeFileSync(join(h, '.claude', '.credentials.json'), '');
  assert.equal(checkAuth(h).status, 'fail');
});

test('checkAuth: oauthAccount key passes and its value is never reported', () => {
  const h = fakeHome();
  writeFileSync(join(h, '.claude.json'), JSON.stringify({ oauthAccount: { emailAddress: 'SENTINEL-VALUE' } }));
  const r = checkAuth(h);
  assert.equal(r.status, 'pass');
  assert.ok(!JSON.stringify(r).includes('SENTINEL-VALUE'));
});

test('checkAuth: no markers, or claude.json without the key => fail', () => {
  const h = fakeHome();
  assert.equal(checkAuth(h).status, 'fail');
  writeFileSync(join(h, '.claude.json'), JSON.stringify({ other: 1 }));
  assert.equal(checkAuth(h).status, 'fail');
});

const probes = (over = {}) => ({
  claudeOnPath: () => true,
  claudeVersion: () => '2.1.312 (Claude Code)',
  reinstall: () => {},
  ghAuth: () => true,
  isGitRepo: () => true,
  hasOrigin: () => true,
  lsRemote: () => true,
  home: (() => {
    const h = fakeHome();
    writeFileSync(join(h, '.claude.json'), '{"oauthAccount":{}}');
    return h;
  })(),
  ...over,
});

test('runPreflight: all good => exit 0', () => {
  assert.equal(runPreflight(probes()).exitCode, 0);
});

test('runPreflight: missing binary triggers exactly one reinstall, then fails clearly', () => {
  let installs = 0;
  const r = runPreflight(probes({ claudeOnPath: () => false, reinstall: () => { installs++; } }));
  assert.equal(installs, 1);
  assert.equal(r.exitCode, 1);
  assert.match(r.checks[0].detail, /npm install -g @anthropic-ai\/claude-code@2\.1\.312/);
});

test('runPreflight: reinstall that fixes the binary passes', () => {
  let installed = false;
  const r = runPreflight(probes({ claudeOnPath: () => installed, reinstall: () => { installed = true; } }));
  assert.equal(r.exitCode, 0);
});

test('runPreflight: old version fails without reinstalling', () => {
  let installs = 0;
  const r = runPreflight(probes({ claudeVersion: () => '2.0.1', reinstall: () => { installs++; } }));
  assert.equal(installs, 0);
  assert.equal(r.exitCode, 1);
});

test('runPreflight: repo state and gh failures', () => {
  assert.equal(runPreflight(probes({ ghAuth: () => false })).exitCode, 1);
  assert.equal(runPreflight(probes({ isGitRepo: () => false })).exitCode, 1);
  assert.equal(runPreflight(probes({ hasOrigin: () => false })).exitCode, 1);
  assert.equal(runPreflight(probes({ lsRemote: () => false })).exitCode, 1);
});

// ---- runner wiring scenarios (see docs/runner-preflight-wiring.md) ----
const byName = (r, name) => r.checks.find((c) => c.name === name);
const REQUIRED_CHECKS = ['claude-binary', 'claude-version', 'claude-auth', 'github-auth', 'repo-state'];

test('scenario (a): successful startup => exit 0, every required check passes', () => {
  const r = runPreflight(probes());
  assert.equal(r.exitCode, 0);
  for (const name of REQUIRED_CHECKS) assert.equal(byName(r, name)?.status, 'pass', name);
  assert.equal(r.line, 'preflight ok');
});

test('scenario (b): missing binary, one reinstall succeeds => pass, detail notes the reinstall', () => {
  const calls = [];
  let installed = false;
  const r = runPreflight(probes({
    claudeOnPath: () => { calls.push('path'); return installed; },
    reinstall: () => { calls.push('reinstall'); installed = true; },
  }));
  assert.deepEqual(calls, ['path', 'reinstall', 'path']);
  assert.equal(r.exitCode, 0);
  assert.equal(byName(r, 'claude-binary').status, 'pass');
  assert.match(byName(r, 'claude-binary').detail, /found after one reinstall/);
  assert.equal(byName(r, 'claude-version').status, 'pass');
});

test('scenario (c): missing binary, reinstall fails => exit 1, names the missing dependency, one attempt only', () => {
  let installs = 0;
  let pathChecks = 0;
  const r = runPreflight(probes({
    claudeOnPath: () => { pathChecks++; return false; },
    reinstall: () => { installs++; throw new Error('npm failed'); },
  }));
  assert.equal(installs, 1);
  assert.equal(pathChecks, 2);
  assert.equal(r.exitCode, 1);
  const bin = byName(r, 'claude-binary');
  assert.equal(bin.status, 'fail');
  assert.match(bin.detail, /missing dependency: claude/);
  assert.match(r.line, /^preflight FAILED: claude-binary \(missing dependency: claude/);
  // The run only reports: plain data out, no task state in or out.
  assert.deepEqual(Object.keys(r).sort(), ['checks', 'exitCode', 'line']);
});

test('scenario (d): no auth markers => claude-auth fails and exit 1', () => {
  const r = runPreflight(probes({ home: fakeHome() }));
  assert.equal(byName(r, 'claude-auth').status, 'fail');
  assert.equal(r.exitCode, 1);
  assert.match(r.line, /claude-auth/);
});

// chmod cannot make a file unreadable to root, so this scenario only runs as a normal user.
test('scenario (d): unreadable auth markers => warn, not fail; exit 0 when all else passes',
  { skip: process.getuid?.() === 0 ? 'running as root: permissions cannot deny reads' : false },
  () => {
    const h = fakeHome();
    const f = join(h, '.claude.json');
    writeFileSync(f, '{"oauthAccount":{}}');
    chmodSync(f, 0o000);
    try {
      const r = runPreflight(probes({ home: h }));
      assert.equal(byName(r, 'claude-auth').status, 'warn');
      assert.equal(r.exitCode, 0);
      assert.match(r.line, /with 1 warning\(s\): claude-auth/);
    } finally {
      chmodSync(f, 0o600);
    }
  });

test('scenario (e): unavailable repository => repo-state fails and exit 1, in each case', () => {
  const cases = [
    [{ isGitRepo: () => false }, /not a git repository/],
    [{ hasOrigin: () => false }, /no origin remote/],
    [{ lsRemote: () => false }, /ls-remote/],
  ];
  for (const [over, re] of cases) {
    const r = runPreflight(probes(over));
    assert.equal(byName(r, 'repo-state').status, 'fail');
    assert.match(byName(r, 'repo-state').detail, re);
    assert.equal(r.exitCode, 1);
    assert.match(r.line, /repo-state/);
  }
});

test('no-leak: a secret under oauthAccount passes auth and never appears in the run output', () => {
  const SECRET = 'DUMMY-SECRET-VALUE-0000';
  const h = fakeHome();
  writeFileSync(join(h, '.claude.json'), JSON.stringify({ oauthAccount: { accessToken: SECRET, emailAddress: SECRET } }));
  const r = runPreflight(probes({ home: h }));
  assert.equal(byName(r, 'claude-auth').status, 'pass');
  assert.equal(r.exitCode, 0);
  assert.ok(!JSON.stringify({ checks: r.checks, exitCode: r.exitCode }, null, 2).includes(SECRET));
  assert.ok(!r.line.includes(SECRET));
});
