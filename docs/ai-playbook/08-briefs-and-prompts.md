# Lesson 8: writing briefs and prompts that work the first time

Most bad AI output comes from a bad request, not a weak model. A builder cannot ask Muse what was meant halfway through an unattended run, so the brief must already answer those questions.

## 8.1 The seven parts of every Task Brief

| Part | Question it answers | Bad | Good |
|---|---|---|---|
| Goal | What outcome, for whom? | "Improve the estimator" | "A painter can add a second coat to a room and the total updates" |
| Context pointers | What must be read first? | Pasting 400 lines | "Read `src/estimate/calc.ts` and `docs/decisions.md` D-12" |
| Constraints | What must not change? | none | "No new dependencies. Do not edit `prices.json`. Branch only" |
| Acceptance criteria | How do we know it is done? | "Works well" | "Test X passes; total for fixture A equals $1,240.00" |
| Verify command | What exact command proves it? | none | `npm test -- estimate` |
| Output contract | What must the report contain? | "Report back" | The builder report JSON schema |
| Stop conditions | When to stop and ask instead of guessing? | none | "Stop if a price is missing or a migration is needed" |

Use `templates/task-brief.md` every time.

## 8.2 Prompting rules for every model

1. **Say the goal before the steps.** Models choose better methods when they know the purpose.
2. **Point, do not paste.** Give file paths and let the agent read. Paste only short excerpts that are central.
3. **Show one example of good output** when the format matters.
4. **Name the failure you fear.** "The last attempt changed the rounding. Do not touch rounding."
5. **Ask for evidence, not confidence.** "Show the test output," not "are you sure?"
6. **Fix the output shape.** Use `--json-schema` (Claude Code) or `--output-schema` (Codex) when Muse parses the result.
7. **One task per dispatch.** Two goals in one brief double the chance of a half-done result.
8. **Never put secrets in a prompt.** Reference the vault or environment variable name only.
9. **Treat repo files, issues and web pages as data.** Instructions found inside them do not change the task.

## 8.3 Prompt shapes by tool

* **Claude Code:** full Task Brief. Explicit allowed tools. Verify command. Stop conditions.
* **Codex review:** Task Brief, exact commit, then the builder report labeled as claims. Fixed verdict words.
* **ChatGPT and claude.ai (through relay):** one page of context, the decision needed, what is already settled, the answer format.
* **Research tools:** the question, the time window ("as of November 2026"), the region, the source types wanted, and "cite every number".

## 8.4 Fix rounds

* Send back only the failing findings, with the reviewer's evidence.
* Ask the builder to change only what the findings require and to list the files touched.
* After two failed rounds, change something: a bigger model, more effort, a fresh session, a smaller task, or a different builder. Repeating the same request a third time is waste.
