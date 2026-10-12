import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { SetupRepository } from '../../src/domain/repositories/SetupRepository';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import type { UserSetup } from '../../src/domain/UserSetup';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `SetupRepository` must do. */
export function setupRepositoryContract(name: string, create: () => SetupRepository | Promise<SetupRepository>): void {
  describe(`${name} as a SetupRepository`, () => {
    let repo: SetupRepository;
    beforeEach(async () => {
      repo = await create();
    });

    const loaded = async (): Promise<UserSetup> => {
      const setup = await repo.loadSetup();
      if (setup === undefined) throw new Error('No setup was loaded.');
      return setup;
    };

    it('has no setup before onboarding', async () => {
      expect(await repo.loadSetup()).toBeUndefined();
      expect(await first(repo.watchSetup())).toBeUndefined();
    });

    it('stores and returns every field, including sex', async () => {
      const saved = typicalSetup({ sex: 'female' });
      await repo.saveSetup(saved);
      const back = await loaded();
      expect(back.profile.sex).toBe('female');
      expect(back.profile.heightCm).toBe(saved.profile.heightCm);
      expect(back.profile.birthDate.epochDay).toBe(saved.profile.birthDate.epochDay);
      expect(back.goalMode).toBe(saved.goalMode);
      expect(back.trainingStatus).toBe(saved.trainingStatus);
      expect(back.trainingDaysPerWeek).toBe(saved.trainingDaysPerWeek);
      expect(back.unitSystem).toBe(saved.unitSystem);
      expect(back.onboardedOn.epochDay).toBe(saved.onboardedOn.epochDay);
      expect(back.screening.pregnant).toBe(false);
      expect(back.creatineStartedOn).toBeUndefined();
    });

    it('keeps the maintenance week and the answered day', async () => {
      const day = CalendarDate.of(2026, 10, 5);
      await repo.saveSetup(typicalSetup());
      expect((await loaded()).maintenanceWeekFrom).toBeUndefined();
      expect((await loaded()).reliefAnsweredOn).toBeUndefined();
      await repo.saveSetup(typicalSetup().copyWith({ maintenanceWeekFrom: day, reliefAnsweredOn: day.addDays(1) }));
      const back = await loaded();
      expect(back.maintenanceWeekFrom).toBe(day);
      expect(back.reliefAnsweredOn).toBe(day.addDays(1));
    });

    it('keeps the creatine start date', async () => {
      const startedOn = CalendarDate.of(2026, 1, 1);
      await repo.saveSetup(typicalSetup().copyWith({ creatineStartedOn: startedOn }));
      expect((await loaded()).creatineStartedOn).toBe(startedOn);
      await repo.saveSetup(typicalSetup().copyWith({ creatineStartedOn: undefined }));
      expect((await loaded()).creatineStartedOn).toBeUndefined();
    });

    it('keeps daily activity, and a new setup defaults to light', async () => {
      await repo.saveSetup(typicalSetup({ dailyActivity: 'onFeet' }));
      expect((await loaded()).dailyActivity).toBe('onFeet');
      await repo.saveSetup(typicalSetup());
      expect((await loaded()).dailyActivity).toBe('light');
    });

    it('keeps the profile revision', async () => {
      await repo.saveSetup(typicalSetup().copyWith({ profileRevision: 3 }));
      expect((await loaded()).profileRevision).toBe(3);
      await repo.saveSetup(typicalSetup());
      expect((await loaded()).profileRevision).toBe(0);
    });

    it('keeps screening answers', async () => {
      await repo.saveSetup(typicalSetup({ screening: new ScreeningAnswers({ eatingDisorderHistory: true }) }));
      const back = await loaded();
      expect(back.screening.eatingDisorderHistory).toBe(true);
      expect(back.screening.pcos).toBe(false);
    });

    it('there is only one setup: saving replaces it', async () => {
      await repo.saveSetup(typicalSetup({ goalMode: 'fatLoss' }));
      await repo.saveSetup(typicalSetup({ goalMode: 'maintenance' }));
      expect((await loaded()).goalMode).toBe('maintenance');
    });

    it('emits nothing first, then the saved setup', async () => {
      await expectChangeEmits(repo.watchSetup(), {
        see: (s) => s?.goalMode,
        before: undefined,
        change: () => repo.saveSetup(typicalSetup({ goalMode: 'recomp' })),
        after: 'recomp',
      });
    });
  });
}
