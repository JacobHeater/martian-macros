import type { GoalBodyFat } from '../domain/GoalBodyFat';
import type { GoalBodyFatRepository } from '../domain/repositories/GoalBodyFatRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, number } from './columns';
import { upsert } from './upsert';

/**
 * `GoalBodyFatRepository` kept in the database (MM-507): one row, the goal
 * and the day it was set; none when no goal is set.
 */
export class SqlGoalBodyFatRepository implements GoalBodyFatRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchGoalBodyFat(): Watched<GoalBodyFat | undefined> {
    return this.db.watch(['goal_body_fat'], async (db) => {
      const row = (await db.select('SELECT * FROM goal_body_fat WHERE id = 1'))[0];
      return row === undefined ? undefined : { percent: number(row, 'percent'), setOn: day(row, 'set_epoch_day') };
    });
  }

  saveGoalBodyFat(goal: GoalBodyFat): Promise<void> {
    return this.db.write(['goal_body_fat'], (db) =>
      upsert(db, 'goal_body_fat', ['id'], { id: 1, percent: goal.percent, set_epoch_day: goal.setOn.epochDay }),
    );
  }

  clearGoalBodyFat(): Promise<void> {
    return this.db.write(['goal_body_fat'], async (db) => {
      await db.execute('DELETE FROM goal_body_fat');
    });
  }
}
