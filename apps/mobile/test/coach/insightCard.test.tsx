import { screen, within } from '@testing-library/react';
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
import { openTab } from '../support/openTab';

/**
 * MM-141: one rationed insight, in fixed words, with its evidence. Carried over from insight_card_test.dart. Since
 * MM-610 the card on the dashboard is the coach's analysis where it has an equivalent rule, and agrees with the Coach
 * tab.
 */
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
  insight('weekendHigher', {
    weekdayDays: 15,
    weekendDays: 6,
    weekdayAverageKcal: 2100,
    weekendAverageKcal: 2600,
    targetKcal: 2100,
    weeks: 3,
    higherWeeks: 3,
  }),
  insight('waistAgainstWeight', { waistFromCm: 92.4, waistToCm: 90.4, weightChangeKg: 0 }),
  insight('consistentDay', { weekday: 6, unlogged: 0, weeks: 2, averageKcal: 2700 }),
  insight('consistentDay', { weekday: 1, unlogged: 1, weeks: 4, unloggedWeeks: 3 }),
  insight('shortSleep', { averageMinutes: 340, nights: 12 }),
  new Insight({
    rule: 'fiberForFullness',
    from: today.addDays(-14),
    to: today.addDays(-1),
    figures: { averageG: 11.4, guideG: 29.4, countedDays: 9 },
    examples: ['Lentil soup', 'Raspberries', 'Oats'],
  }),
  insight('weighProtein', { wholeDays: 12, palmProteinShare: 0.8 }),
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

// MM-141: the three rules about the shape of the week and the tape, in the user's numbers.
it('the weekend insight states both averages against the target', () => {
  const [title, body, evidence] = insightText(every[7], fmt);
  expect(title).toBe('Weekends run higher than weekdays');
  expect(body).toContain('weekend days averaged about 2,600 kcal and your weekdays about 2,100, against a target of 2,100');
  expect(evidence).toContainEqual(['Weekend average', '2,600 kcal']);
  // MM-615: the weeks that agree are stated, each weekend against its own weekdays.
  expect(body).toContain("In each of the last 3 weeks your weekend ran above that week's weekdays");
  const [, mostBody] = insightText(insight('weekendHigher', { ...every[7].figures, weeks: 5, higherWeeks: 4 }), fmt);
  expect(mostBody).toContain('In 4 of the last 5 weeks');
  expect(evidence).toContainEqual(['Weeks with the weekend higher', '3 of 3']);
});

it('the waist insight states the tape and the scale', () => {
  const [title, body, evidence] = insightText(every[8], fmt);
  expect(title).toBe('Your waist is down while the scale held');
  expect(body).toContain('from 92.4 cm to 90.4 cm');
  expect(evidence).toContainEqual(['Waist change', '−2.0 cm']);
});

it('the consistent day names the weekday, highest or unlogged', () => {
  const [highest, highestBody] = insightText(every[9], fmt);
  expect(highest).toBe('Saturday is your highest day');
  expect(highestBody).toContain('about 2,700 kcal');
  const [unlogged, unloggedBody, unloggedEvidence] = insightText(every[10], fmt);
  expect(unlogged).toBe('Monday goes unlogged');
  // MM-614: three of the last four weeks, never "both of the last two".
  expect(unloggedBody).toContain('Monday was the day without a log in 3 of the last 4 weeks');
  expect(unloggedEvidence).toContainEqual(['Weeks without a log', '3 of 4']);
  expect(unloggedBody).toContain('a rough estimate of the whole day still counts');
});

// MM-312: the sodium insight names its denominator and the days left out (the panel's CO-2).
it('the sodium insight says how many days could be judged', () => {
  const [title, body, evidence] = insightText(every[6], fmt);
  expect(title).toBe('Sodium over the limit you set');
  expect(body).toContain('over your limit of 2,300 mg on 5 of 8 days with enough sodium data');
  expect(evidence).toContainEqual(['Days left out (too little sodium data)', '6']);
  expect(body).not.toContain('usual place to look');
});

// MM-126: fullness, in the user's own numbers and foods; never a food judged, never "under" or "low".
it('the fiber insight states the average against the guide and names foods already logged', () => {
  const [title, body, evidence] = insightText(every[12], fmt);
  expect(title).toBe('Fiber, and staying full on a deficit');
  expect(body).toContain('On the 9 days with enough fiber data, your fiber averaged about 11 g against a guide of 29 g.');
  expect(body).toContain('they fill you up for the same calories');
  expect(body).toContain('Some you already log: Lentil soup, Raspberries and Oats.');
  expect(evidence).toContainEqual(['Days with enough fiber data', '9']);
  for (const word of ['under', 'low', 'healthy', 'empty calories']) expect(body.toLowerCase()).not.toContain(word);
  const fewer = new Insight({ rule: 'fiberForFullness', from: today.addDays(-14), to: today.addDays(-1), figures: every[12].figures });
  expect(insightText(fewer, fmt)[1], 'without examples, no list').not.toContain('already log');
});

// MM-46: the nudge says how much protein was by palm and asks for one week.
it('the weigh-protein insight asks for one week of weighing', () => {
  const [title, body, evidence] = insightText(every[13], fmt);
  expect(title).toBe('Weigh your main protein for a week');
  expect(body).toContain('About 80% of your protein over the last two weeks was logged by palm');
  expect(body).toContain('for one week');
  expect(evidence).toContainEqual(['Protein logged by palm', '80%']);
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
    await userEvent.click(screen.getByRole('button', { name: /The numbers behind this/ }));
    expect(await screen.findByText('Days at or above the minimum')).toBeInTheDocument();
    // MM-610: protein short is said by the coach's analysis now (its protein minimum), announced once in the trend
    // log as of yesterday; the insight log keeps the catalog rules the analysis has no equivalent of.
    const announced = await first(repos.trendLog.watchTrendAnnouncements());
    expect(announced.filter((entry) => entry.key === 'proteinMinimum:level')).toEqual([
      expect.objectContaining({ transition: 'new', on: today.addDays(-1) }),
    ]);
    expect(await first(repos.insightLog.watchInsightLog())).toEqual([]);
  });

  it('Dashboard and Coach agree: dismissed on the Dashboard, the same finding is hidden on the Coach tab', async () => {
    const repos = await shortOnProtein();
    renderApp(repos, today);
    expect(await screen.findByRole('heading', { name: /^Protein minimum met on 0 of 14 days/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(card()).toBeNull();
    expect(await first(repos.trendLog.watchFindingDismissals())).toEqual([{ findingId: 'proteinMinimum:level', dismissedOn: today }]);
    await openTab('Coach');
    const section = within(await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 }));
    await userEvent.click(await section.findByRole('button', { name: '2w' }));
    await userEvent.click(await section.findByRole('button', { name: '1 finding hidden' }));
    expect(section.getByText(`shows again ${Fmt.shortDay(today.addDays(28))}`)).toBeInTheDocument();
  });

  it('Dashboard and Coach agree: dismissed on the Coach tab, it is gone from the Dashboard', async () => {
    const repos = await shortOnProtein();
    renderApp(repos, today);
    await screen.findByRole('heading', { name: /^Protein minimum met on 0 of 14 days/ });
    await openTab('Coach');
    const section = within(await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 }));
    await userEvent.click(await section.findByRole('button', { name: '2w' }));
    await userEvent.click(await section.findByRole('button', { name: 'Dismiss: Protein minimum met on 0 of 14 days' }));
    await openTab('Dashboard');
    await dashboardLoaded();
    expect(screen.queryByRole('heading', { name: /^Protein minimum met on/ })).not.toBeInTheDocument();
  });

  it('pressed, the card opens its section on the Coach tab, on the span it reads', async () => {
    const repos = await shortOnProtein();
    renderApp(repos, today);
    await userEvent.click(await screen.findByRole('button', { name: /^Open on Coach: Protein minimum met on 0 of 14 days/ }));
    const section = within(await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 }));
    expect(await section.findByRole('heading', { name: 'Protein minimum met on 0 of 14 days' })).toBeInTheDocument();
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
