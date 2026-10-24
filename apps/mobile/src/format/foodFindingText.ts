import { CalendarDate, Meal } from '../domain';
import type { CoachFinding, CoachFood } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { StateError } from '../lang/StateError';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { coachTradeText } from './coachTradeText';
import { Fmt } from './Fmt';
import { mealLabel } from './mealLabel';

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
};

const macroNames = ['protein', 'carbohydrate', 'fat'] as const;

/**
 * The fixed words of a food finding (MM-606, MM-612), filled from its own
 * figures: a title in numbers of eight words or fewer, the body (what was
 * observed against what, why it matters in a clause, and one trade or add
 * when there is one), and the numbers behind it as label and value pairs.
 *
 * The voice is MM-610's: about the food or the habit, never the person;
 * "calorie-dense for its protein", never a verdict; "more of" and "trade"
 * as the verbs; "about" on estimates; energy use, never a rate of burning.
 * Nothing praises eating under target (MM-92), and 1d never names another
 * day (MM-612).
 */
export function foodFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const x = (key: string) => f.figures[key] ?? 0;
  const n = (key: string) => roundHalfAwayFromZero(x(key)) + 0;
  const g = (key: string) => Fmt.grams(x(key));
  const kcal = (key: string) => Fmt.kcal(x(key));
  const one = (key: string) => toStringAsFixed(x(key), 1);
  const percent = (fraction: number) => `${roundHalfAwayFromZero(fraction * 100) + 0}%`;
  const today = f.span === 1;
  const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;
  const mealOf = (key: string) => {
    const meal = Meal.values[n(key)];
    if (meal === undefined) throw new StateError(`No meal is numbered ${n(key)}.`);
    return meal;
  };

  const period: readonly [string, string] = ['Period', today ? 'Today so far' : `${f.span} days through ${Fmt.shortDay(f.to)}`];
  const counted = (key = 'judgedDays'): readonly (readonly [string, string])[] =>
    today || f.figures[key] === undefined ? [] : [['Days counted', `${n(key)}`]];
  const foodRows = (foods: readonly CoachFood[]): readonly (readonly [string, string])[] =>
    foods.map((food) => [food.name, `${percent(food.share)} · ${days(food.days)}`] as const);
  const trendRows: readonly (readonly [string, string])[] = [
    ...((f.trend?.plannedDays ?? 0) > 0 ? [['Refeeds and days off counted', `${f.trend?.plannedDays ?? 0}`] as const] : []),
    ...(f.trend === undefined || f.trend.tier === 'silent' ? [] : [['Strength', f.trend.tier === 'strong' ? 'Strong' : 'Clear'] as const]),
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

  /** "since Oct 12", when the trend dates the change inside the span. */
  const onset = f.trend?.onsetDate;
  const since =
    onset !== undefined && onset.isAfter(f.from) && !today ? ` It has held since ${Fmt.shortDay(onset)}.` : '';

  /** The trade, or the add when there is calorie room and no trade, or nothing (the honest answer is "worth knowing"). */
  const action = (add: string | undefined) => {
    if (f.trade !== undefined) return ` ${coachTradeText(f.trade, { spanDays: n('tradeDays'), today })}`;
    return add !== undefined && x('calorieRoom') === 1 ? ` ${add}` : '';
  };
  const proteinAdd = 'Your calories have room for more of a protein food you log.';

  /** Up to three foods and their shares of what is named. */
  const foodsLine = (of: string) => {
    const [first, second, third] = f.foods;
    if (first === undefined) return '';
    if (second === undefined) return ` ${first.name} gave ${percent(first.share)} of ${of}.`;
    const listed = [first, second, ...(third === undefined ? [] : [third])].map((food) => `${food.name} (${percent(food.share)})`);
    return ` ${listed.slice(0, -1).join(', ')} and ${listed[listed.length - 1]} gave the largest shares of ${of}.`;
  };
  const lightOnProtein = 'the calories that carried little protein';

  switch (f.signal) {
    case 'partialDays':
      return [
        `${n('partialDays')} of ${n('loggedDays')} days partly logged`,
        `Of the ${n('loggedDays')} days you logged, ${n('partialDays')} were partial. Partial days are left out, so what ` +
          'your food is made of is not read from this span.',
        evidence(['Days logged', `${n('loggedDays')}`], ['Partial days', `${n('partialDays')}`]),
      ];
    case 'estimatesRising': {
      const share = percent(x('estimatedShare'));
      return [
        `About ${share} of calories from estimates`,
        `About ${share} of your calories on fully logged days came from estimates, so what your food is made of is ` +
          'not read from this span.',
        evidence(['Fully logged days', `${n('wholeDays')}`], ['Calories from estimates', share]),
      ];
    }
    case 'loggingStyle': {
      const date = Fmt.shortDay(CalendarDate.fromEpochDay(n('onsetEpochDay')));
      return [
        `Logging changed around ${date}`,
        `The way you log changed around ${date}. A change in intake beside it is read as a change in logging, not in eating.`,
        evidence(['Change', date]),
      ];
    }
    case 'left':
      return leftText();
    case 'proteinMinimum':
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `Protein ${g('proteinG')}, over your ${g('minimumG')} minimum`,
            `Protein so far today is ${g('proteinG')}, at or over your ${g('minimumG')} minimum.`,
            evidence(['Protein', g('proteinG')], ['Minimum', g('minimumG')]),
          ];
        }
        return [
          `Protein minimum met on ${n('metDays')} of ${n('judgedDays')} days`,
          `Protein reached ${g('minimumG')} or more on ${n('metDays')} of ${n('judgedDays')} days.`,
          evidence(['Days at or above the minimum', `${n('metDays')}`], ['Minimum', g('minimumG')]),
        ];
      }
      return [
        `Protein minimum met on ${n('metDays')} of ${n('judgedDays')} days`,
        `Protein reached your ${g('minimumG')} minimum on ${n('metDays')} of the ${n('judgedDays')} days you logged in ` +
          `full; on the other days it was about ${g('averageShortfallG')} short.${since}${foodsLine(lightOnProtein)}` +
          action(proteinAdd),
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
          `Protein was within 5% of your ${g('targetG')} target, or over it, on ${n('closeDays')} of ${n('judgedDays')} days.`,
          evidence(['Days near or over the target', `${n('closeDays')}`], ['Target', g('targetG')]),
        ];
      }
      return [
        `Protein averaged ${g('averageProteinG')} against ${g('targetG')}`,
        `Protein averaged ${g('averageProteinG')} against your ${g('targetG')} target, and was 10% or more under it on ` +
          `${n('shortDays')} of ${n('judgedDays')} days.${since}${foodsLine(lightOnProtein)}${action(proteinAdd)}`,
        evidence(['Average protein', g('averageProteinG')], ['Target', g('targetG')], ['Days 10% or more under', `${n('shortDays')}`]),
      ];
    case 'proteinByMeal': {
      if (f.kind === 'holdingUp') {
        return [
          `Protein in every main meal on ${days(n('spreadDays'))}`,
          `Breakfast, lunch and dinner each carried ${g('perMealG')} of protein or more on ${n('spreadDays')} of ` +
            `${n('judgedDays')} days.`,
          evidence(['Days', `${n('spreadDays')}`], ['Each meal', g('perMealG')]),
        ];
      }
      const meal = mealLabel(mealOf('meal'));
      return [
        `${meal} under 10 g protein on ${days(n('lowDays'))}`,
        `On ${n('lowDays')} of the ${n('missedDays')} days protein was under your minimum, ${meal.toLowerCase()} had ` +
          `under 10 g of protein.${foodsLine(lightOnProtein)}${action(proteinAdd)}`,
        evidence(['Days under the minimum', `${n('missedDays')}`], [`${meal} under 10 g`, `${n('lowDays')}`]),
      ];
    }
    case 'proteinDensity':
      if (f.kind === 'holdingUp') {
        return [
          `${one('densityG')} g protein per 100 kcal`,
          `Your days carried ${one('densityG')} g of protein per 100 kcal, at or above the ${one('requiredG')} g your ` +
            'targets need, with protein at target.',
          evidence(['Protein per 100 kcal', `${one('densityG')} g`], ['Your targets need', `${one('requiredG')} g`]),
        ];
      }
      return [
        `${one('densityG')} against ${one('requiredG')} g protein per 100 kcal`,
        (today
          ? `So far today: ${kcal('kcal')} with ${g('proteinG')} protein, ${one('densityG')} g per 100 kcal. Reaching ` +
            `${g('targetG')} within ${kcal('targetKcal')} takes about ${one('requiredG')} g per 100 kcal.`
          : `Your days carried ${one('densityG')} g of protein per 100 kcal. Reaching ${g('targetG')} within ` +
            `${kcal('targetKcal')} takes about ${one('requiredG')} g, so some calories went to foods with little protein.`) +
          `${since}${foodsLine(lightOnProtein)}${action(proteinAdd)}`,
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
          `Fat was within 15% of your ${g('targetFatG')} target on ${n('withinDays')} of ${n('judgedDays')} days.`,
          evidence(['Days within 15%', `${n('withinDays')}`], ['Fat target', g('targetFatG')]),
        ];
      }
      if (x('direction') === -1) {
        return [
          `Fat under minimum on ${n('lowDays')} of ${n('judgedDays')} days`,
          `Fat was under the ${g('minimumFatG')} minimum on ${n('lowDays')} of ${n('judgedDays')} days. A fat food ` +
            'added to a meal would bring those days to it.',
          evidence(['Days under the minimum', `${n('lowDays')}`], ['Fat minimum', g('minimumFatG')]),
        ];
      }
      const top = f.foods[0];
      const supplied = top === undefined ? '' : `; ${top.name} supplied ${percent(top.share)} of it`;
      if (today) {
        const why =
          x('densityLow') === 1
            ? 'Fat carries 9 kcal a gram, so those calories went to fat instead of protein.'
            : 'Fat carries 9 kcal a gram; calories today are over the band around your target.';
        return [
          `Fat ${g('fatG')} so far, against ${g('targetFatG')}`,
          `Fat today is ${g('fatG')} against ${g('targetFatG')}${supplied}. ${why}${action(undefined)}`,
          evidence(['Fat', g('fatG')], ['Fat target', g('targetFatG')]),
        ];
      }
      const reference = f.figures['proteinReference'];
      const short = x('proteinShortG');
      const why =
        reference === 0
          ? short >= 1
            ? `Fat carries 9 kcal a gram, so those calories went to fat instead of protein, which averaged ${g('proteinShortG')} under your minimum.`
            : `Fat carries 9 kcal a gram, so those calories went to fat instead of protein, which fell short of your ` +
              `minimum on ${n('proteinMissedDays')} of ${n('proteinJudgedDays')} days.`
          : reference === 1
            ? `Fat carries 9 kcal a gram, so those calories went to fat instead of protein, which averaged ${g('proteinShortG')} under your target.`
            : `Fat carries 9 kcal a gram; calories were over the band on ${n('caloriesAboveDays')} of ${n('caloriesJudgedDays')} days.`;
      return [
        `Fat averaged ${g('averageFatG')} against ${g('targetFatG')}`,
        `Fat averaged ${g('averageFatG')} against ${g('targetFatG')}${supplied}. ${why}${since}${action(undefined)}`,
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
        `Fat gave ${n('fatSharePercent')}% of your calories; your targets plan ${n('plannedFatSharePercent')}%.`,
        evidence(['Fat share of calories', `${n('fatSharePercent')}%`], ['Planned', `${n('plannedFatSharePercent')}%`]),
      ];
    case 'carbohydrate':
      if (f.kind === 'holdingUp') {
        return [
          `Carbohydrate near target on ${n('withinDays')} of ${n('judgedDays')} days`,
          `Carbohydrate was within 15% of your ${g('targetCarbsG')} target on ${n('withinDays')} of ${n('judgedDays')} days.`,
          evidence(['Days within 15%', `${n('withinDays')}`], ['Carbohydrate target', g('targetCarbsG')]),
        ];
      }
      return [
        `Carbohydrate under ${g('floorG')}, ${n('lowDays')} of ${n('judgedDays')} days`,
        `Carbohydrate was under ${g('floorG')} on ${n('lowDays')} of ${n('judgedDays')} days; the balance you chose keeps ` +
          `it at ${g('floorG')} or more. A carbohydrate food added to a meal would bring it up.${since}`,
        evidence(['Days under the floor', `${n('lowDays')}`], ['Average carbohydrate', g('averageCarbsG')]),
      ];
    case 'macroSplit': {
      const shares = `${n('proteinSharePercent')}% came from protein, ${n('carbsSharePercent')}% from carbohydrate and ` +
        `${n('fatSharePercent')}% from fat; your targets plan ${n('plannedProteinSharePercent')}%, ` +
        `${n('plannedCarbsSharePercent')}% and ${n('plannedFatSharePercent')}%.`;
      if (f.kind === 'holdingUp') {
        return [
          'Protein, carbohydrate and fat near the plan',
          `Protein, carbohydrate and fat were each within 5 points of the split your targets plan: ${shares}`,
          evidence(),
        ];
      }
      const largest = macroNames[n('largest')] ?? 'fat';
      const key = largest === 'protein' ? 'proteinSharePercent' : largest === 'carbohydrate' ? 'carbsSharePercent' : 'fatSharePercent';
      const planned = `planned${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      const of = largest === 'protein' ? lightOnProtein : `the ${largest}`;
      return [
        `${largest.charAt(0).toUpperCase()}${largest.slice(1)} ${n(key)}% of calories, against ${n(planned)}%`,
        `Of your calories, ${shares}${foodsLine(of)}${action(undefined)}`,
        evidence(['Protein', `${n('proteinSharePercent')}%`], ['Carbohydrate', `${n('carbsSharePercent')}%`], ['Fat', `${n('fatSharePercent')}%`]),
      ];
    }
    case 'calorieDensity': {
      if (f.kind === 'holdingUp') {
        const meal = mealLabel(mealOf('meal'));
        return [
          `${meal} mostly water-rich foods on ${days(n('waterRichDays'))}`,
          `${meal} was mostly water-rich foods, under 0.6 kcal a gram, on ${n('waterRichDays')} days.`,
          evidence(['Days', `${n('waterRichDays')}`]),
        ];
      }
      const top = f.foods[0];
      const name = top?.name ?? 'A food you log';
      return [
        `${name}: ${one('kcalPerG')} kcal a gram`,
        `${name} on ${days(top?.days ?? 0)}, at ${one('kcalPerG')} kcal a gram and ${one('proteinPer100Kcal')} g of ` +
          `protein per 100 kcal, gave ${percent(top?.share ?? 0)} of your calories. It is calorie-dense for its protein.` +
          action(undefined),
        evidence(['Calories per gram', one('kcalPerG')], ['Protein per 100 kcal', `${one('proteinPer100Kcal')} g`]),
      ];
    }
    case 'fiber': {
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `Fiber ${g('fiberG')}, at the ${g('guideG')} guide`,
            `Fiber so far today is ${g('fiberG')}, at or above the ${g('guideG')} guide.`,
            evidence(['Fiber', g('fiberG')], ['Guide', g('guideG')]),
          ];
        }
        return [
          `Fiber averaged ${g('averageG')}, at the guide`,
          `On the ${n('countedDays')} days with enough fiber data, fiber averaged ${g('averageG')}, at or above the ` +
            `${g('guideG')} guide.`,
          evidence(['Days with enough fiber data', `${n('countedDays')}`], ['Guide', g('guideG')]),
        ];
      }
      const names = f.foods.map((food) => food.name);
      const listed =
        names.length < 2 ? '' : ` Some you already log: ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`;
      return [
        `Fiber averaged ${g('averageG')} against ${g('guideG')}`,
        `On the ${n('countedDays')} days with enough fiber data, fiber averaged about ${g('averageG')} against a guide ` +
          `of ${g('guideG')}. More fiber and bulkier foods usually make a deficit easier: they fill you up for the same ` +
          `calories.${listed}`,
        [period, ['Days with enough fiber data', `${n('countedDays')}`], ['Average fiber', g('averageG')], ['Guide', g('guideG')], ...trendRows, rule],
      ];
    }
    case 'sodium':
      if (f.kind === 'holdingUp') {
        return [
          `Sodium under limit on ${n('underDays')} of ${n('judgedDays')} days`,
          `Sodium was under your limit of ${Fmt.whole(x('limitMg'))} mg on ${n('underDays')} of ${n('judgedDays')} days ` +
            'with enough sodium data.',
          evidence(['Limit', `${Fmt.whole(x('limitMg'))} mg`]),
        ];
      }
      if (today) {
        return [
          `Sodium ${Fmt.whole(x('sodiumMg'))} mg so far, over ${Fmt.whole(x('limitMg'))} mg`,
          `Sodium today is ${Fmt.whole(x('sodiumMg'))} mg so far, over your limit of ${Fmt.whole(x('limitMg'))} mg.` +
            `${foodsLine('it')}${action(undefined)}`,
          evidence(['Sodium', `${Fmt.whole(x('sodiumMg'))} mg`], ['Limit', `${Fmt.whole(x('limitMg'))} mg`]),
        ];
      }
      return [
        `Sodium over limit on ${n('overDays')} of ${n('judgedDays')} days`,
        `Sodium was over your limit of ${Fmt.whole(x('limitMg'))} mg on ${n('overDays')} of ${n('judgedDays')} days with ` +
          `enough sodium data.${since}${foodsLine('it')}${action(undefined)}`,
        evidence(['Days over', `${n('overDays')}`], ['Days left out', `${n('leftOutDays')}`], ['Limit', `${Fmt.whole(x('limitMg'))} mg`]),
      ];
    case 'calories':
      if (f.kind === 'holdingUp') {
        if (today) {
          return [
            `${kcal('kcal')}, within your target's band`,
            `Today so far is ${kcal('kcal')}, within the band around your ${kcal('targetKcal')} target.`,
            evidence(['Calories', kcal('kcal')], ['Target', kcal('targetKcal')]),
          ];
        }
        return [
          `Calories on target on ${n('withinDays')} of ${n('judgedDays')} days`,
          `Calories were within the band around your target on ${n('withinDays')} of ${n('judgedDays')} days.`,
          evidence(['Days within the band', `${n('withinDays')}`]),
        ];
      }
      if (today) {
        return [
          `${kcal('kcal')} so far, over the band`,
          `Today so far is ${kcal('kcal')}, over the band around your ${kcal('targetKcal')} target.` +
            `${foodsLine('the calories')}${action(undefined)}`,
          evidence(['Calories', kcal('kcal')], ['Target', kcal('targetKcal')]),
        ];
      }
      if (x('direction') === -1) {
        return [
          `Calories below band on ${n('belowDays')} of ${n('judgedDays')} days`,
          `Calories averaged ${kcal('averageKcal')} against your ${kcal('targetKcal')} target, and were under the band ` +
            `around it on ${n('belowDays')} of ${n('judgedDays')} days. A lean gain runs on the planned surplus; more of a ` +
            `food you log would bring those days to target.${since}`,
          evidence(['Average', kcal('averageKcal')], ['Target', kcal('targetKcal')], ['Days under the band', `${n('belowDays')}`]),
        ];
      }
      return [
        `Calories above band on ${n('aboveDays')} of ${n('judgedDays')} days`,
        `Calories averaged ${kcal('averageKcal')} against your ${kcal('targetKcal')} target, and were over the band around ` +
          `it on ${n('aboveDays')} of ${n('judgedDays')} days, by about ${kcal('averageOverKcal')} on those days.` +
          `${since}${foodsLine('the calories')}${action(undefined)}`,
        evidence(['Average', kcal('averageKcal')], ['Target', kcal('targetKcal')], ['Days over the band', `${n('aboveDays')}`]),
      ];
    case 'energyUse':
      return [
        'Intake close to your energy use',
        x('direction') === -1
          ? `By your log, intake averaged ${kcal('averageKcal')}; the app estimates you use about ${kcal('energyUseKcal')}, ` +
            'so there is little or no surplus.'
          : `By your log, intake averaged ${kcal('averageKcal')}, close to the ${kcal('energyUseKcal')} the app estimates ` +
            'you use.',
        evidence(['Average intake', kcal('averageKcal')], ['Estimated energy use', `about ${kcal('energyUseKcal')}`]),
      ];
    case 'mealBalance': {
      const meal = mealLabel(mealOf('meal'));
      if (f.kind === 'holdingUp') {
        return [
          'Protein spread across your meals',
          'Each meal that gives a quarter or more of your calories carried at least 70% of the ' +
            `${one('requiredG')} g of protein per 100 kcal your targets need.`,
          evidence(['Your targets need', `${one('requiredG')} g per 100 kcal`]),
        ];
      }
      return [
        `${meal}: ${one('mealDensityG')} g protein per 100 kcal`,
        `${meal} gave ${percent(x('mealShare'))} of your calories at ${one('mealDensityG')} g of protein per 100 kcal; ` +
          `your targets need about ${one('requiredG')} g across the day.${foodsLine(lightOnProtein)}${action(proteinAdd)}`,
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
    const fitRow = (food: CoachFood) => `${food.name} (${Fmt.grams(food.proteinG ?? 0)}, ${Fmt.kcal(food.kcal)})`;
    const fitsLine =
      fits.length === 0
        ? ''
        : fits.length === 1
          ? ` Your usual ${fitRow(fits[0] as CoachFood)} fits.`
          : ` Your usual ${fits.map(fitRow).join(' or ')} fits.`;
    const proteinLine = pLeft > 0 ? `${g('proteinLeftG')} of protein left` : `Protein is ${g('proteinG')}, at or over your ${g('proteinTargetG')} target`;
    let title: string;
    let body: string;
    if (proteinOnly) {
      title = pLeft > 0 ? `${g('proteinLeftG')} protein left today` : `Protein ${g('proteinG')}, at your target`;
      body = `${proteinLine} today.`;
    } else if (!proteinShown) {
      title = kLeft > 0 ? `${kcal('kcalLeft')} left today` : `${kcal('kcal')} logged today`;
      body = kLeft > 0 ? `${kcal('kcalLeft')} left today.` : `${kcal('kcal')} logged today, against your ${kcal('kcalTarget')} target.`;
    } else if (kLeft > 0 && pLeft > 0) {
      title = `${g('proteinLeftG')} protein and ${kcal('kcalLeft')} left`;
      body = `${g('proteinLeftG')} protein and ${kcal('kcalLeft')} left today.${fitsLine}`;
    } else if (kLeft > 0) {
      title = `${kcal('kcalLeft')} left, protein at target`;
      body = `${kcal('kcalLeft')} left today. ${proteinLine}.`;
    } else {
      title = `${kcal('kcal')} logged today`;
      body = `${kcal('kcal')} logged today, against your ${kcal('kcalTarget')} target. ${proteinLine}.`;
    }
    if (marked !== 0) {
      const name = marked === 1 ? 'Refeed' : 'Day off';
      title = proteinOnly ? `${name} today` : `${name} today: ${kcal('kcal')} so far`;
      const totals = proteinOnly
        ? `Logged so far: ${g('proteinG')} protein.`
        : `Logged so far: ${kcal('kcal')}, ${g('proteinG')} protein, ${g('carbsG')} carbohydrate and ${g('fatG')} fat.`;
      body = `${totals} ${body}`;
    }
    const rows: (readonly [string, string])[] = [period];
    if (!proteinOnly) rows.push(['Calories', `${kcal('kcal')} of ${kcal('kcalTarget')}`]);
    if (proteinShown) rows.push(['Protein', `${g('proteinG')} of ${g('proteinTargetG')}`]);
    for (const food of fits) rows.push([food.name, `${Fmt.grams(food.proteinG ?? 0)}, ${Fmt.kcal(food.kcal)}`]);
    rows.push(rule);
    return [title, body, rows];
  }
}
