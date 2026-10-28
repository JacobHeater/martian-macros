import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryCoachNarrator } from '../../src/fixtures/InMemoryCoachNarrator';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openTab } from '../support/openTab';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';

/**
 * MM-673: wherever the person's own model is asked, the screen shows the
 * wait, never the built-in words first and the model's over them a moment
 * later (the owner, 2026-10-28). The built-in words show only once the ask
 * failed, or at once when no model is set up.
 */
const today = CalendarDate.of(2026, 10, 13);
const writing = 'The coach is writing…';
const words = 'Logged 1,820 kcal of 2,400 today with 112 g protein; 580 kcal and 58 g protein remain. Hold the line tonight.';
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
});

async function coachWith(narrator: InMemoryCoachNarrator, on = true) {
  renderApp(repos, today, {
    change: (services) => {
      if (on) void services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
      return { ...services, coachNarrator: narrator };
    },
  });
  await openCoach();
  const heading = await screen.findByRole('heading', { name: 'Executive summary' });
  return within(heading.closest('.mm-section') as HTMLElement);
}

describe('the Executive summary', () => {
  it('shows the wait while the model writes, and no built-in words', async () => {
    const narrator = new InMemoryCoachNarrator();
    narrator.pending = true;
    const summary = await coachWith(narrator);
    expect(await summary.findByRole('status')).toHaveTextContent(writing);
    expect(summary.queryByText(/kcal budget/)).toBeNull();
    expect(summary.getByText('7-day calorie adherence')).toBeInTheDocument();
  });

  it('then the model’s words', async () => {
    const summary = await coachWith(new InMemoryCoachNarrator().answer('exec:', words));
    expect(await summary.findByText(words)).toBeInTheDocument();
    expect(summary.queryByRole('status')).toBeNull();
  });

  const paragraph = (summary: ReturnType<typeof within>) =>
    (summary.getByRole('heading', { name: 'Executive summary' }).closest('.mm-section') as HTMLElement).querySelector('p.app-text');

  it('the built-in words only once the ask failed', async () => {
    const narrator = new InMemoryCoachNarrator();
    narrator.outcome = { kind: 'refused', status: 503, detail: 'busy' };
    const summary = await coachWith(narrator);
    await waitFor(() => expect(paragraph(summary)).not.toBeNull());
    const asked = narrator.requests.find((request) => request.cacheKey.startsWith('exec:'));
    expect(asked).toBeDefined();
    expect(paragraph(summary)?.textContent).toBe(asked!.fallbackText);
    expect(summary.queryByRole('status')).toBeNull();
  });

  it('the built-in words at once, with no wait and no ask, when no model is set up', async () => {
    const narrator = new InMemoryCoachNarrator();
    narrator.pending = true;
    const summary = await coachWith(narrator, false);
    await waitFor(() => expect(paragraph(summary)?.textContent).toBeTruthy());
    expect(summary.queryByRole('status')).toBeNull();
    expect(narrator.requests).toHaveLength(0);
  });
});

describe('the meal breakdown on Food', () => {
  it('shows the wait while the model writes, the rows under it', async () => {
    const narrator = new InMemoryCoachNarrator();
    narrator.pending = true;
    renderApp(repos, today, {
      change: (services) => {
        void services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
        return { ...services, coachNarrator: narrator };
      },
    });
    await openTab('Food');
    const [options] = await screen.findAllByRole('button', { name: /^Options for/ });
    await userEvent.click(options!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Coach breakdown' }));
    const sheet = within((await screen.findByText('Coach breakdown')).closest('.food-sheet') as HTMLElement);
    expect(await sheet.findByRole('status')).toHaveTextContent(writing);
    expect(sheet.getByText('Meal impact')).toBeInTheDocument();
  });
});
