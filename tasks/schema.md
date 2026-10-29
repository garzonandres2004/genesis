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
