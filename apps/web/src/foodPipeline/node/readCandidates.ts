import { createReadStream } from 'node:fs';
import { candidateFromRow } from '../candidateFromRow';
import type { CandidateFood } from '../CandidateFood';
import { csvRowsFromBytes } from '../csvRowsFromBytes';

/**
 * Reads the candidates file the extract step writes (see `sql/`): one row
 * per source food, in a header-led CSV.
 */
export async function* readCandidates(path: string): AsyncGenerator<CandidateFood> {
  let header: string[] | undefined;
  for await (const row of csvRowsFromBytes(createReadStream(path) as AsyncIterable<Uint8Array>)) {
    if (header === undefined) {
      header = row;
      continue;
    }
    yield candidateFromRow(header, row);
  }
}
