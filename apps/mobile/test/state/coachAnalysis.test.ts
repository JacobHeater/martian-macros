import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { analysisFatWeekScenario } from '../../src/gallery/screens/analysisFatWeekScenario';
import { storyTargets } from '../../src/gallery/screens/storyTargets';
import { AppState } from '../../src/state/AppState';
import type { CoachAnalysisView } from '../../src/state/CoachAnalysisView';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { servicesOf } from '../support/servicesOf';
import { settled } from './support/settled';

/** MM-610, as state: the spans offered, the span chosen, the findings of it, and a dismissal through the trend log. */
const today = CalendarDate.of(2026, 10, 24);

function stateOf(repos: InMemoryRepositories): AppState {
  return new AppState(servicesOf(repos, new FixedClock(today)));
}

const viewOf = (state: AppState, done: (view: CoachAnalysisView) => boolean = () => true) =>
  settled(state.coachAnalysis.view, (view) => view !== undefined && done(view)) as Promise<CoachAnalysisView>;

async function fatWeek(): Promise<{ repos: InMemoryRepositories; state: AppState }> {
  const repos = new InMemoryRepositories();
  await analysisFatWeekScenario()(repos, today);
  return { repos, state: stateOf(repos) };
}

describe('the spans offered', () => {
  it('9 days since the first entry, 7 of them fully logged: 1d and 7d, not 2w, 1m or 3m', async () => {
    const repos = new InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(storyTargets(today.addDays(-30)));
    for (let i = 0; i <= 14; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
    for (const daysAgo of [9, 6, 5, 4, 3, 2, 1]) {
      const date = today.addDays(-daysAgo);
      await repos.food.addFood(foodOn(date, { kcal: 2300 }));
      await repos.dayMarks.setCompleteness(date, 'complete');
    }
    const view = await viewOf(stateOf(repos), (v) => v.spans.length > 1);
    expect(view.spans).toEqual([1, 7]);
  });

  it('a first entry this morning: 1d only, today so far', async () => {
    const repos = new InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(storyTargets(today));
    await repos.weights.saveWeight(today, 86);
    await repos.food.addFood(foodOn(today, { meal: 'breakfast', kcal: 450, proteinG: 30, carbsG: 55, fatG: 10 }));
    const view = await viewOf(stateOf(repos), (v) => v.sections.left !== undefined);
    expect(view.spans).toEqual([1]);
    expect(view.span).toBe(1);
    expect(view.from).toBe(today);
    expect(view.sections.left?.signal).toBe('left');
  });
});

describe('the span chosen', () => {
  it('opens on 1d; a span chosen is analysed through yesterday; the tab opened again is back on 1d', async () => {
    const { state } = await fatWeek();
    const opened = await viewOf(state, (v) => v.spans.includes(14));
    expect(opened.span).toBe(1);
    expect(opened.spans).toEqual([1, 7, 14]);
    state.coachAnalysis.choose(14);
    const span = await viewOf(state, (v) => v.span === 14);
    expect(span.to).toBe(today.addDays(-1));
    expect(span.from).toBe(today.addDays(-14));
    expect(span.fullyLoggedDays).toBe(14);
    expect(span.sections.worthChanging[0]?.signal).toBe('fatAgainstTarget');
    expect(span.sections.worthChanging[0]?.foods[0]?.name).toBe('Peanut butter');
    state.coachAnalysis.open();
    expect((await viewOf(state, (v) => v.span === 1)).span).toBe(1);
  });

  it('a log of today’s food is read at once: what is left today follows it', async () => {
    const { repos, state } = await fatWeek();
    const before = await viewOf(state, (v) => v.sections.left !== undefined);
    const kcal = before.sections.left?.figures['kcal'] ?? 0;
    await repos.food.addFood(foodOn(today, { meal: 'lunch', kcal: 600, proteinG: 45, carbsG: 60, fatG: 15 }));
    const after = await viewOf(state, (v) => (v.sections.left?.figures['kcal'] ?? 0) > kcal);
    expect(after.sections.left?.figures['kcal']).toBe(kcal + 600);
  });
});

describe('a dismissal', () => {
  it('goes to the trend log, and the finding is hidden with the day it shows again', async () => {
    const { repos, state } = await fatWeek();
    state.coachAnalysis.choose(14);
    const span = await viewOf(state, (v) => v.span === 14 && v.sections.worthChanging.length > 0);
    const top = span.sections.worthChanging[0];
    if (top === undefined) throw new Error('No finding to dismiss.');
    await state.coachAnalysis.dismiss(top.id);
    expect(await first(repos.trendLog.watchFindingDismissals())).toEqual([expect.objectContaining({ findingId: top.id, dismissedOn: today })]);
    const after = await viewOf(state, (v) => v.span === 14 && v.sections.hidden.length > 0);
    expect(after.sections.hidden).toEqual([{ finding: expect.objectContaining({ id: top.id }), dismissedOn: today, showsAgainOn: today.addDays(28) }]);
    expect(after.sections.worthChanging.map((f) => f.id)).not.toContain(top.id);
  });
});
