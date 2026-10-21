import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import type { TargetShapeRepository } from '../../src/domain/repositories/TargetShapeRepository';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `TargetShapeRepository` must do (MM-122, MM-124, MM-486), in memory and in the database. */
export function targetShapeRepositoryContract(
  name: string,
  create: () => TargetShapeRepository | Promise<TargetShapeRepository>,
): void {
  describe(`${name} as a TargetShapeRepository`, () => {
    let repo: TargetShapeRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 2, 1);
    const weekend = new WeekShape({ higherDays: [6, 0], raise: 0.3 });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchTargetShapes())).toEqual([]);
    });

    it('lists shapes oldest first, with every field', async () => {
      await repo.saveTargetShape(new TargetShape({ since: d2 }));
      await repo.saveTargetShape(
        new TargetShape({ since: d1, balance: new CarbFatBalance({ fatShare: 0.35, carbFloorOff: true }), week: weekend }),
      );
      const shapes = await first(repo.watchTargetShapes());
      expect(shapes.map((s) => s.since)).toEqual([d1, d2]);
      expect(shapes[0]?.balance?.fatShare).toBeCloseTo(0.35, 9);
      expect(shapes[0]?.balance?.carbFloorOff).toBe(true);
      expect([...(shapes[0]?.week.higherDays ?? [])]).toEqual([0, 6]);
      expect(shapes[0]?.week.raise).toBe(0.3);
      expect(shapes[1]?.balance).toBeUndefined();
      expect(shapes[1]?.week.isFlat).toBe(true);
    });

    it('keeps one shape per day; saving again replaces it', async () => {
      await repo.saveTargetShape(new TargetShape({ since: d1, week: weekend }));
      await repo.saveTargetShape(new TargetShape({ since: d1, balance: CarbFatBalance.balanced }));
      const only = single(await first(repo.watchTargetShapes()));
      expect(only.week.isFlat).toBe(true);
      expect(only.balance?.fatShare).toBe(CarbFatBalance.balancedFatShare);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchTargetShapes(), {
        see: (shapes) => shapes.length,
        before: 0,
        change: () => repo.saveTargetShape(new TargetShape({ since: d1 })),
        after: 1,
      });
    });
  });
}
