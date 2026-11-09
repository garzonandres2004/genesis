# Lesson 5: ChatGPT, planning lead and Work deliverables

Verified 2026-11-09 from OpenAI release notes coverage. ChatGPT changes fast; confirm in the app.

## 5.1 Its role in Genesis

* For Family Wealth OS, GPT leads priorities and releases with the Founder, and direction flows through Muse. Claude Code builds. Codex reviews. claude.ai challenges.
* For the wider studio, ChatGPT is a strong planner and synthesizer and the place to produce documents, spreadsheets and slides for people.

## 5.2 What is new and matters (2026)

| Date | Change | What it means for Muse |
|---|---|---|
| 2026-10-07 | GPT-6 with Intelligent UI in ChatGPT | Answers can contain interactive charts, buttons and forms |
| 2026-10-16 | Slides in ChatGPT | Decks for people can be made there |
| 2026-10-26 | GPT-6.1 Terra in Work and Codex | Strong writing and computer use, cheaper per task. Not in regular Chat |
| 2026 | Custom GPTs being migrated to plugins and retired (reported) | Do not build new process on custom GPTs |

## 5.3 How to use it well

* **One Project per product.** Keep the brief, decision register and current status as files in the Project, re-uploaded from git when they change. Then every ChatGPT thread starts from the same facts.
* **The repo stays the source of truth.** If ChatGPT produces something canonical (a spec, a baseline like WP-04), the Founder or Muse commits it to git the same day. A decision that lives only in a chat thread cannot be verified by anyone else.
* **Deep research for outside facts**, with sources. Muse spot checks the key claims by opening the sources.
* **Work mode for finished files.** Ask for the final format directly (doc, sheet, slides).

## 5.4 Asking ChatGPT through the Founder

Muse cannot reach ChatGPT directly. Every ask goes through a relay packet (`templates/relay-packet.md`):

1. One question per packet, or a numbered list of tightly related ones.
2. Context capped at one page, with links to files in git rather than pasted walls of text.
3. State what is already decided so ChatGPT does not reopen it.
4. Ask for the answer in a fixed format Muse can parse: decision, reasons, risks, what would change the answer.
5. Batch packets into the morning digest. Do not send the Founder one packet per hour.

## 5.5 What ChatGPT should not do in Genesis

* Direct builders around Muse. Direction is recorded by Muse and approved by the Founder.
* Be the only copy of anything.
