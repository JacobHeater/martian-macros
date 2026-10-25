import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { storyTargets } from '../../src/gallery/screens/storyTargets';
import { AppState } from '../../src/state/AppState';
import type { CoachAnalysisView } from '../../src/state/CoachAnalysisView';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { servicesOf } from '../support/servicesOf';
import { settled, turn } from './support/settled';

/**
 * MM-617 as state: the Coach tab records the advice it shows, once a day, and 1d follows up on it the next day; and
 * 1d reads the minutes of the day from the app's clock, so the evening's fiber line comes at 7:40 pm.
 */
const tuesday = CalendarDate.of(2026, 10, 20);
const wednesday = tuesday.addDays(1);
const tso = "General Tso's chicken";
const tsoKey = "general tso's chicken";

async function onCut(repos: InMemoryRepositories, day: CalendarDate): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: day.addDays(-30), healthCheckConfirmedOn: day }));
  await repos.targets.saveTargets(storyTargets(day.addDays(-30)));
  for (let i = 0; i <= 14; i++) await repos.weights.saveWeight(day.addDays(-i), 82 + i * 0.05);
}

/** 2,950 kcal against 2,400 on a cut: over the band, the General Tso's chicken at lunch the worst of it. */
async function tsoDay(repos: InMemoryRepositories, day: CalendarDate): Promise<void> {
  await repos.food.addFood(foodOn(day, { name: 'Oatmeal', meal: 'breakfast', kcal: 400, proteinG: 14, carbsG: 68, fatG: 8 }));
  await repos.food.addFood(foodOn(day, { name: tso, meal: 'lunch', kcal: 1600, proteinG: 40, carbsG: 150, fatG: 80 }));
  await repos.food.addFood(foodOn(day, { name: 'Pasta', meal: 'dinner', kcal: 950, proteinG: 40, carbsG: 132, fatG: 25 }));
}

const viewOf = (state: AppState, done: (view: CoachAnalysisView) => boolean = () => true) =>
  settled(state.coachAnalysis.view, (view) => view !== undefined && done(view)) as Promise<CoachAnalysisView>;

const everyFinding = (view: CoachAnalysisView): CoachFinding[] => [
  ...view.sections.worthChanging,
  ...view.sections.holdingUp,
  ...view.sections.more,
  ...(view.sections.left === undefined ? [] : [view.sections.left]),
  ...(view.sections.close === undefined ? [] : [view.sections.close]),
];

const skipsOfTso = async (repos: InMemoryRepositories) =>
  (await first(repos.adviceRecord.watchAdviceGivenSince(tuesday.addDays(-14)))).filter((g) => g.foodKey === tsoKey && g.kind === 'skip');

describe('the record of advice shown (MM-617)', () => {
  it('nothing is recorded while the tab does not show the section', async () => {
    const repos = new InMemoryRepositories();
    await onCut(repos, tuesday);
    await tsoDay(repos, tuesday);
    const state = new AppState(servicesOf(repos, new FixedClock(tuesday)));
    await viewOf(state, (v) => v.sections.worthChanging.length > 0);
    await turn();
    expect(await first(repos.adviceRecord.watchAdviceGivenSince(tuesday.addDays(-14)))).toEqual([]);
  });

  it("viewing the Coach tab records the skip of the General Tso's chicken, once that day however often it is shown", async () => {
    const repos = new InMemoryRepositories();
    await onCut(repos, tuesday);
    await tsoDay(repos, tuesday);
    const state = new AppState(servicesOf(repos, new FixedClock(tuesday)));
    const stop = state.coachAnalysis.keepRecording();
    const record = await settled(repos.adviceRecord.watchAdviceGivenSince(tuesday.addDays(-14)), (r) =>
      r.some((g) => g.foodKey === tsoKey && g.kind === 'skip'),
    );
    expect(record.filter((g) => g.foodKey === tsoKey && g.kind === 'skip')).toEqual([
      { foodKey: tsoKey, foodName: tso, kind: 'skip', replacementName: undefined, kcal: 1600, on: tuesday },
    ]);

    // Shown again: a log changes the view, and the tab is opened again.
    await repos.food.addFood(foodOn(tuesday, { name: 'Apple', meal: 'snack', kcal: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 }));
    await viewOf(state, (v) => (v.sections.left?.figures['kcal'] ?? 0) > 3000);
    stop();
    const again = state.coachAnalysis.keepRecording();
    await viewOf(state);
    await turn();
    again();

    expect(await skipsOfTso(repos)).toHaveLength(1);
    const all = await first(repos.adviceRecord.watchAdviceGivenSince(tuesday.addDays(-14)));
    const ids = all.map((g) => `${g.on.toString()}:${g.kind}:${g.foodKey}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(all.every((g) => g.on === tuesday)).toBe(true);
  });

  it("the next day, with the General Tso's chicken back, 1d says it was told on Tuesday, on the calorie line", async () => {
    const repos = new InMemoryRepositories();
    await onCut(repos, tuesday);
    await tsoDay(repos, tuesday);
    const tuesdayState = new AppState(servicesOf(repos, new FixedClock(tuesday)));
    const stop = tuesdayState.coachAnalysis.keepRecording();
    await settled(repos.adviceRecord.watchAdviceGivenSince(tuesday.addDays(-14)), (r) => r.some((g) => g.foodKey === tsoKey));
    stop();

    await tsoDay(repos, wednesday);
    const state = new AppState(servicesOf(repos, new FixedClock(wednesday)));
    const view = await viewOf(state, (v) => everyFinding(v).some((f) => f.followUps?.some((u) => u.kind === 'saidBefore') === true));
    const line = everyFinding(view).find((f) => f.followUps?.some((u) => u.kind === 'saidBefore') === true);
    expect(line?.kind).toBe('fix');
    expect(line?.advice?.some((a) => a.kind === 'skip' && a.food?.key === tsoKey)).toBe(true);
    expect(line?.followUps).toContainEqual(
      expect.objectContaining({
        kind: 'saidBefore',
        order: 'skip',
        givenOn: tuesday,
        byWeekday: true,
        givenKcal: 1600,
        food: expect.objectContaining({ key: tsoKey, kcal: 1600 }),
      }),
    );
    // Two days this week over by 500 or more (Monday first), today among them: counted on the same line.
    expect(line?.followUps).toContainEqual(expect.objectContaining({ kind: 'repeatOver', days: 2, overByKcal: 500 }));
  });
});

describe("1d reads the minutes of the day from the app's clock (MM-617)", () => {
  /** A day at Full detail with 3 g of fiber by lunch, against a guide of about 34 g, and no dinner logged. */
  async function lowFiberDay(): Promise<InMemoryRepositories> {
    const repos = new InMemoryRepositories();
    await onCut(repos, tuesday);
    await repos.preferences.saveDetailLevel('full');
    const entry = (meal: 'breakfast' | 'lunch', name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, fiberG: number) =>
      repos.food.addFood(new FoodEntry({ id: 0, date: tuesday, meal, name, kcal, proteinG, carbsG, fatG, source: 'weighed', fiberG }));
    await entry('breakfast', 'Eggs', 400, 30, 10, 26, 0);
    await entry('lunch', 'Chicken and rice', 700, 50, 85, 15, 3);
    return repos;
  }

  const fiberFix = (view: CoachAnalysisView) => everyFinding(view).find((f) => f.signal === 'fiber' && f.kind === 'fix');

  it('at 7:40 pm the fiber line is a fix: two cups of vegetables at dinner', async () => {
    const clock = new FixedClock(tuesday, { hour: 19 });
    clock.elapseMs(40 * 60_000);
    const state = new AppState(servicesOf(await lowFiberDay(), clock));
    const view = await viewOf(state, (v) => fiberFix(v) !== undefined);
    expect(fiberFix(view)?.advice).toEqual([expect.objectContaining({ kind: 'add', nutrient: 'fiber', addCategory: 'vegetables', meal: 'dinner' })]);
  });

  it('at noon, with dinner still to come, it is not', async () => {
    const state = new AppState(servicesOf(await lowFiberDay(), new FixedClock(tuesday)));
    const seen: CoachAnalysisView[] = [];
    const stop = state.coachAnalysis.view.subscribe((v) => {
      if (v !== undefined) seen.push(v);
    });
    await viewOf(state, (v) => v.sections.left !== undefined);
    for (let i = 0; i < 5; i++) await turn();
    stop();
    const last = seen[seen.length - 1];
    expect(last).toBeDefined();
    expect(last === undefined ? undefined : fiberFix(last)).toBeUndefined();
  });
});
