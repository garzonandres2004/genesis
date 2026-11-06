# T5 Builder Report — Seed records

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

**Seed records are historical evidence, never validated incidents.** No
seed record here has an incident status, a validation, or a lesson, and
none counts toward Milestone B. The drafts record what the retrieved text
says and nothing more.

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T5 — Seed records; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. This is the builder's own declaration. The T5 task brief named no model restriction |
| Starting commit | `374928e` (branch `stage-3/sie-milestone-a`; T4 fix round 2; PR #36 open, not merged). Working tree clean at start |
| Resulting commit | "Stage 3 T5: seed records for the ten corpus items plus the truncated-base-SHA candidate (AC-T5-1..AC-T5-3)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch, not from this report |
| Risk class | **Routine** (Brief §9 T5) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST |
| Specification | `docs/stage-3/00-sie-specification.md`, read at head (version 0.5-draft): §2 point 5, §3, §6.2, §11 LOC-1–LOC-4, §12 Section 5, §13 FXT-1/FXT-2 and the F-SHA row, §14.2 N-HIST |

## Scope

Brief §9 T5 only: one draft seed record per WP-04 v1.1 corpus item (10), a
draft record for the truncated-base-SHA item as an UNVERIFIED CANDIDATE
(the eleventh), a draft of INDEX Section 5, one small AC check test, and
this report. This is a document task. No existing file was changed.

## What was drafted

All under `docs/stage-3/seed/`, a **draft location only** (F-14 OPEN; see
open item 1). Each file is labeled DRAFT, and its header says that the
operational location is decided with F-14.

| File | seed_id | Corpus item |
|---|---|---|
| `SEED-01.md` | SEED-01 | "overnight-03 kill and recovery" |
| `SEED-02.md` | SEED-02 | "stale-checkout MODULE_NOT_FOUND" |
| `SEED-03.md` | SEED-03 | "wiring deletion contradiction" |
| `SEED-04.md` | SEED-04 | "policy §7 backoff claim" |
| `SEED-05.md` | SEED-05 | "policy §9 repo-plus-workflow staleness" |
| `SEED-06.md` | SEED-06 | "step-4 versus durable-doc crash-before-task_started disagreement" |
| `SEED-07.md` | SEED-07 | "race precision correction (24 versus 3)" |
| `SEED-08.md` | SEED-08 | "claim-commit identity cosmetic note" |
| `SEED-09.md` | SEED-09 | "thin event log" |
| `SEED-10.md` | SEED-10 | "test outputs not durably stored" |
| `SEED-SHA.md` | SEED-SHA | truncated-base-SHA item (prep §4.7), UNVERIFIED CANDIDATE (operator-class error); membership in the ten UNCONFIRMED |
| `INDEX-section-5-DRAFT.md` | — | Section 5 only (spec §12), 11 entries |

**Record shape (every seed record).** A field table: `seed_id`,
`corpus_item` (quoted from WP-04 v1.1), `status` = `historical observation`,
`validation` = `NOT VALIDATED; not independently validated`,
`incident record` = none (spec §6.2: a seed record is not an incident record
and has no incident lifecycle status), `lesson` = none, and
`Milestone B` = never counts. Then these sections: Provenance; Fix and
validation statement (AC-T5-2); What it shows; What it does not show; and
Permitted use, which quotes the WP-04 v1.1 seed-records rule verbatim (via
spec §2 point 5). SEED-SHA adds a `label`, a `classification` (none), a
membership field, a Hypotheses section, and a Fixture section.

**Provenance, as instructed.** Each record cites the WP-04 v1.1 quotation
via spec §2 point 5 (retrieval 2026-11-06). No [BASE] label is asserted for
any individual item, because the retrieval does not say which items carry
it. The reconstruction caveat is stated (spec §0.2). Date, source record,
and any detail beyond the quoted name are stated as "not in the retrieved
text".

**What it shows / does not show.** "What it shows" is limited to two
points: WP-04 lists the item, and what the item's name literally says.
Every further question the name raises (what, when, which, whether causal,
which figure corrected to which) is stated as not in the retrieved text.
For SEED-08, "cosmetic" is marked as WP-04's wording, not a judgment made
by the record.

**Generation note.** SEED-02 to SEED-10 were produced from SEED-01's text by
a one-off script outside the repo (`/tmp/t5gen/gen.mjs`, not committed). The
script substitutes only the id, the quoted corpus item name, and the
item-specific "What it shows" bullet. The new test checks each file's id,
corpus item, and required statements.

**INDEX Section 5 draft.** It follows the T4 `parseIndex` convention: a
single `## Section 5: Historical seed observations` heading, and entries
whose first two backticked tokens are the seed id and the record file. Each
entry carries the corpus item, `status: historical observation`, and the
spec §12 line "NOT VALIDATED — fixed is not validated; no retroactive
validation." It is not a full INDEX.md.

## Test added

`scripts/sie-seed.test.mjs` is dependency-free (`node:test`). It reads only
the files under `docs/stage-3/seed/` and imports `parseIndex`/`checkIndex`
from T4's `scripts/sie-schema.mjs`. It writes nothing. 37 tests:

- the directory holds exactly the 11 records and the INDEX draft;
- per record (×11):
  - DRAFT label and the F-14 header note;
  - `seed_id` matches the file;
  - `status` is exactly `historical observation`;
  - the corpus item is quoted exactly as in WP-04 v1.1, in order (SEED-01–10);
  - [BASE] is not asserted;
  - "not in the retrieved text" is present;
  - the WP-04 rule is quoted verbatim;
  - "What it shows" and "What it does not show" sections are present and non-empty;
- AC-T5-1 per record (×11): see below;
- AC-T5-2 per record (×11): the canonical sentence is present;
- AC-T5-3 on SEED-SHA: see below;
- the INDEX draft: all 11 ids and files in order, no stray entries, Section 5
  only, the status and NOT VALIDATED line on every entry, and the SEED-SHA
  entry labeled UNVERIFIED CANDIDATE with membership UNCONFIRMED. It is
  consistent under T4's `checkIndex` (no problems), with the 11 records as
  `kind: 'seed'`;
- a scan-honesty test showing that the negation scan flags affirmative forms
  and allows denials.

**Negations are handled honestly.** The scan flattens whitespace and removes
the verbatim WP-04 quotation, which is checked separately. Then **every**
occurrence of `validated`, `independently validated`, `runner-caused
failure`, or `confirmed failure` must be immediately preceded by `not` or
`never` (optionally followed by "a"/"an", "independently"/"retroactively",
or "confirmed"). A forbidden word inside a denial passes. Any other
occurrence fails. The test does not just look for the denial being present.

**Builder mutation check** (run on a temp copy at `/tmp/t5gen/mut`; the repo
files were not touched; script `/tmp/t5gen/mutate.mjs`, not committed). Each
of 9 single mutations made the suite fail:

1. `status` row set to `validated` (SEED-03);
2. "This observation was independently validated." appended (SEED-04);
3. the AC-T5-2 sentence removed (SEED-05);
4. the "What it does not show" heading renamed (SEED-06);
5. "On review it is a confirmed runner-caused failure." appended (SEED-SHA);
6. "It was classified as a runner defect." appended (SEED-SHA);
7. the independent-evidence sentence removed (SEED-SHA);
8. the SEED-09 INDEX entry removed;
9. the SEED-07 corpus item altered.

Result: 9/9 caught.

## Tests and results (builder-observed; re-run required by the verifier)

Run from the repo root on the uncommitted T5 tree just before committing.
The shared clone was clean apart from the T5 files, so no isolated worktree
was needed.

- `node --test scripts/sie-seed.test.mjs`: **37 tests, 37 pass, 0 fail,
  0 skipped.**
- `npm test` (`node --test scripts/*.test.mjs`): **233 tests, 232 pass,
  0 fail, 1 skipped.** The skip is the pre-existing one. 196 non-T5 + 37 T5.
- `node scripts/status.mjs`: **exit 0**. It prints "Genesis tasks: 15 total"
  (blocked 1, completed 14), unchanged.

## Per-AC evidence (claims — the verifier decides)

| AC | Builder claim | Check run and result |
|---|---|---|
| AC-T5-1 | **Met.** No seed record carries status `validated`. All 11 have `status` = `historical observation`. Every "independently validated" sits inside "not independently validated" | (1) Grep `status[^a-z]*[|:=]\s*`?validated` (case-insensitive) over `docs/stage-3/seed/`: **0 matches**. (2) Grep `.{0,12}independently validated` (case-insensitive, only-matching): **11 matches, one per record, each `…IDATED; not independently validated`** (the `validation` row). (3) Test: every `\bvalidated\b` outside the WP-04 quotation is immediately negated, in all 11 records and in the INDEX draft; `status` row equals `historical observation`; `validation` row equals `NOT VALIDATED; not independently validated` |
| AC-T5-2 | **Met.** All 11 records carry the identical canonical sentence "Already-merged fixes are fixed, not validated; no retroactive validation is claimed." Each also states that whether a fix exists or was merged is not in the retrieved text. The INDEX draft carries the spec §12 line on every entry | Grep, fixed string, over `docs/stage-3/seed/`: **11 files, 1 occurrence each**. The per-record AC-T5-2 test (×11) |
| AC-T5-3 | **Met.** SEED-SHA is labeled UNVERIFIED CANDIDATE (operator-class error) in its title, header, `label` row, and INDEX entry. Its membership in the ten is recorded as UNCONFIRMED. It states: "The operator-class-error hypothesis is separate from a runner-defect hypothesis." and "Independent evidence is required before any classification." `classification` is "None". Any fixture is described as SYNTHETIC-fixture-only and kept separate. The only F-SHA description cited is the spec §13 row; no F-SHA fixture file exists, and none is claimed. It is never presented as a confirmed runner-caused failure | Grep `runner-caused\|confirmed failure` in SEED-SHA: **2 lines**, "This record is never a confirmed failure and never a confirmed runner-caused failure." (l. 26) and "It is not a confirmed failure and not a confirmed runner-caused failure." (l. 89–90). Both are negations. Test: every occurrence of those phrases is negated; there is no `is/was/are/were (a) (confirmed) runner-caused failure/runner defect/operator-class error`; every "classified as" is preceded by "not". Glob `scripts/**/*SHA*`: no files |

Exit criterion (brief §9 T5): seed records exist for all ten corpus items
plus the truncated-base-SHA candidate, and the INDEX Section 5 draft is
complete (11 entries). **Claimed met, as drafts.**

## Open items

1. **F-14 OPEN — record location not decided.** `docs/stage-3/seed/` is a
   draft location. The illustrative LOC-2 layout
   (`records/projects/genesis/sie/seed/`) was **not** created. No path is
   presented as operational. No full INDEX.md was written. When F-14 is
   decided, the records move or are reconciled.
2. **Truncated-base-SHA membership: UNCONFIRMED (per the T5 brief) — and a
   DISCREPANCY to reconcile.** Spec 0.5-draft §2 point 5, §17 C-7, and §18
   T5 row say C-7 is **CLOSED**: the quoted list has exactly 10 items, none
   of them the SHA item, so the SHA item is an eleventh. The T5 brief
   instead says the retrieval does not confirm membership, and records it as
   UNCONFIRMED. The builder followed the T5 brief: SEED-SHA is drafted as a
   separate eleventh record, with membership UNCONFIRMED. SEED-SHA's
   provenance section names the discrepancy. **The builder did not decide
   C-7 and did not edit the spec.** For the coordinator and verifier to
   reconcile.
3. **Corpus detail beyond the quoted names is unknown.** No dates, sources,
   narratives, or fix references are in the retrieved text, and none were
   added. **Observation, not used:** `node scripts/status.mjs` lists task
   records whose names resemble some corpus items. Examples are
   `overnight-03` ("controlled interruption and recovery"), `m10-01` ("…
   policy backoff correction"), `m10-03` ("Reconcile overnight-test-plan
   staleness"), and `step4-durable-execution`. The seed records do **not**
   link to them, because the retrieval does not establish any link. Whether
   to attach such sources is an authorship/review question (SIE-04, OPEN).
4. **SIE-04 (seed-record authorship and review) stays OPEN.** The records
   are builder-drafted and labeled DRAFT and historical observation. They
   are not labeled verified.
5. **Builder convention the spec does not fix:** the field-table layout and
   section names of a seed record, and the `seed_id` values `SEED-01`…
   `SEED-10`, `SEED-SHA` (named in the T5 brief). T4 already reads
   `seed_id`.

## What is NOT claimed

- **No seed record is a validated incident, an incident record, or a
  lesson.** None counts toward Milestone B. None is validated
  retroactively. None is labeled independently validated.
- **No corpus item is shown to be a real failure, a runner defect, a fix,
  or a lesson.** The records state only that WP-04 lists the item and what
  its name says.
- **The truncated-base-SHA item is not a confirmed failure and not a
  confirmed runner-caused failure.** It is not classified as an
  operator-class error either: that label is a hypothesis.
- **No F-SHA fixture file exists, and none was created.** Existing fixtures
  were not modified.
- **Passing the T5 test proves only that the draft files carry the required
  labels and statements and lack the forbidden affirmative forms.** It
  verifies no corpus item.
- **No open finding or decision taken:** F-14 (location), C-7 (see open item
  2), F-36, F-10, F-16, F-21, F-34, DV-3/C-16, DV-7, DV-8, the DV-9
  threshold, R4-events (no event key invented), H5/SIE-02 (watch
  computations stay PROVISIONAL; T5 adds none), SIE-04, and the D2
  operational model are all unchanged.
- **No live loop** was started. The detector was not run against any live
  record. No incident or candidate record was created. Nothing was
  manufactured.

## Scope-compliance statement (D6 addition)

- **T5 only.** New files only: 11 seed records + the INDEX Section 5 draft
  under `docs/stage-3/seed/`, `scripts/sie-seed.test.mjs`, and this report.
  No existing file was modified. That includes the Specification,
  `scripts/sie-incident.mjs` and its test, `scripts/sie-schema.mjs`, the
  fixtures, `tasks/`, `events.jsonl`, CI, and the Runner scripts.
- **Concurrency.** `git status` at start was clean. Before commit it showed
  only the T5 files. No other builder's files were staged, stashed, or
  touched.
- **Not done:** no PR opened or closed, no PR comment, no merge, no deploy,
  no provisioning, no spending, no database, no production contact, no
  Runner/CI change, no new dependency, provider, server, or agent. No
  network calls apart from the instructed `git pull --rebase` and
  `git push`.
- **No secrets** in any file, log, or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Scope | Draft records + draft INDEX section + report; optional minimal AC test | 11 records, 1 INDEX draft, 1 test file, this report |
| Resource/cost | $0; no dependencies; local only | $0. Node built-ins only. Local, apart from `git pull`/`git push` |
| Model/tool | No restriction stated | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Deviations and escalations

- **No deviation from the brief.** The C-7 discrepancy (open item 2) is
  flagged, not resolved.
- **Permission prompts.** These were refused: a `cd && git …` line, a
  `wc` on the brief outside the repo, a shell heredoc that wrote a
  generator script, and a compound grep line. Each was replaced by a single
  command, the Read/Grep tools, or the Write tool. Nothing was worked around
  through another channel.

## Verdict rationale (builder's, not a verification verdict)

The builder submits T5 **for verification**. AC-T5-1 to AC-T5-3 are claimed
met on the draft files. The builder does not assign a verification outcome.

## Verification method (to be run by the coordinator/verifier)

1. `git diff --stat 374928e..<head>` should list only new files: the 12
   files under `docs/stage-3/seed/`, `scripts/sie-seed.test.mjs`, and
   `docs/stage-3/T5-builder-report.md`. `git diff --diff-filter=MD
   374928e..<head>` should be empty, unless rebased-in commits from other
   builders appear. In that case, restrict the diff to the T5 commit.
2. Re-run at that commit: `node --test scripts/sie-seed.test.mjs` (expect
   37/37); `npm test` (expect 0 fail, 1 pre-existing skip); and
   `node scripts/status.mjs` (exit 0).
3. Re-run the AC greps in the table above.
4. Read each record against spec §2 point 5. Check that no detail beyond
   the quoted name was added, and that "What it shows" says no more than the
   name.
5. Mutation spot-check, suggested: put `| status | validated |` in a record,
   or append an affirmative "is a confirmed runner-caused failure" line to
   SEED-SHA. Confirm the test fails.
6. Reconcile open item 2 (C-7 vs. the T5 brief). Judge open item 3 (whether
   task-record sources should ever be attached; SIE-04).
7. Record source hashes, an independence declaration (Stage 2 spec 05
   VI-9), and skipped checks separately from passed ones.

## Evidence-to-acceptance mapping

| AC | Evidence |
|---|---|
| AC-T5-1 | `status` and `validation` rows in all 11 records; the per-record AC-T5-1 tests (×11); the greps above |
| AC-T5-2 | the canonical sentence in all 11 records; the per-record AC-T5-2 tests (×11); the INDEX Section 5 line on all 11 entries |
| AC-T5-3 | `SEED-SHA.md` (label, classification, membership, Hypotheses, Fixture, What it does not show); the SEED-SHA AC-T5-3 test; the INDEX SEED-SHA entry |
| Exit (INDEX complete) | `INDEX-section-5-DRAFT.md`; the INDEX test, including `checkIndex` consistency |
