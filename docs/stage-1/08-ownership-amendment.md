# 08 — Ownership and amendment rules

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 8 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-21, F-24, F-30 (full proposal below).

## Purpose

State who owns each kind of Genesis record and who may change it, so that no
record changes without an identifiable owner, a recorded reason, and the
right authority, and so that the Founder keeps control of strategic and
governance changes while routine upkeep does not need the Founder every time.

Register §1 principle 3: "The Founder retains strategic authority and
controls consequential permissions." Register §7 revision rules: "No
undocumented changes to approved decisions"; "Each revision records its
source decision"; "Each canonical document identifies its owner and version."

## Scope

**Covers:**
- Ownership of record types (project, decision, authorization, evidence,
  global knowledge, execution).
- Amendment rights: who may change what, and how (the F-30 proposal).
- The amendment record.

**Does not cover:**
- The canonical document ownership matrix between the planning documents
  (Register ADR-12, Proposed; F-24 Open). This spec refers to it; it does not
  adopt it.
- Delegated approval mechanics (F-21, Stage 2).
- Storage (F-14; spec 11).

## Requirements

- **OA-1 Every record type has a named owner.** Owner means the role
  accountable for the record's content being correct and authorized. *Test:*
  each record header names its owner (CF-1 in spec 07).
- **OA-2 Owner and writer are distinguished.** The role that owns a record's
  content and the role that physically writes it may differ. Example: the
  Founder owns decisions; Muse records them (spec 02).
- **OA-3 Every amendment is a recorded, attributable change.** Each amendment
  records: what changed (before/after or diff), who made it, under which tier
  and authority, the source decision or authorization, the date received, and
  the version amended. The Register's own amendments do this (approver, date
  "not backdated", exact wording, pre-amendment SHA-256, scope limits).
- **OA-4 History is preserved.** Amendments add; they do not erase.
  Superseded content is kept and labeled (DR-11, CF-3).
- **OA-5 No self-approval of amendments.** Whoever proposes an amendment does
  not approve it (Register §1 principle 6).
- **OA-6 Governance amendments get human review.** An amendment to decision,
  authorization, ownership or amendment rules is a governance change; D2
  requires "Human review is required for high-risk, security, governance, and
  first-product decisions."
- **OA-7 Silence is not consent.** No amendment takes effect by timeout or
  lack of objection (ADR-09).
- **OA-8 Execution records are amended only by their own rules.** Execution
  records (`tasks/*.json`, `events.jsonl`) change only through the Runner's
  transition rules and authorized writers (repo `tasks/schema.md`: "Only the
  orchestrator and the reconciler ... write files in `tasks/`"; events are
  "Appended (never rewritten)"). Register CR-06 separates evidence
  reconciliation (read-only) from execution reconciliation (needs separate
  authorization). Project-record amendment rights never extend to execution
  records.

## Ownership (proposed)

| Record type | Content owner | Writer / recorder | Basis |
|---|---|---|---|
| Decision records | Approver (Founder for all decisions recorded to date) | Muse | Register §10; B1–Stage 1 amendments |
| Authorization records | Founder | Muse | Register §1 principle 3; ADR-09 |
| Project record (identity, context, status) | Founder for strategic content; Muse for operational upkeep within tier D/R below | Muse | ADR-01; spec 01 |
| Evidence records | Preparer of the evidence (builder, verifier) for accuracy; immutable once recorded | Recorder files references | ADR-01; ADR-04; spec 06 |
| Global knowledge | Authorized knowledge owner (unassigned; spec 05) | Recorder | ADR-11 |
| Execution records | Runner (execution-state authority) | Orchestrator and reconciler per repo rules | Register §1 principle 5; `tasks/schema.md` |
| Canonical planning documents | Per ADR-12 matrix, once decided | — | ADR-12 (Proposed), F-24 Open |

## F-30 — Decision amendment rights

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-30 "Decision amendment rights". Recommended default:
  "Founder controls strategic/governance amendments; delegated amendments
  must be bounded". Required before: Stage 1. Status: Open (Register §5).
- **Basis:** ADR-09 (Unresolved) proposes three levels: routine actions
  pre-authorized within fixed scope; bounded delegated decisions by assigned
  human reviewers with written permissions; and Founder-only decisions —
  "strategic direction, governance changes, budget expansion, production
  risk, external commitments, and authority expansion". This proposal applies
  that structure to amendments.

### Tier F — Founder only

Amendments that only the Founder may make:

1. Any change to a decision's wording, status, amendments or conditions
   (D1–D8, B1, B2, and any later decision), including reversal.
2. Any change to an open finding's status (for example closing F-05, F-14,
   F-30).
3. Granting or widening any authorization (scope, targets, limits, budget,
   duration, executor), or removing an exclusion (spec 03).
4. The register's canonical status or adoption (B1).
5. Governance rules: these amendment rules, ownership assignments, the
   verifier model (D2) and its risk classes, the access model (spec 09).
6. Anything in ADR-09's Founder-only list: strategic direction, governance
   changes, budget expansion, production risk, external commitments,
   authority expansion.
7. Appointing or removing delegates (Tier D) and setting their bounds.

### Tier D — Bounded delegation (none exists yet)

Amendments a delegated human reviewer may make, only within a written
permission recorded as a Founder authorization (spec 03) that states the
delegate, the record types and projects covered, the allowed changes, and an
expiry:

- Narrowing an authorization (adding a limit, shortening expiry, removing a
  target).
- Operational updates to a project record inside a project the delegation
  covers (status, context facts), where no Tier F item changes.
- Approving entry of a global knowledge item, if the Founder appoints the
  delegate as knowledge owner (spec 05).

Every Tier D amendment is reported to the Founder and reversible by the
Founder. No delegate is appointed today (F-21 Open; the Register records
none), so Tier D is empty until the Founder appoints one.

### Tier R — Recorder (Muse) and other agents

Agents have **no authority to approve** any amendment. The recorder may:

- Record a Founder decision or authorization verbatim, with provenance (spec
  02 DR-1, DR-9; spec 03 AR-1).
- Mark text superseded *only* where a recorded decision supersedes it, citing
  that decision.
- Make clerical corrections that do not change meaning (typos, broken links,
  formatting), each labeled as a correction with before/after, delivered by
  pull request and verified per D2.
- Update operational fields that mirror evidence already recorded (for
  example "verification report: PASS, <ref>"), never acceptance itself.

Builders, verifiers and research agents may propose amendments in their
reports; they do not write governance records.

### Rules across all tiers

- A change whose tier is unclear is treated as Tier F (narrowest reading, AR-3).
- Safety stops are never delayed by amendment rules; the stop is recorded
  afterwards. (Proposed by analogy with D8, which says "never delay safety
  action" for Stage 5 measurement windows; the Register states no general
  rule.)
- An amendment takes effect only when recorded (OA-3) and, for governance
  records, after human review (OA-6). Under the Stage 1 authorization, merge
  to main is founder-only.

## Authority boundaries

Summarized by the tiers above. The Founder holds everything not explicitly
delegated. Muse coordinates and records but "does not own execution state"
(Register §1 principle 4) and does not approve. Runner owns execution records
(principle 5). Whether Muse and Runner are separate systems or roles is open
(D5).

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| OA-1, OA-2 | Each record header names owner and writer | Record headers |
| OA-3, OA-4 | Each amendment has the OA-3 fields; prior text preserved | Amendment entries; git history |
| OA-5, OA-6 | Amendment proposer ≠ approver; governance PRs show human review | PR review record; verification report |
| OA-7 | Each effective amendment links an explicit approval | Decision / authorization record |
| OA-8 | No project-record change touches `tasks/` or `events.jsonl` | Diff review |
| F-30 tiers | Each amendment states its tier; Tier D amendments cite a delegation record | Amendment entries |

## Open questions

1. Register ADR-12 (Proposed) assigns "Strategic mission and Founder
   decisions" to the North Star, while B1 adopted the Register "as the
   canonical record of founder decisions". Which governs founder-decision
   records? The builder does not resolve this (F-24 Open).
2. Should clerical corrections to *Founder decision wording* (for example a
   typo inside a quoted approval) be Tier R or Tier F? This proposal treats
   quoted approved wording as untouchable by the recorder (Tier F), because
   DR-9 requires exact quotation.
3. Who besides the Founder may act as human reviewer under D2 for governance
   PRs? The Register does not name anyone.

## Explicitly NOT decided here

- F-30 (proposal only), F-21, F-24.
- Any appointment of delegates or knowledge owners.
- Any change to D1–D8 or to any recorded authorization.
