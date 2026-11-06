# Stage 3 resume step 1b — DV-2–DV-9 spec revision: builder report

- **Builder:** Claude Code (Stage 3 resume step 1b builder), 2026-11-06.
- **Branch / base:** `stage-3/sie-milestone-a` at `8f3a1de` (clean at start).
- **Scope:** docs only. This revision applies the coordinator disposition
  "any divergence found on retrieval triggers a Specification revision +
  affected-task rework" to §2.9 DV-2–DV-9.
- **Status:** these are builder claims. They need independent review
  (Codex) before T2/T6 rely on them. Nothing here is a Founder decision.
- **WP-04 source:** every WP-04 quotation below comes from
  `wp04-v1.1-retrieval-2026-11-06.md` (orchestrator goal files). No WP-04
  text was invented.

## Files touched

| File | Change |
|---|---|
| `docs/stage-3/00-sie-specification.md` | Spec revision (sections below). Version bumped to 0.4-draft. |
| `docs/stage-3/T1-builder-report.md` | One phrase in the AC-T1-1 row (item 9). |
| `docs/stage-3/DV-revision-builder-report.md` | New: this report. |

No code, tests, CI, Runner or other files were touched.

## Spec changes, by section

Step-1 and T0 text is kept as history throughout. Each change is added as
a dated "Revision 0.4-draft" note, or as an explicit replacement where the
operative rule was tightened (DV-4, DV-5).

- **Header:** version line changed to "0.4-draft, 2026-11-06 (spec revision
  for DV-2–DV-9 …)".
- **§0.4 update:** a bullet summarising the per-DV outcomes.
- **§2 point 2 "Gap now":** DV-6 resolution note. The WP-04 quotation is
  unchanged.
- **§2 point 8 "Gap now" / "Blocks":** the step-1 sentences are marked as
  history, with a revision note listing each outcome.
- **§2 summary table:** the "Still open" column is updated for points 2
  and 8.
- **§2.9:** an intro revision note, and a dated 0.4-draft outcome appended
  to the Handling cell of DV-2 to DV-9. The Reconstruction column keeps
  the step-1 text so each divergence stays visible.
- **§3:**
  - ST-3 revision note.
  - Lifecycle row annotated with C-15.
  - Exposure row annotated with the DV-3 requirement that is not enforced.
  - Recurrence row aligned with WP-04's definition (DV-9).
  - Evidence/validation row updated for DV-4, DV-5 and DV-6.
- **§6.1:** FIXED/WATCH → REOPENED `recurrence_evidence` now records the
  task id, with a DV-9 note. INC-2 gains the recurrence definition.
- **§6.2:**
  - `regression_test`: fail-before AND pass-after.
  - `reproduction_evidence`: reproduced failure only.
  - `recurrence_count` and `recurrence_evidence`: cross-task semantics.
- **§7:** WAT-6 DV-9 note. In §7.1, `watch_outcome` comments (DV-6, DV-9)
  and a DV-6 paragraph after the pseudocode.
- **§8 VAL-1:** elements (1) and (2) tightened. A revision block covers
  DV-4, DV-5, DV-6, DV-3 (annotation) and DV-2 (annotation).
- **§9 LES-3:** the `regression_test` check now states fail-before AND
  pass-after (the §6.2 field as tightened).
- **§17:** intro revision note, and C-15 to C-20 updated.
- **§18:** T2 and T6 rows updated.
- **§19:** WP-04 row updated.
- **§20:** revision note listing what is and is not decided.

Not changed: INC-1, the status machine, §1.4, EXP-1/EXP-2, EVL-1–EVL-3,
the WAT-6 / `recurrence_count >= 2` threshold, every WP-04 quotation, and
every DV-7 [REF] statement.

**Grep sweep.** I searched for "reproduction analysis",
"passing regression test", "passing result post-fix", "regression_test",
"second recurrence" and "not resolved". Every remaining hit for the old
loose wording is in a history cell (the §2.9 Reconstruction column, the
§17 C-17 description) or in a revision note quoting the T0 text it
replaced.

## Per-DV resolution

| DV | Outcome | Reasoning | WP-04 text relied on |
|---|---|---|---|
| DV-2 | **OPEN — Founder ruling required (C-15)** | WP-04's order (fixed → validated → watched) and the Register / brief AC-T2-1 order (fixed → watch → validated) cannot both hold, and choosing between them is not a builder decision. INC-1, VAL-1 and the status machine are unchanged. Consequence recorded: T2 implements AC-T2-1's order with C-15 recorded, and is reworked if the Founder rules otherwise. | "Incident lifecycle: detected → investigated → fixed → validated → watched → learned → evaluated. … A validated incident enters watch." |
| DV-3 | **OPEN — Founder ruling required (C-16)** | WP-04's condition is recorded as an additional mandatory requirement that the design does NOT enforce. "Unrelated users" is not defined, and no Stage 3 validation may claim to satisfy it until it is defined and enforced. Annotations were added at VAL-1 (4) and the §3 Exposure row. Operative exposure rules and AC-T2-2 are unchanged. | "Meaningful exposure: the incident must have been exercised by at least 2 unrelated users in the live system." |
| DV-4 | **RESOLVED — tightened** | The "or documented reproduction analysis with its limit stated" alternative is removed from VAL-1 (1) and `reproduction_evidence`. Reason: D1 preservation. WP-04 is the authority and is stricter. | "Validation requires a reproduced failure, a passing test, and independent verification." |
| DV-5 | **RESOLVED — tightened** | VAL-1 (2) and `regression_test` now require fail-before AND pass-after. LES-3 checks that tightened field explicitly. Same reason as DV-4. | "A fix is implemented with a regression test that fails before the fix and passes after the fix." |
| DV-6 | **RESOLVED — conjunctive reading** | The watch closes toward eligibility only when the end condition is reached AND validated evidence is present; absence of recurrence alone is never sufficient. Why it weakens neither text: see the note below this table. | "Validated evidence during the window is sufficient for the watch to close; absence of recurrence alone is not validated evidence."; Milestone B "requires the full watch window"; "Milestone B cannot pass before the watch window elapses." |
| DV-7 | **No change — still OPEN (C-19)** | Every listed [REF] statement stays labeled UNVERIFIED. None is confirmed, contradicted or rewritten. A dated confirmation note was added to the DV-7 row. | — (no matching retrieved passage) |
| DV-8 | **OPEN (C-20)** | The retrieval does not say where WP-04 VAL-1/VAL-2 sit after v1.1 correction 1. T6's N-VAL tests must not assume a grouping. §1.4 is unchanged. | v1.1 correction 1 summary (retrieval §10 item 1), which lists Groups A/B/C without VAL-1/VAL-2 |
| DV-9 | **Counting definition RESOLVED (aligned); second-recurrence threshold OPEN** | See the notes below this table. | "Recurrence: 2 or more occurrences of the same blocker or event across 2 or more tasks." |

**DV-6, why the conjunctive reading weakens neither text:**

- It is stricter than or equal to WP-04's sentence. It is equal if
  WP-04's "sufficient" means "at window end". It is stricter if WP-04
  permits an early close, because the spec simply does not use that
  permission.
- It equals addendum CR-01.
- It is consistent with WP-04's Milestone B full-window text.
- Brief AC-T2-2, AC-T6-5 and VAL-1 (1) point the same way. I weighed them
  as supporting evidence, not as the decision.
- The earlier "CR-01 stricter or equal" claim is now qualified: it holds
  only relative to the watch-close sentence. The Milestone B full-window
  requirement stays intact and independently required.
- The resolution does not decide DV-2.

**DV-9, counting definition (resolved):**

- For counting, "a recurrence" is now WP-04's cross-task condition, with
  the original incident's occurrence counted as one (§3, INC-2, §6.1,
  §6.2).
- A post-fix occurrence is recorded evidence. It increments
  `recurrence_count`, but it is not by itself a recurrence.
- The first recurrence is therefore 2 occurrences across 2 distinct tasks
  (the original plus one, in a different task).
- No loosening: a same-task post-fix occurrence still blocks any "zero
  recurrence" claim and still supports FIXED/WATCH → REOPENED.

**DV-9, second-recurrence threshold (open):**

- WP-04 defines recurrence as a condition, not as a numbered event. The
  Register's "approved second-recurrence rule" is named but not stated,
  and the prep wording is unverified [REF] (DV-7). So the texts do not
  sustain a definite "second recurrence" threshold.
- Following the decision rule, I kept the existing threshold
  (`recurrence_count >= 2`, WAT-6, §7.1, AC-T2-5) unchanged and marked
  this sub-point OPEN.
- For event-type occurrences, "same event" depends on the [OPEN] R4 event
  key.

## What stays open, and what unblocks it

| Item | Unblocked by |
|---|---|
| DV-2 / C-15 lifecycle order | A Founder ruling. If it differs from AC-T2-1, T2's status machine is reworked. |
| DV-3 / C-16 "unrelated users" | A Founder ruling on its meaning for this platform, then enforcement in the design. Until then, no validation claims it. |
| DV-7 / C-19 unverified [REF] statements | The full WP-04 text, or a review confirmation. |
| DV-8 / C-20 grouping of WP-04 VAL-1/VAL-2 | The full v1.1 correction 1 text, or a review clarification. |
| DV-9 second-recurrence threshold | The statement of the Register CR-09 "approved second-recurrence rule", or a review clarification. Event-type recurrence also needs the R4 event key, which is [OPEN] under the Founder Amendment. |
| Resolutions of DV-4, DV-5, DV-6, DV-9 (counting) | Independent review of this revision. |

## AC-T1-1 item (T1 report)

**Applied.** In the AC-T1-1 row's "Current status (2026-11-06)" sentence,
"so the six rules are verified as WP-04 wording" became "so the six rules'
source wording is now quoted and checked against the retrieval;
implementation conformity remains unresolved". This is the
Codex-suggested framing (round-3 verdict, S5). It fits the row: the row is
about quotation and the six branches, and the new wording removes the
ambiguity Codex noted.

The very next sentence in the row still reads "What remains open is only
the R4 event-key sub-gap". Read with the new clause, "only" refers to the
quotation gaps, not to implementation conformity. It is left unchanged
because the brief permits only the one change in that file. A reviewer
may want to adjust it in a later pass.

## Test results

Run after editing, from the repo root, on 2026-11-06:

- `npm test`: tests 113, pass 112, fail 0, cancelled 0, skipped 1 (the
  pre-existing skip), todo 0. This is unchanged from the base.
- `node scripts/status.mjs`: exit 0. It printed "Genesis tasks: 15 total,
  blocked: 1, completed: 14".
- `git status`: only the three permitted files changed (two modified, one
  new).
