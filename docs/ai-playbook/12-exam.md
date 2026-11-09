# Lesson 12: the exam

Answer each question in writing, without looking, then check against the key. Record your score in the digest. Retake monthly and after any lesson changes. Pass mark: 14 of 16, and every question marked (critical) correct.

## Questions

1. A builder report says "all tests pass". What do you do before calling the task verified?
2. (critical) Who reviews a change Claude Code built, and why that tool?
3. A feature failed review twice with the same finding. What do you do on the third attempt?
4. Which file holds rules that both Codex and Claude Code must follow, and how does Claude Code pick it up?
5. (critical) The Founder asks you to use the free Gemini API key to read family bank statements. What do you answer?
6. You need a fixed JSON report from a headless Claude Code run. Which two flags?
7. An unattended Claude Code run must never wait for a human. Which flag, and what happens to actions that would prompt?
8. A rule says "never edit .env". Where should it live so it holds every time?
9. You have five questions for ChatGPT today. How do you send them?
10. (critical) ChatGPT produced the final version of a spec in a chat thread. What must happen to it?
11. When is it right to switch from Sonnet to Opus?
12. Name three things you check yourself in every diff.
13. A research summary says a competitor charges $49 a month. What do you do before putting that in a decision page?
14. (critical) You think the light risk tier would save the Founder hours. Can you start using it?
15. Your main thread is full of logs from a long investigation. What should you have done?
16. Which metric best tells you whether your briefs are good?

## Answer key

1. Re-run the verify command yourself in a clean worktree, read the full diff, check CI, and confirm each acceptance criterion has evidence. The report is a claim.
2. Codex. It is a different model family, so it does not share Claude's blind spots. That is what makes the review independent.
3. Change something: fresh session, bigger model or more effort, smaller task, or a different builder (Codex rescue). Do not repeat the same request.
4. `AGENTS.md`. Claude Code loads `CLAUDE.md`, which imports it with `@AGENTS.md`.
5. No on the free tier: its inputs may be used to improve Google's products and read by human reviewers. Propose a paid tier or another provider with suitable data terms, with the cost, as a Founder decision.
6. `--output-format json` and `--json-schema '<schema>'`. Read `structured_output` and check it exists.
7. `--permission-prompts none`. Anything that would need a human is denied, Claude is told not to retry, and the run continues.
8. In a `PreToolUse` hook (and a CI check). Text in `CLAUDE.md` is a request, not enforcement.
9. One batched set of relay packets in the morning digest, each with a fixed answer format.
10. It gets committed to git the same day and referenced from the decision register. A chat thread is not a source of truth.
11. After a recorded failure on Sonnet (even at higher effort), or from the start for architecture, security sensitive or very hard work. Record the rung that worked.
12. Any three of: only expected files changed, verify command passes when you run it, tests cover changed behavior, no secrets, correct branch and base, preview works for UI changes.
13. Open the source, confirm the number and the date, prefer the vendor's own pricing page, and write the date next to the fact.
14. No. Muse is not an approver. Prepare the decision package with the expected savings and risks and let the Founder decide.
15. Run the investigation in a subagent so only the summary came back, or start a fresh session with a short summary.
16. First pass review rate (supported by average fix rounds per task).
