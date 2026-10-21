import type { CalendarDate } from '../domain/CalendarDate';
import { GoalMode } from '../domain/GoalMode';
import { LeanGainPace } from '../domain/LeanGainPace';
import { DailyTargets } from '../engine/DailyTargets';
import { TargetFlag } from '../engine/TargetFlag';
import { TargetsExplanation } from '../engine/TargetsExplanation';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import { TargetsRecord } from '../engine/TargetsRecord';
import { TdeeStatus } from '../engine/TdeeStatus';
import { byName } from '../lang/byName';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, integer, named, number, optionalNamed, optionalNumber, optionalText, orNull, text } from './columns';
import { upsert } from './upsert';

function recordFrom(r: SqlRow): TargetsRecord {
  const explanation = optionalText(r, 'explanation');
  return new TargetsRecord({
    effectiveFrom: day(r, 'effective_epoch_day'),
    mode: named(GoalMode.values, r, 'mode'),
    tdeeKcal: number(r, 'tdee_kcal'),
    tdeeSigmaKcal: number(r, 'tdee_sigma_kcal'),
    tdeeStatus: named(TdeeStatus.values, r, 'tdee_status'),
    safetyBodyFatPercent: optionalNumber(r, 'safety_body_fat_percent'),
    requestedLossFraction: optionalNumber(r, 'requested_loss_fraction'),
    leanGainPace: optionalNamed(LeanGainPace.values, r, 'lean_gain_pace'),
    profileRevision: integer(r, 'profile_revision'),
    targetRulesVersion: integer(r, 'target_rules_version'),
    explanation: explanation === undefined ? undefined : TargetsExplanation.decode(explanation),
    summarySeen: flag(r, 'summary_seen'),
    targets: new DailyTargets({
      kcal: number(r, 'kcal'),
      proteinG: number(r, 'protein_g'),
      proteinMinimumG: optionalNumber(r, 'protein_minimum_g'),
      fatG: number(r, 'fat_g'),
      carbsG: number(r, 'carbs_g'),
      weeklyRateFraction: number(r, 'weekly_rate_fraction'),
      flags: new Set(
        text(r, 'flags')
          .split(',')
          .filter((name) => name !== '')
          .map((name) => byName(TargetFlag.values, name)),
      ),
    }),
  });
}

/** `TargetsHistoryRepository` kept in the database. */
export class SqlTargetsHistoryRepository implements TargetsHistoryRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchTargetsHistory(): Watched<TargetsRecord[]> {
    return this.db.watch(['targets_history'], async (db) =>
      (await db.select('SELECT * FROM targets_history ORDER BY effective_epoch_day')).map(recordFrom),
    );
  }

  saveTargets(record: TargetsRecord): Promise<void> {
    return this.db.write(['targets_history'], (db) =>
      upsert(db, 'targets_history', ['effective_epoch_day'], {
        effective_epoch_day: record.effectiveFrom.epochDay,
        mode: record.mode,
        kcal: record.targets.kcal,
        protein_g: record.targets.proteinG,
        protein_minimum_g: orNull(record.targets.proteinMinimumG),
        fat_g: record.targets.fatG,
        carbs_g: record.targets.carbsG,
        weekly_rate_fraction: record.targets.weeklyRateFraction,
        flags: [...record.targets.flags].join(','),
        tdee_kcal: record.tdeeKcal,
        tdee_sigma_kcal: record.tdeeSigmaKcal,
        tdee_status: record.tdeeStatus,
        safety_body_fat_percent: orNull(record.safetyBodyFatPercent),
        requested_loss_fraction: orNull(record.requestedLossFraction),
        lean_gain_pace: orNull(record.leanGainPace),
        profile_revision: record.profileRevision,
        target_rules_version: record.targetRulesVersion,
        explanation: orNull(record.explanation?.encode()),
        summary_seen: asFlag(record.summarySeen),
      }),
    );
  }

  markSummariesSeenThrough(effectiveFrom: CalendarDate): Promise<void> {
    return this.db.write(['targets_history'], (db) =>
      db.execute('UPDATE targets_history SET summary_seen = 1 WHERE effective_epoch_day <= ? AND summary_seen = 0', [
        effectiveFrom.epochDay,
      ]),
    );
  }
}
