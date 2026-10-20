import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { InMemoryOnlineFoodSource } from '../../src/foodOnline/InMemoryOnlineFoodSource';

/** The GTIN-14 of the digits a test types, 4006381333931. */
export const onlineGtin = '04006381333931';

/** A product only a web service knows (MM-58): what a test's Open Food Facts answers with. */
export const onlineNoodles: PackEntry = {
  food: new CatalogFood({
    id: 0,
    packId: 'online',
    name: 'Thai peanut noodle kit',
    brand: 'Thai Kitchen',
    kcal: 385,
    proteinG: 9.6,
    carbsG: 71.2,
    fatG: 7.7,
    fiberG: 1.9,
    sodiumMg: 288,
    micros: { sugars: 13.5, saturatedFat: 1.9 },
    source: 'off',
    sourceId: '4006381333931',
    tier: 'checkThis',
    tierReason: 'Entered by Open Food Facts contributors and not checked against a package.',
  }),
  servings: [{ description: '1/3 package', grams: 52 }],
  barcodes: [onlineGtin],
};

/** An Open Food Facts stand-in holding the noodles. */
export const onlineSource = (entries: readonly PackEntry[] = [onlineNoodles]) => new InMemoryOnlineFoodSource('off', entries);
