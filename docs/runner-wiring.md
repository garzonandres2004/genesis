# Runner wiring: invoking the guards from the cron worker

Supports milestones M5 and M6 in `docs/phase-2-plan.md`. This doc is for the orchestrator's cron-body rewrite.
It covers only how a shell-driving worker calls the guard scripts. It does not
change the schedule. The task-record write ownership rules are unchanged.

Run every command from the genesis repo root unless a `cwd` is stated. Never
print credential values.

## 1. Worker order (the contract)

```
0. node scripts/preflight.mjs                      (exit != 0 => STOP)
1. claim CLI in the task worktree                  (dispatch ONLY on WON)
2. dispatch builder in that worktree               (only after WON)
3. orchestrator verifies the builder's work        (tests, diff, checks)
4. push the task branch (fast-forward of the claim)
5. adopt CLI                                       (decides create vs adopt vs stop)
6. gh pr create                                    (ONLY when adopt says null)
7. record outcome / PR URL in the task record      (orchestrator-owned write)
```

Guarantees, each exercised by `scripts/runner-orchestration.test.mjs`:

- **Claim before dispatch.** No builder runs unless the claim CLI printed
  `"status":"WON"`. The fixture builder records whether the claim branch
  already existed on the remote when it started; the test asserts `yes`.
- **Adopt before create.** `gh pr create` is reachable only through an adopt
  result of `url: null`. In the happy path the recorded order is `gh:list`
  then `gh:create`.
- **LOST, a throw, an anomaly, and an adopt error all end in no dispatch / no
  create.** See sections 2 and 3.

## 2. Claim CLI: `scripts/claim.mjs`

```
node scripts/claim.mjs \
  --repo <worktree-dir> \
  [--remote <name>]            # default: origin
  --branch <task-branch> \
  --base <full-sha> \          # commit the claim branch is cut from
  --message <commit-message> \
  --files <path-to-json-file>  # [{"path":"tasks/<id>.json","content":"..."}, ...]
```

`--files` is a JSON file holding an array of `{ "path", "content" }`. Paths are
relative to `--repo`. For parity with the manual startRun-push (M5 acceptance 3)
it should contain two entries:

1. `tasks/<id>.json`: the task record after `startRun` (status `in_progress`,
   `attempts` incremented, a new open run).
2. `events.jsonl`: the full existing file content plus the `task_started`
   line for that run id (the CLI writes whole files; it does not append).

`--files` may be omitted (empty claim commit). The claim commit is created with
the identity `Claude (builder) <noreply@anthropic.com>`; the worker never
changes git config.

**Output and exit codes**

| Result | stdout (exactly one line) | exit | Worker action |
|---|---|---|---|
| Won | `{"status":"WON","reason":"pushed","sha":"<40-hex>"}` | 0 | Dispatch the builder in `--repo` |
| Lost | `{"status":"LOST","reason":"branch_exists"\|"push_rejected","sha":null}` | 0 | Stand down. No dispatch, no PR, no task-state change. Another worker owns the task |
| Error (unreachable remote, bad args, bad `--files`, git failure) | nothing | 1 | Treat as "unknown". No dispatch, no PR. Report stderr. Do not retry in the same tick |

LOST is a normal outcome, not an error. Parse stdout as JSON and branch on
`status`; never branch on stderr text. Check the exit code first: on exit 1
stdout is empty.

Parse example (shell, `jq` not assumed):

```
out=$(node scripts/claim.mjs ...) || { echo "claim error"; exit 1; }
node -e 'process.exit(JSON.parse(process.argv[1]).status==="WON"?0:3)' "$out" \
  && echo "dispatch" || echo "stand down"
```

### Retry branches

The claim fails with `branch_exists` while a previous attempt's claim branch
is still on the remote, including an interrupted run's. After
`node scripts/reconcile.mjs` re-queues a task, the retry must claim a
different, flat attempt-scoped branch name: `<task-branch>-attempt-2`, then
`-attempt-3` (the test uses `task/<id>-attempt-2`; note that
`task/<id>/attempt-2` would NOT work, since git cannot create a ref beneath an
existing ref of the same name). The stale claim branch stays on the remote as
evidence: it is never reused and never deleted (`docs/policy.md` section 3
and `docs/runner-operations.md` section 2).

> Correction 2026-10-29 (stabilization gate): this section used to add "or the
> orchestrator must delete the stale claim branch first." That option
> contradicted the no-deletion rule and was removed. The header's reference to
> a `phase2-runner-wiring` task, which has no record in `tasks/`, was also
> removed.

## 3. Adopt CLI: `scripts/pr-recovery.mjs`

```
node scripts/pr-recovery.mjs --branch <task-branch> [--expected-head <full-sha>]
```

It runs `gh pr list --head <branch> --state all --json url,state,headRefOid`
(`gh` from PATH). It never creates a PR.

**Output:** exactly one JSON line `{"url":...,"headSha":...,"anomaly":...}`
and exit 0 whenever `gh` succeeded; exit 1 with empty stdout (error on stderr,
prefixed `adopt failed:`) when `gh` or the arguments failed.

The four cases the worker must handle, in this order:

| # | Exit | stdout | Meaning | Worker action |
|---|---|---|---|---|
| 1 | 0 | `{"url":null,"headSha":null,"anomaly":null}` | No open PR (none, or only closed/merged ones) | **Create** the PR |
| 2 | 0 | `url` set, `anomaly` null | Exactly one open PR | **Adopt**: record that URL, do not create |
| 3 | 0 | `url` set, `anomaly` set | Several open PRs, or head mismatch vs `--expected-head` | **Surface** the anomaly to the orchestrator; do NOT create |
| 4 | 1 | empty | `gh` failed (auth, network, rate limit) | **Stop**; state is unknown; do NOT create |

Pass `--expected-head $(git rev-parse HEAD)` after pushing the task branch to
flag an open PR that points at a different commit (case 3).

Case 1 with a closed-only history is intentional: a fresh PR is created. If
that is surprising for a task, a human should look.

## 4. Preflight (step 0)

`node scripts/preflight.mjs` from the repo root; non-zero means stop (see
`docs/runner-preflight-wiring.md`). In the test fixture it is fully driven,
with no gap: it shells out to `sh -c 'command -v claude'`, `claude --version`,
`gh auth status`, and `git rev-parse` / `git remote get-url origin` /
`git ls-remote origin HEAD`, and reads `$HOME/.claude/.credentials.json` by
size only. The fixture supplies a stub `claude` (prints `2.1.312 (Claude
Code)`), a stub `gh` (`auth status` exit 0), a temp `HOME` with a non-empty
marker file, and a temp bare `origin`. The failure path (missing `claude`) is
also tested: npm is not on the fixture PATH, so the single reinstall attempt
fails safely and preflight exits 1 with no claim made.

What the fixture does NOT prove about preflight: real `claude`/`gh`/network
behaviour and token validity (an auth marker proves a past login only). Those
remain verified by orchestrator live runs, as stated in
`docs/runner-preflight-wiring.md`.

## 5. What the tests cover and what they do not

| Test file | Driven via |
|---|---|
| `scripts/claim-cli.test.mjs` | child process: `node scripts/claim.mjs` |
| `scripts/adopt-cli.test.mjs` | child process: `node scripts/pr-recovery.mjs`, stub `gh` on PATH |
| `scripts/runner-orchestration.test.mjs` | child processes for preflight, claim CLI, adopt CLI, real `scripts/reconcile.mjs` (scripts copied into the fixture checkout so its repo root is the fixture); stub `claude`/`gh` on PATH |

`scripts/runner-fixture.mjs` is the shared fixture. Its PATH holds only
symlinks to git, sh and node plus the two stubs, so the real `gh`, `claude`
and `npm` are unreachable.

Not proven by these tests:

- **Live GitHub.** `gh` is a stub; real output shape, auth and rate limits
  are untested. No live crash was reproduced.
- **The cron body itself.** The worker "shell" in the tests is test code that
  follows the order in section 1. Whether the rewritten cron text follows it
  is for the orchestrator's dry run (M5 acceptance 2).
- **True concurrency.** (b) is a sequential second claim after the first won.
  Simultaneous pushes are covered at library level by `scripts/claim.test.mjs`.
- **Who writes the task record.** The test worker writes the outcome record
  into the fixture checkout for convenience; in production that write is
  orchestrator-owned.
