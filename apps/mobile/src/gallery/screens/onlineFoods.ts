import { Unavailable } from '../../domain/integration/Unavailable';
import { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { PackEntry } from '../../foodCatalog/PackEntry';
import { InMemoryOnlineFoodSource } from '../../foodOnline/InMemoryOnlineFoodSource';
import type { StoryDevice } from './StoryDevice';

/** The GTIN-14 of 4006381333931, the code the scan stories type. */
export const storyOnlineGtin = '04006381333931';

/** A product only a web service knows (MM-58), as Open Food Facts would answer. */
export const storyOnlineNoodles: PackEntry = {
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
  barcodes: [storyOnlineGtin],
};

/**
 * A phone whose build can ask Open Food Facts (MM-58): the service answers
 * from `entries`, or cannot be reached when `down`.
 */
export function onlineFoods({ entries = [storyOnlineNoodles], down = false }: { entries?: readonly PackEntry[]; down?: boolean } = {}): StoryDevice {
  return async (services) => {
    const source = new InMemoryOnlineFoodSource('off', entries);
    if (down) source.failWith(new Unavailable('No connection.'));
    return { ...services, onlineSources: [source] };
  };
}
