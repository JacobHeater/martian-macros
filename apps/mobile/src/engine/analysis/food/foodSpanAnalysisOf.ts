import type { CalendarDate } from '../../../domain/CalendarDate';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { GoalMode } from '../../../domain/GoalMode';
import type { Meal } from '../../../domain/Meal';
import { InsightPriority } from '../../InsightPriority';
import { dedupeTrendFindings } from '../../trends/dedupeTrendFindings';
import { evaluateSignal } from '../../trends/evaluateSignal';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { TrendFinding } from '../../trends/TrendFinding';
import { TrendRule } from '../../trends/TrendRule';
import type { TrendSpan } from '../../trends/TrendSpan';
import { TrendTier } from '../../trends/TrendTier';
import type { CoachAdvice } from '../CoachAdvice';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { CoachCause } from '../CoachCause';
import type { CoachFinding } from '../CoachFinding';
import type { CoachFindingKind } from '../CoachFindingKind';
import type { CoachFood } from '../CoachFood';
import type { CoachTrade } from '../CoachTrade';
import { findTrade } from '../findTrade';
import { swapFor } from '../swap/swapFor';
import { adviceFoodOf } from './adviceFoodOf';
import { dominantDayAdviceOf } from './dominantDayAdviceOf';
import type { FoodAnalysisInput } from './FoodAnalysisInput';
import { foodBoundariesOf } from './foodBoundariesOf';
import { foodDaysOf } from './foodDaysOf';
import { foodFindingAllowed } from './foodFindingAllowed';
import { foodGroupOf } from './foodGroupOf';
import { foodLimitsOf } from './foodLimitsOf';
import { FoodSignalId } from './FoodSignalId';
import type { FoodSignalReading } from './FoodSignalReading';
import type { FoodSpanAnalysis } from './FoodSpanAnalysis';
import { FoodSignalRule } from './FoodSignalRule';
import { foodTrendSignals } from './foodTrendSignals';
import { readFoodSignals } from './readFoodSignals';
import { recordOnOf } from './recordOnOf';
import { spanAdviceOf } from './spanAdviceOf';
import { topContributors } from './topContributors';

const R = FoodSignalRule;

/** Signals whose trend can only date a change their level rule finds: read per meal or food, or "as" an older rule. */
const levelOnly: readonly FoodSignalId[] = [
  'proteinByMeal',
  'macroSplit',
  'calorieDensity',
  'energyUse',
  'mealBalance',
  'fiber',
  'sodium',
];

/** The calorie line a single day can drive (MM-617's meal breakdown of that day). */
const dayDriven: readonly FoodSignalId[] = ['calories', 'fatAgainstTarget', 'calorieDensity'];

/** A trend is a change by itself only when it is read against the target. A move that stays on the right side of it is not. */
const againstTarget: readonly string[] = ['levelAgainstTarget', 'longRun'];

const mean = (values: readonly number[]) => (values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length);

/** One finding before its foods and trade. */
interface Candidate {
  readonly signal: FoodSignalId;
  readonly kind: CoachFindingKind;
  readonly direction: TrendDirection | undefined;
  readonly reading: FoodSignalReading;
  readonly trend: TrendFinding | undefined;
  readonly figures: Readonly<Record<string, number>>;
}

/**
 * MM-606's food analysis over one span ending on `asOf`, which is
 * yesterday: what is worth changing, what is holding up, and what limits
 * the rest, as figures (the words are `format/coach/foodFindingText`).
 *
 * 1. **Data quality first.** Partial days (more than a third of the logged
 *    days) or mostly estimated calories quiet every composition signal; a
 *    change beside a logging-style switch is data quality, not eating.
 * 2. **The trend engine** (MM-605) evaluates each signal of
 *    `foodTrendSignals` with the span's forced boundaries (targets changes
 *    and the logging-style switch), and its findings are de-duplicated.
 * 3. **The level rules** of the ticket's table (`readFoodSignals`) judge each
 *    whole day against its own targets. A signal is in change when its
 *    level rule holds, or when the trend engine finds it off its target
 *    (level against target, or a long run) the bad way; the trend's other
 *    detectors date the change. Then the gates: N2 only without N1; N3 only
 *    with N1; N4 and N16 only with N1 or N2; fat over target (N5, N6) only
 *    when it displaces protein (N1, N2 or N4) or calories are over the band;
 *    N15 only without N14; the split (N8) only when it displaces too. N6 is
 *    never said alone, and N8 never beside N5: each is folded into the line
 *    that is said.
 * 4. **The safeguards** (`foodFindingAllowed`) run before anything is
 *    ranked or merged.
 * 5. **Families** keep one finding per direction, the others' figures
 *    attached under their signal's name ("proteinDensity.densityG").
 * 6. **Foods** (N11, `topContributors`) and a **trade** (MM-607,
 *    `findTrade`) for a change that allows one, from whole, unmarked days.
 *    A diffuse pattern names no food and offers no trade. An
 *    eating-disorder history names no food at all.
 * 7. **Orders (MM-617):** every fix ends in at least one (`spanAdviceOf`,
 *    swaps by `swapFor`), after the safeguards; a fix left with none is not
 *    said. A calorie line driven by one day (`dominantDayAdviceOf`) also
 *    skips that day's worst food, and names that day's meal as its cause;
 *    else the top food is the cause.
 *
 * "Holding up" findings come from the table's "holding up when" column, and
 * calories hold up only within the band: nothing praises eating under
 * target (MM-92). Data quality findings come first, then fixes, then what
 * is holding up.
 *
 * With the findings come the keys whose exit threshold does not hold yet
 * (`unresolved`), which MM-605's state machine reads: N1 is over only once
 * the minimum is met on 65% of judged days, though it is said only under 50%.
 *
 * With `everyLoggedDay` (7d, today included, the owner, MM-621) every logged
 * day is read, partial or not, and the rules read from a single day: there
 * are no partial days and no minimum. The trend engine keeps its coverage
 * rule, so a short or thin week is read by the level rules alone.
 */
export function foodSpanAnalysisOf(
  input: FoodAnalysisInput,
  span: TrendSpan,
  asOf: CalendarDate,
  { everyLoggedDay = false }: { everyLoggedDay?: boolean } = {},
): FoodSpanAnalysis {
  const limits = foodLimitsOf(input.safeguards);
  if (limits.nothing) return { findings: [], unresolved: new Set() };
  const from = asOf.addDays(1 - span);
  const lookFrom = from.addDays(-TrendRule.baselineLookbackDays);
  const days = foodDaysOf(input, lookFrom, asOf).map((d) => (everyLoggedDay ? { ...d, whole: d.intake !== undefined } : d));
  const spanDays = days.filter((d) => !d.date.isBefore(from));
  const recordOn = recordOnOf(input.history);
  const goal: GoalMode | undefined = recordOn(asOf)?.mode;
  const enough = everyLoggedDay ? 1 : Math.max(R.minimumJudgedDays, Math.ceil(TrendRule.coverageMinimum * span));

  const make = (
    signal: string,
    kind: CoachFindingKind,
    figures: Readonly<Record<string, number>>,
    {
      foods = [],
      trade,
      trend,
      direction,
      advice,
      cause,
    }: {
      foods?: readonly CoachFood[];
      trade?: CoachTrade | undefined;
      trend?: TrendFinding | undefined;
      direction?: TrendDirection | undefined;
      advice?: readonly CoachAdvice[] | undefined;
      cause?: CoachCause | undefined;
    } = {},
  ): CoachFinding => ({
    // Stable while the finding holds: the level key of the trend engine (`trendKeyOf`), whichever detector speaks.
    id: kind === 'fix' ? `${signal}:level` : kind === 'dataQuality' ? `${signal}:dataQuality` : `${signal}:holdingUp`,
    signal,
    kind,
    span,
    from,
    to: asOf,
    // Each signal's own priority (MM-141), not one class for every food finding.
    priority: kind === 'dataQuality' ? 'dataQuality' : FoodSignalId.priority(signal as FoodSignalId, direction),
    figures,
    foods,
    trade,
    trend,
    ...(advice === undefined ? {} : { advice }),
    ...(cause === undefined ? {} : { cause }),
  });

  // 1. Data quality.
  const quality: CoachFinding[] = [];
  const logged = spanDays.filter((d) => d.intake !== undefined);
  const whole = spanDays.filter((d) => d.whole);
  if (logged.length >= enough && logged.length - whole.length > R.partialShare * logged.length) {
    quality.push(make('partialDays', 'dataQuality', { loggedDays: logged.length, partialDays: logged.length - whole.length }));
  }
  if (whole.length >= enough) {
    const kcal = whole.reduce((s, d) => s + (d.intake?.kcal ?? 0), 0);
    const estimated = whole.reduce((s, d) => s + (d.intake?.kcal ?? 0) * (d.intake?.estimatedShare ?? 0), 0);
    if (kcal > 0 && estimated / kcal > R.estimatedShare) {
      quality.push(make('estimatesRising', 'dataQuality', { wholeDays: whole.length, estimatedShare: estimated / kcal }));
    }
  }

  // 2. The trend engine.
  const boundaries = foodBoundariesOf(input.history, days, lookFrom, asOf);
  const foodSpan = { input, days };
  const trends = dedupeTrendFindings(
    FoodSignalId.values.flatMap((id) => evaluateSignal(foodTrendSignals[id], foodSpan, asOf, span, boundaries).findings),
  );
  const trendOf = new Map<string, TrendFinding>();
  const note = (f: TrendFinding) => {
    if (f.aspect !== 'loggingStyle' && !trendOf.has(f.signal)) trendOf.set(f.signal, f);
  };
  const levelFirst = [...trends].sort((a, b) => Number(a.aspect !== 'level') - Number(b.aspect !== 'level'));
  for (const f of levelFirst) note(f);
  for (const f of levelFirst) for (const s of f.supporting) if (s.signal !== f.signal) note(s);
  const styleShift = trends.find((f) => f.aspect === 'loggingStyle');
  if (styleShift !== undefined) {
    quality.push(make('loggingStyle', 'dataQuality', { onsetEpochDay: styleShift.onsetDate?.epochDay ?? asOf.epochDay }, { trend: styleShift }));
  }
  const qualityLimits = quality.some((q) => q.signal === 'partialDays' || q.signal === 'estimatesRising');
  const allowed = (q: CoachFinding) => foodFindingAllowed({ limits, signal: q.signal, kind: q.kind, direction: undefined, goal, figures: q.figures, day: false });
  const shownQuality = quality.filter(allowed);

  // 3. The level rules, and the gates.
  const judged = spanDays.filter((d) => d.whole && d.record !== undefined);
  if (goal === undefined || judged.length < enough) return { findings: shownQuality, unresolved: new Set() };
  const readings = readFoodSignals({ input, days: spanDays, from, to: asOf, goal, ...(everyLoggedDay ? { minimumDays: 1, sodiumMinimumDays: 1 } : {}) });
  // N1's exit (MM-606): a protein-minimum fix is over only once the minimum is met on 65% of judged days.
  const unresolved = new Set<string>();
  const minimumRead = readings.get('proteinMinimum')?.figures;
  const minimumJudged = minimumRead?.['judgedDays'] ?? 0;
  if (minimumRead !== undefined && minimumJudged > 0 && (minimumRead['metDays'] ?? 0) / minimumJudged < R.proteinMinimumExitShare) {
    unresolved.add('proteinMinimum:level');
  }
  const floorKept = input.balance !== undefined && !input.balance.carbFloorOff;
  const badTrend = (id: FoodSignalId): readonly TrendDirection[] => {
    if (id === 'calories') return goal === 'leanGain' ? ['down'] : goal === 'maintenance' ? [] : ['up'];
    if (id === 'fatAgainstTarget' || id === 'fatShare') return ['up'];
    if (id === 'carbohydrate') return floorKept ? ['down'] : [];
    return ['down'];
  };
  const trendFor = (id: FoodSignalId) => {
    const t = trendOf.get(id);
    return t !== undefined && badTrend(id).includes(t.direction) ? t : undefined;
  };
  const raw = (id: FoodSignalId): TrendDirection | undefined => {
    const r = readings.get(id);
    if (r === undefined) return undefined;
    if (r.change !== undefined) return r.change;
    const t = trendFor(id);
    if (t === undefined || levelOnly.includes(id) || !againstTarget.includes(t.detector) || t.sizeWithheld) return undefined;
    if (id === 'proteinDensity' && r.figures['bandOk'] !== 1) return undefined;
    return t.direction;
  };
  const n1 = raw('proteinMinimum');
  const n2 = n1 === undefined ? raw('proteinTarget') : undefined;
  const n3 = n1 !== undefined ? raw('proteinByMeal') : undefined;
  const n4 = n1 !== undefined || n2 !== undefined ? raw('proteinDensity') : undefined;
  const n14 = raw('calories');
  // Under kidney disease protein is a cap, so fat is never said to have displaced it; only calories over the band count.
  const proteinShort = !limits.noMoreProtein && (n1 !== undefined || n2 !== undefined || n4 !== undefined);
  const displaces = proteinShort || n14 === 'up';
  const n5raw = raw('fatAgainstTarget');
  const n5 = n5raw === 'up' && !displaces ? undefined : n5raw;
  const n6 = displaces ? raw('fatShare') : undefined;
  const n16 = n1 !== undefined || n2 !== undefined || n4 !== undefined ? raw('mealBalance') : undefined;
  const change = new Map<FoodSignalId, TrendDirection>();
  const set = (id: FoodSignalId, d: TrendDirection | undefined) => {
    if (d !== undefined) change.set(id, d);
  };
  set('proteinMinimum', n1);
  set('proteinTarget', n2);
  set('proteinByMeal', n3);
  set('proteinDensity', n4);
  set('fatAgainstTarget', n5);
  set('carbohydrate', raw('carbohydrate'));
  // The split routes to N4 and N5, so it too is said only when it displaces protein or calories are over the band.
  set('macroSplit', displaces ? raw('macroSplit') : undefined);
  set('calorieDensity', raw('calorieDensity'));
  set('fiber', raw('fiber'));
  set('sodium', raw('sodium'));
  set('calories', n14);
  set('energyUse', n14 === undefined ? raw('energyUse') : undefined);
  set('mealBalance', n16);

  // The figures a fix carries beyond its own: what fat over target cost.
  const extraFigures = (id: FoodSignalId): Record<string, number> => {
    if (id !== 'fatAgainstTarget' && id !== 'macroSplit') return {};
    const extra: Record<string, number> = {};
    const minimum = readings.get('proteinMinimum')?.figures;
    const target = readings.get('proteinTarget')?.figures;
    if (proteinShort && n1 !== undefined && minimum !== undefined) {
      // How far the average day fell under the minimum, and on how many days it fell short at all.
      extra['proteinShortG'] = (minimum['minimumG'] ?? 0) - (minimum['averageProteinG'] ?? 0);
      extra['proteinMissedDays'] = (minimum['judgedDays'] ?? 0) - (minimum['metDays'] ?? 0);
      extra['proteinJudgedDays'] = minimum['judgedDays'] ?? 0;
      extra['proteinReference'] = 0;
    } else if (proteinShort && n2 !== undefined && target !== undefined) {
      extra['proteinShortG'] = (target['targetG'] ?? 0) - (target['averageProteinG'] ?? 0);
      extra['proteinReference'] = 1;
    }
    const calories = readings.get('calories')?.figures;
    if (n14 === 'up' && calories !== undefined) {
      extra['caloriesAboveDays'] = calories['aboveDays'] ?? 0;
      extra['caloriesJudgedDays'] = calories['judgedDays'] ?? 0;
    }
    return extra;
  };

  // 4. Candidates, data quality and the safeguards.
  const candidates: Candidate[] = [];
  for (const id of FoodSignalId.values) {
    const reading = readings.get(id);
    if (reading === undefined || id === 'fatShare') continue;
    if (qualityLimits && FoodSignalId.isComposition(id)) continue;
    const direction = change.get(id);
    if (direction !== undefined) {
      candidates.push({ signal: id, kind: 'fix', direction, reading, trend: trendFor(id), figures: { ...reading.figures, ...extraFigures(id) } });
    } else if (reading.holdingUp) {
      candidates.push({ signal: id, kind: 'holdingUp', direction: undefined, reading, trend: undefined, figures: reading.figures });
    }
  }
  const permitted = candidates.filter((c) =>
    foodFindingAllowed({ limits, signal: c.signal, kind: c.kind, direction: c.direction, goal, figures: c.figures, day: false }),
  );

  // 5. Families: one finding per direction (holding up counts as one direction), the others' figures attached.
  const kept: Candidate[] = [];
  const groupOf = (c: Candidate) => {
    const family = FoodSignalId.family(c.signal);
    return family === undefined ? undefined : `${family}|${c.kind}|${c.direction ?? ''}`;
  };
  for (const c of permitted) {
    const group = groupOf(c);
    const at = group === undefined ? -1 : kept.findIndex((k) => groupOf(k) === group);
    const top = kept[at];
    if (top === undefined) {
      kept.push(c);
      continue;
    }
    // Holding up in the calorie family leads with calories, the fact the others qualify.
    if (c.kind === 'holdingUp' && c.signal === 'calories') {
      kept[at] = { ...c, figures: { ...c.figures, ...prefixed(top.signal, top.figures) } };
      continue;
    }
    kept[at] = { ...top, figures: { ...top.figures, ...prefixed(c.signal, c.figures) } };
  }
  // N6 is folded into N5, or else into N8.
  const shareFigures = readings.get('fatShare')?.figures;
  if (n6 !== undefined && shareFigures !== undefined) {
    const at = kept.findIndex((k) => k.kind === 'fix' && (k.signal === 'fatAgainstTarget' || k.signal === 'macroSplit') && k.direction === 'up');
    const top = kept[at];
    if (top !== undefined) kept[at] = { ...top, figures: { ...top.figures, ...prefixed('fatShare', shareFigures) } };
  }

  // N8 is the summary line, never beside N5: when fat over target is said, the split goes into it as figures.
  const fatAt = kept.findIndex((k) => k.kind === 'fix' && k.signal === 'fatAgainstTarget' && k.direction === 'up');
  const splitAt = kept.findIndex((k) => k.kind === 'fix' && k.signal === 'macroSplit');
  const fat = kept[fatAt];
  const split = kept[splitAt];
  if (fat !== undefined && split !== undefined) {
    kept[fatAt] = { ...fat, figures: { ...fat.figures, ...prefixed('macroSplit', split.figures) } };
    kept.splice(splitAt, 1);
  }

  // 6. Foods and trades, from whole, unmarked days.
  const unmarked = judged.filter((d) => d.kind === 'none');
  const spanEntries = unmarked.flatMap((d) => d.entries);
  const historyEntries = input.entries.filter((e) => !e.date.isBefore(asOf.addDays(1 - R.historyDays)) && !e.date.isAfter(asOf));
  const required = new Map<number, number>(
    judged.map((d) => [d.date.epochDay, d.record === undefined ? 0 : (100 * d.record.targets.proteinG) / d.record.targets.kcal] as const),
  );
  const gapKcal = (e: FoodEntry) => {
    const req = required.get(e.date.epochDay);
    return req === undefined || !(req > 0) ? undefined : Math.max(0, e.kcal - (100 * e.proteinG) / req);
  };
  const calorieRoom = mean(judged.map((d) => d.intake?.kcal ?? 0)) < mean(judged.map((d) => d.kcalTarget ?? 0));
  const activeSignals = new Set<string>(kept.filter((k) => k.kind === 'fix').map((k) => k.signal));
  const spanGoal: GoalMode = goal;
  const swapIn = (slot: Meal | undefined, among: readonly FoodEntry[]) => (food: CoachAdviceFood) =>
    swapFor({
      food,
      group: foodGroupOf(food.key, among, input.catalog),
      meal: slot,
      goal: spanGoal,
      history: historyEntries,
      catalog: input.catalog,
      safeguards: input.safeguards,
      cautions: input.safeguards.cautions,
    });
  const dayDrivenFix = kept.some((k) => k.kind === 'fix' && k.direction === 'up' && dayDriven.includes(k.signal));
  const dominant = dayDrivenFix && !limits.proteinOnly ? dominantDayAdviceOf(unmarked) : undefined;
  const fixes: CoachFinding[] = [];
  const holding: CoachFinding[] = [];
  for (const c of kept) {
    const slot = c.reading.meal;
    const inSlot = (c.signal === 'proteinByMeal' || c.signal === 'mealBalance') && slot !== undefined;
    const entries = inSlot ? spanEntries.filter((e) => e.meal === slot) : spanEntries;
    const foods = c.kind !== 'fix' || limits.proteinOnly || limits.underEating || limits.minorOrPaused ? [] : foodsOf(c, entries, gapKcal);
    const motive = FoodSignalId.motive(c.signal);
    const tradeAllowed =
      c.kind === 'fix' &&
      motive !== undefined &&
      foods.length > 0 &&
      !limits.proteinOnly &&
      (c.signal !== 'fatAgainstTarget' || c.direction === 'up') &&
      (c.signal !== 'calories' || (c.direction === 'up' && goal === 'fatLoss'));
    const trade =
      tradeAllowed && motive !== undefined
        ? findTrade({
            motive,
            goal,
            spanEntries: entries,
            history: historyEntries,
            catalog: input.catalog,
            safeguards: input.safeguards,
            cautions: input.safeguards.cautions,
            activeSignals,
            calorieRoom,
            spanDays: unmarked.length,
            calorieFloorKcal: input.calorieFloorKcal,
            snoozed: input.snoozed,
          })
        : undefined;
    const figures =
      c.kind === 'fix'
        ? { ...c.figures, direction: c.direction === 'down' ? -1 : 1, calorieRoom: calorieRoom ? 1 : 0, tradeDays: unmarked.length }
        : c.figures;
    if (c.kind !== 'fix') {
      holding.push(make(c.signal, c.kind, figures, { foods, trade, trend: c.trend, direction: c.direction }));
      continue;
    }
    // 7. The orders, and what drove it.
    const driven = c.direction === 'up' && dayDriven.includes(c.signal) ? dominant : undefined;
    const advice = spanAdviceOf({
      signal: c.signal,
      direction: c.direction,
      figures,
      foods,
      trade,
      entries,
      history: historyEntries,
      limits,
      meal: inSlot ? slot : undefined,
      swap: swapIn(inSlot ? slot : undefined, entries),
      extra: driven?.advice ?? [],
    });
    if (advice.length === 0) continue;
    const top = foods[0];
    const cause: CoachCause | undefined = driven?.cause ?? (top === undefined ? undefined : { food: adviceFoodOf(top.name, entries) });
    fixes.push(make(c.signal, c.kind, figures, { foods, trade, trend: c.trend, direction: c.direction, advice, cause }));
  }

  const tier = (f: CoachFinding) => (f.trend === undefined ? 1 : TrendTier.rank(f.trend.tier));
  const order = (f: CoachFinding) => FoodSignalId.order(f.signal as FoodSignalId);
  fixes.sort(
    (a, b) => InsightPriority.index(a.priority) - InsightPriority.index(b.priority) || tier(b) - tier(a) || order(a) - order(b),
  );
  holding.sort((a, b) => order(a) - order(b));
  return { findings: [...shownQuality, ...fixes, ...holding], unresolved };
}

/** The figures of a merged finding, under its signal's name. */
function prefixed(signal: string, figures: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(figures).map(([key, value]) => [`${signal}.${key}`, value]));
}

/** N11's foods for a fix: what each signal's total or gap is made of. */
function foodsOf(
  c: Candidate,
  entries: readonly FoodEntry[],
  gapKcal: (e: FoodEntry) => number | undefined,
): readonly CoachFood[] {
  switch (c.signal) {
    case 'proteinMinimum':
    case 'proteinTarget':
    case 'proteinByMeal':
    case 'proteinDensity':
    case 'mealBalance':
      return topContributors(entries, gapKcal);
    case 'fatAgainstTarget':
      return c.direction === 'up' ? topContributors(entries, (e) => e.fatG) : [];
    case 'macroSplit': {
      const largest = c.figures['largest'];
      if (largest === 2 && c.direction === 'up') return topContributors(entries, (e) => e.fatG);
      if (largest === 1 && c.direction === 'up') return topContributors(entries, (e) => e.carbsG);
      return topContributors(entries, gapKcal);
    }
    case 'calorieDensity':
    case 'fiber':
      return c.reading.foods ?? [];
    case 'sodium':
      return topContributors(entries, (e) => e.sodiumMg);
    case 'calories':
      return c.direction === 'up' ? topContributors(entries, (e) => e.kcal) : [];
    default:
      return [];
  }
}

