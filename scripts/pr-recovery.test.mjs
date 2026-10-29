import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adoptPr } from './pr-recovery.mjs';

const BRANCH = 'phase2/example';
const PR_URL = 'https://github.com/o/r/pull/42';
const SHA = 'a'.repeat(40);

// Stubbed gh: records every call; "GitHub" state lives in `prs`. Canned JSON only.
function makeGhStub(prs = []) {
  const calls = [];
  const run = (args) => {
    calls.push(args);
    if (args[0] === 'pr' && args[1] === 'create') {
      prs.push({ url: PR_URL, state: 'OPEN', headRefOid: SHA });
      return PR_URL + '\n';
    }
    if (args[0] === 'pr' && args[1] === 'list') return JSON.stringify(prs);
    throw new Error(`unexpected gh call: ${args.join(' ')}`);
  };
  return { run, calls, count: (sub) => calls.filter((c) => c[1] === sub).length };
}

let tmp;
let savedPath;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pr-recovery-'));
  // Empty PATH: any accidental real `gh` spawn would fail with ENOENT.
  savedPath = process.env.PATH;
  process.env.PATH = tmp;
});
afterEach(() => {
  process.env.PATH = savedPath;
  rmSync(tmp, { recursive: true, force: true });
});

test('no real gh is reachable in the fixture', () => {
  const r = spawnSync('gh', ['--version']);
  assert.equal(r.error?.code, 'ENOENT');
});

test('(a) crash-then-adopt: one pr-create across both runs, URL adopted', () => {
  const gh = makeGhStub();
  const record = join(tmp, 'task-record.json');

  // Run 1: creates the PR, then crashes before recording the URL.
  gh.run(['pr', 'create', '--head', BRANCH, '--title', 't', '--body', 'b']);
  assert.equal(gh.count('create'), 1);
  // (URL deliberately discarded; nothing written to `record`.)

  // Run 2: adopt before creating.
  const adopted = adoptPr({ branch: BRANCH, ghRunner: gh.run });
  assert.ok(adopted, 'expected to adopt run 1 PR');
  assert.equal(adopted.url, PR_URL);
  assert.equal(adopted.headSha, SHA);
  assert.equal(adopted.anomaly, null);
  writeFileSync(record, JSON.stringify({ pr: adopted.url }));

  assert.equal(gh.count('create'), 1, 'pr-create must be invoked exactly once across both runs');
  assert.equal(gh.count('list'), 1);
  assert.equal(JSON.parse(readFileSync(record, 'utf8')).pr, PR_URL);
  // The stub log is the only record of gh activity.
  assert.equal(gh.calls.length, 2);
});

test('(b) no open PR => null, and adoptPr never creates', () => {
  const gh = makeGhStub([]);
  assert.equal(adoptPr({ branch: BRANCH, ghRunner: gh.run }), null);
  assert.equal(gh.count('create'), 0);
  assert.equal(gh.calls.length, 1);
});

test('(c) only a CLOSED PR => null', () => {
  const gh = makeGhStub([{ url: PR_URL, state: 'CLOSED', headRefOid: SHA }]);
  assert.equal(adoptPr({ branch: BRANCH, ghRunner: gh.run }), null);
  assert.equal(gh.count('create'), 0);
});

test('(d) multiple open PRs => first adopted with anomaly', () => {
  const second = 'https://github.com/o/r/pull/43';
  const gh = makeGhStub([
    { url: PR_URL, state: 'OPEN', headRefOid: SHA },
    { url: second, state: 'OPEN', headRefOid: SHA },
  ]);
  const r = adoptPr({ branch: BRANCH, ghRunner: gh.run });
  assert.equal(r.url, PR_URL);
  assert.match(r.anomaly, /2 open PRs/);
  assert.equal(gh.count('create'), 0);
});

test('head mismatch is surfaced as an anomaly, not silently adopted', () => {
  const gh = makeGhStub([{ url: PR_URL, state: 'OPEN', headRefOid: SHA }]);
  const r = adoptPr({ branch: BRANCH, expectedHeadSha: 'b'.repeat(40), ghRunner: gh.run });
  assert.equal(r.url, PR_URL);
  assert.match(r.anomaly, /does not match expected/);
  const ok = adoptPr({ branch: BRANCH, expectedHeadSha: SHA, ghRunner: gh.run });
  assert.equal(ok.anomaly, null);
});

test('malformed gh output surfaces an anomaly and no URL', () => {
  const r = adoptPr({ branch: BRANCH, ghRunner: () => 'not json' });
  assert.equal(r.url, null);
  assert.ok(r.anomaly);
});
