import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { DayCompleteness } from '../../src/domain/DayCompleteness';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { underEatingText } from '../../src/format/underEatingText';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { dashboardLoaded } from '../support/dashboardLoaded';

/**
 * MM-114: one neutral notice when logged days sit far below the floor.
 * Carried over from under_eating_notice_test.dart; what the Food screen
 * does about a very low day is with the Food screen's tests.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function logDays(count: number, kcal: number, mark: DayCompleteness = 'complete'): Promise<void> {
  for (let i = 1; i <= count; i++) {
    const day = today.addDays(-i);
    await repos.food.addFood(foodOn(day, { name: 'Food', kcal, proteinG: 80, carbsG: 100, fatG: 30 }));
    await repos.dayMarks.setCompleteness(day, mark);
  }
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const notice = () => screen.queryByText('About your logged days');

async function open(day: CalendarDate = today) {
  const view = renderApp(repos, day);
  await dashboardLoaded();
  return view;
}

it('sustained low intake shows the notice with both figures', async () => {
  await logDays(9, 1050);
  await open();
  expect(notice()).toBeInTheDocument();
  expect(screen.getByText(/average 1,050 kcal/)).toBeInTheDocument();
  expect(screen.getByText(/would ever suggest for you is/)).toBeInTheDocument();
  await openTab('Coach');
  await screen.findByRole('heading', { name: 'Body' });
  expect(notice()).toBeInTheDocument();
});

it('days marked partial raise no notice', async () => {
  await logDays(9, 1050, 'partial');
  await open();
  expect(notice()).not.toBeInTheDocument();
});

it('too few days, or days at target, raise no notice', async () => {
  await logDays(4, 1000);
  await open();
  expect(notice()).not.toBeInTheDocument();
});

it('one tap marks those days partial, and the notice goes', async () => {
  await logDays(9, 1050);
  await open();
  await userEvent.click(screen.getByRole('button', { name: 'Mark those days partial' }));
  await expect.poll(notice).toBeNull();
  expect(await first(repos.dayMarks.watchCompleteness(today.addDays(-3)))).toBe('partial');
});

it('dismissed, it is not shown again five days later', async () => {
  await logDays(9, 1050);
  const view = await open();
  await userEvent.click(screen.getByRole('button', { name: 'They are complete' }));
  await expect.poll(notice).toBeNull();
  view.unmount();
  await open(today.addDays(5));
  expect(notice()).not.toBeInTheDocument();
});

it('the words praise nothing and diagnose nobody', () => {
  const finding = { averageKcal: 1050, floorKcal: 1500, days: 9, lowDays: [] };
  const plain = underEatingText(finding, { supportLine: false }).toLowerCase();
  for (const word of ['great', 'well done', 'good job', 'nice', 'disorder', 'anorexi', 'warning', 'dangerous']) {
    expect(plain, word).not.toContain(word);
  }
  expect(plain).toContain('mark them partial');
  expect(plain.indexOf('missing food')).toBeLessThan(plain.indexOf('complete'));
  expect(underEatingText(finding, { supportLine: true })).toContain('a doctor or a registered dietitian');
  expect(plain).not.toContain('dietitian');
});
