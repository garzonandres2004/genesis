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
| Starting commit | `c89c95e` (branch `stage-3/sie-milestone-a`, T0 verified PASS; PR #36 open, not merged). Fix round 1 starts from `b97dd08` (the original T1 commit) |
| Resulting commit | Original: `b97dd08`. Fix round 1: the commit titled "Stage 3 T1 fix round 1: alias-proof writes, R4 timestamps, disposition record" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch head, not from this report. |
| Risk class | Routine (Brief §9 T1) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record) |

## Fix round 1 (verifier verdict NEEDS FIXES on `b97dd08`)

The Codex verdict listed 1 BLOCKER, 2 MAJOR, and 2 NOTE findings. This
round changed only T1 files: `scripts/sie-detector.mjs`,
`scripts/sie-detector.test.mjs`, and this report. No fixture, no T0
Specification text, and no other repository file changed.

| Finding | Disposition in this round |
|---|---|
| 1 BLOCKER — R4 event dimension | **Not fixed; escalated.** No event key was invented. The analysis is recorded in "R4 events — why no key was chosen" below. The decision belongs to the parent/Founder |
| 2 MAJOR — symlink alias bypass (AC-T1-3/DET-5) | **Fixed.** See below |
| 3 MAJOR — R4 drops recorded timestamps (DET-9) | **Fixed.** See below |
| 4 NOTE — evidence | No builder action. The coordinator supplies exact-commit output, check results, and the diff. Test claims below are limited to what the builder ran and saw |
| 5 NOTE — working-basis disposition | **Recorded.** See "Working-basis disposition" below |

### Finding 2 fix — filesystem-resolved write guard

- `writeCandidates()` now compares **filesystem-resolved** paths. A new
  `realResolve()` takes the realpath of the deepest existing ancestor and
  appends the not-yet-existing remainder. So a symlink anywhere along the
  output path is followed, even when the output directory does not exist
  yet.
- The same resolution is applied to every protected location: the
  repository's `tasks/`, the caller's `tasksDir`, and the `eventsFile`.
  An output whose resolved path is inside a resolved protected directory is
  refused **before `mkdirSync` or any write**.
- A dangling symlink on the output path cannot be resolved, so it is
  refused rather than guessed at.
- Exclusive creation (`flag: 'wx'`) and the events-file guard are kept. The
  events-file comparison now uses resolved paths too.
- New test "AC-T1-3: refuses symlink aliases into a task-record directory,
  before creating anything". It builds symlinks in a fresh temp directory
  and asserts refusal for each of these:
  - output = alias of a fixture `tasks/` directory;
  - output = a not-yet-existing descendant under that alias;
  - the protected `tasksDir` itself named through an alias, with output at
    its real path;
  - output = alias of the repository's own `tasks/`, with no `tasksDir`
    given;
  - output under a dangling symlink.

  It then asserts that the fixture `tasks/` and the repo `tasks/` directory
  listings are unchanged, that nothing was created at the dangling target,
  and that a real output directory beside the aliases still works.
- Limit, stated plainly: the check runs once, before creation. A symlink
  swapped in between the check and `mkdirSync` (a race) is not defended
  against. The Specification does not ask for that.

### Finding 3 fix — R4 keeps recorded timestamps

- R4 candidates now carry
  `recorded_timestamps: { per_task: [{ task_id, source_pointer, created, updated }, ...] }`,
  one entry per contributing task, in the same task-id order as
  `task_ids`. Values are taken as recorded, and a missing value is `null`.
  That is the same `created`/`updated` handling as R1, R3, and R6 (which
  carry one task each), with the task id and source pointer attached,
  because R4 spans several tasks.
- The DET-8 id is unchanged: its inputs are still rule + exact key + sorted
  source pointers. Timestamps are not id inputs.
- Tests:
  - the F-R4 test now asserts the three tasks' recorded `created`/`updated`
    values with their task ids and pointers;
  - a new test "DET-9 / R4: recorded timestamps stay with their own task;
    they are not DET-8 id inputs" uses two inline SYNTHETIC tasks with
    *different* timestamps (one with `updated` missing). It checks that each
    value stays with its own task and that the candidate id equals
    `candidateId('R4', [key, sorted pointers])`;
  - the F-DUP repeat-scan assertions still pass unchanged.

## Working-basis disposition

The coordinator recorded this disposition. Quoted verbatim:

> "Coordinator disposition (2026-11-06, recorded in the stage execution log):
> T1–T8 proceed on the Specification's [REF] reconstructions as the working
> basis, per brief §2.2's fallback (reconstructions are the working basis
> until the corresponding passages are quoted, and are marked unverified
> against WP-04 verbatim). The eight WP-04 passages must be retrieved and
> quoted before the rules are treated as VERIFIED/settled — i.e. before
> Milestone A is declared on them and before any live-loop use — and any
> divergence found on retrieval triggers a Specification revision +
> affected-task rework. EXCEPTION: T5 has no working basis (the seed corpus
> list is absent from every local file) and genuinely blocks on WP-04
> retrieval."

**Carried conflict (not resolved here).** Specification §0.4 and C-13
make dependent implementation conditional on retrieving and quoting the
WP-04 passages. §2 point 1 and §18 mark T1 as blocked. The disposition
above lets T1 proceed on the working basis before retrieval. These two
records disagree.

- The builder followed the coordinator disposition.
- The builder did **not** edit the Specification, which is verified PASS
  and needs its own round for any change.
- Reconciling the Specification text with the disposition is for the
  coordinator/Founder.

Until the WP-04 passages are quoted, T1's rules remain UNVERIFIED against
WP-04, and T1 cannot support declaring Milestone A or any live-loop use.

## R4 events — why no key was chosen

R4 is "same blocker/**event** across ≥ 2 tasks". The event half needs a
recorded event field to group on. No source names one:

- Specification DET-6 says "a recorded identifier or value as it appears in
  an existing record". It does not say which event field.
- Specification §5.2 iterates `blocker_and_event_items(existing_records)`
  and tests `key(source_item)`. Neither function is defined for events.
- Prep draft §2.1 R4 iterates `group_keys(existing_records)` over
  `blocker_or_event_key`. It also never names the event field.
- The F-R4 fixture covers the blocker half only.

The repository's `events.jsonl` has 14 events. Every event has exactly the
fields `type`, `task_id`, `run_id`, `timestamp`, and `detail`. Counted by
the builder from that file:

| Candidate key | Values in `events.jsonl` | Why it is unsupported |
|---|---|---|
| `type` | 4 distinct values. `task_started` appears on 7 distinct tasks, `task_completed` on 4, and `run_interrupted` and `task_requeued` on 1 each | Too coarse. Nearly every task starts and completes, so R4 would fire on almost every pair of tasks. That is the lifecycle, not a shared blocker or event signal |
| `detail` | Free text, 11 distinct values. Most are unique to one run. The only values shared across tasks are routine tick messages: "overnight runner tick started run" (2 tasks) and "m10 series tick started run" (3 tasks) | Free text, not an identifier. Where it repeats, it repeats because the scheduler used the same log phrase, not because of a blocker or event. Grouping on it would turn log wording into recurrences |
| `run_id` | 8 distinct values, each on 1 task | Unique per run by construction, so it never groups across tasks. R4 could never fire |
| `task_id` | 7 distinct values | It is the task identifier itself, so each group holds one task by construction. R4 could never fire |
| `timestamp` | Per-event instants | Not a key. Equal timestamps across tasks would be coincidence |

So no field is both an event identifier and capable of meaningful
recurrence across tasks. Choosing one would be an invented semantic, and
the T1 brief says to stop and report in that case.

- **What the detector does.** It evaluates the blocker dimension only.
  Every scan reports the event dimension under `not_evaluated`, so a null
  result is not mistaken for a completed check. This is tested.
- **Escalation record.** This section is the escalation. The decision
  belongs to the parent/Founder, not to this fix round. The two options are:
  - retrieve the WP-04 passage (and revise the Specification to name the
    event key, its task association, and its comparable form), or
  - a Founder scope/acceptance amendment explicitly permitting the omission.

  Until one of those happens, AC-T1-1 is not met.

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
| `scripts/sie-detector.mjs` | 429 (397 at `b97dd08`) |
| `scripts/sie-detector.test.mjs` | 327 (287 at `b97dd08`) |
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

Fix round 1, run by the builder from the repo root on the uncommitted fix
tree just before committing:

- `node --test scripts/sie-detector.test.mjs`: **24 tests, 24 pass, 0 fail,
  0 skipped.** That is 22 original tests plus 2 new ones: the alias-refusal
  test (finding 2) and the R4 timestamp test (finding 3). The existing F-R4
  test also gained timestamp assertions.
- `npm test` (`node --test scripts/*.test.mjs`): **exit code 0; 113 tests:
  112 pass, 0 fail, 1 skipped.** The skip is the pre-existing one (Brief G5:
  "88/89, 1 pre-existing skip"). 89 existing + 24 detector = 113.
- `node scripts/status.mjs`: **exit code 0**. It prints "Genesis tasks: 15
  total" (blocked 1, completed 14). That count is unchanged, so the fixtures
  are not picked up as task records.

Original T1 (`b97dd08`), for reference: detector 22/22; `npm test` 111
tests, 110 pass, 1 skipped.
- The detector was **not** run against the operational `tasks/` or
  `events.jsonl`. Every run used SYNTHETIC fixtures, and output went to
  temporary directories only. No operational detector-candidate record was
  created (see Scope).

All results are **detector recognition on synthetic input**: test
mechanics verified on fixtures. They do not verify the system.

## Acceptance-criteria self-check (claims — the verifier decides)

Re-stated after fix round 1. The verifier's earlier verdict governs. These
are builder claims only.

| AC | Builder claim | Evidence the verifier can inspect |
|---|---|---|
| AC-T1-1 | **Not met — finding 1 open, escalated.** R4's event dimension is not implemented because no source names the event key (see "R4 events — why no key was chosen"). Otherwise: six branches, R1–R6, one per reconstructed rule, and no additional matching rule. Whether WP-04 itself has exactly these six rules cannot be checked (Spec §2 point 1, MISSING). | `RULE_BRANCHES` in `sie-detector.mjs`. Tests "AC-T1-1: exactly six rule branches…" and "…each rule builds candidates in exactly one place" (a source count of `makeCandidate('Rn'` = 1 per rule, 6 in total) |
| AC-T1-2 | **Met.** Every output is `record_type: "detector-candidate"` with exactly the DET-9 fields and a fixed note: "Not a failure, not an incident, not a runner-caused-failure verdict; no cause is determined". No `verdict`, `cause`, or `classification` field exists. | Test "AC-T1-2: every output is a detector candidate with only DET-9 fields…". `makeCandidate` and `CANDIDATE_NOTE` in the source |
| AC-T1-3 | **Addressed (finding 2 fixed; verifier to confirm).** The write guard now compares filesystem-resolved paths, so symlink aliases into a task-record directory are refused before anything is created. The boundary is stated in the module header (READ-ONLY BOUNDARY). The header states that the detector never modifies, reclassifies, backfills, renames, or deletes a source record, and never writes into `tasks/` or `events.jsonl`. It also states that creating SIE detector-candidate records is a separate act from reading Runner records (addendum refinement 6). The same boundary is stated in this report (Scope) and in the fixture README. | Tests: boundary text present; the only file write is one exclusive-create `writeFileSync` (no append, rename, delete, or truncate); fixture files are byte-identical (sha256) after scan and write; the writer refuses output inside a task-record directory, including the repo's `tasks/`; the writer refuses symlink aliases into those directories (new alias test); the CLI writes nothing without `--out` |
| AC-T1-4 | **Not met in full (event inputs unevaluated, finding 1).** For the blocker dimension and R6: R4 compares recorded blocker strings by exact equality (no trim, no case folding) and needs at least 2 distinct task ids. A missing `blockers` field, a blank key, a non-string key, or a non-list `blockers` gives "insufficient evidence: key missing or incomparable" and never a candidate. R6 fires only at a tick-index distance of 3 or more (distance 2 does not match). Each of the following gives "insufficient evidence: tick position not determinable": a missing last-progress tick, a tick not in the index, a tick repeated in the index, an empty index (current tick undeterminable), and no index at all. **Gap:** the R4 *event* dimension is not implemented (see Open items). | Tests "AC-T1-4 / F-R4…", "…F-R4-INS…", "R4 never groups blank or incomparable keys…", "R4 counts distinct tasks…", "…event dimension is recorded as not evaluated", "…F-R6…", "…F-R6-INS…", "with no recorded tick index…", "R6 ignores tasks that are not in_progress…" |
| AC-T1-5 | **Met.** F-R1: 1 R1 candidate. F-R2: 2 R2 (task_started control: 0). F-R3: 2 R3 (attempts-1 control: 0). F-R4: 1 R4 listing 3 tasks (control key: 0 R4); all 4 F-R4 tasks are blocked with blockers, so R1 also fires 4 times, which is asserted and documented. F-R5: 1 R5. F-R6: 1 R6 (distance-2 and distance-0 controls: 0). F-R4-INS, F-R6-INS, F-R6-INS-c: 0. F-DUP: the same ids on a repeat scan, and the second write creates 0 files. | Test "AC-T1-5: fixtures F-R1-F-R6 produce exactly the expected detector candidates…", "F-DUP…", "DET-8…". The table in `scripts/fixtures/sie-SYNTHETIC/README-SYNTHETIC.md` |

**DET-9 (finding 3): addressed.** R4 candidates now carry each contributing
task's recorded `created`/`updated`, together with its task id and source
pointer. Evidence: the F-R4 test and the "DET-9 / R4…" test.

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
   check. The verifier rated this a BLOCKER for AC-T1-1. The fix-round
   analysis is in "R4 events — why no key was chosen". **Unblocked by:**
   WP-04 retrieval plus a Spec revision that names the event key, or a
   Founder scope amendment permitting the omission. The decision belongs
   to the parent/Founder.
2. **WP-04 precondition (Spec §0.4, C-13, §18).** The coordinator
   disposition is now recorded verbatim in "Working-basis disposition".
   It still conflicts with the Specification text, which conditions
   dependent implementation on retrieval. That conflict is carried, not
   resolved, and the Specification was not edited.
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
| Time | One session | One session (original), plus one session for fix round 1 |
| Fix-round scope | Apply findings 2, 3, and 5; document finding 1; T1 files only; no Spec edit; no T2+ | Only `scripts/sie-detector.mjs`, `scripts/sie-detector.test.mjs`, and this report changed. No Spec edit, no fixture change, no T2+ work, no event key invented, no PR created, no merge |
| Resource/cost | $0; no new dependencies; local only; no network calls | $0. Node built-ins only (`node:crypto`, `node:fs`, `node:path`, `node:url`). Local only, apart from the instructed `git push` |
| Model/tool | No model restriction stated in the T1 brief | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Verdict rationale (builder's, not a verification verdict)

After fix round 1, the builder submits T1 **for re-verification** on the
working basis.

- Findings 2 and 3 are fixed, and finding 5's disposition is recorded.
- Finding 1 remains open. The verifier judged that R4 without the event
  dimension fails AC-T1-1. The builder agrees that the correct outcome is
  BLOCKED on a parent/Founder decision (WP-04 retrieval with a Spec
  revision, or a scope amendment), not an invented key.
- The builder does not assign a verification outcome.

## Verification method (to be run by the coordinator)

Per Brief §8.2, an independent verifier session (Codex, text-supplied,
read-only) receives the exact commit, the T1 Task Brief, and this report
labeled as claims. It should:

1. Read the full diff `c89c95e..<head>`, and confirm that only new files
   were added and that no existing file changed (`git diff --stat`,
   `git diff --diff-filter=M c89c95e..<head>` should be empty).
2. Re-run `npm test` and `node scripts/status.mjs` at that commit, and
   confirm 113 tests with 0 failures (1 pre-existing skip), including the
   24 detector tests. For the fix round, also read
   `git diff b97dd08..<head>`.
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
| AC-T1-3 | The module header comment; `writeCandidates` guards and `realResolve`; the six AC-T1-3 tests (including the alias-refusal test); this report's Scope section; the fixture README |
| AC-T1-4 | `ruleR4`, `ruleR6`, `INSUFFICIENT_R4`, `INSUFFICIENT_R6`; the nine AC-T1-4 tests; the F-R4-INS, F-R6-INS, and F-R6-INS-c fixtures |
| AC-T1-5 | The F-R1–F-R6 fixtures; the AC-T1-5, F-DUP, and DET-8 tests; the README table |
| DET-9 (R4 timestamps) | `ruleR4` `perTaskTimestamps`; the F-R4 test; the "DET-9 / R4…" test |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat c89c95e..<head>` |
