import { beforeEach, describe, expect, it } from 'vitest';
import type { FoodBarcodeLookup } from '../../src/domain/integration/FoodBarcodeLookup';
import type { FoodItem } from '../../src/domain/integration/FoodItem';
import { NotFound } from '../../src/domain/integration/NotFound';
import { Succeeded } from '../../src/domain/integration/Succeeded';

const yogurt: FoodItem = {
  id: '1',
  name: 'Greek yogurt, plain',
  barcode: '00000000000011',
  servingLabel: '170 g',
  kcal: 100,
  proteinG: 18,
  carbsG: 6,
  fatG: 0,
};

/**
 * What every `FoodBarcodeLookup` must do. `create` builds one containing
 * exactly the given items.
 */
export function foodBarcodeLookupContract(name: string, create: (items: readonly FoodItem[]) => FoodBarcodeLookup): void {
  describe(`${name} as a FoodBarcodeLookup`, () => {
    let lookup: FoodBarcodeLookup;
    beforeEach(() => {
      lookup = create([yogurt]);
    });

    it('finds an item by its GTIN-14', async () => {
      const result = await lookup.lookup('00000000000011');
      expect(result).toBeInstanceOf(Succeeded);
      expect((result as Succeeded<FoodItem>).value.name).toBe('Greek yogurt, plain');
    });

    it('an unknown barcode is NotFound, not an error', async () => {
      expect(await lookup.lookup('99999999999999')).toBeInstanceOf(NotFound);
    });
  });
}
