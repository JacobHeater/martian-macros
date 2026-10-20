import type { CatalogServing } from '../foodCatalog/CatalogServing';
import type { PackMicros } from '../foodCatalog/PackMicros';
import { CandidateFood } from '../foodPipeline/CandidateFood';
import { jsonNumber } from './jsonNumber';

/** FoodData Central's nutrient ids, as the pack build's extract reads them. */
const ids = {
  kcal: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sodium: 1093,
  alcohol: 1018,
  potassium: 1092,
  calcium: 1087,
  iron: 1089,
  magnesium: 1090,
  zinc: 1095,
  vitaminA: 1106,
  vitaminC: 1162,
  vitaminD: 1114,
  vitaminDIu: 1110,
  vitaminB12: 1178,
  folate: 1190,
  sugars: 2000,
  sugarsNlea: 1063,
  saturatedFat: 1258,
  sugarAlcohols: 1086,
  cholesterol: 1253,
} as const;

const sourcesByDataType: Readonly<Record<string, string>> = {
  Branded: 'usda_branded',
  Foundation: 'usda_foundation',
  'SR Legacy': 'usda_sr_legacy',
  'Survey (FNDDS)': 'usda_fndds',
};

/**
 * A food as FoodData Central's search answers it, mapped onto the pipeline's
 * candidate (MM-58): the same nutrient ids, units and source names as the
 * pack build, so a food found online matches the same food in a pack. The
 * figures FoodData Central gives are per 100 g.
 */
export function fdcCandidate(food: unknown): CandidateFood | undefined {
  if (typeof food !== 'object' || food === null) return undefined;
  const f = food as Record<string, unknown>;
  const fdcId = jsonNumber(f['fdcId']);
  const name = typeof f['description'] === 'string' ? f['description'].trim() : '';
  const source = typeof f['dataType'] === 'string' ? sourcesByDataType[f['dataType']] : undefined;
  if (fdcId === undefined || name === '' || source === undefined) return undefined;
  const values = new Map<number, number>();
  for (const nutrient of Array.isArray(f['foodNutrients']) ? (f['foodNutrients'] as unknown[]) : []) {
    if (typeof nutrient !== 'object' || nutrient === null) continue;
    const n = nutrient as Record<string, unknown>;
    const id = jsonNumber(n['nutrientId']) ?? jsonNumber(n['nutrientNumber']);
    const value = jsonNumber(n['value']) ?? jsonNumber(n['amount']);
    if (id !== undefined && value !== undefined && !values.has(id)) values.set(id, value);
  }
  const at = (id: number) => values.get(id);
  const vitaminD = at(ids.vitaminD) ?? (at(ids.vitaminDIu) === undefined ? undefined : (at(ids.vitaminDIu) as number) / 40);
  const micros: PackMicros = stated({
    potassium: at(ids.potassium),
    calcium: at(ids.calcium),
    iron: at(ids.iron),
    magnesium: at(ids.magnesium),
    zinc: at(ids.zinc),
    vitaminA: at(ids.vitaminA),
    vitaminC: at(ids.vitaminC),
    vitaminD,
    vitaminB12: at(ids.vitaminB12),
    folate: at(ids.folate),
    sugars: at(ids.sugars) ?? at(ids.sugarsNlea),
    saturatedFat: at(ids.saturatedFat),
    cholesterol: at(ids.cholesterol),
  });
  const servingGrams = jsonNumber(f['servingSize']);
  const unit = typeof f['servingSizeUnit'] === 'string' ? f['servingSizeUnit'].toLowerCase() : '';
  const household = typeof f['householdServingFullText'] === 'string' ? f['householdServingFullText'].trim() : '';
  const servings: CatalogServing[] =
    servingGrams !== undefined && servingGrams > 0 && (unit === 'g' || unit === 'grm')
      ? [{ description: household === '' ? `${servingGrams} g` : household, grams: servingGrams }]
      : [];
  const brand = [f['brandName'], f['brandOwner']].find((b) => typeof b === 'string' && b.trim() !== '') as string | undefined;
  const gtin = typeof f['gtinUpc'] === 'string' && f['gtinUpc'].trim() !== '' ? f['gtinUpc'].trim() : undefined;
  return new CandidateFood({
    source,
    sourceId: String(fdcId),
    kind: source === 'usda_branded' ? 'barcode' : 'generic',
    name,
    brand: brand?.trim(),
    rawBarcode: gtin,
    kcal: at(ids.kcal),
    proteinG: at(ids.protein),
    carbsG: at(ids.carbs),
    fatG: at(ids.fat),
    fiberG: at(ids.fiber),
    sugarAlcoholsG: at(ids.sugarAlcohols),
    sodiumMg: at(ids.sodium),
    alcoholG: at(ids.alcohol),
    micros,
    servings,
    versionKey: fdcId,
  });
}

function stated(values: Record<string, number | undefined>): PackMicros {
  const kept: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) if (value !== undefined) kept[key] = value;
  return kept as PackMicros;
}
