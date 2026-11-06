// Checks on the DRAFT seed records (Stage 3 T5, AC-T5-1..AC-T5-3). Reads the
// draft files under docs/stage-3/seed/ (a draft location only; the operational
// record location is decided with F-14, OPEN). Read-only: no file is written.
//
// LIMIT: these checks prove only that the draft files carry the required
// labels and statements and lack the forbidden affirmative forms. They do not
// verify any corpus item, and a seed record is never a validated incident.
//
// Negations are handled honestly: a forbidden word inside a denial ("not
// validated", "never a confirmed runner-caused failure") is allowed, and every
// other occurrence fails. The helper tests at the end show the scan catches
// the affirmative forms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIndex, checkIndex } from './sie-schema.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = join(here, '..', 'docs', 'stage-3', 'seed');
const INDEX_FILE = 'INDEX-section-5-DRAFT.md';

// WP-04 v1.1 seed corpus list, as quoted in spec §2 point 5 (numbering is not WP-04's).
const CORPUS = [
  'overnight-03 kill and recovery',
  'stale-checkout MODULE_NOT_FOUND',
  'wiring deletion contradiction',
  'policy §7 backoff claim',
  'policy §9 repo-plus-workflow staleness',
  'step-4 versus durable-doc crash-before-task_started disagreement',
  'race precision correction (24 versus 3)',
  'claim-commit identity cosmetic note',
  'thin event log',
  'test outputs not durably stored',
];
const IDS = [...CORPUS.map((_, i) => `SEED-${String(i + 1).padStart(2, '0')}`), 'SEED-SHA'];
const WP04_RULE = '"Seed records are historical evidence, not validated incidents. They may not be used as the sole basis for a validated incident record. A seed record may be cited as evidence for a hypothesis or for a reproduction-supported conclusion, but it does not by itself establish a validated incident. Historical incidents cannot enter as validated incidents: they never count toward Milestone B. No incident is validated retroactively."';
const AC_T5_2 = 'Already-merged fixes are fixed, not validated; no retroactive validation is claimed.';
const SECTION5_LINE = 'NOT VALIDATED — fixed is not validated; no retroactive validation.';

const flat = (s) => s.replace(/\s+/g, ' ');
const read = (f) => readFileSync(join(seedDir, f), 'utf8');
const field = (text, name) => {
  const m = new RegExp(`^\\|\\s*${name}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, 'm').exec(text);
  return m ? m[1].replace(/`/g, '') : null;
};
const section = (text, heading) => {
  const m = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(text);
  return m ? m[1].trim() : null;
};

// Every match of `pattern` in `text` (whitespace-flattened) must be immediately
// preceded by a negation. Returns the unnegated occurrences with context.
const NEGATED = /\b(not|never)\s+(a\s+|an\s+)?(independently\s+|retroactively\s+)?(confirmed\s+)?$/i;
function unnegated(text, pattern) {
  const t = flat(text);
  const bad = [];
  for (const m of t.matchAll(new RegExp(pattern, 'gi'))) {
    const before = t.slice(Math.max(0, m.index - 40), m.index);
    if (!NEGATED.test(before)) bad.push(t.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20));
  }
  return bad;
}
// The record text with the verbatim WP-04 quotation removed (it is checked separately).
const ownText = (text) => text.replace(WP04_RULE, '');

const recordFiles = IDS.map((id) => `${id}.md`);

test('T5: the seed directory holds exactly the 11 drafted records and the Section 5 INDEX draft', () => {
  assert.deepEqual(readdirSync(seedDir).sort(), [...recordFiles, INDEX_FILE].sort());
});

for (const [i, id] of IDS.entries()) {
  const file = `${id}.md`;
  test(`T5 ${id}: DRAFT, seed id, corpus item, status "historical observation", provenance, shows / does not show`, () => {
    const text = read(file);
    assert.match(text, /^# .*DRAFT/m, 'title labels the record DRAFT');
    assert.match(flat(text), /decided with F-14, which is OPEN/);
    assert.match(flat(text), /draft location only; it is not the operational location/);
    assert.equal(field(text, 'seed_id'), id);
    assert.equal(field(text, 'status'), 'historical observation');
    if (id !== 'SEED-SHA') {
      assert.equal(field(text, 'corpus_item'), `"${CORPUS[i]}"`, 'corpus item quoted from WP-04 v1.1');
      assert.match(flat(text), /quoted from the WP-04 v1\.1 seed corpus list, via spec §2 point 5 \(retrieval 2026-11-06\)/);
    }
    assert.match(flat(text), /\[BASE\]: not asserted for this item/);
    assert.ok(text.includes('not in the retrieved text'), 'unknown detail is stated as "not in the retrieved text"');
    assert.ok(text.includes(WP04_RULE), 'WP-04 v1.1 seed-records rule quoted verbatim');
    const shows = section(text, 'What it shows');
    const notShows = section(text, 'What it does not show');
    assert.ok(shows && shows.length > 0, 'has a non-empty "What it shows" section');
    assert.ok(notShows && notShows.length > 0, 'has a non-empty "What it does not show" section');
  });

  test(`T5 ${id}: AC-T5-1 no validated status and no independent-validation label, except inside a negation`, () => {
    const text = read(file);
    assert.doesNotMatch(text, /\bstatus\b\s*[|:=]\s*`?\s*validated\b/i);
    assert.equal(field(text, 'validation'), 'NOT VALIDATED; not independently validated');
    const own = ownText(text);
    assert.deepEqual(unnegated(own, '\\bindependently validated\\b'), []);
    assert.deepEqual(unnegated(own, '\\bvalidated\\b'), []);
  });

  test(`T5 ${id}: AC-T5-2 canonical fixed-not-validated sentence present`, () => {
    const text = read(file);
    assert.ok(text.includes(AC_T5_2));
    assert.match(flat(text), /Whether a fix for this item exists or was merged is not in the retrieved text\./);
  });
}

test('T5 SEED-SHA: AC-T5-3 UNVERIFIED CANDIDATE, hypotheses separate, independent evidence required, never a confirmed runner-caused failure', () => {
  const text = read('SEED-SHA.md');
  const own = ownText(text);
  const t = flat(own);
  assert.match(text, /^# SEED-SHA .*UNVERIFIED CANDIDATE/m);
  assert.equal(field(text, 'label'), 'UNVERIFIED CANDIDATE (operator-class error)');
  assert.equal(field(text, 'membership in the ten corpus items'), 'eleventh (C-7 CLOSED)');
  assert.ok(t.includes('The operator-class-error hypothesis is separate from a runner-defect hypothesis.'));
  assert.ok(t.includes('Independent evidence is required before any classification.'));
  assert.ok(t.includes('This record is never a confirmed failure and never a confirmed runner-caused failure.'));
  assert.match(t, /SYNTHETIC-fixture-only and is kept separate from this record/);
  // The affirmative forms are absent: every occurrence is inside a negation.
  assert.deepEqual(unnegated(own, '\\brunner-caused failure\\b'), []);
  assert.deepEqual(unnegated(own, '\\bconfirmed failure\\b'), []);
  assert.doesNotMatch(t, /\b(is|was|are|were)\s+(an?\s+)?(confirmed\s+)?(runner-caused failure|runner defect|operator-class error)\b/i);
  for (const m of t.matchAll(/\bclassified as\b/gi)) {
    assert.match(t.slice(Math.max(0, m.index - 5), m.index), /not $/i, 'every "classified as" is negated');
  }
  assert.ok(/runner-caused failure/.test(t), 'the negation is actually present');
});

test('T5 INDEX Section 5 draft: all 11 seed ids, status historical observation, NOT VALIDATED line; consistent under the T4 INDEX check', () => {
  const text = read(INDEX_FILE);
  assert.match(text, /^# .*DRAFT/m);
  assert.match(flat(text), /not a full INDEX\.md/);
  assert.match(flat(text), /decided with F-14 \(OPEN\)/);
  const parsed = parseIndex(text);
  assert.deepEqual(parsed.stray, []);
  assert.deepEqual(Object.keys(parsed.sections), ['5']);
  assert.deepEqual(parsed.sections['5'].map((e) => e.id), IDS);
  assert.deepEqual(parsed.sections['5'].map((e) => e.file), recordFiles);
  const entryLines = text.split('\n').filter((l) => /^- `SEED-/.test(l));
  assert.equal(entryLines.length, 11);
  for (const [i, line] of entryLines.entries()) {
    assert.ok(line.includes('status: historical observation'), line);
    assert.ok(line.includes(SECTION5_LINE), line);
    if (i < CORPUS.length) assert.ok(line.includes(`corpus item: "${CORPUS[i]}"`), line);
  }
  assert.match(entryLines[10], /UNVERIFIED CANDIDATE/);
  assert.match(entryLines[10], /membership: eleventh \(C-7 CLOSED\)/);
  assert.deepEqual(unnegated(text, '\\bvalidated\\b'), []);
  const records = IDS.map((id) => ({ file: `${id}.md`, kind: 'seed', record: { seed_id: field(read(`${id}.md`), 'seed_id'), status: field(read(`${id}.md`), 'status') } }));
  const result = checkIndex({ records, index: parsed });
  assert.deepEqual(result.problems, []);
  assert.equal(result.consistent, true);
});

test('T5 scan honesty: the negation scan flags affirmative forms and allows denials', () => {
  assert.deepEqual(unnegated('The record is not validated; never independently validated.', '\\bvalidated\\b'), []);
  assert.equal(unnegated('status: validated', '\\bvalidated\\b').length, 1);
  assert.equal(unnegated('This seed is independently validated.', '\\bindependently validated\\b').length, 1);
  assert.equal(unnegated('It was a confirmed runner-caused failure.', '\\brunner-caused failure\\b').length, 1);
  assert.deepEqual(unnegated('It is never a confirmed runner-caused\n  failure.', '\\brunner-caused failure\\b'), []);
  assert.doesNotMatch('x', /\bstatus\b\s*[|:=]\s*`?\s*validated\b/i);
  assert.match('| status | validated |', /\bstatus\b\s*[|:=]\s*`?\s*validated\b/i);
});
