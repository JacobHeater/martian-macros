/** One downloadable source for the food packs (MM-52). */
export interface FoodSource {
  /** The folder (or file) name inside the cache; `extract.sql` reads these. */
  readonly id: string;

  /** What goes in the pack header, with the version. */
  readonly description: string;
  readonly url: string;
  readonly fileName: string;
  readonly isZip: boolean;
}

/**
 * The sources and the versions the pipeline was written against. The USDA
 * dates are the ones measured in the MM-51 spike; they are not checked to be
 * the newest.
 */
export const foodSources: readonly FoodSource[] = [
  {
    id: 'usda_branded',
    description: 'USDA FoodData Central, Branded Foods, 2025-04-24',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2025-04-24.zip',
    fileName: 'usda_branded.zip',
    isZip: true,
  },
  {
    id: 'usda_foundation',
    description: 'USDA FoodData Central, Foundation Foods, 2025-04-24',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2025-04-24.zip',
    fileName: 'usda_foundation.zip',
    isZip: true,
  },
  {
    id: 'usda_sr_legacy',
    description: 'USDA FoodData Central, SR Legacy, 2018-04',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip',
    fileName: 'usda_sr_legacy.zip',
    isZip: true,
  },
  {
    id: 'off',
    description: 'Open Food Facts, CSV export',
    url: 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz',
    fileName: 'off.csv.gz',
    isZip: false,
  },
];
