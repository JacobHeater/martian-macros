/**
 * MM-617: for review, the names in the sample where each of the most frequent lexicon phrases gives a tag, a few at
 * random per phrase, with the tags the name gets. Wrong contexts point to a phrase that needs a longer phrase or a rule.
 *
 *   node --import ./resolve.mjs concordance.ts [--top 80] [--per 8] [--seed c1]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FoodTag } from '../../../../apps/mobile/src/engine/analysis/language/FoodTag.ts';
import { readFoodName } from '../../../../apps/mobile/src/engine/analysis/language/readFoodName.ts';

const here = dirname(fileURLToPath(import.meta.url));
const option = (name: string, fallback: string) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] !== undefined ? process.argv[at + 1]! : fallback;
};
const tags = new Set<string>(FoodTag.values);
const names = [
  ...new Set(
    readFileSync(join(resolve(here, '../../../..'), '.food_cache/lexicon/names.tsv'), 'utf8')
      .split('\n')
      .slice(1)
      .map((line) => line.slice(line.indexOf('\t') + 1))
      .filter((name) => name.trim() !== ''),
  ),
];
const seed = option('seed', 'c1');
const byPhrase = new Map<string, string[]>();
for (const name of names) {
  const reading = readFoodName(name);
  if (reading.tags.size === 0) continue;
  for (const match of reading.matches) {
    if (match.flavor || match.negated || !match.senses.some((sense) => tags.has(sense))) continue;
    const list = byPhrase.get(match.phrase) ?? [];
    list.push(name);
    byPhrase.set(match.phrase, list);
  }
}
const order = (name: string) => createHash('sha256').update(`${seed}:${name}`).digest('hex');
const top = [...byPhrase].sort((a, b) => b[1].length - a[1].length).slice(0, Number(option('top', '80')));
for (const [phrase, list] of top) {
  console.log(`== ${phrase} (${list.length})`);
  for (const name of [...list].sort((a, b) => order(a).localeCompare(order(b))).slice(0, Number(option('per', '8')))) {
    console.log(`   ${[...readFoodName(name).tags].join(' ')}  <=  ${name}`);
  }
}
