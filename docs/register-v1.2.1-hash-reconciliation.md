# Register v1.2.1 — hash and line-count reconciliation

Status: Record of investigation (docs only). Recorded 2026-11-10 by Claude
(builder). No change was made to the register, its adoption amendment, or any
other file.

This is a documentation-integrity question, not a tampering finding.

## Discrepancy as reported

| Version | Lines | SHA-256 | Source |
|---|---|---|---|
| Current register file (Founder workspace, mtime 2026-11-06 08:30 UTC) | 1,414 | `f4f7d2abb27a176789e4a8235d6d4a61032477f8dcd6ee3aa0b2ede7391a8725` | `Genesis_Architecture_Reconciliation_and_Founder_Decision_Register_v1.2.1.md` |
| Version cited in the adoption amendment ("Register adopted as canonical 2026-11-05"), status Proposed | 1,277 | `1b75cc979844a33cdf9cd413db639a8523c1eac8734d54bb4bed80fc0670f5a5` | Lines 35 and 39 of the current file |

1,414 − 1,277 = 137. The last 137 lines of the current file are §10 decision
records (part of D3 through D8, plus the closing items), so it looked as if
§10 content had been added after adoption.

## Method

All work used a byte-identical copy of the register at
`.tmp/register-v1.2.1.md` (scratch, not committed). The canonical file was not
touched. Reconstructions were written to `.tmp/` only.

1. Verify the copy:

   ```
   wc -l .tmp/register-v1.2.1.md      # 1414
   sha256sum .tmp/register-v1.2.1.md  # f4f7d2abb27a176789e4a8235d6d4a61032477f8dcd6ee3aa0b2ede7391a8725
   ```

2. Find the blocks added after adoption. Lines 33–169 of the current file are
   seven `## Amendment — …` blocks, each ending with a blank line, between the
   2026-10-30 amendment and `## Changes from v1.2` (line 170):

   | Lines | Count | Block |
   |---|---|---|
   | 33–47 | 15 | Register adopted as canonical 2026-11-05 (B1) |
   | 48–71 | 24 | Stage V authorized (B2) 2026-11-05 |
   | 72–92 | 21 | Dashboard reads authorized + provisional project/environment selection (E-V5-2 + F-08) 2026-11-05 |
   | 93–110 | 18 | Stage DB authorized 2026-11-05 |
   | 111–129 | 19 | Stage 1 execution authorized 2026-11-05 |
   | 130–149 | 20 | PR #34 merge approved 2026-11-05 |
   | 150–169 | 20 | Stage 2 execution authorized 2026-11-06 |
   | **Total** | **137** | |

   Line 3 now reads `**Status:** Canonical — adopted 2026-11-05 by Founder
   decision (B1)`.

3. Reconstruct the pre-adoption version: delete lines 33–169 and restore the
   line 3 status.

   ```
   sed -e '33,169d' \
       -e '3s/.*/**Status:** Proposed — pending Founder approval/' \
       .tmp/register-v1.2.1.md > .tmp/register-v1.2.1-reconstructed-pre-adoption.md
   wc -l .tmp/register-v1.2.1-reconstructed-pre-adoption.md      # 1277
   sha256sum .tmp/register-v1.2.1-reconstructed-pre-adoption.md  # 1b75cc979844a33cdf9cd413db639a8523c1eac8734d54bb4bed80fc0670f5a5
   grep -nE '^## 10\.|^#### D[1-8] ' .tmp/register-v1.2.1-reconstructed-pre-adoption.md
   ```

   Result: **1,277 lines, SHA-256 `1b75cc97…0670f5a5`. This is an exact match
   to the hash the adoption amendment cites.** The reconstruction contains §10 at
   line 1072 and all eight records, D1 to D8 (D1 at 1103, D8 at 1201).

4. Cross-check against a second, independent citation. `docs/stage-2/README.md`
   (on `main`) records an intermediate version: "the version containing the
   'Amendment — Stage 2 execution authorized 2026-11-06': SHA-256
   `08609ae5…ec56dfb`, 1,413 lines". Line 168 of the current file is the
   later bullet `- **Update ~01:30 MST Nov 6 — MERGED.** …` (PR #35 merge).

   ```
   sed '168d' .tmp/register-v1.2.1.md > .tmp/register-v1.2.1-reconstructed-stage2.md
   wc -l .tmp/register-v1.2.1-reconstructed-stage2.md      # 1413
   sha256sum .tmp/register-v1.2.1-reconstructed-stage2.md  # 08609ae547c4798fd756b73d918d23f9b201be64d9d50986b4c490ecbec56dfb
   ```

   Result: an exact match. Three independently recorded versions (1,277 →
   1,413 → 1,414) are connected by exact hashes, and each change is an
   append-only addition in the amendment area at the top of the file.

5. After this work, the copy still matches the original:

   ```
   wc -l .tmp/register-v1.2.1.md      # 1414
   sha256sum .tmp/register-v1.2.1.md  # f4f7d2abb27a176789e4a8235d6d4a61032477f8dcd6ee3aa0b2ede7391a8725
   ```

## Other citations in this repo (`git grep` on `origin/main` at `aa1def0`)

- No file on `main` cites `1b75cc97…` or "1,277 lines". The only citation is
  inside the register.
- `docs/stage-2/README.md` cites 1,413 lines / `08609ae5…`. Step 4 reproduces it.
- `docs/stage-3/README.md` and `docs/stage-3/00-sie-specification.md` cite
  "1,414 lines as read" with no hash. That matches the current file.
- `docs/stage-1/README.md` identifies the version by content ("contains the
  Stage 1 amendment"), not by hash.
- The repo has no copy of the register. Every reference says it lives outside
  the repo (Founder workspace files).

## Conclusion — outcome (a)

**The adoption record is correct. The file is canonical, and its additions
after adoption are legitimate. No correction to the file or to the adoption
record is warranted.**

Reasoning:

- The 137-line difference is entirely accounted for by the seven amendment
  blocks at the top of the file (lines 33–169) and the one-line status change
  on line 3. Undoing exactly those changes reproduces the cited 1,277-line
  version byte for byte (step 3).
- §10 and the D1–D8 records were already in the adopted version. They now sit
  at lines 1209–1414 only because 137 lines were inserted above them. The
  adoption wording also says "Decisions D1–D8 stand as recorded", which
  matches.
- The intermediate 1,413-line hash recorded in the Stage 2 README also
  reproduces exactly (step 4). That confirms an append-only amendment history.

### The adoption citation is accurate as written

The adoption amendment's SHA-256 `1b75cc97…0670f5a5` (1,277 lines, status
Proposed) identifies the **pre-adoption** version: the text the Founder read
and adopted. The amendment says so itself ("Pre-adoption version identified
by…"). The citation is accurate.

**Changing that citation to the current hash (`f4f7d2ab…`, 1,414 lines) would be
wrong.** It would falsely claim that the Founder adopted the 1,414-line version.
That version includes amendments written after adoption, including the
adoption amendment itself and the B2, E-V5-2/F-08, Stage DB, Stage 1, PR #34
and Stage 2 records. The Founder did not adopt that text on 2026-11-05.

## Recommended follow-up (needs Founder approval; not done)

These are recommendations only. None has been applied.

1. Optional clarifying sentence in the adoption amendment, after the
   "Pre-adoption version identified by…" sentence, for example: "This hash
   identifies the file as adopted. Later amendments in this file change its
   hash and line count. To verify the adopted text, remove the amendment blocks
   dated on or after 2026-11-05 and restore the Proposed status line." Adding
   it would change the register's hash again. The Founder should decide whether
   that is worth it.
2. Optional: when future amendments cite the register by hash, label the hash
   with the version it identifies (for example, "as of the Stage N amendment"),
   as `docs/stage-2/README.md` already does.
