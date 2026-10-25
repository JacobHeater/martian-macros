/** MM-617: prints the tags of each name given on the command line, or of each line of standard input. */
import { readFileSync } from 'node:fs';
import { readFoodName } from '../../../../apps/mobile/src/engine/analysis/language/readFoodName.ts';

const names = process.argv.length > 2 ? process.argv.slice(2) : readFileSync(0, 'utf8').split('\n').filter((line) => line.trim() !== '');
for (const name of names) {
  const reading = readFoodName(name);
  console.log(`${name}\t${[...reading.tags].join(' ')}\t[${reading.tokens.map((t) => t.word).join(' ')}]`);
}
