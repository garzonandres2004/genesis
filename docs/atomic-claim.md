# Atomic task claim

Task: `phase2-atomic-claim`. Code: `scripts/claim.mjs`. Tests: `scripts/claim.test.mjs`.

## 1. Why a branch-state check alone is not atomic

"Look at the remote; if the task branch is absent, start the task" is a
read-then-act sequence. Two workers, A and B, both targeting task `t-1`:

```
A: ls-remote task/t-1  -> absent
B: ls-remote task/t-1  -> absent      (A has not pushed yet)
A: commit claim, push task/t-1        -> ok
B: commit claim, push task/t-1        -> ok if the push is not guarded
A: dispatch builder    B: dispatch builder     <- double dispatch
```

Between the read and the act, the state the check observed can change. No
amount of checking more carefully, or checking twice, removes that window.

## 2. How the push closes it

A plain (non-force) `git push` of `HEAD:refs/heads/<branch>` is a
compare-and-swap on the remote ref: git takes a lock on the ref and accepts
the update only if it creates the ref or fast-forwards it. Git serializes
concurrent updates to the same ref, so when A and B both push claim commits
built from the same base:

- one push lands and the ref now points at that commit;
- the other is rejected (non-fast-forward, or a ref-lock failure) because its
  commit is not a descendant of the new tip.

`claim()` returns `WON` (with the commit SHA) only if the push succeeded and
the remote tip equals our commit. Otherwise it discards the local branch and
returns `LOST`. A `LOST` worker stands down before any builder dispatch,
because dispatch is the caller's job and the caller only dispatches on `WON`.

Two details that keep this honest:

- Every claim commit carries a random `Claim-Nonce` trailer. Without it, two
  workers writing identical content with identical metadata could produce the
  same SHA, and the second push would be a no-op "up to date" success, i.e.
  two winners. With distinct SHAs the loser's commit is never a descendant of
  the winner's.
- There is no force path. `claim.mjs` never passes `--force`,
  `--force-with-lease`, or a `+` refspec. The diverged-branch test asserts a
  rejected push leaves the remote tip untouched.

## 3. Residual window

The `ls-remote` check before the push is only an optimization: it avoids
preparing and pushing when the answer is already obviously "taken". It is
still a read-then-act race on its own, and the design does not depend on it.
Even if both workers pass the check, only one push can succeed. The residual
window is the push itself, which is the single atomic operation and the
guarantee. Nothing outside it can produce two winners.

Failure modes that are not races: if the push fails and the branch is absent
on the remote (unreachable remote, auth failure), `claim()` throws instead of
returning `LOST`. The caller must not dispatch in that case either.

## 4. Single-worker behavior preserved

Unchanged semantics: one task per tick, claim first, then dispatch. The
runner calls `claim()` before dispatching, in the same order as today's
manual startRun-push; what changes is that the ordering is enforced by code
and by git, not by procedure.

## 5. Parallel execution stays OFF

This change makes claiming safe. It does not authorize parallel ticks or
concurrent workers. Enabling parallelism needs a separate directive from the
orchestrator/user. Until then the schedule runs one worker per tick.

## 6. How the runner will use it

`claim.mjs` takes claim content as input and does nothing else:

```js
const r = await claim({
  repoDir, remote: 'origin', branch: 'task/<id>', baseSha,
  message: 'claim <id>',
  writeFiles: [{ path: 'tasks/<id>.json', content }, { path: 'events.jsonl', content }],
  // or: writeFiles: async (repoDir) => { /* write task record + events */ },
});
if (r.status === 'WON') dispatchBuilder(r.sha);   // runner's job, not claim.mjs's
else stopThisTick();                              // LOST: no dispatch, no PR
```

A future cron-body step will replace the manual startRun-push with this
call. This task does not edit the schedule, any cron job, or `tasks/*.json`.
On `WON` the local repo is left on the claim branch; on `LOST` the local
branch is deleted and the previous checkout restored.

## Tests

`scripts/claim.test.mjs` uses only temp bare remotes and clones (no origin,
no GitHub). The race test makes both workers pass the check and commit
locally, holds them at a barrier (`hooks.beforePush`), then releases both
pushes together as concurrent git processes. It runs 3 rounds and asserts
exactly one winner per round, remote tip equals the winner's SHA, and the
loser's fake dispatch is never called.
