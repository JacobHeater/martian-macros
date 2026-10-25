/**
 * MM-617: measures the coach's food-language tagger against real catalog names.
 *
 *   node --import ./resolve.mjs analyse.ts [--seed holdout9] [--sample 200]
 *
 * Reads a deterministic sample of names from the local food cache (`.food_cache/`, gitignored): every USDA Foundation,
 * SR Legacy and FNDDS name, 50,000 USDA Branded names and 20,000 Open Food Facts names. Writes, under results/:
 * - summary.json: the share of names with at least one tag, per source and overall, and the lexicon's size;
 * - untagged-tokens.tsv: the 300 most frequent tokens in names with no tag;
 * - unmatched-tokens.tsv: the 300 most frequent tokens no lexicon phrase covers, in any name;
 * - handcheck-<seed>.tsv: a sample of distinct tagged names with their tags, for review. A reviewer copies each line
 *   into verdicts-<seed>.tsv as name, tags, then "ok" or the wrong tags ("-fried"; a missing tag "+baked" does not
 *   count against precision); the precision is computed from it, and names whose tags changed since are counted.
 * Data analysis for the spike, not a test: the unit tests are in apps/mobile/test/engine/.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { foodLexicon } from '../../../../apps/mobile/src/engine/analysis/language/foodLexicon.ts';
import { readFoodName } from '../../../../apps/mobile/src/engine/analysis/language/readFoodName.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const cache = join(root, '.food_cache');
const sampleFile = join(cache, 'lexicon', 'names.tsv');
const results = join(here, 'results');

function option(name: string, fallback: string): string {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] !== undefined ? process.argv[at + 1]! : fallback;
}

function exportSample(): void {
  mkdirSync(dirname(sampleFile), { recursive: true });
  const duckdb = join(homedir(), '.local/bin/duckdb');
  const sql = `
    COPY (
      SELECT source, replace(name, chr(9), ' ') AS name FROM read_csv('${cache}/extract/candidates_generic.csv', header = true, all_varchar = true)
        WHERE name IS NOT NULL
      UNION ALL
      SELECT * FROM (SELECT DISTINCT source, replace(name, chr(9), ' ') AS name FROM read_csv('${cache}/extract/candidates_barcode.csv', header = true, all_varchar = true)
        WHERE source = 'usda_branded' AND name IS NOT NULL AND trim(name) <> '' ORDER BY hash(name || 'mm617') LIMIT 50000)
      UNION ALL
      SELECT * FROM (SELECT DISTINCT source, replace(name, chr(9), ' ') AS name FROM read_csv('${cache}/extract/candidates_barcode.csv', header = true, all_varchar = true)
        WHERE source = 'off' AND name IS NOT NULL AND trim(name) <> '' ORDER BY hash(name || 'mm617') LIMIT 20000)
    ) TO '${sampleFile}' (DELIMITER '\t', HEADER true, QUOTE '');`;
  execFileSync(duckdb, ['-c', sql], { stdio: 'inherit' });
}

if (!existsSync(sampleFile)) exportSample();
mkdirSync(results, { recursive: true });

const rows = readFileSync(sampleFile, 'utf8')
  .split('\n')
  .slice(1)
  .filter((line) => line.trim() !== '')
  .map((line) => {
    const tab = line.indexOf('\t');
    return { source: line.slice(0, tab), name: line.slice(tab + 1) };
  });

const bySource = new Map<string, { names: number; tagged: number }>();
const untagged = new Map<string, number>();
const unmatched = new Map<string, number>();
const tagCounts = new Map<string, number>();
const read = rows.map((row) => {
  const reading = readFoodName(row.name);
  const counts = bySource.get(row.source) ?? { names: 0, tagged: 0 };
  counts.names += 1;
  if (reading.tags.size > 0) counts.tagged += 1;
  bySource.set(row.source, counts);
  for (const tag of reading.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const covered = new Set<number>();
  for (const match of reading.matches) for (let i = match.start; i < match.start + match.length; i += 1) covered.add(i);
  const seenUntagged = new Set<string>();
  const seenUnmatched = new Set<string>();
  reading.tokens.forEach((token, index) => {
    if (token.word.length < 2 || token.stop) return;
    if (reading.tags.size === 0 && !seenUntagged.has(token.word)) {
      seenUntagged.add(token.word);
      untagged.set(token.word, (untagged.get(token.word) ?? 0) + 1);
    }
    if (!covered.has(index) && !seenUnmatched.has(token.word)) {
      seenUnmatched.add(token.word);
      unmatched.set(token.word, (unmatched.get(token.word) ?? 0) + 1);
    }
  });
  return { ...row, tags: [...reading.tags] };
});

const top = (counts: Map<string, number>, n: number) => [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
writeFileSync(join(results, 'untagged-tokens.tsv'), top(untagged, 300).map(([w, c]) => `${w}\t${c}`).join('\n') + '\n');
writeFileSync(join(results, 'unmatched-tokens.tsv'), top(unmatched, 300).map(([w, c]) => `${w}\t${c}`).join('\n') + '\n');

const phrases = foodLexicon.phrases.reduce((sum, family) => sum + Object.keys(family).length, 0);
const total = { names: 0, tagged: 0 };
const sources: Record<string, { names: number; tagged: number; coverage: string }> = {};
for (const [source, counts] of [...bySource].sort()) {
  total.names += counts.names;
  total.tagged += counts.tagged;
  sources[source] = { ...counts, coverage: `${((100 * counts.tagged) / counts.names).toFixed(1)}%` };
}

// The hand-check sample: distinct tagged names in an order fixed by the seed.
const seed = option('seed', 'holdout9');
const size = Number(option('sample', '200'));
const order = (name: string) => createHash('sha256').update(`${seed}:${name}`).digest('hex');
const distinct = new Map(read.filter((row) => row.tags.length > 0).map((row) => [row.name, row]));
const sample = [...distinct.values()].sort((a, b) => order(a.name).localeCompare(order(b.name))).slice(0, size);
writeFileSync(
  join(results, `handcheck-${seed}.tsv`),
  'source\tname\ttags\n' + sample.map((row) => `${row.source}\t${row.name}\t${row.tags.join(' ')}`).join('\n') + '\n',
);

// Precision from the reviewer's verdicts (verdicts-<seed>.tsv: name, the tags as reviewed, then "ok" or the wrong
// tags as "-tag"): per name (every tag right) and per tag. A name whose tags have changed since the review is counted
// apart, so a changed lexicon cannot borrow an old verdict.
const verdictFile = join(here, `verdicts-${seed}.tsv`);
let precision: Record<string, unknown> | undefined;
if (existsSync(verdictFile)) {
  const verdicts = readFileSync(verdictFile, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    .map((line) => line.split('\t'));
  const now = new Map(sample.map((row) => [row.name, row.tags.join(' ')]));
  let names = 0;
  let rightNames = 0;
  let tags = 0;
  let wrongTags = 0;
  let changed = 0;
  for (const [name = '', reviewedTags = '', verdict = ''] of verdicts) {
    names += 1;
    tags += reviewedTags.split(' ').filter((tag) => tag !== '').length;
    const wrong = verdict === 'ok' ? 0 : verdict.split(' ').filter((mark) => mark.startsWith('-')).length;
    wrongTags += wrong;
    if (wrong === 0) rightNames += 1;
    if (now.get(name) !== reviewedTags) changed += 1;
  }
  precision = {
    reviewedNames: names,
    namesAllTagsRight: `${((100 * rightNames) / Math.max(names, 1)).toFixed(1)}%`,
    reviewedTags: tags,
    tagPrecision: `${((100 * (tags - wrongTags)) / Math.max(tags, 1)).toFixed(1)}%`,
    changedSinceReview: changed,
  };
}

const summary = {
  sampledNames: total.names,
  taggedNames: total.tagged,
  coverage: `${((100 * total.tagged) / total.names).toFixed(1)}%`,
  sources,
  lexicon: {
    phrases,
    multiWordPhrases: foodLexicon.phrases.reduce((sum, family) => sum + Object.keys(family).filter((k) => k.includes(' ')).length, 0),
    stopWords: foodLexicon.stopWords.length,
    rules: foodLexicon.rules.length,
  },
  tags: Object.fromEntries(top(tagCounts, 100)),
  handcheck: { seed, size: sample.length, precision },
};
writeFileSync(join(results, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
