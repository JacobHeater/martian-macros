import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { AnalysisSpan } from '../../src/engine/analysis/AnalysisSpan';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import type { CoachFindingKind } from '../../src/engine/analysis/CoachFindingKind';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { foldTrainingProtein } from '../../src/engine/analysis/foldTrainingProtein';
import { supportedAnalysisSpans } from '../../src/engine/analysis/supportedAnalysisSpans';
import type { InsightPriority } from '../../src/engine/InsightPriority';
import type { TrendFinding } from '../../src/engine/trends/TrendFinding';
import { inputOf, ownersFatWeek, yesterday } from './support/foodAnalysis';
import { trendFinding } from './support/trendFinding';

/** MM-610: the spans the data supports, and the findings placed in "What your data says". */
const today = CalendarDate.of(2026, 10, 24);

const finding = (
  signal: string,
  kind: CoachFindingKind,
  {
    figures = {},
    priority = kind === 'dataQuality' ? 'dataQuality' : 'coaching',
    trend,
    span = 14,
  }: { figures?: Record<string, number>; priority?: InsightPriority; trend?: TrendFinding; span?: AnalysisSpan } = {},
): CoachFinding => ({
  id: `${signal}:${kind}`,
  signal,
  kind,
  span,
  from: today.addDays(-span),
  to: today.addDays(-1),
  priority,
  figures,
  foods: [],
  trade: undefined,
  trend,
});

const ids = (findings: readonly CoachFinding[]) => findings.map((f) => f.id);

describe('the spans the data supports', () => {
  const wholeOf = (daysAgo: readonly number[]) => new Set(daysAgo.map((d) => today.addDays(-d).epochDay));

  it('opens on today: a first entry this morning offers 1d only, so there is no switcher', () => {
    expect(supportedAnalysisSpans({ firstEntryOn: today, wholeDays: new Set(), today })).toEqual([1]);
    expect(supportedAnalysisSpans({ firstEntryOn: undefined, wholeDays: new Set(), today })).toEqual([1]);
  });

  it('9 days since the first entry, 7 of them fully logged: 1d and 7d, not 2w, 1m or 3m', () => {
    const spans = supportedAnalysisSpans({ firstEntryOn: today.addDays(-9), wholeDays: wholeOf([1, 2, 3, 4, 5, 6, 8]), today });
    expect(spans).toEqual([1, 7]);
  });

  it('a span needs 60% of its days fully logged: 4 of the last 7 is not enough, 5 is', () => {
    const first = today.addDays(-20);
    expect(supportedAnalysisSpans({ firstEntryOn: first, wholeDays: wholeOf([1, 2, 3, 4]), today })).toEqual([1]);
    expect(supportedAnalysisSpans({ firstEntryOn: first, wholeDays: wholeOf([1, 2, 3, 4, 7]), today })).toEqual([1, 7]);
  });

  it('every span once the data reaches it', () => {
    const all = wholeOf(Array.from({ length: 90 }, (_, i) => i + 1));
    expect(supportedAnalysisSpans({ firstEntryOn: today.addDays(-90), wholeDays: all, today })).toEqual([1, 7, 14, 30, 90]);
    expect(supportedAnalysisSpans({ firstEntryOn: today.addDays(-29), wholeDays: all, today })).toEqual([1, 7, 14]);
  });
});

describe('the lists', () => {
  it('everything shown: of 9 findings, 3 are worth changing, up to 3 hold up, and the rest are under "more"', () => {
    const findings = [
      ...['proteinMinimum', 'fiber', 'sodium', 'calorieDensity', 'mealBalance'].map((s) => finding(s, 'fix')),
      ...['calories', 'trainingDays', 'proteinByMeal', 'fatAgainstTarget'].map((s) => finding(s, 'holdingUp')),
    ];
    const sections = arrangeCoachFindings(findings, { today });
    expect(sections.worthChanging).toHaveLength(3);
    expect(sections.holdingUp).toHaveLength(3);
    expect(sections.more).toHaveLength(3);
    // Nothing true is left out.
    expect(new Set(ids([...sections.worthChanging, ...sections.holdingUp, ...sections.more]))).toEqual(new Set(ids(findings)));
  });

  it('not padded: 3 fixes and no strengths give no "Holding up" list and no headline', () => {
    const sections = arrangeCoachFindings(['proteinMinimum', 'fiber', 'sodium'].map((s) => finding(s, 'fix')), { today });
    expect(sections.holdingUp).toEqual([]);
    expect(sections.headline).toBeUndefined();
    expect(sections.more).toEqual([]);
  });

  it('the headline pairs the top strength with the top fix', () => {
    const sections = arrangeCoachFindings([finding('calories', 'holdingUp'), finding('fiber', 'fix'), finding('sodium', 'fix')], { today });
    expect(sections.headline?.holdingUp.signal).toBe('calories');
    expect(sections.headline?.fix.signal).toBe('fiber');
  });

  it('a data-quality finding that limits the rest comes first, and is never the headline’s fix', () => {
    const sections = arrangeCoachFindings(
      [finding('fiber', 'fix'), finding('partialDays', 'dataQuality'), finding('calories', 'holdingUp')],
      { today },
    );
    expect(ids(sections.worthChanging)).toEqual(['partialDays:dataQuality', 'fiber:fix']);
    expect(sections.headline?.fix.signal).toBe('fiber');
  });

  it('fixes go by priority class, then the trend engine’s ranking for those with a trend', () => {
    const weak = trendFinding({ signal: 'sodium', tier: 'clear', priority: 'coaching' });
    const strong = trendFinding({ signal: 'fiber', tier: 'strong', priority: 'coaching' });
    const sections = arrangeCoachFindings(
      [
        finding('trainingDropped', 'fix', { priority: 'pattern' }),
        finding('sodium', 'fix', { trend: weak }),
        finding('fiber', 'fix', { trend: strong }),
      ],
      { today },
    );
    expect(ids(sections.worthChanging)).toEqual(['fiber:fix', 'sodium:fix', 'trainingDropped:fix']);
  });

  it('1d’s "what is left" is set apart, at the top, and is never hidden', () => {
    const left = finding('left', 'left', { span: 1 });
    const sections = arrangeCoachFindings([left, finding('fatAgainstTarget', 'fix', { span: 1 })], {
      today,
      dismissals: [{ findingId: left.id, dismissedOn: today }],
    });
    expect(sections.left).toBe(left);
    expect(ids(sections.worthChanging)).toEqual(['fatAgainstTarget:fix']);
    expect(sections.hidden).toEqual([]);
  });
});

describe('dismissed but visible', () => {
  it('a finding dismissed 10 days ago is hidden, and shows again 28 days after it was dismissed', () => {
    const fiber = finding('fiber', 'fix');
    const dismissedOn = today.addDays(-10);
    const sections = arrangeCoachFindings([fiber, finding('sodium', 'fix')], { today, dismissals: [{ findingId: fiber.id, dismissedOn }] });
    expect(ids(sections.worthChanging)).toEqual(['sodium:fix']);
    expect(sections.hidden).toEqual([{ finding: fiber, dismissedOn, showsAgainOn: dismissedOn.addDays(28) }]);
  });

  it('after 28 days it is back in its list', () => {
    const fiber = finding('fiber', 'fix');
    const sections = arrangeCoachFindings([fiber], { today, dismissals: [{ findingId: fiber.id, dismissedOn: today.addDays(-28) }] });
    expect(ids(sections.worthChanging)).toEqual(['fiber:fix']);
    expect(sections.hidden).toEqual([]);
  });

  it('dismissed again, it is counted from the later day', () => {
    const fiber = finding('fiber', 'fix');
    const sections = arrangeCoachFindings([fiber], {
      today,
      dismissals: [
        { findingId: fiber.id, dismissedOn: today.addDays(-40) },
        { findingId: fiber.id, dismissedOn: today.addDays(-3) },
      ],
    });
    expect(sections.hidden[0]?.showsAgainOn).toBe(today.addDays(25));
  });
});

describe('a stable list', () => {
  it('a day whose findings keep their class and transition keeps yesterday’s order, and the figures update', () => {
    // Yesterday sodium led on its strength; today fiber's effect is the larger, which alone would reorder them.
    const yesterdays = arrangeCoachFindings(
      [
        finding('fiber', 'fix', { figures: { averageG: 14 }, trend: trendFinding({ signal: 'fiber', effect: 150 }) }),
        finding('sodium', 'fix', { figures: { overDays: 9 }, trend: trendFinding({ signal: 'sodium', effect: 300 }) }),
      ],
      { today: today.addDays(-1) },
    );
    expect(ids(yesterdays.worthChanging)).toEqual(['sodium:fix', 'fiber:fix']);
    const todays = arrangeCoachFindings(
      [
        finding('fiber', 'fix', { figures: { averageG: 12 }, trend: trendFinding({ signal: 'fiber', effect: 300 }) }),
        finding('sodium', 'fix', { figures: { overDays: 10 }, trend: trendFinding({ signal: 'sodium', effect: 150 }) }),
      ],
      { today, previousOrder: ids(yesterdays.worthChanging) },
    );
    expect(ids(todays.worthChanging)).toEqual(['sodium:fix', 'fiber:fix']);
    expect(todays.worthChanging[0]?.figures['overDays']).toBe(10);
    expect(todays.worthChanging[1]?.figures['averageG']).toBe(12);
  });

  it('a finding that changes transition moves: a new one ahead of one continuing', () => {
    const fiber = finding('fiber', 'fix', { trend: trendFinding({ signal: 'fiber' }) });
    const sodium = finding('sodium', 'fix', { trend: trendFinding({ signal: 'sodium' }) });
    const sections = arrangeCoachFindings([sodium, fiber], {
      today,
      previousOrder: ['sodium:fix', 'fiber:fix'],
      transitions: new Map([['fiber:level', 'new']]),
    });
    expect(ids(sections.worthChanging)).toEqual(['fiber:fix', 'sodium:fix']);
  });
});

describe('protein on rest and training days, folded into the protein minimum', () => {
  const x1 = finding('proteinByTrainingDay', 'fix', {
    priority: 'pattern',
    figures: { trainingDays: 6, trainingMet: 5, restDays: 8, restMet: 2, minimumG: 140, lowerOnRestDays: 1 },
  });

  it('when both fire, X1 is not a line of its own but the minimum’s supporting figures', () => {
    const n1 = finding('proteinMinimum', 'fix', { figures: { metDays: 7, judgedDays: 14 } });
    const folded = foldTrainingProtein([n1, x1]);
    expect(ids(folded)).toEqual(['proteinMinimum:fix']);
    expect(folded[0]?.figures).toMatchObject({ metDays: 7, 'proteinByTrainingDay.restMet': 2, 'proteinByTrainingDay.trainingDays': 6 });
    expect(ids(arrangeCoachFindings([n1, x1], { today }).worthChanging)).toEqual(['proteinMinimum:fix']);
  });

  it('alone, X1 is said', () => {
    expect(ids(foldTrainingProtein([x1]))).toEqual(['proteinByTrainingDay:fix']);
  });
});

describe("the owner's fat week", () => {
  it('the fat and protein finding comes first, with peanut butter and a trade', () => {
    const sections = arrangeCoachFindings(analyseFoodSpan(inputOf(ownersFatWeek()), 14, yesterday), { today });
    const first = sections.worthChanging[0];
    expect(first?.signal).toBe('fatAgainstTarget');
    expect(first?.figures['proteinShortG']).toBeGreaterThan(0);
    expect(first?.foods[0]?.name).toBe('Peanut butter');
    expect(first?.trade).toBeDefined();
    expect(sections.headline?.fix).toBe(first);
    expect(sections.headline?.holdingUp.kind).toBe('holdingUp');
  });
});
