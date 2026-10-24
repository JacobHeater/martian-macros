import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import { evaluateSignal } from '../../src/engine/trends/evaluateSignal';
import { coachAnalysisWords } from '../../src/format/coachAnalysisWords';
import { coachFindingText } from '../../src/format/coachFindingText';
import { coachHeadlineText } from '../../src/format/coachHeadlineText';
import { coachPeriodText } from '../../src/format/coachPeriodText';
import { Fmt } from '../../src/format/Fmt';
import { hiddenFindingsText } from '../../src/format/hiddenFindingsText';
import { moreFindingsText } from '../../src/format/moreFindingsText';
import { nothingFoundText } from '../../src/format/nothingFoundText';
import { underEatingPointerText } from '../../src/format/underEatingPointerText';
import { unjudgedAreaText } from '../../src/format/unjudgedAreaText';
import { food, inputOf, ownersFatWeek, today, yesterday } from '../engine/support/foodAnalysis';
import { trainingInput } from '../engine/support/trainingInput';
import { trendDays } from '../engine/support/trendDays';
import { trendSignal } from '../engine/support/trendSignal';

/** MM-610's words: the period line, the headline, the folds, the rows and the empty states, and no verdict anywhere. */
const fmt = new Fmt('metric');

/** MM-108's list and MM-610's verdicts, as the food words' test has them. */
const banned = [
  'good',
  'bad',
  'clean',
  'junk',
  'guilt',
  'cheat',
  'oops',
  'earn',
  'burn off',
  'lbs',
  'sinful',
  'naughty',
  'indulg',
  'deserve',
  'too',
  'too much',
  'unhealthy',
  'fattening',
  'empty calories',
  'avoid',
  'cut out',
  'failed',
  'should',
  'because',
  'burn rate',
];
const verdictsIn = (text: string) => banned.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));

describe('the lines', () => {
  it('the period line: today so far, or the span through yesterday with the days fully logged', () => {
    expect(coachPeriodText({ span: 1, fullyLoggedDays: 0 })).toBe('Today so far');
    expect(coachPeriodText({ span: 7, fullyLoggedDays: 6 })).toBe('7 days through yesterday · 6 fully logged');
  });

  it('an area a span cannot judge, with what it needs', () => {
    expect(unjudgedAreaText({ area: 'training', needsDays: 28 })).toBe('Training · needs 4 weeks');
    expect(unjudgedAreaText({ area: 'strength', needsDays: 42 })).toBe('Strength · needs 6 weeks');
    expect(unjudgedAreaText({ area: 'water', needsDays: 14 })).toBe('Water · needs 2 weeks');
  });

  it('the hidden fold: the count and the day the first shows again', () => {
    const f = { id: 'fiber:level' } as CoachFinding;
    const on = CalendarDate.of(2026, 10, 14);
    expect(hiddenFindingsText([])).toBe('');
    expect(hiddenFindingsText([{ finding: f, dismissedOn: on, showsAgainOn: on.addDays(28) }])).toBe('1 hidden · shows again Nov 11');
    expect(
      hiddenFindingsText([
        { finding: f, dismissedOn: on, showsAgainOn: on.addDays(28) },
        { finding: f, dismissedOn: on.addDays(2), showsAgainOn: on.addDays(30) },
      ]),
    ).toBe('2 hidden · the first shows again Nov 11');
  });

  it('the empty states', () => {
    expect(coachAnalysisWords.nothingLogged).toBe('Log a food and the coach reads it here.');
    expect(nothingFoundText(['food', 'training', 'water'])).toBe('Nothing stands out. Checked: food, training and water.');
    expect(nothingFoundText(['food'])).toBe('Nothing stands out. Checked: food.');
    expect(moreFindingsText(4)).toBe('4 more from your data');
  });

  it('the headline pairs the strength with the fix in its numbers', () => {
    const sections = arrangeCoachFindings(analyseFoodSpan(inputOf(ownersFatWeek()), 14, yesterday), { today });
    const headline = sections.headline;
    expect(headline).toBeDefined();
    if (headline === undefined) return;
    expect(coachHeadlineText(headline, fmt)).toMatch(/^[A-Z][a-z]+( [a-z0-9]+)* (is|are) holding up; worth changing: fat averaged 90 g against 70 g\.$/);
  });
});

describe('numbers behind a span’s finding', () => {
  it('the span, the days counted and left out with why, each figure against its reference, and the rule', () => {
    const days = ownersFatWeek().map((d, i) => (i === 3 ? { ...d, completeness: 'partial' as const } : d));
    const found = analyseFoodSpan(inputOf(days), 14, yesterday);
    const fat = found.find((f) => f.signal === 'fatAgainstTarget' && f.kind === 'fix');
    expect(fat).toBeDefined();
    if (fat === undefined) return;
    const evidence = new Map(coachFindingText(fat, fmt)[2]);
    expect(evidence.get('Period')).toBe('14 days through Oct 23');
    expect(evidence.get('Days counted')).toBe('13');
    expect(evidence.get('Days left out')).toBe('1, not fully logged');
    expect(evidence.get('Rule')).toBe('Fat against your target');
    expect([...evidence.keys()]).toContain('Peanut butter');
  });

  it('protein on rest and training days, folded in, is the minimum’s supporting line', () => {
    const n1: CoachFinding = {
      id: 'proteinMinimum:level',
      signal: 'proteinMinimum',
      kind: 'fix',
      span: 14,
      from: yesterday.addDays(-13),
      to: yesterday,
      priority: 'coaching',
      figures: {
        metDays: 6,
        judgedDays: 14,
        minimumG: 140,
        averageShortfallG: 22,
        'proteinByTrainingDay.trainingDays': 6,
        'proteinByTrainingDay.trainingMet': 5,
        'proteinByTrainingDay.restDays': 8,
        'proteinByTrainingDay.restMet': 1,
        'proteinByTrainingDay.lowerOnRestDays': 1,
      },
      foods: [],
      trade: undefined,
      trend: undefined,
    };
    const [, body, evidence] = coachFindingText(n1, fmt);
    expect(body).toContain('it was met on 5 of 6 training days and 1 of 8 rest days, lower on rest days; the minimum is the same every day.');
    expect(new Map(evidence).get('Rest days at the minimum')).toBe('1 of 8');
    expect(evidence[evidence.length - 1]?.[0]).toBe('Rule');
  });
});

describe('a refeed in a trend (MM-611’s "Named in trends")', () => {
  it('a trend spanning a marked day says the span includes 1 refeed', () => {
    const asOf = CalendarDate.of(2026, 10, 20);
    const start = asOf.addDays(-59);
    const marked = asOf.addDays(-4);
    // 50 steady days, then 10 days 150 kcal higher, as MM-605's step; one of the last days a Refeed.
    const pattern = [-1, -0.5, 0, 0.5, 1];
    const series = trendDays(
      start,
      Array.from({ length: 60 }, (_, i) => (i < 50 ? 2000 : 2150) + 100 * (pattern[i % 5] as number)),
      (_, date) => (date === marked ? { planned: true } : {}),
    );
    const trend = evaluateSignal(trendSignal(), series, asOf, 30).findings.find((f) => f.aspect === 'level');
    expect(trend?.plannedDays).toBe(1);
    if (trend === undefined) return;
    const fat: CoachFinding = {
      id: 'fatAgainstTarget:level',
      signal: 'fatAgainstTarget',
      kind: 'fix',
      span: 30,
      from: asOf.addDays(-29),
      to: asOf,
      priority: 'coaching',
      figures: { averageFatG: 95, targetFatG: 70, highDays: 20, judgedDays: 28, direction: 1, calorieRoom: 0, tradeDays: 27 },
      foods: [],
      trade: undefined,
      trend,
    };
    expect(new Map(coachFindingText(fat, fmt)[2]).get('Refeeds and days off counted')).toBe('1');
  });
});

describe('words', () => {
  it('every finding’s text, and every line of the section, passes the banned-word test, including the new words', () => {
    const asOf = yesterday;
    const findings: CoachFinding[] = [
      ...analyseFoodSpan(inputOf(ownersFatWeek()), 14, asOf),
      ...analyseFoodDay(inputOf([...ownersFatWeek(), { date: today, entries: [food(today, 'breakfast', 'Peanut butter', 400, 14, 34)] }]), today),
      ...analyseTrainingSpan(trainingInput(asOf), 90, asOf),
    ];
    const texts = findings.flatMap((f) => {
      const [title, body, evidence] = coachFindingText(f, fmt);
      return [title, body, ...evidence.flat()];
    });
    const sections = arrangeCoachFindings(findings, { today });
    const lines = [
      ...texts,
      ...(sections.headline === undefined ? [] : [coachHeadlineText(sections.headline, fmt)]),
      ...Object.values(coachAnalysisWords),
      coachPeriodText({ span: 14, fullyLoggedDays: 12 }),
      nothingFoundText(['food', 'training', 'water']),
      underEatingPointerText(true),
      underEatingPointerText(false),
      unjudgedAreaText({ area: 'training', needsDays: 28 }),
    ];
    expect(findings.length).toBeGreaterThan(3);
    expect(lines.flatMap((line) => verdictsIn(line).map((word) => `"${word}" in: ${line}`))).toEqual([]);
  });
});
