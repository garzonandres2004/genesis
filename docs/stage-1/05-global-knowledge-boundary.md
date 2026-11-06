# 05 — Global knowledge boundary

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 5 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related open findings:** F-23 (Global lesson promotion, required before
  Stage 6 design), F-36, F-37 (decided as D8).

## Purpose

Define what may count as Genesis-wide (global) knowledge, what it must carry,
and what must never enter it, so that reusable principles can be shared
without carrying one project's private data or unvalidated lessons into every
other project.

Register ADR-01 defines global knowledge as "validated reusable principles
with provenance and applicability limits", and requires it to be "separated
from project-specific context".

## Scope

**Covers:**
- What global knowledge is and is not.
- Minimum content of a global knowledge item.
- The entry rules at the boundary (requirements only).

**Does not cover:**
- The promotion procedure. Register ADR-11 proposes a six-step process; it is
  Unresolved and F-23 is Open, required before Stage 6 design. This spec does
  not adopt it.
- SIE lesson states and transitions (Register CR-09; governed by the SIE
  Specification, which is approved in principle only per the Brief).
- Storage or retrieval mechanism.

## Requirements

- **GK-1 Global knowledge is validated, reusable, and bounded.** A global item
  states the principle, its provenance, and its applicability limits (ADR-01).
  *Test:* no global item lacks any of the three.
- **GK-2 Nothing enters automatically.** "Project lessons must never
  automatically become global rules" (ADR-11). "SIE cannot automatically
  classify incidents or promote lessons" (Register §1 principle 8). *Test:*
  every global item has a recorded promotion approval.
- **GK-3 Sanitized.** A global item contains no sensitive, proprietary,
  customer, or identifying data (ADR-11 step 3 lists these for removal), no
  secret values (repo `docs/policy.md` §6), and no database row content
  (Register §10 D4).
- **GK-4 Independent check before entry.** Entry requires review by someone
  other than the proposer. Basis: ADR-11 step 4 ("A separate reviewer checks
  the sanitized lesson") and Register §1 principle 6 ("Builders cannot
  independently approve their own work"). For reuse judgments specifically,
  F-36's default is an independent verifier plus an authorized human (Open).
- **GK-5 Approval by an identified owner.** Entry is approved by an
  identified, authorized knowledge owner (ADR-11 step 5). Who that is remains
  open (open question 1).
- **GK-6 Provenance survives promotion.** A global item keeps a reference to
  its originating project(s) and validating evidence, sanitized to the extent
  GK-3 requires (ADR-11 step 6).
- **GK-7 Global knowledge does not override authority.** A global item never
  overrides a Founder decision, an authorization's limits, or a project's own
  recorded decisions. It informs; it does not authorize (Register §1
  principle 3; ADR-06 analogy: research "do[es] not control project
  decisions, execution state, or authorization").
- **GK-8 Versioned corpus.** The set of global items available at any time is
  identifiable by version, so it can be frozen. Basis: Register §10 D8
  requires freezing "the accessible lesson corpus" during each primary
  repeatability window and recording unavoidable changes. See
  `07-context-freshness.md`.
- **GK-9 Retirement is recorded.** A global item that turns out wrong or
  superseded is marked superseded with reason and date, not deleted (DR-11
  pattern in `02-decision-register.md`).

## Authority boundaries

- **Founder:** decides who may act as knowledge owner and approve promotion
  (this is "authority expansion", a Founder-only category in ADR-09;
  ADR-09, Unresolved; F-21 Open). Can
  retire any global item.
- **Knowledge owner (unassigned):** approves entry under GK-5 once appointed.
- **Reviewer:** performs GK-4; must not be the proposer.
- **Muse, builders, SIE:** may propose candidates; may not approve entry.
- **Research agents:** may supply evidence; do not approve.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| GK-1, GK-6 | Each item shows principle, provenance, applicability limits | Global knowledge record |
| GK-2, GK-4, GK-5 | Each item links a reviewer record and an approval by an identified owner, distinct from the proposer | Global knowledge record; decision register |
| GK-3 | Review and secret scan before entry | Reviewer record |
| GK-8, GK-9 | Corpus version identifier exists; superseded items still present and marked | Global knowledge record history |

## Open questions

1. Who is the "authorized knowledge owner" (ADR-11 step 5)? The Register does
   not name one. Until named, the builder assumes only the Founder can
   approve entry, but that is not a recorded decision.
2. Does any global knowledge exist today? Repo `docs/architecture.md`
   invariants and `docs/policy.md` rules apply across Genesis work, but they
   are policy, not promoted lessons. Whether they count as global knowledge
   or as governance documents (spec 08) is not stated by the Register.
3. ADR-11 is labeled for Stage 6 design (F-23). Is a minimal entry rule needed
   earlier (for example for D8's lesson corpus in Stage 5)? The Register does
   not say.

## Explicitly NOT decided here

- F-23 (the ADR-11 procedure is not adopted), F-36.
- SIE lesson states or transitions; the SIE design stays approved in
  principle only and is not implemented.
- Storage, retrieval or knowledge-graph tooling.
