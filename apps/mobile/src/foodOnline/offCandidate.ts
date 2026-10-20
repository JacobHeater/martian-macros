import type { CatalogServing } from '../foodCatalog/CatalogServing';
import type { PackMicros } from '../foodCatalog/PackMicros';
import { CandidateFood } from '../foodPipeline/CandidateFood';
import { usLabelCarbs } from '../foodPipeline/usLabelCarbs';
import { jsonNumber } from './jsonNumber';

const kcalPerKj = 1 / 4.184;

/**
 * An Open Food Facts product, as its API gives it, mapped onto the
 * pipeline's candidate (MM-58): the same fields and unit conversions as the
 * pack build's extract (grams of sodium and minerals to milligrams,
 * vitamins to micrograms; vitamin A and folate not taken, as MM-307 ruled),
 * so a product found online matches the same product in a pack.
 */
export function offCandidate(product: unknown): CandidateFood | undefined {
  if (typeof product !== 'object' || product === null) return undefined;
  const p = product as Record<string, unknown>;
  const code = typeof p['code'] === 'string' ? p['code'] : undefined;
  const name = typeof p['product_name'] === 'string' ? p['product_name'].trim() : '';
  if (code === undefined || name === '') return undefined;
  const nutriments = typeof p['nutriments'] === 'object' && p['nutriments'] !== null ? (p['nutriments'] as Record<string, unknown>) : {};
  const per100 = (key: string) => jsonNumber(nutriments[`${key}_100g`]);
  const kj = per100('energy-kj') ?? per100('energy');
  const kcal = per100('energy-kcal') ?? (kj === undefined ? undefined : kj * kcalPerKj);
  const proteinG = per100('proteins');
  const fatG = per100('fat');
  const fiberG = per100('fiber');
  const countries = Array.isArray(p['countries_tags']) ? (p['countries_tags'] as unknown[]) : [];
  const usOnly = countries.every((c) => c === 'en:united-states' || c === 'en:canada');
  const carbsG = usLabelCarbs({ label: usOnly && countries.length > 0 ? 'us' : 'unknown', kcal, proteinG, carbsG: per100('carbohydrates'), fatG, fiberG });
  const mg = (key: string) => scale(per100(key), 1000);
  const ug = (key: string) => scale(per100(key), 1_000_000);
  const micros: PackMicros = stated({
    potassium: mg('potassium'),
    calcium: mg('calcium'),
    iron: mg('iron'),
    magnesium: mg('magnesium'),
    zinc: mg('zinc'),
    vitaminC: mg('vitamin-c'),
    vitaminD: ug('vitamin-d'),
    vitaminB12: ug('vitamin-b12'),
    sugars: per100('sugars'),
    saturatedFat: per100('saturated-fat'),
    cholesterol: mg('cholesterol'),
  });
  const servingGrams = jsonNumber(p['serving_quantity']);
  // "1/3 package (52 g)": the grams are shown beside the description already, so a stated weight at its end goes.
  const servingText = (typeof p['serving_size'] === 'string' ? p['serving_size'] : '').replace(/\s*\(\s*[\d.,]+\s*(g|ml)\s*\)\s*$/i, '').trim();
  const servings: CatalogServing[] =
    servingGrams !== undefined && servingGrams > 0 ? [{ description: servingText === '' ? `${servingGrams} g` : servingText, grams: servingGrams }] : [];
  const brands = typeof p['brands'] === 'string' ? p['brands'].split(',')[0]?.trim() : undefined;
  return new CandidateFood({
    source: 'off',
    sourceId: code,
    kind: 'barcode',
    name,
    brand: brands === '' ? undefined : brands,
    rawBarcode: code,
    kcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarAlcoholsG: per100('polyols'),
    sodiumMg: mg('sodium') ?? scale(per100('salt'), 400),
    alcoholG: per100('alcohol'),
    micros,
    servings,
    updatedAt: jsonNumber(p['last_modified_t']) ?? 0,
  });
}

const scale = (value: number | undefined, by: number) => (value === undefined ? undefined : value * by);

function stated(values: Record<string, number | undefined>): PackMicros {
  const kept: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) if (value !== undefined) kept[key] = value;
  return kept as PackMicros;
}
