import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExistingPr } from './pr-adopt.mjs';

const pr = (n, state) => ({ url: `https://github.com/o/r/pull/${n}`, state });
const url = (n) => pr(n).url;

test('no PRs', () => {
  assert.deepEqual(findExistingPr('[]'), { url: null, anomaly: null });
});

test('one open PR', () => {
  assert.deepEqual(findExistingPr(JSON.stringify([pr(1, 'OPEN')])), { url: url(1), anomaly: null });
});

test('closed and merged PRs do not count', () => {
  assert.equal(findExistingPr(JSON.stringify([pr(1, 'CLOSED'), pr(2, 'MERGED')])).url, null);
});

test('mixed closed + one open returns the open one without anomaly', () => {
  const r = findExistingPr(JSON.stringify([pr(1, 'CLOSED'), pr(2, 'OPEN')]));
  assert.equal(r.url, url(2));
  assert.equal(r.anomaly, null);
});

test('multiple open: first returned and anomaly noted', () => {
  const r = findExistingPr(JSON.stringify([pr(3, 'OPEN'), pr(4, 'OPEN')]));
  assert.equal(r.url, url(3));
  assert.match(r.anomaly, /2 open PRs/);
});

test('malformed input', () => {
  for (const bad of ['not json', '{"a":1}', 'null', '', undefined]) {
    const r = findExistingPr(bad);
    assert.equal(r.url, null);
    assert.ok(r.anomaly);
  }
  assert.equal(findExistingPr('[null, 3, {"state":"OPEN"}]').url, null);
});
