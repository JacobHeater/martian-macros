import type { CalendarDate } from '../domain/CalendarDate';
import type { OnlineLookupChoice } from '../domain/food/online/OnlineLookupChoice';
import type { CookingFatKind } from '../domain/food/CookingFatKind';
import type { DetailLevel } from '../domain/food/detail/DetailLevel';
import { EasyToMissPreference } from '../domain/food/easyToMiss/EasyToMissPreference';
import { InsightSwitches } from '../domain/InsightSwitches';
import type { MacroPicture } from '../domain/MacroPicture';
import { NutritionGoals } from '../domain/NutritionGoals';
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
  private readonly picture = new ObservableValue<MacroPicture>('bars');
  private readonly netCarbs = new ObservableValue(true);
  private readonly underEatingDismissed = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly returnDismissed = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly recoverySkipped = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly terms = new ObservableValue<TermsAcceptance | undefined>(undefined);
  private readonly goals = new ObservableValue(NutritionGoals.none);
  private readonly switches = new ObservableValue(InsightSwitches.allOn);
  private readonly lastBackup = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly exactTargets = new ObservableValue(false);
  private readonly onlineLookup = new ObservableValue<OnlineLookupChoice>('ask');
  private readonly labelNoteDismissed = new ObservableValue<CalendarDate | undefined>(undefined);
  private readonly easeIntoMaintenance = new ObservableValue(false);
  private readonly usualCookingFat = new ObservableValue<CookingFatKind>('oil');
  private readonly primaryScale = new ObservableValue<string | undefined>(undefined);

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

  watchMacroPicture(): Watched<MacroPicture> {
    return this.picture.watch();
  }

  watchNetCarbs(): Watched<boolean> {
    return this.netCarbs.watch();
  }

  async saveNetCarbs(on: boolean): Promise<void> {
    this.netCarbs.value = on;
  }

  async saveMacroPicture(picture: MacroPicture): Promise<void> {
    this.picture.value = picture;
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

  watchNutritionGoals(): Watched<NutritionGoals> {
    return this.goals.watch();
  }

  async saveSodiumLimit(mg: number | undefined, on: CalendarDate): Promise<void> {
    const { waterGoalMl, waterGoalOff } = this.goals.value;
    this.goals.value = new NutritionGoals({ sodiumLimitMg: mg, sodiumLimitSince: on, waterGoalMl, waterGoalOff });
  }

  async saveWaterGoal(ml: number | undefined): Promise<void> {
    const { sodiumLimitMg, sodiumLimitSince } = this.goals.value;
    this.goals.value = new NutritionGoals({ sodiumLimitMg, sodiumLimitSince, waterGoalMl: ml });
  }

  async saveWaterGoalOff(off: boolean): Promise<void> {
    const { sodiumLimitMg, sodiumLimitSince, waterGoalMl } = this.goals.value;
    this.goals.value = new NutritionGoals({ sodiumLimitMg, sodiumLimitSince, waterGoalMl, waterGoalOff: off });
  }

  watchInsightSwitches(): Watched<InsightSwitches> {
    return this.switches.watch();
  }

  async saveInsightSwitches(switches: InsightSwitches): Promise<void> {
    this.switches.value = switches;
  }

  watchOnlineLookup(): Watched<OnlineLookupChoice> {
    return this.onlineLookup.watch();
  }

  async saveOnlineLookup(choice: OnlineLookupChoice): Promise<void> {
    this.onlineLookup.value = choice;
  }

  watchExactTargets(): Watched<boolean> {
    return this.exactTargets.watch();
  }

  async saveExactTargets(on: boolean): Promise<void> {
    this.exactTargets.value = on;
  }

  watchLabelNoteDismissedOn(): Watched<CalendarDate | undefined> {
    return this.labelNoteDismissed.watch();
  }

  async saveLabelNoteDismissedOn(day: CalendarDate): Promise<void> {
    this.labelNoteDismissed.value = day;
  }

  watchEaseIntoMaintenance(): Watched<boolean> {
    return this.easeIntoMaintenance.watch();
  }

  async saveEaseIntoMaintenance(on: boolean): Promise<void> {
    this.easeIntoMaintenance.value = on;
  }

  watchUsualCookingFat(): Watched<CookingFatKind> {
    return this.usualCookingFat.watch();
  }

  async saveUsualCookingFat(kind: CookingFatKind): Promise<void> {
    this.usualCookingFat.value = kind;
  }

  watchPrimaryScale(): Watched<string | undefined> {
    return this.primaryScale.watch();
  }

  async savePrimaryScale(sourceId: string | undefined): Promise<void> {
    this.primaryScale.value = sourceId;
  }

  /** Back to the defaults (used by `InMemoryDataEraser`). */
  clear(): void {
    this.usualCookingFat.value = 'oil';
    this.primaryScale.value = undefined;
    this.exactTargets.value = false;
    this.onlineLookup.value = 'ask';
    this.labelNoteDismissed.value = undefined;
    this.easeIntoMaintenance.value = false;
    this.theme.value = 'unselected';
    this.easyToMiss.value = new EasyToMissPreference();
    this.detail.value = 'standard';
    this.picture.value = 'bars';
    this.underEatingDismissed.value = undefined;
    this.returnDismissed.value = undefined;
    this.recoverySkipped.value = undefined;
    this.terms.value = undefined;
    this.goals.value = NutritionGoals.none;
    this.switches.value = InsightSwitches.allOn;
  }

  watchLastBackupOn(): Watched<CalendarDate | undefined> {
    return this.lastBackup.watch();
  }

  async saveLastBackupOn(day: CalendarDate): Promise<void> {
    this.lastBackup.value = day;
  }
}
