import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-286: a destination keeps its state when the person comes back to it: a
 * fold opened, the range chosen and how far it was scrolled; and on Food
 * the floating action is the first stop after the bar, not the last.
 */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await new DemoSeed(today).replace(repos);
});

/** Opens the body fold, which starts closed (MM-676); on a return it is remembered open. */
const openBody = async () => userEvent.click(await screen.findByRole('button', { name: /^Body measurements and weigh-in/ }));

const waistHeader = async () => {
  const section = (await screen.findByRole('heading', { name: 'Waist' })).closest('.mm-section') as HTMLElement;
  return within(section).getByRole('button', { name: /^Waist/ });
};

it('a fold opened on Progress is still open after a visit to Food', async () => {
  renderApp(repos, today);
  await openTab('Progress');
  // Every fold starts closed (MM-676): the body fold first, then the waist inside it.
  await openBody();
  expect(await waistHeader()).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(await waistHeader());
  expect(await waistHeader()).toHaveAttribute('aria-expanded', 'true');
  await openTab('Food');
  await screen.findByRole('heading', { name: 'Breakfast' });
  await openTab('Progress');
  expect(await waistHeader()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('textbox', { name: /^1st waist reading/ })).toBeInTheDocument();
});

it('the range chosen on the trend survives a visit to Coach', async () => {
  renderApp(repos, today);
  await openTab('Progress');
  await openBody();
  const range = async () => within(await screen.findByRole('group', { name: 'Trend range' }));
  await userEvent.click((await range()).getByRole('button', { name: '90d' }));
  expect((await range()).getByRole('button', { name: '90d' })).toHaveAttribute('aria-pressed', 'true');
  await openTab('Coach');
  await screen.findByRole('heading', { level: 1, name: 'Coach' });
  await openTab('Progress');
  expect((await range()).getByRole('button', { name: '90d' })).toHaveAttribute('aria-pressed', 'true');
  expect((await range()).getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'false');
});

it('how far a destination was scrolled is kept and put back on return', async () => {
  const { repos: stores } = renderApp(repos, today);
  await openTab('Progress');
  await openBody();
  await screen.findByText(/^Trend weight/);
  const body = document.querySelector('main.app-body') as HTMLElement;
  // The test browser lays nothing out: the body is given a height to scroll in.
  Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 3000 });
  Object.defineProperty(body, 'clientHeight', { configurable: true, value: 800 });
  body.scrollTop = 640;
  await openTab('Food');
  await screen.findByRole('heading', { name: 'Breakfast' });
  expect(body.scrollTop).toBe(0);
  await openTab('Progress');
  await screen.findByText(/^Trend weight/);
  expect(body.scrollTop).toBe(640);
  expect(stores).toBe(repos);
});

it('the scroll is kept when a destination is left through a row, not only the bar (the WS-03 panel\'s PD7)', async () => {
  renderApp(repos, today);
  const row = await screen.findByRole('button', { name: /^Trend / });
  const body = document.querySelector('main.app-body') as HTMLElement;
  Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 3000 });
  Object.defineProperty(body, 'clientHeight', { configurable: true, value: 800 });
  body.scrollTop = 420;
  body.dispatchEvent(new Event('scroll'));
  await userEvent.click(row);
  await screen.findByText(/^Trend weight/);
  await openTab('Dashboard');
  await screen.findByRole('button', { name: /^Trend / });
  expect(body.scrollTop).toBe(420);
});
