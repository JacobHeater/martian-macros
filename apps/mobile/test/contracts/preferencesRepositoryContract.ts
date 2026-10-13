import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DetailLevel } from '../../src/domain/food/detail/DetailLevel';
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

    it('emits the current choice first, then each change', async () => {
      await expectChangeEmits(repo.watchThemePreference(), {
        before: 'unselected',
        change: () => repo.saveThemePreference('dark'),
        after: 'dark',
      });
    });
  });
}
