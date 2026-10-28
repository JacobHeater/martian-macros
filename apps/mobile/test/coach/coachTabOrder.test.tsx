import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openCoach } from '../support/openCoach';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-676: one paradigm on the Coach tab. The hero and the Executive summary are the only cards; everything under
 * them is a fold with a line under its title, in the owner's order: goal, feedback, body measurements and
 * weigh-in, targets, heads up, then the rest.
 */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
});

const body = () => document.querySelector('.app-body') as HTMLElement;

it('orders the tab: hero, summary, goal, feedback, body, targets, then the rest, every fold closed', async () => {
  renderApp(repos, today);
  await openTab('Coach');
  await screen.findByRole('heading', { name: 'Executive summary' });
  await screen.findByRole('heading', { name: 'Goal' });
  expect(body().querySelectorAll(':scope > .mm-section button[aria-expanded="true"]')).toHaveLength(0);
  const titles = [...body().querySelectorAll('.mm-section-title')].map((title) => title.textContent);
  const wanted = ['Executive summary', 'Goal', 'Coach’s feedback', 'Body measurements and weigh-in', 'Your targets', 'Your metabolism'];
  const at = wanted.map((title) => titles.indexOf(title));
  expect(at.every((index) => index >= 0), titles.join(' | ')).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
  expect(body().querySelector('.mm-hero')).not.toBeNull();
});

it('has no card but the hero and the summary: every other section folds, with a line under its title', async () => {
  renderApp(repos, today);
  await openCoach();
  await screen.findByRole('heading', { name: 'Executive summary' });
  const framed = [...body().querySelectorAll(':scope > .mm-section-framed')].map((section) => section.querySelector('.mm-section-title')?.textContent);
  expect(framed).toEqual(['Executive summary']);
  expect(body().querySelectorAll(':scope > .mm-surface')).toHaveLength(0);
  for (const title of ['Goal', 'Coach’s feedback', 'Body measurements and weigh-in', 'Your targets']) {
    const heading = screen.getByRole('heading', { name: title });
    const section = heading.closest('.mm-section') as HTMLElement;
    expect(section.querySelector('button[aria-expanded]'), title).not.toBeNull();
    expect(section.querySelector('.mm-section-summary')?.textContent, title).toBeTruthy();
  }
  // The weigh-in and the trend live inside the body fold, on their surface there as the waist chart is (MM-291).
  const weighIn = screen.getByRole('heading', { name: 'Today’s weigh-in' });
  expect(weighIn.closest('.mm-section')?.querySelector('.mm-section-title')?.textContent).toBe('Body measurements and weigh-in');
});
