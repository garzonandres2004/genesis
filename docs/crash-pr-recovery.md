# Crash-after-PR recovery

## The crash window

A worker runs `gh pr create`, which succeeds and returns a PR URL. The worker
then must record that URL in the task record and commit it. If the worker dies
between those two steps, the PR exists on GitHub but its URL exists nowhere in
the repo. The task record still says "no PR".

## Why adoption, not re-creation

A retry that trusts the task record sees no PR and runs `gh pr create` again.
The branch already has an open PR, so this either errors or yields a duplicate
PR for the same work. The truth lives on GitHub, so the retry must ask GitHub
first and adopt what it finds.

## How the fix works

`adoptPr({ branch, expectedHeadSha?, ghRunner })` in `scripts/pr-recovery.mjs`:

- lists PRs for the branch through the injected `ghRunner` (`gh pr list --head
  <branch> --state all --json url,state,headRefOid`);
- reuses `findExistingPr` from `scripts/pr-adopt.mjs` for parsing: only OPEN PRs
  count, CLOSED and MERGED are ignored;
- returns `null` when there is no open PR (the caller may create fresh);
- otherwise returns `{ url, headSha, anomaly }`. `anomaly` is a string for
  several open PRs (first is adopted, same as pr-adopt), malformed gh output
  (`url` is null), or an open PR whose head differs from `expectedHeadSha`.
  A non-null anomaly means the caller must surface it, not silently adopt or
  create.

It never creates a PR. This closes the window together with the existing runner
rule "check for an existing PR first".

## What this fixture does not prove

`scripts/pr-recovery.test.mjs` proves the logic against a stubbed `gh` (every
create/list call recorded, canned JSON, PATH emptied so a real `gh` cannot
run). It does not reproduce a real GitHub crash-after-create. The live path was
only partially proven earlier, when pr-adopt found an existing PR on a real
branch. The real `gh pr list` JSON shape (including `headRefOid`) is assumed
from gh's documented fields, not exercised here.

## Runner usage

Before any `gh pr create`: call `adoptPr`. If it returns non-null with no
anomaly, adopt the URL (record it in the task record) and skip creation. If it
returns an anomaly, report it. Create a PR only when it returns `null`. The
schedule is not edited by this change; wiring this into the runner is a
separate step owned by the orchestrator.
