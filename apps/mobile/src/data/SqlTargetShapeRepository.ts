import { CarbFatBalance } from '../domain/CarbFatBalance';
import type { TargetShapeRepository } from '../domain/repositories/TargetShapeRepository';
import { TargetShape } from '../domain/TargetShape';
import { WeekShape } from '../domain/WeekShape';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, number, optionalNumber, orNull, text } from './columns';
import { upsert } from './upsert';

/**
 * `TargetShapeRepository` kept in the database (MM-486): one row per day a
 * shape was set from. No fat share is a balance not chosen; the higher days
 * are weekday numbers, Sunday as 0, joined by commas, none for a flat week.
 */
export class SqlTargetShapeRepository implements TargetShapeRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchTargetShapes(): Watched<TargetShape[]> {
    return this.db.watch(['target_shapes'], async (db) =>
      (await db.select('SELECT * FROM target_shapes ORDER BY since_epoch_day')).map((r) => {
        const fatShare = optionalNumber(r, 'fat_share');
        const higherDays = text(r, 'higher_days');
        return new TargetShape({
          since: day(r, 'since_epoch_day'),
          balance: fatShare === undefined ? undefined : new CarbFatBalance({ fatShare, carbFloorOff: flag(r, 'carb_floor_off') }),
          week: new WeekShape({
            higherDays: higherDays === '' ? [] : higherDays.split(',').map(Number),
            raise: number(r, 'raise_share'),
          }),
        });
      }),
    );
  }

  saveTargetShape(shape: TargetShape): Promise<void> {
    return this.db.write(['target_shapes'], (db) =>
      upsert(db, 'target_shapes', ['since_epoch_day'], {
        since_epoch_day: shape.since.epochDay,
        fat_share: orNull(shape.balance?.fatShare),
        carb_floor_off: asFlag(shape.balance?.carbFloorOff ?? false),
        higher_days: [...shape.week.higherDays].join(','),
        raise_share: shape.week.raise,
      }),
    );
  }
}
