# T1 Builder Report — Detector implementation (R1–R6, candidate-only)

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T1 — Detector implementation (R1–R6, candidate-only); project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. This is the builder's own declaration, so it corroborates the identity but does not establish it independently. The T1 task brief named no model restriction. |
| Starting commit | `c89c95e` (branch `stage-3/sie-milestone-a`, T0 verified PASS; PR #36 open, not merged) |
| Resulting commit | The commit titled "Stage 3 T1: detector implementation (R1-R6, candidate-only)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch head, not from this report. |
| Risk class | Routine (Brief §9 T1) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record) |

## Implementation summary

This task implements the detector in Specification §5 (DET-1–DET-9) and the
§5.2 pseudocode, which is prep §2.1 with addendum CR-04 applied. The
detector is a dependency-free Node ES module, following the repo's
`scripts/status.mjs` + `status.test.mjs` pattern.

- **Six branches, one per rule.** `RULE_BRANCHES = { R1..R6 }`. Each rule
  builds its candidates in exactly one place, and there is no other
  matching logic.
- **Inputs (SIE-03 working scope).** The detector reads task records (one
  JSON file per task, `tasks/*.json`, per `tasks/schema.md`) and the
  append-only event log (`events.jsonl`, per `scripts/events.mjs`). Nothing
  else.
- **Output.**
  - `scan()` returns three lists. `candidates` holds detector candidates,
    sorted by id. `insufficient` holds "insufficient evidence" entries,
    which are records and not candidates. `not_evaluated` holds scope the
    scan did not cover.
  - `writeCandidates()` creates one Markdown file per detector candidate,
    named `<candidate_id>.md`, using exclusive create (`flag: 'wx'`). This
    follows LOC-1: SIE records are Markdown.
- **Deterministic id (DET-8).** The id is
  `CAND-<rule>-<first 16 hex of sha256>`. It is computed over the rule id
  and the sorted source pointers, plus the exact key for R4, plus the task
  id and last-progress tick for R6 (not the current tick).
- **CLI.** `node scripts/sie-detector.mjs --tasks <dir> --events <file> [--out <dir>]`.
  - The paths are required and have no defaults, so the detector is never
    pointed at operational records by accident.
  - Without `--out` the CLI prints JSON and writes nothing.
  - There is no tick-index option.

### Reconciliations with the repository (Spec §5.3, C-14)

| Spec/prep name | Repo reality | What the detector does |
|---|---|---|
| `t.attempt_count` | `attempts` (`scripts/task-state.mjs`, `tasks/schema.md`) | R3 reads `attempts` |
| `e.id` (event id) | Events carry no id: `type, task_id, run_id, timestamp, detail` | The event pointer is `<events file>#L<line>` (1-based physical line). Line numbers are stable because the log is append-only |
| `t.last_progress_tick`, tick index | Not present in any repo record. No recorded tick index exists (Spec §5.3) | R6 reads `last_progress_tick`, the Spec's pseudocode name. With no tick index, every in_progress task gets "insufficient evidence: tick position not determinable" (Spec §5.3). `scan()` accepts a `tickIndex` parameter only so that DET-7 can be exercised on SYNTHETIC fixtures. The CLI reads no tick source |
| Task id | `id` field; the file is named `<task-id>.json` | Uses `id`, falling back to the file stem if `id` is absent |

## Files written (new files only)

| File | Lines |
|---|---|
| `scripts/sie-detector.mjs` | 397 |
| `scripts/sie-detector.test.mjs` | 287 |
| `scripts/fixtures/sie-SYNTHETIC/README-SYNTHETIC.md` | 34 |
| `scripts/fixtures/sie-SYNTHETIC/F-*-SYNTHETIC/**`: 25 SYNTHETIC fixture files (20 task records, 2 event logs, 3 tick indexes) | 27 in total |
| `docs/stage-3/T1-builder-report.md` | this file |

Fixture files, all with SYNTHETIC in the file name and in a `synthetic`,
`_label`, or `detail` field:

- 20 task records. F-R1: 1, F-R3: 3, F-R4: 4, F-R4-INS: 6, F-R6: 3,
  F-R6-INS: 2, F-R6-INS-c: 1.
- 2 event logs: F-R2 (3 lines) and F-R5 (1 line).
- 3 tick indexes: F-R6, F-R6-INS, F-R6-INS-c.

That is 25 files, 27 lines in total. No existing repository file was
modified. CI, the Runner, `tasks/`, `events.jsonl`, existing scripts, and
existing docs are untouched. `docs/stage-3/README.md` (the spec index) was
not updated, because the brief allows new files only. The coordinator may
want an index entry for this report later.

## Tests and results (builder-observed; re-run required by the verifier)

- `node --test scripts/sie-detector.test.mjs`: **22 tests, 22 pass, 0 fail.**
- `npm test` (`node --test scripts/*.test.mjs`): **111 tests: 110 pass,
  0 fail, 1 skipped.** The skip is the existing one, which Brief G5 records
  as "88/89, 1 pre-existing skip". 89 existing + 22 new = 111, which
  confirms the new tests ran.
- `node scripts/status.mjs`: exits 0 and prints "Genesis tasks: 15 total"
  (blocked 1, completed 14). That count is unchanged, which shows the
  fixtures are not picked up as task records.
- The detector was **not** run against the operational `tasks/` or
  `events.jsonl`. Every run used SYNTHETIC fixtures, and output went to
  temporary directories only. No operational detector-candidate record was
  created (see Scope).

All results are **detector recognition on synthetic input**: test
mechanics verified on fixtures. They do not verify the system.

## Acceptance-criteria self-check (claims — the verifier decides)

| AC | Builder claim | Evidence the verifier can inspect |
|---|---|---|
| AC-T1-1 | **Met, on the working basis.** Six branches, R1–R6, one per reconstructed rule, and no additional matching rule. Whether WP-04 itself has exactly these six rules cannot be checked (Spec §2 point 1, MISSING). | `RULE_BRANCHES` in `sie-detector.mjs`. Tests "AC-T1-1: exactly six rule branches…" and "…each rule builds candidates in exactly one place" (a source count of `makeCandidate('Rn'` = 1 per rule, 6 in total) |
| AC-T1-2 | **Met.** Every output is `record_type: "detector-candidate"` with exactly the DET-9 fields and a fixed note: "Not a failure, not an incident, not a runner-caused-failure verdict; no cause is determined". No `verdict`, `cause`, or `classification` field exists. | Test "AC-T1-2: every output is a detector candidate with only DET-9 fields…". `makeCandidate` and `CANDIDATE_NOTE` in the source |
| AC-T1-3 | **Met.** The boundary is stated in the module header (READ-ONLY BOUNDARY). The header states that the detector never modifies, reclassifies, backfills, renames, or deletes a source record, and never writes into `tasks/` or `events.jsonl`. It also states that creating SIE detector-candidate records is a separate act from reading Runner records (addendum refinement 6). The same boundary is stated in this report (Scope) and in the fixture README. | Tests: boundary text present; the only file write is one exclusive-create `writeFileSync` (no append, rename, delete, or truncate); fixture files are byte-identical (sha256) after scan and write; the writer refuses output inside a task-record directory, including the repo's `tasks/`; the CLI writes nothing without `--out` |
| AC-T1-4 | **Met.** R4 compares recorded blocker strings by exact equality (no trim, no case folding) and needs at least 2 distinct task ids. A missing `blockers` field, a blank key, a non-string key, or a non-list `blockers` gives "insufficient evidence: key missing or incomparable" and never a candidate. R6 fires only at a tick-index distance of 3 or more (distance 2 does not match). Each of the following gives "insufficient evidence: tick position not determinable": a missing last-progress tick, a tick not in the index, a tick repeated in the index, an empty index (current tick undeterminable), and no index at all. **Gap:** the R4 *event* dimension is not implemented (see Open items). | Tests "AC-T1-4 / F-R4…", "…F-R4-INS…", "R4 never groups blank or incomparable keys…", "R4 counts distinct tasks…", "…event dimension is recorded as not evaluated", "…F-R6…", "…F-R6-INS…", "with no recorded tick index…", "R6 ignores tasks that are not in_progress…" |
| AC-T1-5 | **Met.** F-R1: 1 R1 candidate. F-R2: 2 R2 (task_started control: 0). F-R3: 2 R3 (attempts-1 control: 0). F-R4: 1 R4 listing 3 tasks (control key: 0 R4); all 4 F-R4 tasks are blocked with blockers, so R1 also fires 4 times, which is asserted and documented. F-R5: 1 R5. F-R6: 1 R6 (distance-2 and distance-0 controls: 0). F-R4-INS, F-R6-INS, F-R6-INS-c: 0. F-DUP: the same ids on a repeat scan, and the second write creates 0 files. | Test "AC-T1-5: fixtures F-R1-F-R6 produce exactly the expected detector candidates…", "F-DUP…", "DET-8…". The table in `scripts/fixtures/sie-SYNTHETIC/README-SYNTHETIC.md` |

## WP-04 working-basis note

The six rules are implemented from the Specification's **[REF]
reconstructions**, which are carried from the prep draft. They are
**UNVERIFIED against WP-04 v1.1 verbatim**, because the full WP-04 text is
not available locally (Spec §0.4, §2 point 1). The R4 and R6 semantics come
from addendum CR-04, a [P] proposal. No rule is presented as
WP-04-verified. This is stated in the module header, in every candidate
record (`rule_basis`), in the fixture README, and here.

## Open items / known gaps

1. **R4 event dimension — NOT IMPLEMENTED (spec gap, stopped rather than
   invented).** R4 is "same blocker/**event** across ≥ 2 tasks". Addendum
   CR-04 says "a recorded event key", but neither the Spec nor the
   addendum names which event field is that key. `events.jsonl` lines
   carry `type`, `task_id`, `run_id`, `timestamp`, and `detail`. Choosing
   `type` would make R4 fire for any two tasks that ever started. Choosing
   `detail` would fire on shared free-text log messages. Both choices
   would be invented semantics. The detector therefore evaluates only the
   blocker dimension, and every scan reports the event dimension under
   `not_evaluated`, so a null result is never mistaken for a completed
   check. **Unblocked by:** WP-04 §2 point 1 text, or a Spec revision that
   names the event key. Owner: coordinator (retrieval or spec), with
   Founder review if it changes what counts as a recurrence.
2. **WP-04 precondition (Spec §0.4, §18).** The T0 coordinator disposition
   made dependent tasks conditional on the WP-04 passages being retrieved
   before those tasks "proceed on those points". Spec §18 marks T1 as
   blocked by point 1. This T1 brief directs implementation on the
   working basis, with that basis marked. The builder followed the T1
   brief and flags the tension here so the coordinator and Founder can
   confirm the disposition.
3. **No authoritative tick index (SIE-03 OPEN).** Operationally R6 can
   only produce "insufficient evidence" today. A tick source (for example
   the scheduler's own store) can be read only after an SIE-03 decision.
   The CLI deliberately has no tick-index option.
4. **SPEC-1 proposal (still-stuck tasks).** Proposed for review, not
   decided: the R6 id includes the last-progress tick and not the current
   tick. A task that is still stuck at the same last-progress tick
   therefore keeps one detector-candidate id across scans, so it yields no
   new candidate. Progress that later stalls again gives a new id. This is
   tested.
5. **DET-8 consequences, recorded so reviewers can check them.**
   - R1 and R3 ids use only the task pointer. A task that is blocked again
     with different blockers, or whose attempts rise from 2 to 3, keeps
     the same id, so no second record is written for it.
   - An R4 id includes the sorted pointers. If a new task joins an
     existing shared key, the id changes and a new candidate is written;
     the old one is left untouched.
   - Both follow the Spec's DET-8 inputs. Whether these are the wanted
     semantics is a review question.
6. **R1 "non-empty".** Implemented as "`blockers` is a list with at least
   one element", per `tasks/schema.md`. A list holding only blank strings
   still counts as non-empty for R1. R4 treats those same blank strings as
   insufficient evidence.
7. **Operational candidate location not created.** Spec LOC-2 gives
   `records/projects/genesis/sie/candidates/` as illustrative, with the
   final path to be decided with F-14 or in T2. T1 creates no operational
   record directory and writes no operational candidates, because running
   the detector on live records would be a loop turn, and Stage 3 starts
   no live loop.
8. **Malformed input.** An unparseable task file or event line stops the
   scan with an error that names the file or line. It is not skipped. The
   Spec does not define this case.
9. **Detector-candidate INDEX section.** None was created (IDX-5 leaves it
   as a T1/T4 choice, OPEN). Proposed: defer to T4.

## Explicit unverified areas (D6 addition)

- All [REF] rule content (WP-04 unavailable).
- Whether WP-04 says anything about R4 key equality or R6 tick
  measurement. If it does, addendum CR-04, and therefore this
  implementation, must be checked against it.
- The test results above were observed by the builder and have not been
  independently reproduced.

## Deviations and escalations

- **Escalation:** open items 1 and 2. Item 1 is a gap reported instead of
  being filled. Item 2 is a precondition tension under the coordinator's
  direction.
- **Permission denials during the session.** Two denials occurred, and
  neither was worked around through another channel:
  - A compound shell command that created the fixture files was rejected
    by the permission layer. The same files were created one by one with
    the file-write tool.
  - Two compound shell lines (a status/git line, and a line-count line
    using `xargs`) needed approval. They were replaced by single commands.

## Scope-compliance statement (D6 addition)

- **T1 only.** No T2–T8 work was done. No incident records, status
  machine, watch computation, procedure, schema/INDEX tests, seed records,
  Group B tests, or lesson staging were built.
- **New files only:** the detector, its tests, its SYNTHETIC fixtures (in
  the separate `scripts/fixtures/sie-SYNTHETIC/` area, apart from
  operational and seed records), and this report.
- **Read-only boundary (DET-4/DET-5, SIE-03).** The detector reads Runner
  task records and events and never modifies them. Its only write creates
  SIE detector-candidate records in a caller-named directory, never inside
  `tasks/` and never over an events file. Reading Runner source records
  and creating SIE detector-candidate records are separate acts. During
  this task the detector was run only on SYNTHETIC fixtures, and its
  output went only to temporary directories.
- **Not done:** no PR was created (PR #36 exists), no merge, no deploy, no
  provisioning, no spending, no database, no production contact, no
  Runner/CI change, no new dependency, provider, service, or
  infrastructure, and no network calls apart from the instructed
  `git push`.
- **No secrets** in any file, log, or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Resource/cost | $0; no new dependencies; local only; no network calls | $0. Node built-ins only (`node:crypto`, `node:fs`, `node:path`, `node:url`). Local only, apart from the instructed `git push` |
| Model/tool | No model restriction stated in the T1 brief | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Verdict rationale (builder's, not a verification verdict)

The builder considers T1 complete **as an implementation for
verification**, on the working basis, with one named gap: the R4 event
dimension is not implemented because its key is unspecified. The builder
does not assign a verification outcome. If the verifier or the Founder
judges that R4 without the event dimension fails AC-T1-1, the correct
outcome is BLOCKED on the spec naming the event key, not an invented key.

## Verification method (to be run by the coordinator)

Per Brief §8.2, an independent verifier session (Codex, text-supplied,
read-only) receives the exact commit, the T1 Task Brief, and this report
labeled as claims. It should:

1. Read the full diff `c89c95e..<head>`, and confirm that only new files
   were added and that no existing file changed (`git diff --stat`,
   `git diff --diff-filter=M c89c95e..<head>` should be empty).
2. Re-run `npm test` and `node scripts/status.mjs` at that commit, and
   confirm 111 tests with 0 failures, including the 22 detector tests.
3. Read `scripts/sie-detector.mjs` against Spec §5.1–§5.2 rule by rule
   (DET-1–DET-9), and check AC-T1-1–AC-T1-5 against the code itself, not
   only against the tests.
4. Check that every fixture is SYNTHETIC in its file name and content, and
   that fixtures sit outside `tasks/`, `events.jsonl`, and any SIE record
   area.
5. Judge open items 1 and 2.
6. Record source hashes, an independence declaration (Stage 2 spec 05
   VI-9), and skipped checks separately from passed ones.

## Evidence-to-acceptance mapping

| AC | Evidence |
|---|---|
| AC-T1-1 | `RULE_BRANCHES`; the six `ruleRn` functions; the two AC-T1-1 tests |
| AC-T1-2 | `makeCandidate`, `CANDIDATE_NOTE`; the AC-T1-2 test |
| AC-T1-3 | The module header comment; `writeCandidates` guards; the five AC-T1-3 tests; this report's Scope section; the fixture README |
| AC-T1-4 | `ruleR4`, `ruleR6`, `INSUFFICIENT_R4`, `INSUFFICIENT_R6`; the nine AC-T1-4 tests; the F-R4-INS, F-R6-INS, and F-R6-INS-c fixtures |
| AC-T1-5 | The F-R1–F-R6 fixtures; the AC-T1-5, F-DUP, and DET-8 tests; the README table |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat c89c95e..<head>` |
