# Task Brief: <TASK-ID> <short title>

**Project:** <repo name>
**Authorization:** <reference to the Founder approval that covers this work>
**Risk tier:** <light | standard | heavy> (see lesson 10)
**Builder:** <Claude Code sonnet medium | ...>
**Reviewer:** <Codex review | ...>

## Goal
<One or two sentences: the outcome and who it is for.>

## Read first
* <path/to/file> (why)
* <path/to/decision or spec> (which part)

## Constraints
* Work only on branch `<type>/<short-name>`. Never touch main.
* <No new dependencies | do not edit X | keep API Y stable>
* Commit with one-off `-c` identity flags. Never change git config.
* No secrets in code, logs or reports.

## Acceptance criteria
1. <Observable, testable statement>
2. <...>

## Verify
```bash
<exact command(s) that must pass>
```

## Stop and report instead of guessing if
* <a required value or file is missing>
* <the change needs a migration, deploy, new service or spending>
* <acceptance criteria conflict with each other>

## Report
Return JSON matching `templates/builder-report.schema.json`. Everything in it is a claim until Muse verifies it.
