import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { TrendAnnouncement } from '../../src/engine/trends/TrendAnnouncement';
import { analysisFatWeekScenario } from '../../src/gallery/screens/analysisFatWeekScenario';
import { storyTargets } from '../../src/gallery/screens/storyTargets';
import { AppState } from '../../src/state/AppState';
import type { CoachAnalysisView } from '../../src/state/CoachAnalysisView';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { servicesOf } from '../support/servicesOf';
import { settled, turn } from './support/settled';

/**
 * MM-610, as state: the spans offered, the span chosen, the findings of it, and a dismissal through the trend log;
 * the announcement log written once a day (MM-605), the Dashboard's card from the same engine, the filters before
 * ranking, and the foods snoozed inline.
 */
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

/** An entry of the announcement log, made for `on`, as the state machine appends one (MM-605). */
const announced = (key: string, transition: TrendAnnouncement['transition'], on: CalendarDate): TrendAnnouncement => ({
  key,
  transition,
  on,
  direction: key.startsWith('protein') ? 'down' : 'up',
  onsetDate: undefined,
  figures: { effect: 0, unit: 'finding', n: 0, k: 0, span: 14, coverage: 0 },
  tier: 'clear',
  rulesVersion: 1,
});

const yesterday = today.addDays(-1);

/** Every finding of a view, wherever it is placed. */
const everyFinding = (view: CoachAnalysisView) => [
  ...view.sections.worthChanging,
  ...view.sections.holdingUp,
  ...view.sections.more,
  ...view.sections.hidden.map((h) => h.finding),
];

describe('the announcement log (MM-605)', () => {
  it('is written once a day for the canonical span, idempotent against the log: the app opened again appends nothing', async () => {
    const { repos, state } = await fatWeek();
    const stop = state.coachAnalysis.keepAnnouncing();
    const log = await settled(repos.trendLog.watchTrendAnnouncements(), (l) => l.length > 0);
    expect(log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'fatAgainstTarget:level', transition: 'new', on: yesterday, figures: expect.objectContaining({ span: 14 }) }),
        expect.objectContaining({ key: 'proteinMinimum:level', transition: 'new', on: yesterday }),
      ]),
    );
    expect(log.every((entry) => entry.on === yesterday)).toBe(true);
    // 1d's findings never go in (MM-612).
    expect(log.some((entry) => entry.key.startsWith('day:') || entry.key.startsWith('left'))).toBe(false);
    // Ranked as the analysis ranks them: the fat line that names the foods first.
    expect(log[0]?.key).toBe('fatAgainstTarget:level');

    // A log of today's food, then the app opened again the same day.
    await repos.food.addFood(foodOn(today, { meal: 'lunch', kcal: 600, proteinG: 45, carbsG: 60, fatG: 15 }));
    await turn();
    stop();
    const reopened = stateOf(repos);
    const stopAgain = reopened.coachAnalysis.keepAnnouncing();
    await settled(reopened.coachAnalysis.dashboard, (card) => card !== undefined);
    await turn();
    await turn();
    expect(await first(repos.trendLog.watchTrendAnnouncements())).toEqual(log);
    stopAgain();
  });

  it("the log's transitions rank the span's fixes: the protein minimum new as of yesterday leads the fat line that continues", async () => {
    const { repos, state } = await fatWeek();
    await repos.trendLog.appendTrendAnnouncements([announced('proteinMinimum:level', 'new', yesterday)]);
    state.coachAnalysis.choose(14);
    const view = await viewOf(state, (v) => v.span === 14 && v.sections.worthChanging.length > 1);
    const ids = view.sections.worthChanging.map((f) => f.id);
    expect(ids[0]).toBe('proteinMinimum:level');
    expect(ids).toContain('fatAgainstTarget:level');
  });
});

describe("the Dashboard's card (MM-610)", () => {
  it('is the top finding announced, under the same id; dismissed there, it is hidden on the Coach tab', async () => {
    const { repos, state } = await fatWeek();
    state.coachAnalysis.keepAnnouncing();
    const card = await settled(state.coachAnalysis.dashboard, (c) => c?.kind === 'finding');
    expect(card).toMatchObject({ kind: 'finding', transition: 'new', finding: { id: 'fatAgainstTarget:level', span: 14 } });
    await state.coachAnalysis.dismiss('fatAgainstTarget:level');
    expect(await first(repos.trendLog.watchFindingDismissals())).toEqual([{ findingId: 'fatAgainstTarget:level', dismissedOn: today }]);
    await settled(state.coachAnalysis.dashboard, (c) => c === undefined);
    state.coachAnalysis.choose(14);
    const view = await viewOf(state, (v) => v.span === 14 && v.sections.hidden.length > 0);
    expect(view.sections.hidden.map((h) => h.finding.id)).toEqual(['fatAgainstTarget:level']);
  });

  it('dismissed on the Coach tab, it leaves the card too', async () => {
    const { repos, state } = await fatWeek();
    state.coachAnalysis.keepAnnouncing();
    await settled(state.coachAnalysis.dashboard, (c) => c?.kind === 'finding');
    // What the Coach tab's own Dismiss writes.
    await repos.trendLog.dismissFinding('fatAgainstTarget:level', today);
    expect(await settled(state.coachAnalysis.dashboard, (c) => c === undefined)).toBeUndefined();
  });

  it('pressed, the section opens on the span the card reads', async () => {
    const { state } = await fatWeek();
    state.coachAnalysis.keepAnnouncing();
    await settled(state.coachAnalysis.dashboard, (c) => c?.kind === 'finding');
    state.coachAnalysis.openCanonical();
    expect((await viewOf(state, (v) => v.span === 14)).span).toBe(14);
  });
});

describe('filters run first (MM-605)', () => {
  it('an eating-disorder history: what it hides is gone before ranking, even said in the log, and displaces nothing', async () => {
    const repos = new InMemoryRepositories();
    await analysisFatWeekScenario({ eatingDisorderHistory: true })(repos, today);
    // The log says the fat line reversed yesterday, which would rank it first: nothing of it reaches any list.
    await repos.trendLog.appendTrendAnnouncements([announced('fatAgainstTarget:level', 'reversed', yesterday)]);
    const state = stateOf(repos);
    state.coachAnalysis.choose(14);
    const view = await viewOf(state, (v) => v.span === 14 && v.sections.worthChanging.length > 0);
    const all = everyFinding(view);
    expect(all.some((f) => f.signal === 'fatAgainstTarget')).toBe(false);
    expect(all.every((f) => f.signal.startsWith('protein'))).toBe(true);
    expect(view.sections.worthChanging[0]?.id).toBe('proteinMinimum:level');
    expect(view.sections.hidden).toEqual([]);
  });

  it('an eating-disorder history on the card: the protein minimum, not the fat line it hides', async () => {
    const repos = new InMemoryRepositories();
    await analysisFatWeekScenario({ eatingDisorderHistory: true })(repos, today);
    const state = stateOf(repos);
    state.coachAnalysis.keepAnnouncing();
    const card = await settled(state.coachAnalysis.dashboard, (c) => c?.kind === 'finding');
    expect(card).toMatchObject({ finding: { id: 'proteinMinimum:level' } });
    const log = await first(repos.trendLog.watchTrendAnnouncements());
    expect(log.some((entry) => entry.key.startsWith('fatAgainstTarget'))).toBe(false);
  });

  it('hidden weight: the same findings in the same places as with every reading shown, none carrying a body weight', async () => {
    const shownRepos = new InMemoryRepositories();
    await analysisFatWeekScenario()(shownRepos, today);
    const hiddenRepos = new InMemoryRepositories();
    await analysisFatWeekScenario({ weightDisplay: 'hidden' })(hiddenRepos, today);
    const placed = async (repos: InMemoryRepositories) => {
      const state = stateOf(repos);
      state.coachAnalysis.choose(14);
      const view = await viewOf(state, (v) => v.span === 14 && v.sections.worthChanging.length > 0);
      return {
        worth: view.sections.worthChanging.map((f) => f.id),
        holding: view.sections.holdingUp.map((f) => f.id),
        more: view.sections.more.map((f) => f.id),
        figures: everyFinding(view).flatMap((f) => Object.keys(f.figures)),
      };
    };
    const hidden = await placed(hiddenRepos);
    const shown = await placed(shownRepos);
    expect(hidden.worth).toEqual(shown.worth);
    expect(hidden.holding).toEqual(shown.holding);
    expect(hidden.more).toEqual(shown.more);
    expect(hidden.figures.filter((name) => /bodyWeight|weightKg|trendKg/i.test(name))).toEqual([]);
  });
});

describe('snoozed foods (MM-378)', () => {
  it('a food snoozed inline is never traded, X or Y', async () => {
    const { repos, state } = await fatWeek();
    state.coachAnalysis.choose(14);
    const trades = (view: CoachAnalysisView) => everyFinding(view).flatMap((f) => (f.trade === undefined ? [] : [f.trade]));
    const peanut = (name: string) => name.trim().toLowerCase() === 'peanut butter';
    const before = await viewOf(state, (v) => v.span === 14 && trades(v).some((t) => peanut(t.x.name)));
    expect(trades(before).some((t) => peanut(t.x.name))).toBe(true);
    await repos.insightSnoozes.saveInsightSnooze({ kind: 'mostlyFat', subject: 'Peanut butter', item: 'Peanut butter', resumesOn: today.addDays(8) });
    const after = await viewOf(state, (v) => v.span === 14 && v.sections.worthChanging.length > 0 && !trades(v).some((t) => peanut(t.x.name)));
    expect(trades(after).every((t) => !peanut(t.x.name) && !peanut(t.y.name))).toBe(true);
  });
});
