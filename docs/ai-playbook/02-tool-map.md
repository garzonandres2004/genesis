# Lesson 2: the tool map and routing table

Verified 2026-11-09. Access status comes from `docs/capability-matrix.md` (2026-10-28) plus current vendor docs. Re-check before relying on it.

## Every tool in one table

| Tool | What it is best at | How Muse reaches it today | Main limits |
|---|---|---|---|
| **Muse** (you) | Coordination, memory, schedules, browser tasks, verification, digests | Native | One coordinator. Context compacts on long threads. Not an approver |
| **Claude Code** | Implementing, debugging, refactoring, tests, multi-file work, long agentic runs | Directly on the VM (`claude -p`, Max subscription) | Binary dies on VM restart, so reinstall first. Session and weekly usage limits |
| **Codex** (CLI / app) | Independent code review, adversarial review, a second builder, fast precise execution | Today: text relayed by the Founder. Possible: Codex CLI on the VM (needs Founder login, see lesson 13) | Plan usage limits. Not installed on the VM yet |
| **ChatGPT** | Strategy and planning threads, Work deliverables (docs, sheets, slides), deep research, image generation | Through the Founder (browser chat) | No API path set up for Muse. Newest models (GPT-6.1 Terra) sit in Work and Codex, not in regular Chat |
| **claude.ai chat** | Independent advice, critique, red-team of plans and decisions, writing in the Founder's voice | Through the Founder | Advisor only: no building, merging, production config or directing builders |
| **Perplexity Pro** | Fast cited web research, market and competitor facts | Founder's browser. Not established for Muse | Browser only, no API. Terms and limits not yet checked |
| **Gemini Pro** (app) | Long documents, video and images, Google Workspace context, deep research | Founder's browser. Not established for Muse | Browser only, no API. Terms not yet checked |
| **Gemini API** (free key) | Cheap high volume extraction and classification with Flash models | Key not installed on the VM yet | Free tier is Flash and Flash-Lite only. Free tier inputs may be used by Google to improve products and read by human reviewers. Never send sensitive data on the free tier |
| **GitHub** (`gh`) | Repos, branches, PRs, Actions, checks | Directly on the VM | Token scopes broader than needed (founder action queued) |
| **Vercel** | Preview and production deploys | Through GitHub workflows and the dashboard | No working local Vercel CLI. Production deploys need Founder approval |

## Routing table: who does what

| Task | Primary | Reviewer | Fallback |
|---|---|---|---|
| Implement a feature or fix | Claude Code (Sonnet) | Codex review | Codex as builder, then Claude reviews |
| Hard bug, two failed attempts | Claude Code (Opus, higher effort) with a fresh session | Codex adversarial review | Codex rescue on the same brief |
| Code review before merge | Codex `review` | Muse re-runs tests and reads the diff | Claude Code reviewer subagent with read-only tools |
| Architecture or design choice | Claude Code plan mode draft | Codex adversarial review plus claude.ai critique | ChatGPT second opinion |
| Product strategy, roadmap, priorities | ChatGPT (lead for Family Wealth OS) | claude.ai chat as challenger | Muse prepares options with evidence |
| Market, competitor, pricing research | Perplexity deep research | Muse checks sources open and say what was claimed | Gemini deep research, ChatGPT deep research |
| Validate a startup idea | Perplexity and Gemini research, then ChatGPT synthesis | claude.ai red-team | Muse browser research |
| Long PDF, statement, video, screenshots | Gemini (paid tier only for sensitive data) | Muse spot checks against the source | Claude Code reading the files |
| Docs, sheets, slides for people | ChatGPT Work | Founder | claude.ai artifacts types |
| Text the Founder sends as himself | claude.ai chat (has his voice skill) | Founder | ChatGPT |
| Browser chores, forms, monitoring | Muse browser | Sentinel approval | Founder |
| Bulk cheap extraction or tagging | Gemini Flash API (non-sensitive data only) | Muse samples 10 percent | Claude Code with Haiku |

## How to choose when the table does not cover it

Ask four questions in order:

1. **Does it touch money, credentials, production, real user data or Genesis core?** Then it is high risk. Use the heavy quality loop and ask the Founder.
2. **Is it code in a repo?** Claude Code builds, Codex reviews.
3. **Is it about the outside world?** A research tool with citations first, a reasoning model second.
4. **Is it a judgment call?** Get two model families to argue it, then give the Founder one recommendation and the strongest counter-argument.
