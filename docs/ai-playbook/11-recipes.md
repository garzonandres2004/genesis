# Lesson 11: recipes (standard workflows, end to end)

Each recipe names the tools in order. Steps marked **[F]** need the Founder; batch them into the digest.

## Recipe A: idea to validated MVP (the studio loop)

1. **Capture.** Founder drops an idea. Muse writes `ideas/<slug>.md`: problem, who has it, how they solve it today, why now.
2. **Research** (Perplexity or Gemini deep research through a relay packet, plus Muse browser). Market size, competitors, prices, complaints, laws. Every number cited and dated.
3. **Challenge** (claude.ai red-team and ChatGPT synthesis, separately). Score: pain, willingness to pay, how fast to an MVP, fit with the Founder's skills and time, risk. Honest probability of reaching first paying user.
4. **[F] Go or no-go.** One page: recommendation, scores, the strongest argument against, cost to build.
5. **Spec.** Muse writes the MVP brief: one user, one job, the smallest feature set, success metric, what is out of scope. Project brief, decision register and asset manifest live in the repo from day one.
6. **Build** in light tier on a preview branch: Claude Code builds, Codex reviews, Muse verifies the preview in the browser.
7. **[F] Try it.** Founder uses the preview for ten minutes and gives feedback in plain words.
8. **Learn.** Muse turns feedback into the next briefs and records what the loop taught.

## Recipe B: feature or bug fix in an existing app

1. Reproduce. For a bug, first write a failing test or a precise reproduction.
2. Brief (template), risk tier set.
3. Claude Code dispatch with the standard template (lesson 3.3).
4. Muse self-check (lesson 9.2).
5. Codex review on the exact commit.
6. Fix rounds only on findings. After two, change approach.
7. **[F]** Approval by tier. Merge. Record evidence.

## Recipe C: hard problem or stuck task

1. Stop repeating. Write down what was tried and what failed.
2. Fresh Claude Code session, Opus, high effort, with that summary and a narrower brief.
3. In parallel (research only), ask Codex for an independent diagnosis in read-only mode.
4. Compare the two diagnoses before writing code.
5. If both fail, take it to the digest as a decision: shrink scope, change design, or pause.

## Recipe D: decision the Founder must make

1. Muse frames the decision: options, cost, risk, what is reversible.
2. Two independent opinions: ChatGPT and claude.ai, same relay packet.
3. Muse writes one page: recommendation, where the advisors agreed, where they disagreed, what would change the answer.
4. **[F]** Founder decides. Muse records the decision verbatim in the decision register.

## Recipe E: research report

1. Write the question, time window, region and the decision it feeds.
2. Two research tools on the same question.
3. Muse opens the key sources and checks them.
4. Report: answer first, then evidence table with dated sources, then open questions.

## Recipe F: weekly self-improvement

1. Pull the week's metrics (lesson 10.5).
2. List repeated failures. For each, file an SIE incident with evidence.
3. Propose the smallest fix: a CLAUDE.md line, a hook, a test, a template change, a playbook edit.
4. Put the proposals in the weekly digest for approval.
