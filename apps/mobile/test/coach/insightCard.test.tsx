import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Insight } from '../../src/engine/Insight';
import { InsightRule } from '../../src/engine/InsightRule';
import { StallAssessment } from '../../src/engine/StallAssessment';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Fmt } from '../../src/format/Fmt';
import { insightText } from '../../src/format/insightText';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-141: one rationed insight, in fixed words, with its evidence. Carried over from insight_card_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
const fmt = new Fmt('metric');

const insight = (rule: InsightRule, figures: Readonly<Record<string, number>> = {}) =>
  new Insight({
    rule,
    from: today.addDays(-14),
    to: today.addDays(-1),
    figures,
    stall:
      rule === 'stall'
        ? new StallAssessment({
            status: 'stalled',
            windowDays: 21,
            diagnosis: 'intake',
            averageIntakeKcal: 2350,
            averageTargetKcal: 2100,
            usableFoodDays: 20,
            weighIns: 18,
          })
        : undefined,
  });

const every = [
  insight('partialDays', { loggedDays: 13, partialDays: 5 }),
  insight('estimatesRising', { wholeDays: 14, estimatedShare: 0.6 }),
  insight('weighInTiming', { weighIns: 5 }),
  insight('proteinShort', { wholeDays: 14, metDays: 5, averageShortfallG: 28 }),
  insight('stall'),
  insight('proteinByMeal', { meal: 0, missedDays: 10, lowDays: 8 }),
  insight('sodiumOverLimit', { overDays: 5, judgedDays: 8, leftOutDays: 6, limitMg: 2300 }),
] as const;

it('every rule in the catalog has words', () => {
  expect(new Set(every.map((i) => i.rule))).toEqual(new Set(InsightRule.values));
  for (const i of every) {
    const [title, body, evidence] = insightText(i, fmt);
    expect(title).not.toBe('');
    expect(body).not.toBe('');
    expect(evidence.length, 'the evidence is viewable').toBeGreaterThan(0);
  }
});

it('the protein insight states both figures', () => {
  const [, body, evidence] = insightText(every[3], fmt);
  expect(body).toContain('5 of 14 fully logged days');
  expect(body).toContain('about 28 g short');
  expect(evidence).toContainEqual(['Average shortfall', '28 g']);
});

it('the protein-by-meal insight names the meal and grades itself', () => {
  const [, body, evidence] = insightText(every[5], fmt);
  expect(body).toContain('breakfast has almost none');
  expect(body).toContain('may help slightly');
  expect(body).toContain('your daily total matters much more');
  expect(evidence).toContainEqual(['Days under the minimum', '10']);
});

// MM-312: the sodium insight names its denominator and the days left out (the panel's CO-2).
it('the sodium insight says how many days could be judged', () => {
  const [title, body, evidence] = insightText(every[6], fmt);
  expect(title).toBe('Sodium over the limit you set');
  expect(body).toContain('over your limit of 2,300 mg on 5 of 8 days with enough sodium data');
  expect(evidence).toContainEqual(['Days left out (too little sodium data)', '6']);
  expect(body).not.toContain('usual place to look');
});

it('forbidden subjects never appear', () => {
  for (const i of every) {
    const [title, body, evidence] = insightText(i, fmt);
    const all = [title, body, ...evidence.map(([label, value]) => `${label} ${value}`)].join(' ').toLowerCase();
    for (const word of [
      'great',
      'well done',
      'good',
      'bad',
      'cheat',
      'guilt',
      'clean',
      'junk',
      'lowest weight',
      'new low',
      'other people',
      'most people',
      'average person',
      'by christmas',
      'you will reach',
      'you should',
      'you must',
    ]) {
      expect(all, `${word} in ${i.rule}`).not.toContain(word);
    }
  }
});

describe('on the dashboard', () => {
  const shortDay = (day: CalendarDate) => foodOn(day, { name: 'Food', kcal: 2500, proteinG: 100, carbsG: 300, fatG: 90 });

  async function shortOnProtein(): Promise<InMemoryRepositories> {
    const repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(
      targetsFrom(today.addDays(-50), {
        mode: 'maintenance',
        kcal: 2500,
        proteinG: 160,
        proteinMinimumG: 130,
        fatG: 80,
        carbsG: 280,
        weeklyRateFraction: 0,
        tdeeKcal: 2500,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
      }),
    );
    for (let i = 0; i <= 20; i++) {
      const day = today.addDays(-i);
      await repos.weights.saveWeight(day, 82);
      if (i === 0) continue;
      await repos.food.addFood(shortDay(day));
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
    return repos;
  }

  const card = () => screen.queryByRole('button', { name: 'Dismiss' })?.closest('.mm-section') ?? null;

  it('a pattern is shown once, with its evidence', async () => {
    const repos = await shortOnProtein();
    renderApp(repos, today);
    await screen.findByRole('button', { name: 'Dismiss' });
    expect(card()).toHaveTextContent('about 30 g short');
    await userEvent.click(screen.getByRole('button', { name: /What this rests on/ }));
    expect(await screen.findByText('Days at or above the minimum')).toBeInTheDocument();
    const log = await first(repos.insightLog.watchInsightLog());
    expect(log).toHaveLength(1);
    expect(log[0]?.rule).toBe('proteinShort');
    expect(log[0]?.shownOn).toBe(today);
  });

  it('dismissed, it does not come back ten days later', async () => {
    const repos = await shortOnProtein();
    const view = renderApp(repos, today);
    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    expect(card()).toBeNull();
    for (let i = 1; i <= 10; i++) {
      const day = today.addDays(i);
      await repos.weights.saveWeight(day, 82);
      await repos.food.addFood(shortDay(day));
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
    view.unmount();
    renderApp(repos, today.addDays(10));
    await dashboardLoaded();
    // Another pattern may take its place; this one does not return.
    expect(screen.queryByText(/g short/)).not.toBeInTheDocument();
  });

  it('a well-logged fortnight on target shows no insight', async () => {
    const repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);
    renderApp(repos, today);
    await dashboardLoaded();
    expect(card()).toBeNull();
  });
});
