import { pausedDaysBetween } from '../pausedDaysBetween';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { daysTrainedBetween } from './daysTrainedBetween';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T2, training dropped (MM-609): a usual rate of 2 or more sessions a week
 * over the 4 weeks before the last 14 days, with sessions in 3 of them, and
 * the last 14 days at half of it or less and 2 sessions fewer at least.
 * Holding up: the last 14 days in line with the usual rate. Silent when a
 * pause touches the last 14 days, and with an eating-disorder history or
 * under-eating (no "train more").
 */
export function trainingDroppedFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, restricted } = context;
  const rule = TrainingAnalysisRule.dropped;
  if (restricted || span < TrainingAnalysisRule.needsDays.trainingDropped) return [];
  const recentFrom = asOf.addDays(1 - rule.recentDays);
  if (pausedDaysBetween(input.pauses, recentFrom, asOf) > 0) return [];
  let usual = 0;
  let weeksTrained = 0;
  for (let week = 0; week < rule.usualWeeks; week++) {
    const end = recentFrom.addDays(-1 - 7 * week);
    const trained = daysTrainedBetween(context, end.addDays(-6), end);
    usual += trained;
    if (trained > 0) weeksTrained++;
  }
  const usualPerWeek = usual / rule.usualWeeks;
  if (usualPerWeek < rule.usualPerWeek || weeksTrained < rule.usualWeeksTrained) return [];
  const expected = (usualPerWeek * rule.recentDays) / 7;
  const recent = daysTrainedBetween(context, recentFrom, asOf);
  const figures = { recentSessions: recent, recentDays: rule.recentDays, usualPerWeek, usualWeeks: rule.usualWeeks };
  const from = recentFrom.addDays(-7 * rule.usualWeeks);
  if (recent <= expected * rule.recentShare && expected - recent >= rule.fewerBy) {
    return [coachFindingOf({ signal: 'trainingDropped', kind: 'fix', span, from, to: asOf, priority: 'pattern', figures })];
  }
  if (recent >= expected * rule.inLineShare) {
    return [coachFindingOf({ signal: 'trainingDropped', kind: 'holdingUp', span, from, to: asOf, priority: 'pattern', figures })];
  }
  return [];
}
