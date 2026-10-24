import type { CalendarDate } from '../../../domain/CalendarDate';
import { FiberDay } from '../../../domain/food/fiber/FiberDay';
import { fiberGuideG } from '../../../domain/food/fiber/fiberGuideG';
import { SodiumDay } from '../../../domain/food/micros/SodiumDay';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { GoalMode } from '../../../domain/GoalMode';
import { Meal } from '../../../domain/Meal';
import { CalorieBand } from '../../CalorieBand';
import { fiberInsight } from '../../fiberInsight';
import type { TargetsRecord } from '../../TargetsRecord';
import { medianOf } from '../../trends/medianOf';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachFood } from '../CoachFood';
import { countsAsFood } from './countsAsFood';
import { entryGramsOf } from './entryGramsOf';
import type { FoodAnalysisInput } from './FoodAnalysisInput';
import type { FoodDay } from './FoodDay';
import { foodKeyOf } from './foodKeyOf';
import type { FoodSignalId } from './FoodSignalId';
import type { FoodSignalReading } from './FoodSignalReading';
import { FoodSignalRule } from './FoodSignalRule';

/** A judged day: whole, with targets in force. */
type Judged = FoodDay & { readonly record: TargetsRecord; readonly kcalTarget: number; readonly intake: NonNullable<FoodDay['intake']> };

const mainMeals: readonly Meal[] = ['breakfast', 'lunch', 'dinner'];
const R = FoodSignalRule;

const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);
const mean = (values: readonly number[]) => (values.length === 0 ? 0 : sum(values) / values.length);
const share = (count: number, of: number) => (of === 0 ? 0 : count / of);
const requiredOf = (d: Judged) => (100 * d.record.targets.proteinG) / d.record.targets.kcal;
const proteinIn = (entries: readonly FoodEntry[], meal: Meal) => sum(entries.filter((e) => e.meal === meal).map((e) => e.proteinG));

const reading = (
  signal: FoodSignalId,
  figures: Record<string, number>,
  change: TrendDirection | undefined,
  holdingUp: boolean,
  { foods, meal }: { foods?: readonly CoachFood[]; meal?: Meal } = {},
): FoodSignalReading => ({ signal, figures, change, holdingUp, foods, meal });

/**
 * MM-606's level rules over a span's judged days, one reading per signal
 * (`FoodSignalReading`). Each day is judged against its own targets
 * (`FoodDay.record`), and its calories against its own planned target. The
 * columns of the ticket's table are read as written; the gates between
 * signals ("only when N1 is in change", "gated as above") are not applied
 * here, since a signal is also in change when the trend engine finds it so.
 *
 * `from` and `to` bound the span; `days` are its judged days (whole, with
 * targets); `goal` is the goal in force on `to`.
 */
export function readFoodSignals({
  input,
  days,
  from,
  to,
  goal,
}: {
  input: FoodAnalysisInput;
  days: readonly FoodDay[];
  from: CalendarDate;
  to: CalendarDate;
  goal: GoalMode;
}): ReadonlyMap<FoodSignalId, FoodSignalReading> {
  const judged = days.filter(
    (d): d is Judged => d.whole && d.record !== undefined && d.kcalTarget !== undefined && d.intake !== undefined,
  );
  const n = judged.length;
  const found = new Map<FoodSignalId, FoodSignalReading>();
  const put = (r: FoodSignalReading) => found.set(r.signal, r);
  const kcal = judged.map((d) => d.intake.kcal);
  const kcalTotal = sum(kcal);
  const entries = judged.flatMap((d) => d.entries);
  const bandOk = mean(kcal) >= mean(judged.map((d) => new CalorieBand(d.kcalTarget).lowKcal));
  const underBand = mean(kcal) < mean(judged.map((d) => new CalorieBand(d.kcalTarget).lowKcal));

  // N1: the protein minimum.
  const withMinimum = judged.filter((d) => d.record.targets.proteinMinimumG !== undefined);
  const minimumOf = (d: Judged) => d.record.targets.proteinMinimumG as number;
  const missed = withMinimum.filter((d) => d.intake.proteinG < minimumOf(d));
  const met = withMinimum.length - missed.length;
  if (withMinimum.length >= R.minimumJudgedDays) {
    put(
      reading(
        'proteinMinimum',
        {
          judgedDays: withMinimum.length,
          metDays: met,
          minimumG: mean(withMinimum.map(minimumOf)),
          averageProteinG: mean(withMinimum.map((d) => d.intake.proteinG)),
          averageShortfallG: mean(missed.map((d) => minimumOf(d) - d.intake.proteinG)),
        },
        share(met, withMinimum.length) < R.proteinMinimumChangeShare ? 'down' : undefined,
        share(met, withMinimum.length) >= R.proteinMinimumHoldingShare,
      ),
    );
  }

  // N2: the gap to the protein target, where the target stands well above the minimum.
  const withTarget = withMinimum.filter((d) => d.record.targets.proteinG >= minimumOf(d) + R.proteinTargetAboveMinimumG);
  if (withTarget.length >= R.minimumJudgedDays) {
    const short = withTarget.filter((d) => d.intake.proteinG <= (1 - R.proteinTargetShortFraction) * d.record.targets.proteinG);
    const close = withTarget.filter((d) => d.intake.proteinG >= (1 - R.proteinTargetHoldingFraction) * d.record.targets.proteinG);
    put(
      reading(
        'proteinTarget',
        {
          judgedDays: withTarget.length,
          shortDays: short.length,
          closeDays: close.length,
          targetG: mean(withTarget.map((d) => d.record.targets.proteinG)),
          averageProteinG: mean(withTarget.map((d) => d.intake.proteinG)),
          averageGapG: mean(short.map((d) => d.record.targets.proteinG - d.intake.proteinG)),
        },
        share(short.length, withTarget.length) >= R.proteinTargetChangeShare ? 'down' : undefined,
        share(close.length, withTarget.length) >= R.proteinTargetHoldingShare,
      ),
    );
  }

  // N3: protein by meal. A day without entries says nothing of its meals.
  const withEntries = judged.filter((d) => d.entries.length > 0);
  const missedWithEntries = missed.filter((d) => d.entries.length > 0);
  if (withEntries.length >= R.minimumJudgedDays) {
    const lowMeal = mainMeals
      .map((meal) => ({ meal, low: missedWithEntries.filter((d) => proteinIn(d.entries, meal) < R.mealAlmostNoneG).length }))
      .find((m) => m.low * 2 > missedWithEntries.length && missedWithEntries.length > 0);
    const perMealG = input.weightKg === undefined ? undefined : R.mealHoldingGPerKg * input.weightKg;
    const spread =
      perMealG === undefined ? 0 : withEntries.filter((d) => mainMeals.every((meal) => proteinIn(d.entries, meal) >= perMealG)).length;
    put(
      reading(
        'proteinByMeal',
        {
          judgedDays: withEntries.length,
          missedDays: missedWithEntries.length,
          lowDays: lowMeal?.low ?? 0,
          meal: lowMeal === undefined ? -1 : Meal.values.indexOf(lowMeal.meal),
          perMealG: perMealG ?? 0,
          spreadDays: spread,
        },
        lowMeal === undefined ? undefined : 'down',
        perMealG !== undefined && share(spread, withEntries.length) >= R.mealHoldingShare,
        lowMeal === undefined ? {} : { meal: lowMeal.meal },
      ),
    );
  }

  if (n < R.minimumJudgedDays) return found;
  const proteinTotal = sum(judged.map((d) => d.intake.proteinG));
  const requiredG = mean(judged.map(requiredOf));

  // N4: protein per 100 kcal against what the targets need, with calories within or above the band.
  const densityG = kcalTotal > 0 ? (100 * proteinTotal) / kcalTotal : 0;
  const targetG = mean(judged.map((d) => d.record.targets.proteinG));
  put(
    reading(
      'proteinDensity',
      {
        judgedDays: n,
        densityG,
        requiredG,
        targetG,
        targetKcal: mean(judged.map((d) => d.record.targets.kcal)),
        averageKcal: mean(kcal),
        bandOk: bandOk ? 1 : 0,
      },
      densityG < R.densityChangeShareOfRequired * requiredG && bandOk ? 'down' : undefined,
      densityG >= requiredG && mean(judged.map((d) => d.intake.proteinG)) >= R.densityHoldingProteinShare * targetG,
    ),
  );

  // N5: fat against its target, and under the fat minimum.
  const fatTargetOf = (d: Judged) => d.record.targets.fatG;
  const high = judged.filter((d) => d.intake.fatG >= Math.max(R.fatHighMultiple * fatTargetOf(d), fatTargetOf(d) + R.fatHighOverG));
  const fatMinimum = input.fatMinimumG;
  const low = fatMinimum === undefined ? [] : judged.filter((d) => d.intake.fatG < fatMinimum(d.kcalTarget));
  const fatWithin = judged.filter((d) => Math.abs(d.intake.fatG - fatTargetOf(d)) <= R.fatHoldingFraction * fatTargetOf(d));
  put(
    reading(
      'fatAgainstTarget',
      {
        judgedDays: n,
        highDays: high.length,
        lowDays: low.length,
        withinDays: fatWithin.length,
        averageFatG: mean(judged.map((d) => d.intake.fatG)),
        targetFatG: mean(judged.map(fatTargetOf)),
        minimumFatG: fatMinimum === undefined ? 0 : mean(judged.map((d) => fatMinimum(d.kcalTarget))),
      },
      share(high.length, n) >= R.fatHighShare ? 'up' : share(low.length, n) >= R.fatLowShare ? 'down' : undefined,
      share(fatWithin.length, n) >= R.fatHoldingShare,
    ),
  );

  // N6: fat's share of calories against the share planned.
  const fatSharePercent = kcalTotal > 0 ? (900 * sum(judged.map((d) => d.intake.fatG))) / kcalTotal : 0;
  const plannedFatSharePercent = mean(judged.map((d) => (900 * d.record.targets.fatG) / d.record.targets.kcal));
  put(
    reading(
      'fatShare',
      { judgedDays: n, fatSharePercent, plannedFatSharePercent },
      fatSharePercent >= plannedFatSharePercent + R.fatSharePointsOver && fatSharePercent > R.fatShareCeilingPercent ? 'up' : undefined,
      false,
    ),
  );

  // N7: carbohydrate under the floor a chosen balance keeps; holding up near its target.
  const floorKept = input.balance !== undefined && !input.balance.carbFloorOff;
  const carbLow = judged.filter((d) => d.intake.carbsG < R.carbFloorG);
  const carbWithin = judged.filter(
    (d) => Math.abs(d.intake.carbsG - d.record.targets.carbsG) <= R.carbHoldingFraction * d.record.targets.carbsG,
  );
  put(
    reading(
      'carbohydrate',
      {
        judgedDays: n,
        lowDays: carbLow.length,
        withinDays: carbWithin.length,
        floorG: R.carbFloorG,
        averageCarbsG: mean(judged.map((d) => d.intake.carbsG)),
        targetCarbsG: mean(judged.map((d) => d.record.targets.carbsG)),
      },
      floorKept && share(carbLow.length, n) >= R.carbLowShare ? 'down' : undefined,
      share(carbWithin.length, n) >= R.carbHoldingShare,
    ),
  );

  // N8: the split. Shares of the span's calories against the shares its targets plan.
  const targetKcalTotal = sum(judged.map((d) => d.record.targets.kcal));
  const actual = [
    (400 * proteinTotal) / kcalTotal,
    (400 * sum(judged.map((d) => d.intake.carbsG))) / kcalTotal,
    fatSharePercent,
  ];
  const planned = [
    (400 * sum(judged.map((d) => d.record.targets.proteinG))) / targetKcalTotal,
    (400 * sum(judged.map((d) => d.record.targets.carbsG))) / targetKcalTotal,
    (900 * sum(judged.map((d) => d.record.targets.fatG))) / targetKcalTotal,
  ];
  if (kcalTotal > 0 && targetKcalTotal > 0) {
    const off = actual.map((a, i) => a - (planned[i] as number));
    const largest = off.reduce((best, o, i) => (Math.abs(o) > Math.abs(off[best] as number) ? i : best), 0);
    const largestOff = off[largest] as number;
    put(
      reading(
        'macroSplit',
        {
          judgedDays: n,
          proteinSharePercent: actual[0] as number,
          carbsSharePercent: actual[1] as number,
          fatSharePercent: actual[2] as number,
          plannedProteinSharePercent: planned[0] as number,
          plannedCarbsSharePercent: planned[1] as number,
          plannedFatSharePercent: planned[2] as number,
          largest,
          largestOff,
        },
        Math.abs(largestOff) >= R.splitChangePoints && (off[0] as number) < 0 ? (largestOff > 0 ? 'up' : 'down') : undefined,
        off.every((o) => Math.abs(o) <= R.splitHoldingPoints),
      ),
    );
  }

  // N9: calorie-dense foods light on protein; not on lean gain under target.
  const dense = denseFoods(entries, kcalTotal);
  const waterRich = waterRichMeal(judged);
  put(
    reading(
      'calorieDensity',
      {
        judgedDays: n,
        kcalPerG: dense[0]?.kcalPerG ?? 0,
        proteinPer100Kcal: dense[0]?.proteinPer100Kcal ?? 0,
        waterRichDays: waterRich?.days ?? 0,
        meal: waterRich === undefined ? -1 : Meal.values.indexOf(waterRich.meal),
      },
      dense.length > 0 && !(goal === 'leanGain' && underBand) ? 'up' : undefined,
      waterRich !== undefined,
      { foods: dense.map((d) => d.food), ...(waterRich === undefined ? {} : { meal: waterRich.meal }) },
    ),
  );

  // N12: fiber, as MM-126, and the guide met on average.
  const recordAtEnd = judged[judged.length - 1]?.record;
  if (input.fiber !== undefined && recordAtEnd !== undefined) {
    const counted = judged.map((d) => FiberDay.of(d.entries)).filter((f) => f.enough);
    const averageG = mean(counted.map((f) => f.totalG));
    const guideG = fiberGuideG({ kcalTarget: recordAtEnd.targets.kcal, sex: input.fiber.sex });
    const insight = fiberInsight({
      pattern: { ...input.fiber, days: new Map(judged.map((d) => [d.date, d.entries] as const)) },
      whole: judged.map((d) => d.intake),
      from,
      through: to,
      current: recordAtEnd,
    });
    const fiberTotal = sum(entries.map((e) => e.fiberG ?? 0));
    const examples = (insight?.examples ?? []).map((name): CoachFood => {
      const own = entries.filter((e) => foodKeyOf(e) === name.trim().toLowerCase());
      return {
        name,
        share: fiberTotal > 0 ? sum(own.map((e) => e.fiberG ?? 0)) / fiberTotal : 0,
        days: new Set(own.map((e) => e.date.epochDay)).size,
        kcal: medianOf(own.map((e) => e.kcal)),
      };
    });
    put(
      reading(
        'fiber',
        { countedDays: counted.length, averageG, guideG },
        insight === undefined ? undefined : 'down',
        counted.length >= R.fiberHoldingDays && averageG >= guideG,
        { foods: examples },
      ),
    );
  }

  // N13: sodium over the limit set, as MM-312.
  const sodium = input.sodium;
  if (sodium !== undefined) {
    let over = 0;
    let under = 0;
    let leftOut = 0;
    const known: number[] = [];
    for (const d of judged) {
      if (d.date.isBefore(sodium.since)) continue;
      const day = SodiumDay.of(d.entries);
      const verdict = day.against(sodium.limitMg);
      if (verdict === 'unknown') {
        leftOut++;
        continue;
      }
      known.push(day.knownMg);
      if (verdict === 'over') over++;
      else under++;
    }
    const judgedSodium = over + under;
    const enough = judgedSodium >= R.sodiumMinimumDays;
    put(
      reading(
        'sodium',
        { overDays: over, underDays: under, judgedDays: judgedSodium, leftOutDays: leftOut, limitMg: sodium.limitMg, averageMg: mean(known) },
        enough && over * 2 > judgedSodium ? 'up' : undefined,
        enough && share(under, judgedSodium) >= R.sodiumHoldingShare,
      ),
    );
  }

  // N14: calories against each day's band. Over is the change on fat loss and recomp, under on lean gain.
  const bands = judged.map((d) => ({ d, band: new CalorieBand(d.kcalTarget) }));
  const above = bands.filter(({ d, band }) => d.intake.kcal > band.highKcal);
  const below = bands.filter(({ d, band }) => d.intake.kcal < band.lowKcal);
  const within = n - above.length - below.length;
  const overGoal = goal === 'fatLoss' || goal === 'recomp';
  put(
    reading(
      'calories',
      {
        judgedDays: n,
        aboveDays: above.length,
        belowDays: below.length,
        withinDays: within,
        averageKcal: mean(kcal),
        targetKcal: mean(judged.map((d) => d.kcalTarget)),
        averageOverKcal: mean(above.map(({ d }) => d.intake.kcal - d.kcalTarget)),
        averageUnderKcal: mean(below.map(({ d }) => d.kcalTarget - d.intake.kcal)),
      },
      overGoal && share(above.length, n) >= R.caloriesChangeShare
        ? 'up'
        : goal === 'leanGain' && share(below.length, n) >= R.caloriesChangeShare
          ? 'down'
          : undefined,
      share(within, n) >= R.caloriesHoldingShare,
    ),
  );

  // N15: intake against the energy expenditure, only once the estimate is updated from the person's own data.
  if (recordAtEnd !== undefined && recordAtEnd.tdeeStatus === 'updated') {
    const average = mean(kcal);
    const { tdeeKcal, tdeeSigmaKcal } = recordAtEnd;
    put(
      reading(
        'energyUse',
        { judgedDays: n, averageKcal: average, energyUseKcal: tdeeKcal },
        goal === 'fatLoss' && average >= tdeeKcal - tdeeSigmaKcal
          ? 'up'
          : goal === 'leanGain' && average <= tdeeKcal + tdeeSigmaKcal
            ? 'down'
            : undefined,
        false,
      ),
    );
  }

  // N16: a meal slot with a large share of calories and little protein for them.
  const slots = Meal.values
    .map((meal) => {
      const own = entries.filter((e) => e.meal === meal);
      const slotKcal = sum(own.map((e) => e.kcal));
      return { meal, share: share(slotKcal, sum(entries.map((e) => e.kcal))), densityG: slotKcal > 0 ? (100 * sum(own.map((e) => e.proteinG))) / slotKcal : 0 };
    })
    .filter((s) => s.share >= R.mealShareOfKcal);
  const worst = [...slots].sort((a, b) => a.densityG - b.densityG)[0];
  if (worst !== undefined) {
    put(
      reading(
        'mealBalance',
        { judgedDays: n, meal: Meal.values.indexOf(worst.meal), mealShare: worst.share, mealDensityG: worst.densityG, requiredG },
        worst.densityG < R.mealDensityShareOfRequired * requiredG ? 'down' : undefined,
        slots.every((s) => s.densityG >= R.mealHoldingShareOfRequired * requiredG),
        { meal: worst.meal },
      ),
    );
  }
  return found;
}

/** N9's foods: on 3 days or more, at 4 kcal a gram or more where grams are known, light on protein, a tenth of the calories. */
function denseFoods(
  entries: readonly FoodEntry[],
  kcalTotal: number,
): { food: CoachFood; kcalPerG: number; proteinPer100Kcal: number }[] {
  const foods = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    if (!countsAsFood(e)) continue;
    const key = foodKeyOf(e);
    foods.set(key, [...(foods.get(key) ?? []), e]);
  }
  const found: { food: CoachFood; kcalPerG: number; proteinPer100Kcal: number }[] = [];
  for (const own of foods.values()) {
    const days = new Set(own.map((e) => e.date.epochDay)).size;
    const kcal = sum(own.map((e) => e.kcal));
    const weighed = own.flatMap((e) => {
      const grams = entryGramsOf(e);
      return grams === undefined || !(grams > 0) ? [] : [{ grams, kcal: e.kcal }];
    });
    const weighedKcal = sum(weighed.map((w) => w.kcal));
    if (days < R.denseMinimumDays || !(kcal > 0) || weighedKcal < R.gramsCoverShare * kcal) continue;
    const kcalPerG = weighedKcal / sum(weighed.map((w) => w.grams));
    const proteinPer100Kcal = (100 * sum(own.map((e) => e.proteinG))) / kcal;
    const shareOfKcal = kcalTotal > 0 ? kcal / kcalTotal : 0;
    if (kcalPerG < R.denseKcalPerG || proteinPer100Kcal >= R.denseProteinPer100Kcal || shareOfKcal < R.denseShareOfKcal) continue;
    found.push({
      food: {
        name: (own[0] as FoodEntry).name.trim(),
        share: shareOfKcal,
        days,
        kcal: medianOf(own.map((e) => e.kcal)),
        proteinG: medianOf(own.map((e) => e.proteinG)),
      },
      kcalPerG,
      proteinPer100Kcal,
    });
  }
  return found.sort((a, b) => b.food.share - a.food.share).slice(0, R.contributorsMost);
}

/** N9's holding up: a main meal mostly of water-rich foods by weight, where grams are known, on 3 days or more. */
function waterRichMeal(judged: readonly FoodDay[]): { meal: Meal; days: number } | undefined {
  for (const meal of mainMeals) {
    let days = 0;
    for (const d of judged) {
      const own = d.entries.filter((e) => e.meal === meal && e.kcal >= 0);
      const kcal = sum(own.map((e) => e.kcal));
      const weighed = own.flatMap((e) => {
        const grams = entryGramsOf(e);
        return grams === undefined || !(grams > 0) ? [] : [{ grams, kcal: e.kcal }];
      });
      if (weighed.length === 0 || sum(weighed.map((w) => w.kcal)) < R.gramsCoverShare * kcal) continue;
      const grams = sum(weighed.map((w) => w.grams));
      const rich = sum(weighed.filter((w) => w.kcal / w.grams < R.waterRichKcalPerG).map((w) => w.grams));
      if (grams > 0 && rich / grams >= R.waterRichMealShare) days++;
    }
    if (days >= R.waterRichDays) return { meal, days };
  }
  return undefined;
}
