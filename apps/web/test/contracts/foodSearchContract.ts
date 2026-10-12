import { beforeEach, describe, expect, it } from 'vitest';
import type { FoodItem } from '../../src/domain/integration/FoodItem';
import type { FoodSearch } from '../../src/domain/integration/FoodSearch';
import { Succeeded } from '../../src/domain/integration/Succeeded';

const items: readonly FoodItem[] = [
  {
    id: '1',
    name: 'Greek yogurt, plain',
    brand: 'Fage',
    barcode: '00000000000011',
    servingLabel: '170 g',
    kcal: 100,
    proteinG: 18,
    carbsG: 6,
    fatG: 0,
  },
  { id: '2', name: 'Rolled oats', servingLabel: '40 g', kcal: 150, proteinG: 5, carbsG: 27, fatG: 3 },
  { id: '3', name: 'Oat milk', servingLabel: '240 ml', kcal: 120, proteinG: 3, carbsG: 16, fatG: 5 },
];

/**
 * What every `FoodSearch` must do. `create` builds one over exactly these
 * items (the contract supplies them, so any implementation that can be
 * seeded runs it).
 */
export function foodSearchContract(name: string, create: (items: readonly FoodItem[]) => FoodSearch): void {
  describe(`${name} as a FoodSearch`, () => {
    let search: FoodSearch;
    beforeEach(() => {
      search = create(items);
    });

    const ids = async (q: string, { limit = 25 }: { limit?: number } = {}) => {
      const result = await search.search(q, { limit });
      expect(result).toBeInstanceOf(Succeeded);
      return (result as Succeeded<FoodItem[]>).value.map((i) => i.id);
    };

    it('matches the name, ignoring case', async () => {
      expect(await ids('YOGURT')).toEqual(['1']);
    });

    it('matches the brand', async () => {
      expect(await ids('fage')).toEqual(['1']);
    });

    it('finds every item containing the text', async () => {
      expect((await ids('oat')).sort()).toEqual(['2', '3']);
    });

    it('no match is an empty success, not an error', async () => {
      expect(await ids('pizza')).toEqual([]);
    });

    it('an empty query finds nothing', async () => {
      expect(await ids('  ')).toEqual([]);
    });

    it('honors the limit', async () => {
      expect((await ids('oat', { limit: 1 })).length).toBe(1);
    });
  });
}
