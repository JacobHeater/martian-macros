import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DetailLevel } from '../../src/domain/food/detail/DetailLevel';
import { MacroPicture } from '../../src/domain/MacroPicture';
import type { PreferencesRepository } from '../../src/domain/repositories/PreferencesRepository';
import { TermsAcceptance } from '../../src/domain/TermsAcceptance';
import { ThemePreference } from '../../src/domain/ThemePreference';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `PreferencesRepository` must do. */
export function preferencesRepositoryContract(
  name: string,
  create: () => PreferencesRepository | Promise<PreferencesRepository>,
): void {
  describe(`${name} as a PreferencesRepository`, () => {
    let repo: PreferencesRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it('fresh installs await the first theme choice', async () => {
      expect(await first(repo.watchThemePreference())).toBe('unselected');
    });

    it('keeps each choice, and a later one replaces it', async () => {
      for (const choice of ThemePreference.values) {
        await repo.saveThemePreference(choice);
        expect(await first(repo.watchThemePreference())).toBe(choice);
      }
      await repo.saveThemePreference('dark');
      await repo.saveThemePreference('light');
      expect(await first(repo.watchThemePreference())).toBe('light');
    });

    it('other preference writes neither confirm nor overwrite a theme', async () => {
      await repo.saveDetailLevel('full');
      expect(await first(repo.watchThemePreference())).toBe('unselected');
      await repo.saveThemePreference('martian');
      await repo.saveDetailLevel('standard');
      await repo.saveEasyToMissEnabled(false);
      const day = CalendarDate.of(2026, 10, 10);
      await repo.markEasyToMissShown(day);
      await repo.saveUnderEatingDismissedOn(day);
      await repo.saveReturnScreenDismissedOn(day);
      await repo.saveRecoveryCheckInSkippedOn(day);
      expect(await first(repo.watchThemePreference())).toBe('martian');
    });

    it('detail is Standard until changed, and each level is kept', async () => {
      expect(await first(repo.watchDetailLevel())).toBe('standard');
      for (const level of DetailLevel.values) {
        await repo.saveDetailLevel(level);
        expect(await first(repo.watchDetailLevel())).toBe(level);
      }
      await repo.saveThemePreference('dark');
      expect(await first(repo.watchDetailLevel())).toBe('full');
    });

    // MM-254: the macro picture, bars or donut, remembered per person.
    it('the macro picture is bars until changed, and each choice is kept', async () => {
      expect(await first(repo.watchMacroPicture())).toBe('bars');
      for (const picture of MacroPicture.values) {
        await repo.saveMacroPicture(picture);
        expect(await first(repo.watchMacroPicture())).toBe(picture);
      }
      await repo.saveMacroPicture('donut');
      await repo.saveThemePreference('dark');
      await repo.saveDetailLevel('full');
      expect(await first(repo.watchMacroPicture()), 'other preferences leave it alone').toBe('donut');
      expect(await first(repo.watchThemePreference())).toBe('dark');
    });

    // MM-311, MM-313: both goals off until set; each set and cleared on its own.
    it('the sodium limit and the water goal are off until set, and each keeps to itself', async () => {
      const off = await first(repo.watchNutritionGoals());
      expect(off.sodiumLimitMg).toBeUndefined();
      expect(off.waterGoalMl).toBeUndefined();
      const day = CalendarDate.of(2026, 10, 1);
      await repo.saveSodiumLimit(2300, day);
      await repo.saveWaterGoal(2500);
      await repo.saveDetailLevel('full');
      let goals = await first(repo.watchNutritionGoals());
      expect(goals.sodiumLimitMg).toBe(2300);
      expect(goals.sodiumLimitSince).toBe(day);
      expect(goals.waterGoalMl).toBe(2500);
      await repo.saveSodiumLimit(undefined, day.addDays(3));
      expect((await first(repo.watchNutritionGoals())).sodiumLimitSince).toBeUndefined();
      goals = await first(repo.watchNutritionGoals());
      expect(goals.sodiumLimitMg).toBeUndefined();
      expect(goals.waterGoalMl).toBe(2500);
      expect(await first(repo.watchDetailLevel())).toBe('full');
    });

    // MM-358: the water goal is on until switched off; an amount set switches it on again, and clearing it returns to the suggestion.
    it('the water goal is switched off and on, apart from its amount', async () => {
      expect((await first(repo.watchNutritionGoals())).waterGoalOff).toBe(false);
      await repo.saveWaterGoal(3000);
      await repo.saveWaterGoalOff(true);
      let goals = await first(repo.watchNutritionGoals());
      expect(goals.waterGoalOff).toBe(true);
      expect(goals.waterGoalMl).toBe(3000);
      await repo.saveWaterGoal(undefined);
      goals = await first(repo.watchNutritionGoals());
      expect(goals.waterGoalOff).toBe(false);
      expect(goals.waterGoalMl).toBeUndefined();
    });

    it('the under-eating notice is undismissed until dismissed', async () => {
      expect(await first(repo.watchUnderEatingDismissedOn())).toBeUndefined();
      const day = CalendarDate.of(2026, 10, 5);
      await repo.saveUnderEatingDismissedOn(day);
      await repo.saveDetailLevel('full');
      expect(await first(repo.watchUnderEatingDismissedOn())).toBe(day);
      expect(await first(repo.watchDetailLevel())).toBe('full');
    });

    it('the welcome-back screen is not put off until it is', async () => {
      expect(await first(repo.watchReturnScreenDismissedOn())).toBeUndefined();
      const day = CalendarDate.of(2026, 10, 5);
      await repo.saveReturnScreenDismissedOn(day);
      await repo.saveUnderEatingDismissedOn(day.addDays(1));
      expect(await first(repo.watchReturnScreenDismissedOn())).toBe(day);
      expect(await first(repo.watchUnderEatingDismissedOn())).toBe(day.addDays(1));
    });

    it('the recovery check-in is not skipped until it is', async () => {
      expect(await first(repo.watchRecoveryCheckInSkippedOn())).toBeUndefined();
      const day = CalendarDate.of(2026, 10, 5);
      await repo.saveRecoveryCheckInSkippedOn(day);
      await repo.saveThemePreference('dark');
      expect(await first(repo.watchRecoveryCheckInSkippedOn())).toBe(day);
    });

    it('the easy-to-miss line is on and never shown until changed', async () => {
      const p = await first(repo.watchEasyToMiss());
      expect(p.enabled).toBe(true);
      expect(p.lastShown).toBeUndefined();
    });

    it('turning it off and recording a day keep each other', async () => {
      const day = CalendarDate.of(2026, 10, 5);
      await repo.markEasyToMissShown(day);
      await repo.saveEasyToMissEnabled(false);
      let p = await first(repo.watchEasyToMiss());
      expect(p.enabled).toBe(false);
      expect(p.lastShown).toBe(day);

      await repo.saveThemePreference('dark');
      await repo.saveEasyToMissEnabled(true);
      p = await first(repo.watchEasyToMiss());
      expect(p.enabled).toBe(true);
      expect(p.lastShown, 'theme and setting are separate').toBe(day);
      expect(await first(repo.watchThemePreference())).toBe('dark');
    });

    // MM-242.
    it('nobody has agreed to the terms until they do', async () => {
      expect(await first(repo.watchTermsAcceptance())).toBeUndefined();
      await repo.saveThemePreference('dark');
      expect(await first(repo.watchTermsAcceptance()), 'saving something else is not agreeing').toBeUndefined();
    });

    it('keeps the version agreed to and the day, and a later agreement replaces it', async () => {
      const day = CalendarDate.of(2026, 10, 12);
      await repo.saveTermsAcceptance(new TermsAcceptance({ version: 1, acceptedOn: day }));
      expect(await first(repo.watchTermsAcceptance())).toEqual(new TermsAcceptance({ version: 1, acceptedOn: day }));
      await repo.saveThemePreference('light');
      expect((await first(repo.watchTermsAcceptance()))?.version, 'other preferences leave it alone').toBe(1);
      await repo.saveTermsAcceptance(new TermsAcceptance({ version: 2, acceptedOn: day.addDays(30) }));
      expect(await first(repo.watchTermsAcceptance())).toEqual(
        new TermsAcceptance({ version: 2, acceptedOn: day.addDays(30) }),
      );
      expect(await first(repo.watchThemePreference())).toBe('light');
    });

    it('starts with every inline insight on (MM-364)', async () => {
      const switches = await first(repo.watchInsightSwitches());
      expect(switches.all).toBe(true);
      expect([...switches.offAreas]).toEqual([]);
      expect([...switches.offKinds]).toEqual([]);
    });

    it('keeps the inline insight switches as saved, and the rest as they were (MM-364)', async () => {
      await repo.saveThemePreference('dark');
      await repo.saveInsightSwitches({ all: false, offAreas: new Set(['training', 'food']), offKinds: new Set(['volumeJump']) });
      const switches = await first(repo.watchInsightSwitches());
      expect(switches.all).toBe(false);
      expect([...switches.offAreas].sort()).toEqual(['food', 'training']);
      expect([...switches.offKinds]).toEqual(['volumeJump']);
      expect(await first(repo.watchThemePreference())).toBe('dark');
    });

    it('emits the current choice first, then each change', async () => {
      await expectChangeEmits(repo.watchThemePreference(), {
        before: 'unselected',
        change: () => repo.saveThemePreference('dark'),
        after: 'dark',
      });
    });
  });
}
