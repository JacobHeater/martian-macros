import type { CoachAdvice } from './CoachAdvice';
import { CoachAdviceRule } from './CoachAdviceRule';
import type { CoachFinding } from './CoachFinding';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

const R = CoachAdviceRule;

/**
 * The orders a training fix ends in (MM-617, on MM-609's signals):
 *
 * - **T1, training stopped:** two sessions this week. Not under an
 *   eating-disorder history or the under-eating finding (`restricted`),
 *   which say no "train more": the fix is then not said.
 * - **T2, training dropped:** back to the usual sessions a week, this week.
 * - **T3, sets per muscle:** the hard sets a week that bring the group to
 *   MM-78's range (10).
 * - **T6, lifts stalled:** one more hard set a session on each.
 * - **T7, lifts falling on a deficit:** the slower pace, more sleep and
 *   protein where the finding found them, then keep the loads.
 * - **X1, protein by training day:** protein to the minimum on the days it
 *   falls short.
 * - **X3, water on training days:** the goal on training days.
 */
export function trainingAdviceOf(finding: CoachFinding, restricted: boolean): CoachAdvice[] {
  if (finding.kind !== 'fix') return [];
  const x = (key: string) => finding.figures[key];
  switch (finding.signal) {
    case 'trainingStopped':
      return restricted ? [] : [{ kind: 'train', sessions: R.restartSessions }];
    case 'trainingDropped':
      return [{ kind: 'train', sessions: Math.max(1, Math.round(x('usualPerWeek') ?? 1)) }];
    case 'setsPerMuscle': {
      const group = finding.subjects?.[0];
      const sets = Math.max(1, Math.ceil(TrainingAnalysisRule.sets.rangeLow - (x('groupSets') ?? 0)));
      return [{ kind: 'addSets', sets, ...(group === undefined ? {} : { group }) }];
    }
    case 'strengthStalled':
      return [{ kind: 'addSets', sets: R.stalledAddSets, ...(finding.subjects === undefined ? {} : { lifts: finding.subjects }) }];
    case 'strengthOnFatLoss': {
      const orders: CoachAdvice[] = [];
      const pace = x('slowerPace');
      if (pace !== undefined) orders.push({ kind: 'slowDown', rateFraction: pace });
      if (x('sleepAverageMinutes') !== undefined) orders.push({ kind: 'sleep', minutes: R.sleepMinutes });
      if (x('proteinWholeDays') !== undefined) orders.push({ kind: 'add', nutrient: 'protein' });
      orders.push({ kind: 'keepLifting' });
      return orders;
    }
    case 'proteinByTrainingDay':
      return [{ kind: 'add', nutrient: 'protein', days: x('lowerOnRestDays') === 1 ? 'rest' : 'training' }];
    case 'waterOnTrainingDays': {
      const goalMl = x('goalMl');
      return [{ kind: 'drinkWater', days: 'training', ...(goalMl === undefined ? {} : { amountMl: goalMl }) }];
    }
    default:
      return [];
  }
}
