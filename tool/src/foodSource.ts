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
 * The sources and the versions the pipeline was written against (MM-52,
 * MM-383). Foundation and Branded are the releases the FoodData Central
 * download page listed on 2026-10-18; SR Legacy's 2018-04 is its final
 * release; FNDDS 2021-2023 is the survey foods' CSV of 2024-10-31 (the
 * panel's IN-1, IN-9: the file names inside the zip are confirmed by the
 * first `mm food build`). Open Food Facts is its nightly export.
 */
export const foodSources: readonly FoodSource[] = [
  {
    id: 'usda_branded',
    description: 'USDA FoodData Central, Branded Foods, 2026-04-30',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2026-04-30.zip',
    fileName: 'usda_branded.zip',
    isZip: true,
  },
  {
    id: 'usda_foundation',
    description: 'USDA FoodData Central, Foundation Foods, 2026-04-30',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip',
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
    id: 'usda_fndds',
    description: 'USDA FoodData Central, FNDDS 2021-2023 (survey foods), 2024-10-31',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip',
    fileName: 'usda_fndds.zip',
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
