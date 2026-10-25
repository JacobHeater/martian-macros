import type { Workout } from '../../domain/training/Workout';
import { fallingLifts } from '../fallingLifts';
import { InsightRationing } from '../InsightRationing';
import type { ItemInsight } from '../ItemInsight';
import { pauseOn } from '../pauseOn';
import { ReliefRule } from '../ReliefRule';
import { shortSleep } from '../shortSleep';
import { sleepAverageOf } from '../sleepAverageOf';
import { slowerPace } from '../slowerPace';
import { strengthOnFatLossInsights } from '../strengthOnFatLossInsights';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { proteinMinimumOn } from './proteinMinimumOn';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T7, strength on fat loss (MM-609), on a fat-loss goal whose targets in
 * force are a deficit. Reuses the rules where they live:
 *
 * - **Falling** is MM-117's trigger (`fallingLifts`): 2 or more lifts down
 *   5% over 3 weeks. The fix is the offer's gentler pace. Short sleep
 *   (`shortSleep`, MM-252) and protein under the minimum on most whole days
 *   (MM-121) are co-evidence, stated beside it, never as a cause. Not said
 *   during a pause.
 * - **Held** is MM-377's line (`strengthOnFatLossInsights`) at each lift's
 *   latest session in the last 14 days: held, or up, against the deficit's
 *   start. Holding up. Not said beside falling lifts, nor with an
 *   eating-disorder history or under-eating.
 *
 * Nothing is said about a stall, and rising is not a fat-loss finding.
 */
export function strengthOnFatLossFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, restricted } = context;
  const rule = TrainingAnalysisRule;
  if (input.setup.goalMode !== 'fatLoss') return [];
  const inForce = input.history.filter((r) => !r.effectiveFrom.isAfter(asOf)).sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom)).at(-1);
  if (inForce === undefined || inForce.targets.weeklyRateFraction >= 0) return [];
  const base = { signal: 'strengthOnFatLoss', span } as const;

  if (span >= rule.needsDays.strengthFalling && pauseOn(input.pauses, asOf) === undefined) {
    const falling = fallingLifts(context.trends, asOf);
    if (falling.length >= ReliefRule.fallingLiftsNeeded) {
      const named = falling.slice(0, rule.strength.namedLifts);
      const figures: Record<string, number> = { lifts: falling.length, windowDays: ReliefRule.strengthWindowDays };
      named.forEach((lift, i) => {
        figures[`from${i}Kg`] = lift.fromKg;
        figures[`to${i}Kg`] = lift.toKg;
        figures[`sessions${i}`] = lift.sessions;
      });
      const pace = slowerPace(input.setup.requestedLossFraction);
      if (pace !== undefined) figures['slowerPace'] = pace;
      const sleep = sleepAverageOf({ nights: input.sleep, through: asOf });
      if (shortSleep(sleep) && sleep !== undefined) {
        figures['sleepAverageMinutes'] = sleep.averageMinutes;
        figures['sleepNights'] = sleep.nights;
      }
      const from = asOf.addDays(1 - InsightRationing.patternDays);
      let judged = 0;
      let met = 0;
      for (const day of input.wholeDays) {
        if (day.date.isBefore(from) || day.date.isAfter(asOf)) continue;
        const minimum = proteinMinimumOn(input.history, day.date);
        if (minimum === undefined) continue;
        judged++;
        if (day.proteinG >= minimum) met++;
      }
      if (judged >= InsightRationing.minimumBasisDays && met * 2 < judged) {
        figures['proteinWholeDays'] = judged;
        figures['proteinMetDays'] = met;
      }
      return [
        coachFindingOf({
          ...base,
          kind: 'fix',
          from: asOf.addDays(-ReliefRule.strengthWindowDays),
          to: asOf,
          priority: 'coaching',
          subjects: named.map((lift) => lift.name),
          figures,
        }),
      ];
    }
  }

  if (restricted || span < rule.needsDays.strength) return [];
  const held: { readonly name: string; readonly insight: ItemInsight }[] = [];
  for (const trend of context.trends) {
    if (trend.exercise === undefined || trend.exercise.load === 'bodyweight') continue;
    const latest = latestSessionWith(context.sessions, trend.exerciseId);
    if (latest === undefined || latest.date.daysUntil(asOf) >= rule.strength.recentDays) continue;
    const insight = strengthOnFatLossInsights({
      workout: latest,
      trends: context.trends,
      history: input.history,
      exercisesById: context.exercisesById,
      deficitRestartOn: input.deficitRestartOn,
      progressStalled: input.progressStalled,
    }).find((i) => i.subject === trend.exerciseId);
    if (insight !== undefined) held.push({ name: trend.name, insight });
  }
  if (held.length === 0) return [];
  const named = held.slice(0, rule.strength.namedLifts);
  const first = named[0]?.insight as ItemInsight;
  const figures: Record<string, number> = { lifts: held.length, weeks: first.figures['weeks'] ?? 0 };
  named.forEach(({ insight }, i) => {
    figures[`from${i}Kg`] = insight.figures['fromKg'] ?? 0;
    figures[`to${i}Kg`] = insight.figures['toKg'] ?? 0;
    figures[`sessions${i}`] = insight.figures['sessions'] ?? 0;
  });
  return [
    coachFindingOf({
      ...base,
      kind: 'holdingUp',
      from: first.from ?? asOf,
      to: asOf,
      priority: 'pattern',
      subjects: named.map(({ name }) => name),
      figures,
    }),
  ];
}

/** The latest session with a set of the exercise that has reps. */
function latestSessionWith(sessions: readonly Workout[], exerciseId: string): Workout | undefined {
  let latest: Workout | undefined;
  for (const w of sessions) {
    if (!w.exercises.some((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.reps > 0))) continue;
    if (latest === undefined || w.date.isAfter(latest.date) || (w.date === latest.date && w.startedAt > latest.startedAt)) latest = w;
  }
  return latest;
}
