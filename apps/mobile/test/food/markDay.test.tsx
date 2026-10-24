import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-611: a day marked a Refeed or a Day off from the Food day's header, shown as a neutral chip and kept. */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 400, proteinG: 14, carbsG: 60, fatG: 8 }));
});

const chip = (label: string) => screen.queryByText(label, { selector: '.mm-chip-status' });

async function choose(answer: string): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'Mark day' }));
  const options = await screen.findByRole('dialog', { name: 'Mark this day' });
  expect(within(options).getAllByRole('option').map((o) => o.textContent)).toEqual([
    expect.stringContaining('Refeed'),
    expect.stringContaining('Day off'),
    expect.stringContaining('No mark'),
  ]);
  await userEvent.click(within(options).getByRole('option', { name: new RegExp(`^${answer}`) }));
}

it('marking 18 Oct a Refeed shows the chip, and the mark survives a restart', async () => {
  renderApp(repos, today);
  await openTab('Food');
  expect(chip('Refeed')).toBeNull();
  await choose('Refeed');
  expect(await screen.findByText('Refeed', { selector: '.mm-chip-status' })).toBeInTheDocument();
  await expect.poll(() => first(repos.dayKinds.watchDayKind(today))).toBe('refeed');
  // The mark is separate from completeness: the day is still not marked complete or partial.
  expect(await first(repos.dayMarks.watchCompleteness(today))).toBe('unmarked');
  cleanup();

  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('Refeed', { selector: '.mm-chip-status' })).toBeInTheDocument();
});

it('clearing a Day off takes the chip away', async () => {
  await repos.dayKinds.setDayKind(today, 'dayOff');
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('Day off', { selector: '.mm-chip-status' })).toBeInTheDocument();
  await choose('No mark');
  await expect.poll(() => chip('Day off')).toBeNull();
  await expect.poll(() => first(repos.dayKinds.watchDayKind(today))).toBe('none');
});

it('a day before today can be marked from its own header', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await choose('Day off');
  expect(await screen.findByText('Day off', { selector: '.mm-chip-status' })).toBeInTheDocument();
  await expect.poll(() => first(repos.dayKinds.watchDayKind(today.addDays(-1)))).toBe('dayOff');
  expect(await first(repos.dayKinds.watchDayKind(today))).toBe('none');
});

it('tomorrow cannot be marked: there is no step past today to reach it', async () => {
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByRole('button', { name: 'Mark day' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Next day' })).toBeNull();
});
