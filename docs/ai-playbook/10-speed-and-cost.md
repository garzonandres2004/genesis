# Lesson 10: speed, cost and the Founder's time

The scarcest resource in Genesis is not tokens. It is the Founder's attention: he works full time. Second is the shared usage limit on his subscriptions. Optimize in that order.

## 10.1 What the repo shows today (measured 2026-11-09)

| Measure | Value |
|---|---|
| Markdown in the repo | 14,790 lines |
| Of that, governance specs and reports in `docs/stage-*` | 12,180 lines |
| Runner and SIE code (non-test scripts) | about 5,000 lines |
| Test code | about 5,080 lines |
| Codex review rounds | up to 3 rounds on several Stage 3 tasks, each relayed by hand |
| Revenue products shipped through Genesis so far | none recorded in the repo |

Reading: Genesis currently produces about 2.4 lines of governance documents for every line of Runner and SIE code, and every review round passes through the Founder's hands. The safety thinking is good, and there is a lot of it. The fastest gains are in the hand-offs and in the paperwork, not in the models.

## 10.2 Ten ways Muse saves time

1. **Codex on the VM** (lesson 13). Removes the Founder as the copy and paste channel for every review round.
2. **One digest, twice a day at most.** Each decision comes with a recommended answer and a one line reason, so most are a "yes".
3. **Relay packets in a fixed format,** batched. One paste in, one paste back.
4. **Briefs that prevent fix rounds.** Every fix round costs a build, a review and a relay. A clearer acceptance criterion up front is the cheapest fix.
5. **Start on the smallest model that passes.** Escalate on evidence, and record which rung worked.
6. **Fresh sessions per task.** Long, polluted sessions cost more tokens and make more mistakes.
7. **Subagents for noisy reading.** Only the summary enters the main context.
8. **Short reports.** A builder report fits the JSON schema. Prose explanations go in the PR description only when a reviewer needs them.
9. **Reuse, do not rewrite.** A spec that repeats another spec should link to it.
10. **Batch merges.** Light-tier PRs that passed review can wait in a queue and be approved together.

## 10.3 Risk tiers (proposal for the Founder to decide)

Genesis applies close to the same heavy process to everything. A tiered system keeps safety where it matters and gives speed elsewhere. Muse may not adopt this itself; it is a decision package for the Founder.

| Tier | Applies to | Process |
|---|---|---|
| **Light** | Prototypes, preview branches, docs, internal tools with no real user data | Short brief, build, Muse self-check, one automated Codex review, Founder batch approves |
| **Standard** | Product features headed to real users, no money or sensitive data | Full brief, build, Muse self-check, Codex review, preview check, Founder approves the PR |
| **Heavy** | Money, credentials, production data, migrations, auth, Genesis core (Runner, SIE, policy) | Today's full process: spec, independent verification, same-commit rule, human review, Founder decision |

Suggested measure of success after 30 days: Founder minutes per merged light-tier PR under 5, and no increase in defects found after merge.

## 10.4 Usage limits and cost

* Claude Code (Max subscription) has session and weekly limits. Spread heavy work across the week and keep Opus for tasks that need it.
* `claude -p --output-format json` returns `total_cost_usd`, an estimate. Record it per task to see where usage goes. Use `--max-budget-usd` and `--max-turns` as hard caps on unattended runs.
* Codex allowances depend on the ChatGPT plan and the model. GPT-6.1 Terra covers more tasks per allowance than Sol or Astra.
* Never create paid resources or upgrade a plan without the Founder. Propose the cost and the payoff instead.

## 10.5 Metrics Muse keeps (weekly, in the digest)

| Metric | Why |
|---|---|
| First pass review rate | Measures brief quality |
| Average fix rounds per task | Measures waste |
| Founder minutes per merged PR (estimate) | Measures his load |
| Relay packets per week | Should fall once Codex is on the VM |
| Cost or usage per task, by model rung | Shows where to start next time |
| Defects found after merge | Guards against going too fast |
