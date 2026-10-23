import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-257 and MM-285: weight events are rows with an icon and the day in
 * the app's words, the add action is in the section header, and the sheet
 * has no default event, so travel is never recorded as an illness.
 */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function openProgress(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Progress');
  // Folded to its line (MM-578): opened here, as a person would.
  const header = await screen.findByRole('button', { name: /^Weight events/ });
  await userEvent.click(header);
  return header.closest('.mm-section') as HTMLElement;
}

it('rows say the event and its day in words, newest first, each with its icon', async () => {
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-1), type: 'illness' });
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-5), type: 'travel' });
  const section = await openProgress();
  const rows = within(section).getAllByText(/^(Illness|Travel)$/).map((title) => title.closest('.mm-list-row') as HTMLElement);
  expect(rows.map((row) => row.querySelector('.mm-list-row-title')?.textContent)).toEqual(['Illness', 'Travel']);
  expect(rows[0]).toHaveTextContent(/^Illness\s*Yesterday · /);
  expect(rows[1]).toHaveTextContent('Thu, Oct 8 ·');
  expect(section.textContent).not.toContain('2026-10-');
  for (const row of rows) expect(row.querySelector('.mm-list-row-leading svg')).not.toBeNull();
});

it('with none, the section is one sentence', async () => {
  const section = await openProgress();
  expect(section.querySelectorAll('.mm-list-row')).toHaveLength(0);
  expect(within(section).getByText(/^No weight events yet\. Note illness, travel/)).toBeInTheDocument();
});

it('the sheet starts with no event chosen and cannot save until one is', async () => {
  const section = await openProgress();
  await userEvent.click(within(section).getByRole('button', { name: 'Add a weight event' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add a weight event' });
  expect(within(sheet).getByRole('button', { name: /^Event Choose an event/ })).toBeInTheDocument();
  expect(within(sheet).getByText('Today')).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Save event' })).toBeDisabled();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Event/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Travel' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Save event' }));
  await expect.poll(async () => (await first(repos.weightEvents.watchWeightEvents())).map((e) => e.type)).toEqual(['travel']);
});
