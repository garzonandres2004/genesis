# SEED-SHA — DRAFT seed record: UNVERIFIED CANDIDATE (truncated base SHA)

**DRAFT — draft location only.** The operational SIE record location is
decided with F-14, which is OPEN. Spec §11 LOC-1 is a working assumption and
the LOC-2 layout is illustrative. This file's location (`docs/stage-3/seed/`)
is a draft location only; it is not the operational location. Stage 3 task
T5 draft: not verified, not Founder-approved.

**Label: UNVERIFIED CANDIDATE (operator-class error).** "Candidate" here
means an unconfirmed seed-corpus item. It is not a detector candidate and not
a CANDIDATE lesson (spec VOC-7).

| Field | Value |
|---|---|
| seed_id | `SEED-SHA` |
| corpus_item | truncated-base-SHA item (prep §4.7: "UNVERIFIED CANDIDATE (operator-class error) [REF]") |
| status | historical observation |
| label | UNVERIFIED CANDIDATE (operator-class error) |
| classification | None. Not classified as an operator-class error, as a runner defect, or as anything else |
| membership in the ten corpus items | UNCONFIRMED |
| validation | NOT VALIDATED; not independently validated |
| incident record | None. A seed record is not an incident record (spec §6.2) and carries no incident lifecycle status |
| lesson | None |
| Milestone B | Never counts toward Milestone B |

This record is never a confirmed failure and never a confirmed runner-caused failure.

## Provenance

- Item description: prep §4.7, "UNVERIFIED CANDIDATE (operator-class error)
  [REF]", as quoted in spec §2 point 5. A prep [REF] label is the prep's
  reconstruction attributed to WP-04, not a WP-04 quotation (spec §0.2).
- The item is not one of the ten names in the WP-04 v1.1 seed corpus list as
  retrieved (spec §2 point 5, retrieval 2026-11-06).
- **Membership: UNCONFIRMED.** The prep's "ten … plus the truncated-base-SHA
  candidate" wording suggests an eleventh item, but this T5 draft records
  membership in the ten as UNCONFIRMED, per the T5 task brief. Spec
  0.5-draft §2 point 5 and §17 instead record conflict C-7 as CLOSED, with
  this item as an eleventh. This record does not decide C-7; the discrepancy
  is flagged in the T5 builder report for the coordinator and verifier.
- [BASE]: not asserted for this item (see the reconstruction caveat in spec
  §0.2).
- Date, source record, the affected task or claim, and every detail beyond
  the prep description: not in the retrieved text.

## Fix and validation statement (AC-T5-2)

Already-merged fixes are fixed, not validated; no retroactive validation is claimed.

Whether a fix for this item exists or was merged is not in the retrieved text.

## Hypotheses (kept separate; none adopted)

The operator-class-error hypothesis is separate from a runner-defect hypothesis.

- Hypothesis A — operator-class error: the prep's label for this item. It is
  recorded here as a hypothesis only.
- Hypothesis B — runner defect: kept as a separate hypothesis. Nothing in
  this record supports or rules it out.

Independent evidence is required before any classification.

Neither hypothesis is a reproduction-supported conclusion. No fact about the
historical event is recorded here beyond the prep description, because none
is in the retrieved text.

## Fixture (SYNTHETIC only, kept separate)

Any fixture for this item is SYNTHETIC-fixture-only and is kept separate from
this record (spec §13 FXT-1, FXT-2). The only F-SHA description is the spec
§13 F-SHA table row: a SYNTHETIC claim-input record with a truncated
37-character base identifier, labeled SYNTHETIC and UNVERIFIED CANDIDATE.
That row is a fixture design, not a description of the historical event. No
F-SHA fixture file exists in the repository at this draft, and this record
claims none. A fixture result never proves a real failure, a runner defect,
a fix, or a lesson (FXT-2).

## What it shows

- That the prep (§4.7) names a truncated-base-SHA item and labels it
  UNVERIFIED CANDIDATE (operator-class error).
- That the label is a hypothesis carried for diagnosis, not a classification.

## What it does not show

- It does not show that a truncated base SHA occurred in any real run, when,
  or with what effect: not in the retrieved text.
- It does not show an operator-class error, a runner defect, a fix, or a
  lesson. It is not a confirmed failure and not a confirmed runner-caused
  failure.
- It does not show whether this item is one of the ten corpus items
  (UNCONFIRMED).
- It is not an incident record and does not establish one. It may not be the
  sole basis of any incident validation, and it never counts toward
  Milestone B.
- No reproduction, exposure evidence, watch window, or independent
  verification exists for it in this record.

## Permitted use (WP-04 v1.1, quoted via spec §2 point 5)

> "Seed records are historical evidence, not validated incidents. They may not be used as the sole basis for a validated incident record. A seed record may be cited as evidence for a hypothesis or for a reproduction-supported conclusion, but it does not by itself establish a validated incident. Historical incidents cannot enter as validated incidents: they never count toward Milestone B. No incident is validated retroactively."
