// CLI-level tests for pr-recovery.mjs. gh is a stub binary on an isolated
// PATH; the real gh is never reachable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, parseLine } from './runner-fixture.mjs';

const SHA = 'a'.repeat(40);
const pr = (n, state, head = 'task/t-1') =>
  ({ url: `https://example.invalid/pr/${n}`, state, headRefOid: SHA, head });

function adopt(f, extra = []) {
  return f.run('pr-recovery.mjs', ['--branch', 'task/t-1', ...extra], { cwd: f.root });
}

test('adopt CLI: no PRs => exit 0, all-null JSON (caller may create)', () => {
  const f = fixture();
  try {
    const r = adopt(f);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(parseLine(r.stdout), { url: null, headSha: null, anomaly: null });
  } finally { f.cleanup(); }
});

test('adopt CLI: one open PR => url + headSha, anomaly null (adopt)', () => {
  const f = fixture();
  try {
    f.setGh({ prs: [pr(1, 'OPEN')] });
    const r = adopt(f);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(parseLine(r.stdout), { url: 'https://example.invalid/pr/1', headSha: SHA, anomaly: null });
  } finally { f.cleanup(); }
});

test('adopt CLI: only closed/merged PRs => null (create fresh)', () => {
  const f = fixture();
  try {
    f.setGh({ prs: [pr(1, 'CLOSED'), pr(2, 'MERGED')] });
    const r = adopt(f);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(parseLine(r.stdout), { url: null, headSha: null, anomaly: null });
  } finally { f.cleanup(); }
});

test('adopt CLI: PR on another branch is ignored', () => {
  const f = fixture();
  try {
    f.setGh({ prs: [pr(1, 'OPEN', 'task/other')] });
    assert.deepEqual(parseLine(adopt(f).stdout), { url: null, headSha: null, anomaly: null });
  } finally { f.cleanup(); }
});

test('adopt CLI: multiple open PRs => first url plus anomaly (surface, do not create)', () => {
  const f = fixture();
  try {
    f.setGh({ prs: [pr(1, 'OPEN'), pr(2, 'OPEN')] });
    const r = adopt(f);
    assert.equal(r.status, 0, r.stderr);
    const j = parseLine(r.stdout);
    assert.equal(j.url, 'https://example.invalid/pr/1');
    assert.match(j.anomaly, /2 open PRs/);
  } finally { f.cleanup(); }
});

test('adopt CLI: --expected-head mismatch => anomaly; match => none', () => {
  const f = fixture();
  try {
    f.setGh({ prs: [pr(1, 'OPEN')] });
    assert.match(parseLine(adopt(f, ['--expected-head', 'b'.repeat(40)]).stdout).anomaly, /does not match expected/);
    assert.equal(parseLine(adopt(f, ['--expected-head', SHA]).stdout).anomaly, null);
  } finally { f.cleanup(); }
});

test('adopt CLI: gh failure => exit 1, nothing on stdout (caller must NOT create)', () => {
  const f = fixture();
  try {
    f.setGh({ fail: true });
    const r = adopt(f);
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /adopt failed/);
  } finally { f.cleanup(); }
});

test('adopt CLI: missing --branch => exit 1', () => {
  const f = fixture();
  try {
    const r = f.run('pr-recovery.mjs', [], { cwd: f.root });
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
  } finally { f.cleanup(); }
});
