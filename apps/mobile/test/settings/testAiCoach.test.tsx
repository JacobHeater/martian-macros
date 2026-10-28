import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachAiStore } from '../../src/domain/integration/CoachAiStore';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryCoachNarrator } from '../../src/fixtures/InMemoryCoachNarrator';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-671: "Test AI coach" beside "Save key" asks the person's own model for
 * the coach's words on today's brief and shows them, or the one reason there
 * are none, so a key that does nothing is found out in Settings rather than
 * by the coach's silence.
 */
const today = CalendarDate.of(2026, 10, 13);
const words = 'Logged 1,820 kcal of 2,400 today with 112 g protein; 580 kcal and 58 g protein remain. Over 7 days you held the calorie band on 4 and the protein floor on 3.';
let repos: InMemoryRepositories;
let narrator: InMemoryCoachNarrator;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
  narrator = new InMemoryCoachNarrator().answer('exec:', words);
});

let coachAi: CoachAiStore;

async function coachSettings() {
  renderApp(repos, today, {
    change: (services) => {
      coachAi = services.coachAi;
      void coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
      return { ...services, coachNarrator: narrator };
    },
  });
  return openSettings();
}

it('shows the model’s words on the person’s numbers', async () => {
  const settings = await coachSettings();
  await userEvent.click(await settings.findByRole('button', { name: 'Test AI coach' }));
  expect(await settings.findByText('Google Gemini, on your numbers')).toBeInTheDocument();
  expect(settings.getByText(words)).toBeInTheDocument();
  // The Coach tab's summary beneath Settings asks for the same brief, so one ask at least is the button's.
  expect(narrator.requests.filter((request) => request.cacheKey.startsWith('exec:')).length).toBeGreaterThanOrEqual(1);
});

it('says why there are none: the provider’s refusal, with its message', async () => {
  narrator.outcome = { kind: 'refused', status: 400, detail: 'API key not valid. Please pass a valid API key.' };
  const settings = await coachSettings();
  await userEvent.click(await settings.findByRole('button', { name: 'Test AI coach' }));
  expect(await settings.findByText('Google Gemini refused the request (HTTP 400)')).toBeInTheDocument();
  expect(settings.getByText('API key not valid. Please pass a valid API key.')).toBeInTheDocument();
});

it('says why there are none: words that failed the check, and what they were', async () => {
  narrator.outcome = { kind: 'rejected', text: 'You have 850 kcal left today.', reason: 'It used a number not in your figures (850)' };
  const settings = await coachSettings();
  await userEvent.click(await settings.findByRole('button', { name: 'Test AI coach' }));
  expect(await settings.findByText('Google Gemini’s words failed the check')).toBeInTheDocument();
  expect(settings.getByText(/It used a number not in your figures \(850\), so the built-in coach speaks instead\. It wrote: “You have 850 kcal left today\.”/)).toBeInTheDocument();
});

it('tests the key as typed: it is saved first', async () => {
  const settings = await coachSettings();
  const field = await settings.findByRole('textbox', { name: 'Coaching API key' });
  await userEvent.clear(field);
  await userEvent.type(field, 'AIzaSyNewKey');
  await userEvent.click(settings.getByRole('button', { name: 'Test AI coach' }));
  await settings.findByText('Google Gemini, on your numbers');
  expect((await coachAi.loadConfig()).apiKey).toBe('AIzaSyNewKey');
});
