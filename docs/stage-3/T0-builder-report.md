# T0 Builder Report — SIE Specification

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified; verification is a separate step by an
independent verifier (Brief §8).

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T0 — SIE Specification; project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code, for both the original run and fix round 1. This is a **deviation** from the Task Brief's "Claude Code (Sonnet) via claude -p" — see Deviations. Evidence for the identity: the session's own model declaration, and the `Co-Authored-By: Claude Opus 5.5` trailer of commit `2ca332e`; both are builder-side, so they corroborate rather than independently establish the model. Claude Code CLI version: not available to the builder from inside the session. |
| Starting commit | `152fced` (main; branch `stage-3/sie-milestone-a` created from it, clean). Fix round 1 starts from `2ca332e`. |
| Resulting commit | Original: `2ca332e` ("Stage 3 T0: SIE Specification (consolidated draft)"). Fix round 1: the commit titled "Stage 3 T0 fix round 1: apply Codex findings 1-4, 6". The verifier must take the exact SHA from the branch head, not from this report. |
| Risk class | Governance (Brief §9 T0) — human review required |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record; not yet a Register amendment in the copy read) |

## Implementation summary

Wrote the single consolidated SIE Specification from the Prep draft, the
Correction Addendum (applied as governing corrections CR-01–CR-04), the
Register v1.2.1 (D1, D2, D6, D8, Register CR-01, CR-03, CR-09, ADR-01, ADR-03,
ADR-05, ADR-07, ADR-11, ADR-12, §5 F-36, Appendix A), the advisor direction
(as proposals), and the Stage 1/2 specs. WP-04 v1.1 was **not** available;
its points are flagged, not quoted. Every rule carries a provenance label.

## Fix round 1 (Codex verdict on `2ca332e`: NEEDS FIXES)

Applied only the verifier's stated fixes; no other task started.

| # | Finding | What changed |
|---|---|---|
| 1 | MAJOR — addendum CR-03 not fully applied | Spec §6.1: the recurrence-only alternative is removed from VALIDATED → REOPENED; that transition now requires `corrected_verdict_evidence` only, and recurrence-based reopening is FIXED/WATCH → REOPENED only. INC-3 rewritten to apply CR-03; the prep's recurrence-from-VALIDATED path is kept only as an **unapplied proposal requiring separate review, not operative**. §17 C-9 handling and §6.2 `corrected_verdict_evidence` row aligned; §3 lifecycle row updated. |
| 2 | MAJOR — provenance labels overstate sources (AC-T0-1) | VOC-3 relabeled `[P — Register CR-09 proposed resolution, tied to F-10 (OPEN)]` with the B1/F-10 caveat. INC-1 split: state vocabulary attributed to Register CR-09 as the required working vocabulary (F-10 OPEN); transitions attributed to prep §2.2 / AC-P2-1 as corrected by addendum CR-03 (proposals). WAT-5 split into a `[REF — prep §2.3; unverified]` baseline (full-window extension) and a `[P — addendum CR-01]` part (re-applying end-condition and exposure tests). §3 lifecycle row relabeled to match INC-1. The global warning in Spec §0.2 that every [REF] is unverified is unchanged. |
| 3 | MINOR — rule count | Corrected from 96 to **91**; counting method below. |
| 4 | MINOR — model/tool deviation | Recorded under Deviations with the coordinator's disposition; Identity and Limits tables corrected. |
| 5 | NOTE — entry deviation | No disclosure fix required. The coordinator's disposition is recorded in one line in Spec §0.4 and in §17 C-13. |
| 6 | NOTE — wording and check recording | Spec §1.3 "two independent local sources" → "two related local documents". Spec §2 point 6: the unsupported "zero records" sentence deleted. Repo checks in this report restated as builder-observed and not independently reproduced. |

## Files and components changed

All new, all under `docs/stage-3/`. No existing file modified.

| File | Lines | Content |
|---|---|---|
| `docs/stage-3/00-sie-specification.md` | 1,314 (was 1,296 at `2ca332e`) | The Specification (§0–§20) |
| `docs/stage-3/README.md` | 100 (unchanged in fix round 1) | Stage 3 index/status, Stage 2 README pattern |
| `docs/stage-3/T0-builder-report.md` | this file | Builder Report |

Fix round 1 changed only `00-sie-specification.md` and this report.

## Tests and results

**Builder-observed only. These checks were NOT independently reproduced by
the text-supplied verifier (Codex, read-only, no tools), and are not a
verifier PASS.** Docs-only change; the repo checks were run from the repo
root on the fix-round-1 working tree (edits present, before commit):

- `npm test` → exit 0; summary lines `tests 89`, `pass 88`, `fail 0`,
  `cancelled 0`, `skipped 1`, `todo 0` (the 1 skip is pre-existing, as
  recorded for Stage 1). Same result was observed for `2ca332e`.
- `node scripts/status.mjs` → exit 0; printed `Genesis tasks: 15 total`,
  `blocked: 1`, `completed: 14`, `Last event: 2026-10-29T16:49:44.060Z`, and
  the task list (the one blocked task, `overnight-blocked`, is pre-existing).
- CI: no CI run was observed by the builder for this commit; PR #36 checks
  must be read by the coordinator.

No test covers documentation content. The Specification's correctness cannot
be tested by these commands; it must be checked by reading (see verification
method).

## Acceptance-criteria self-check (claims — the verifier decides)

| AC | Builder's claim | Where to check |
|---|---|---|
| **AC-T0-1** Every rule traceable or marked [P]/[OPEN]; no provenance unstated | Verifier found **not met** on `2ca332e` (findings 1–2). **Builder claims the findings are now addressed:** CR-03 applied to the operative VALIDATED → REOPENED transition, INC-3 and C-9 (finding 1); VOC-3, INC-1, WAT-5 relabeled (finding 2). Labels defined in Spec §0.2. All 91 numbered-rule bullets (inventory below) carry an explicit label. Every [REF] is stated to be an unverified reconstruction. Needs re-verification. | Spec §0.2, §4.1 VOC-3, §6.1 INC-1/INC-3 + pseudocode, §7 WAT-5, §17 C-9 |
| **AC-T0-2** All eight §2.2 points quoted or explicitly flagged missing, gap named | Verifier found met via the flagging branch. Unchanged: **0/8 quoted, 8/8 flagged**, each with what is locally available, the named gap, and the task blocked. Point 6's unsupported "zero records" sentence removed. | Spec §2 (points 1–8 + summary table) |
| **AC-T0-3** §3.1 reconciliation stated in the Specification, not buried | Verifier found met. Unchanged except "two independent local sources" → "two related local documents" (§1.3). | Spec §1.3; §17 C-1; README |
| **AC-T0-4** No operational evidence claimed; no live loop authorized | Verifier found met. Unchanged. | Spec §0.1, §15, §20 |

**Numbered-rule inventory (corrects the earlier claim of 96).** Counted
identifiers: top-level Markdown list items in the Specification that begin
with a bold rule ID whose prefix is one of exactly these 17: `SC`, `ST`,
`VOC`, `DET`, `INC`, `WAT`, `EXP`, `VAL`, `LES`, `EVL`, `LOC`, `IDX`, `FXT`,
`PRO`, `RET`, `REU`, `CMP`, followed by `-` and a number. Not counted: the
named negative tests (`N-VAL`, `N-LES`, etc.), inline IDs such as TST-C,
table rows, pseudocode, and IDs only referenced in text.

- Count command (repo root):
  `grep -cE '^- \*\*(SC|ST|VOC|DET|INC|WAT|EXP|VAL|LES|EVL|LOC|IDX|FXT|PRO|RET|REU|CMP)-[0-9]+' docs/stage-3/00-sie-specification.md`
  → `91`.
- Per prefix (from the same pattern with `-o`): SC 13, ST 3, VOC 7, DET 9,
  INC 6, WAT 6, EXP 2, VAL 6, LES 8, EVL 8, LOC 4, IDX 6, FXT 2, PRO 5,
  RET 2, REU 2, CMP 2 = 91. This matches the verifier's count.
- Label check: `grep -nE '^- \*\*[A-Z]+-[0-9A-Z]+ [^\[]|^- \*\*[A-Z]+-[0-9]+\*\*' docs/stage-3/00-sie-specification.md`
  (a rule-ID bullet whose ID is not immediately followed by a `[` label) →
  no matches. WAT-5's bullet carries a combined label and each of its two
  sub-bullets carries its own.
- The earlier figure of 96 was wrong; the builder cannot reconstruct how it
  was produced.

## Known failures

- **T0 entry criterion not met:** Brief §9 T0 entry requires "WP-04 v1.1
  retrieved and available for verbatim quotation". It was not available. The
  Specification proceeds under AC-T0-2's "explicitly flagged as still
  missing" branch. This is a deviation from the stated entry criterion (see
  Deviations), not a hidden one.

## Remaining limitations

- No [REF] rule is verified against WP-04. The D1 preservation requirement
  ("Preserve existing SIE validation standards") cannot be demonstrated until
  WP-04 is quoted: §3 of the Spec preserves the standards *as reconstructed*,
  at least as strictly as Prep + Addendum state them.
- The Addendum is itself PROPOSED and "pending re-review"; the corrections it
  governs with are proposals.
- Source hashes were not computed by the builder.

## Outstanding issues (the §2.2 gaps and other open items)

**§2.2 verbatim gaps (all eight MISSING):**

1. Detector rules R1–R6 — exact wording/thresholds. Blocks T1.
2. Watch rule, watch start, "next 10 tasks" — three start readings kept open.
   Blocks final T2 computation; T6 window cases.
3. First-live-loop trigger — exact wording. Blocks T3.
4. Seven capabilities — names only available; no definitions at all.
5. **Seed corpus list — entirely absent locally.** Blocks T5 entirely. Not
   reconstructed or guessed.
6. Graphiti trigger — threshold is a range; operator grouping ambiguous.
   Blocks T7.
7. Whether WP-04 defines SIE Phases — local indications point to Phase 1 =
   A+B (conflict C-1).
8. Lifecycle, watch, exposure, recurrence, evidence standards — reconstructed
   only. Blocks T2, T6, and any D1-preservation claim.

**Conflicts surfaced (Spec §17, C-1–C-14),** notably: C-1 phase definition;
C-4 status-string case (prep lowercase "exact header string [REF]" vs.
Register CR-09 uppercase); C-5 lesson state CANDIDATE defined nowhere in
Prep/Addendum; C-7 seed corpus count; C-8 Graphiti grouping; C-13 T0 entry
criterion; C-14 prep field names vs. repo (`attempts`, no recorded tick
index found — R6 would emit "insufficient evidence" everywhere unless a tick
index within SIE-03 scope is identified).

**Open items carried as OPEN with owners (Spec §19):** H1–H6, SIE-01–SIE-07,
SIE-D2/D5/D6, F-36, F-14, F-10, the WP-04 retrieval itself, and one low-impact
T1 design question (SPEC-1).

## Explicit unverified areas (D6 addition)

- All [REF] content (WP-04 unavailable).
- The Stage 3 authorization wording (the builder saw the coordinator's
  statement of it, not a Register amendment).
- Whether the advisor direction's "verified" status is accurate (taken from
  the file's own header).
- Repo observations in Spec §5.3 were made by reading `scripts/events.mjs`,
  `scripts/task-state.mjs`, `tasks/schema.md`, and searching `scripts/` for
  "tick"; the scheduler's own tick store was not inspected (out of scope).

## Deviations and escalations

- **Deviation (entry criterion):** T0 proceeded without WP-04 text — escalated
  here and in Spec §0.4 / C-13 for the coordinator and Founder.
  **Coordinator disposition (fix round 1):** accepted for T0 as a draft (brief
  §2.2 permits unverified reconstructions until the corresponding
  implementation tasks start; AC-T0-2 permits flagging), on condition that
  the eight passages are retrieved and quoted before the dependent
  implementation tasks proceed on those points. Recorded in Spec §0.4 and
  C-13.
- **Deviation (model):** the Task Brief specified "Claude Code (Sonnet) via
  claude -p". The builder ran as Claude Opus 5.5 (`claude-opus-5-5`) via
  Claude Code, for the original run and for fix round 1. The original report
  named the model but wrongly said "No other deviations". **Coordinator
  disposition:** accepted for T0 — the Sonnet restriction was a coordinator
  Task Brief choice, not a Founder decision; the artifact is judged by
  independent verification, not by model identity; no cost or limit was
  exceeded (the run used the founder's existing Claude subscription, no new
  spending).
- **Escalation (phase definition, C-1):** Founder decision needed once WP-04
  is quoted; does not block Stage 3 exit (Spec SC-9).
- No other deviations. Two shell commands were declined by the permission
  layer during the session (a `sed -i` edit and a compound shell line); the
  same edits/checks were done with the Edit tool and single commands instead.
  No restriction was worked around through another channel.

## Scope-compliance statement (D6 addition)

- **T0 only.** No T1–T8 work was started: no detector code, record
  directories, fixtures, tests, seed records, or procedure files were
  created. Paths in Spec §11 are illustrative and not created.
- **Files changed:** only the three new files under `docs/stage-3/`. No
  existing repository file outside `docs/stage-3/` was modified (fix round 1
  edited only `00-sie-specification.md` and this report). CI, scripts, tasks, and existing
  docs untouched.
- **Not done:** no PR created, no merge, no deploy, no provisioning, no
  spending, no database access, no production contact, no Runner change, no
  new model provider/service/agent/infrastructure, no external transmission.
  Out-of-repo sources were read only.
- **No secrets** in any file or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session (plus one fix-round session) |
| Resource/cost | $0; no new services; local work only; no network calls | $0 new spending (founder's existing Claude subscription); no services; local only. The only network operation is the instructed `git push` of the branch. |
| Model/tool | "Claude Code (Sonnet) via claude -p" | Claude Code running Claude Opus 5.5 (`claude-opus-5-5`) — **does not match the brief; deviation recorded and accepted by the coordinator for T0 (see Deviations)**. No new provider, no subagents, no web access used. |

## Verdict rationale (builder's, not a verification verdict)

The builder considers T0's deliverables complete **as a draft for
verification**, with the WP-04 gap fully flagged rather than filled. The
builder does not assign a task verification outcome; that is the verifier's.
If the verifier or the Founder judges that AC-T0-2's "flagged" branch is not
acceptable without WP-04 text, the correct outcome is BLOCKED on WP-04
retrieval, not a rewrite with invented wording.

## Verification method (to be run by the coordinator)

Per Brief §8.2: an independent verifier session (Codex, text-supplied,
read-only) receives the exact commit on `stage-3/sie-milestone-a`, the T0
Task Brief, and this report labeled as claims. It should:

1. Read the full diff at the exact commit; confirm only `docs/stage-3/` files
   were added and nothing else changed.
2. Re-run `npm test` and `node scripts/status.mjs` at that commit.
3. Check AC-T0-1 by reading each rule's label; spot-check [DECIDED] quotes
   against Register §10 (D1, D2, D8), Register CR-01/CR-09/ADR-01/ADR-11, and
   the Brief §10/§11.
4. Check AC-T0-2: that no passage is presented as WP-04 wording, and that
   every [REF] traces to a Prep [REF] statement (no [REF] invented by the
   builder).
5. Check that addendum CR-01–CR-04 are applied (Spec §7.1, §6.1, §9.1/§14.2,
   §5.1) and that Prep text superseded by them is not carried as live rules.
6. Check AC-T0-3 (§1.3) and AC-T0-4 (§0.1, §15, §20).
7. Record source hashes, an independence declaration (Stage 2 spec 05 VI-9 as
   checklist), and skipped checks separately from passed ones.

Human review (Founder) is required for this Governance-class task.

## Evidence-to-acceptance mapping

| AC | Evidence the verifier can inspect |
|---|---|
| AC-T0-1 | Spec §0.2 label definitions; rule-ID bullets across §1–§16; fix-round-1 changes (§6.1, §4.1, §7, §17 C-9); count and label greps (above) |
| AC-T0-2 | Spec §2 points 1–8 and summary table; §0.4 |
| AC-T0-3 | Spec §1.3; §17 C-1 |
| AC-T0-4 | Spec §0.1, §10 EVL-7, §15 PRO-5, §20; README "No operational evidence and no live loop" |
| Docs-only / tests green | `git diff --stat 152fced..<head>`; `npm test`; `node scripts/status.mjs` |

## Supporting evidence

- Test output summarized above — builder-observed, not independently
  reproduced; re-run required by the coordinator or a tool-enabled verifier.
- Source documents as listed in Spec §0.3.
