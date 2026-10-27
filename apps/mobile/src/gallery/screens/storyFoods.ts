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
  // Drinks the pack states per 100 mL (MM-650, MM-651): a cola by the can with no density, an oat drink with one.
  {
    food: new CatalogFood({
      id: 1027,
      packId: FixturePack.packId,
      name: 'Cola, classic',
      brand: 'Story Brand',
      basis: 'per100ml',
      kcal: 42,
      proteinG: 0,
      carbsG: 10.6,
      fatG: 0,
      sodiumMg: 4,
      micros: { sugars: 10.6 },
      preparation: 'packaged',
      source: 'fixture',
      sourceId: 'story-1027',
      tier: 'label',
      tierReason: 'Invented for the stories.',
    }),
    servings: [{ description: '1 can (355 mL)', milliliters: 355 }],
  },
  {
    food: new CatalogFood({
      id: 1028,
      packId: FixturePack.packId,
      name: 'Oat drink, barista',
      brand: 'Story Brand',
      basis: 'per100ml',
      kcal: 61,
      proteinG: 1,
      carbsG: 7.5,
      fatG: 3,
      fiberG: 0.8,
      sodiumMg: 40,
      densityGPerMl: 1.02,
      preparation: 'packaged',
      source: 'fixture',
      sourceId: 'story-1028',
      tier: 'label',
      tierReason: 'Invented for the stories.',
    }),
    servings: [{ description: '1 cup (240 mL)', milliliters: 240 }],
  },
];
