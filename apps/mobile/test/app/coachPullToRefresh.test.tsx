import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-670: the Coach tab pulled down from its top refreshes; the other destinations do not pull. */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
});

function pull(body: HTMLElement) {
  fireEvent.pointerDown(body, { clientX: 100, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(body, { clientX: 100, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(body, { clientX: 100, clientY: 300, pointerId: 1 });
  fireEvent.pointerUp(body, { clientX: 100, clientY: 300, pointerId: 1 });
}

const body = () => document.querySelector('.app-body') as HTMLElement;
const strip = () => body().querySelector('.mm-pull') as HTMLElement;

it('MM-670: Coach pulled down from its top says it is refreshing, then settles', async () => {
  renderApp(repos, today);
  await openTab('Coach');
  await screen.findByRole('heading', { name: 'Executive summary' });
  pull(body());
  expect(strip().dataset['phase']).toBe('refreshing');
  expect(strip()).toHaveTextContent('Refreshing…');
  await waitFor(() => expect(strip().dataset['phase']).toBe('idle'), { timeout: 3000 });
});

it('MM-670: the Dashboard does not pull', async () => {
  renderApp(repos, today);
  await screen.findByRole('button', { name: 'Menu' });
  pull(body());
  expect(strip().dataset['phase']).toBe('idle');
});
