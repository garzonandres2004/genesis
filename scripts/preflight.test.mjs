import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
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
