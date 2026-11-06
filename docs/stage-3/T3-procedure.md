# T3 — Live loop turn procedure (the loop as an ordinary runner task)

- **Status:** DRAFT — Proposed (for review). Not Founder-approved. Not
  verified. This is the Stage 3 task T3 deliverable. It describes what a
  runner task does on a live loop turn **once a live loop has been
  separately authorized**. It is a document for that future step.
- **Version:** 0.1-draft, 2026-11-06.
- **Specification:** `docs/stage-3/00-sie-specification.md`, version
  0.4-draft. The requirements for this procedure come from Spec §15
  (PRO-1–PRO-5), §2 points 3 and 4, and §16. The procedure applies Spec
  §5 (detector), §6 (incident records), §7 (watch, PROVISIONAL), §8
  (validation), §11 (record location), and §12 (INDEX) without re-deciding
  anything in them.
- **Location:** `docs/stage-3/T3-procedure.md`. Neither the Specification
  nor an existing convention names a different location. Spec §18 maps T3
  to §15 without naming a file.
- **Risk class:** Governance (Brief §9 T3: it states the loop's
  authorization and escalation rules). Human review is required (D2).
- **Authorization:** written under the Stage 3 authorization (Founder
  approval of the Brief §11 boundary, 2026-11-06 ~09:40 MST). That
  authorization does **not** authorize the first live loop or any live
  loop turn (Brief §11, "EXPLICITLY NOT AUTHORIZED").
- **Supersedes:** nothing.

---

## 0. Read this first

### 0.1 Stage 3 does not start the live loop (AC-T3-4)

**Stage 3 does not start the live loop.** [DECIDED — Stage 3
authorization, Brief §5.5, §10 item 10, §11; Spec §15 PRO-5.] In the
Specification's words: "Stage 3 does not start the first live loop, and
this Specification authorizes no live loop. The first live loop is a
separately authorized step after Stage 3."

The same holds for this document:

- **This procedure starts nothing and authorizes nothing.** Writing it,
  reviewing it, verifying it, merging it, or completing any other Stage 3
  task (including T8's readiness checklist) does not start a live loop,
  schedule one, or authorize one.
- **No step below was executed in writing this document.** The detector
  was not run against live records. No candidate, incident, or turn record
  was created. Nothing was simulated.
- **The first live loop is a separately authorized step after Stage 3**
  (Brief §5.5). Until that authorization exists, PROC-0 below stops every
  turn before it reads any operational record.

### 0.2 No faked failures (AC-T3-1, AC-T3-2)

[DECIDED — D1; Stage 3 authorization, Brief §10 item 8; Spec §15 PRO-2.]
"Do not manufacture incidents or unnecessary tasks" (D1). "No faked
failures, ever. No demo failing test on live systems (H1 open)."

**No step in this procedure creates, simulates, or stages a real failure.**
Every step reads records that already exist, or writes SIE records
(detector candidates, incident records, escalation records, turn records)
*about* what already exists. No step runs, re-runs, retries, interrupts,
blocks, or fails a task in order to produce something to observe. No step
injects, edits, or replays a task record or event. Rule NR-1 (§3) makes
this binding on every step, and §6 lists the forbidden acts explicitly.

**Manufacturing an incident is not the same as creating an incident
record.** The prohibition targets the underlying failure event: no step
creates, simulates, stages, or otherwise manufactures the failure itself.
Creating an incident record *about* observations that already exist
(PROC-5.1, `createIncident`, after a recorded triage judgment) is not
creating or manufacturing an incident; it is the procedure's
candidate-to-incident path, and it is permitted.

### 0.3 Provenance labels

This document uses the Specification's labels (Spec §0.2) with the same
meanings:

| Label | Meaning here |
|---|---|
| **[DECIDED]** | Founder-decided: D1–D8 wording, B1/B2, the Stage 3 authorization (Brief §10/§11), or the Founder Amendment of 2026-11-06. Named each time. |
| **[REF]** | Attributed to WP-04 v1.1. Where the text is quoted from the filed retrieval (via Spec §2), it says so. Any other [REF] is a reconstruction, UNVERIFIED as wording. |
| **[P]** | Proposal, source named. "[P — this procedure]" marks a step this document introduces to carry the Specification's requirements into a procedure. |
| **[OPEN]** | Undecided; owner and unblocking condition in Spec §19 or §8 below. |

A step's label states the provenance of the step. It does not upgrade the
rule it applies: a step that applies a [P] Specification rule is still a
proposal, even when the step is mandatory within this procedure.

---

## 1. The first-live-loop trigger (AC-T3-2)

### 1.1 The trigger, exactly as WP-04 v1.1 states it

[REF — quoted from WP-04 v1.1, retrieval 2026-11-06, via Spec §2 point 3;
Spec §15 PRO-3.] The trigger is stated here verbatim and is not
paraphrased.

WP-04 v1.0 §F, as carried in v1.1:

> "No failures are faked: the first live loop runs on the first real post-November-5 failure, or on a seed-docs inconsistency if no real failure occurs within 30 days."

WP-04 v1.1 requirement-matrix line:

> "First live loop on the first real post-November-5 failure, or a seed-docs inconsistency if none in 30 days, no faked failures — [BASE] (October 29 roadmap)."

([BASE] inside the matrix line is WP-04's own status tag, kept verbatim;
Spec §0.2.)

### 1.2 Review note — NOT WP-04 text

The retrieval records the following as a review note ("Review note (not
WP-04 itself, v1.1 review point 3)"). It is quoted here **as a review
note only**. It is not WP-04 wording and is not the trigger:

> "The first live SIE loop cannot start automatically after November 5. Even if an authentic failure occurs in a live task after November 5, the loop can start only after a separate Stage 3 authorization and an explicit start command. The calendar does not grant permission."

Separately, WP-04's own governance gate (quoted in Spec §2 point 8, §H/J)
states: "Implementation requires a separate Stage 3 authorization and an
explicit start command."

### 1.3 What the trigger does not settle — [OPEN — SIE-05]

The retrieved WP-04 text:

- gives **no criteria** for a "seed-docs inconsistency";
- does **not say what the 30 days are counted from**.

Both stay **[OPEN] (SIE-05)**; owner and unblocking condition in Spec §19.
This procedure **defines no seed-docs-inconsistency criteria and names no
start date for the 30 days.** Consequence for PROC-0: the seed-docs
fallback branch of the trigger cannot be the basis of a turn until SIE-05
is decided ([P — addendum refinement 7, via Spec §2 point 3: specify the
threshold through SIE-05 "before using that fallback operationally"]).

The retrieved text also does not define "real … failure" beyond the
quoted words. This procedure does not define it either. In particular, a
detector candidate is **not** a real failure (NR-2), and the fact that a
candidate exists does not, by itself, meet the trigger.

### 1.4 The trigger is necessary, not sufficient

[P — prep §7 item 3; Brief §5.5; Spec §15 PRO-4.] The first live loop
starts only when **all** of these hold:

- (a) the November 5 verdict has been issued and preserved;
- (b) SIE implementation has been explicitly authorized by the Founder;
- (c) the WP-04 trigger (§1.1) is met.

"It does not start by passage of time, by completion of this
Specification or of any Stage 3 task, or by the absence of a failure"
(PRO-4). Brief §5.5 adds that the first live loop is "a separately
authorized step after Stage 3, not part of it." PROC-0 checks these
conditions before every turn.

---

## 2. What a live loop turn is

- **LT-1 [REF — UNVERIFIED (DV-7); P — prep SIE-P3; Spec §15 PRO-1, §11
  LOC-4].** A live loop turn, when separately authorized, is an **ordinary
  runner task**. The sentences "The loop runs as ordinary runner tasks. No
  new service, daemon, or database is introduced. The detector is
  read-only." are prep "Basis" reconstructions attributed to WP-04. They
  are **not** in the retrieved WP-04 text (Spec §2 point 4, §2.9 DV-7),
  and are not presented here as WP-04 wording.
- **LT-2 [DECIDED — Stage 3 authorization, Brief §10 items 6 and 12; Spec
  §11 LOC-3].** Independently of LT-1's provenance: no new service,
  daemon, or database; no Runner schema, cron, script, or configuration
  change. The turn is a task record in `tasks/` like any other, created and
  owned by the orchestrator (`tasks/schema.md`), with a Task Brief carrying
  the D6 additions (time, resource/cost, model/tool limits, scope
  compliance, escalation conditions). This procedure needs no new task
  field.
- **LT-3 [REF — quoted from WP-04 v1.1, retrieval 2026-11-06, via Spec §2
  point 4].** The seven SIE capabilities, quoted:

  > "Seven capabilities: Observe, Diagnose, Improve, Learn, Reuse, Evaluate, Compound." Observe (detect a candidate incident and record it); Diagnose (investigate the cause with evidence); Improve (implement a fix and validate it); Learn (distill a validated lesson); Reuse (consult a validated lesson in a later task); Evaluate (measure whether reuse improved outcomes); Compound (accumulate lessons over time).

- **LT-4 [P — this procedure].** A turn exercises **Observe** ("detect a
  candidate incident and record it") and records the judgments that open
  or update incident records, including diagnosis entries (facts,
  hypotheses, and reproduction-supported conclusions kept separate, INC-4)
  where they are made. A turn does **not** validate an incident, distil a
  lesson, claim reuse, evaluate, or make a compounding change. Those
  require evidence and decisions outside a turn (Spec §8, §9, §16; Brief
  §1, Milestone B), and none of them is performed or claimed by following
  this procedure. Fixes (Improve) are separate tasks under the normal
  workflow, never part of a turn.

---

## 3. Rules that hold on every step

These rules bind every step in §4. If a step and a rule appear to
conflict, the rule wins and the turn stops at that step and escalates
(PROC-6). A step that creates an SIE record about existing observations
(a candidate, an incident record via PROC-5.1, an escalation record, or
the turn record) does not conflict with NR-1, because NR-1 forbids
manufacturing the underlying failure, not recording what already exists
(§0.2); the candidate-to-incident path therefore executes. The precedence
rule still applies to every genuine conflict: the rule wins, the turn
stops, and it escalates.

- **NR-1 No manufactured failure [DECIDED — D1; Brief §10 item 8; Spec
  PRO-2] (AC-T3-1).** No step creates, simulates, or stages a real
  failure, or a task, and no step manufactures the underlying incident
  (the failure event itself). Creating an incident record about existing
  observations through PROC-5.1 (`createIncident`) is permitted and is not
  manufacturing an incident (§0.2). No demo failing test on live systems
  (H1 OPEN). No fixture, synthetic record, or test input is placed among
  operational records, and no fixture result is reported as an
  operational observation (Spec §13 FXT-1, FXT-2).
- **NR-2 A candidate is not a failure [P — Spec §5 DET-2, DET-3, VOC-7].**
  "A candidate is an exact-match observation that a rule fired. A
  runner-caused failure is a judgment reached only after diagnosis that
  (a) identifies a runner defect in the frozen failure categories, (b)
  reproduces or re-reads the evidence for it, and (c) survives independent
  verification subject to D2. No detector output, no candidate count, and
  no candidate recurrence ever performs that judgment automatically."
  Turn records, incident records, and reports write "detector candidate",
  never "failure", "runner-caused failure", "defect", or "regression", for
  a detector output. A candidate count is never reported as a failure
  count.
- **NR-3 Read existing records only [P — Spec §5 DET-4, DET-5; SIE-03
  OPEN; LOC-3 DECIDED].** The turn reads Runner task records (`tasks/`) and
  the event log (`events.jsonl`) and never writes, edits, reclassifies,
  backfills, renames, or deletes them. Its only writes are SIE records in
  the SIE record area (Spec §11, working assumption, F-14 OPEN). It reads
  nothing outside the SIE-03 working scope: no production system, no
  database, no deployment, no external service (Brief §10 item 11 holds for
  Stage 3; any wider scope for a live loop is the live-loop
  authorization's to state, not this procedure's). The turn's own runner
  task record is a Runner task record it is observing, so the turn never
  writes it either. Lifecycle updates to it (marking the turn's task
  `blocked`, recording evidence on it, ending it) are performed by the
  orchestrator, which owns the turn's task record (LT-2), through the
  existing task mechanism, on the turn's request recorded in SIE records
  (escalation record, turn record). The turn requests; it does not write.
- **NR-4 No automatic classification [DECIDED — Register §1 principle 8,
  B1; Spec INC-6].** "SIE cannot automatically classify incidents or
  promote lessons." Every incident opened or updated is a recorded
  judgment naming who made it and why.
- **NR-5 Records through the implemented mechanisms only [P — this
  procedure, applying Spec §5 and §6].** Candidate records are written only
  by `writeCandidates` (`scripts/sie-detector.mjs`); incident records are
  created and changed only through `scripts/sie-incident.mjs`
  (`createIncident`, `transition`, `recordFurtherRecurrence`,
  `annotateCorrectedVerdict`, `promoteHypothesisToConclusion`,
  `recordValidationEvidence`). A refusal by either module is final for the
  turn: the turn records the refusal and its named reason and does not
  work around it. Records are append-only; nothing is upgraded in place
  (Spec INC-5, VAL-3).
- **NR-6 Watch computations are PROVISIONAL [OPEN — H5 / decision 5,
  SIE-02; P — Spec WAT-2, WAT-4].** Every watch computation names its
  reading (W-A, W-B, or W-C) and its counting rule and is labeled
  PROVISIONAL, never final. The turn adopts no reading and no counting
  qualification.
- **NR-7 Open items stay open [Spec §19, §20; Founder Amendment
  2026-11-06].** The turn decides no open item. In particular:
  - **R4-events [OPEN]/not-evaluated.** The detector's event half is not
    implemented and is not claimed. The turn records it as "not
    evaluated", never as "no event recurrence". No R4 event key is
    invented (CR-04).
  - **DV-2 / C-15 (lifecycle order) [OPEN — Founder ruling].** The turn
    uses the status machine as implemented to Brief AC-T2-1's order
    (OPEN → FIXED → WATCH → VALIDATED | REOPENED) and treats that order as
    recorded, not settled.
  - **DV-3 / C-16 ("at least 2 unrelated users") [OPEN — Founder
    ruling].** Not defined and not enforced. No turn record or incident
    record may claim it is satisfied.
  - **H4 / D2.** Independent verification stays `NOT SATISFIED — D2 role
    pending`; no record is labeled independently validated.
  - F-36, F-14, F-10, F-16, F-21, F-34, SIE-05, SIE-07, and the D2
    operational model are not decided by any turn.
- **NR-8 Silence is never approval [P — Register ADR-09, quoted in Spec
  §14.2 GOV and Stage 2 spec 07 ES-11].** "Silence and timeout never equal
  approval." See PROC-6.

---

## 4. The procedure, step by step

Each step names its inputs, its actions, what it writes, and when it
stops. A **stop** means: the turn performs no further step except PROC-7
(the turn record) where PROC-0 has passed, and the orchestrator is told
why. The precedence rule at the head of §3 applies to every step below.
A step that creates an SIE record about existing observations, including
an incident record via PROC-5.1, does not conflict with NR-1 (§0.2, §3),
so the candidate-to-incident path executes; a genuine conflict still
stops the turn and escalates.

### PROC-0 — Preconditions and authorization check

[P — this procedure, applying Spec §15 PRO-4, PRO-5; Brief §5.5; WP-04
governance gate (Spec §2 point 8).]

**Before reading any operational record** (Runner task records or
events), the turn confirms each of the following from the authorization,
verdict, and task-brief records named in items 1–5, not from memory or
assumption. Those named records are the only records the turn reads
before this check passes; no task record or event is read until all six
items pass.

1. **November 5 verdict issued and preserved** (PRO-4 (a)): the
   preserved verdict record is identified by reference.
2. **SIE implementation explicitly authorized by the Founder** (PRO-4 (b))
   — and, for the live loop itself, **a separate, recorded Founder
   authorization of the live loop** that covers this turn (Brief §5.5:
   "a separately authorized step after Stage 3"). The authorization's
   decision record is cited by reference. The review note in §1.2 (an
   explicit start command, not the calendar) is consistent with this
   condition; it is cited as a review note, not as WP-04.
3. **The WP-04 trigger (§1.1) is met** (PRO-4 (c)), as recorded in that
   authorization. Whether the trigger is met is a judgment recorded with
   the Founder's authorization; **the turn does not declare the trigger
   met on its own**, and a detector candidate does not meet it (NR-2). If
   the stated basis is the seed-docs fallback, the turn stops while SIE-05
   is OPEN (§1.3).
4. **This turn has a task record and a Task Brief** under the existing
   task mechanism (LT-2), with its D6 limits and escalation conditions.
5. **The record location to write into is named** in the authorization or
   Task Brief. The Specification's location is a working assumption (Spec
   §11 LOC-1, LOC-2, F-14 OPEN); the turn does not choose a location
   itself, and never writes into `tasks/` or `events.jsonl`.
6. **No other live loop turn is in progress** [P — this procedure, by
   analogy with F-34's concurrency 1], so that two turns never scan or
   write the same records at once.

**If any item fails or cannot be confirmed: stop.** Write nothing to the
SIE record area. Report to the orchestrator which item failed and the
evidence checked. Where the missing item is an authorization or a
Founder decision, the orchestrator escalates it to the Founder (PROC-6).
**Absence of an answer is not authorization** (NR-8). A turn that stops
here has not run and is not a null result: the null result (PROC-7) is a
record of a check that was made, and no check was made.

### PROC-1 — Fix the scan scope and read existing records only

[P — Spec §5 DET-5 (SIE-03 working scope), §5.3; this procedure for the
snapshot.]

1. **Record the snapshot.** The repository commit SHA at which the turn
   reads (task records and `events.jsonl` are tracked in the repository,
   so one SHA fixes both), the task-record directory path, the event-log
   path, the number of task records read, and the number of event lines
   read.
2. **Record the detector version**: the commit SHA of
   `scripts/sie-detector.mjs` used.
3. **Read only what the scope covers**: Runner task records and events.
   No tick index is read: none exists in the repository and none is
   authorized under SIE-03 (Spec §5.3), so R6 yields "insufficient
   evidence" for every `in_progress` task. That is recorded, not worked
   around.
4. **Do not change what is read.** The turn does not run, re-run, retry,
   resume, unblock, or re-queue any task, and does not add, edit, or
   replay any event, to obtain records (NR-1, NR-3).

### PROC-2 — Run the detector

[P — Spec §5 (DET-1–DET-9), §5.2; T1 implementation.]

1. Run the detector over the PROC-1 paths **without** an output
   directory first:
   `node scripts/sie-detector.mjs --tasks <task-record dir> --events <event log>`.
   This prints the scan as JSON and writes nothing.
2. Keep the whole result in the turn record (PROC-7): `candidates`,
   `insufficient` (insufficient-evidence entries, which are records, not
   candidates), and `not_evaluated` (the R4 event dimension).
3. If the detector exits with an error (for example a task file that does
   not parse — the detector stops loudly rather than skipping it), the
   turn records the error verbatim and stops at this step. A detector
   error is **not** a candidate, an incident, or a failure of a task, and
   the turn does not repair source records to make the scan pass (NR-3).
   The error is recorded verbatim in the turn record (PROC-7) and
   reported to the orchestrator, who handles it. It is **not** a PROC-6
   escalation and needs no Founder review: a detector or scan failure is
   not a governance, security, material-risk, authorization-change, or
   designated-gate item, so no PROC-6 category applies.

### PROC-3 — File detector candidates

[P — Spec §5 DET-5, DET-8, DET-9; T1 `writeCandidates`.]

1. Write the candidates into the candidate directory of the SIE record
   area named in PROC-0 item 5:
   `node scripts/sie-detector.mjs --tasks <dir> --events <file> --out <candidate dir>`,
   at the same PROC-1 snapshot as the PROC-2 run. If its candidate set
   differs from PROC-2's, the turn records both and stops (the snapshot
   was not fixed). The detector refuses any output location inside a
   task-record directory or on an event file.
2. Record the result: `created` (new candidate ids) and `existing`
   (candidate ids already on file, left untouched). Because candidate ids
   are deterministic (DET-8), a repeated scan of unchanged records creates
   no duplicates; an `existing` candidate is **not** a new observation and
   is not counted as a recurrence.
3. A candidate record says only that a rule fired on recorded values. It
   carries no interpretation (DET-9) and is never relabeled as a failure
   (NR-2).

### PROC-4 — Triage each candidate by recorded judgment

[P — Spec §6 INC-6, DET-2; this procedure for the outcome list.]

For each candidate in `created`, and for each `existing` candidate that
has no recorded triage judgment yet, record **one** of these outcomes,
with who decided, the date, and the reason:

| Outcome | When | What is written |
|---|---|---|
| **T-A Open an incident** | The judge considers the observation worth tracking as an incident | A new incident record via `createIncident` (PROC-5.1) |
| **T-B Relate to an existing incident** | The candidate concerns the same recorded blocker or task as an incident already on file | An update to that incident (PROC-5.2) |
| **T-C No incident** | The judge considers that no incident is warranted (for example, the recorded state is an expected one) | The reason, in the turn record. The candidate record stays on file unchanged |
| **T-D Escalate** | The candidate or its context falls in a PROC-6 category, or the judge cannot decide | An escalation record (PROC-6); the candidate stays untriaged until the decision is recorded |

Rules for this step:

- **Every outcome is a judgment, including T-C.** No outcome is chosen
  automatically by rule, count, or default (NR-4). Who may act as the
  judge on a live loop turn is not decided here: the D2 operational model
  (verifier identity, risk classes) is a proposal (Spec §19 SIE-D2), and
  delegated approval is F-21 (OPEN). Until those are decided, a judgment
  whose category requires human review goes to the Founder (PROC-6).
- **T-A does not mean "failure".** Opening an incident records that an
  observation is being tracked. The incident's title states the observed
  behavior, not a presumed cause (Spec §6.2 `title`).
- **Insufficient-evidence entries are not candidates.** They are listed in
  the turn record and are not triaged as T-A/T-B (Spec §5.2: "insufficient
  entries are records, not candidates").

### PROC-5 — Open or update incident records

[P — Spec §6.1, §6.2, §7, §8; T2 implementation.]

**PROC-5.1 Opening (outcome T-A).** Call `createIncident` with:

- `detector_rule` (R1–R6) and `candidate_record_id` (the DET-8 id), plus
  the creation judgment (`opened_by`, `reason`; Spec INC-6);
- `observed_facts`, each with a source pointer into the PROC-1 snapshot,
  with no interpretation;
- `hypotheses`, each labeled as a hypothesis with author and date, or an
  empty list with a stated reason;
- `reproduction_supported_conclusions` empty: a turn records no
  conclusion without reproduction evidence (Spec §3 evidence standard,
  INC-4).

The record opens in `OPEN`. If the module refuses (for example an
incomplete record), the refusal and its named fields go into the turn
record and no incident is opened (NR-5).

**PROC-5.2 Updating (outcome T-B).** Only through the T2 functions, only
as each permits:

- **Recurrence evidence** (a new post-fix occurrence, with its task id and
  pointer): FIXED → REOPENED or WATCH → REOPENED via `transition`, or
  `recordFurtherRecurrence` on a REOPENED record. Recurrence evidence
  increments `recurrence_count`; whether a WP-04 recurrence exists is
  decided by the cross-task definition over all recorded occurrences
  (Spec INC-2, DV-9), not by one occurrence. For event-type occurrences
  the result is "not evaluated" (R4-events [OPEN]).
- **Corrected-verdict evidence**: `annotateCorrectedVerdict` on
  FIXED/WATCH (an annotation, not a recurrence), or VALIDATED → REOPENED
  via `transition`. It never increments `recurrence_count` (Spec INC-2,
  CR-03).
- **Diagnosis entries**: a hypothesis that gains reproduction support
  becomes a new conclusion entry via `promoteHypothesisToConclusion`; the
  hypothesis entry is preserved (INC-4).
- **Validation evidence fields**: may be recorded via
  `recordValidationEvidence` when the evidence exists. Recording a field is
  not validation.

**PROC-5.3 Watch [PROVISIONAL].** Where a record is in WATCH, the turn may
compute the watch status with `watchWindow`, `watchEnd`,
`exposureInWindow`, and `watchOutcome`. Every such computation is
**PROVISIONAL** (H5 / decision 5 and SIE-02 OPEN), names its reading and
counting rule, and is recorded with those labels (NR-6). A PROVISIONAL
computation is never reported as a final watch result.

- An outcome of `mandatory-deeper-review` (`recurrence_count >= 2`; Spec
  WAT-6, threshold's meaning under cross-task counting OPEN, DV-9) is
  recorded and **escalated** (PROC-6). The deeper-review procedure itself
  is [OPEN — SIE-07]; the turn does not invent or perform one.
- `extend-by-full-window` and `continue-watch` are recorded as PROVISIONAL
  outcomes; nothing else follows from them in the turn.
- `eligible-for-validation-judgment` is **not validation** (Spec VAL-2).
  It is recorded and escalated (PROC-6), because the sufficiency judgment
  and independent verification are human/D2 matters.

**PROC-5.4 No validation in a turn.** The turn does not transition any
record to VALIDATED. With the D2 role pending, the mechanism refuses it in
any case (element (3) is `NOT SATISFIED`; Spec VAL-1, H4), and no record
may claim WP-04's "at least 2 unrelated users" condition (DV-3 / C-16
OPEN). Zero recurrence alone, a merged PR alone, fixture evidence, and a
null result never validate anything (Spec VAL-3).

### PROC-6 — Escalation (the escalation case)

[DECIDED — D2: "Human review is required for high-risk, security,
governance, and first-product decisions"; Brief §8.3 (no delegate
appointed, so every human review is the Founder's; F-21 OPEN); P — Spec
§15 PRO-1, §14.2 GOV; P — Stage 2 spec 07 ES-1, ES-2, ES-10–ES-13; P —
this procedure for the category descriptions.] (AC-T3-3)

**Founder review is required for each of these categories.** The turn
does not decide an item in any of them, does not act on it, and does not
treat it as decided:

| # | Category | Includes (at least) |
|---|---|---|
| 1 | **Governance** | Any governance-adjacent change or claim: governance, authorization, security policy, first-product decisions (Spec §14.2 GOV (a)); any proposed change to the SIE rules, standards, or vocabulary; any open finding or open item the turn's work touches (Spec §19) |
| 2 | **Security** | Any candidate, record, or observation involving secrets, credentials, authentication, access control, or a possible safety issue. A safety issue stops the turn immediately; the stop is recorded afterwards, and resumption needs explicit clearance (Stage 2 spec 07 ES-13; F-29 OPEN) |
| 3 | **Material risk** | Anything that could affect production, real data, spending, a merge, a deployment, or the execution state the Runner owns; any item the turn's Task Brief classes High-risk; any Task Brief limit insufficient or exceeded (D6; ES-4). Not defined further by the Specification: [P — this procedure] — when in doubt, treat it as material risk and escalate |
| 4 | **Authorization change** | Anything that would expand autonomy, permissions, or scope, or change who may decide what (Spec §14.2 GOV (b)); any waiver or exception to a safety rule (GOV (c): a builder or verifier cannot grant one); any action outside the live-loop authorization |
| 5 | **Designated gate** | Any item the Register, the Brief, the Specification, the live-loop authorization, or the turn's Task Brief designates as requiring Founder decision. This includes the protected actions (merge to main, deployment, migration, spending, real data, security-policy change; Stage 2 spec 07; repo `docs/policy.md` §3), the trigger basis (§1, PROC-0 item 3), the SIE-05 fallback, a `mandatory-deeper-review` outcome (SIE-07 OPEN), an `eligible-for-validation-judgment` outcome (sufficiency judgment; D2), and the C-15 and C-16 rulings |

**What the turn does when an item falls in a category:**

1. **Stop work on that item.** Do not take the action, make the
   judgment, or record the decision.
2. **Write an escalation record** (Stage 2 spec 07 ES-1) in the SIE
   record area, containing: the turn and task ids; the live-loop
   authorization reference; who raised it; the category (one or more of
   1–5) and why; the item (candidate id, incident id, or observation, with
   source pointers); the decision or input needed; who decides (the
   Founder); the evidence attached; a recommendation, labeled as a
   recommendation; the response-by time; and the waiting behavior.
3. **Hand it to the orchestrator**, who brings it to the Founder with the
   recommendation (ES-3). The escalation goes up, never sideways.
4. **Wait without proceeding on that item.** The affected item stays
   held. If nothing else remains, the turn requests, via the orchestrator
   (step 3), that the orchestrator mark the turn's task `blocked` through
   the existing task mechanism, naming what is needed and who can unblock
   it. The turn itself writes nothing to the task record (NR-3). Steps
   that do not depend on the item may continue, and the turn record
   (PROC-7) is still written.

**Silence or delay is never approval.** [P — Register ADR-09: "Silence and
timeout never equal approval"; Stage 2 spec 07 ES-11; Spec §14.2 GOV:
"Silence, delay, or unavailability is never approval".]

- An unanswered escalation is never treated as "yes", "no objection", or
  "proceed with the recommendation".
- A passed response-by time does not convert into approval. It is
  re-surfaced to the Founder once, with the original record, and the item
  stays held (ES-10).
- An escalation never expires into approval. It closes only by a recorded
  Founder decision, or by being withdrawn by the raiser (recorded).
- A verifier PASS, a completed task status, schedule pressure, or a later
  turn finding nothing does not grant what an escalation asked for.
- Each later turn carries open escalations forward in its turn record
  (PROC-7) until they close.

### PROC-7 — The turn record (always written, including the null result)

[P — Spec §15 PRO-1: "records what was checked even when nothing was
found (a null result is a record, not an absence)"; this procedure for the
fields.]

Every turn that passes PROC-0 writes **one turn record**, whatever
happened afterwards: candidates found, nothing found, a stop at PROC-2, or
an escalation. The turn record is an SIE record in the SIE record area
(path per PROC-0 item 5; Spec §11, F-14 OPEN). It is Markdown, append-only
once committed, and corrected only by annotated supersession (Spec §12
Section 6).

**Fields** (none may be omitted; an empty value is written as "none" with
the reason):

| Field | Content |
|---|---|
| `turn_id`, `task_id` | The turn's id and its runner task id |
| `authorization` | The live-loop authorization reference and the PROC-0 checks, each with the evidence checked |
| `trigger_basis` | The basis recorded with the authorization (§1.1), cited, not restated as met by the turn |
| `snapshot` | PROC-1: commit SHA, paths, task-record count, event-line count |
| `detector_version` | Commit SHA of `scripts/sie-detector.mjs` |
| `rules_evaluated` | R1, R2, R3, R4 (blocker half), R5, R6 (with the tick-index limit) |
| `not_evaluated` | Verbatim from the detector: the R4 event dimension ([OPEN] — not evaluated). Plus anything outside the SIE-03 scope that was not read |
| `insufficient_evidence` | Every insufficient-evidence entry, verbatim |
| `candidates` | `created` ids and `existing` ids (PROC-3) |
| `triage` | Per candidate: outcome T-A/T-B/T-C/T-D, judge, date, reason (PROC-4) |
| `incident_records` | Ids opened or updated, with the function used and the resulting status; every refusal with its named reason (PROC-5) |
| `watch_computations` | Each with reading, counting rule, and the label PROVISIONAL (PROC-5.3) |
| `escalations` | New escalations raised this turn and open ones carried forward, each with status (PROC-6) |
| `result` | Exactly one of: **candidates found** (n created, m existing); **null result**; **stopped at PROC-n** with the reason |
| `not_claimed` | The fixed statement in PROC-7.2 |

**PROC-7.1 The null result.** When the scan returns no detector
candidates, `result` reads:

> "Null result: no detector candidate under the rules evaluated, on the
> scope read, at snapshot <commit SHA>. Not evaluated: R4 event
> dimension. Insufficient evidence: <n> entries (listed)."

A null result is **a record that the check was made**, with what was
checked and what was not. It is **not**:

- a statement that no failure occurred, that the system is healthy, or
  that anything works;
- exposure evidence, zero-recurrence evidence sufficient for validation,
  or validation of anything (Spec EXP-1: record creation alone is zero
  exposure; VAL-3: zero recurrence alone never validates);
- a statement about the R4 event dimension or about R6 where the tick
  position was not determinable;
- a basis for the first-live-loop trigger or for its 30-day fallback
  (SIE-05 OPEN; §1.3).

**PROC-7.2 What every turn record states as not claimed.** "This turn
claims no failure, no runner-caused failure, no validation, no lesson, no
reuse, no evaluation, and no improvement. Detector candidates are
observations that a rule fired. Watch computations are PROVISIONAL. R4
events were not evaluated. WP-04's two-user exposure condition (C-16) is
not enforced and is not claimed."

### PROC-8 — Close the turn

[P — repo `AGENTS.md` workflow; Brief §8; D2.]

1. The turn's SIE records (candidates, incident records, escalation
   records, turn record) are committed on a branch, never on main, with
   the one-off builder identity flags (repo `AGENTS.md`), and proposed in a
   pull request.
2. Verification follows D2 and the working model of Brief §8: the
   verifier receives the exact commit and checks the records against this
   procedure. "Builder explanations are not independent evidence" (D2).
3. **No merge without Founder approval** after verification passes and
   the required check is green. Merging a turn's records is a protected
   action (PROC-6 category 5).
4. The turn's evidence (commit, PR, turn record path) is recorded in the
   turn record (PROC-7). The orchestrator, which owns the turn's task
   record (LT-2), records that evidence on the runner task and ends the
   task through the existing task mechanism. The turn itself writes
   nothing to the runner task record (NR-3). It does not schedule or
   start the next turn; whether and when later turns run is the
   live-loop authorization's to state (§8, item 4).

---

## 5. End-to-end flows

These are **templates** in placeholders (`<…>`), not examples run on
anything. No flow below was executed, and no flow describes a failure
being produced.

### 5.1 Null-result turn

1. PROC-0: all six checks pass, each cited.
2. PROC-1: snapshot `<sha>`; `<n>` task records; `<m>` event lines.
3. PROC-2: the detector prints `candidates: []`, `insufficient: [<…>]`
   (for example, R6 for each `in_progress` task: tick position not
   determinable), `not_evaluated: [R4 event dimension]`.
4. PROC-3: run with `--out`; `created: []`, `existing: []`.
5. PROC-4, PROC-5: nothing to triage; no incident opened or updated.
   Watch computations on records already in WATCH, if any, are recorded
   as PROVISIONAL.
6. PROC-6: no new escalation; open escalations carried forward.
7. PROC-7: turn record with `result` = the PROC-7.1 null-result text and
   the PROC-7.2 statement.
8. PROC-8: branch, PR, verification; merge only on Founder approval.

### 5.2 Escalation turn

1. PROC-0 to PROC-3 as above; the scan yields candidate `<id>`.
2. PROC-4: the judge finds that `<id>` concerns `<observation>`, which
   falls in category `<1–5>` (for example, a recorded blocker naming a
   credential problem: security). Outcome **T-D**.
3. PROC-6: work on `<id>` stops. An escalation record is written with
   every ES-1 field, a labeled recommendation, a response-by time, and
   the waiting behavior; the orchestrator brings it to the Founder.
4. Other candidates continue through PROC-4/PROC-5 if they do not depend
   on `<id>`.
5. PROC-7: turn record lists the escalation as open; `result` =
   candidates found.
6. If the response-by time passes unanswered: the escalation is
   re-surfaced once; `<id>` stays held; **nothing is treated as
   approved**. The next turn carries the escalation forward.
7. When the Founder decides, the decision is recorded and cited; only then
   does triage of `<id>` proceed, within what the decision states.

### 5.3 Candidate-to-incident turn

1. PROC-0 to PROC-3; candidate `<id>` (rule `<Rn>`) is created.
2. PROC-4: outcome **T-A**, judge `<who>`, reason `<why>`.
3. PROC-5.1: `createIncident` with `detector_rule: <Rn>`,
   `candidate_record_id: <id>`, observed facts with pointers, hypotheses
   labeled; status `OPEN`. The record calls the observation a detector
   candidate and its title states the observed behavior.
4. PROC-7: the turn record names the new incident id. No claim of failure,
   cause, or fix is made.
5. Any fix is a separate task under the normal workflow; FIXED, WATCH,
   and later states are recorded by later turns or tasks through the T2
   functions, with every watch computation PROVISIONAL and no transition
   to VALIDATED (PROC-5.4).

---

## 6. What a live loop turn must NOT do

- Start, schedule, or authorize a live loop or another turn (§0.1).
- Create, simulate, or stage a real failure, or a task; manufacture the
  underlying incident (the failure event itself); run a demo failing test
  on a live system; run, re-run, retry, interrupt, block, or fail a task
  to obtain something to observe (NR-1). Creating an incident record
  about existing observations (PROC-5.1) is permitted and is not
  manufacturing an incident (§0.2).
- Edit, add, reorder, backfill, replay, or delete a task record or event
  (NR-3).
- Write, edit, or update a Runner task record, including marking its own
  task `blocked` or recording evidence on it. Those lifecycle updates are
  the orchestrator's, through the existing task mechanism, on the turn's
  request (NR-3, PROC-6 step 4, PROC-8 item 4).
- Place fixture or synthetic material among operational records, or report
  a fixture result as an observation (Spec FXT-1, FXT-2).
- Call a detector candidate a failure, a runner-caused failure, a defect,
  or a regression; report candidate counts as failure counts (NR-2).
- Classify an incident or choose a triage outcome automatically (NR-4).
- Write records outside the implemented mechanisms, or work around a
  refusal (NR-5).
- Transition a record to VALIDATED; claim validation, independent
  validation, a lesson, reuse, evaluation, improvement, or a compounding
  change (PROC-5.4, LT-4).
- Treat a watch computation as final (NR-6).
- Claim the R4 event dimension was evaluated; invent an R4 event key;
  claim DV-3 is satisfied; define "unrelated users"; treat the lifecycle
  order as settled (NR-7).
- Use the seed-docs fallback while SIE-05 is OPEN, define its criteria, or
  choose a start date for the 30 days (§1.3).
- Decide an item in an escalation category, or treat silence, delay,
  unavailability, or a passed deadline as approval (PROC-6, NR-8).
- Merge, deploy, spend, contact production or any external party, change
  the Runner, or add a service, daemon, or database (LT-2; Brief §10).
- Omit the turn record, including when nothing was found (PROC-7).

---

## 7. Traceability — requirement to step

| Requirement (source) | Where in this procedure |
|---|---|
| Read existing records only (Spec PRO-1; DET-4, DET-5) | NR-3, PROC-1 |
| Run the detector (PRO-1; Spec §5) | PROC-2 |
| File detector candidates (PRO-1; DET-8, DET-9) | PROC-3 |
| Open or update incident records by recorded judgment (PRO-1; INC-6; §6) | PROC-4, PROC-5 |
| Never equate candidate with failure (PRO-1; DET-2, DET-3) | NR-2, PROC-3 item 3, PROC-4 |
| Never manufacture a failure (PRO-1, PRO-2; D1) | §0.2, NR-1, §6 |
| Escalate governance/security/material-risk/authorization-change/designated-gate items to Founder review (PRO-1; D2) | PROC-6 |
| Silence or delay never approval (Spec §14.2 GOV; Register ADR-09) | NR-8, PROC-6 |
| Null result is a record (PRO-1) | PROC-7, PROC-7.1, flow 5.1 |
| First-live-loop trigger, verbatim (PRO-3; Spec §2 point 3) | §1.1 (review note separated, §1.2; SIE-05 open, §1.3) |
| Start conditions (PRO-4) | §1.4, PROC-0 |
| Stage 3 does not start the loop (PRO-5; Brief §5.5) | §0.1 |
| Seven capabilities, quoted (Spec §2 point 4) | LT-3 |
| Ordinary runner tasks; no service/daemon/database (LOC-3, LOC-4; DV-7) | LT-1, LT-2 |
| Retrieval results are judgment material only (Spec §16 RET-2) | §8 item 6 |
| Reuse, compounding, and F-36 not performed (Spec §16 REU-1, REU-2, CMP-1) | LT-4, §6 |
| Watch PROVISIONAL (WAT-4; H5, SIE-02) | NR-6, PROC-5.3 |

---

## 8. Open items that affect this procedure

None is decided here. Owners and unblocking conditions are in Spec §19
unless stated.

1. **SIE-05** — seed-docs-inconsistency criteria and the start of the 30
   days. Until decided, the fallback branch cannot be a turn's basis.
2. **H1** — demo failing test (runner task vs. orchestrator). Not needed:
   no turn runs one.
3. **H4 / SIE-D2** — D2 operational verifier role and risk classes. Until
   decided, independent verification stays `NOT SATISFIED`, and who acts
   as triage judge on a live turn is not settled (PROC-4).
4. **Cadence and scope of later turns** — whether each turn after the
   first needs its own authorization, how often turns run, and whether the
   live-loop authorization widens the SIE-03 read scope. Not stated in the
   Specification [OPEN — not in Spec §19; for the live-loop
   authorization].
5. **F-14** — record location; turn records and escalation records go
   where the authorization names (PROC-0 item 5).
6. **Retrieval** — if a turn consults existing SIE records by grep (Spec
   §16 RET-1), "Grep results are candidate material for judgment, never
   automatic reuse or automatic lesson promotion" (RET-2, [P]). The
   staging and retrieval procedure itself is T7's.
7. **SIE-07** — deeper-review procedure; the turn records and escalates
   the trigger only.
8. **C-15 (DV-2), C-16 (DV-3)** — Founder rulings pending.
9. **R4-events** — [OPEN]/not-evaluated (Founder Amendment, 2026-11-06).
10. **H5 / decision 5, SIE-02** — every watch computation PROVISIONAL.
11. **"Material risk"** is not defined by the Specification; the
    PROC-6 category 3 description is [P — this procedure].
12. **F-21** — delegated approval; no delegate exists, so every PROC-6
    review is the Founder's.

---

## 9. Explicitly NOT decided or authorized here

- **No live loop is started, scheduled, or authorized** — not the first
  live loop, not any turn (§0.1; PRO-5).
- **No operational evidence is claimed.** No step was executed; no record
  was created. This document is evidence level: Structural at most (Spec
  EVL-7: "A design document proves intent, not execution").
- No WP-04 wording is invented. The trigger (§1.1) and the capabilities
  (LT-3) are quoted from the filed retrieval via the Specification; the
  review note (§1.2) is labeled as not WP-04; the "ordinary runner tasks"
  sentences (LT-1) are labeled as unverified reconstructions.
- Nothing here decides SIE-05, F-36, F-14, F-10, F-16, F-21, F-34,
  H1–H6, SIE-01–SIE-07, C-15, C-16, C-19, C-20, the R4 event key, the D2
  operational model, or the cadence of later turns.
- No Milestone B, Group C, validated lesson, reuse, improvement, or
  compounding claim.
- No Runner change, database, service, daemon, deploy, spending,
  production contact, or new provider.
