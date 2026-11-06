# SIE detector fixtures — SYNTHETIC

**Every file in this directory is SYNTHETIC.** Each one is a hand-made test
input for the Stage 3 T1 detector (`scripts/sie-detector.mjs`). None of them is
an operational record, a seed record, a failure, an incident, or evidence of
anything that happened in a real run. Specification §13 (FXT-1, FXT-2) and
prep §4.8 govern them.

- **Kept separate.** These files are not in `tasks/`, `events.jsonl`, or any
  SIE record area. `scripts/status.mjs` reads only `tasks/`, so they never
  show up on the task board.
- **What a result means.** A pass here means only "detector recognition on
  synthetic input". Test mechanics are verified on fixtures. The system is
  not verified by them. No fixture or fixture result may be cited as
  exposure, reproduction, or independent-verification evidence.
- **Working basis.** The rules these fixtures exercise are the
  Specification's [REF] reconstructions. They are UNVERIFIED against WP-04
  v1.1 verbatim.
- **Tick indexes.** The `SYNTHETIC-tick-index.json` files are test inputs for
  the DET-7 distance logic only. The repository has no recorded tick index
  (Spec §5.3), and the detector CLI reads none.

| Fixture | SYNTHETIC input | Expected detector output (asserted in `scripts/sie-detector.test.mjs`) |
|---|---|---|
| F-R1 | 1 blocked task with 2 invented blockers | exactly 1 R1 detector candidate |
| F-R2 | 1 `task_failed` event, 1 `run_interrupted` event, 1 `task_started` control | exactly 2 R2 detector candidates; 0 for the control |
| F-R3 | attempts 2 and 3; control attempts 1 | exactly 2 R3 detector candidates; 0 for the control |
| F-R4 | 3 blocked tasks sharing one exact blocker key; control key on 1 task | exactly 1 R4 detector candidate listing the 3 tasks; 0 R4 for the control. All 4 tasks are blocked with blockers, so R1 also fires 4 times (asserted) |
| F-R4-INS | (a) no `blockers` field; (b) blank key; (c1) object key, (c2) non-list `blockers`; (d1)/(d2) keys differing only in case and whitespace, one task each | 0 detector candidates. (a), (b), (c1), (c2) each give "insufficient evidence: key missing or incomparable". (d) gives nothing: the keys are different exact keys and are not normalized |
| F-R5 | 1 `retry_exhausted` event | exactly 1 R5 detector candidate |
| F-R6 | in_progress at tick-index distance 3; controls at distance exactly 2 and distance 0 | exactly 1 R6 detector candidate (the distance-3 task); 0 for both controls |
| F-R6-INS | (a) last-progress tick missing; (b) last-progress tick not in the index | 0 detector candidates; each gives "insufficient evidence: tick position not determinable" |
| F-R6-INS-c | (c) empty tick index, so the current tick cannot be determined | 0 detector candidates; "insufficient evidence: tick position not determinable" |
| F-DUP | all of the above scanned and written twice | same detector-candidate ids both times; the second write creates no files |
