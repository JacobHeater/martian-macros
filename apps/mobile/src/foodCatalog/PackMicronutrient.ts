const columns = {
  potassium: 'potassium_mg',
  calcium: 'calcium_mg',
  iron: 'iron_mg',
  magnesium: 'magnesium_mg',
  zinc: 'zinc_mg',
  vitaminA: 'vitamin_a_ug',
  vitaminC: 'vitamin_c_mg',
  vitaminD: 'vitamin_d_ug',
  vitaminB12: 'vitamin_b12_ug',
  folate: 'folate_ug',
  sugars: 'sugars_g',
  saturatedFat: 'saturated_fat_g',
  cholesterol: 'cholesterol_mg',
} as const;

/**
 * The micronutrients a pack of format 2 carries besides sodium (MM-307), per
 * 100 g, each in the unit its column names (µg written "ug"). The pack
 * format is a contract of its own, so the list is kept here; a test holds
 * it equal to the domain's.
 */
export type PackMicronutrient = keyof typeof columns;

export const PackMicronutrient = {
  values: Object.keys(columns) as readonly PackMicronutrient[],
  column: (n: PackMicronutrient): string => columns[n],
} as const;
