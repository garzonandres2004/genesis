# Lesson 9: the quality loop

Quality comes from a loop that catches mistakes before the Founder sees them, not from one perfect run.

## 9.1 The loop

| Step | Who | What counts as done |
|---|---|---|
| 1. Brief | Muse | All seven parts present (lesson 8) |
| 2. Build | Claude Code (or Codex) | Branch pushed, report returned |
| 3. Self-check | Muse | Re-run the verify command in a clean worktree; read the full diff; confirm no secrets; CI green |
| 4. Independent review | Other model family | Verdict on the exact commit (same-commit rule) |
| 5. Fix rounds | Builder | Only the findings change; a new review session confirms |
| 6. Human review | Founder, by risk tier | Approve, or send back with a reason |
| 7. Merge and record | Founder merges; Muse records | Evidence links in the task record; lessons filed if anything went wrong |

## 9.2 What Muse checks itself, every time

1. `git status` clean, branch is the one in the brief, base is current main.
2. Diff touches only files the task needed. Unexpected files are a finding.
3. Verify command passes when Muse runs it, not only when the builder says so.
4. Tests exist for every changed behavior, or the report says plainly why not.
5. No secret patterns in the diff (keys, tokens, `.env`).
6. For UI changes, the preview deployment loads and the changed screen works. Use the browser and take a screenshot as evidence.

## 9.3 Cross-model review is the core trick

* A model reviewing its own family's work misses the same things. Claude builds, Codex reviews. When Codex builds, Claude reviews.
* For high-risk changes use adversarial review: ask the reviewer to assume a defect exists and find it, focused on the named risk (auth, money math, data loss, race conditions).
* For plans and decisions, ask ChatGPT and claude.ai separately, then show the Founder where they agree and where they disagree.

## 9.4 Common failure patterns to watch for

| Pattern | Sign | Response |
|---|---|---|
| Test theater | Tests pass but assert nothing about the requirement | Reviewer must map each criterion to a test |
| Scope creep | Diff edits unrelated files "while I was there" | Reject; re-dispatch with a tighter brief |
| Silent fallback | Code catches an error and continues with a default | Treat as a defect unless the brief allows it |
| Confident report, failing run | Report says pass; Muse's run fails | Record an SIE incident; raise model or effort next time |
| Looping fixes | Same finding returns after two rounds | Change approach (lesson 8.4) |
| Stale context | Builder follows an old decision | Fix the brief and the source doc, not just the code |

## 9.5 Turn failures into lessons

When the same failure happens twice, write it down where it will prevent the third time:

* A rule the builder keeps breaking goes in `AGENTS.md` or `CLAUDE.md`.
* A rule that must never break becomes a hook, a test or a CI check.
* A routing or prompting lesson goes into this playbook through a PR.
* Every change is backed by an SIE incident with evidence, per the Stage 3 design.
