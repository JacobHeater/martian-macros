import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WaterRepository } from '../../src/domain/repositories/WaterRepository';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `WaterRepository` must do (MM-313). */
export function waterRepositoryContract(name: string, create: () => WaterRepository | Promise<WaterRepository>): void {
  describe(`${name} as a WaterRepository`, () => {
    let repo: WaterRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    const at = (date: CalendarDate, hour: number) => new Date(date.year, date.month - 1, date.day, hour);
    const drink = (date: CalendarDate, ml: number, hour: number) => new WaterEntry({ id: 0, date, ml, at: at(date, hour) });
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchWater(d1))).toEqual([]);
    });

    it('gives a day its drinks, earliest first, with what was saved', async () => {
      await repo.addWater(drink(d1, 500, 16));
      const id = await repo.addWater(drink(d1, 250, 8));
      await repo.addWater(drink(d2, 330, 9));
      const day = await first(repo.watchWater(d1));
      expect(day.map((e) => e.ml)).toEqual([250, 500]);
      expect(day[0]?.id).toBe(id);
      expect(day[0]?.at.getTime()).toBe(at(d1, 8).getTime());
      expect(day[0]?.date).toBe(d1);
      expect((await first(repo.watchWater(d2))).map((e) => e.ml)).toEqual([330]);
    });

    it('ids are distinct and a removal takes only its own entry', async () => {
      const a = await repo.addWater(drink(d1, 250, 8));
      const b = await repo.addWater(drink(d1, 250, 9));
      expect(a).not.toBe(b);
      await repo.removeWater(a);
      expect((await first(repo.watchWater(d1))).map((e) => e.id)).toEqual([b]);
      await repo.removeWater(9999);
      expect((await first(repo.watchWater(d1))).map((e) => e.id)).toEqual([b]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchWater(d1), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.addWater(drink(d1, 250, 8)),
        after: 1,
      });
    });
  });
}
