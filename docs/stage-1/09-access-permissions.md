# 09 — Access and permission requirements

- **Status:** Proposed (for review). Not Founder-approved.
- **CR-04 item:** 9 of 11.
- **Stage:** Stage 1, authorized 2026-11-05 (Register, Stage 1 amendment).
- **Related decisions and findings:** D2, D4, D5, F-19, F-21, F-22, F-34.

## Purpose

State, as requirements, which roles may read, propose, write or approve each
kind of Genesis record, and which actions always need explicit permission, so
that access follows authority instead of convenience.

Register ADR-02 lists "Authentication and permission boundaries" and "Audit
trail" among capabilities required "regardless of implementation". Register
§1 principle 3: the Founder "controls consequential permissions".

## Scope

**Covers:**
- Role-based access requirements per record type (requirements, not a
  mechanism).
- Actions that always need explicit authorization.
- Honest limits of current enforcement.

**Does not cover:**
- How permissions are enforced (tokens, branch protection, sandboxing,
  runtime checks). That is runtime design for the Stage 1 → Stage 2 window
  after D5's outcome (Register CR-04).
- Credentials themselves. No credential value appears in any record (repo
  `docs/policy.md` §6).
- Research provider access (F-19, ADR-06; Stage 2 integration).

## Roles

Roles are responsibilities, not systems (D5 outcome open):
**Founder**; **Muse** (coordinator/orchestrator); **Runner** (execution-state
authority; per ADR-02 "Current practice describes the orchestrator as the
Runner operator"); **Builder**; **Verifier** (identity unresolved, ADR-05);
**Research agent** (ADR-06); **Delegated reviewer** (none appointed; F-21).

## Requirements

- **AP-1 Least access by default.** A role gets access to the records its
  current authorized task needs, and no more. *Test:* each task brief lists
  the records and repositories in scope (CR-03 "Authorized scope and
  exclusions"; repo `docs/policy.md` §4 "Builders work only in their assigned
  repository").
- **AP-2 Access matrix (proposed).** Requirements by record type; R = read,
  P = propose (in a report or PR), W = write, A = approve/decide.

  | Record | Founder | Muse | Runner | Builder | Verifier | Research |
  |---|---|---|---|---|---|---|
  | Decision records | R, A | R, P, W (record only) | — | R (as needed) | R | R (as needed) |
  | Authorization records | R, A | R, P, W (record only) | R (refs) | R (own task) | R | R (own task) |
  | Project record | R, A (strategic) | R, P, W (per spec 08 tiers) | — | R (as needed) | R | R (as needed) |
  | Evidence records | R | R, W (file refs) | — | P (own evidence) | P (own findings) | P |
  | Global knowledge | R, A | R, P | — | R | R | R, P |
  | Execution records | R | R; W only through Runner rules | R, W | — (never edits) | R | — |

  Basis: Register §1 principles 4–6; ADR-01; ADR-05 (verifier evaluates, cannot
  approve own work); ADR-06 (research agents "do not control project decisions,
  execution state, or authorization"); repo `tasks/schema.md` ("Builders never
  edit task records"); repo `docs/policy.md` §1–§3.
- **AP-3 Verifier independence is an access question.** Whether the verifier
  may see builder context is unresolved (ADR-05: "Whether the verifier may
  access builder context"). The access model must be able to express both
  answers. This spec does not pick one.
- **AP-4 Always-explicit actions.** The following need explicit authorization
  naming them, whatever a role's general access: merge to main; push to
  protected branches; production access or contact; deployment; database
  access of any kind (D4: "Each aggregate check must be explicitly
  authorized"; "No service_role access"); credential creation, rotation or
  disclosure; spending or provisioning; contacting people or external
  parties (Stage 1–3 Brief, hard limits: "no external contact"); changing
  governance or protection settings (repo `docs/policy.md` §3; Register,
  Stage 1 amendment scope limits).
- **AP-5 Cross-project access is explicit.** Access to another project's
  records needs an authorization naming both (spec 04 PK-3; ADR-10).
- **AP-6 Every write is attributable.** Each write to a governance or project
  record identifies the writer and the authority used (ADR-02 "Audit trail";
  spec 08 OA-3). In this repo, commits carry a role identity via one-off git
  flags (repo `AGENTS.md` "Git").
- **AP-7 Denial is a signal, not an obstacle.** A denied action is not routed
  around through another channel (repo `docs/policy.md` §3).
- **AP-8 Concurrency stays at 1 unless authorized.** "Parallel execution is
  OFF. Default worker concurrency is therefore 1" (Register §6 "Resource
  limits"; F-34 default, Open). Access grants must not assume parallel
  writers.
- **AP-9 Founder controls permission changes.** Granting, widening or
  removing a role's access is authority expansion or governance change,
  Founder-only (ADR-09, Unresolved; F-21 Open; spec 08 Tier F).
- **AP-10 Isolation survives a shared coordinator.** A shared Muse "must not
  imply shared project authority, credentials, private context, or execution
  state" (ADR-10).

## Authority boundaries

The Founder decides all permission grants and changes (AP-9). Muse
coordinates access within existing authorizations and may not grant itself
or others new access. Runner remains the only writer of execution state
through its transition rules (Register §1 principle 5; ADR-02: "Muse must not
bypass Runner's claim and task-transition rules or independently write
execution state").

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| AP-1, AP-5 | Task brief lists scope; diff and activity stay inside it | Task Brief; verification report |
| AP-2, AP-6 | Writes to each record type come only from permitted roles; commits attributable | Git history; PR record |
| AP-4 | Each always-explicit action cites a prior authorization | Authorization record |
| AP-8 | Runner config shows concurrency 1, or an authorization changing it | Execution records / config (read-only check) |

## Honest limits (current environment)

Recorded so they are not mistaken for solved (repo `docs/policy.md` §9):
there is no sandbox on the VM, so a builder with shell access can read files
outside its branch; anyone with write access can push to `main` if branch
protection is off; the `gh` token carries broader scopes than needed. Until
mechanisms close these, AP-1–AP-6 are enforced by task scope, branch
isolation and review, not by technical controls.

## Open questions

1. Should the verifier have access to builder context (ADR-05)? Needed before
   Stage 2.
2. Does the Runner role need read access to authorization records, or only to
   references on tasks? Depends on ADR-03 / F-16 and D5's outcome.
3. Where does the Founder's own access sit for records outside this repo (the
   canonical Register today)? The Register is silent.
4. Who are the human reviewers for governance changes (D2) besides the
   Founder? None named.
5. Events are classed here as execution records only (ADR-01: "Execution
   record: Runner-owned task state and events"), so Runner has no write
   access to evidence records; evidence records reference events by
   identifier (spec 11 RS-3). The Register also lists "Execution events" and
   "Task records and execution events" as evidence-package contents (§7
   evidence-package summary; standard evidence package). Whether a package
   copies events or only references them is not settled by the Register.

## Explicitly NOT decided here

- Any enforcement mechanism, token scope, sandbox or runtime check.
- ADR-05 verifier identity and its access to builder context.
- F-19, F-21, F-22, F-34, D5 outcome.
