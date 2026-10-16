import { CatalogFood } from '../../foodCatalog/CatalogFood';
import { FixturePack } from '../../foodCatalog/FixturePack';
import type { PackEntry } from '../../foodCatalog/PackEntry';

/**
 * Foods the stories add to the fixture pack, for states its thirty foods
 * cannot show (MM-321). The fixture pack itself stays as the Dart writer
 * recorded it (MM-231). Invented, and not a nutrition source.
 */
export const storyFoods: readonly PackEntry[] = [
  {
    food: new CatalogFood({
      id: 1001,
      packId: FixturePack.packId,
      name: 'Trail mix, house',
      kcal: 462,
      proteinG: 14,
      carbsG: 45,
      fatG: 29,
      preparation: 'unspecified',
      source: 'fixture',
      sourceId: 'story-1001',
      tier: 'checkThis',
      tierReason: 'Its calories and macros disagree by more than 20%.',
    }),
  },
];
