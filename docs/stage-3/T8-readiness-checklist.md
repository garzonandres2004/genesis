# Stage 3 — First-live-loop readiness checklist (T8, SIE-P8)

> This checklist does NOT start the first live loop. Nothing in Stage 3
> starts the loop (spec §15, PRO-5), and this checklist authorizes nothing.
> Readiness is not authorization: this checklist records that drafts are
> complete and reviewed; whether the loop may start is a separate Founder
> decision, and no item below is marked as satisfied by this brief alone
> (prep AC-P8-1). The loop does NOT start automatically after November 5
> (AC-P8-2): it starts only when (a) the November 5 verdict has been issued
> and preserved, (b) SIE implementation has been explicitly authorized by
> the Founder, and (c) the WP-04 trigger is met — and then only on a
> separate authorization and an explicit start command (spec §15, PRO-4;
> spec §2 point 3, review note). The calendar does not grant permission.

Evidence level (spec §10, EVL-7): this checklist is Structural. Nothing
here is Operational or Outcome. Every fixture cited is SYNTHETIC.

## 1. November 5 verdict issued and preserved

- **Readiness:** COMPLETE — the verdict was issued and the evidence was
  preserved as a frozen record.
- **Evidence / pointer:** M10 PASS verdict, compiled 2026-11-05 ~10:00 MST
  (336 frozen ticks of 338 wall-clock ticks, zero runner-caused failures,
  3 of 3 tasks in one attempt each). Evidence package frozen at
  `~/workspace/goals/genesis-autonomous-engineering-platform/hidden_files/m10-evidence-preservation/`
  (MANIFEST.md; assembled 2026-11-05 ~17:55 MST, read-only, gaps included,
  nothing backfilled or reconstructed; verdict stated as "met under
  WP-02 v1.2a"). Founder decisions A (preserve the evidence as the frozen
  record) and B (adopt Register v1.2.1 as canonical) approved ~18:02 MST
  Nov 5; B2 (Stage V execution only, read-only and non-database) approved
  ~18:34 MST Nov 5.
- **What this checklist does NOT do for this item:** the verdict is a
  record of the M10 series, not an authorization of the SIE or of the
  first live loop. The verdict alone authorizes nothing.

## 2. SIE implementation explicitly authorized

- **Readiness:** COMPLETE — Stage 3 execution was explicitly authorized
  within a stated boundary, and the two later amendments are recorded.
- **Evidence / pointer:**
  - Stage 3 execution authorization, Founder approval ~09:40 MST Nov 6
    (tapped "Approve Stage 3", widget widget-70d06f3c). Boundary: brief
    §11 (Stage 3 execution only: SIE implementation + Milestone A
    demonstration; Milestone B, Stage S, Stages 4–7, Stage R, the first
    live loop, any merge, deploy, provisioning, spending, production
    contact, Runner change, new model provider, and database work all
    explicitly NOT authorized). Recorded in the Stage 3 execution log
    (`hidden_files/stage-3-execution-log.md`, line 4).
  - R4-events amendment, Founder approval ~10:39 MST Nov 6 (tapped
    "Resume Stage 3: R4-events open, exit on Milestone A", widget
    widget-a16b7b03). Recorded in spec §0.5 (a): R4-events carried as
    [OPEN]/not-evaluated; T1 accepted on the blocker half only.
  - DV-2 clarification, Founder decision ~12:56 MST Nov 6
    (AUTHORIZATIONS.md): two-door reading; C-15 CLOSED. Recorded in
    spec §0.5-draft revision note, §2.9 DV-2, and §17 C-15.
  - Register amendment text (Stage 3 execution authorization + R4-events
    amendment + DV-2 clarification) is DRAFTED, not applied:
    `hidden_files/register-amendment-stage3-DRAFT.md`. The Register is
    the Founder's master document; the parent applies the amendment.
- **What this checklist does NOT do for this item:** this checklist
  authorizes nothing. It records authorizations already given; it does not
  extend them, and it does not authorize the first live loop, any merge,
  or any work outside the §11 boundary.

## 3. H1–H6 decisions taken or explicitly deferred, with consequences

None of H1–H6 has been decided. All six are explicitly DEFERRED, each
with its consequence stated. This checklist decides none of them.

| ID | Status | Decision / deferral | Consequence of the deferral |
|---|---|---|---|
| H1 | DEFERRED [OPEN] | Demo failing test: runner task (recommended in WP-04 v1.1 [REF]) vs. orchestrator. Founder decision pending. | No live demo failing test runs in Stage 3; the demonstration uses fixtures only. A live demo failing test needs the Founder decision first (spec §19; prep §6). |
| H2 | DEFERRED [OPEN] | Reuse recognition rule: legitimate-task-only (no prescribed reuse task). Founder decision pending. | N-REU is designed against the legitimate-task-only rule as a marked [P] assumption (spec §14.2, N-REU; §19). No reuse is demonstrated in Stage 3. |
| H3 | DEFERRED [OPEN] | Sample-size threshold for validated learning: not fixed (baseline reference ≥5 guided + ≥5 unguided [REF]). Founder decision or review recommendation pending. | No sample-size claim appears in any Stage 3 artifact. No threshold is fixed by T8. |
| H4 | DEFERRED [OPEN] | Independent verification subject to D2. The D2 operational verifier decision is pending. | Evidence may be prepared but is NOT labeled independently validated. VAL-1 element (3) is recorded NOT SATISFIED — D2 role pending (spec §8, VAL-1; §19). No incident is labeled independently validated. |
| H5 | DEFERRED [OPEN] | Watch start (W-A / W-B / W-C; decision 5). Founder decision pending. | All readings are preserved; every watch computation is PROVISIONAL (WAT-2, WAT-4) and none is treated as final. If the Founder rules otherwise, the status machine and watch computations are reworked. |
| H6 | DEFERRED [OPEN] | Schema adequacy: structural checks in code + judgment with required judgment text. Founder decision pending. | Structural and judgment checks are kept distinct (IDX-6); neither substitutes for the other. Passing on fixtures proves the test works, not that any real incident is handled correctly. |

## 4. Detector, templates, procedure, schema test, seed records, and safety preparations reviewed

Each item below was reviewed by Codex (text-supplied, read-only verifier,
per brief §8.2). A Codex review is a textual review, not independent
execution; the coordinator's re-runs are coordinator-executed tests, not
D2 validation (VAL-1 element (3) stays NOT SATISFIED). Commit SHAs are
the heads the verdicts were given; the verifier takes the exact SHA from
the branch, not from this checklist.

| Item | Review evidence | Outcome |
|---|---|---|
| Detector (T1, `scripts/sie-detector.mjs` + `scripts/sie-detector.test.mjs`) | Codex round 3, on commit `eee9034`: NEEDS FIXES on the single R4-events blocker only; findings 2–6 FIXED, finding 7 FIXED. The blocker was then accepted by the Founder Amendment (§0.5 (a)): T1 accepted on the blocker half only. | REVIEWED, accepted on the blocker half only. R4-events [OPEN] — not hidden, not claimed. |
| Incident records, status machine, watch (T2, `scripts/sie-incident.mjs` + test) | **Current T2 verification basis: `f710b1a`, with code, tests, Codex textual PASS, and fresh independent verifier-session PASS on that same commit; verification records posted on PR #36.** This follows the Founder's same-commit rule (2026-11-06 ~14:27 MST: code, tests, and independent review on the SAME commit). At `f710b1a`: npm test 196 tests, 195 pass / 0 fail / 1 pre-existing skip; T2 suite alone 60 pass; Codex textual PASS (DV-2 verdict, see the DV-2 row); fresh verifier session `7fd1dceb` executed the tests itself in a fresh detached worktree at `f710b1a`, VERDICT PASS, no findings (PR #36 comment issuecomment-6696207062). The Codex review is a textual review; the verifier session is independent execution; neither is D2 validation (VAL-1 element (3) stays NOT SATISFIED) and neither is acceptance. *Historical:* Codex round 2 PASS — T2 complete, on commit `6f90c11` (npm test 165 tests, 164 pass / 0 fail / 1 pre-existing skip; T2 suite alone 52 pass). The `6f90c11` round-2 PASS is historical and is superseded as the current verification basis. | REVIEWED — PASS at `f710b1a` (same-commit basis). Acceptance remains the Founder's alone. |
| DV-2 fix-verified gate (T2, spec 0.5-draft) | Codex: **PASS — DV-2 clarification complete (spec + gate)**, on commit `f710b1a` (npm test 196 tests, 195 pass / 0 fail / 1 pre-existing skip; T2 suite alone 60 pass; PR #36 comment issuecomment-6694509713). This textual PASS is one leg of the current T2 verification basis at `f710b1a`; the independent-execution leg is the fresh verifier-session PASS at the same commit — see the T2 row above. C-15 CLOSED by the Founder clarification, not by this review. | REVIEWED — PASS (part of the T2 `f710b1a` basis, see T2 row). |
| Procedure (T3, `docs/stage-3/T3-procedure.md`) | Codex round 2: **PASS — T3 complete**, on commit `d4484e9` (npm test 165 tests, 164 pass / 0 fail / 1 pre-existing skip). | REVIEWED — PASS. |
| Schema + INDEX tests (T4, `scripts/sie-schema.mjs` + test) | Codex round 3: **PASS — T4 complete**, on commit `374928e` (npm test 188 tests, 187 pass / 0 fail / 1 pre-existing skip; T4 suite alone 23 pass). | REVIEWED — PASS. |
| Seed records (T5, `docs/stage-3/seed/` + `scripts/sie-seed.test.mjs`) | Codex round 2: **PASS — T5 complete**, on commit `e2e06b8` (npm test 233 tests, 232 pass / 0 fail / 1 pre-existing skip; T5 suite alone 37 pass). C-7 CLOSED by the §2 point 5 quotation (10 items + the truncated-base-SHA eleventh). | REVIEWED — PASS. |
| Safety / negative tests (T6, `scripts/sie-safety.mjs` + test) | Codex round 3: **PASS — T6 complete**, on commit `f4a380b` (npm test 325 tests, 324 pass / 0 fail / 1 pre-existing skip; T6 suite alone 47 pass). | REVIEWED — PASS. |
| Lesson staging + retrieval (T7, `scripts/sie-lesson.mjs` + test) | Codex round 3: **PASS — T7 complete**, on commit `4945536` (npm test 278 tests, 277 pass / 0 fail / 1 pre-existing skip; T7 suite alone 45 pass). | REVIEWED — PASS. |
| Milestone A demonstration (T8, this task) | Demo script run, exit 0; see `docs/stage-3/T8-demonstration-report.md` (regenerated in T8 fix round 1 at commit `f212662`, on the uncommitted fix-round tree). Codex round 1 on `f212662`: NEEDS FIXES (F-T8-1, F-T8-2, F-T8-3; no BLOCKER), addressed in fix round 1. Re-review of the fix-round commit, and the independent verifier session at that same commit, are the coordinator's steps, not claims made here. | DEMONSTRATED ON FIXTURES — re-review pending. |

Open items carried here, not hidden: R4-events [OPEN]; C-16 (DV-3,
"unrelated users" undefined — no validation may claim DV-3); C-19 (DV-7,
[REF] statements unverified); C-20 (DV-8 half OPEN — no grouping assumed
for WP-04 VAL-1/VAL-2; DV-9 second-recurrence threshold OPEN);
SIE-05 (first-live-loop fallback criteria, see §5); the D2 operational
model; F-36 (reuse judgment), F-10 (vocabulary), F-14 (record location),
F-16, F-21 (no delegate appointed), F-34 (concurrency 1); SIE-01–SIE-04,
SIE-06, SIE-07; decision 5 / H5 (watch start).

## 5. First-live-loop trigger stated

Spec §2 point 3 / §15 PRO-3, quoted from WP-04 v1.1 (retrieval
2026-11-06):

> "No failures are faked: the first live loop runs on the first real
> post-November-5 failure, or on a seed-docs inconsistency if no real
> failure occurs within 30 days."

- **SIE-05 [OPEN]:** the criteria for "seed-docs inconsistency"
  sufficient to open a live loop turn (as opposed to a documentation fix)
  are NOT specified. The fallback is listed here as stated in WP-04 v1.1,
  without elaborating its criteria (prep §6, SIE-05; spec §19). A Founder
  decision or review clarification is needed before the fallback is used
  operationally.
- The trigger being met does not start the loop by itself: the loop starts
  only on a separate authorization and an explicit start command (see the
  notice at the top of this checklist; spec §15, PRO-4/PRO-5).

## 6. Escalation path named

T3 procedure PROC-6 + spec §15 PRO-1 (`docs/stage-3/T3-procedure.md`,
PROC-6): a live loop turn escalates governance, security, material-risk,
authorization-change, and designated-gate items to Founder review. Silence,
delay, or unavailability is never approval (Register ADR-09). The
orchestrator escalates; the Founder decides. This path applies to a live
loop turn when one is separately authorized; naming it here starts no turn.

## Readiness vs. authorization (AC-P8-3)

- **Readiness** (what this checklist establishes): the November 5 verdict
  was issued and preserved; Stage 3 execution was authorized within the
  §11 boundary; H1–H6 are explicitly deferred with consequences stated;
  the detector, procedure, schema test, seed records, lesson staging, and
  safety preparations were reviewed as listed in §4; the trigger is stated;
  the escalation path is named. Milestone A is demonstrated on fixtures
  (see the T8 demonstration report).
- **Authorization** (what this checklist does NOT establish): the merge
  decision (PR #36 stays open and unmerged; the merge needs its own
  Founder approval after verification passes and the check is green);
  the D2 operational model; any decision on the open findings and
  decisions listed in §4; and the first-live-loop start. None of those is
  decided, authorized, or implied by this checklist.
- No item in this checklist is marked as satisfied by this brief alone:
  every item points at evidence or a decision that exists outside this
  brief, or is explicitly marked as deferred / pending a Founder decision.
