import type { CatalogServing } from '../foodCatalog/CatalogServing';
import { PackMicronutrient } from '../foodCatalog/PackMicronutrient';
import { FormatError } from '../lang/FormatError';
import { tryParseDouble } from '../lang/tryParseDouble';
import { tryParseInt } from '../lang/tryParseInt';
import { CandidateFood } from './CandidateFood';

function servingsIn(json: string): CatalogServing[] {
  const decoded: unknown = JSON.parse(json);
  if (!Array.isArray(decoded)) return [];
  const servings: CatalogServing[] = [];
  for (const item of decoded as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const { d, g } = item as { d?: unknown; g?: unknown };
    if (typeof d === 'string' && typeof g === 'number' && g > 0) servings.push({ description: d, grams: g });
  }
  return servings;
}

/**
 * One candidate from a CSV `row` under `header`. An empty cell is a missing
 * value.
 */
export function candidateFromRow(header: readonly string[], row: readonly string[]): CandidateFood {
  const text = (column: string): string | undefined => {
    const i = header.indexOf(column);
    if (i < 0 || i >= row.length) return undefined;
    const v = (row[i] as string).trim();
    return v === '' ? undefined : v;
  };
  const required = (column: string): string => {
    const v = text(column);
    if (v === undefined) throw new FormatError(`A candidate row has no "${column}".`);
    return v;
  };
  const number = (column: string) => tryParseDouble(text(column) ?? '');
  const name = row[header.indexOf('name')];
  if (name === undefined) throw new FormatError('A candidate row has no "name".');

  const servingsJson = text('servings');
  return new CandidateFood({
    source: required('source'),
    sourceId: required('source_id'),
    kind: text('kind') === 'generic' ? 'generic' : 'barcode',
    name,
    brand: text('brand'),
    rawBarcode: text('gtin'),
    kcal: number('kcal'),
    proteinG: number('protein'),
    carbsG: number('carbs'),
    fatG: number('fat'),
    fiberG: number('fiber'),
    sodiumMg: number('sodium_mg'),
    alcoholG: number('alcohol'),
    micros: Object.fromEntries(
      PackMicronutrient.values
        .map((n) => [n, number(PackMicronutrient.column(n))] as const)
        .filter(([, value]) => value !== undefined),
    ),
    servings: servingsJson === undefined ? [] : servingsIn(servingsJson),
    versionKey: tryParseInt(text('version_key') ?? '') ?? 0,
    updatedAt: tryParseInt(text('updated_at') ?? '') ?? 0,
  });
}
