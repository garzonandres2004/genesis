// Integration tests for the runner orchestration order. Every step runs the
// real script as a child process (preflight, claim CLI, adopt CLI, reconcile)
// against temp fixtures: temp HOME, a PATH holding only git/sh/node plus stub
// `claude` and `gh`, and a temp bare git remote. No real gh/claude/GitHub.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { readEvents } from './events.mjs';
import {
  fixture, git, worker, preflight, claimTask, startedTask, dispatch, dispatchHanging, verify, adopt,
  createPr, installReconcile,
} from './runner-fixture.mjs';

const BASE = { id: 't-1', title: 'fixture task', status: 'queued', attempts: 0, runs: [] };
const BRANCH = 'task/t-1';
const NOW1 = '2026-10-29T10:00:00.000Z';
const NOW2 = '2026-10-29T11:00:00.000Z';
const seq = (f, pick) => f.order().filter((l) => pick.some((p) => l.startsWith(p)));
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('(a) full happy path in worker order: preflight, claim, builder, verify, adopt null, create once, outcome', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    const { task, run } = startedTask(BASE, NOW1);
    const out = worker(f, { dir, branch: BRANCH, task, run });

    assert.equal(out.stopped, undefined);
    assert.equal(out.claim.json.status, 'WON');
    assert.deepEqual(out.adopt.json, { url: null, headSha: null, anomaly: null });

    // order preserved: claim before builder, adopt (gh:list) before create
    assert.deepEqual(seq(f, ['preflight', 'claim', 'claude:dispatch', 'verify', 'gh:list', 'gh:create', 'outcome']), [
      'preflight:ok', 'claim', 'claude:dispatch remote_has_branch=yes', 'verify:pass', 'gh:list', 'gh:create', 'outcome',
    ]);

    // exactly one claim commit (the base's only child on the branch), exactly one PR
    assert.equal(git(f.remote, 'rev-list', '--count', `${f.baseSha}..refs/heads/${BRANCH}`), '2'); // claim + builder
    const claimCommits = git(f.remote, 'log', '--format=%s', `${f.baseSha}..refs/heads/${BRANCH}`).split('\n').filter((s) => s === 'claim t-1');
    assert.equal(claimCommits.length, 1);
    assert.equal(f.ghState().creates, 1);
    assert.equal(f.ghState().prs.length, 1);

    // claim commit carries the task record and task_started event
    const onBranch = (p) => git(f.remote, 'show', `refs/heads/${BRANCH}:${p}`);
    assert.equal(JSON.parse(onBranch('tasks/t-1.json')).status, 'in_progress');
    assert.equal(onBranch('events.jsonl').split('\n').filter(Boolean).map((l) => JSON.parse(l).type)[0], 'task_started');

    // outcome record
    const rec = readJson(join(dir, 'tasks', 't-1.json'));
    assert.equal(rec.status, 'completed');
    assert.equal(rec.runs[0].outcome, 'completed');
    assert.deepEqual(rec.evidence, [out.url]);
  } finally { f.cleanup(); }
});

test('(a2) preflight failure stops before any claim, dispatch or PR', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    rmSync(join(f.bin, 'claude')); // missing binary; npm is not on the fixture PATH so the one reinstall fails safely
    const { task, run } = startedTask(BASE, NOW1);
    const out = worker(f, { dir, branch: BRANCH, task, run });
    assert.equal(out.stopped, 'preflight');
    assert.match(out.preflight.stdout, /preflight FAILED/);
    assert.equal(f.hasBranch(BRANCH), false);
    assert.deepEqual(seq(f, ['claim', 'claude:dispatch', 'gh:create']), []);
  } finally { f.cleanup(); }
});

test('(b) second claim while the first is running => LOST, second dispatch never invoked', () => {
  const f = fixture();
  try {
    const dirA = f.clone();
    const dirB = f.clone();
    const a = startedTask(BASE, NOW1);
    assert.equal(preflight(f, dirA).status, 0);
    const first = claimTask(f, { dir: dirA, branch: BRANCH, task: a.task, run: a.run });
    assert.equal(first.json.status, 'WON');
    // worker A is now "running" its builder (not yet dispatched to completion); worker B ticks:
    // worker B ticks through the real worker flow; dispatch is gated on the claim result
    const b = startedTask(BASE, NOW2);
    const out = worker(f, { dir: dirB, branch: BRANCH, task: b.task, run: b.run });
    assert.equal(out.stopped, 'claim');
    assert.equal(out.claim.status, 0);
    assert.deepEqual(out.claim.json, { status: 'LOST', reason: 'branch_exists', sha: null });
    assert.equal(seq(f, ['claude:dispatch']).length, 0);
    assert.equal(f.ghState().creates, 0);
    assert.equal(git(f.remote, 'rev-parse', `refs/heads/${BRANCH}`), first.json.sha);
    assert.equal(existsSync(join(dirB, 'built.txt')), false);
  } finally { f.cleanup(); }
});

test('(c) crash after create: PR exists, URL never recorded; adopt finds it; create count stays 1', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    const { task, run } = startedTask(BASE, NOW1);
    assert.equal(preflight(f, dir).status, 0);
    assert.equal(claimTask(f, { dir, branch: BRANCH, task, run }).json.status, 'WON');
    dispatch(f, dir, BRANCH);
    assert.ok(verify(f, dir));
    git(dir, 'push', '-q', 'origin', `HEAD:refs/heads/${BRANCH}`);

    // run 1: adopt says null, create succeeds, then the "crash": the URL is dropped unrecorded
    assert.equal(adopt(f, dir, BRANCH).json.url, null);
    const lost = createPr(f, dir, BRANCH);
    assert.equal(f.ghState().creates, 1);
    void lost; // simulated crash: never written to the task record

    // run 2 (retry of the same step): adopt discovers and adopts; create is NOT called
    const second = adopt(f, dir, BRANCH, ['--expected-head', git(dir, 'rev-parse', 'HEAD')]);
    assert.equal(second.status, 0);
    assert.equal(second.json.url, lost);
    assert.equal(second.json.anomaly, null);
    assert.equal(f.ghState().creates, 1);
    assert.equal(f.ghState().prs.length, 1);
    assert.equal(seq(f, ['gh:create']).length, 1);
  } finally { f.cleanup(); }
});

test('(d) kill mid-run: real reconcile marks interrupted + re-queues once; retry completes', async () => {
  const f = fixture();
  let h;
  try {
    const dir = f.clone();
    const { task, run } = startedTask(BASE, NOW1);
    assert.equal(preflight(f, dir).status, 0);
    assert.equal(claimTask(f, { dir, branch: BRANCH, task, run }).json.status, 'WON');

    h = await dispatchHanging(f, dir, BRANCH);
    h.child.kill('SIGKILL');
    const exit = await h.exited;
    assert.equal(exit.sig, 'SIGKILL');

    // real reconcile.mjs, rooted at the fixture checkout (repoRoot = parent of scripts/)
    const reconcile = installReconcile(dir);
    const r1 = f.run('reconcile.mjs', [], { cwd: dir, scriptPath: reconcile });
    assert.equal(r1.status, 0, r1.stderr);
    const rec = readJson(join(dir, 'tasks', 't-1.json'));
    assert.equal(rec.status, 'queued');
    assert.equal(rec.attempts, 1);
    assert.equal(rec.runs.length, 1);
    assert.equal(rec.runs[0].outcome, 'interrupted');
    const types = () => readEvents(join(dir, 'events.jsonl')).map((e) => e.type);
    assert.deepEqual(types(), ['task_started', 'run_interrupted', 'task_requeued']);

    // idempotent: a second reconcile changes nothing and adds no events
    const r2 = f.run('reconcile.mjs', [], { cwd: dir, scriptPath: reconcile });
    assert.match(r2.stdout, /0 changed, 0 events/);
    assert.deepEqual(types(), ['task_started', 'run_interrupted', 'task_requeued']);

    // retry: new attempt, new claim branch (the interrupted claim branch still exists remotely), completes
    const dir2 = f.clone();
    const retry = startedTask(rec, NOW2);
    assert.equal(retry.task.attempts, 2);
    const out = worker(f, {
      dir: dir2, branch: 'task/t-1-attempt-2', task: retry.task, run: retry.run,
      priorEvents: readFileSync(join(dir, 'events.jsonl'), 'utf8'),
    });
    assert.equal(out.stopped, undefined);
    const final = readJson(join(dir2, 'tasks', 't-1.json'));
    assert.equal(final.status, 'completed');
    assert.deepEqual(final.runs.map((x) => x.outcome), ['interrupted', 'completed']);
    assert.deepEqual(readEvents(join(dir2, 'events.jsonl')).map((e) => e.type),
      ['task_started', 'run_interrupted', 'task_requeued', 'task_started', 'task_completed']);
    assert.equal(f.ghState().creates, 1);
  } finally {
    if (h) h.child.kill('SIGKILL');
    f.cleanup();
  }
});

test('(e) anomaly: multiple open PRs => first + anomaly reported, create never invoked', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    const mk = (n) => ({ url: `https://example.invalid/pr/${n}`, state: 'OPEN', headRefOid: 'c'.repeat(40), head: BRANCH });
    f.setGh({ prs: [mk(1), mk(2)] });
    const { task, run } = startedTask(BASE, NOW1);
    const out = worker(f, { dir, branch: BRANCH, task, run });
    assert.equal(out.stopped, 'anomaly');
    assert.equal(out.adopt.json.url, 'https://example.invalid/pr/1');
    assert.match(out.adopt.json.anomaly, /2 open PRs/);
    assert.equal(f.ghState().creates, 0);
    assert.equal(seq(f, ['gh:create']).length, 0);
    assert.equal(existsSync(join(dir, 'tasks', 't-1.json')) && readJson(join(dir, 'tasks', 't-1.json')).status, 'in_progress');
  } finally { f.cleanup(); }
});

test('(e2) gh failure at adopt => exit 1, create never invoked', () => {
  const f = fixture();
  try {
    const dir = f.clone();
    const { task, run } = startedTask(BASE, NOW1);
    // preflight's `gh auth status` must pass; only pr commands fail
    f.setGh({ fail: true });
    const out = worker(f, { dir, branch: BRANCH, task, run });
    assert.equal(out.stopped, 'adopt_error');
    assert.equal(out.adopt.status, 1);
    assert.equal(f.ghState().creates, 0);
    assert.equal(seq(f, ['gh:create']).length, 0);
  } finally { f.cleanup(); }
});
