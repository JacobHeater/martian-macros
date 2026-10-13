import type { CalendarDate } from '../domain/CalendarDate';
import type { DetailLevel } from '../domain/food/detail/DetailLevel';
import { EasyToMissPreference } from '../domain/food/easyToMiss/EasyToMissPreference';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import type { TermsAcceptance } from '../domain/TermsAcceptance';
import type { ThemePreference } from '../domain/ThemePreference';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `PreferencesRepository` held in memory. */
export class InMemoryPreferencesRepository implements PreferencesRepository {
  private readonly theme = new ObservableValue<ThemePreference>('unselected');
  private readonly easyToMiss = new ObservableValue(new EasyToMissPreference());
  private readonly detail = new ObservableValue<DetailLevel>('standard');
  private readonly underEatingDismissed = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly returnDismissed = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly recoverySkipped = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly terms = new ObservableValue<TermsAcceptance | undefined>(undefined);

  watchThemePreference(): Watched<ThemePreference> {
    return this.theme.watch();
  }

  async saveThemePreference(preference: ThemePreference): Promise<void> {
    this.theme.value = preference;
  }

  watchEasyToMiss(): Watched<EasyToMissPreference> {
    return this.easyToMiss.watch();
  }

  async saveEasyToMissEnabled(enabled: boolean): Promise<void> {
    this.easyToMiss.value = new EasyToMissPreference({ enabled, lastShown: this.easyToMiss.value.lastShown });
  }

  async markEasyToMissShown(day: CalendarDate): Promise<void> {
    this.easyToMiss.value = new EasyToMissPreference({ enabled: this.easyToMiss.value.enabled, lastShown: day });
  }

  watchDetailLevel(): Watched<DetailLevel> {
    return this.detail.watch();
  }

  async saveDetailLevel(level: DetailLevel): Promise<void> {
    this.detail.value = level;
  }

  watchUnderEatingDismissedOn(): Watched<CalendarDate | undefined> {
    return this.underEatingDismissed.watch();
  }

  async saveUnderEatingDismissedOn(day: CalendarDate): Promise<void> {
    this.underEatingDismissed.value = day;
  }

  watchReturnScreenDismissedOn(): Watched<CalendarDate | undefined> {
    return this.returnDismissed.watch();
  }

  async saveReturnScreenDismissedOn(day: CalendarDate): Promise<void> {
    this.returnDismissed.value = day;
  }

  watchRecoveryCheckInSkippedOn(): Watched<CalendarDate | undefined> {
    return this.recoverySkipped.watch();
  }

  async saveRecoveryCheckInSkippedOn(day: CalendarDate): Promise<void> {
    this.recoverySkipped.value = day;
  }

  watchTermsAcceptance(): Watched<TermsAcceptance | undefined> {
    return this.terms.watch();
  }

  async saveTermsAcceptance(acceptance: TermsAcceptance): Promise<void> {
    this.terms.value = acceptance;
  }

  /** Back to the defaults (used by `InMemoryDataEraser`). */
  clear(): void {
    this.theme.value = 'unselected';
    this.easyToMiss.value = new EasyToMissPreference();
    this.detail.value = 'standard';
    this.underEatingDismissed.value = undefined;
    this.returnDismissed.value = undefined;
    this.recoverySkipped.value = undefined;
    this.terms.value = undefined;
  }
}
