import { OnlineLookupChoice } from '../domain/food/online/OnlineLookupChoice';
import type { CalendarDate } from '../domain/CalendarDate';
import { CookingFatKind } from '../domain/food/CookingFatKind';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { EasyToMissPreference } from '../domain/food/easyToMiss/EasyToMissPreference';
import { InsightArea } from '../domain/InsightArea';
import type { InsightSwitches } from '../domain/InsightSwitches';
import { MacroPicture } from '../domain/MacroPicture';
import { NutritionGoals } from '../domain/NutritionGoals';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import { TermsAcceptance } from '../domain/TermsAcceptance';
import { ThemePreference } from '../domain/ThemePreference';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, integer, named, optionalDay, optionalInteger, optionalNumber, optionalText, orNull, text } from './columns';
import { upsert } from './upsert';
import type { Values } from './Values';

/**
 * `PreferencesRepository` kept in the database, in one row. Each save
 * changes its own column and leaves the rest as they are.
 */
export class SqlPreferencesRepository implements PreferencesRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  /** What `from` makes of the row, or of no row before anything was saved. */
  private watch<T>(from: (row: SqlRow | undefined) => T): Watched<T> {
    return this.db.watch(['user_preferences'], async (db) => from((await db.select('SELECT * FROM user_preferences'))[0]));
  }

  private save(values: Values): Promise<void> {
    return this.db.write(['user_preferences'], (db) => upsert(db, 'user_preferences', ['id'], { id: 1, ...values }));
  }

  watchThemePreference(): Watched<ThemePreference> {
    return this.watch((row) =>
      row === undefined ? 'unselected' : named(ThemePreference.values, row, 'theme_preference'),
    );
  }

  saveThemePreference(preference: ThemePreference): Promise<void> {
    return this.save({ theme_preference: preference });
  }

  watchEasyToMiss(): Watched<EasyToMissPreference> {
    return this.watch((row) =>
      row === undefined
        ? new EasyToMissPreference()
        : new EasyToMissPreference({
            enabled: flag(row, 'easy_to_miss_enabled'),
            lastShown: optionalDay(row, 'easy_to_miss_last_shown_epoch_day'),
          }),
    );
  }

  saveEasyToMissEnabled(enabled: boolean): Promise<void> {
    return this.save({ easy_to_miss_enabled: asFlag(enabled) });
  }

  markEasyToMissShown(day: CalendarDate): Promise<void> {
    return this.save({ easy_to_miss_last_shown_epoch_day: day.epochDay });
  }

  watchDetailLevel(): Watched<DetailLevel> {
    return this.watch((row) => (row === undefined ? 'standard' : named(DetailLevel.values, row, 'detail_level')));
  }

  saveDetailLevel(level: DetailLevel): Promise<void> {
    return this.save({ detail_level: level });
  }

  watchUsualCookingFat(): Watched<CookingFatKind> {
    return this.watch((row) => (row === undefined ? 'oil' : named(CookingFatKind.values, row, 'usual_cooking_fat')));
  }

  saveUsualCookingFat(kind: CookingFatKind): Promise<void> {
    return this.save({ usual_cooking_fat: kind });
  }

  watchPrimaryScale(): Watched<string | undefined> {
    return this.watch((row) => (row === undefined ? undefined : optionalText(row, 'primary_scale_source_id')));
  }

  savePrimaryScale(sourceId: string | undefined): Promise<void> {
    return this.save({ primary_scale_source_id: orNull(sourceId) });
  }

  watchMacroPicture(): Watched<MacroPicture> {
    return this.watch((row) => (row === undefined ? 'bars' : named(MacroPicture.values, row, 'macro_picture')));
  }

  saveMacroPicture(picture: MacroPicture): Promise<void> {
    return this.save({ macro_picture: picture });
  }

  watchNetCarbs(): Watched<boolean> {
    return this.watch((row) => (row === undefined ? true : flag(row, 'net_carbs')));
  }

  saveNetCarbs(on: boolean): Promise<void> {
    return this.save({ net_carbs: asFlag(on) });
  }

  watchUnderEatingDismissedOn(): Watched<CalendarDate | undefined> {
    return this.watch((row) => (row === undefined ? undefined : optionalDay(row, 'under_eating_dismissed_epoch_day')));
  }

  saveUnderEatingDismissedOn(day: CalendarDate): Promise<void> {
    return this.save({ under_eating_dismissed_epoch_day: day.epochDay });
  }

  watchReturnScreenDismissedOn(): Watched<CalendarDate | undefined> {
    return this.watch((row) => (row === undefined ? undefined : optionalDay(row, 'return_screen_dismissed_epoch_day')));
  }

  saveReturnScreenDismissedOn(day: CalendarDate): Promise<void> {
    return this.save({ return_screen_dismissed_epoch_day: day.epochDay });
  }

  watchRecoveryCheckInSkippedOn(): Watched<CalendarDate | undefined> {
    return this.watch((row) =>
      row === undefined ? undefined : optionalDay(row, 'recovery_check_in_skipped_epoch_day'),
    );
  }

  saveRecoveryCheckInSkippedOn(day: CalendarDate): Promise<void> {
    return this.save({ recovery_check_in_skipped_epoch_day: day.epochDay });
  }

  watchLastBackupOn(): Watched<CalendarDate | undefined> {
    return this.watch((row) => (row === undefined ? undefined : optionalDay(row, 'last_backup_epoch_day')));
  }

  saveLastBackupOn(day: CalendarDate): Promise<void> {
    return this.save({ last_backup_epoch_day: day.epochDay });
  }

  watchExactTargets(): Watched<boolean> {
    return this.watch((row) => (row === undefined ? false : flag(row, 'exact_targets')));
  }

  saveExactTargets(on: boolean): Promise<void> {
    return this.save({ exact_targets: asFlag(on) });
  }

  watchLabelNoteDismissedOn(): Watched<CalendarDate | undefined> {
    return this.watch((row) => (row === undefined ? undefined : optionalDay(row, 'label_note_dismissed_epoch_day')));
  }

  saveLabelNoteDismissedOn(day: CalendarDate): Promise<void> {
    return this.save({ label_note_dismissed_epoch_day: day.epochDay });
  }

  watchOnlineLookup(): Watched<OnlineLookupChoice> {
    return this.watch((row) => (row === undefined ? 'ask' : OnlineLookupChoice.of(String(row['online_lookup'] ?? 'ask'))));
  }

  saveOnlineLookup(choice: OnlineLookupChoice): Promise<void> {
    return this.save({ online_lookup: choice });
  }

  watchEaseIntoMaintenance(): Watched<boolean> {
    return this.watch((row) => (row === undefined ? false : flag(row, 'ease_into_maintenance')));
  }

  saveEaseIntoMaintenance(on: boolean): Promise<void> {
    return this.save({ ease_into_maintenance: asFlag(on) });
  }

  watchNutritionGoals(): Watched<NutritionGoals> {
    return this.watch((row) =>
      row === undefined
        ? NutritionGoals.none
        : new NutritionGoals({
            sodiumLimitMg: optionalInteger(row, 'sodium_limit_mg'),
            sodiumLimitSince: optionalDay(row, 'sodium_limit_since_epoch_day'),
            waterGoalMl: optionalNumber(row, 'water_goal_ml'),
            waterGoalOff: flag(row, 'water_goal_off'),
          }),
    );
  }

  saveSodiumLimit(mg: number | undefined, on: CalendarDate): Promise<void> {
    return this.save({ sodium_limit_mg: orNull(mg), sodium_limit_since_epoch_day: mg === undefined ? null : on.epochDay });
  }

  saveWaterGoal(ml: number | undefined): Promise<void> {
    return this.save({ water_goal_ml: orNull(ml), water_goal_off: 0 });
  }

  saveWaterGoalOff(off: boolean): Promise<void> {
    return this.save({ water_goal_off: off ? 1 : 0 });
  }

  watchTermsAcceptance(): Watched<TermsAcceptance | undefined> {
    return this.watch((row) =>
      row === undefined || optionalInteger(row, 'terms_accepted_version') === undefined
        ? undefined
        : new TermsAcceptance({
            version: integer(row, 'terms_accepted_version'),
            acceptedOn: day(row, 'terms_accepted_epoch_day'),
          }),
    );
  }

  saveTermsAcceptance(acceptance: TermsAcceptance): Promise<void> {
    return this.save({
      terms_accepted_version: acceptance.version,
      terms_accepted_epoch_day: acceptance.acceptedOn.epochDay,
    });
  }

  watchInsightSwitches(): Watched<InsightSwitches> {
    return this.watch((row) => {
      if (row === undefined) return { all: true, offAreas: new Set(), offKinds: new Set() };
      // Each list is names joined by commas. An area no longer known is dropped; a kind's id is kept as it was.
      const list = (column: string) => text(row, column).split(',').filter((name) => name !== '');
      return {
        all: !flag(row, 'inline_insights_off'),
        offAreas: new Set(list('inline_insight_areas_off').filter((name): name is InsightArea => (InsightArea.values as readonly string[]).includes(name))),
        offKinds: new Set(list('inline_insight_kinds_off')),
      };
    });
  }

  saveInsightSwitches(switches: InsightSwitches): Promise<void> {
    return this.save({
      inline_insights_off: asFlag(!switches.all),
      inline_insight_areas_off: [...switches.offAreas].sort().join(','),
      inline_insight_kinds_off: [...switches.offKinds].sort().join(','),
    });
  }
}
