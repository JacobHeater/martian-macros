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
  target?: number;
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
  adherenceLines(s, { floorKcal: 1500 }).find(([label]) => label === 'Average intake')?.[1] ?? '';

it('a typical week states each fact', () => {
  expect(adherenceLines(summary(), { floorKcal: 1500 })).toEqual([
    ['Days logged', '6, 5 complete'],
    ['Weigh-ins', '6'],
    ['Average intake', '2,180 kcal against 2,100: on target'],
    ['Protein minimum met', '4 of 5 days'],
  ]);
});

it('over and under read the same apart from the direction', () => {
  expect(intakeLine(summary({ intake: 2350, standing: 'above' }))).toBe('2,350 kcal against 2,100: 250 over');
  expect(intakeLine(summary({ intake: 1850, standing: 'below' }))).toBe('1,850 kcal against 2,100: 250 under');
});

it('below the floor is never on target or under target', () => {
  const line = intakeLine(summary({ intake: 1050, target: 1900, standing: 'belowFloor' }));
  expect(line).toContain("below the app's minimum of 1,500");
  expect(line).not.toContain('on target');
  expect(line).not.toContain('under');
});

it('few days and estimates are said', () => {
  expect(intakeLine(summary({ complete: 2 }))).toMatch(/rests on 2 days$/);
  expect(intakeLine(summary({ estimated: true }))).toMatch(/mostly estimated$/);
});

it('no percentage, grade or score anywhere', () => {
  for (const s of [
    summary(),
    summary({ intake: 2350, standing: 'above' }),
    summary({ logged: 0, complete: 0, intake: undefined, standing: undefined }),
  ]) {
    const all = adherenceLines(s, { floorKcal: 1500 })
      .map(([label, value]) => `${label} ${value}`)
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
  const card = (await screen.findByRole('heading', { name: 'Your last 7 days' })).closest('.mm-surface');
  expect(card).toHaveTextContent('5, all complete');
  expect(card).toHaveTextContent(/Weigh-ins\s*7/);
  expect(card).toHaveTextContent('2,100 kcal');
});
