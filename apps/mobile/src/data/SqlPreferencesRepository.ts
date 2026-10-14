import type { CalendarDate } from '../domain/CalendarDate';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { EasyToMissPreference } from '../domain/food/easyToMiss/EasyToMissPreference';
import { MacroPicture } from '../domain/MacroPicture';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import { TermsAcceptance } from '../domain/TermsAcceptance';
import { ThemePreference } from '../domain/ThemePreference';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, integer, named, optionalDay, optionalInteger } from './columns';
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

  watchMacroPicture(): Watched<MacroPicture> {
    return this.watch((row) => (row === undefined ? 'bars' : named(MacroPicture.values, row, 'macro_picture')));
  }

  saveMacroPicture(picture: MacroPicture): Promise<void> {
    return this.save({ macro_picture: picture });
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
}
