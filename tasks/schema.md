# Task Record Schema

One JSON file per task in `tasks/`, named `<task-id>.json`. The orchestrator
owns these files; builders never edit them directly. Status is computed from
the records by `scripts/status.mjs`.

```json
{
  "id": "demo-end-to-end-001",
  "title": "Short title",
  "objective": "What done looks like, in one paragraph.",
  "project": "genesis",
  "repo": "garzonandres2004/genesis",
  "status": "queued",
  "role": "implementation",
  "branch": "demo/inventory-refresh",
  "acceptance": [
    "Verifiable, checkable criterion 1",
    "Verifiable, checkable criterion 2"
  ],
  "evidence": [],
  "blockers": [],
  "created": "2026-10-28",
  "updated": "2026-10-28"
}
```

## Field rules

- `status`: `queued` | `in_progress` | `blocked` | `completed`.
  Never `completed` without evidence in `evidence`.
- `role`: `implementation` | `research` | `architecture` | `review` |
  `qa` | `security` | `release` | `orchestration`.
- `acceptance`: each item must be checkable by a command, a test, a PR
  check, or a live URL — never "works well" or "looks good".
- `evidence`: commands run, test results, PR URLs, deployment URLs, file
  paths. A task with empty evidence is not done, whatever anyone reported.
- `blockers`: each names what is needed and who can unblock it. A blocked
  task never blocks unrelated tasks.
- No secrets in any field. Ever.

## Durable execution fields

Added by the durable-execution work (see `docs/durable-execution.md`). All
are optional on older records and default to `0` / `[]`.

```json
{
  "attempts": 1,
  "runs": [
    { "id": "<task-id>/run-1-<iso-time>", "started_at": "<iso-time>", "outcome": null }
  ],
  "idempotency_keys": ["open-pr:feature-branch"]
}
```

- `attempts`: number of runs started. Maximum 3 (`MAX_ATTEMPTS`); when an
  interrupted task has used all 3, it is blocked instead of re-queued.
- `runs`: one entry per attempt. `outcome` is `null` while the run is open,
  then `completed` | `failed` | `interrupted`.
- `idempotency_keys`: keys of side effects (PR opened, comment posted, ...)
  already performed. A side effect whose key is present must not be repeated;
  return the existing result instead.

## State transitions

| From          | To            | Condition                                           |
|---------------|---------------|-----------------------------------------------------|
| `queued`      | `in_progress` | a run starts                                        |
| `in_progress` | `completed`   | acceptance verified, evidence recorded              |
| `in_progress` | `blocked`     | blocker named, or retry budget exhausted            |
| `in_progress` | `queued`      | reconciliation only (`{ reconciliation: true }`)    |
| `blocked`     | `queued`      | orchestrator unblocks                               |
| `blocked`     | `in_progress` | orchestrator resumes                                |
| `completed`   | (none)        | terminal                                            |

Any other transition is illegal and throws.

## Event types

Appended (never rewritten) to `events.jsonl` at the repo root, one JSON object
per line with `type`, `task_id`, `run_id`, `timestamp`, `detail`:

- `task_started`, `task_completed`, `task_failed`, `task_blocked`: run lifecycle.
- `run_interrupted`: reconciler found an open run with no terminal event.
- `task_requeued`: interrupted task returned to `queued` (attempts < 3).
- `retry_exhausted`: interrupted task blocked because attempts reached 3.

## Who writes task records

Builders never edit task records. Only the orchestrator and the reconciler
(`scripts/reconcile.mjs`) write files in `tasks/`. Builders report results;
the orchestrator records them.
