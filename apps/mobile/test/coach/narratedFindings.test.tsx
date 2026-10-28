import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryCoachNarrator } from '../../src/fixtures/InMemoryCoachNarrator';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { analysisFatWeekScenario } from '../../src/gallery/screens/analysisFatWeekScenario';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';

/**
 * MM-672: each finding of "Coach's feedback" is said in the person's own
 * model's words when one answers, and in the built-in coach's when it does
 * not. The title and "The numbers behind this" are the built-in coach's
 * either way.
 */
const today = CalendarDate.of(2026, 10, 24);
const modelWords = 'Fat ran 90 g against 70 g, and peanut butter is the reason. Halve the peanut butter at breakfast this week and log the jar’s weight, not a spoon.';

async function onCoach(narrator: InMemoryCoachNarrator) {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await analysisFatWeekScenario()(repos, today);
  renderApp(repos, today, {
    change: (services) => {
      void services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
      return { ...services, coachNarrator: narrator };
    },
  });
  await openCoach();
  const section = within(await screen.findByRole('region', { name: 'Coach’s feedback' }, { timeout: 5000 }));
  // The fat finding is the top fix over 2w, as the owner's fat week reads (MM-617).
  await userEvent.click(await section.findByRole('button', { name: '2w' }));
  return section;
}

it('says a finding in the model’s words once it answers, under the built-in title, with the numbers behind it', async () => {
  const narrator = new InMemoryCoachNarrator().answer('finding:fatAgainstTarget', modelWords);
  const section = await onCoach(narrator);
  expect(await section.findByText(modelWords, {}, { timeout: 5000 })).toBeInTheDocument();
  expect(section.getByRole('heading', { name: /^Fat averaged/ })).toBeInTheDocument();
  expect(section.getByRole('button', { name: /^The numbers behind this: Fat averaged/ })).toBeInTheDocument();
  const asked = narrator.requests.filter((request) => request.cacheKey.startsWith('finding:'));
  expect(asked.length).toBeGreaterThan(0);
  expect(asked.every((request) => request.fallbackText.length > 0)).toBe(true);
});

it('shows the wait under the title while the model writes (MM-673), never the built-in sentence first', async () => {
  const narrator = new InMemoryCoachNarrator();
  narrator.pending = true;
  const section = await onCoach(narrator);
  await section.findByRole('heading', { name: /^Fat averaged/ });
  expect((await section.findAllByRole('status')).some((status) => status.textContent?.includes('The coach is writing…'))).toBe(true);
  const fat = narrator.requests.find((request) => request.cacheKey.startsWith('finding:fatAgainstTarget'));
  expect(fat).toBeDefined();
  expect(section.queryByText(fat!.fallbackText)).toBeNull();
});

it('keeps the built-in sentence when the model does not answer', async () => {
  const narrator = new InMemoryCoachNarrator();
  narrator.outcome = { kind: 'refused', status: 503, detail: 'busy' };
  const section = await onCoach(narrator);
  await section.findByRole('heading', { name: /^Fat averaged/ });
  expect(section.queryByText(modelWords)).toBeNull();
  const fat = narrator.requests.find((request) => request.cacheKey.startsWith('finding:fatAgainstTarget'));
  expect(fat).toBeDefined();
  expect(section.getByText(fat!.fallbackText)).toBeInTheDocument();
});
