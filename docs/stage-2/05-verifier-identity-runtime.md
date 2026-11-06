# 05 — Verifier identity and runtime

- **Status:** Proposed (for review). Not Founder-approved.
- **Stage 2 item:** 5 of 7.
- **Stage:** Stage 2, authorized 2026-11-06 (Register, Stage 2 amendment).
- **Related decisions and findings:** D2 (APPROVED WITH AMENDMENTS; risk
  classes an open definition), F-18 (decided as D2), ADR-05, F-10 (proposal
  below), F-21, F-36.

## Purpose

Define the eight items ADR-05 requires "Before Stage 2", so that independent
verification under D2 is something Genesis can actually perform and audit,
not a label.

F-18 is decided: Register §5 F-18 "Independent Verifier model", status
"APPROVED WITH AMENDMENTS 2026-10-30 (D2; see §10 decision record)". D2's
approved wording governs this spec and is not re-decided:

- Separate builder and verifier responsibilities.
- Verification must target the exact commit or artifact.
- Builder explanations are not independent evidence.
- Reproduce checks according to risk class.
- Human review is required for high-risk, security, governance, and
  first-product decisions.
- An unresolved FAIL blocks acceptance and merge.
- Corrected artifacts require re-verification.
- Erroneous verdicts must be corrected with evidence.
- No override without a separate decision.
- Distinguish completed PASS checks from skipped or neutral checks; skipped
  checks must not count as successful verification.

(Register §10 D2.) D2 left one definition open: "The risk classes that
'reproduce checks according to risk class' refers to are not yet defined;
ADR-05 pre-Stage-2 definitions are still owed." This spec proposes them.
Every definition below (items a–h) is **PROPOSED — Founder decision pending,
not decided**: they are governance rules, and governance changes are
Founder-only (Stage 1 spec 08 Tier F, item 5).

## Scope

**Covers:** ADR-05 items (a)–(h); the independence declaration (D6 addition);
the F-10 proposal.

**Does not cover:** building or launching any verifier; SIE reuse judgment
(F-36, Stage 3 design); benchmark acceptance (F-20, Stage S).

## Two rules that hold before anything else

- **VI-1 A verifier FAIL blocks acceptance and merge. No exception.**
  "A builder report, completed task status, or schedule pressure cannot
  override a failed verification. Any reconsideration requires a documented
  review, evidence, and an authorized decision" (Register ADR-05). Nothing in
  this spec or spec 07 creates an exception.
- **VI-2 Orchestrator verification is not relabeled.** "Current orchestrator
  verification practice must not be silently relabeled as independent
  verification" (Register ADR-05). Today the orchestrator re-runs tests,
  reads the diff and scans for secrets before a PR (repo
  `docs/runner-operations.md` §1 step 5; `docs/architecture.md` "Validation").
  That is **orchestrator verification**: useful, required by repo policy, and
  not independent. Stage V recorded "Independent verifier not implemented"
  (Stage V report, A-3). Records must name it as orchestrator verification.

## (a) Verifier identity and runtime

- **VI-3 The verifier is a role filled by a verifier session.** A verifier
  session is an agent session started for one verification, with:
  1. a fresh context — no conversation history shared with the builder
     session or the coordinator session;
  2. its own role identity recorded in the Verification Report ("Reviewer
     identity", CR-03);
  3. read access to the repository at the exact commit under review, in a
     checkout or worktree separate from the builder's;
  4. permission to run the project's tests and checks in that checkout
     (needed for (d)), and no permission to commit, push, open or merge a PR,
     edit task records, or contact anything outside the repository;
  5. a stated model and version (D6 Builder Report rule applied by analogy:
     "Explicitly state when version information is unavailable").
- **VI-4 Who may not be the verifier.** The builder of any part of the
  artifact; the session that coordinated the builder (Muse's coordinating
  session — ADR-05: Muse "is not automatically the verifier"); anyone
  verifying their own corrections to the artifact (Register §1 principle 6;
  CR-01: "The verifier cannot validate its own work").
- **VI-5 Human reviewers are a separate layer.** Where (e) requires human
  review, it is in addition to the verifier session, not instead of it.
- **VI-6 Runtime is environment-agnostic.** The verifier may run on the same
  VM as the builder (there is one VM; repo `docs/policy.md` §9). That shared
  host is declared in the independence declaration (VI-9), not hidden.

The Register records that Stage 1 was checked by an "independent verifier D2
PASS" (Register, PR #34 merge amendment). Whether that setup meets VI-3–VI-6
is a question for audit (h); this spec does not assume it does.

## (b) Model and tool independence requirements

"A different agent name or model alone does not prove meaningful
independence" (Register ADR-05).

- **VI-7 Independence is judged on what the verifier received and could do,
  not on its name.** Required, for every verification:
  - **Context independence:** no access to the builder's reasoning
    transcript; inputs limited per (c).
  - **Evidence independence:** verdict based on checks the verifier itself ran
    or inspected at the exact commit (D2), not on builder-supplied output.
  - **Write independence:** no ability to change the artifact it judges (VI-3
    item 4).
  - **Instruction independence:** the verifier's instructions derive the
    checks from the Task Brief's acceptance criteria, the governing records and
    this spec — not from the builder's summary of what it did.
- **VI-8 Model diversity is preferred, not sufficient.** Where another model
  family is available and authorized, high-risk, security and governance
  verifications should use it. Where it is not, the same family may be used,
  and the shared model is declared as a known common-mode risk. No new model
  provider or subscription is assumed (no spending; Register, Stage 2
  amendment).
- **VI-9 Independence declaration (D6 addition) states, at least:** verifier
  session identity; model and version (or "unavailable"); tools and
  permissions granted; inputs received (list); whether any builder context was
  received, and which; who launched it and with what instructions (by
  reference); shared dependencies with the builder (same model family, same
  coordinator, same host); and any departure from VI-3–VI-8.
  *Test:* each Verification Report carries all items.

A residual limit is recorded, not solved: the same coordinator (Muse) writes
both the builder's and the verifier's instructions. VI-7 "instruction
independence" and audit (h) are the mitigations.

## (c) Whether the verifier may access builder context

- **VI-10 Allowed:** the Task Brief; the exact artifact (commit, diff,
  files); the Builder Report, **labeled as claims to be checked** (CR-03;
  D2 "Builder explanations are not independent evidence"); CI results by
  reference, which the verifier inspects itself.
- **VI-11 Not allowed by default:** the builder's session transcript,
  reasoning, scratch notes, or the coordinator's commentary on the builder's
  work. A verifier that needs one of these to reach a verdict records why and
  marks the affected findings as relying on builder context.
- **VI-12 Order:** the verifier forms findings from the artifact and Task
  Brief, then checks the Builder Report's claims against them, so the report
  frames nothing.

This answers Stage 1 spec 09 AP-3 and open question 1 as a proposal.

## (d) What evidence must be independently reproduced

- **VI-13 Always, for every class:** the verifier reads the full diff at the
  exact commit; re-runs the required tests named in the Task Brief at that
  commit; confirms the commit verified is the commit proposed for merge; and
  reports skipped or neutral checks separately from passed ones (D2).
- **VI-14 By risk class (proposed):**

| Risk class | Reproduce independently | Inspect (not re-run) | Human review (e) |
|---|---|---|---|
| Routine | VI-13 | CI results on the exact commit | No |
| High-risk | VI-13; every acceptance criterion's evidence; a behavior check of the changed path | — | Yes |
| Security | VI-13; secret scan; permission and credential-handling paths; denied-action behavior where testable without production | — | Yes |
| Governance | VI-13; every citation to the Register or decision record checked against source; no decided/open status changed without a decision record | — | Yes |
| First-product | All of the above that apply, plus the Stage S acceptance criteria once defined (F-20 Open) | — | Yes |

- **VI-15 What is never accepted as reproduction:** builder-reported test
  counts; a task's `completed` status; CI "success" from a different commit;
  a check that was skipped.

## (e) Which risk classes require human review

- **VI-16 Proposed risk classes.** D2 names four human-review categories;
  this spec makes each a class and adds Routine for everything else:
  - **High-risk:** changes to execution infrastructure (Runner scripts,
    `tasks/schema.md`, crons, CI workflows), to recovery or retry behavior, or
    to anything that would enable a protected action (spec 07 ES-12); and any
    task whose Task Brief limits are exceeded.
  - **Security:** credentials, tokens, permissions, authentication, secret
    handling, data access, branch protection or required checks (repo
    `docs/policy.md` §3, §6).
  - **Governance:** decision, authorization, ownership, amendment, access or
    verification rules; the Register or any record of Founder decisions; any
    spec that proposes resolution of an open finding.
  - **First-product:** acceptance of the Stage 4 product (Register ADR-05:
    "first-product acceptance").
  - **Routine:** none of the above.
- **VI-17 Class assignment.** Muse assigns the class in the Task Brief ("Risk
  classification", CR-03). Several classes may apply; all their requirements
  apply. An unclassified task is treated as High-risk (Stage 1 spec 03 AR-3,
  narrowest reading). The verifier may raise a class; only the Founder may
  lower one.
- **VI-18 Human reviewer.** The Founder, or a delegated human reviewer whose
  written permission covers the class (F-21 proposal, spec 07). None is
  appointed today, so every human review is the Founder's.

## (f) Escalation and disagreement procedures

Defined in `07-escalation-model.md` (ES-5–ES-9). Summary of what this spec
relies on: a FAIL stands until a corrected artifact passes re-verification, or
the verdict is shown erroneous with evidence and corrected by an authorized
decision (D2); the builder and Muse cannot override; the Founder retains
strategic acceptance.

## (g) Whether the same verifier may review repeated changes

- **VI-19 Re-verification uses a fresh session.** After a FAIL and a
  correction, the corrected artifact is verified by a new verifier session
  (D2: "Corrected artifacts require re-verification"). It receives the prior
  Verification Report's findings and required corrections as a checklist,
  labeled as prior findings, and re-checks the whole artifact, not only the
  corrections.
- **VI-20 The same verifier configuration may review successive tasks** for
  Routine work. For High-risk, Security and Governance work on the same
  component, consecutive verifications by the same configuration are recorded
  so audit (h) can see concentration.
- **VI-21 No verifier session reviews its own output**, including any
  correction it suggested and then made (VI-4).

## (h) How verification is audited

- **VI-22 Every verification leaves a Verification Report** with all CR-03
  source fields and D6 additions (`04-contracts.md` CT-7, CT-8), stored with
  the artifact's review record (for this repo, the pull request) and
  referenced from the evidence record (Stage 1 spec 06).
- **VI-23 Human audit sample.** The Founder (or a delegated reviewer) audits
  a sample of PASS verdicts, proposed as at least one Routine verification
  per stage and every High-risk, Security and Governance verification that
  did not already receive human review. The audit checks: VI-9 declaration
  complete; VI-13 checks actually re-run (evidence present); skipped checks
  listed; classes assigned correctly.
- **VI-24 Erroneous verdicts are corrected with evidence**, by a new dated
  report that references the old one; the original stays (D2; Stage 1 spec 06
  EV-1).
- **VI-25 Verification outcomes are tracked:** count of PASS, FAIL,
  re-verifications, overturned verdicts, and audit findings, per stage, as
  evidence for whether the verifier model works. This is a record
  requirement, not a metric target.

## F-10 — Verdict and lesson vocabulary

**PROPOSED — Founder decision pending, not decided.**

- **Finding:** F-10 "Verdict and lesson vocabulary". Recommended default:
  "Separate verification, evaluation, incident, and lesson statuses".
  Required before: Stage 2. Status: Open (Register §5). Basis: Register CR-09.
- **Proposed resolution:** the four CR-09 status systems stay separate, with
  exactly the CR-09 values, plus one claim-assessment set already used by
  Stage V:

| System | Values | Used in |
|---|---|---|
| Task verification outcome | PASS, FAIL, BLOCKED, NEEDS APPROVAL | Verification Report "Verification result" |
| Evaluation verdict | PASS, CONDITIONAL PASS, FAIL, INCONCLUSIVE | Benchmark/evaluation verdicts only |
| SIE incident lifecycle | OPEN, FIXED, WATCH, VALIDATED, REOPENED | SIE records only (Stage 3) |
| SIE lesson states | CANDIDATE, UNVALIDATED-STAGED, VALIDATED | SIE records only (Stage 3) |
| Claim assessment outcome | Verified, Unverified, Contradicted, Not Assessed | Read-only verification of stated claims (Register B2 amendment) |

  Rules: a value from one system is never used in another; a record that
  carries a status names its system; "A task verification result does not
  independently establish an overall benchmark verdict" (CR-09); CONDITIONAL
  PASS is not a task verification outcome; check-level states (passed /
  failed / skipped / neutral) are a separate list inside a report and never
  roll up into PASS when any required check is skipped (D2). SIE transitions
  stay governed by the SIE Specification (CR-09), which does not yet exist
  (Register ADR-12); nothing here adds SIE content.
- **What the Founder would be deciding:** the five sets as separate systems,
  and adding the claim-assessment set (which also answers Stage 1 spec 06 open
  question 1).

## Authority boundaries

- **Founder:** decides items (a)–(h) and F-10; human reviewer for all
  human-review classes until delegates exist; only authority for a separate
  decision reconsidering a FAIL (D2).
- **Muse:** launches verifier sessions and records their reports; is not the
  verifier; cannot lower a risk class or override a verdict.
- **Verifier:** evaluates the exact artifact and reports; cannot approve its
  own work, merge, or write execution state.
- **Builder:** receives findings; corrects; cannot dispute a FAIL except
  through spec 07.

## Evidence and traceability

| Requirement | Verification | Record |
|---|---|---|
| VI-1 | No merge or acceptance exists while a FAIL is unresolved | PR state; delivery records |
| VI-2 | Orchestrator checks are labeled as such in records | Task records; PR comments |
| VI-3–VI-12 | Independence declaration complete; inputs listed | Verification Report |
| VI-13–VI-15 | Re-run evidence at the exact commit; skipped checks listed | Verification Report |
| VI-16–VI-18 | Task Brief carries a class; human review present where required | Task Brief; PR review record |
| VI-19–VI-25 | Fresh session per re-verification; audit sample recorded | Verification Reports; audit records |

## Open questions

1. Does the Founder accept the five risk classes, especially that execution
   infrastructure and limit overruns are High-risk?
2. Is a second model family available and authorized for VI-8? None is
   recorded in the repo (`docs/architecture.md` notes no Gemini/Perplexity
   API key installed, verified 2026-10-28).
3. Where are Verification Reports stored outside a PR (for non-PR artifacts)?
   Depends on F-14.
4. VI-23's audit sample size is a proposal; the Register sets none.

## Explicitly NOT decided here

- Items (a)–(h) and F-10 are proposals. D2's wording is unchanged.
- F-21 (spec 07), F-36, F-20. Any verifier implementation or launch.
- No exception to "verifier FAIL blocks acceptance and merge".
