# T6 Builder Report — Safety / negative tests, all six Group B

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8).

**The limit of these tests (EVL-7, AC-T4-3): passing on fixtures proves the
test works, not that any real incident is handled correctly.** Every result
below is "test mechanics verified on fixtures", never "system verified". No
input is an operational record. No validated lesson was created (LES-8), no
incident reached VALIDATED (VAL-6), no lesson was promoted to global
knowledge (LES-6/LES-7), no compounding change was made (CMP-1), no reuse
was demonstrated (REU-2), and no Group C test was designed as passable
(§14.3).

## Identity

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T6 — Safety / negative tests, all six Group B; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Starting commit | `4945536` (branch `stage-3/sie-milestone-a`; T7 complete, Codex PASS; PR #36 open, not merged) |
| Resulting commit | "Stage 3 T6: safety / negative tests, all six Group B (AC-T6-1..AC-T6-5)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch, not from this report |
| Risk class | **High-risk** (Brief §9 T6) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST |
| Specification | `docs/stage-3/00-sie-specification.md`, version 0.5-draft (§14.2 Group B, §8 VAL-1–VAL-6, §6.2, §7 watch, §9.1 LES-2–LES-4 + §9.2, §12 IDX-1–IDX-6, §16 RET-1/RET-2 + REU-1/REU-2 + CMP-1, §10 EVL-1–EVL-7, §2.9 DV-8, §1.4, §13 FXT-1/FXT-2, §14.3) |

## Scope

Brief §9 T6 only: all six Group B safety/negative tests (§14.2) with their
negative inputs, expected rejections, and failure conditions, including the
addendum's extra negative cases (incomplete watch windows, unverifiable
evidence links, staged-to-validated promotion, corrected-verdict handling).
No T0–T5, T7, or T8 work. This build changed no existing file. T2
(`scripts/sie-incident.mjs`), T4 (`scripts/sie-schema.mjs`), and T7
(`scripts/sie-lesson.mjs`) were read and imported by the tests, not modified.
The T5 seed records were read as fixture sources (descriptors quoted in the
test file); the Markdown files are not read by any module or test.

## What was built

### `scripts/sie-safety.mjs` — pure module, no file I/O, no network, no imports

It implements ONLY the refusal/downgrade functions that do not already
exist. N-VAL and N-LES need no new functions: the tests exercise them
through the existing T2/T4/T7 functions. One exception — a specified N-VAL
refusal no existing function enforces — is implemented as a thin named check
and stated explicitly below (S-T6-5).

| Function | Group B case | What it does |
|---|---|---|
| `refuseSeedValidation(descriptor)` | N-HIST (a)–(c) | Throws `SafetyRefusal` on every seed-validation attempt; never returns a validated seed. (a) merged historical fix → `SEED_FIX_NOT_VALIDATION`, naming "already-merged historical fix" + "no retroactive validation". (b) pre-record evidence → `SEED_PRE_RECORD_EVIDENCE`, naming EXP-2 §7.2 (a); any other evidence offered as exposure → `SEED_NO_EXPOSURE` (a seed has no watch window, so nothing can be in-window exposure). (c) relabel to VALIDATED → `SEED_NEVER_VALIDATED`. Takes a validation-attempt descriptor (S-T6-6); never reads seed Markdown files |
| `refuseReuseClaim(claim)` | N-REU (a)–(c) | Returns `{ outcome: 'REFUSED', reuse_demonstrated: false, … }` naming the violated rule: (a) staged lesson; (b) no task, or a task created primarily to produce a reuse metric; (c) outside applicability, or applicability never judged (S-T6-7). The clean case returns `{ outcome: 'NO_REFUSAL', reuse_demonstrated: false }` — NOT a reuse demonstration (S-T6-2). Designed against the proposed legitimate-task-only rule, assumption marked (`LEGITIMATE_TASK_ASSUMPTION`; DV-7, C-19 unverified) |
| `assessImprovementClaim(claim)` | N-EVAL | Returns `{ outcome: 'REFUSED' \| 'DOWNGRADED', improvement_claim_supported: false, claim: 'no improvement claim supported', … }`. Staged-lesson-only → REFUSED; unvalidated-incident-only → DOWNGRADED; no lesson → REFUSED (S-T6-1). A validated-lesson citation → REFUSED as a Group C guard (S-T6-8). No outcome ever supports an improvement claim |
| `checkGovernanceChange(change)` + `isRecordedFounderApproval(approval)` | GOV (a)–(c) | Returns `PASS` / `HELD_PENDING_FOUNDER_DECISION` / `REFUSED` / `NOT_GOVERNANCE_ADJACENT`. (a)/(b) governance-adjacent or scope-expanding changes without recorded Founder approval → HELD; with it → PASS naming the approval reference. (c) waiver by builder/verifier → REFUSED (S-T6-3). A recorded Founder approval is `{ recorded: true, by: 'Founder', reference: non-empty, date: valid }` (S-T6-4); missing/empty/ambiguous approval is never a pass. A waiver passes only on a recorded Founder approval granted by the Founder (S-T6-9). The function recognizes an approval; it never grants one |
| `refuseUnverifiableEvidenceLink(link)` | N-VAL (f) — thin named check | **The one gap found (stated explicitly).** T2's `exposureInWindow` refuses only the EMPTY-pointer case ("link cannot be followed to specific evidence (EVL-3)"). A NON-EMPTY but general pointer — whole repository, whole log file, directory, bare host, general claim — is counted as exposure by T2, although EVL-3 requires a specific record, event, commit, test result, or log entry and says a link that cannot be followed to the specific evidence is treated as missing. This thin check closes that gap: it throws `UNVERIFIABLE_EVIDENCE_LINK` for empty/placeholder/fixture/whole-repo/whole-log-file/directory/general-claim pointers, and returns `{ verifiable: true }` only for pointers naming a specific item (fragment/query, commit-hash-like segment, id segment, specific file, `:line`/`:entry` suffix). It is a SHAPE check only (S-T6-5): no I/O can follow a link |

No other N-VAL or N-LES refusal was missing. In particular, N-VAL (a)–(e)
and (g) are all enforced by T2 (`checkFixVerified`, `checkValidationEligibility`,
`transition`, `watchOutcome`, `annotateCorrectedVerdict`,
`recordFurtherRecurrence`), and N-LES (a)–(e) by T7 (`createValidatedLesson`,
`stageLesson`, `annotateSuperseded`) and T4 (`checkLessonStructure`,
`checkIndex`, `checkLessonJudgment`). N-LES (d) in-place promotion has no API
to refuse (S-T6-10): enforcement is the deep-frozen staged record (assignment
throws), `WRONG_STATUS`, and `STAGED_IN_SECTION_1`.

## Spec sections implemented

- §14.2 Group B — all six tests, all cases: N-VAL (a)–(g) incl. CR-01 (e),
  EVL-3 (f), CR-03 (g); N-LES (a)–(e) incl. staged-to-validated promotion
  (d) and LES-3 completeness (e); N-HIST (a)–(c); N-REU (a)–(c); N-EVAL;
  GOV (a)–(c).
- §8 VAL-1–VAL-6 (eligibility elements (a)–(c6) named in refusals; VAL-6: no
  incident reaches VALIDATED), §6.2 incident fields, §7 watch (WAT-1, WAT-5,
  CR-01, EXP-1/EXP-2), §9.1 LES-2–LES-5 + LES-8, §9.2 lesson fields
  (`non_applicability` non-empty for either kind, CR-02 (c)), §12 IDX-1
  (staged in Section 1 refused; staged in Section 4 consistent) + Section 5
  seed rule, §10 EVL-1/EVL-2/EVL-3/EVL-7, §16 REU-1/REU-2 + CMP-1,
  §2.9 DV-7/DV-8, §13 FXT-1/FXT-2, §14.3 (no Group C pass).
- §2.9 DV-8 / C-20: the tests assume NO grouping for WP-04 VAL-1/VAL-2 —
  stated in the test-file header and this report; they claim neither Group
  A/B satisfaction nor Group C deferral for WP-04 VAL-1/VAL-2.
- §2.9 DV-3 / C-16 OPEN: no result claims WP-04's two-user
  meaningful-exposure condition is satisfied.

## Group B case → function → test mapping

| Group B case | Enforcing function | Test name (failing input stated) |
|---|---|---|
| N-VAL (a) merged PR, no regression test | T2 `checkFixVerified`, `transition` FIXED→WATCH | "N-VAL (a) failing input: merged PR, no regression test — fix-verified fails naming the regression-test element, and FIXED -> WATCH is refused" |
| N-VAL (a) pass-before only, no failing-before (DV-5) | T2 `checkFixVerified` | "N-VAL (a) failing input: regression test that passes before the fix — no failing-before result (DV-5)" |
| N-VAL (b) regression test, zero exposure | T2 `checkValidationEligibility`, `transition` | "N-VAL (b) failing input: regression test present, zero exposure — eligibility fails naming the exposure elements" |
| N-VAL (c) exposure, no sufficiency judgment | T2 `checkValidationEligibility`, `transition` | "N-VAL (c) failing input: exposure present, no sufficiency judgment — eligibility fails naming c5" |
| N-VAL (d) everything except independent verification (D2 pending) | T2 `checkValidationEligibility`, `transition` | "N-VAL (d) failing input: everything except independent verification (D2 role pending) — only c3 fails" |
| N-VAL (e) window end not reached, non-empty exposure (CR-01) | T2 `checkValidationEligibility`, `watchOutcome`, `transition` | "N-VAL (e) [AC-T6-5] failing input: all elements present and non-empty exposure, but window end condition not reached (CR-01) — refused even with non-empty exposure" |
| N-VAL (f) unverifiable evidence link, empty pointer (EVL-3) | T2 `exposureInWindow`, `checkValidationEligibility` + new `refuseUnverifiableEvidenceLink` | "N-VAL (f) failing input: exposure link that cannot be followed to specific evidence — empty pointer is excluded by T2 naming EVL-3" |
| N-VAL (f) general-but-nonempty pointer (whole repo / log file / directory / claim) | NEW `refuseUnverifiableEvidenceLink` (S-T6-5 gap) | "N-VAL (f) failing input: general-but-nonempty pointer (whole repository / whole log file / directory / general claim) — T2 alone counts it, the thin check refuses it (S-T6-5 gap)" |
| N-VAL guard: fixture evidence alone (VAL-3) | T2 `exposureInWindow`, `checkValidationEligibility` | "N-VAL guard: fixture evidence alone never validates (VAL-3)" |
| N-VAL (g) corrected verdict as recurrence (CR-03) | T2 `annotateCorrectedVerdict`, `transition` | "N-VAL (g) failing input: a corrected verdict recorded as a recurrence — annotateCorrectedVerdict must NOT increment recurrence_count (CR-03)" |
| N-VAL (g) control: genuine recurrence increments | T2 `transition`, `recordFurtherRecurrence` | "N-VAL (g) control: a genuine further recurrence DOES increment recurrence_count" |
| N-VAL (g) VALIDATED + recurrence / corrected verdict (CR-03) | T2 `transition` | "N-VAL (g) failing input: recurrence evidence offered to reopen a VALIDATED record — refused; a corrected verdict reopens it WITHOUT incrementing the count (CR-03)" |
| N-LES (a) validated lesson, incident OPEN | T7 `createValidatedLesson` | "N-LES (a) failing input: validated lesson citing an incident in OPEN — refused" |
| N-LES (a) validated lesson, incident FIXED | T7 `createValidatedLesson` | "N-LES (a) failing input: validated lesson citing an incident in FIXED — refused" |
| N-LES (a) validated lesson, incident WATCH | T7 `createValidatedLesson` | "N-LES (a) failing input: validated lesson citing an incident in WATCH — refused naming validated_incident_status" |
| N-LES (b) validated lesson, staged source (LES-5) | T7 `createValidatedLesson` | "N-LES (b) failing input: validated lesson citing a staged lesson as source — refused (LES-5)" |
| N-LES (c) empty `non_applicability`, either kind | T4 `checkLessonStructure`, T7 `stageLesson` | "N-LES (c) failing input: lesson of either kind with empty non_applicability — schema rejection (§9.2, CR-02 (c))" |
| N-LES (d) staged-to-validated promotion | T7 `createValidatedLesson` (`WRONG_STATUS`), `annotateSuperseded`, T4 `checkIndex` (`STAGED_IN_SECTION_1`), frozen record | "N-LES (d) failing input: staged-to-validated promotion — setting a staged record status to VALIDATED in place is refused; moving its entry to Section 1 is refused" |
| N-LES (e) no complete LES-3 reference | T7 `createValidatedLesson`, T4 `checkLessonJudgment` | "N-LES (e) failing input: validated-lesson creation without the complete LES-3 validation reference — refused naming the missing elements (AC-T6-4)" |
| N-LES not refused: legitimate LES-2 staging | T7 `stageLesson` | "N-LES not refused [AC-T6-4]: legitimate staging under LES-2 stages successfully" |
| N-HIST (a) seed + merged fix only | NEW `refuseSeedValidation` | "N-HIST (a) failing input: validation of a seed record citing only its already-merged historical fix — refused (SEED-01)" |
| N-HIST (a) all seeds + SEED-SHA | NEW `refuseSeedValidation` | "N-HIST (a) failing input: every T5 seed record refuses validation by merged fix (SEED-01…SEED-10 + SEED-SHA)" |
| N-HIST (b) pre-record evidence as exposure | NEW `refuseSeedValidation` | "N-HIST (b) failing input: pre-record operational evidence offered as exposure — refused (SEED-02)" |
| N-HIST (b) operational evidence, no watch window | NEW `refuseSeedValidation` | "N-HIST (b) failing input: operational evidence offered as exposure for a seed record that has no watch window — refused (SEED-04)" |
| N-HIST (c) in-place relabel to VALIDATED | NEW `refuseSeedValidation` + T4 `checkRecordStructure` (seed) | "N-HIST (c) failing input: in-place relabeling of a seed record to VALIDATED — refused (SEED-03)" |
| N-HIST SEED-SHA | NEW `refuseSeedValidation` | "N-HIST failing input: SEED-SHA (UNVERIFIED CANDIDATE) refuses validation as well" |
| N-REU (a) reuse from staged lesson | NEW `refuseReuseClaim` | "N-REU (a) failing input: reuse claimed from a staged lesson — refused [legitimate-task-only assumption marked; DV-7/C-19]" |
| N-REU (b) reuse with no task | NEW `refuseReuseClaim` | "N-REU (b) failing input: reuse with no task — refused; there is no prescribed reuse task [REF, UNVERIFIED — DV-7, C-19]" |
| N-REU (b) manufactured reuse task | NEW `refuseReuseClaim` | "N-REU (b) failing input: reuse from a manufactured task created to produce a reuse metric — refused [legitimate-task-only assumption marked; DV-7]" |
| N-REU (c) reuse outside applicability | NEW `refuseReuseClaim` | "N-REU (c) failing input: reuse outside the lesson applicability — refused [legitimate-task-only assumption marked]" |
| N-REU clean case: no reuse demonstrated | NEW `refuseReuseClaim` | "N-REU clean case: no refusal fires — and still NO reuse is demonstrated (F-36 OPEN, REU-2)" |
| N-EVAL staged lesson only | NEW `assessImprovementClaim` | "N-EVAL failing input: improvement citing only a staged lesson — REFUSED" |
| N-EVAL unvalidated incident only | NEW `assessImprovementClaim` | "N-EVAL failing input: improvement citing only an unvalidated incident — DOWNGRADED to \"no improvement claim supported\"" |
| N-EVAL no lesson at all | NEW `assessImprovementClaim` | "N-EVAL failing input: improvement citing no lesson at all — REFUSED" |
| N-EVAL REFUSED vs DOWNGRADED distinct; Group C guard | NEW `assessImprovementClaim` | "N-EVAL: REFUSED vs DOWNGRADED are distinct, and neither ever supports an improvement claim (S-T6-1, S-T6-8)" |
| GOV (a) governance change, no approval → HELD; with approval → PASS | NEW `checkGovernanceChange` | "GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: governance change without recorded Founder approval — HELD pending Founder decision" |
| GOV (a) authorization / security-policy / first-product | NEW `checkGovernanceChange` | "GOV (a) [AC-T6-3: Founder approval is the only pass path] failing input: authorization, security-policy, and first-product changes without approval — HELD" |
| GOV (b) validated lesson + expansion, no approval → HELD; with approval → PASS | NEW `checkGovernanceChange` | "GOV (b) [AC-T6-3: Founder approval is the only pass path] failing input: change citing a validated lesson that expands autonomy / permissions / scope without approval — HELD" |
| GOV (c) waiver by builder / verifier | NEW `checkGovernanceChange` | "GOV (c) failing input: waiver or exception to a safety rule granted by a builder or verifier — REFUSED (never held, never passed)" |
| GOV silence never approval | NEW `checkGovernanceChange`, `isRecordedFounderApproval` | "GOV [AC-T6-3] silence is never approval: missing, empty, ambiguous, or non-Founder approval is never a pass" |
| GOV control: routine change | NEW `checkGovernanceChange` | "GOV control: a routine non-governance change is NOT_GOVERNANCE_ADJACENT — held for nothing, and granted nothing" |
| Structural: module purity | source inspection | "structural: sie-safety.mjs is a pure module — no file I/O, no network; evidence level stated (EVL-7)" |

## Files written (new files only)

- `scripts/sie-safety.mjs` — the four new refusal/downgrade functions plus
  the one thin N-VAL (f) check. Pure module, no file I/O, no network, no
  imports.
- `scripts/sie-safety.test.mjs` — 42 `node:test` tests, all six Group B
  tests, fixtures/draft records only, every fixture labeled SYNTHETIC,
  fixtures only in this file.
- `docs/stage-3/T6-builder-report.md` — this report.

No existing file was modified. `git status` shows only these three new files.

## Tests and results (builder-observed; re-run required by the verifier)

T6 suite alone:

```
node --test scripts/sie-safety.test.mjs
ℹ tests 42
ℹ pass 42
ℹ fail 0
```

Full suite:

```
npm test
ℹ tests 320
ℹ suites 0
ℹ pass 319
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
```

Baseline at the starting commit was 278 tests (277 pass / 0 fail / 1
pre-existing skip); the 42 new tests account for the increase to 320, with
the same 1 pre-existing root skip.

`node scripts/status.mjs` exits 0 (15 Genesis tasks listed; no change from
this build).

## Mutation check (builder-observed)

Eight single breaking edits, applied one at a time in a temp copy of the
repo (`/tmp/t6-mutation`, deleted afterwards), at least one per Group B
test; the T6 suite was re-run after each. Every mutation was caught — the
suite failed on each. Total failing-test hits across the eight mutations: 40
(the per-mutation counts below count the failing test plus its summary lines;
each mutation produced at least one genuinely failing test).

| # | Mutation (temp copy only) | Group B test | Result |
|---|---|---|---|
| M1 | `watchEnd` always reports `end_condition_reached: true` | N-VAL (e) | (e) test failed |
| M2 | `refuseUnverifiableEvidenceLink` passes every pointer | N-VAL (f) | (f) general-pointer test failed |
| M3 | `annotateCorrectedVerdict` increments `recurrence_count` | N-VAL (g) | (g) corrected-verdict test failed |
| M4 | `checkIndex` allows staged records in Section 1 | N-LES (d) | (d) promotion test failed |
| M5 | `refuseSeedValidation` returns a validated seed for a merged fix | N-HIST (a) | (a) SEED-01, all-seeds, and SEED-SHA tests failed |
| M6 | `refuseReuseClaim` returns NO_REFUSAL for a staged lesson | N-REU (a) | (a) test failed |
| M7 | `assessImprovementClaim` reports a staged-lesson claim as supported | N-EVAL | staged-lesson + REFUSED-vs-DOWNGRADED tests failed |
| M8 | `isRecordedFounderApproval` returns true for a missing approval (silence = approval) | GOV | (a), (b), (c), and silence tests failed |

## Acceptance-criteria self-check (claims — the verifier decides)

- **AC-T6-1** (each Group B test has a stated failing input whose acceptance
  would fail the test): every test name states its failing input, or a
  leading comment does; the mapping table above lists each. The mutation
  check (M1–M8) demonstrates the tests fail when the refusal is removed.
  Evidence: the 42 test names in the mapping table.
- **AC-T6-2** (no Group B test depends on operational data; fixtures/draft
  records only): all incident records are built with the T2 module from
  SYNTHETIC inputs (`INC-T6TEST-*`, `test-only://` pointers); lessons are
  T7-built SYNTHETIC literals (`LES-2026-101/102`); seed descriptors are
  quoted from the T5 draft records and the Markdown files are never read;
  GOV/REU/EVAL claims are inline SYNTHETIC objects. Evidence: the test-file
  header and the "structural" test; `git status` shows no record or INDEX
  file touched.
- **AC-T6-3** (GOV names Founder approval as the only pass path): the GOV
  test names carry "[AC-T6-3: Founder approval is the only pass path]";
  `checkGovernanceChange` returns PASS only on a recorded Founder approval
  and names its reference; silence/missing/empty/ambiguous/non-Founder
  approval never passes. Evidence: the five GOV tests, esp. "GOV [AC-T6-3]
  silence is never approval…".
- **AC-T6-4** (N-LES refuses a validated lesson from an unvalidated incident
  and without the complete LES-3 reference; legitimate staging not refused):
  the three N-LES (a) tests (OPEN/FIXED/WATCH), the N-LES (e) test naming
  `b_operational_exposure_in_window` and the judgment failure, and the
  "N-LES not refused [AC-T6-4]" staging-success test.
- **AC-T6-5** (N-VAL refuses validation before the watch window's end
  condition even with non-empty exposure): the N-VAL (e) test — nearly
  validated record, non-empty exposure, mid-window (`end_condition_reached:
  false`) → element `a_window_end_reached` fails, `watchOutcome` is
  `continue-watch`, transition refuses.

## Silent-spec decisions (for the coordinator to confirm or correct)

Each decision below is one the spec leaves open and this build had to make.
None decides an open finding.

- **S-T6-1 — N-EVAL outcome mapping.** The spec says "refuse or downgrade"
  without assigning outcomes. This build assigns: staged-lesson-only →
  REFUSED (LES-2 forbids citing a staged lesson as authority, so the basis
  itself is forbidden); unvalidated-incident-only → DOWNGRADED (the incident
  is real material but insufficient, so the claim is downgraded rather than
  refused); no-lesson → REFUSED (no basis at all is a refusal, not a
  downgrade). Basis: LES-2 + the N-EVAL wording. Both outcomes carry "no
  improvement claim supported", never a pass.
- **S-T6-2 — N-REU clean-case return.** The negative checks are necessary,
  not sufficient: a claim passing all three returns `{ outcome: 'NO_REFUSAL',
  reuse_demonstrated: false }` with a note that REU-1 judgment is OPEN
  (F-36) and no reuse is demonstrated (REU-2). Basis: the brief's "N-REU
  tests refusal; it demonstrates no reuse". Alternative considered and
  rejected: throwing on every claim — that would make the function unable to
  show the checks are discriminating.
- **S-T6-3 — GOV outcome mapping.** The spec says "refuse or hold" without
  assigning. This build assigns: governance-adjacent or scope-expanding
  change without approval → HELD_PENDING_FOUNDER_DECISION (it awaits a
  Founder decision); waiver by builder/verifier → REFUSED (the grant itself
  is void, not pending). Basis: GOV wording + Register ADR-09.
- **S-T6-4 — Recorded Founder approval shape.** The spec fixes no field
  shape. This build requires `{ recorded: true, by: 'Founder', reference:
  non-empty, date: valid }`. Anything else — missing, empty, ambiguous,
  granted by anyone else — is not approval. Basis: AC-T6-3 + ADR-09
  ("Silence and timeout never equal approval"). An unknown `kind` is also
  refused (`BAD_INPUT`): an unnamed kind is never passed.
- **S-T6-5 — N-VAL (f) thin-check specificity heuristic (the one gap
  found).** EVL-3 requires a specific record/event/commit/test result/log
  entry, but T2 enforces only the empty-pointer case. The thin check is a
  SHAPE check only (no I/O can follow a link): a pointer passes only when it
  carries a specific-item marker (fragment/query, commit-hash-like segment,
  numeric or id-prefixed segment, specific file, `:line`/`:entry` suffix),
  with the host segment excluded (so `github.com` does not count as a file).
  A general-looking pointer with a specific-shaped marker could still pass —
  the check is conservative on the refusal side only. Basis: EVL-3; the
  alternative (leaving the whole-repo case unenforced) would leave a
  specified refusal with no enforcement.
- **S-T6-6 — N-HIST descriptor shape.** Seed records carry no creation time
  and no incident lifecycle status (T5), so the function takes a
  validation-attempt descriptor `{ seed_id, corpus_item, status, attempt }`.
  Pre-record evidence is identified by an explicit flag/kind or by timestamp
  before the descriptor's `recorded_at`. Basis: the T5 seed-record form.
- **S-T6-7 — N-REU applicability is caller-judged.** The module cannot judge
  text applicability, so the claim carries `within_applicability: boolean`;
  a missing judgment is a refusal ("applicability not established"), never a
  pass. Basis: the spec gives no text-matching rule.
- **S-T6-8 — N-EVAL validated-lesson citation refused as a Group C guard.**
  Not a spec N-EVAL case; added so that an improvement claim citing a
  validated lesson can never pass through this function (EVA is Group C,
  Milestone B; LES-8: no validated lesson exists in Stage 3).
- **S-T6-9 — GOV waiver pass path.** A waiver passes only on a recorded
  Founder approval granted by the Founder; a bare `granted_by: 'Founder'`
  claim without the approval object is REFUSED. Basis: AC-T6-3 + ADR-09.
- **S-T6-10 — N-LES (d) has no API to refuse.** No function performs an
  in-place promotion, so there is no refusal function to write; enforcement
  is the deep-frozen staged record, `WRONG_STATUS`, and
  `STAGED_IN_SECTION_1`. No new function was invented for this case.

## What is NOT claimed

- No Group C pass (§14.3): no VAL, LES, REU, or EVA positive test is
  designed as passable; the N-EVAL validated-lesson case is refused, and the
  N-REU clean case demonstrates no reuse.
- No validated lesson created (LES-8): `createValidatedLesson` is exercised
  only as a refusal mechanism; the validated-lesson literals are hand-built
  SYNTHETIC inputs.
- No incident reaches VALIDATED (VAL-6): the VALIDATED-status literal is
  hand-built (status overridden + matching history entry), not produced by
  any validation path; the WATCH→VALIDATED transition is exercised only as a
  refusal.
- No reuse demonstrated (REU-2), no improvement claimed (N-EVAL returns
  "no improvement claim supported" on every path), no governance change
  approved — the GOV pass path only recognizes a recorded Founder approval;
  it never grants one.
- No grouping assumed for WP-04 VAL-1/VAL-2 (DV-8, C-20 OPEN); no claim
  about WP-04's two-user exposure condition (DV-3, C-16 OPEN); no prescribed
  reuse task invented (DV-7, C-19 OPEN).
- No open finding decided: F-36, F-10, F-14, F-21, C-8, C-16, C-19, C-20/DV-8,
  and D2 are all untouched. C-7 and C-15 stay closed (not reopened). No R4
  event key invented; no live loop started; no incidents manufactured; the
  spec was not edited.

## Builder-flagged items

- **The N-VAL (f) gap (S-T6-5).** T2's exposure filter treats any non-empty
  pointer as followable. The thin check in `sie-safety.mjs` closes the
  general-pointer case with a shape heuristic, but true followability still
  cannot be verified without I/O. If the coordinator wants stronger
  enforcement, the followability check belongs in a future task with a
  defined evidence-link format — not in this one.
- **N-VAL (a) is exercised at the FIXED→WATCH door.** A WATCH record cannot
  be built without fix verification (DV-2 Founder clarification, C-15
  CLOSED), so the merged-PR-alone refusal is the `FIX_NOT_VERIFIED` refusal
  naming the regression-test element, plus the `checkFixVerified` element
  naming. There is no WATCH record with a merged PR and no regression test
  to run `checkValidationEligibility` on, because such a record cannot exist
  through the mechanism.
- **Promotion by reused id.** A validated lesson reusing a staged lesson's id
  with no `supersedes_staged_id` field is refused in Stage 3 by the
  D2/LES-8 final refusal in `createValidatedLesson`, not by an id-reuse
  check (T4's structure check catches the reuse only when
  `supersedes_staged_id` is present). Checked, not a gap in Stage 3; flagged
  for any future stage where validated lessons can exist.
- **No mutation survived into the repo.** The mutation check ran in
  `/tmp/t6-mutation` (deleted afterwards); `git status` shows only the three
  new files.

## Verification method (to be run by the coordinator/verifier)

```
cd ~/workspace/repos/genesis
git status            # expect only the three new files, on stage-3/sie-milestone-a
git diff --stat       # expect no modifications to any existing file
npm test              # expect 320 tests, 319 pass, 0 fail, 1 pre-existing skip
node --test scripts/sie-safety.test.mjs   # expect 42 pass, 0 fail
node scripts/status.mjs   # expect exit 0
```

Re-run the mutation check by copying `scripts/` + `package.json` to a temp
directory and applying one breaking edit at a time (drop a refusal, accept a
failing input, treat silence as approval in GOV, let a corrected verdict
increment the count); each must fail the T6 suite. Delete the temp copy.
