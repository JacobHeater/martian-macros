import { CalendarDate, Meal } from '../../domain';
import type { CoachFinding, CoachFood } from '../../engine';
import { CalorieBand } from '../../engine/CalorieBand';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { StateError } from '../../lang/StateError';
import { toStringAsFixed } from '../../lang/toStringAsFixed';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { coachAdviceText } from './coachAdviceText';
import { coachCauseText } from './coachCauseText';
import { coachFollowUpText } from './coachFollowUpText';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import type { CoachPhrasingSlot } from './CoachPhrasingSlot';
import { followUpFindingText } from './followUpFindingText';
import { foodInSentence } from './foodInSentence';
import { listText } from './listText';
import { pluralText } from './pluralText';
import { roughAmount } from './roughAmount';

type Evidence = readonly (readonly [label: string, value: string])[];

/** Each signal's name in "The numbers behind this" (MM-610). */
const ruleNames: Readonly<Record<string, string>> = {
  proteinMinimum: 'Protein against your minimum',
  proteinTarget: 'Protein against your target',
  proteinByMeal: 'Protein by meal',
  proteinDensity: 'Protein per 100 kcal',
  fatAgainstTarget: 'Fat against your target',
  fatShare: 'Fat share of calories',
  carbohydrate: 'Carbohydrate',
  macroSplit: 'Split of calories',
  calorieDensity: 'Calories per gram',
  fiber: 'Fiber against the guide',
  sodium: 'Sodium against your limit',
  calories: 'Calories against your target',
  energyUse: 'Intake against energy use',
  mealBalance: 'Protein in a meal',
  partialDays: 'Partly logged days',
  estimatesRising: 'Calories from estimates',
  loggingStyle: 'Change in logging',
  left: 'What is left today',
  backToPlan: 'Back to plan',
};

const macroNames = ['protein', 'carbohydrate', 'fat'] as const;

/** What a contributing food's share is of, by signal, in "The numbers behind this": "Peanut butter, share of fat". */
const shareNames: Readonly<Record<string, string>> = {
  proteinMinimum: 'the gap',
  proteinTarget: 'the gap',
  proteinByMeal: 'the gap',
  proteinDensity: 'the gap',
  mealBalance: 'the gap',
  fatAgainstTarget: 'fat',
  fatShare: 'fat',
  calorieDensity: 'calories',
  calories: 'calories',
  sodium: 'sodium',
};

/**
 * The words of a food finding (MM-606, MM-612), in the coach's voice
 * (MM-617): a title in numbers of eight words or fewer, the body, and the
 * numbers behind it as label and value pairs.
 *
 * The body is the grammar's slots (`coachPhrasings`): the lead (the number
 * and the verdict), the cause (the meal and the food, `coachCauseText`),
 * the orders, one sentence each, with what each needs said around it
 * (`coachAdviceText`), and the consequence ("Without the General Tso's
 * chicken you'd be 310 kcal over, not 1,054."). A fix ends in its orders,
 * never in a number. Holding up is said bluntly and short ("Protein 155 g.
 * Minimum hit. Keep that."). 1d's closing line is "Tomorrow: back to
 * 2,175. Don't skip meals to make up for today."
 *
 * Verdicts are about the choices, never the person; nothing praises eating
 * under target (MM-92); 1d never names another day (MM-612); the protected
 * path (an eating-disorder history and the other protein-only safeguards)
 * says protein only, calmly.
 */
export function foodFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const x = (key: string) => f.figures[key] ?? 0;
  const n = (key: string) => roundHalfAwayFromZero(x(key)) + 0;
  const g = (key: string) => Fmt.grams(x(key));
  const kcal = (key: string) => Fmt.kcal(x(key));
  const one = (key: string) => toStringAsFixed(x(key), 1);
  const percent = (fraction: number) => `${roundHalfAwayFromZero(fraction * 100) + 0}%`;
  const today = f.span === 1;
  const days = (count: number) => pluralText(count, 'day');
  const mealOf = (key: string) => {
    const meal = Meal.values[n(key)];
    if (meal === undefined) throw new StateError(`No meal is numbered ${n(key)}.`);
    return meal;
  };
  const used = new Map<CoachPhrasingSlot, number>();
  const say = (slot: CoachPhrasingSlot, values: Readonly<Record<string, string>> = {}) => {
    const part = used.get(slot) ?? 0;
    used.set(slot, part + 1);
    return coachPhrase(slot, coachPhraseKey(f, part), values);
  };
  const calm = f.kind === 'left' && x('proteinOnly') === 1;
  const advised = coachAdviceText(f, fmt, { calm });
  const ordersNameFood = (f.advice ?? []).some((a) => a.food !== undefined || a.addFood !== undefined);
  /** The coach's follow-ups riding on it (accountability), said right after the lead. */
  const followUps = (f.followUps ?? []).map((u, i) => coachFollowUpText(f, u, i));
  /** The body: the lead, the follow-ups, the rest, then the orders and what they need said around them. */
  const body = (...lead: readonly string[]) => {
    const [first, ...rest] = lead.filter((s) => s !== '');
    return [...(first === undefined ? [] : [first]), ...followUps, ...rest, ...advised.sentences].join(' ');
  };
  /** Holding up: the lead, then "Keep that." */
  const held = (lead: string) => [lead, ...followUps, say('holdKeep')].join(' ');

  const period: readonly [string, string] = ['Period', today ? 'Today so far' : `${f.span} days through ${Fmt.shortDay(f.to)}`];
  const counted = (key = 'judgedDays'): readonly (readonly [string, string])[] =>
    today || f.figures[key] === undefined ? [] : [['Days counted', `${n(key)}`]];
  /** The split's foods are a share of its largest part; the protein gap's when that is protein. */
  const shareOf =
    f.signal === 'macroSplit'
      ? n('largest') === 0
        ? 'the gap'
        : (macroNames[n('largest')] ?? 'fat')
      : (shareNames[f.signal] ?? 'the total');
  const foodRows = (foods: readonly CoachFood[]): readonly (readonly [string, string])[] =>
    foods.map((food) => [`${food.name}, share of ${shareOf}`, `${percent(food.share)} · ${days(food.days)}`] as const);
  /**
   * The days of the span not counted, and why: not fully logged, or (for a
   * nutrient only some foods state) without enough of its data. None on 1d.
   */
  const leftOut = (countedDays: number, noData: number | undefined, what: string): readonly (readonly [string, string])[] => {
    const total = f.span - countedDays;
    if (today || total <= 0) return [];
    if (noData === undefined) return [['Days left out', `${total}, not fully logged or without enough ${what} data`]];
    if (noData <= 0) return [['Days left out', `${total}, not fully logged`]];
    const notFull = total - noData;
    return [
      ['Days left out', notFull > 0 ? `${total}: ${notFull} not fully logged, ${noData} without ${what} data` : `${total}, without ${what} data`],
    ];
  };
  /** The band around the calorie target, low to high (MM-92's band). */
  const bandRow = (): readonly [string, string] => {
    const band = new CalorieBand(x('targetKcal'));
    return ['Band', `${Fmt.whole(band.lowKcal)}–${Fmt.kcal(band.highKcal)}`];
  };
  const trendRows: readonly (readonly [string, string])[] = [
    ...((f.trend?.plannedDays ?? 0) > 0 ? [['Refeeds and days off counted', `${f.trend?.plannedDays ?? 0}`] as const] : []),
    ...(f.trend === undefined || f.trend.tier === 'silent' ? [] : [['How clear', f.trend.tier === 'strong' ? 'Strong' : 'Clear'] as const]),
  ];
  const rule: readonly [string, string] = ['Rule', ruleNames[f.signal] ?? f.signal];
  const evidence = (...rows: readonly (readonly [string, string])[]): Evidence => [
    period,
    ...counted(),
    ...rows,
    ...foodRows(f.foods),
    ...trendRows,
    rule,
  ];

  /** "Since Oct 12.", when the trend dates the change inside the span. */
  const onset = f.trend?.onsetDate;
  const since = onset !== undefined && onset.isAfter(f.from) && !today ? say('since', { date: Fmt.shortDay(onset) }) : '';

  /**
   * The foods that drove it, with their shares ("Peanut butter (22%) and
   * crackers (18%) gave the most fat."), when no order names a food: the
   * orders then name the cause themselves.
   */
  const foodsCause = (slot: CoachPhrasingSlot, { shares = true }: { shares?: boolean } = {}) => {
    if (f.foods.length === 0 || ordersNameFood) return '';
    const names = f.foods.slice(0, 3).map((food) => `${foodInSentence(food.name)}${shares ? ` (${percent(food.share)})` : ''}`);
    return say(slot, { foods: listText(names) });
  };
  /** The top food's share of it: "Peanut butter gave 22% of it." On 1d, only when no order names the food already. */
  const topShare = () => {
    const top = f.foods[0];
    return top === undefined || (ordersNameFood && today) ? '' : say('causeFoodShare', { food: foodInSentence(top.name), share: percent(top.share) });
  };

  /** 1d's calorie line on a day over target, with what did it: "1,054 kcal over today", the meal, the worst food and the orders. */
  const overKcal = f.figures['overKcal'];
  const calorieLine =
    today && f.kind === 'fix' && (f.signal === 'calories' || f.signal === 'fatAgainstTarget') && overKcal !== undefined && f.cause !== undefined;

  switch (f.signal) {
    case 'partialDays':
      return [
        `${n('partialDays')} of ${n('loggedDays')} days partly logged`,
        `${say('leadPartialDays', { partial: `${n('partialDays')}`, logged: `${n('loggedDays')}` })} ${say('orderLogWhole')}`,
        evidence(['Days logged', `${n('loggedDays')}`], ['Partial days', `${n('partialDays')}`]),
      ];
    case 'estimatesRising': {
      const share = percent(x('estimatedShare'));
      return [
        `About ${share} of calories from estimates`,
        `${say('leadEstimates', { share })} ${say('orderWeigh')}`,
        evidence(['Fully logged days', `${n('wholeDays')}`], ['Calories from estimates', share]),
      ];
    }
    case 'loggingStyle': {
      const date = Fmt.shortDay(CalendarDate.fromEpochDay(n('onsetEpochDay')));
      return [`Logging changed around ${date}`, say('leadLoggingStyle', { date }), evidence(['Change', date])];
    }
    case 'left':
      return leftText();
    case 'saidBefore':
    case 'repeatOver':
    case 'adviceTaken':
      return followUpFindingText(f, fmt);
    case 'backToPlan':
      return [
        `Tomorrow: back to ${kcal('targetKcal')}`,
        advised.sentences.length > 0 ? body() : body(say('close', { target: Fmt.whole(x('targetKcal')) })),
        [period, ['Calories', kcal('kcal')], ['Target', kcal('targetKcal')], rule],
      ];
    case 'proteinMinimum':
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `Protein ${g('proteinG')}, minimum hit`,
            held(say('leadProteinHeld', { protein: g('proteinG'), minimum: g('minimumG') })),
            evidence(['Protein', g('proteinG')], ['Minimum', g('minimumG')]),
          ];
        }
        return [
          `Protein minimum met on ${n('metDays')} of ${n('judgedDays')} days`,
          held(say('leadProteinMinimumHeld', { met: `${n('metDays')}`, judged: `${n('judgedDays')}`, minimum: g('minimumG') })),
          evidence(['Days at or above the minimum', `${n('metDays')}`], ['Minimum', g('minimumG')]),
        ];
      }
      return [
        `Protein minimum met on ${n('metDays')} of ${n('judgedDays')} days`,
        body(
          say('leadProteinMinimum', { met: `${n('metDays')}`, judged: `${n('judgedDays')}`, short: `${roughAmount(x('averageShortfallG'))} g` }),
          since,
          foodsCause('causeFoodsLowProtein'),
        ),
        evidence(
          ['Days at or above the minimum', `${n('metDays')}`],
          ['Minimum', g('minimumG')],
          ['Average shortfall', g('averageShortfallG')],
        ),
      ];
    case 'proteinTarget':
      if (f.kind === 'holdingUp') {
        return [
          `Protein near target on ${n('closeDays')} of ${n('judgedDays')} days`,
          held(say('leadProteinTargetHeld', { target: g('targetG'), close: `${n('closeDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days near or over the target', `${n('closeDays')}`], ['Target', g('targetG')]),
        ];
      }
      return [
        `Protein averaged ${g('averageProteinG')} against ${g('targetG')}`,
        body(
          say('leadProteinTarget', { average: g('averageProteinG'), target: g('targetG'), short: `${n('shortDays')}`, judged: `${n('judgedDays')}` }),
          since,
          foodsCause('causeFoodsLowProtein'),
        ),
        evidence(['Average protein', g('averageProteinG')], ['Target', g('targetG')], ['Days 10% or more under', `${n('shortDays')}`]),
      ];
    case 'proteinByMeal': {
      if (f.kind === 'holdingUp') {
        return [
          `Protein in every main meal on ${days(n('spreadDays'))}`,
          held(say('leadProteinByMealHeld', { per: g('perMealG'), spread: `${n('spreadDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days', `${n('spreadDays')}`], ['Each meal', g('perMealG')]),
        ];
      }
      const meal = mealLabel(mealOf('meal'));
      return [
        `${meal} under 10 g protein on ${days(n('lowDays'))}`,
        body(say('leadProteinByMeal', { meal, low: `${n('lowDays')}`, missed: `${n('missedDays')}` }), foodsCause('causeFoodsLowProtein')),
        evidence(['Days under the minimum', `${n('missedDays')}`], [`${meal} under 10 g`, `${n('lowDays')}`]),
      ];
    }
    case 'proteinDensity':
      if (f.kind === 'holdingUp') {
        return [
          `${one('densityG')} g protein per 100 kcal`,
          held(say('leadDensityHeld', { density: `${one('densityG')} g`, required: `${one('requiredG')} g` })),
          evidence(['Protein per 100 kcal', `${one('densityG')} g`], ['Your targets need', `${one('requiredG')} g`]),
        ];
      }
      return [
        today ? `${g('proteinG')} protein in ${kcal('kcal')} so far` : `${one('densityG')} against ${one('requiredG')} g protein per 100 kcal`,
        body(say('leadDensity', { density: `${one('densityG')} g`, required: `${one('requiredG')} g` }), since, foodsCause('causeFoodsLowProtein')),
        evidence(
          ['Protein per 100 kcal', `${one('densityG')} g`],
          ['Your targets need', `${one('requiredG')} g`],
          ['Protein target', g('targetG')],
          ['Calorie target', kcal('targetKcal')],
        ),
      ];
    case 'fatAgainstTarget': {
      if (f.kind === 'holdingUp') {
        return [
          `Fat near target on ${n('withinDays')} of ${n('judgedDays')} days`,
          held(say('leadFatHeld', { target: g('targetFatG'), within: `${n('withinDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days within 15%', `${n('withinDays')}`], ['Fat target', g('targetFatG')]),
        ];
      }
      if (x('direction') === -1) {
        return [
          `Fat under minimum on ${n('lowDays')} of ${n('judgedDays')} days`,
          body(say('leadFatLow', { minimum: g('minimumFatG'), low: `${n('lowDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days under the minimum', `${n('lowDays')}`], ['Fat minimum', g('minimumFatG')]),
        ];
      }
      if (calorieLine) {
        return [`${Fmt.kcal(overKcal)} over today`, body(...coachCauseText(f)), evidence(['Fat', g('fatG')], ['Fat target', g('targetFatG')])];
      }
      if (today) {
        return [
          `Fat ${g('fatG')} so far, against ${g('targetFatG')}`,
          body(
            say('leadFatDay', { fat: g('fatG'), target: g('targetFatG') }),
            topShare(),
            x('densityLow') === 1 ? say('fatWhyDay', { protein: g('proteinG') }) : '',
          ),
          evidence(['Fat', g('fatG')], ['Fat target', g('targetFatG')]),
        ];
      }
      const reference = f.figures['proteinReference'];
      const short = x('proteinShortG');
      const why =
        reference === 0
          ? short >= 1
            ? say('fatWhyProtein', { short: `${roughAmount(short)} g` })
            : say('fatWhyProteinDays', { missed: `${n('proteinMissedDays')}`, judged: `${n('proteinJudgedDays')}` })
          : reference === 1
            ? say('fatWhyProteinTarget', { short: `${roughAmount(short)} g` })
            : say('fatWhyCalories', { above: `${n('caloriesAboveDays')}`, judged: `${n('caloriesJudgedDays')}` });
      return [
        `Fat averaged ${g('averageFatG')} against ${g('targetFatG')}`,
        body(say('leadFat', { average: g('averageFatG'), target: g('targetFatG') }), topShare(), why, since, coachCauseText(f).join(' ')),
        evidence(
          ['Average fat', g('averageFatG')],
          ['Fat target', g('targetFatG')],
          ['Days at 25% over or more', `${n('highDays')}`],
          ...(f.figures['fatShare.fatSharePercent'] === undefined
            ? []
            : [['Fat share of calories', `${n('fatShare.fatSharePercent')}% against ${n('fatShare.plannedFatSharePercent')}%`] as const]),
        ),
      ];
    }
    case 'fatShare':
      // Folded into fat against its target or the split, and not said alone (MM-606's N6); words in case it is.
      return [
        `Fat ${n('fatSharePercent')}% of calories, against ${n('plannedFatSharePercent')}%`,
        body(say('leadFatShare', { share: `${n('fatSharePercent')}%`, planned: `${n('plannedFatSharePercent')}%` })),
        evidence(['Fat share of calories', `${n('fatSharePercent')}%`], ['Planned', `${n('plannedFatSharePercent')}%`]),
      ];
    case 'carbohydrate':
      if (f.kind === 'holdingUp') {
        return [
          `Carbohydrate near target on ${n('withinDays')} of ${n('judgedDays')} days`,
          held(say('leadCarbohydrateHeld', { target: g('targetCarbsG'), within: `${n('withinDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days within 15%', `${n('withinDays')}`], ['Carbohydrate target', g('targetCarbsG')]),
        ];
      }
      return [
        `Carbohydrate under ${g('floorG')}, ${n('lowDays')} of ${n('judgedDays')} days`,
        body(say('leadCarbohydrate', { floor: g('floorG'), low: `${n('lowDays')}`, judged: `${n('judgedDays')}` }), since),
        evidence(['Days under the floor', `${n('lowDays')}`], ['Average carbohydrate', g('averageCarbsG')]),
      ];
    case 'macroSplit': {
      const shares = say('splitShares', {
        protein: `${n('proteinSharePercent')}%`,
        carbs: `${n('carbsSharePercent')}%`,
        fat: `${n('fatSharePercent')}%`,
        plannedProtein: `${n('plannedProteinSharePercent')}%`,
        plannedCarbs: `${n('plannedCarbsSharePercent')}%`,
        plannedFat: `${n('plannedFatSharePercent')}%`,
      });
      if (f.kind === 'holdingUp') {
        return ['Protein, carbohydrate and fat near the plan', held(`${say('leadSplitHeld')} ${shares}`), evidence()];
      }
      const largest = macroNames[n('largest')] ?? 'fat';
      const key = largest === 'protein' ? 'proteinSharePercent' : largest === 'carbohydrate' ? 'carbsSharePercent' : 'fatSharePercent';
      const planned = `planned${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      return [
        `${largest.charAt(0).toUpperCase()}${largest.slice(1)} ${n(key)}% of calories, against ${n(planned)}%`,
        body(
          say('leadSplit', { largest, share: `${n(key)}%`, planned: `${n(planned)}%` }),
          shares,
          foodsCause(largest === 'protein' ? 'causeFoodsLowProtein' : 'causeFoodsSplit'),
        ),
        evidence(['Protein', `${n('proteinSharePercent')}%`], ['Carbohydrate', `${n('carbsSharePercent')}%`], ['Fat', `${n('fatSharePercent')}%`]),
      ];
    }
    case 'calorieDensity': {
      if (f.kind === 'holdingUp') {
        const meal = mealLabel(mealOf('meal'));
        return [
          `${meal} mostly water-rich foods on ${days(n('waterRichDays'))}`,
          held(say('leadWaterRichHeld', { meal, days: days(n('waterRichDays')) })),
          evidence(['Days', `${n('waterRichDays')}`]),
        ];
      }
      const top = f.foods[0];
      const name = top?.name ?? 'A food you log';
      return [
        `${name}: ${one('kcalPerG')} kcal a gram`,
        body(
          say('leadCalorieDensity', {
            food: foodInSentence(name),
            kcalPerG: one('kcalPerG'),
            protein: `${one('proteinPer100Kcal')} g`,
            share: percent(top?.share ?? 0),
            days: days(top?.days ?? 0),
          }),
          say('calorieDenseVerdict'),
        ),
        evidence(['Calories per gram', one('kcalPerG')], ['Protein per 100 kcal', `${one('proteinPer100Kcal')} g`]),
      ];
    }
    case 'fiber': {
      const fiberEvidence: Evidence = today
        ? evidence(['Fiber', g('fiberG')], ['Guide', g('guideG')])
        : [
            period,
            ['Days counted', `${n('countedDays')}`],
            ...leftOut(n('countedDays'), undefined, 'fiber'),
            ['Average fiber', g('averageG')],
            ['Guide', g('guideG')],
            ...trendRows,
            rule,
          ];
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `Fiber ${g('fiberG')}, at the ${g('guideG')} guide`,
            held(say('leadFiberDayHeld', { fiber: g('fiberG'), guide: g('guideG') })),
            fiberEvidence,
          ];
        }
        return [`Fiber averaged ${g('averageG')}, at the guide`, held(say('leadFiberHeld', { average: g('averageG'), guide: g('guideG') })), fiberEvidence];
      }
      if (today) {
        return [
          `Fiber ${g('fiberG')} of ${g('guideG')}`,
          body(
            say('leadFiberDay', { fiber: g('fiberG'), guide: Fmt.whole(x('guideG')) }),
            say(x('fiberG') < x('guideG') / 2 ? 'fiberNoVegetables' : 'fiberFewVegetables'),
          ),
          fiberEvidence,
        ];
      }
      return [
        `Fiber averaged ${g('averageG')} against ${g('guideG')}`,
        body(say('leadFiber', { average: g('averageG'), guide: g('guideG') }), say('fiberWhy'), since),
        fiberEvidence,
      ];
    }
    case 'sodium': {
      const limit = Fmt.whole(x('limitMg'));
      if (f.kind === 'holdingUp') {
        return [
          `Sodium under limit on ${n('underDays')} of ${n('judgedDays')} days`,
          held(say('leadSodiumHeld', { limit: `${limit} mg`, under: `${n('underDays')}`, judged: `${n('judgedDays')}` })),
          evidence(...leftOut(n('judgedDays'), n('leftOutDays'), 'sodium'), ['Limit', `${limit} mg`]),
        ];
      }
      if (today) {
        const sodium = `${Fmt.whole(x('sodiumMg'))} mg`;
        const multiple = x('limitMg') > 0 ? x('sodiumMg') / x('limitMg') : 0;
        return [
          `Sodium ${sodium} so far, over ${limit} mg`,
          body(
            multiple >= 1.5
              ? say('leadSodiumMultiple', { sodium, multiple: `${toStringAsFixed(multiple, 1).replace(/\.0$/, '')}×`, limit })
              : say('leadSodiumOver', { sodium, limit: `${limit} mg` }),
            foodsCause('causeFoods', { shares: false }),
          ),
          evidence(['Sodium', sodium], ['Limit', `${limit} mg`]),
        ];
      }
      return [
        `Sodium over limit on ${n('overDays')} of ${n('judgedDays')} days`,
        body(say('leadSodium', { limit: `${limit} mg`, over: `${n('overDays')}`, judged: `${n('judgedDays')}` }), since, foodsCause('causeFoods')),
        evidence(...leftOut(n('judgedDays'), n('leftOutDays'), 'sodium'), ['Days over', `${n('overDays')}`], ['Limit', `${limit} mg`]),
      ];
    }
    case 'calories':
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `${kcal('kcal')}, within your target's band`,
            held(say('leadCaloriesDayHeld', { kcal: kcal('kcal'), target: kcal('targetKcal') })),
            evidence(['Calories', kcal('kcal')], ['Target', kcal('targetKcal')], bandRow()),
          ];
        }
        return [
          `Calories on target on ${n('withinDays')} of ${n('judgedDays')} days`,
          held(say('leadCaloriesHeld', { within: `${n('withinDays')}`, judged: `${n('judgedDays')}` })),
          evidence(['Days within the band', `${n('withinDays')}`], ['Target', kcal('targetKcal')], bandRow()),
        ];
      }
      if (calorieLine) {
        return [`${Fmt.kcal(overKcal)} over today`, body(...coachCauseText(f)), evidence(['Calories', kcal('kcal')], ['Target', kcal('targetKcal')], bandRow())];
      }
      if (today) {
        return [
          `${kcal('kcal')} so far, over the band`,
          body(say('leadCaloriesDay', { kcal: kcal('kcal'), target: kcal('targetKcal') }), foodsCause('causeFoodsCalories')),
          evidence(['Calories', kcal('kcal')], ['Target', kcal('targetKcal')], bandRow()),
        ];
      }
      if (x('direction') === -1) {
        return [
          `Calories below band on ${n('belowDays')} of ${n('judgedDays')} days`,
          body(
            say('leadCaloriesLow', { average: kcal('averageKcal'), target: kcal('targetKcal'), below: `${n('belowDays')}`, judged: `${n('judgedDays')}` }),
            say('caloriesLowWhy'),
            since,
          ),
          evidence(['Average', kcal('averageKcal')], ['Target', kcal('targetKcal')], bandRow(), ['Days under the band', `${n('belowDays')}`]),
        ];
      }
      return [
        `Calories above band on ${n('aboveDays')} of ${n('judgedDays')} days`,
        body(
          say('leadCalories', { above: `${n('aboveDays')}`, judged: `${n('judgedDays')}`, over: `${roughAmount(x('averageOverKcal'))} kcal` }),
          since,
          ...coachCauseText(f),
          foodsCause('causeFoodsCalories'),
        ),
        evidence(['Average', kcal('averageKcal')], ['Target', kcal('targetKcal')], bandRow(), ['Days over the band', `${n('aboveDays')}`]),
      ];
    case 'energyUse':
      return [
        'Intake close to your energy use',
        body(say(x('direction') === -1 ? 'leadEnergyUseLow' : 'leadEnergyUse', { average: kcal('averageKcal'), use: kcal('energyUseKcal') })),
        evidence(['Average intake', kcal('averageKcal')], ['Estimated energy use', `about ${kcal('energyUseKcal')}`]),
      ];
    case 'mealBalance': {
      const meal = mealLabel(mealOf('meal'));
      if (f.kind === 'holdingUp') {
        return [
          'Protein spread across your meals',
          held(say('leadMealBalanceHeld', { required: one('requiredG') })),
          evidence(['Your targets need', `${one('requiredG')} g per 100 kcal`]),
        ];
      }
      return [
        `${meal}: ${one('mealDensityG')} g protein per 100 kcal`,
        body(
          say('leadMealBalance', { meal, share: percent(x('mealShare')), density: `${one('mealDensityG')} g`, required: `${one('requiredG')} g` }),
          foodsCause('causeFoodsLowProtein'),
        ),
        evidence([`${meal} share of calories`, percent(x('mealShare'))], [`${meal} protein per 100 kcal`, `${one('mealDensityG')} g`]),
      ];
    }
    default:
      throw new StateError(`No words for the food signal ${f.signal}.`);
  }

  function leftText(): readonly [string, string, Evidence] {
    const proteinOnly = x('proteinOnly') === 1;
    const proteinShown = x('proteinShown') === 1;
    const kLeft = x('kcalLeft');
    const pLeft = x('proteinLeftG');
    const marked = n('marked');
    const fits = f.foods;
    const over = Fmt.kcal(-kLeft);
    /** The orders, or the lead alone when there are none. */
    const withOrders = (lead: string) => body(lead);
    const fitsLine = () => {
      if (fits.length === 0 || ordersNameFood) return '';
      const named = fits.map((food) => `${foodInSentence(food.name)} (${Fmt.grams(food.proteinG ?? 0)} protein, ${Fmt.kcal(food.kcal)})`);
      return say('leftFits', { foods: named.join(' or ') });
    };
    let title: string;
    let text: string;
    if (proteinOnly) {
      title = pLeft > 0 ? `${g('proteinLeftG')} protein left today` : `Protein ${g('proteinG')}, at your target`;
      text = pLeft > 0 ? withOrders(say('leftProtein', { protein: g('proteinLeftG') })) : body(say('leftProteinMet', { protein: g('proteinG') }));
    } else if (kLeft < 0) {
      title = `No calories left: ${over} over`;
      text = advised.sentences.length > 0 ? body() : body(say('leftOver', { over }));
    } else if (!proteinShown || pLeft <= 0) {
      title = kLeft > 0 ? (proteinShown ? `${kcal('kcalLeft')} left, protein at target` : `${kcal('kcalLeft')} left today`) : `${kcal('kcal')} logged, nothing left`;
      text = body(
        kLeft > 0
          ? proteinShown
            ? say('leftCaloriesProteinMet', { kcal: kcal('kcalLeft'), protein: g('proteinG') })
            : say('leftCalories', { kcal: kcal('kcalLeft') })
          : say('leftAtTarget', { kcal: kcal('kcal'), target: kcal('kcalTarget') }),
      );
    } else if (kLeft > 0) {
      title = `${g('proteinLeftG')} protein and ${kcal('kcalLeft')} left`;
      text = [withOrders(say('leftBoth', { protein: g('proteinLeftG'), kcal: kcal('kcalLeft') })), fitsLine()].filter((s) => s !== '').join(' ');
    } else {
      title = `${kcal('kcal')} logged, nothing left`;
      text = withOrders(say('leftAtTarget', { kcal: kcal('kcal'), target: kcal('kcalTarget') }));
    }
    if (marked !== 0) {
      const name = marked === 1 ? 'Refeed' : 'Day off';
      title = proteinOnly ? `${name} today` : `${name} today: ${kcal('kcal')} so far`;
      const totals = proteinOnly
        ? say('leftMarkedProtein', { protein: g('proteinG') })
        : say('leftMarkedTotals', { kcal: kcal('kcal'), protein: g('proteinG'), carbs: g('carbsG'), fat: g('fatG') });
      text = `${totals} ${text}`;
    }
    const rows: (readonly [string, string])[] = [period];
    if (!proteinOnly) rows.push(['Calories', `${kcal('kcal')} of ${kcal('kcalTarget')}`]);
    if (proteinShown) rows.push(['Protein', `${g('proteinG')} of ${g('proteinTargetG')}`]);
    for (const food of fits) rows.push([food.name, `${Fmt.grams(food.proteinG ?? 0)} protein, ${Fmt.kcal(food.kcal)}`]);
    rows.push(rule);
    return [title, text, rows];
  }
}
