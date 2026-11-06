# T4 Builder Report — Schema and INDEX tests

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

**The limit of these tests (AC-T4-3, prep AC-P4-3, IDX-6): passing on
fixtures proves the test works, not that any real incident is handled
correctly.** Every result below is "test mechanics verified on fixtures",
never "system verified". No input is an operational record.

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T4 — Schema and INDEX tests; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. This is the builder's own declaration. The T4 task brief named no model restriction |
| Starting commit | Original build: `d4484e9` (branch `stage-3/sie-milestone-a`; T3 fix round 1; PR #36 open, not merged). Fix round 1: `e6f96df` (the original T4 build commit). Fix round 2: `299b83c` (the fix-round-1 commit) |
| Resulting commit | Original build: "Stage 3 T4: schema, judgment, and INDEX consistency tests (AC-T4-1..AC-T4-3)" (`e6f96df`). Fix round 1: "Stage 3 T4 fix round 1: reject non-list INDEX sections; limit on every check result; lesson judgment cases (F-T4-1..F-T4-3)" (`299b83c`). Fix round 2: the commit titled "Stage 3 T4 fix round 2: non-throwing MALFORMED_SECTION diagnostic (F-T4-4)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch, not from this report |
| Risk class | **Routine** (Brief §9 T4) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST |
| Specification | `docs/stage-3/00-sie-specification.md`, version 0.4-draft (§6.2, §8 VAL-1, §9.1 LES-2–LES-4, §9.2, §10 EVL-1/EVL-3, §11 LOC-1–LOC-4, §12 IDX-1–IDX-6, §13 FXT-1/FXT-2, §14) |

## Scope

Brief §9 T4 only: the schema test (structure), the judgment test (required
judgment text for validation and sufficiency decisions), and the INDEX
consistency test. No T5–T8 work. The original build changed no existing
file. Fix round 1 changes only the three T4 files, in response to the Codex
round-1 verdict (NEEDS FIXES; findings F-T4-1 to F-T4-3). See "Fix round 1"
below. Fix round 2 changes only the same three files, in response to the
Codex round-2 verdict (NEEDS FIXES; one new finding, F-T4-4). See "Fix
round 2" below.

## Fix round 1 (Codex round-1 verdict: F-T4-1, F-T4-2, F-T4-3)

Only these three findings were addressed. Codex accepted both builder-flagged
items (Section 2 placement; the `by` requirement on the validation history
entry), and both are unchanged.

| Finding | What changed | Covering tests |
|---|---|---|
| **F-T4-1 (MAJOR)**: `checkIndex` treated any non-list section value as empty | `checkIndex` now refuses every known section (1–6) whose value is not a list. It reports `MALFORMED_SECTION`, naming the section, and the result has `consistent: false`. The value is neither resolved nor counted, and nothing is silently discarded. An empty list is still a valid empty section. `parseIndex` always produces lists, so parsed Markdown is unaffected | New test "INDEX: a section value that is not a list is refused as MALFORMED_SECTION, never treated as empty (F-T4-1)". It covers the Codex counterexample (Section 6 = `{ superseded_id: 'MISSING', superseding_id: 'ALSO-MISSING' }` gives exactly `MALFORMED_SECTION`, `consistent: false`). It also covers Section 1 as a bare object (`MALFORMED_SECTION` + `NO_PRIMARY_ENTRY`), and `null`, `undefined`, string, number, boolean, and `{}` in each of Sections 1–6 |
| **F-T4-2 (MINOR)**: six per-record functions returned results without the limit | `checkIncidentStructure`, `checkLessonStructure`, and `checkRecordStructure` add `limit: TEST_LIMIT` on every return, including the non-object early returns. `checkIncidentJudgment`, `checkLessonJudgment`, and `checkJudgment` build every result through the shared `result()` helper, which now adds `limit: TEST_LIMIT`. That covers early returns, `NO_DECISION_RECORDED`, and `NOT_APPLICABLE`. `parseIndex`, `recordIdOf`, and `isFixture` are unchanged: they parse and look up, they do not verify | Extended test "AC-T4-3: the test design states its own limit in the module, the test file, and every result". It asserts `limit === TEST_LIMIT` on 20 results across the six functions: passes, failures, non-object early returns, `NO_DECISION_RECORDED` (incident and staged lesson), `JUDGMENT_MISSING`, `JUDGMENT_PRESENT`, and `NOT_APPLICABLE`. It also checks each per-record result inside `checkJudgments` and `checkStructure` |
| **F-T4-3 (MINOR)**: the validated-lesson test covered only an omitted sufficiency judgment | Test only; no module change. The test is now parameterized over omitted, `null`, `{}`, and empty-text `validation_reference.sufficiency_judgment`. For each value it asserts that lesson structure passes, that `checkStructure` on the full baseline set (with the lesson swapped in) is `structurally_valid` with `index.consistent === true`, that `checkJudgment` is `JUDGMENT_MISSING` / `judged: false` naming `validation_reference.sufficiency_judgment`, and that the set outcome is `JUDGMENT_TEXT_MISSING` | Updated test "AC-T4-1: a structurally complete validated lesson without sufficiency judgment text PASSES structure and FAILS judgment" |

**Existing tests updated for the fixed behaviour:** two. "AC-T4-3: the test
design states its own limit…" was extended (F-T4-2), and "AC-T4-1: a
structurally complete validated lesson without sufficiency judgment text…"
was parameterized (F-T4-3). No existing assertion was removed or weakened.
One test was added (F-T4-1).

**Builder mutation check:** the builder stashed only the module change and
ran the updated tests against the pre-fix `sie-schema.mjs`. The F-T4-1 and
F-T4-2 tests failed (2 fail, 21 pass). With the fix restored, all 23 pass.
The F-T4-3 test passes on both versions, as expected, because Codex found
that gap in coverage, not in behaviour.

**T2 `validateRecord` read (builder's own reading, `scripts/sie-incident.mjs`,
not modified).** `validateRecord` reads `sufficiency_judgment` only as a key
in the `RECORD_FIELDS` presence list. It does not read the judgment's
`text`, `by`, or `date`. From history entries it reads only `to`, to check
that status agrees with history. It does not read `reason`, `by`, or `date`.
The only `reason` fields it reads are structural ones: `detector_rule.reason`
for a manual rule, and `history[0].hypotheses_empty_reason`. Neither is
validation or sufficiency judgment text. This matches the coordinator's
reading. T2's separate `checkValidationEligibility` does read
sufficiency-judgment text, `by`, and `date`, but T4 neither imports nor
calls it.

## Fix round 2 (Codex round-2 verdict: F-T4-4)

Codex round 2 found F-T4-2 and F-T4-3 fixed and closed the Appendix A caveat.
F-T4-1 stayed open only through the new finding F-T4-4, and this round
addresses only that finding.

| Finding | What changed | Covering tests |
|---|---|---|
| **F-T4-4 (MINOR)**: the `MALFORMED_SECTION` diagnostic interpolated `JSON.stringify(entries)`, which throws on a BigInt or a circular object, so those non-list values raised an exception instead of being refused | New module-private helper `describeValue(v)`, which cannot throw. It returns the value's kind (`typeof`, with `null` reported as `null`) followed by a JSON preview of at most 80 characters. When `JSON.stringify` throws, it returns `<kind> <unserializable>`. When `JSON.stringify` returns no string (`undefined`, a function, or a symbol), it returns the kind alone. Only the `MALFORMED_SECTION` message uses it. The branch is otherwise unchanged: the problem still names the section (message and `section` field), the result is still `consistent: false`, and the value is neither resolved nor counted | Extended test "INDEX: a section value that is not a list is refused as MALFORMED_SECTION, never treated as empty (F-T4-1)". For each of Sections 1–6 it adds a BigInt (`1n`) case and a circular-object case. Each asserts that `checkIndex` does not throw, that the result has `consistent: false`, and that there is a `MALFORMED_SECTION` problem whose `section` is that section and whose message starts `Section N must be a list of entries, got bigint <unserializable>` / `got object <unserializable>` |

**Existing tests updated for the fixed behaviour:** one, the
malformed-section test named above, which was extended. No assertion was
removed or weakened, and no test was added, so the T4 suite still has 23
tests.

**Builder mutation check:** the builder stashed only the module change and
ran the extended test against the fix-round-1 `sie-schema.mjs`. The
malformed-section test failed with `TypeError: Do not know how to serialize
a BigInt` (1 fail, 22 pass). With the fix restored, all 23 pass.

**Observation, not fixed (outside the F-T4-4 scope):** other diagnostics in
the module still interpolate `JSON.stringify` of an input value. These are
the `MALFORMED_ENTRY` messages in `checkIndex` (Sections 1–5 entries) and
`checkSupersession` (Section 6 entries), and the status/kind messages in
`checkLessonStructure`, `checkRecordStructure`, and `placement`. A BigInt
or circular value in one of those positions could still throw. The brief
limited this round to the `MALFORMED_SECTION` branch, so these were left
as they are. Whether to apply `describeValue` there is for the
coordinator/verifier to decide.

## What was built

`scripts/sie-schema.mjs` is a dependency-free Node ES module. Its only
import is `validateRecord` from `scripts/sie-incident.mjs` (T2). It does no
file I/O and never mutates its inputs. It is one module, not two: the INDEX
logic (`parseIndex`, `checkIndex`, ~140 lines) shares the record-descriptor
helpers (`recordIdOf`, `isFixture`) with the structural checks, and a split
would only move those helpers across a boundary.

Inputs are plain objects:

- A **record descriptor** is `{ file, kind, record, fixture? }`, one per
  record file. `kind` is `incident`, `lesson`, `seed`, or
  `detector-candidate`. "File exists" means "present in the supplied set".
  The caller supplies the set, so no record location is assumed (F-14).
- An **INDEX** is `{ sections: { '1': [{ id, file }], …, '6': [{ superseded_id, superseding_id }] }, stray? }`,
  built in memory or by `parseIndex(markdown)`.

| Check | Export(s) | What it checks |
|---|---|---|
| Schema test (structure only) | `checkStructure({ records, index })`, `checkRecordStructure(desc)`, `checkIncidentStructure`, `checkLessonStructure` | **Incidents:** T2's `validateRecord`, imported, not copied. That covers the exact 24 §6.2 fields, status in OPEN/FIXED/WATCH/VALIDATED/REOPENED, status-dependent fields, and history agreement. For VALIDATED only, it adds §6.2/EVL-1 presence checks: a non-empty `exposure_evidence_link` with pointers and no fixture/synthetic link, and non-empty `regression_test`, `reproduction_evidence`, and `independent_verification`. **Lessons (§9.2):** common fields; `non_applicability` non-empty for either kind (CR-02 (c)); status in `UNVALIDATED-STAGED`/`VALIDATED`; `CANDIDATE` refused as reserved (VOC-6); staged requires `validation_claim = "NONE"` and `index_section = "unvalidated-staged"` and no validated-only field; validated requires non-empty `evidence_links` and a `validation_reference` naming the incident; `supersedes_staged_id` never equals the lesson's own id (LES-4); unknown fields are refused. **Seeds/candidates:** an id only (seed never VALIDATED). Then `checkIndex`. The result has `structurally_valid`, per-record problems, the INDEX result, `note` (STRUCTURE_NOTE), and `limit` (TEST_LIMIT). **It carries no judged, validated, or sufficient field** |
| Judgment test | `checkJudgment(desc)`, `checkJudgments(records)`, `checkIncidentJudgment`, `checkLessonJudgment` | **Incident validation decision** (status VALIDATED, or any history entry to VALIDATED): requires the validation judgment (that history entry's `reason` text, `by`, `date`) AND `sufficiency_judgment` `{ text, by, date }`. A recorded sufficiency judgment on any other record must also be complete. **Validated lesson:** requires `validation_reference.sufficiency_judgment` `{ text, by, date }` (LES-3). **Staged lessons, unvalidated incidents, seeds, candidates:** no decision, so `judged: false`. Per-record outcome: `JUDGMENT_PRESENT` / `JUDGMENT_MISSING` / `NO_DECISION_RECORDED` / `NOT_APPLICABLE`; `judged` is true only for `JUDGMENT_PRESENT`. Set-level outcome: `JUDGMENT_TEXT_COMPLETE` / `JUDGMENT_TEXT_MISSING` / `NO_DECISIONS_TO_JUDGE`. It never passes vacuously. The judge's identity or role is **not** checked (OPEN pending D2; H4); only that someone is named |
| INDEX consistency test | `checkIndex({ records, index })`, `parseIndex(markdown)` | Every problem carries a `code`. See the rules below |

### INDEX rules enforced (`checkIndex`)

| Rule | Code(s) |
|---|---|
| Every Sections 1–5 entry resolves to a supplied record file (IDX-1) | `UNRESOLVED_ENTRY`, `MALFORMED_ENTRY` |
| The entry id matches that file's record id | `ID_MISMATCH` |
| Every record file has exactly one primary entry: zero fails, two fail, whether in two sections or twice in one (IDX-1) | `NO_PRIMARY_ENTRY`, `MULTIPLE_PRIMARY_ENTRIES` |
| No staged record in Section 1 (IDX-1, AC-T4-2) | `STAGED_IN_SECTION_1` |
| No validated record (lesson or incident) in Section 4 (IDX-1, AC-T4-2) | `VALIDATED_IN_SECTION_4` |
| Section placement: 1 = validated lessons; 2 = validated incidents; 3 = OPEN/FIXED/WATCH/REOPENED incidents (IDX-3); 4 = staged lessons; 5 = seeds | `WRONG_SECTION` |
| Section 6 entries are secondary references (IDX-2): each id must resolve to a record in the set, and they never count as primary entries | `UNRESOLVED_REFERENCE` |
| Fixtures never appear in the INDEX under test, in any section including 6, or in the record set under test (IDX-4, FXT-1). A fixture is a record marked `fixture: true`, under a `fixtures/` directory, or with SYNTHETIC in its file name or id | `FIXTURE_IN_INDEX`, `FIXTURE_IN_RECORD_SET` |
| IDX-5 design choice (below) | `CANDIDATE_IN_INDEX` |
| Only Sections 1–6 exist; no CANDIDATE section (IDX-5, VOC-6) | `UNKNOWN_SECTION` |
| Every section value is a list of entries; any other value is refused, never treated as empty (fix round 1, F-T4-1). The diagnostic cannot throw, including on a BigInt or a circular value (fix round 2, F-T4-4) | `MALFORMED_SECTION` |
| No list entry outside a section; no duplicate record file or id in the set | `STRAY_ENTRY`, `DUPLICATE_RECORD_FILE`, `DUPLICATE_RECORD_ID` |

## Files written

The original build (`e6f96df`) added these three files as new files. Fix
rounds 1 and 2 each **modify** the same three files and no others.

| File | Lines after original build | Lines after fix round 1 | Lines after fix round 2 |
|---|---|---|---|
| `scripts/sie-schema.mjs` | 434 | 442 | 453 |
| `scripts/sie-schema.test.mjs` | 474 | 547 | 562 |
| `docs/stage-3/T4-builder-report.md` | this file | this file | this file |

No fixture files were added to the repository. Every test input is a
SYNTHETIC record or INDEX built inline. One test writes a SYNTHETIC INDEX and
record files to a `mkdtemp` directory under the OS temp dir and removes it in
`finally`. No other file was modified in either round, including the Specification,
`scripts/sie-incident.mjs`, `scripts/sie-detector.mjs`, their tests, existing
fixtures, `tasks/`, `events.jsonl`, CI, and Runner scripts.

## Tests and results (builder-observed; re-run required by the verifier)

The builder ran these from the repo root on the uncommitted fix-round-2
tree just before committing:

- `node --test scripts/sie-schema.test.mjs`: **23 tests, 23 pass, 0 fail,
  0 skipped.** Fix round 2 extended one test and added none.
- `npm test` (`node --test scripts/*.test.mjs`): **188 tests, 187 pass,
  0 fail, 1 skipped.** The skip is the pre-existing one. 165 non-T4 + 23 T4
  = 188.

(For the record: original build, T4 suite 22 / 22 pass and `npm test` 187
tests, 186 pass, 0 fail, 1 skipped. Fix round 1, T4 suite 23 / 23 pass and
`npm test` 188 tests, 187 pass, 0 fail, 1 skipped.)
- `node scripts/status.mjs`: **exit 0**. It prints "Genesis tasks: 15 total"
  (blocked 1, completed 14), unchanged.

All results are **test mechanics verified on fixtures**. They do not verify
the system, and they are not validated learning (EVL-7: evidence level
Component at most).

## Per-AC evidence (claims — the verifier decides)

| AC | Builder claim | Evidence the verifier can inspect |
|---|---|---|
| AC-T4-1 | **Met.** Structure and judgment are separate code paths with separate results. Structural functions never read judgment text, and their results carry no judged/validated/sufficient field (asserted on the result keys). Judgment functions call no structural check (asserted on their source). The explicit case passes: a structurally complete VALIDATED incident with `sufficiency_judgment` null, `{}`, or `{ text: '' }` passes `checkStructure` (with a consistent INDEX) and fails `checkJudgment` (`JUDGMENT_MISSING`, naming `sufficiency_judgment`). The set outcome is `JUDGMENT_TEXT_MISSING`. The same holds for a validated lesson whose `validation_reference.sufficiency_judgment` is omitted, `null`, `{}`, or has empty text: each passes `checkStructure` with a consistent INDEX and fails judgment (fix round 1, F-T4-3). It also holds for a validation history entry with no `by`. Every structurally valid record without judgment text (OPEN, FIXED, WATCH, REOPENED, staged, seed, candidate) is `judged: false`, and a set with no decisions is `NO_DECISIONS_TO_JUDGE`, not a pass. The reverse also holds: a judgment present on a structurally broken record does not make it structurally valid | `checkStructure`, `checkIncidentStructure`, `checkLessonStructure`, `checkJudgment`, `checkJudgments`, `checkIncidentJudgment`, `checkLessonJudgment`, `STRUCTURE_NOTE`, `JUDGMENT_NOTE`. The five tests prefixed "AC-T4-1" |
| AC-T4-2 | **Met, both directions.** A staged lesson moved into Section 1 fails with `STAGED_IN_SECTION_1`. Listed in both Sections 1 and 4, it fails with `STAGED_IN_SECTION_1` and `MULTIPLE_PRIMARY_ENTRIES`. A validated lesson in Section 4 and a validated incident in Section 4 each fail with `VALIDATED_IN_SECTION_4`. The same refusal is shown through `parseIndex` on Markdown | `placement`, `checkIndex`. Tests "AC-T4-2: a staged lesson in Section 1…", "AC-T4-2: a validated record in Section 4…", and "INDEX Markdown: …" |
| AC-T4-3 | **Met.** The limit is stated in the module header, the test-file header, the exported `TEST_LIMIT` constant, this report, and the `limit` field of every check result. That covers the aggregate checks `checkStructure`, `checkIndex`, and `checkJudgments`. Since fix round 1 (F-T4-2) it also covers every return path of `checkIncidentStructure`, `checkLessonStructure`, `checkRecordStructure`, `checkIncidentJudgment`, `checkLessonJudgment`, and `checkJudgment`, including early returns, failures, and no-decision outcomes. `parseIndex`, `recordIdOf`, and `isFixture` are parse/lookup helpers, not check results. A test asserts the headers and the `limit` on all of these results | `TEST_LIMIT`; the `result()` helper; test "AC-T4-3: the test design states its own limit…" (extended in fix round 1 to 20 per-function results across passes, failures, early returns, and `NO_DECISION_RECORDED` / `NOT_APPLICABLE`) |

Additional coverage asked for by the task brief:

- **Zero / two primary entries; resolution; Section 6 secondary;
  Section 3 statuses; fixtures; IDX-5; non-list sections (F-T4-1):** the
  eight "INDEX" / "IDX-5" tests.
- **Schema (incident via T2, VALIDATED/EVL-1, lesson §9.2, descriptors):**
  the five "Schema:" tests.
- **Fixture directory:** the temp-directory test.
- **Boundary:** the source has no `node:fs`, imports `validateRecord` from
  T2, contains no copied field list and no `TRANSITIONS`, and no
  `records/projects/genesis/sie` path. Frozen inputs are unchanged after the
  checks.

## Design choices and open items

1. **IDX-5 — DESIGN CHOICE, not a spec requirement (IDX-5 OPEN,
   low-impact).** Detector-candidate records get **no** INDEX entry. They
   are not lessons and not Sections 1–6 entries. A candidate record in the
   set with no entry is consistent. A candidate referenced in any of
   Sections 1–5, or in a Section 6 reference, fails (`CANDIDATE_IN_INDEX`).
   The choice is stated in the exported `IDX5_CHOICE` text and in the module
   header. If T1/T7 or the Founder later wants a candidate section, it would
   have to be a seventh section outside 1–6, and the spec would need to
   define it first.
2. **F-14 OPEN — the record location is a WORKING ASSUMPTION (LOC-1), not
   decided.** The module takes whatever file paths the caller supplies. The
   tests use invented `t4-test-only/…` paths and a temp directory. No
   operational record path was created, no INDEX was written into the repo,
   and the illustrative LOC-2 layout (`records/projects/genesis/sie/`) is
   neither used nor treated as decided (a test asserts the module source
   does not contain it).
3. **Section 2 as the primary home of a VALIDATED incident.** §12 labels
   Section 2 "optional cross-reference [P]". Section 3 excludes VALIDATED,
   and IDX-1 requires exactly one primary entry, so Section 2 is the only
   section where a VALIDATED incident can live. This is flagged for review.
   VAL-6 still holds: no incident reaches VALIDATED in Stage 3. The Section 2
   path is exercised only on hand-built SYNTHETIC literals.
4. **What "judgment text" means here.** For an incident validation, the
   validation judgment is the history entry that records the VALIDATED
   decision (its `reason` as text, `by`, `date`), plus the §6.2
   `sufficiency_judgment` `{ text, by, date }` (the T2 shape). For a
   validated lesson, it is `validation_reference.sufficiency_judgment`. The
   spec fixes "judgment text … by whom … date" but not the field shapes
   beyond T2's. Requiring `by` on the VALIDATED history entry is stricter
   than T2's `transition`, where `by` is optional. Because no path reaches
   VALIDATED (D2 pending), this changes no T2 behaviour. Open to review.
5. **Fixture detection.** A record counts as a fixture if it has the
   `fixture: true` flag, sits under a `fixtures/` directory, or has
   SYNTHETIC in its file name or id (FXT-1 labeling). So the test inputs
   shaped like operational records use `T4TEST` ids and `t4-test-only/`
   paths, with SYNTHETIC in `provenance` and in the test-file header. This
   follows T2's precedent of a SYNTHETIC input "shaped like operational
   evidence". Detection is by label and location only. An unlabeled
   synthetic record would not be detected.
6. **Builder conventions the Spec does not fix:** the INDEX line syntax
   (`## Section N: …` headings; `- ` entries whose first two backticked
   tokens are id and file, or superseded and superseding id in Section 6);
   the record descriptor shape; the lesson `annotations` list for the LES-4
   "superseded-by" note; and the seed `seed_id` field (seed records are T5).
7. **EVL-3 followability** is checked only as "non-empty pointer", with no
   fixture/synthetic naming. As in T2, the module cannot follow a link.
8. **H6 (schema adequacy) stays OPEN.** T4 keeps structure and judgment
   distinct, as IDX-6 requires. It does not decide whether these checks are
   adequate.

## What is NOT claimed

- **Passing on fixtures proves the test works, not that any real incident
  is handled correctly.** No result here is "system verified".
- **No operational INDEX or record** was read, created, moved, or
  reorganized. No record location is decided (F-14 OPEN).
- **No validation, no validated lesson, no Milestone B, no Group C.** The
  VALIDATED incident and the validated lesson in the tests are hand-built
  SYNTHETIC literals. They exercise the checks only and were not produced
  by any validation path (VAL-6, LES-8).
- **A structurally valid record is not validated, sufficient, or judged.**
  A record with judgment text present is not correctly judged. The checks
  confirm only that text naming a judge and a date exists. The judge role
  is not checked (D2 pending).
- **No open finding or decision taken:** F-14, F-36, F-10, F-16, F-21,
  F-34, H5/SIE-02 (watch computations stay PROVISIONAL; T4 adds none),
  R4-events (no event key invented), DV-2/C-15 (no lifecycle order assumed
  beyond AC-T2-1 as recorded in T2), DV-3/C-16 (no claim; "unrelated users"
  not defined or enforced), and the D2 operational model are all unchanged.
  IDX-5 is a labeled design choice, not a decision of the open item.
- **No live loop** was started, and no incident was manufactured.

## Scope-compliance statement (D6 addition)

- **T4 only.** Original build: three new files (the module, its tests, and
  this report). Fix rounds 1 and 2: the same three files modified, no other
  file touched. `scripts/sie-incident.mjs` was read, not modified. During
  fix round 2, the working tree also held another builder's uncommitted
  change to `docs/stage-3/00-sie-specification.md`. This builder did not
  edit, stage, or commit it.
- **Read-only boundary.** The module does no file I/O and imports only T2.
  The tests' only I/O is reading the module source and a temp directory
  they create and delete. No Runner source record, `tasks/`, or
  `events.jsonl` was touched.
- **Not done:** no PR opened or closed, no PR comment, no merge, no deploy,
  no provisioning, no spending, no database, no production contact, no
  Runner/CI change, no new dependency, provider, server, or agent. No
  network calls apart from the instructed `git push`.
- **No secrets** in any file, log, or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Scope | New module(s), new tests, optional SYNTHETIC fixtures, this report; no edit to existing files. Fix rounds 1 and 2: edits to these three files only | One module, one test file, this report. No fixture files. No pre-T4 file changed in either round |
| Resource/cost | $0; no dependencies; local only | $0. Node built-ins only. Local, apart from `git push` |
| Model/tool | No restriction stated | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Deviations and escalations

- **No deviation from the brief.** Open items 3 and 4 (Section 2 as the
  primary home; the `by` requirement on the validation history entry) are
  the points most likely to need a reviewer judgment.
- **Permission prompts during the session.** Three compound shell commands
  needed approval: a `cd && git …` line, a scripted file edit, and a
  test-plus-status line. Each was replaced by single commands or the Edit
  tool. A `wc` on the brief outside the repo was also refused; the brief
  was read with the Read tool instead. Nothing was worked around through
  another channel.
- **Fix round 1 permission prompts.** A `cd && git …` line, a shell line
  using a `${…}` variable, and a compound test-plus-status-plus-`wc` line
  were each refused. The builder replaced each with single commands. The
  builder's mutation check used `git stash push scripts/sie-schema.mjs` and
  `git stash pop`, and the tree was confirmed restored with
  `git diff --stat`. No deviation from the fix-round brief.
- **Fix round 2 permission prompts.** A `cd && git …` line and a status
  line with an `echo "exit=$?"` suffix were each refused. The builder
  replaced each with a single command. The mutation check again stashed
  only `scripts/sie-schema.mjs`, and the tree was confirmed restored with
  `git diff --stat`. No deviation from the fix-round brief. The
  `JSON.stringify` sites outside the `MALFORMED_SECTION` branch are
  reported as an observation (see "Fix round 2") and were not changed.

## Verdict rationale (builder's, not a verification verdict)

The builder submits T4 **for verification**. AC-T4-1 to AC-T4-3 are claimed
met on SYNTHETIC inputs, as test mechanics only. The builder does not assign
a verification outcome.

## Verification method (to be run by the coordinator/verifier)

1. Read the full diff `d4484e9..<head>`. Confirm that only these three
   files changed: `git diff --stat d4484e9..<head>` should list exactly
   `scripts/sie-schema.mjs`, `scripts/sie-schema.test.mjs`, and
   `docs/stage-3/T4-builder-report.md`. For the fix round alone,
   `git diff --stat e6f96df..<head>` should list the same three files as
   modified, and `git diff --diff-filter=AD e6f96df..<head>` should be empty
   (nothing added or deleted). For fix round 2 alone,
   `git diff --stat 299b83c..<head>` should list the same three files as
   modified.
2. Re-run at that commit:
   - `node --test scripts/sie-schema.test.mjs`: expect **23 tests, 23 pass,
     0 fail, 0 skipped**.
   - `npm test`: expect **188 tests, 187 pass, 0 fail, 1 skipped** (the
     pre-existing skip).
   - `node scripts/status.mjs`: exit 0, "Genesis tasks: 15 total".
3. Read `scripts/sie-schema.mjs` against Spec §12 (IDX-1–IDX-6), §9.2, §6.2,
   §10 EVL-1, and §13. Check AC-T4-1–AC-T4-3 against the code, not only the
   tests. In particular:
   - confirm that the structural functions never read judgment text;
   - confirm that the judgment functions call no structural check;
   - confirm that `checkJudgments` cannot pass on a set with no decisions.
4. Mutation spot-check, suggested: disable the `STAGED_IN_SECTION_1` or
   `VALIDATED_IN_SECTION_4` branch in `placement`, or make
   `checkIncidentJudgment` return `JUDGMENT_PRESENT` unconditionally, and
   confirm the AC-T4-2 / AC-T4-1 tests fail. For fix round 1: restore the
   pre-fix `for (const e of Array.isArray(entries) ? entries : [])` loop, or
   drop `limit` from `result()`, and confirm that the F-T4-1 or AC-T4-3 test
   fails. For fix round 2: replace `describeValue(entries)` in the
   `MALFORMED_SECTION` message with `JSON.stringify(entries)`, and confirm
   that the malformed-section test fails with a BigInt `TypeError`.
5. Judge open items 1 (the IDX-5 choice), 3, 4, and 5.
6. Record source hashes, an independence declaration (Stage 2 spec 05
   VI-9), and skipped checks separately from passed ones.

## Evidence-to-acceptance mapping

| AC | Evidence |
|---|---|
| AC-T4-1 | `checkStructure` / `checkRecordStructure` / `checkIncidentStructure` / `checkLessonStructure` (structure) vs. `checkJudgment` / `checkJudgments` / `checkIncidentJudgment` / `checkLessonJudgment` (judgment); the 5 "AC-T4-1" tests (the validated-lesson test covers omitted / `null` / `{}` / empty-text since fix round 1, F-T4-3) |
| AC-T4-2 | `placement` (`STAGED_IN_SECTION_1`, `VALIDATED_IN_SECTION_4`), `checkIndex`, `parseIndex`; the 2 "AC-T4-2" tests and the "INDEX Markdown" test |
| AC-T4-3 | `TEST_LIMIT`, module and test-file headers, `limit` on every check result (aggregate and all six per-record structural/judgment functions, every return path, since fix round 1, F-T4-2), this report; the extended "AC-T4-3" test, covering passes, failures, early returns, and no-decision outcomes |
| INDEX consistency (brief work items) | `checkIndex` (non-list sections refused as `MALFORMED_SECTION` since fix round 1, F-T4-1; non-throwing diagnostic via `describeValue`, including BigInt and circular values, since fix round 2, F-T4-4); the "INDEX:" (including "a section value that is not a list…"), "IDX-5", "INDEX Markdown", and temp-directory tests |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat d4484e9..<head>`, `git diff --stat e6f96df..<head>`, and `git diff --stat 299b83c..<head>` |

## DV-2 conformance note (coordinator, 2026-11-06)
The Founder's DV-2 clarification (spec 0.5-draft, C-15 CLOSED) made fix-verification mandatory at FIXED → WATCH: the transition now refuses with `FIX_NOT_VERIFIED` when VAL-1 (1) reproduced failure or (2) regression test (fail-before/pass-after) is missing. T4's `watchInc` test helper (`scripts/sie-schema.test.mjs`) moved a FIXED record to WATCH without recording that evidence, so it was updated to record both elements via `recordValidationEvidence` before the transition (SYNTHETIC values, same pattern as `validatedIncLiteral`). No T4 check, AC, or assertion changed; the helper now supplies evidence the T2 gate requires. Full suite green after the change (195 pass / 0 fail / 1 pre-existing skip).
