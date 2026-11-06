# T3 Builder Report — Live loop turn procedure

**This report is a claim to be checked, not evidence.** "Builder
explanations are not independent evidence" (Register §10 D2). Nothing here
certifies the work as verified. Verification is a separate step, done by an
independent verifier (Brief §8), followed by the human review that the
Governance risk class requires.

**Stage 3 does not start the live loop.** This task wrote a document only.
No step of the procedure was executed: the detector was not run against
live records, and no candidate, incident, escalation, or turn record was
created anywhere.

## Identity (CR-03 source fields)

| Field | Value |
|---|---|
| Task and project identity | Stage 3, task T3 — Procedure (the loop as an ordinary runner task); project Genesis (`garzonandres2004/genesis`) |
| Builder identity | Claude Code, builder role ("Claude (builder)") |
| Model/tool version (D6 addition) | Claude Opus 5.5 (`claude-opus-5-5`) via Claude Code. This is the builder's own declaration. It corroborates the identity but does not establish it independently. The T3 task brief named no model restriction |
| Starting commit | `6f90c11` (branch `stage-3/sie-milestone-a`; T2 fix round 1; PR #36 open, not merged). Verified with `git status` (clean) and `git log --oneline -3` before work began |
| Resulting commit | The commit titled "Stage 3 T3: live-loop procedure (AC-T3-1..AC-T3-4)" on `stage-3/sie-milestone-a`. The verifier must take the exact SHA from the branch head, not from this report |
| Risk class | **Governance** (Brief §9 T3: it states the loop's authorization and escalation rules). Human review required (D2) |
| Authorization reference | Founder approval of the Stage 3 Execution Brief §11 boundary, 2026-11-06 ~09:40 MST (coordinator record); Founder Amendment 2026-11-06 ~10:39 MST (R4-events [OPEN]; Stage 3 exits on Milestone A) |
| Specification | `docs/stage-3/00-sie-specification.md`, version 0.4-draft (§15 PRO-1–PRO-5, §2 points 3–4, §16; applied without change: §5, §6, §7, §8, §11, §12, §14.2 GOV, §19) |

## What was written

| File | Lines | Content |
|---|---|---|
| `docs/stage-3/T3-procedure.md` | 762 | The live loop turn procedure (new) |
| `docs/stage-3/T3-builder-report.md` | this file | This report (new) |

**Location.** `docs/stage-3/T3-procedure.md`, the location the task brief
suggested. Neither the Specification nor an existing convention names a
different one: Spec §18 maps T3 to §15 without naming a file, and the
other Stage 3 deliverables sit in `docs/stage-3/`.

**No other file changed.** No code, test, fixture, Specification, README,
task record, event, CI, or Runner file was touched. No test was added:
every AC here is a property of the document's text, checkable by reading
it and by the string checks in "Verification method".

### Structure of the procedure

- **§0** — Stage 3 does not start the live loop (AC-T3-4); no faked
  failures (AC-T3-1); provenance labels.
- **§1** — The first-live-loop trigger, quoted verbatim (AC-T3-2); the
  review note, labeled as not WP-04; what stays [OPEN] (SIE-05); the PRO-4
  start conditions.
- **§2** — What a turn is: LT-1 (ordinary runner task, labeled
  [REF — UNVERIFIED, DV-7]), LT-2 ([DECIDED] no service/daemon/database,
  no Runner change), LT-3 (seven capabilities, quoted), LT-4 (a turn
  exercises Observe and records judgments; it validates, learns, reuses,
  evaluates, and compounds nothing).
- **§3** — Rules binding every step: NR-1 no manufactured failure; NR-2
  candidate is not a failure; NR-3 read existing records only; NR-4 no
  automatic classification; NR-5 records only through the T1/T2
  mechanisms; NR-6 watch PROVISIONAL; NR-7 open items stay open (R4-events,
  C-15, C-16, H4, and the named findings); NR-8 silence is never approval.
- **§4** — The steps, end to end:
  - PROC-0 preconditions and authorization check (stop before reading
    anything if any fails);
  - PROC-1 snapshot and read-only scope;
  - PROC-2 run the detector (print-only first);
  - PROC-3 file candidates (`--out`, same snapshot);
  - PROC-4 triage each candidate by recorded judgment (T-A open, T-B
    relate, T-C no incident, T-D escalate);
  - PROC-5 open or update incident records through the T2 functions,
    with watch PROVISIONAL and no VALIDATED;
  - PROC-6 escalation (the five Founder-review categories, the
    escalation record, waiting behavior, silence-is-never-approval);
  - PROC-7 the turn record, always written, including the null result;
  - PROC-8 close the turn (branch, PR, verification, no merge without
    Founder approval; the turn schedules nothing).
- **§5** — Three end-to-end templates in placeholders: null-result turn,
  escalation turn, candidate-to-incident turn. Labeled as templates, not
  runs.
- **§6** — What a turn must NOT do.
- **§7** — Requirement-to-step traceability.
- **§8** — Open items affecting the procedure.
- **§9** — Not decided or authorized.

## Per-AC evidence (claims — the verifier decides)

### AC-T3-1 — No step creates, simulates, or stages a real failure

**Claim: met.**

- §0.2 states: "**No step in this procedure creates, simulates, or stages
  a real failure.**" It explains why: every step reads existing records or
  writes SIE records *about* them.
- NR-1 binds every step: "No step creates, simulates, or stages a failure,
  an incident, or a task. No demo failing test on live systems (H1 OPEN)."
  It also keeps fixtures out of operational records (FXT-1, FXT-2).
- PROC-1 item 4: the turn "does not run, re-run, retry, resume, unblock,
  or re-queue any task, and does not add, edit, or replay any event, to
  obtain records".
- PROC-2 item 3: a detector error is not a failure, and source records are
  not repaired to make a scan pass.
- §5: the flows are "**templates** in placeholders (`<…>`), not examples
  run on anything. No flow below was executed, and no flow describes a
  failure being produced."
- §6 lists the forbidden acts, first among them: "Create, simulate, or
  stage a failure, an incident, or a task; run a demo failing test on a
  live system; run, re-run, retry, interrupt, block, or fail a task to
  obtain something to observe".

**What the verifier should check:** read each PROC step's actions and
confirm none of them produces a failure, an incident from nothing, or a
task. The only writes are `writeCandidates` (PROC-3), the T2 functions
(PROC-5), escalation records (PROC-6), turn records (PROC-7), and the
commit/PR (PROC-8).

### AC-T3-2 — Trigger stated exactly as WP-04 v1.1 does; no faked failures

**Claim: met.** §1.1 quotes, verbatim and on their own lines, both WP-04
passages from Spec §2 point 3.

WP-04 v1.0 §F, as carried in v1.1:

> "No failures are faked: the first live loop runs on the first real post-November-5 failure, or on a seed-docs inconsistency if no real failure occurs within 30 days."

WP-04 v1.1 matrix line:

> "First live loop on the first real post-November-5 failure, or a seed-docs inconsistency if none in 30 days, no faked failures — [BASE] (October 29 roadmap)."

- **Not paraphrased as the trigger.** No other sentence in the document is
  presented as the trigger. §1.3, §1.4, and PROC-0 refer back to §1.1
  instead of restating it.
- **The review note is labeled.** §1.2 is headed "Review note — NOT WP-04
  text" and quotes the retrieval's note ("The first live SIE loop cannot
  start automatically after November 5. …") "as a review note only. It is
  not WP-04 wording and is not the trigger". PROC-0 item 2 cites it "as a
  review note, not as WP-04".
- **WP-04's governance gate**, which *is* WP-04 text (Spec §2 point 8,
  §H/J), is quoted separately in §1.2: "Implementation requires a separate
  Stage 3 authorization and an explicit start command."
- **Nothing invented for SIE-05.** §1.3: the retrieved text "gives **no
  criteria** for a 'seed-docs inconsistency'" and "does **not say what the
  30 days are counted from**. Both stay **[OPEN] (SIE-05)**. … This
  procedure **defines no seed-docs-inconsistency criteria and names no
  start date for the 30 days.**" The fallback branch therefore cannot be a
  turn's basis while SIE-05 is open (§1.3, PROC-0 item 3).
- **"Real failure" not defined.** §1.3 records that the retrieved text does
  not define it further and that a detector candidate does not meet the
  trigger.
- **No faked failures:** see AC-T3-1. The quoted trigger itself opens with
  "No failures are faked".

**Byte check performed by the builder:** a throwaway Node script (outside
the repo) checked that each quoted passage — both trigger passages, the
review note, the seven capabilities, the governance gate, and the DET-2
passage — appears in both the Specification and the procedure. Both
trigger passages and the review note match byte-for-byte. The governance
gate and DET-2 passages match after line-wrap whitespace normalization
(they are wrapped across lines in the procedure).

### AC-T3-3 — Founder review for the five categories; silence or delay is never approval

**Claim: met.** PROC-6 opens: "**Founder review is required for each of
these categories.**" Its table names, as rows 1–5:

1. **Governance**
2. **Security**
3. **Material risk**
4. **Authorization change**
5. **Designated gate**

Each row lists what it includes at least, citing its source (Spec §14.2
GOV (a)–(c); Stage 2 spec 07 ES-4, ES-13; repo `docs/policy.md` §3). The
"Material risk" description is labeled [P — this procedure], because the
Specification does not define the term, with "when in doubt, treat it as
material risk and escalate". "Founder" is the reviewer because no
delegate is appointed (Brief §8.3; F-21 OPEN; §8 item 12).

Silence is never approval: PROC-6 states, in bold, "**Silence or delay is
never approval.**" It cites Register ADR-09 ("Silence and timeout never
equal approval"), Stage 2 spec 07 ES-11, and Spec §14.2 GOV ("Silence,
delay, or unavailability is never approval"). It then spells out what
that means:

- no unanswered escalation is read as yes;
- a passed deadline is re-surfaced once and the item stays held;
- escalations never expire into approval;
- a verifier PASS, a completed status, schedule pressure, or a later null
  turn grants nothing.

NR-8 restates the rule for every step, and PROC-0 applies it to a missing
authorization ("**Absence of an answer is not authorization**").

The escalation case is complete end to end: PROC-6 steps 1–4 (stop,
escalation record with the ES-1 fields, hand up to the orchestrator and
Founder, wait), and flow §5.2 walks it through to the Founder's recorded
decision.

### AC-T3-4 — The procedure states that Stage 3 does not start the live loop

**Claim: met.**

- §0.1 is headed "Stage 3 does not start the live loop (AC-T3-4)". It
  states "**Stage 3 does not start the live loop.**" [DECIDED — Stage 3
  authorization, Brief §5.5, §10 item 10, §11; Spec §15 PRO-5], and quotes
  PRO-5: "Stage 3 does not start the first live loop, and this
  Specification authorizes no live loop. The first live loop is a
  separately authorized step after Stage 3."
- It adds that writing, reviewing, verifying, or merging this procedure,
  or completing any Stage 3 task (T8's checklist included), starts and
  authorizes nothing.
- §1.4 carries PRO-4 ("It does not start by passage of time, by
  completion of this Specification or of any Stage 3 task, or by the
  absence of a failure").
- PROC-0 stops every turn before it reads anything until a separate
  live-loop authorization exists.
- PROC-8 item 4: a turn schedules or starts no further turn.
- §9 repeats: "**No live loop is started, scheduled, or authorized**".

### Brief §T3 "Work" items and the exit condition

| Brief §T3 work item | Where |
|---|---|
| Read existing records only | NR-3, PROC-1 |
| Run the detector | PROC-2 |
| File candidates | PROC-3 |
| Open or update incident records | PROC-4, PROC-5 |
| Never equate candidate with failure | NR-2, PROC-3 item 3, PROC-4 |
| Never manufacture a failure | §0.2, NR-1, §6 |
| Escalate governance/security/material-risk items to Founder review | PROC-6 |
| Record what was checked even when nothing was found | PROC-7, PROC-7.1 |
| State the trigger exactly as WP-04 v1.1 does | §1.1 |
| **Exit:** complete end to end, including the null-result case and the escalation case | PROC-0 to PROC-8; null result PROC-7.1 and flow §5.1; escalation PROC-6 and flow §5.2 |

## Standing-rule compliance

- **R4-events [OPEN]/not-evaluated.** NR-7, PROC-2 item 2, PROC-5.2,
  PROC-7 (`not_evaluated` field), PROC-7.1, and PROC-7.2 all record the
  event dimension as "not evaluated", never as "no event recurrence". No
  event key is defined. §6 forbids inventing one.
- **Milestone A exit, not Phase 1.** The procedure makes no exit claim at
  all and uses no phase label.
- **DV-2 / C-15.** NR-7: the turn uses AC-T2-1's order "as recorded, not
  settled".
- **DV-3 / C-16.** NR-7, PROC-5.4, PROC-7.2: not defined, not enforced,
  never claimed. "Unrelated users" is not defined.
- **Watch PROVISIONAL.** NR-6, PROC-5.3, PROC-7 (`watch_computations`),
  and the flows label every watch computation PROVISIONAL.
- **Provenance.** Every rule and step carries [DECIDED]/[REF]/[P]/[OPEN]
  with its source. The seven capabilities are quoted (LT-3). The
  "ordinary runner tasks / no new service, daemon, or database / detector
  is read-only" sentences are labeled "[REF — UNVERIFIED (DV-7)] … not in
  the retrieved WP-04 text … not presented here as WP-04 wording" (LT-1).
  The no-service/no-Runner-change constraint is carried separately as
  [DECIDED] from the Brief (LT-2).
- **No open item decided.** §8 and §9 list them. SIE-05, SIE-07, H1, H4,
  H5, SIE-02, F-14, F-21, C-15, C-16, R4-events, and the D2 model are all
  left open.

## Open items / points for the reviewer

1. **New [P] elements this procedure introduces** (each labeled
   "[P — this procedure]"), open to review:
   - the PROC-0 check list (items 4–6: task record, named record location,
     one turn at a time);
   - the triage outcomes T-A–T-D;
   - the turn-record fields;
   - the null-result wording;
   - the category descriptions in PROC-6, in particular "material risk".
2. **Who judges triage on a live turn** is not settled (D2 operational
   model a proposal; F-21 OPEN). PROC-4 routes judgments that need human
   review to the Founder in the meantime.
3. **Cadence and scope of later turns** (whether each turn needs its own
   authorization; how often; whether the live-loop authorization widens
   the SIE-03 read scope) is not in the Specification. It is recorded as
   open for the live-loop authorization (§8 item 4), and nothing was
   decided.
4. **Turn and escalation records need a home.** Spec §11's illustrative
   layout has no directory for them. The procedure writes them "in the SIE
   record area", at the path the authorization names (PROC-0 item 5,
   F-14 OPEN), and chooses no path.
5. **PROC-0 item 3 assigns the trigger determination to the recorded
   live-loop authorization**, not to the turn. This is the builder's
   reading of PRO-4 together with the review note and WP-04's governance
   gate. It is labeled [P]. The reviewer should confirm it.
6. **Stale header in `scripts/sie-detector.mjs`** (observation only, not
   changed): its header still says the six rules are "UNVERIFIED against
   WP-04 v1.1 verbatim", which predates the retrieval (Spec §2 point 1
   now quotes them). T3 cites the module's functions only. It is out of
   T3's scope, so it was not edited.

## What is NOT claimed

- **No live loop** was started, scheduled, simulated, or authorized.
- **No detector run on live records.** No candidate, incident, escalation,
  or turn record was created, in fixtures or anywhere else.
- **No operational evidence.** The procedure is evidence level:
  Structural at most (Spec EVL-7).
- **No WP-04 wording invented.** Quotations come only from the
  Specification's §2 quotations of the filed retrieval.
- **No SIE-05 criteria and no 30-day start date.** No definition of "real
  failure".
- **No R4 event evaluation or key; no DV-3 satisfaction; no settled
  lifecycle order; no final watch computation.**
- **No Milestone B, Group C, validation, lesson, reuse, evaluation,
  improvement, or compounding claim.**
- **No decision** of any open finding (F-36, F-14, F-10, F-16, F-21,
  F-34, …), of the D2 operational model, or of any open item.

## Tests and checks (builder-observed; re-run required by the verifier)

Run from the repo root on the uncommitted tree, after both files were
written:

- `npm test`: **165 tests, 164 pass, 0 fail, 1 skipped.** The skip is the
  pre-existing one. The counts are unchanged from the base, because no
  test was added or changed.
- `node scripts/status.mjs`: **exit 0.** It prints "Genesis tasks: 15
  total" (blocked 1, completed 14), unchanged.
- Quotation check: see AC-T3-2. The script was written to `/tmp`, outside
  the repo, and is not part of the commit.

## Verification method (to be run by the coordinator/verifier)

1. Confirm the diff adds exactly two files and modifies none:
   `git diff --stat 6f90c11..<head>` and
   `git diff --diff-filter=M --name-only 6f90c11..<head>` (expect empty).
2. Re-run `npm test` (expect 165 / 164 pass / 0 fail / 1 skip) and
   `node scripts/status.mjs` (expect exit 0, 15 tasks) at that commit.
3. **AC-T3-2:** compare §1.1 of the procedure with Spec §2 point 3
   character by character, for example
   `grep -F 'No failures are faked: the first live loop runs on the first real post-November-5 failure, or on a seed-docs inconsistency if no real failure occurs within 30 days.' docs/stage-3/T3-procedure.md`
   and the same for the matrix line. Confirm the review note is labeled as
   not WP-04 everywhere it appears (`grep -n 'review note' -i`). Confirm no
   other sentence is presented as the trigger, and that no
   seed-docs-inconsistency criteria or 30-day start date appear.
4. **AC-T3-1:** read every PROC step and §5. Confirm no step creates,
   simulates, or stages a failure, task, or incident. A search such as
   `grep -n -i 'simulat\|stage a\|inject\|fake' docs/stage-3/T3-procedure.md`
   should find only prohibitions.
5. **AC-T3-3:** confirm PROC-6 names all five categories, routes them to
   Founder review, and states that silence or delay is never approval.
6. **AC-T3-4:** confirm §0.1's statement, and that no step starts or
   schedules a loop or turn.
7. Check the procedure against Spec §5–§8 and the T1/T2 module APIs.
   Function names and CLI flags must match `scripts/sie-detector.mjs` and
   `scripts/sie-incident.mjs`, and no step may let a record reach VALIDATED
   or produce a non-PROVISIONAL watch result.
8. Judge the "Open items / points for the reviewer" list. Record source
   hashes, an independence declaration (Stage 2 spec 05 VI-9), and skipped
   checks separately from passed ones. Then pass the result to the human
   (Founder) review that the Governance class requires.

## Evidence-to-acceptance mapping

| AC | Evidence (in `docs/stage-3/T3-procedure.md`) |
|---|---|
| AC-T3-1 | §0.2; NR-1; PROC-1 item 4; PROC-2 item 3; §5 preamble; §6 |
| AC-T3-2 | §1.1 (two verbatim quotations); §1.2 (review note labeled not WP-04; WP-04 governance gate); §1.3 (SIE-05 open, nothing invented); §1.4; PROC-0 item 3 |
| AC-T3-3 | PROC-6 (categories 1–5, Founder review, escalation record, waiting behavior, "Silence or delay is never approval"); NR-8; PROC-0 stop rule; flow §5.2 |
| AC-T3-4 | §0.1; §1.4; PROC-0; PROC-8 item 4; §9 |
| Null-result case | PROC-7, PROC-7.1, PROC-7.2; flow §5.1 |
| Tests green / scope | `npm test`; `node scripts/status.mjs`; `git diff --stat 6f90c11..<head>` |

## Scope-compliance statement (D6 addition)

- **T3 only.** No T4–T8 work: no schema/INDEX test, seed record, Group B
  test, staging/retrieval implementation, demonstration, or readiness
  checklist.
- **Document task.** Two new Markdown files. No code or test change.
- **Not done:** no PR opened or closed, no PR comment, no merge, no
  deploy, no provisioning, no spending, no database, no production
  contact, no Runner/CI change, no new dependency, provider, server, or
  agent, no live loop, no detector run on live records, and no
  manufactured incident. No open finding and no D2 operational model was
  decided. There were no network calls apart from the instructed
  `git push`.
- **No secrets** in any file, log, or the commit message.
- **Permission prompts during the session.** Several compound shell
  commands (a `cd && git …` line, a `wc` on an out-of-repo file, shell
  loops for the quotation check, and a combined test/status line) were
  refused or needed approval. Each was replaced by single commands, the
  Read tool, or a small Node script in `/tmp`. Nothing was worked around
  through another channel.

## Limits compliance (D6 additions)

| Limit | Set by the Task Brief | Actual |
|---|---|---|
| Time | One session | One session |
| Scope | Procedure document + builder report; code only if a small test is needed to evidence an AC | Two documents only; no test was needed |
| Resource/cost | $0; local only, apart from `git push` | $0; local only, apart from `git push` |
| Model/tool | No restriction stated | Claude Code with Claude Opus 5.5. No subagents, no web access |

## Verdict rationale (builder's, not a verification verdict)

The builder submits T3 **for verification**. AC-T3-1 to AC-T3-4 are
claimed met by the text of the procedure. The trigger is quoted
verbatim, and the review note is kept separate from it. The five
Founder-review categories and the silence-is-never-approval rule are
explicit, and the Stage 3 no-start statement leads the document. The
points most likely to need reviewer judgment are open items 1 (the new
[P] elements, especially "material risk") and 5 (the trigger
determination sits with the live-loop authorization). The builder does
not assign a verification outcome.
