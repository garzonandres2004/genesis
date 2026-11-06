# 02 — Decision register and approval status

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 2 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-07, F-14 (proposal below), F-24, F-30.

## Purpose

State what a Genesis decision register must record, and how approval status
must be shown, so that nobody can mistake a proposal for a decision or a
decision for a broader one than was given.

The problem this solves is recorded in Register CR-07: planning documents
carried "Approved direction" and "Founder-approved strategic decisions"
tables while being labeled proposed, without a decision record proving the
approval.

## Scope

**Covers:**
- Required content of a decision record and of the register as a whole.
- Approval status labels and how they may change.
- Where decision records are proposed to live (F-14, decision-record part).

**Does not cover:**
- Authorization records (scoped permission to act). They are a separate
  record type; see `03-authorization-record.md`. A decision may lead to an
  authorization, but they are not the same record (ADR-01 lists "Authorization
  record" separately from the project record's "decisions").
- Who may amend decisions (F-30; see `08-ownership-amendment.md`).
- The content of any decision. This spec records no new decision.

## Requirements

- **DR-1 One record per decision.** Each decision is recorded individually
  with "its decision ID, final wording, approver, date, and affected document
  versions" (Register §10, recording rule: "The same recording rule applies to
  any future decision"). *Test:* every decision entry has all five.
- **DR-2 Original recommendation preserved.** A decision record keeps the
  original recommendation unchanged and adds the decision as a separate dated
  entry; nothing in the recommendation text is overwritten (Register §10,
  "Founder decision records — 2026-10-30" preamble). *Test:* recommendation
  text is identical before and after the decision is recorded.
- **DR-3 Exact status labels (decision and queue items).** For decision
  records and Founder-queue items, status uses the exact labels the Register
  uses: APPROVED, APPROVED WITH AMENDMENTS, CONDITIONALLY APPROVED for decided
  items, and Open for undecided queue items (Register, 2026-10-30 amendment;
  Register §5). Qualifications go in the decision wording, not in new labels
  (Register, 2026-10-30 amendment: "Qualifications ... are recorded in the §10
  decision wording, not in alternative status labels"). This rule does not
  cover other Register items: ADRs carry their own statuses (e.g.
  Unresolved, Proposed, "Partially resolved"), and DR-4's §1 terms still
  apply. *Test:* no decision record or queue item carries a status outside
  this set; for example D5's "decision process only" scope is in its wording,
  its label is APPROVED.
- **DR-4 Approval terminology kept distinct.** The register distinguishes
  Founder-approved, historically demonstrated, proposed, unresolved,
  authorized, and blocked (Register §1 "Approval terminology"). An item
  asserted as approved without a decision record is shown as asserted, not as
  evidenced (CR-07).
- **DR-5 No silent upgrade.** "No proposed recommendation silently upgraded to
  approved status" and "No undocumented changes to approved decisions"
  (Register §7 revision rules 2–3). *Test:* every status change has a dated
  decision entry with approver.
- **DR-6 No inferred adjacency.** Approving one decision does not approve any
  adjacent decision (Register, every 2026-11-05 amendment: "No approval of any
  adjacent decision is inferred"). Each record states what it does *not*
  decide where confusion is foreseeable.
- **DR-7 Silence is not approval.** "Silence and timeout never equal approval"
  (Register ADR-09). A decision is recorded only on an explicit approval
  instruction from the approver.
- **DR-8 Dates are receipt dates, not backdated.** The approval date is the
  date (and time, where known) the approval instruction was received (Register
  amendments: "the date this instruction was received; not backdated").
- **DR-9 Exact wording quoted.** The approved wording is quoted exactly as
  presented to and approved by the approver, including the channel reference
  where one exists (the Register's 2026-11-05 amendments quote the widget id
  and button label).
- **DR-10 Version anchoring of amendments.** Each amendment to the register
  identifies the version it amends. The Register's current practice is to
  record the pre-amendment SHA-256 and line count (each 2026-11-05 amendment
  does this). *Test:* each amendment names the prior version's hash.
- **DR-11 Superseded text preserved.** Statements made untrue by a later
  decision are marked superseded and kept as history, not deleted (Register
  B1 amendment: superseded status statements "are preserved as the history of
  v1.2.1 as issued").
- **DR-12 Labels never renamed or renumbered.** Decision and finding IDs
  (D1–D8, F-01–F-37, CR-01–CR-12, ADR-01–ADR-12, B1, B2, E-V5-2) are
  permanent. A new decision gets a new ID; an old ID is never reused.
- **DR-13 Open items visible.** The register lists all open items so nothing
  is silently treated as decided (Register §10 "Remaining open items").
- **DR-14 Decisions are separate from execution.** A recorded decision
  authorizes no execution unless it says so and an authorization record exists
  (Register, 2026-10-30 amendment: "These approvals authorize no execution").

## Authority boundaries

- **Founder:** the only approver for the decisions recorded so far (Register:
  "Approver for all eight: Founder"; B1, B2, Stage DB, Stage 1 amendments).
  Adopting or changing the register's canonical status is a Founder decision
  (B1).
- **Muse / recorder:** may draft decision briefs with a recommendation and
  record a Founder decision verbatim with provenance. May not approve, may not
  change a status without a decision entry, and may not paraphrase approved
  wording in the record.
- **Builders, verifiers, research agents:** may cite decisions. Research
  agents "do not control project decisions" (ADR-06).
- **Delegated human reviewers:** ADR-09 proposes bounded delegated decisions
  with written permissions. None is recorded in the Register. Delegation is
  unresolved (F-21 Open). See the F-30 proposal in `08-ownership-amendment.md`.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| DR-1, DR-2, DR-9 | Inspect each entry for ID, wording, approver, date, affected versions; compare recommendation text before/after | Decision register |
| DR-3, DR-4, DR-12 | Scan for labels outside the canonical set and for renamed/reused IDs | Decision register; verification report |
| DR-5, DR-6, DR-14 | Diff review: every status change maps to a dated decision entry | Git history of the register (if F-14 proposal adopted) |
| DR-8, DR-10, DR-11 | Each amendment names the prior version hash and receipt date; superseded text still present and marked | Register amendment headers |

## F-14 — Project-record storage (decision records)

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-14 "Project-record storage". Recommended default: "Decide
  after Stage V". Required before: Stage 1 implementation. Status: Open
  (Register §5). ADR-01 (status Unresolved) leaves "The physical storage
  location ... undecided".
- **Timing:** Stage V is complete (Register, Stage 1 amendment, entry
  criteria; Brief). The default's precondition is therefore met. Stage 1 under
  the current authorization is spec work only, so no record store is created
  until F-14 is decided and its implementation is authorized.
- **Proposal, decision-record part** (full proposal in
  `11-records-separation.md`):
  - **Location:** decision records for a project live in that project's
    record area in the Genesis repo, proposed path
    `records/projects/<project-id>/decisions/`, separate from execution
    records (`tasks/`, `events.jsonl`).
  - **Format:** versioned Markdown, one file per decision (or one register
    file with one section per decision), each carrying the DR-1 fields, the
    preserved recommendation (DR-2), and a status line using DR-3 labels.
    Git history is the audit trail; amendments are new commits, never
    history rewrites.
  - **Ownership:** content owner is the approver (the Founder for every
    decision recorded to date). Muse is the recorder. Changes arrive by branch
    and pull request; changes to decision records are governance changes and
    get human review under D2; merge to main stays founder-only, as in the
    Stage 1 authorization.
  - **The canonical Register itself:** today it lives outside this repo. This
    proposal does **not** move it. Whether the Register is copied
    byte-identical into the repo (with its SHA-256 recorded), referenced by
    hash from the repo, or kept outside is a separate Founder choice (open
    question 1). Until the Founder decides, the out-of-repo Register remains
    canonical (B1).
- **Options considered and why not proposed:** a database (ADR-01: "Do not
  create a second task database merely to solve project-context persistence";
  D5: do not assume a storage product; repo `docs/architecture.md`: local
  Postgres is wiped by VM replacement and a managed Postgres is a new paid
  service); keeping all records only in the Founder's workspace files (not
  reviewable by PR, and not reachable by the verification flow D2 requires).

## Open questions

1. Should the canonical Register move into the repo, be referenced by hash,
   or stay where it is? (Founder; affects F-14.)
2. The Register uses several ID families: F-xx (queue), Dn (decision
   records), Bn (B1, B2), E-V5-2, and widget ids. The Register does not define
   a rule for issuing new IDs. Who issues them and in which family?
3. Register ADR-12 (Proposed; F-24 Open) gives "Strategic mission and Founder
   decisions" to the North Star and "Architecture decisions and unresolved
   items" to the Architecture & Decision Register. B1 adopted the Register "as
   the canonical record of founder decisions". These may conflict. The builder
   does not resolve it; see `08-ownership-amendment.md`.
4. The document-status convention (CR-07 field list) is still open (F-07;
   Register §10 adoption requirements). DR-4 follows CR-07 but does not
   decide F-07.
5. Does the register need a per-project register for each project plus a
   Genesis-level register, or one register? The Register is silent.
6. The Genesis repo is public (see `11-records-separation.md`, "Known
   risks"). Under the F-14 proposal, decision records stored in it would be
   public. Is that acceptable? The Register is silent.

## Explicitly NOT decided here

- F-14 (proposal only), F-07, F-24, F-30, F-21.
- Any decision's content or status. No D1–D8 wording is changed.
- Whether the Register moves into the repo.
- Any file layout beyond the proposed path names; any schema or tooling.
