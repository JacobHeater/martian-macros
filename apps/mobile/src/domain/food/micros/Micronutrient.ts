import type { MicronutrientGroup } from './MicronutrientGroup';

interface Facts {
  /** As shown: "Vitamin B12". */
  readonly label: string;
  readonly unit: 'mg' | 'µg' | 'g';
  readonly group: MicronutrientGroup;
  /** The column in the food log, the custom foods and the food pack. */
  readonly column: string;
  /**
   * The most a plausible 100 g holds; a pack value above it is dropped
   * (MM-307). Each is a little above the richest food of its kind, so a
   * unit slipped by a thousand is caught: salt (sodium), salt substitute
   * (potassium), nonfat dry milk and fortified foods (calcium), fortified
   * cereal (iron), rice bran (magnesium), oysters (zinc), cod liver oil
   * (vitamins A and D), acerola (vitamin C), clams (B12), fortified cereal
   * (folate), dried egg yolk (cholesterol).
   */
  readonly maxPer100g: number;
}

const facts = {
  sodium: { label: 'Sodium', unit: 'mg', group: 'minerals', column: 'sodium_mg', maxPer100g: 40_000 },
  potassium: { label: 'Potassium', unit: 'mg', group: 'minerals', column: 'potassium_mg', maxPer100g: 55_000 },
  calcium: { label: 'Calcium', unit: 'mg', group: 'minerals', column: 'calcium_mg', maxPer100g: 5_000 },
  iron: { label: 'Iron', unit: 'mg', group: 'minerals', column: 'iron_mg', maxPer100g: 100 },
  magnesium: { label: 'Magnesium', unit: 'mg', group: 'minerals', column: 'magnesium_mg', maxPer100g: 1_000 },
  zinc: { label: 'Zinc', unit: 'mg', group: 'minerals', column: 'zinc_mg', maxPer100g: 100 },
  vitaminA: { label: 'Vitamin A', unit: 'µg', group: 'vitamins', column: 'vitamin_a_ug', maxPer100g: 30_000 },
  vitaminC: { label: 'Vitamin C', unit: 'mg', group: 'vitamins', column: 'vitamin_c_mg', maxPer100g: 2_000 },
  vitaminD: { label: 'Vitamin D', unit: 'µg', group: 'vitamins', column: 'vitamin_d_ug', maxPer100g: 300 },
  vitaminB12: { label: 'Vitamin B12', unit: 'µg', group: 'vitamins', column: 'vitamin_b12_ug', maxPer100g: 200 },
  folate: { label: 'Folate', unit: 'µg', group: 'vitamins', column: 'folate_ug', maxPer100g: 2_000 },
  sugars: { label: 'Total sugars', unit: 'g', group: 'alsoOnLabel', column: 'sugars_g', maxPer100g: 100 },
  saturatedFat: { label: 'Saturated fat', unit: 'g', group: 'alsoOnLabel', column: 'saturated_fat_g', maxPer100g: 100 },
  cholesterol: { label: 'Cholesterol', unit: 'mg', group: 'alsoOnLabel', column: 'cholesterol_mg', maxPer100g: 4_000 },
} as const satisfies Record<string, Facts>;

/**
 * The micronutrients the app tracks (MM-305), in the order the Micros view
 * lists them. Vitamin A is micrograms of retinol activity equivalents and
 * folate micrograms of dietary folate equivalents, as the US label states
 * them.
 */
export type Micronutrient = keyof typeof facts;

const values = Object.keys(facts) as readonly Micronutrient[];

export const Micronutrient = {
  values,

  /**
   * Every one but sodium: the ones MM-307 added. Sodium has had its own
   * field and column since MM-49.
   */
  added: values.filter((n) => n !== 'sodium'),

  label: (n: Micronutrient): string => facts[n].label,
  unit: (n: Micronutrient): 'mg' | 'µg' | 'g' => facts[n].unit,
  group: (n: Micronutrient): MicronutrientGroup => facts[n].group,
  column: (n: Micronutrient): string => facts[n].column,
  maxPer100g: (n: Micronutrient): number => facts[n].maxPer100g,
} as const;
