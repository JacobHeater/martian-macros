import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { AdherenceSummary } from '../../src/engine/AdherenceSummary';
import type { IntakeStanding } from '../../src/engine/IntakeStanding';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { adherenceLines } from '../../src/format/adherenceLines';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-149: the week described as facts, never scored. Carried over from adherence_summary_test.dart. */
const today = CalendarDate.of(2026, 10, 5);

const summary = ({
  logged = 6,
  complete = 5,
  intake = 2180,
  target = 2100,
  standing = 'onTarget',
  estimated = false,
}: {
  logged?: number;
  complete?: number;
  intake?: number | undefined;
  target?: number | undefined;
  standing?: IntakeStanding | undefined;
  estimated?: boolean;
} = {}) =>
  new AdherenceSummary({
    from: today.addDays(-7),
    to: today.addDays(-1),
    daysLogged: logged,
    completeDays: complete,
    weighIns: 6,
    averageIntakeKcal: intake,
    averageTargetKcal: target,
    standing,
    proteinDays: 4,
    mostlyEstimated: estimated,
  });

const intakeLine = (s: AdherenceSummary) =>
  adherenceLines(s, { floorKcal: 1500 }).find((line) => line.label === 'Average intake') ?? { label: '', value: '' };

it('a typical week states each fact: a figure, and what it is measured against under it (MM-342)', () => {
  expect(adherenceLines(summary(), { floorKcal: 1500 })).toEqual([
    { label: 'Days logged', value: '6', detail: '5 complete' },
    { label: 'Weigh-ins', value: '6' },
    { label: 'Average intake', value: '2,180 kcal', detail: 'against a 2,100 kcal target: on target' },
    { label: 'Protein minimum met', value: '4 of 5 days' },
  ]);
});

// MM-113, MM-510: on a weight-loss medication the protein-minimum days are the first line; otherwise the last.
it('on a weight-loss medication, the protein-minimum days lead the week', () => {
  const lines = adherenceLines(summary(), { floorKcal: 1500, weightLossMedication: true });
  expect(lines[0]).toEqual({ label: 'Protein minimum met', value: '4 of 5 days' });
  expect(lines.map((line) => line.label)).toEqual(['Protein minimum met', 'Days logged', 'Weigh-ins', 'Average intake']);
  expect(adherenceLines(summary(), { floorKcal: 1500 }).at(-1)?.label).toBe('Protein minimum met');
});

it('over and under read the same apart from the direction', () => {
  expect(intakeLine(summary({ intake: 2350, standing: 'above' }))).toEqual({ label: 'Average intake', value: '2,350 kcal', detail: 'against a 2,100 kcal target: 250 over' });
  expect(intakeLine(summary({ intake: 1850, standing: 'below' }))).toEqual({ label: 'Average intake', value: '1,850 kcal', detail: 'against a 2,100 kcal target: 250 under' });
});

it('below the floor is never on target or under target', () => {
  const line = intakeLine(summary({ intake: 1050, target: 1900, standing: 'belowFloor' }));
  expect(line.detail).toContain("below the app's minimum of 1,500");
  expect(line.detail).not.toContain('on target');
  expect(line.detail).not.toContain('under');
});

it('few days and estimates are said in the detail, and the figure stays a figure', () => {
  expect(intakeLine(summary({ complete: 2 })).detail).toMatch(/rests on 2 days$/);
  expect(intakeLine(summary({ estimated: true })).detail).toMatch(/mostly estimated$/);
  expect(intakeLine(summary({ complete: 2 })).value).toBe('2,180 kcal');
});

it('the week\'s workouts are the fifth fact once the training log is read, and left out when it is not (MM-149)', () => {
  const s = summary();
  expect(adherenceLines(s, { floorKcal: 1500 }).find((line) => line.label === 'Workouts')).toBeUndefined();
  const withWorkouts = new AdherenceSummary({ ...s, workouts: 3 });
  expect(adherenceLines(withWorkouts, { floorKcal: 1500 }).find((line) => line.label === 'Workouts')).toEqual({ label: 'Workouts', value: '3' });
});

it('an average below the floor points to the notice about those days while it is showing (MM-114, MM-149)', () => {
  const low = summary({ intake: 1050, target: 1900, standing: 'belowFloor' });
  expect(adherenceLines(low, { floorKcal: 1500, underEatingNotice: true }).find((line) => line.label === 'Average intake')?.detail).toMatch(
    /below the app's minimum of 1,500; see the notice about your logged days/,
  );
  expect(adherenceLines(low, { floorKcal: 1500 }).find((line) => line.label === 'Average intake')?.detail).not.toMatch(/see the notice/);
});

it('no percentage, grade or score anywhere', () => {
  for (const s of [
    summary(),
    summary({ intake: 2350, standing: 'above' }),
    summary({ logged: 0, complete: 0, intake: undefined, standing: undefined }),
  ]) {
    const all = adherenceLines(s, { floorKcal: 1500 })
      .map(({ label, value, detail }) => `${label} ${value} ${detail ?? ''}`)
      .join(' ')
      .toLowerCase();
    for (const word of ['%', 'score', 'grade', 'adherence', 'great', 'good']) expect(all, word).not.toContain(word);
  }
});

it('the Coach screen shows the card from stored days', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  for (let i = 1; i <= 7; i++) {
    const day = today.addDays(-i);
    await repos.weights.saveWeight(day, 82);
    if (i <= 5) {
      await repos.food.addFood(foodOn(day, { kcal: 2100, proteinG: 150, carbsG: 220, fatG: 70 }));
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
  }
  await repos.weights.saveWeight(today, 82);
  renderApp(repos, today);
  await openTab('Coach');
  const card = (await screen.findByRole('heading', { name: 'Your last 7 days' })).closest('.mm-section');
  expect(card).toHaveTextContent(/Days logged\s*5\s*all complete/);
  expect(card).toHaveTextContent(/Weigh-ins\s*7/);
  expect(card).toHaveTextContent('2,100 kcal');
});
