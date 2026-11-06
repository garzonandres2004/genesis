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
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. Claude Code CLI version: not available to the builder from inside the session. |
| Starting commit | `152fced` (main; branch `stage-3/sie-milestone-a` created from it, clean) |
| Resulting commit | The commit on `stage-3/sie-milestone-a` titled "Stage 3 T0: SIE Specification (consolidated draft)". The verifier must take the exact SHA from the branch head, not from this report. |
| Risk class | Governance (Brief §9 T0) — human review required |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record; not yet a Register amendment in the copy read) |

## Implementation summary

Wrote the single consolidated SIE Specification from the Prep draft, the
Correction Addendum (applied as governing corrections CR-01–CR-04), the
Register v1.2.1 (D1, D2, D6, D8, Register CR-01, CR-03, CR-09, ADR-01, ADR-03,
ADR-05, ADR-07, ADR-11, ADR-12, §5 F-36, Appendix A), the advisor direction
(as proposals), and the Stage 1/2 specs. WP-04 v1.1 was **not** available;
its points are flagged, not quoted. Every rule carries a provenance label.

## Files and components changed

All new, all under `docs/stage-3/`. No existing file modified.

| File | Lines | Content |
|---|---|---|
| `docs/stage-3/00-sie-specification.md` | 1,296 | The Specification (§0–§20) |
| `docs/stage-3/README.md` | 100 | Stage 3 index/status, Stage 2 README pattern |
| `docs/stage-3/T0-builder-report.md` | this file | Builder Report |

## Tests and results

Docs-only change; the repo checks were run to confirm they stay green, on the
working tree with the three new files present (before commit):

- `npm test` → `tests 89, pass 88, fail 0, skipped 1, cancelled 0` (the 1 skip
  is pre-existing, as recorded for Stage 1).
- `node scripts/status.mjs` → ran to completion, printed the task board
  (15 tasks: 14 completed, 1 blocked — `overnight-blocked`, pre-existing),
  exit status 0.

No test covers documentation content. The Specification's correctness cannot
be tested by these commands; it must be checked by reading (see verification
method).

## Acceptance-criteria self-check (claims — the verifier decides)

| AC | Builder's claim | Where to check |
|---|---|---|
| **AC-T0-1** Every rule traceable or marked [P]/[OPEN]; no provenance unstated | **Claimed met.** Labels defined in Spec §0.2. All 96 rule-ID bullets (SC-, ST-, VOC-, DET-, INC-, WAT-, EXP-, VAL-, LES-, EVL-, LOC-, IDX-, FXT-, PRO-, RET-, REU-, CMP-) carry an explicit label; a mechanical search for a rule-ID bullet not followed by `[` returned no matches. Tables and pseudocode blocks carry labels in their headings or rows. Where one rule mixes provenance, each part is labeled. Every [REF] is stated to be an unverified reconstruction. | Spec §0.2, every section; grep `^- \*\*[A-Z]+-[0-9A-Z]+ [^\[]` |
| **AC-T0-2** All eight §2.2 points quoted or explicitly flagged missing, gap named | **Claimed met via the "flagged" branch: 0/8 quoted, 8/8 flagged**, each with what is locally available, the named gap, and the task blocked. | Spec §2 (points 1–8 + summary table) |
| **AC-T0-3** §3.1 reconciliation stated in the Specification, not buried | **Claimed met.** Spec §1.3 is a top-level subsection of §1 titled as the reconciliation; states both positions, the local evidence that WP-04 may define Phase 1 as A+B, what is adopted (Stage 3 exit = Milestone A, resting on D1), and leaves the phase definition as conflict C-1. | Spec §1.3; §17 C-1; README |
| **AC-T0-4** No operational evidence claimed; no live loop authorized | **Claimed met.** Stated in Spec §0.1, §15 PRO-5, §20, EVL-7 (evidence level: Structural at most), and README. | Spec §0.1, §15, §20 |

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
  here and in Spec §0.4 / C-13 for the coordinator and Founder. Recommended
  next step: retrieve WP-04 v1.1 from the planning conversation and quote the
  eight passages into a revision of the Specification before T1 starts.
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
  existing repository file was modified. CI, scripts, tasks, and existing
  docs untouched.
- **Not done:** no PR created, no merge, no deploy, no provisioning, no
  spending, no database access, no production contact, no Runner change, no
  new model provider/service/agent/infrastructure, no external transmission.
  Out-of-repo sources were read only.
- **No secrets** in any file or the commit message.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Resource/cost | $0; no new services; local work only; no network calls | $0; no services; local only. The only network operation is the instructed `git push` of the branch. |
| Model/tool | Builder: Claude Code; no new provider | Claude Code (Claude Opus 5.5) only; no subagents, no web access used |

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
| AC-T0-1 | Spec §0.2 label definitions; rule-ID bullets across §1–§16; label grep (above) |
| AC-T0-2 | Spec §2 points 1–8 and summary table; §0.4 |
| AC-T0-3 | Spec §1.3; §17 C-1 |
| AC-T0-4 | Spec §0.1, §10 EVL-7, §15 PRO-5, §20; README "No operational evidence and no live loop" |
| Docs-only / tests green | `git diff --stat 152fced..<head>`; `npm test`; `node scripts/status.mjs` |

## Supporting evidence

- Test output summarized above (re-run required by the verifier).
- Source documents as listed in Spec §0.3.
