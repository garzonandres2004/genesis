# Interruption recovery proof (overnight-03)

Controlled interruption test: a worker was killed mid-run, and the next runner
tick's reconcile recovered the task. Facts below were read from `events.jsonl`
and `git log` on branch `overnight/interruption-test`.

## Killed run

- Task: `overnight-03`
- Killed run id: `overnight-03/run-1-2026-10-29T07:17:15.913Z`
- `events.jsonl` recorded `task_started` for it at `2026-10-29T07:17:15.913Z`
  ("controlled interruption test: this run will be killed mid-run"). No
  terminal event (completed/failed) was ever written for it.

## Recovery evidence

The next runner tick's reconcile (commit `1b92e5d`, "overnight-03: reconcile
interrupted run 1, re-queue") appended two events to `events.jsonl` at
`2026-10-29T07:47:28.415Z`, both for the killed run id:

- `run_interrupted` — detail: "open run with no terminal event found"
- `task_requeued` — detail: "re-queued after interruption (attempt 1 of 3 used)"

The task returned to `queued`, and the runner then started the retry.

## No partial commit from the killed run

The only commits between `origin/main` and the reconcile are:

1. `ef060c3` — orchestrator's run-1 record commit ("overnight-03: start run 1
   (orchestrator record)")
2. `1b92e5d` — the reconcile commit

Neither contains work product from the killed worker; they only touch
`events.jsonl` and `tasks/overnight-03.json`. No partial commit from the
killed run exists on this branch.

## Retry run

- Retry run id: `overnight-03/run-2-2026-10-29T07:47:44.833Z`
- Started by commit `fb492ee` ("overnight-03: start run 2 (retry after
  interruption recovery)"), `task_started` at `2026-10-29T07:47:44.833Z`.
- This document is the retry's deliverable.
