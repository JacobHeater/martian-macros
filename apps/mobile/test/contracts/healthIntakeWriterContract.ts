import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthIntakeWriter } from '../../src/healthIngest/HealthIntakeWriter';
import type { HealthWriting } from '../../src/healthIngest/HealthWriting';
import type { NutritionRecord } from '../../src/healthIngest/NutritionRecord';
import type { WaterRecord } from '../../src/healthIngest/WaterRecord';

/**
 * What every `HealthIntakeWriter` must do (MM-70, MM-314). `create` gives
 * one with food and water off; it is turned on through its own
 * `HealthWriting`, and may be refused.
 */
export function healthIntakeWriterContract(
  name: string,
  create: () => Promise<HealthWriting & HealthIntakeWriter>,
): void {
  describe(`${name} as HealthIntakeWriter`, () => {
    let writer: HealthWriting & HealthIntakeWriter;
    const lunch: NutritionRecord = {
      id: 'martian-macros-food-1',
      start: new Date(2026, 9, 5, 12, 30),
      end: new Date(2026, 9, 5, 13, 0),
      kcal: 510,
      proteinG: 40,
      carbsG: 50,
      fatG: 15,
      name: 'Chicken and rice',
      meal: 'lunch',
    };
    const glass: WaterRecord = { id: 'martian-macros-water-1', at: new Date(2026, 9, 5, 9, 0), ml: 250 };

    beforeEach(async () => {
      writer = await create();
    });

    it('writes and removes nothing while food and water are off', async () => {
      expect(await writer.writeNutrition(lunch)).toBe(false);
      expect(await writer.removeNutrition(lunch.id)).toBe(false);
      expect(await writer.writeWater(glass)).toBe(false);
      expect(await writer.removeWater(glass.id)).toBe(false);
    });

    it('once food is on, a meal is written, written again under its id, and removed', async () => {
      if (!(await writer.startWriting('food'))) return;
      expect(await writer.writeNutrition(lunch)).toBe(true);
      expect(await writer.writeNutrition({ ...lunch, kcal: 450 })).toBe(true);
      expect(await writer.removeNutrition(lunch.id)).toBe(true);
    });

    it('a meal with no span is not written', async () => {
      if (!(await writer.startWriting('food'))) return;
      expect(await writer.writeNutrition({ ...lunch, end: lunch.start })).toBe(false);
    });

    it('once water is on, a drink is written and removed; food stays off', async () => {
      if (!(await writer.startWriting('water'))) return;
      expect(await writer.writeWater(glass)).toBe(true);
      expect(await writer.removeWater(glass.id)).toBe(true);
      expect(await writer.writeNutrition(lunch)).toBe(false);
    });

    it('no water is not written', async () => {
      if (!(await writer.startWriting('water'))) return;
      expect(await writer.writeWater({ ...glass, ml: 0 })).toBe(false);
    });

    it('turned off again, nothing more is written', async () => {
      if (!(await writer.startWriting('food'))) return;
      await writer.stopWriting('food');
      expect(await writer.writeNutrition(lunch)).toBe(false);
    });
  });
}
