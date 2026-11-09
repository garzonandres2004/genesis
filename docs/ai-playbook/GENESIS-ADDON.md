# Genesis add-on rules

These rules apply only inside Genesis. They sit on top of the private core (`garzonandres2004/ai-playbook`). When the core and this add-on disagree, the add-on wins for Genesis work.

## Runner

* One task per tick, one worker (F-34, `docs/atomic-claim.md`). Claim-first dispatch per `docs/runner-wiring.md`; the old manual startRun-push path is retired.
* Builders never edit task records and never open PRs or merge. The orchestrator owns records, PRs, and merges.
* Never push directly to main (branch protection rejects it and policy forbids it). All state changes live on task branches and land via pull request + green "test" check + the orchestrator's own verification.
* Never merge any PR unless its "test" check is green AND the tests were re-run and the diff read by the merger.
* A re-queued task retries on a NEW attempt-scoped branch (`<task-branch>-attempt-2`, flat, never nested). Never delete the stale claim branch; it stays as evidence.

## Same-commit rule and independent review

* Review happens on the exact commit (lesson 4 verifier template). A review on a different commit does not count.
* Builder and reviewer are different model families: Claude builds, Codex reviews, or the reverse. Author and tester are never the same.
* Builder reports are claims. Verify by re-running tests, reading the diff, and reading CI.

## SIE incidents

* Every failure or stale lesson becomes an SIE incident with evidence, per the Stage 3 design. Never edit a lesson quietly.
* The 8 known stale items are listed in this folder's `README.md`.

## Decisions and specs

* Decisions live in the Decision Register (`Genesis_Architecture_Reconciliation_and_Founder_Decision_Register_v1.2.1.md`). A chat thread is not a source of truth.
* Stage specs: Stage 1 (context, records, authority), Stage 2 (engineering workflow), Stage 3 (SIE + Milestone A). Stage 4 benchmark and Stage 5 (repeatability) follow the same quality loop.
* Do NOT modify benchmark criteria to get a PASS. Record insufficient evidence or FAIL as appropriate.

## Policy and capability references

* `docs/policy.md` (esp. section 3 hard gates and section 9 token scope) and `docs/capability-matrix.md` are the access authorities. Lesson 2's tool table is a snapshot; re-check before relying on it.
* Risk tiers (core lesson 10.3) are a proposal for the Founder to decide. They are NOT adopted. Until he decides, Genesis work uses today's full process.
* Genesis measurements (repo lines, review rounds) are the worked example in core lesson 10.1.

## Parallel work, reconciled

* Inside the Genesis runner: F-34 one-worker-per-tick still holds.
* Outside the runner: the Founder's Nov 9 authorization allows parallel independent builders (cap 3-4, each in its own worktree, one writer per file set). The core lesson 1 blanket wording does not reflect this yet (stale item 8).
