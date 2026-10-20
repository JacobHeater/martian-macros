import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-289: the register judges the direction's marks on the demo scenario, so
 * the seed shows them: the Food screen has at least three method icons
 * (MM-255) among its entries, and Train shows a workout with the record mark
 * (MM-258) beside workouts without one.
 */
const today = CalendarDate.of(2026, 10, 13);

async function demo(): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await new DemoSeed(today).replace(repos);
  return repos;
}

it('the Food screen of the demo shows at least three different method icons', async () => {
  renderApp(await demo(), today);
  await openTab('Food');
  await screen.findByText('Demo oats and yogurt');
  const methods = new Set([...document.querySelectorAll('.food-entry-method')].map((icon) => icon.getAttribute('aria-label')));
  expect(methods.size).toBeGreaterThanOrEqual(3);
});

it('the Train screen of the demo shows a row with the record mark and a row without', async () => {
  renderApp(await demo(), today);
  await openTab('Train');
  await screen.findByRole('button', { name: 'Start workout' });
  const rows = [...document.querySelectorAll('.mm-section .mm-list-row')].filter((row) => /\d+ exercises/.test(row.textContent ?? ''));
  expect(rows.length).toBeGreaterThan(3);
  const marked = rows.filter((row) => row.querySelector('.train-record') !== null);
  expect(marked.length).toBeGreaterThan(0);
  expect(marked.length).toBeLessThan(rows.length);
  // The mark says what it is, beside the words of the row.
  expect(marked[0]?.textContent).toMatch(/personal record/);
});
