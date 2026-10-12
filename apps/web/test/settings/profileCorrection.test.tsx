import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import type { BiologicalSex } from '../../src/domain/BiologicalSex';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { giveDate, openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';

/** MM-83: correct the profile or the health check without losing data. Carried over from profile_correction_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed({
  sex = 'male',
  screening = new ScreeningAnswers(),
  mode = 'fatLoss',
}: { sex?: BiologicalSex; screening?: ScreeningAnswers; mode?: GoalMode } = {}): Promise<void> {
  await repos.setup.saveSetup(
    typicalSetup({ sex, screening, goalMode: mode, onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }),
  );
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 80);
  await repos.food.addFood(
    foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 45, carbsG: 60, fatG: 10 }),
  );
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-2), {
      mode,
      tdeeKcal: 2800,
      tdeeSigmaKcal: 250,
      tdeeStatus: 'updated',
      kcal: mode === 'maintenance' ? 2800 : 2300,
      weeklyRateFraction: mode === 'maintenance' ? 0 : -0.0075,
    }),
  );
}

async function open() {
  renderApp(repos, today);
  return openSettings();
}

const history = () => first(repos.targets.watchTargetsHistory());
const setup = async () => {
  const stored = await repos.setup.loadSetup();
  if (stored === undefined) throw new Error('No setup is stored.');
  return stored;
};
const back = () => userEvent.click(within(topLayer()).getByRole('button', { name: 'Back' }));

async function openHealthCheck(settings: Awaited<ReturnType<typeof open>>): Promise<void> {
  await userEvent.click(settings.getByRole('button', { name: /^Health check/ }));
  await within(topLayer()).findByRole('heading', { name: 'Health check' });
}

it('correcting sex recalculates at once and keeps the data', async () => {
  await seed();
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Biological sex/ }));
  const question = await screen.findByRole('dialog', { name: 'Change biological sex?' });
  expect(within(question).getByText(/food log and weigh-ins are kept/)).toBeInTheDocument();
  await userEvent.click(within(question).getByRole('button', { name: 'Change' }));
  await expect.poll(async () => (await setup()).profile.sex).toBe('female');
  expect((await setup()).profileRevision).toBe(1);
  // New targets were issued at once.
  await expect.poll(async () => (await history()).length).toBe(2);
  expect((await history())[1]?.effectiveFrom).toBe(today);
  expect(await first(repos.weights.watchWeights())).toHaveLength(21);
  expect(await first(repos.food.watchFood(today))).toHaveLength(1);
});

it('cancelling the sex change changes nothing', async () => {
  await seed();
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Biological sex/ }));
  const question = await screen.findByRole('dialog', { name: 'Change biological sex?' });
  await userEvent.click(within(question).getByRole('button', { name: 'Cancel' }));
  expect((await setup()).profile.sex).toBe('male');
  expect((await setup()).profileRevision).toBe(0);
});

it('changing to male clears the female-only answers', async () => {
  await seed({
    sex: 'female',
    screening: new ScreeningAnswers({ breastfeeding: true, eatingDisorderHistory: true }),
    mode: 'maintenance',
  });
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Biological sex/ }));
  const question = await screen.findByRole('dialog', { name: 'Change biological sex?' });
  expect(within(question).getByText(/Female-only health answers are cleared\./)).toBeInTheDocument();
  await userEvent.click(within(question).getByRole('button', { name: 'Change' }));
  await expect.poll(async () => (await setup()).profile.sex).toBe('male');
  expect((await setup()).screening.breastfeeding).toBe(false);
  expect((await setup()).screening.eatingDisorderHistory).toBe(true);
});

it('becoming pregnant makes the goal maintenance at once', async () => {
  await seed({ sex: 'female' });
  const settings = await open();
  await openHealthCheck(settings);
  await userEvent.click(within(topLayer()).getByRole('checkbox', { name: 'Pregnant' }));
  await expect.poll(async () => (await setup()).goalMode, { timeout: 5000 }).toBe('maintenance');
  expect((await setup()).screening.pregnant).toBe(true);
  await expect.poll(async () => (await history()).at(-1)?.mode).toBe('maintenance');
  const last = (await history()).at(-1);
  expect(last?.targets.weeklyRateFraction).toBe(0);
  expect(last?.targets.flags.has('modeNotAllowed')).toBe(true);
});

it('new screening answers can be changed in Settings', async () => {
  await seed();
  const settings = await open();
  await openHealthCheck(settings);
  await userEvent.click(
    within(topLayer()).getByRole('checkbox', { name: 'A medication I take can change my weight or water retention' }),
  );
  await expect.poll(async () => (await setup()).screening.weightAffectingMedication).toBe(true);
  expect((await setup()).profileRevision).toBe(1);
  expect((await setup()).healthCheckConfirmedOn).toBe(today);
});

it('no longer breastfeeding removes the 400 kcal and offers every goal again', async () => {
  await seed({ sex: 'female', screening: new ScreeningAnswers({ breastfeeding: true }), mode: 'maintenance' });
  const settings = await open();
  await openHealthCheck(settings);
  await userEvent.click(within(topLayer()).getByRole('checkbox', { name: 'Breastfeeding' }));
  await expect.poll(async () => (await history()).length).toBe(2);
  const last = (await history())[1];
  expect(last?.effectiveFrom).toBe(today);
  expect(last?.targets.flags.has('modeNotAllowed')).toBe(false);
  expect((await setup()).screening.breastfeeding).toBe(false);

  // Every goal is offered again.
  await back();
  await back();
  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: 'Change' }));
  const goals = await screen.findByRole('dialog', { name: 'Choose a goal' });
  for (const label of ['Fat loss', 'Recomp', 'Lean gain', 'Maintenance']) {
    expect(within(goals).getByRole('button', { name: new RegExp(`^${label}`) }), label).toBeInTheDocument();
  }
});

it('a date of birth that makes the user under 18 stops coaching', async () => {
  await seed();
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Date of birth/ }));
  await giveDate('2012-01-01');
  // Back out of Settings.
  await expect.poll(async () => (await setup()).profile.birthDate.year).toBe(2012);
  await back();
  expect(await screen.findByRole('heading', { name: 'Martian Macros is for adults' })).toBeInTheDocument();
});

it('height can be corrected', async () => {
  await seed();
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Height/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Height' }));
  await userEvent.clear(sheet.getByRole('textbox', { name: 'Feet' }));
  await userEvent.type(sheet.getByRole('textbox', { name: 'Feet' }), '6');
  await userEvent.clear(sheet.getByRole('textbox', { name: 'Inches' }));
  await userEvent.type(sheet.getByRole('textbox', { name: 'Inches' }), '2');
  await userEvent.click(sheet.getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await setup()).profileRevision).toBe(1);
  expectClose((await setup()).profile.heightCm, 187.96, 0.1);
  expect(await settings.findByText('6′ 2″')).toBeInTheDocument();
});

it('an implausible height cannot be saved', async () => {
  await seed();
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: /^Height/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Height' }));
  await userEvent.clear(sheet.getByRole('textbox', { name: 'Feet' }));
  await userEvent.type(sheet.getByRole('textbox', { name: 'Feet' }), '2');
  await userEvent.clear(sheet.getByRole('textbox', { name: 'Inches' }));
  await userEvent.type(sheet.getByRole('textbox', { name: 'Inches' }), '0');
  expect(sheet.getByRole('button', { name: 'Save' })).toBeDisabled();
});
