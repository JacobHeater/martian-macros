import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { CoachNarrationOutcome } from '../../src/domain/integration/CoachNarrationOutcome';
import type { CoachNarrationRequest } from '../../src/domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../../src/domain/integration/CoachNarrator';
import { InMemoryCoachNarrator } from '../../src/fixtures/InMemoryCoachNarrator';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-687: the lines under the day's foods are phrased by the person's own
 * model in one request for the day; each row shows its own line from the
 * answer, a line that fails the check on its words leaves that row its
 * built-in words, and the rows wait while the pass is asked.
 */
const today = CalendarDate.of(2026, 10, 20);
const pastaLine = 'The pasta carried 12 g in 640 kcal. Add the wrap next time.';

/** Answers the day's pass by the foods it names: the pasta's line in its own words, the nachos' with a word the coach never uses. */
class ByFood implements CoachNarrator {
  readonly requests: CoachNarrationRequest[] = [];
  async narrate(request: CoachNarrationRequest): Promise<string> {
    const outcome = await this.probe(request);
    return outcome.kind === 'narrated' ? outcome.text : request.fallbackText;
  }
  async probe(request: CoachNarrationRequest): Promise<CoachNarrationOutcome> {
    this.requests.push(request);
    if (!request.cacheKey.startsWith('inline:')) return { kind: 'narrated', text: request.fallbackText, cached: false };
    const sent = JSON.parse(request.userPrompt) as { items: { n: number; food: string }[] };
    const text = sent.items.map((item) => `${item.n}. ${item.food === 'Creamy Alfredo pasta' ? pastaLine : 'You are lazy, skip it.'}`).join('\n');
    return { kind: 'narrated', text, cached: false };
  }
}

let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(new FoodEntry({ id: 1, date: today, meal: 'lunch', name: 'Creamy Alfredo pasta', kcal: 640, proteinG: 12, carbsG: 68, fatG: 36, source: 'weighed' }));
  await repos.food.addFood(new FoodEntry({ id: 2, date: today, meal: 'dinner', name: 'Loaded nachos', kcal: 780, proteinG: 14, carbsG: 91, fatG: 40, source: 'weighed' }));
});

const withModel = (narrator: CoachNarrator) =>
  renderApp(repos, today, {
    change: (services) => {
      void services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
      return { ...services, coachNarrator: narrator };
    },
  });

describe('the day’s inline lines in the model’s words', () => {
  it('are asked for once, and each row shows its own line; a line that fails the check keeps the built-in words', async () => {
    const narrator = new ByFood();
    withModel(narrator);
    await openTab('Food');
    expect(await screen.findByText(pastaLine)).toBeInTheDocument();
    expect(screen.getByText(/^Light on protein: 780 kcal for 14 g\./)).toBeInTheDocument();
    expect(screen.queryByText(/lazy/)).toBeNull();
    const passes = narrator.requests.filter((request) => request.cacheKey.startsWith('inline:'));
    expect(passes).toHaveLength(1);
    const sent = JSON.parse(passes[0]!.userPrompt) as { items: { food: string }[] };
    expect(sent.items.map((item) => item.food).sort()).toEqual(['Creamy Alfredo pasta', 'Loaded nachos']);
    expect(passes[0]!.toolbox?.tools.map((tool) => tool.name)).toContain('search_catalog');
  });

  it('wait, under each food, while the pass is asked', async () => {
    const narrator = new InMemoryCoachNarrator();
    narrator.pending = true;
    withModel(narrator);
    await openTab('Food');
    const waits = await screen.findAllByRole('status');
    expect(waits.filter((wait) => wait.textContent?.includes('The coach is writing…')).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/^Light on protein: 640 kcal/)).toBeNull();
  });

  it('are the built-in words at once, with nothing asked, when no model is set up', async () => {
    const narrator = new InMemoryCoachNarrator();
    renderApp(repos, today, { change: (services) => ({ ...services, coachNarrator: narrator }) });
    await openTab('Food');
    expect(await screen.findByText(/^Light on protein: 640 kcal for 12 g\./)).toBeInTheDocument();
    expect(narrator.requests.filter((request) => request.cacheKey.startsWith('inline:'))).toHaveLength(0);
  });
});
