import { readFileSync } from 'node:fs';
import { FormatError } from '../../lang/FormatError';
import type { BuildProvenance } from '../BuildProvenance';

/** The provenance file the fetch step wrote at `path`. */
export function readBuildProvenance(path: string): BuildProvenance {
  const json: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const { builtOn, sources } = (typeof json === 'object' && json !== null ? json : {}) as {
    builtOn?: unknown;
    sources?: unknown;
  };
  if (typeof builtOn !== 'string' || !Array.isArray(sources) || !sources.every((s) => typeof s === 'string')) {
    throw new FormatError(`${path} does not say when the sources were fetched and what they are.`);
  }
  return { builtOn, sources };
}
