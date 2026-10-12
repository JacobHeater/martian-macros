import { join } from 'node:path';
import type { CandidateFood } from '../CandidateFood';
import { readCandidates } from './readCandidates';

/**
 * Every candidate the extract step wrote into the folder `dir`: the barcode
 * products, then the generic foods.
 */
export async function* readExtract(dir: string): AsyncGenerator<CandidateFood> {
  for (const name of ['candidates_barcode.csv', 'candidates_generic.csv']) {
    yield* readCandidates(join(dir, name));
  }
}
