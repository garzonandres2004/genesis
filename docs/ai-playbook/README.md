# Muse AI Playbook: Genesis add-on

**Status:** Adopted 2026-11-09 by Founder ruling. Supersedes PR #39, which carried the full pack into this public repo and was closed without merging.
**What this folder is:** only the Genesis-specific rules for the Muse AI Playbook. The general core (13 lessons, templates, exam) lives in the PRIVATE repo `garzonandres2004/ai-playbook`. Nothing of the pack's substance, and none of the Founder's formatting preferences, is in this public repo.
**How to use it:** read the core lesson first, then `GENESIS-ADDON.md` in this folder for the rules that apply only inside Genesis.

## Known stale items in the core (flagged, not silently fixed)

Checked 2026-11-09 before the split. The core lessons stay as written; fix in a follow-up, with an SIE incident and evidence each:

1. Family Wealth OS lead is stale in three places: core `MEMORY-INSERT.md` routing line, lesson 2 routing table, lesson 5.1 all say ChatGPT leads planning for Family Wealth OS. Current state: Claude is interim product lead since Nov 5; GPT advises on decision gates. Muse's own memory uses the corrected line.
2. Lesson 2 says Codex is 'Not installed on the VM yet'. Wrong: codex-cli 0.164.0-alpha.9 is installed and used for text-supplied reviews.
3. Model names GPT-6.1 Terra / Sol / Astra (lessons 2, 4.4, 5.2, 10.4) are unverified and conflict with the Nov 9 verified research, which found Codex review on GPT-5.4. Do not trust a model name from the pack without checking --help or docs first.
4. Lesson 3.3 lists --max-turns N. That flag does not appear in claude --help on the installed 2.1.312. Unverified.
5. Lesson 8.1 cites docs/decisions.md D-12 as an example. That file does not exist on Genesis main; decisions live in the Register file.
6. Lesson 2 says 'No working local Vercel CLI'. Partly stale: the Vercel connector CLI wrapper and MCP are in use for deploys.
7. Lesson 13 item 1 (install Codex CLI on the VM) is already done; only the sign-in state is unconfirmed.
8. Lesson 1 one-worker rule vs the Founder's Nov 9 multi-AI rules: parallel independent builders are allowed outside the Genesis runner (cap 3-4, own worktrees). The pack's blanket wording needs reconciling for non-runner work. Inside the Genesis runner, F-34 one-worker-per-tick still holds.

Note on core lesson 13 item 2: "approve this playbook into docs/ai-playbook/" now means approving this add-on. The core itself lives in the private repo and was adopted by the same Founder ruling.
