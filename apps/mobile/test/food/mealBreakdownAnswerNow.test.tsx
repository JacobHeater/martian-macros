import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachNarrationOutcome } from '../../src/domain/integration/CoachNarrationOutcome';
import type { CoachNarrationRequest } from '../../src/domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../../src/domain/integration/CoachNarrator';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { openCoach } from '../support/openCoach';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-686: after three seconds of the model writing, "Answer now" shows the
 * built-in words at once, and the model's later answer is not shown over
 * them. The same on the meal breakdown and on the Executive summary.
 */
const today = CalendarDate.of(2026, 10, 13);

/** A narrator that answers when the test says so. */
class HeldNarrator implements CoachNarrator {
  readonly requests: CoachNarrationRequest[] = [];
  private release: ((outcome: CoachNarrationOutcome) => void) | undefined;

  answer(text: string): void {
    this.release?.({ kind: 'narrated', text, cached: false });
  }

  async narrate(request: CoachNarrationRequest): Promise<string> {
    const outcome = await this.probe(request);
    return outcome.kind === 'narrated' ? outcome.text : request.fallbackText;
  }

  probe(request: CoachNarrationRequest): Promise<CoachNarrationOutcome> {
    this.requests.push(request);
    return new Promise<CoachNarrationOutcome>((resolve) => {
      this.release = resolve;
    });
  }
}

let repos: InMemoryRepositories;
let narrator: HeldNarrator;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
  narrator = new HeldNarrator();
  renderApp(repos, today, {
    change: (services) => {
      void services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
      return { ...services, coachNarrator: narrator };
    },
  });
});

describe('Answer now', () => {
  it('on the meal breakdown: offered after three seconds, the built-in words at once, the model’s later words not shown', async () => {
    await openTab('Food');
    const [options] = await screen.findAllByRole('button', { name: /^Options for/ });
    await userEvent.click(options!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Coach breakdown' }));
    const sheet = within((await screen.findByText('Coach breakdown')).closest('.food-sheet') as HTMLElement);
    expect(await sheet.findByRole('status')).toHaveTextContent('The coach is writing…');
    expect(sheet.queryByRole('button', { name: 'Answer now' })).toBeNull();
    const button = await sheet.findByRole('button', { name: 'Answer now' }, { timeout: 5000 });
    await userEvent.click(button);
    const asked = narrator.requests.find((request) => request.cacheKey.startsWith('meal:'));
    expect(asked).toBeDefined();
    await waitFor(() => expect(sheet.queryByRole('status')).toBeNull());
    expect((sheet.getByText(asked!.fallbackText) as HTMLElement).textContent).toBe(asked!.fallbackText);
    narrator.answer('Words from the model, late.');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sheet.queryByText('Words from the model, late.')).toBeNull();
    expect(sheet.getByText(asked!.fallbackText)).toBeInTheDocument();
  }, 15000);

  it('on the Executive summary, the same', async () => {
    await openCoach();
    const heading = await screen.findByRole('heading', { name: 'Executive summary' });
    const summary = within(heading.closest('.mm-section') as HTMLElement);
    expect(await summary.findByRole('status')).toHaveTextContent('The coach is writing…');
    await userEvent.click(await summary.findByRole('button', { name: 'Answer now' }, { timeout: 5000 }));
    const asked = narrator.requests.find((request) => request.cacheKey.startsWith('exec:'));
    expect(asked).toBeDefined();
    await waitFor(() => expect(summary.queryByRole('status')).toBeNull());
    expect(summary.getByText(asked!.fallbackText)).toBeInTheDocument();
  }, 15000);
});
