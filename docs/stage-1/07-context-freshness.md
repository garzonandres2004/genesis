# 07 — Context freshness and versioning

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 7 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related decisions and findings:** D8 (APPROVED WITH AMENDMENTS), F-07,
  F-24.

## Purpose

Make sure that whoever acts on project context, decisions, authorizations or
knowledge acts on the current version, can tell which version that is, and
can tell when something has been superseded.

Register CR-07 requires every document to state "Approval status. Owner.
Version. Last review date. Authority or decision record supporting approval.
Documents superseded, if any. Unresolved decisions." Register §7 revision
rules require that "Each canonical document identifies its owner and version"
and "The Muse Handoff references current canonical versions."

## Scope

**Covers:**
- Version identification for records and documents.
- Supersession rules.
- Freshness checks before acting.
- Versioned baselines (for D8 measurement windows).

**Does not cover:**
- The document-status convention as a decided standard (F-07, Open). This spec
  builds on CR-07's list without deciding F-07.
- Any staleness thresholds in time units (the Register states none).
- Tooling.

## Requirements

- **CF-1 Every record and canonical document carries a version header.** At
  least: status, owner, version, last review date, supporting decision record,
  superseded documents, unresolved decisions (Register CR-07). *Test:* header
  present on each record and canonical document.
- **CF-2 Versions are content-identifiable.** A version can be identified by
  content, not only by a name. The Register's current practice is SHA-256
  plus line count for each pre-amendment version (Register, every 2026-11-05
  amendment). In a git-backed store a commit SHA serves the same purpose.
- **CF-3 Supersession is explicit and preserved.** A superseded statement is
  marked superseded with date and superseding source, and kept (Register B1
  amendment; §10 "[Superseded 2026-10-30 ...]" notes). Repo
  `docs/architecture.md` commits Phase 3 knowledge to labels "verified /
  hypothesis / superseded, each dated and sourced".
- **CF-4 The header status line governs.** Where a document's body still
  contains pre-amendment status text, the current status line governs and the
  older text is history (Register B1 amendment: "The header status line above
  is the current status").
- **CF-5 Act on the current version, and say which.** A role about to act on
  context (dispatch a task, verify, record a decision) confirms it is using
  the current version of the records it relies on and cites the versions in
  its output. *Test:* task briefs and verification reports name the versions
  (commit or hash) of governing records they relied on.
- **CF-6 Stale context stops action.** If a role finds that its context is
  older than the current version of a governing record (decision,
  authorization, scope), it re-reads before acting; if the newer version
  changes its authority, it stops and escalates. Basis: repo
  `docs/architecture.md` names "an agent ... acting on a superseded fact" as a
  failure that triggers a change of knowledge tooling, i.e. a failure to
  prevent.
- **CF-7 Recovery restores the current version.** After an interrupted
  session, recovery reads current durable records, not prior conversation
  context (ADR-02 "Recovery after interrupted sessions"; spec 01 PI-6/PI-7).
- **CF-8 References name versions.** References to canonical documents name
  the version referenced (Register §7 rule 6 for the Muse Handoff; D6 for the
  Evaluation Catalog: "reference its exact canonical version and section").
- **CF-9 Versioned baselines can be frozen.** It must be possible to fix a
  versioned baseline of process/tool configuration and the accessible lesson
  corpus for a period, and to record any change during it. Basis: D8
  ("Freeze evaluated process/tool configuration and the accessible lesson
  corpus"; "Record unavoidable changes and analyze them separately"). D8
  leaves baseline contents and window boundaries to the Stage 5 plan; this
  spec only requires that the records make freezing possible.
- **CF-10 Review dates are real.** "Last review date" records an actual
  review by a named reviewer, not the date of an unrelated edit.

## Authority boundaries

- **Owner of each document** (per ADR-12 matrix once decided; F-24 Open) is
  responsible for its version header and review date.
- **Muse (recorder):** maintains version headers and supersession notes
  within the amendment rules (spec 08). May not mark a decision superseded
  without the superseding decision record.
- **Any role:** must stop and escalate when CF-6 applies.
- **Founder:** decides any change of canonical status (B1 set the Register's).

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| CF-1, CF-2, CF-10 | Inspect headers; versions resolve to content (hash or commit) | Each record |
| CF-3, CF-4 | Superseded text still present, labeled, dated, with source | Record history |
| CF-5, CF-8 | Briefs and reports cite versions relied on | Task Brief; Verification Report |
| CF-6, CF-7 | Recovery check from durable records (Stage 1 → Stage 2 handover, not run under this authorization) | Verification report |
| CF-9 | Baseline version identifier exists for a window | Stage 5 plan (out of Stage 1 scope) |

## Open questions

1. The Register sets no time-based staleness threshold (for example, "re-read
   if older than N hours"). Is a version comparison enough, or does the
   Founder want time limits? The Register is silent.
2. The canonical Register lives outside the repo (see spec 02). Its versions
   are hash-identified only in amendment text. Who computes and publishes the
   current hash? The builder could not compute it from its sandbox for these
   specs (see `README.md`).
3. F-07 (document-status convention) is open. If decided with different
   fields from CR-07's list, CF-1 must change.
4. Should version headers apply to execution records (`tasks/*.json`) too, or
   only to project and governance records? Execution records already have
   their own history (`events.jsonl`, `tasks/schema.md`); this spec does not
   touch them.

## Explicitly NOT decided here

- F-07, F-24. D8 baseline contents, window boundaries, intervention rules and
  restart criteria (left to the Stage 5 plan by D8).
- Any staleness threshold, tooling, or storage.
