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
  // Twenty-five yogurts, so a search for "yogurt" has more than one page of results (MM-410).
  ...['plain', 'vanilla', 'strawberry', 'blueberry', 'peach', 'cherry', 'raspberry', 'lemon', 'coffee', 'honey', 'mango', 'coconut', 'key lime']
    .flatMap((flavor) => [`Yogurt, ${flavor}, whole milk`, `Yogurt, ${flavor}, low fat`])
    .slice(0, 25)
    .map((name, at) => ({
      food: new CatalogFood({
        id: 1002 + at,
        packId: FixturePack.packId,
        name,
        kcal: name.endsWith('whole milk') ? 97 : 75,
        proteinG: 4,
        carbsG: name.endsWith('whole milk') ? 11 : 12,
        fatG: name.endsWith('whole milk') ? 4 : 1,
        preparation: 'unspecified',
        source: 'fixture',
        sourceId: `story-${1002 + at}`,
        tier: 'reference',
        tierReason: 'Invented for the stories.',
      }),
    })),
];
