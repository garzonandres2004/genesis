# T2 Builder Report — Incident records, status machine, watch computation

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

**VAL-6 [DECIDED]: no incident reaches VALIDATED in Stage 3.** The
validation path is implemented as a mechanism only. Every test result below
is a mechanism check on SYNTHETIC input. None of it is a validation,
validated learning, or operational evidence.

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T2 — Incident records, status machine, watch computation; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. This is the builder's own declaration. It corroborates the identity but does not establish it independently. The T2 task brief named no model restriction |
| Starting commit | `525d26f` (branch `stage-3/sie-milestone-a`; step 1b fix round 1; PR #36 open, not merged) |
| Resulting commit | The commit titled "Stage 3 T2: incident records, status machine, watch computation (AC-T2-1..AC-T2-5)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch head, not from this report |
| Risk class | **High-risk** (Brief §9 T2: changes the record model the SIE's later decisions depend on) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST (R4-events [OPEN]; Stage 3 exits on Milestone A) |
| Specification | `docs/stage-3/00-sie-specification.md`, version 0.4-draft (§3, §6.1, §6.2, §7, §7.1, §7.2, §8, §2.9, §17) |

## Implementation summary

`scripts/sie-incident.mjs` is a dependency-free Node ES module with no
imports at all. It holds pure functions over plain in-memory incident-record
objects. It does no file I/O. Returned records are deep-frozen, so a record
cannot be edited in place.

| Spec item | Export(s) | What it does |
|---|---|---|
| §6.2 record model | `RECORD_FIELDS`, `createIncident(fields, creation)`, `validateRecord(record)` | Builds an OPEN record with exactly the 24 §6.2 fields. It sets `recurrence_count` to 0, empty `recurrence_evidence` and `corrected_verdict_evidence`, and `history[0]` (type `created`, reason, opener, date). `independent_verification` starts as `NOT SATISFIED — D2 role pending` (H4). A missing required field is refused with an `IncidentRefusal` (`INCOMPLETE_RECORD`) that names every missing field. Nothing required is defaulted. `validateRecord` checks an existing record: exact field set, valid status, status-dependent required fields, `recurrence_count` = number of recurrence entries, and status matching the last status-changing history entry |
| §6.1 INC-1 status machine | `STATES`, `TRANSITIONS`, `transition(record, to, opts)` | Pure: it returns a new frozen record and appends exactly one history entry (reason, evidence pointer, date). Every transition requires `reason`, `evidence` (pointer), and `date`. Each transition accepts only its own option keys. Anything else is refused, for example `validated` or `sufficiency_judgment` on OPEN → FIXED (the FORBIDS clause). OPEN → REOPENED is refused with a CR-03 error. Every other unlisted transition is refused, naming `from -> to` |
| INC-2 / INC-3 / CR-03 evidence split | `transition` (REOPENED branches), `annotateCorrectedVerdict`, `recordFurtherRecurrence` | Recurrence evidence goes only to `recurrence_evidence` and increments `recurrence_count`. Corrected-verdict evidence goes only to `corrected_verdict_evidence` and never increments the count. On FIXED/WATCH a corrected verdict is an annotation with no status change. VALIDATED → REOPENED accepts only `corrected_verdict_evidence`; `recurrence_evidence` there is refused (INC-3). The new history entry carries `supersedes: { history_seq, status: 'VALIDATED', annotation: 'SUPERSEDED', reason }`, and the earlier VALIDATED entry is left untouched |
| INC-4 separation | `promoteHypothesisToConclusion` | Adds a NEW conclusion entry citing the reproduction evidence and the hypothesis id. The hypothesis entry keeps its original fields unchanged and gains an `annotations` entry. Without reproduction evidence it is refused |
| VAL-1 evidence fields | `recordValidationEvidence` | Records `reproduction_evidence`, `regression_test`, `independent_verification`, and `exposure_evidence_link` on FIXED/WATCH records, with the previous value kept in the history entry |
| DV-9 counting | `evaluateRecurrence(occurrences)`, `evaluateRecordRecurrence(record, original)` | Exactly one original occurrence is required. Blocker keys compare by exact equality, as R4 does. The result reports, separately: `recorded_occurrences`, `distinct_tasks`, `cross_task_condition_holds`, `recurrence_exists`, `post_fix_occurrences_recorded`, and `zero_recurrence_claim_blocked` (true if any post-fix occurrence of any kind is recorded). Event-type occurrences go to `not_evaluated`. If the original is event-type, every verdict field is `null` |
| §7.1 watch | `watchWindow`, `watchEnd`, `exposureInWindow`, `watchOutcome`, `extendByFullWindow` | See "Watch computation" below |
| §8 VAL-1 | `checkValidationEligibility(record, watch, { sufficiency_judgment })` | Returns eight named elements, each satisfied or not with its reason, plus `failing`, `eligible`, `independently_validated: false`, `watch_rule`, and the DV-3 marker. An incomplete record returns `verdict: null`. `transition(…, 'VALIDATED')` calls it and refuses with every failing element named |
| WAT-6 / SIE-07 | `DEEPER_REVIEW_MARKER`, `deeperReviewStatus(record)` | When `recurrence_count` reaches ≥ 2, the history entry that recorded the occurrence carries the marker. `watchOutcome` returns `mandatory-deeper-review` |

### Watch computation (§7.1, AC-T2-4)

- **`watchWindow(fixMerge, firstPostMergeCi, fixPresence, recordCreation, reading, countingRule)`.**
  - `reading` must be `W-A`, `W-B`, or `W-C`; anything else is refused.
  - W-A starts at fix merge. W-B starts at the first post-merge CI run. W-C
    starts at MAX(fix presence, record creation).
  - Missing start evidence returns `started: false` with
    `message: "watch not started: missing <named> evidence"`. The named
    evidence is `fix-merge`, `first-post-merge-CI`, `fix-presence`,
    `record-creation`, or `fix-presence and record-creation`. A start is
    never assumed.
  - **Signature deviation (additive):** a sixth argument, `countingRule`, is
    required. Without it, the window result could not name the counting
    rule, and AC-T2-4 requires the rule in *every* result. The pseudocode's
    behavior is otherwise unchanged.
- **`watchEnd(window, taskSequence, countingRule, asOf)`.**
  - `day_limit` = start + 30 days.
  - `task_limit` = the timestamp of the 10th distinct task observed strictly
    after the start (and not after `asOf`). It is `null` if fewer than 10
    occur, and then the day limit governs.
  - `end_time` = MIN of the two. `governed_by` names which one governed.
  - `end_condition_reached` is true only when `asOf` is given and is at or
    after `end_time`.
  - It refuses a counting rule that differs from the window's.
  - `taskSequence` holds the tasks the caller selected under the named rule;
    the module does not choose a qualification (SIE-02 OPEN).
- **`exposureInWindow(window, evidence)`.**
  - It keeps only items with `is_operational === true` (strictly), a
    non-empty pointer, and a valid timestamp that is ≥ the window start, ≥
    record creation (EXP-2 under every reading), and ≤ `end_time` when known.
  - It excludes these kinds: `record-creation`, `fixture`, `synthetic`,
    `staged-lesson`, and `merged-pr`. It also excludes `synthetic: true` or
    `fixture: true` items, and any pointer naming "synthetic" or `fixtures/`.
  - Every exclusion is listed with its reason.
- **`watchOutcome(window, exposure, recurrenceCount, validationElementsComplete)`.**
  The checks run in exactly the §7.1 order:
  1. `>= 2` → `mandatory-deeper-review`.
  2. End condition not reached → `continue-watch`.
  3. Exposure empty → `extend-by-full-window`.
  4. Exposure present and elements complete (strictly `true`) →
     `eligible-for-validation-judgment`, with an "eligibility is not
     validation" note.
  5. Otherwise → `continue-watch`.
- **`extendByFullWindow(endResult)`.** WAT-5: a new full window starting at
  the previous `end_time`, with `window_number + 1`. `watchEnd` and
  `exposureInWindow` are then re-applied to it.
- **Every result** carries `reading`, `counting_rule`, `provisional: true`,
  `label: 'PROVISIONAL'`, and `undecided: ['H5', 'SIE-02']`. No code path
  produces any other label. Deciding H5 or SIE-02 would need a code change.

### Divergence handling (Spec §2.9 / §17, followed, not re-decided)

| Item | Handling in T2 |
|---|---|
| DV-2 / **C-15 OPEN** | Built to the brief's order, OPEN → FIXED → WATCH → VALIDATED (AC-T2-1). C-15 is recorded in the module header and here. The order is **not settled**. If the Founder rules for WP-04's "fixed → validated → watched", T2's status machine is reworked |
| DV-3 / **C-16 OPEN** | Not enforced and not defined. `DV3_MARKER` (`meaningful_exposure_wp04_two_user_condition: 'NOT ENFORCED — C-16 OPEN'`) is attached to every `exposureInWindow` result, to element `c4_meaningful_exposure`, to the eligibility result, and to the `eligible-for-validation-judgment` outcome. Element (4) is evaluated under the operative EXP-1/EXP-2 rules only. **No Stage 3 validation may claim to satisfy DV-3 until it is defined and enforced** |
| DV-4 RESOLVED | Element `c1_reproduced_failure` requires `reproduction_evidence.kind === 'reproduced-failure'` with a pointer. `documented-analysis` is refused with a DV-4 reason |
| DV-5 RESOLVED | Element `c2_…` requires `before.result === 'fail'` AND `after.result === 'pass'`, both with pointers. Pass-after alone is refused with a DV-5 reason |
| DV-6 RESOLVED | Eligibility needs (a) end reached AND (b) in-window operational evidence, conjunctively. `watchOutcome` returns `continue-watch` mid-window even with exposure and complete elements |
| DV-7, DV-8 OPEN (C-19, C-20) | Not touched. This report claims no WP-04 VAL-1/VAL-2 Group A/B row and does not treat them as Group C |
| DV-9 counting RESOLVED; threshold OPEN (C-20) | Counting follows the cross-task definition (`evaluateRecurrence`). The working threshold `recurrence_count >= 2` is **unchanged**. What a "second recurrence" means under cross-task counting is **not resolved** here |
| R4-events [OPEN] | Event-type occurrences are reported `not_evaluated` with `EVENT_NOT_EVALUATED`. No event key is defined; a test asserts the source contains none |

## Files written (new files only)

| File | Lines |
|---|---|
| `scripts/sie-incident.mjs` | 844 |
| `scripts/sie-incident.test.mjs` | 648 |
| `docs/stage-3/T2-builder-report.md` | this file |

No fixture files were added. Every test input is a SYNTHETIC record built
inline in the test file. No existing file was modified, including the
Specification, `scripts/sie-detector.mjs`, its tests, existing fixtures,
`tasks/`, `events.jsonl`, CI, and Runner scripts.

## Tests and results (builder-observed; re-run required by the verifier)

The builder ran these from the repo root on the uncommitted tree just before
committing:

- `node --test scripts/sie-incident.test.mjs`: **46 tests, 46 pass, 0 fail,
  0 skipped.**
- `npm test` (`node --test scripts/*.test.mjs`): **159 tests, 158 pass,
  0 fail, 1 skipped.** The skip is the pre-existing one. 113 existing + 46
  new = 159.
- `node scripts/status.mjs`: **exit 0**. It prints "Genesis tasks: 15 total"
  (blocked 1, completed 14), unchanged.

All results are **mechanism verified on synthetic input** (test mechanics
verified on fixtures). They do not verify the system, and they are not
validated learning (EVL-7: evidence level Component at most).

## Acceptance-criteria self-check (claims — the verifier decides)

| AC | Builder claim | Evidence the verifier can inspect |
|---|---|---|
| AC-T2-1 | **Met (order per brief; C-15 OPEN).** States are exactly the five. The transition table matches §6.1 as corrected by CR-03. REOPENED is reachable from FIXED, WATCH, and VALIDATED only. OPEN → REOPENED is refused, naming CR-03. The other 18 unlisted state pairs (self-transitions included), plus an unknown target from every state, are refused by name. Each transition is refused when its evidence is missing. A backward move without a reason or evidence pointer is refused | `TRANSITIONS`, `transition`. Tests "AC-T2-1: states are exactly…", "…happy path…", "…REOPENED is reachable…", "…OPEN -> REOPENED is refused…", "…every unlisted transition…", "…required evidence is missing", "…backward move…", "…OPEN -> FIXED forbids…", "…FIXED -> WATCH never assumes a start…" |
| AC-T2-2 | **Met as a refusal mechanism.** WATCH → VALIDATED always calls `checkValidationEligibility`. It refuses on an empty or missing link (`c6`), and before the end condition even when every other element is satisfied (`a`). It also refuses on: empty exposure; zero recurrence alone; a merged PR alone; fixture, synthetic, staged-lesson, merged-PR, or non-operational exposure; DV-5; DV-4; and H4. The DV-6 conjunction is tested in both directions. Because element (3) is NOT SATISFIED while D2 is pending, **no path reaches VALIDATED** (VAL-6) | `checkValidationEligibility`, `exposureInWindow`. The 9 tests prefixed "AC-T2-2" and the "VAL-1: eligibility check names every element…" test |
| AC-T2-3 | **Met.** The two evidence types sit in separate fields. Corrected-verdict evidence never increments `recurrence_count`. On FIXED/WATCH it is an annotation with no status change, and passing it to a REOPENED transition is refused. VALIDATED → REOPENED on recurrence evidence is refused (INC-3). On corrected-verdict evidence it succeeds, the prior VALIDATED entry is kept unchanged, and it is annotated SUPERSEDED in the new entry | `transition`, `annotateCorrectedVerdict`. The four tests prefixed "AC-T2-3" |
| AC-T2-4 | **Met; every computation is PROVISIONAL.** Every result from all five watch functions, across all three readings and the not-started case, names the reading and counting rule and is labeled PROVISIONAL. None contains "final". The source has no `provisional: false` and no `'FINAL'`. The W-C boundary cases (a) and (b), the missing-start messages, MIN(day, 10th task) in all three regimes, the exposure filter, the §7.1 outcome order, and WAT-5 extension are all tested | The eight tests prefixed "AC-T2-4" |
| AC-T2-5 | **Met as a mechanism; the procedure stays OPEN (SIE-07); the threshold's meaning stays OPEN (DV-9).** `recurrence_count >= 2` produces the `mandatory-deeper-review` outcome and the record's history-entry marker. Count 1 does not trigger it. The marker has exactly the keys `mandatory_deeper_review`, `rule`, `threshold`, `procedure` ("OPEN — SIE-07"), and `effect`. It has no conductor, steps, or outcome | `DEEPER_REVIEW_MARKER`, `addRecurrence`, `deeperReviewStatus`, `recordFurtherRecurrence`. The two AC-T2-5 tests and the `recordFurtherRecurrence` test |

Additional coverage required by the task brief:

- **DV-9:** 5 tests.
- **INC-4:** 2 tests.
- **Record completeness:** 2 tests.
- **Immutability/history:** 2 tests.
- **Read-only boundary / header statements:** 1 test.

## Open items / known gaps

1. **C-15 (DV-2) lifecycle order — OPEN, Founder ruling required.** T2 is
   built to AC-T2-1's order. If the Founder rules otherwise, T2 is
   reworked.
2. **C-16 (DV-3) "at least 2 unrelated users" — OPEN, Founder ruling
   required.** It is not enforced or defined. It is marked NOT ENFORCED
   everywhere exposure is evaluated. No validation may claim DV-3.
3. **C-20 (DV-9 threshold) — OPEN.** `recurrence_count >= 2` is kept as the
   working threshold. Its meaning under cross-task counting is not
   resolved. What unblocks it: the statement of the Register CR-09
   "approved second-recurrence rule", or a review clarification.
4. **R4-events [OPEN] (CR-04).** Event-type recurrence is not evaluated
   and never claimed. No event key is invented.
5. **H5 / SIE-02 — every watch computation is PROVISIONAL.** No reading
   and no counting qualification is adopted. The SIE-02 unqualified
   reading is exported as a named constant, `SIE02_UNQUALIFIED`, for
   callers to name. It is not adopted as the rule.
6. **Spec gap, flagged for review: no transition out of REOPENED.** §6.1
   defines none, so the module refuses every REOPENED → X. Without some
   way to record more evidence, `recurrence_count` could never reach 2 on
   one record, and WAT-6 / AC-T2-5 would be unreachable.
   `recordFurtherRecurrence` records a further post-fix occurrence on a
   REOPENED record as `recurrence_evidence` (+1), with **no status
   change**. It applies INC-2's "each post-fix new occurrence is recorded …
   and increments `recurrence_count`" and nothing more. It is refused on
   OPEN (no fix), FIXED/WATCH (which must reopen), and VALIDATED (INC-3).
   The reviewer should confirm this reading, or the Specification should
   define REOPENED's exits (for example REOPENED → FIXED on a new fix).
7. **Where the WAT-6 marker lives.** The brief asks for "exactly the §6.2
   fields" and also for a record flag. To satisfy both, the marker is
   carried by the history entry that recorded the triggering occurrence
   (part of the record, append-only). `deeperReviewStatus(record)` reads
   it. There is no 25th field.
8. **FIXED → WATCH requires a named `watch_window` computation.** The brief
   lists `fix_presence_evidence` and `record_creation_time`. §6.2 also
   makes `watch_start` and `watch_window` required for WATCH, so the
   transition requires a `watchWindow()` result. A not-started window is
   accepted and recorded as not started (WAT-2: never an assumed start).
   This is stricter than the brief's list, not looser.
9. **Shape conventions the Spec does not fix.** These are builder
   conventions, open to review:
   - `reproduction_evidence.kind` (`reproduced-failure` /
     `documented-analysis`);
   - `regression_test.before/after.result` (`fail` / `pass`);
   - exposure items `{ pointer, timestamp, is_operational, kind }`;
   - `recurrence_evidence` `{ pointer, task_id, reason, kind, key }`;
   - `detector_rule` manual form `{ rule: 'manual', reason }`;
   - the creation judgment (`opened_by`, `reason`,
     `hypotheses_empty_reason`) stored in `history[0]`.
10. **EVL-3 followability is checked only as "non-empty pointer".** The
    module cannot follow a link, because it does no I/O. Unflagged
    synthetic data whose pointer does not name "synthetic" or `fixtures/`
    would not be detected as synthetic. The strict `is_operational: true`
    requirement is the main guard.
11. **Corrected-verdict annotation scope.** It is allowed on FIXED/WATCH
    only, as §6.1 states. On OPEN and REOPENED it is refused, because the
    Spec does not define it there.
12. **Element (b) and element (4) use the same operative test** (non-empty
    in-window operational exposure), because the operative rules give
    element (4) no threshold beyond EXP-1/EXP-2 while DV-3 is unenforced.
13. **D2 role.** `D2_ROLE_STATUS = 'PENDING'` is a module constant. No
    injection path exists to mark it approved. Once the D2 role is decided,
    element (3) needs a real rule, and that is a code change. Even then the
    current branch reports NOT SATISFIED.

## Explicit unverified areas (D6 addition)

- Whether WP-04 v1.1 orders validation before watch (C-15). If it does, the
  machine is wrong.
- Every [REF] content item the module encodes (WAT-1 30-days/10-tasks
  matches the quoted text; WAT-5 full-window extension and WAT-6 stay [REF],
  UNVERIFIED — DV-7/C-19).
- The test results above were observed by the builder and have not been
  independently reproduced.

## Deviations and escalations

- **Additive signature deviation:** `watchWindow` takes a required sixth
  argument, `countingRule`, and `watchEnd` takes an optional fourth, `asOf`.
  The reasons are AC-T2-4 (every result names the counting rule) and the
  need to decide "end condition reached" without assuming a current time.
  §7.1's behavior is unchanged.
- **Return shape:** for a missing start, the §7.1 string appears exactly as
  `message` inside a result object, so that the result can also carry the
  reading, counting rule, and PROVISIONAL label (AC-T2-4).
- **Escalations:** open items 1–3 (Founder/review rulings) and 6 (a spec
  gap reported, with the narrow mechanism used, for review).
- **Permission prompts during the session.** Three compound shell commands
  needed approval: a `cd && git …` line, a multi-command survey line, and a
  test/status line. Each was replaced by single commands or dedicated
  tools. Nothing was worked around through another channel.

## Scope-compliance statement (D6 addition)

- **T2 only.** No T3–T8 work was done: no procedure, schema/INDEX tests,
  seed records, Group B test suite, lesson staging, or demonstration.
- **New files only:** the module, its tests, and this report.
- **Read-only boundary.** The module has no imports and does no file I/O.
  It never touches Runner source records, `tasks/`, or `events.jsonl`. It
  creates no operational record directory and writes no incident records
  (F-14 OPEN). Tests run on in-memory SYNTHETIC records only.
- **Not done:** no PR opened or closed, no PR comment, no merge, no deploy,
  no provisioning, no spending, no database, no production contact, no
  Runner/CI change, no new dependency, provider, server, or agent, no live
  loop, and no manufactured incident. No open finding (F-36, F-14, F-10,
  F-16, F-21, F-34) and no D2 operational model was decided. There were no
  network calls apart from the instructed `git push`.
- **No secrets** in any file, log, or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Scope | New files: module, tests, optional SYNTHETIC fixtures, this report; no Spec edit; no detector change | Module, tests, and report only. No fixtures, no Spec edit, no existing file changed |
| Resource/cost | $0; no dependencies; local only | $0. No imports at all; the tests use Node built-ins only. Local only, apart from `git push` |
| Model/tool | No restriction stated | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Verdict rationale (builder's, not a verification verdict)

The builder submits T2 **for verification**. AC-T2-1–AC-T2-5 are claimed met
as mechanisms. AC-T2-1 is met to the brief's order, with C-15 open.
AC-T2-2 is met as refusals; VALIDATED is unreachable by design while D2 is
pending. AC-T2-4 is met with every computation PROVISIONAL. AC-T2-5 is met
as a mechanism, with SIE-07 and the DV-9 threshold open. Open item 6 (the
REOPENED exit gap) is the point most likely to need a reviewer judgment.
The builder does not assign a verification outcome.

## Verification method (to be run by the coordinator/verifier)

1. Read the full diff `525d26f..<head>`. Confirm that only these three new
   files were added: `git diff --stat 525d26f..<head>`, and
   `git diff --diff-filter=M 525d26f..<head>` should be empty.
2. Re-run `npm test` and `node scripts/status.mjs` at that commit. Expect
   159 tests: 158 pass, 0 fail, 1 pre-existing skip, including the 46 T2
   tests. `status.mjs` should exit 0 with 15 tasks.
3. Read `scripts/sie-incident.mjs` against Spec §6.1 (transition block),
   §6.2 (field table), §7.1 (pseudocode, branch order), §7.2, and §8 VAL-1,
   rule by rule. Check AC-T2-1–AC-T2-5 against the code, not only the tests.
4. Confirm there is no path to VALIDATED (element `c3` is unconditional
   while `D2_ROLE_STATUS === 'PENDING'`). Confirm there is no
   non-PROVISIONAL watch result. Confirm no R4 event key is defined.
5. Judge open items 6–9 (the REOPENED exit gap, marker location, the
   FIXED → WATCH window requirement, and the shape conventions).
6. Record source hashes, an independence declaration (Stage 2 spec 05
   VI-9), and skipped checks separately from passed ones.

## Evidence-to-acceptance mapping

| AC | Evidence |
|---|---|
| AC-T2-1 | `STATES`, `TRANSITIONS`, `transition`, `refuseUnknownOpts`; the 9 "AC-T2-1" tests |
| AC-T2-2 | `checkValidationEligibility`, `exposureInWindow`, the `WATCH>VALIDATED` branch of `transition`, `validateRecord` (in-place upgrade), `deepFreeze`; the 9 "AC-T2-2" tests and the "VAL-1" test |
| AC-T2-3 | REOPENED branches of `transition`, `annotateCorrectedVerdict`, `addRecurrence`; the 4 "AC-T2-3" tests |
| AC-T2-4 | `watchRule`, `watchWindow`, `watchEnd`, `exposureInWindow`, `watchOutcome`, `extendByFullWindow`; the 8 "AC-T2-4" tests |
| AC-T2-5 | `DEEPER_REVIEW_MARKER`, `addRecurrence`, `deeperReviewStatus`, `recordFurtherRecurrence`, `watchOutcome` branch 1; the 2 "AC-T2-5" tests and the `recordFurtherRecurrence` test |
| DV-9 / R4-events | `evaluateRecurrence`, `EVENT_NOT_EVALUATED`; the 5 "DV-9" tests |
| INC-4, completeness, immutability, boundary | `promoteHypothesisToConclusion`, `createIncident`, `validateRecord`; the corresponding 7 tests |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat 525d26f..<head>` |

## What is NOT claimed

- **No operational incident.** No incident record was created on real data,
  and no record was written anywhere.
- **No validation.** No incident reached VALIDATED (VAL-6). The one
  VALIDATED-status object in the tests is a SYNTHETIC hand-built literal,
  used only to exercise VALIDATED → REOPENED mechanics. It was not produced
  by the validation path, which refuses.
- **No Milestone B claim**, no Group C test, no validated lesson, and no
  validated learning.
- **No live loop** was started or run.
- **No R4 event evaluation.** Event-type recurrence is `not_evaluated`.
- **No DV-3 satisfaction.** WP-04's two-user condition is NOT ENFORCED
  (C-16).
- **No settled lifecycle order.** The order follows AC-T2-1 with C-15 OPEN.
- **No final watch computation.** Every computation is PROVISIONAL under
  H5 and SIE-02.
- **No resolution** of the DV-9 second-recurrence threshold, SIE-07, DV-7,
  or DV-8.
