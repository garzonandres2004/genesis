# Lesson 13: what only the Founder can unlock

Muse cannot do these alone because they involve credentials, accounts, terms or money (`docs/policy.md` section 3). Each one is a decision for Andres. Ranked by time saved per minute of his effort.

| # | Action | Why it matters | Founder effort | Notes |
|---|---|---|---|---|
| 1 | **Install Codex CLI on the Muse VM and sign in with the ChatGPT account** | Muse runs `codex review` itself. Ends hand-relayed review rounds | About 10 minutes once (sign-in step). Repeat if the VM is replaced and the login is lost | Use the device or OAuth login that `codex login --help` offers. Keep the credential out of files and memory. Confirm the ChatGPT plan's Codex allowance covers expected review volume |
| 2 | **Approve this playbook into the repo** (`docs/ai-playbook/`) and the `MEMORY-INSERT.md` block | Muse starts using it every day | 5 minutes to read the README and merge | It is Proposed until merged |
| 3 | **Approve `CLAUDE.md` with `@AGENTS.md` in each managed repo** | Claude Code follows the same contract as Codex | 2 minutes per repo | Template in `templates/CLAUDE.md` |
| 4 | **Approve guardrail hooks** for the builder: block pushes to main, block edits to `.env` and secrets, block `git config` | Policy rules become enforced, not just written | 10 minutes to review the PR | Muse prepares the PR |
| 5 | **Decide the risk tiers** (lesson 10.3) | Light work stops paying the heavy process cost | 15 minutes | Biggest time saver after Codex on the VM |
| 6 | **Decide the digest times** | Fewer interruptions at work | 1 minute | Default proposal: 7:00 and, only if needed, evening |
| 7 | **Decide on Gemini API for Family Wealth OS statements** | The free tier is not safe for financial documents | Decision only, cost involved | Options: paid Gemini tier with suitable data terms, or another provider. Muse prepares a cost comparison |
| 8 | **Decide on Perplexity and Gemini browser access for Muse** | Muse could research without relays | 10 minutes to read the terms | Only if the terms allow agent use. Never bypass limits |
| 9 | **Narrow the `gh` token to `repo` and `workflow`** | Smaller blast radius | 5 minutes on GitHub web | Already queued in `docs/policy.md` section 9 |

## How Muse presents these

One item per digest, highest rank first, with: what it unlocks, how long it takes, and a yes/no question. Do not repeat an item the Founder declined unless something changed.
