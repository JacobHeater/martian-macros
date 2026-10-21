import type { CalendarDate } from '../domain';
import { calibrationDays, type MeasuredChange, type MonthlyReport, paceInWordsOf, ReportPeriod, StreakRule } from '../engine';

/** Over a month with no change intended, a trend that moved less than this is steady (MM-118). */
const steadyMonthKg = 0.5;
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { bodyFatRange } from './bodyFatRange';
import { bodyFatRangeText } from './bodyFatRangeText';
import { explanationLineText } from './explanationLineText';
import { paceInWordsText } from './paceInWordsText';
import { Fmt } from './Fmt';
import { waistAmount } from './waistAmount';
import { wholeDaysLogged } from './wholeDaysLogged';

type Pairs = (readonly [label: string, value: string, detail?: string])[];

/**
 * The fixed words of the monthly report (MM-33). Facts and the reasons for
 * them: no grade, no score, and nothing that praises eating less.
 */
export class MonthlyReportText {
  readonly report: MonthlyReport;
  readonly fmt: Fmt;
  readonly today: CalendarDate;

  constructor(report: MonthlyReport, fmt: Fmt, today: CalendarDate) {
    this.report = report;
    this.fmt = fmt;
    this.today = today;
  }

  /** "Jan 1 – Jan 28". */
  get title(): string {
    return `${Fmt.shortDay(this.report.period.from)} – ${Fmt.shortDay(this.report.period.to)}`;
  }

  /** What the user did. */
  get work(): Pairs {
    const { report } = this;
    const lines: Pairs = [
      ['Days logged', `${report.daysLogged} of ${ReportPeriod.days}`],
      ['Whole days', `${report.completeDays}`],
    ];
    // The month's longest logging run (MM-92), said from the same length as the Dashboard's streak line: the work only,
    // never how much was eaten.
    if (report.longestRunDays >= StreakRule.showFromDays) {
      lines.push(['Longest logging run', `${report.longestRunDays} whole days in a row`]);
    }
    lines.push(['Weigh-ins', `${report.weighIns}`]);
    if (report.workouts > 0) lines.push(['Workouts', `${report.workouts}`]);
    const protein = report.averageProteinG;
    if (protein !== undefined) {
      const target = report.averageProteinTargetG;
      lines.push([
        'Average protein',
        target === undefined ? Fmt.grams(protein) : `${Fmt.grams(protein)} against a target of ${Fmt.grams(target)}`,
      ]);
    }
    return lines;
  }

  /**
   * Each lift's estimated one-rep max across the month, most trained
   * first, or why none can be shown. Empty when no workout was logged. An
   * estimate from reps and load, not a tested max.
   */
  get lifts(): Pairs {
    const { report, fmt } = this;
    if (report.workouts === 0) return [];
    if (report.lifts.length === 0) return [['Estimated maxes', 'No lift had two sessions this month']];
    return report.lifts
      .slice(0, 6)
      .map((lift) => [
        lift.name,
        `${fmt.load(lift.fromKg)} to ${fmt.load(lift.toKg)} (${fmt.loadDelta(lift.toKg - lift.fromKg)})`,
      ]);
  }

  /**
   * The month's personal records (MM-92), oldest first: the lift, its new
   * estimated max against the best before it, and the day. Empty with none.
   */
  get personalRecords(): Pairs {
    const { report, fmt } = this;
    return report.personalRecords.map((record) => [
      record.name,
      `${fmt.load(record.estimateKg)}, up from ${fmt.load(record.previousBestKg)}`,
      Fmt.shortDay(record.date),
    ]);
  }

  /** What the body did, or why that cannot be said. */
  get body(): Pairs {
    const { report, fmt } = this;
    const trend = report.trendChangeKg;
    const intended = report.intendedChangeKg;
    const waist = report.waistChange;
    const lines: Pairs = [
      [
        'Trend weight',
        trend === undefined
          ? 'Too few weigh-ins to say'
          : fmt.weightHidden
            ? // In words against the intended change, with the weight hidden (MM-118).
              paceInWordsText(
                intended === undefined || intended === 0
                  ? Math.abs(trend) < steadyMonthKg
                    ? 'steady'
                    : 'fasterThanPlanned'
                  : paceInWordsOf({ trendFractionPerWeek: trend, intendedFractionPerWeek: intended }),
                { confident: true },
              )
            : `${fmt.weightDelta(trend)}${intended === undefined ? '' : `, against ${fmt.weightDelta(intended)} intended`}`,
      ],
    ];
    // The waist by the one rule every feature uses (MM-155): the value a figure or three words, what it rests on as the
    // row's detail (the panel's PD-12); no clear change is a result, said with the threshold.
    if (waist !== undefined) {
      const ends = `${waistAmount(waist.fromCm, fmt)} to ${waistAmount(waist.toCm, fmt)}`;
      const said: Readonly<Record<MeasuredChange, readonly [value: string, detail: string]>> = {
        down: [`Down ${waistAmount(waist.changeCm, fmt)}`, ends],
        up: [`Up ${waistAmount(waist.changeCm, fmt)}`, ends],
        noClearChange: ['No clear change', `${ends}; a difference under ${waistAmount(waist.thresholdCm, fmt)} is within what a tape can tell`],
      };
      const [value, detail] = said[waist.direction];
      lines.push(['Waist', value, detail]);
    }
    // The body-fat range from the measurements (MM-450): a range, never one number, at the end of the month as the value,
    // and the start's range as the row's detail when there is one, like the waist's ends. Nothing until one has settled.
    const fat = report.bodyFat;
    if (fat !== undefined) {
      const when = fat.start === undefined ? 'At the end of the month' : `${bodyFatRange(fat.start.estimate)} when the month began`;
      lines.push([
        'Body fat',
        bodyFatRangeText(fat.end.estimate, fat.end.basis),
        `${when}; a tape narrows the range but cannot pin body fat down`,
      ]);
    }
    return lines;
  }

  /** The expenditure estimate, or the reason there is none. */
  get estimate(): string {
    const { report } = this;
    const e = report.estimate;
    if (e !== undefined) return `${Fmt.whole(e.kcal)} kcal a day, give or take ${Fmt.whole(e.sigmaKcal)}.`;
    switch (report.estimateGap) {
      case 'tooFewFoodDays':
        return (
          `Not measured this month: ${wholeDaysLogged(report.completeDays)}, ` +
          `and the coach needs at least ${calibrationDays} to ` +
          'tell your expenditure from the scale.'
        );
      case 'notSettled':
        return 'Not measured this month: the coach did not settle on an estimate from the days that were logged.';
      case undefined:
        return 'Not measured this month.';
    }
  }

  /** One line per change to the targets, with the estimate it rested on. */
  get targetChanges(): string[] {
    return this.report.targetChanges.map((change) =>
      [
        `${Fmt.shortDay(change.date)}: ` +
          `${change.previousKcal === undefined ? 'first targets, ' : `${Fmt.whole(change.previousKcal)} to `}` +
          `${Fmt.kcal(change.newKcal)}.`,
        ...change.lines.filter((line) => line.reason !== 'noExplanationRecorded').map(explanationLineText),
        `Based on an expenditure estimate of ${Fmt.whole(change.tdeeKcal)} ` +
          `kcal a day, give or take ${Fmt.whole(change.tdeeSigmaKcal)}` +
          `${change.tdeeStatus === 'updated' ? '' : ' (still the starting estimate)'}.`,
      ].join(' '),
    );
  }
}
