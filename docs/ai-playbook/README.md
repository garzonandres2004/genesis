# Muse AI Playbook: start here

**Status:** Proposed (for review). Written for Muse by Claude (claude.ai chat, advisor role) at the Founder's request on 2026-11-09. Not Founder approved until the Founder says so.
**Goal:** make Muse the best operator of AI tools in Genesis. That means better results, higher quality, faster delivery, and less of the Founder's time used.
**Where it lives:** put this folder at `genesis/docs/ai-playbook/`, on a branch, through the normal PR flow. The Founder merges.

## How to study this pack

Do not load every lesson into context at once. Work the way a good skill system does:

1. Keep `MEMORY-INSERT.md` in `~/MEMORY.md`. It is short and holds the rules you need all the time.
2. Read the lesson a task needs, when the task needs it. Use the table below.
3. When a lesson turns out wrong or stale, record it as an SIE incident with evidence and propose a fix to the lesson. Never edit a lesson quietly.
4. Take the exam in `12-exam.md` once after first reading and again each month.

| When you are about to... | Read |
|---|---|
| plan your own day, memory, goals or subagents | `01-muse-self.md` |
| decide which tool gets a job | `02-tool-map.md` |
| dispatch or configure Claude Code | `03-claude-code.md` |
| get a review or a second builder from Codex | `04-codex.md` |
| ask ChatGPT for planning or Work output | `05-chatgpt.md` |
| ask claude.ai chat for advice or critique | `06-claude-chat.md` |
| do web research or use Gemini | `07-research-tools.md` |
| write a Task Brief or any prompt | `08-briefs-and-prompts.md` and `templates/` |
| verify, review, accept | `09-quality-loop.md` |
| save time, tokens or Founder minutes | `10-speed-and-cost.md` |
| run a standard workflow end to end | `11-recipes.md` |
| test yourself | `12-exam.md` |
| find what only the Founder can unlock | `13-founder-actions.md` |

## The 12 rules (the short version of everything)

1. **Right tool, right job.** Route by task type using the table in `02-tool-map.md`, not by habit.
2. **The repo is the memory.** Anything that matters lives in a file in git. A chat thread is not storage. (WP-04 living only in a ChatGPT chat is the example of what not to do.)
3. **Briefs beat prompts.** Every dispatch has a goal, pointers to context, constraints, acceptance criteria, the exact verify command, and a stop condition.
4. **Builder never grades itself.** Review comes from a different model family than the builder: Claude builds, Codex reviews, or the reverse.
5. **Evidence over claims.** Run the tests yourself, read the diff, read CI. Reports are claims.
6. **Context is the scarce resource.** Send each tool only what it needs. Use subagents and fresh sessions for noisy work.
7. **Smallest model that passes.** Start cheap and fast, move up only when the task proves it needs more.
8. **Guardrails go in code, not in words.** Anything that must hold every time becomes a hook, a test, a permission rule or a CI check.
9. **Batch the Founder.** He works full time. Collect approvals and questions into one digest at set times, with a recommended answer for each.
10. **Make relays cheap.** When a tool can only be reached through the Founder (ChatGPT chat, claude.ai), hand him one ready to paste file and ask for an answer in a fixed format.
11. **Ceremony matches risk.** Heavy process for money, data, credentials, production and Genesis core. Light process for preview branches and prototypes. The Founder sets the tiers.
12. **Measure and improve.** Track first pass review rate, rework rounds, Founder minutes per merged PR and cost per task. Turn repeated failures into lessons.

## Facts in this pack go stale

Tool features change monthly. Every lesson marks facts as "verified 2026-11-09". Before relying on a flag, model name or limit, run the tool's `--help` or read its current docs, and update the lesson if it changed.
