import { paceInWordsOf } from '../engine/paceInWordsOf';
import { paceInWordsText } from '../format/paceInWordsText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';

/**
 * The trend's pace in words against the plan's (MM-118): "On pace",
 * "Slower than planned", "Faster than planned" or "Steady", approximate
 * until the coach is sure. Undefined until there is a trend and targets.
 * What a person who chose to see no weight is told in place of a figure.
 */
export function usePaceInWords(): string | undefined {
  const { state } = useApp();
  const snapshot = useCell(state.coach);
  const current = useCell(state.currentTargets);
  const last = snapshot?.trend[snapshot.trend.length - 1];
  if (snapshot === undefined || current === undefined || last === undefined || !(last.levelKg > 0)) return undefined;
  const pace = paceInWordsOf({
    trendFractionPerWeek: (last.slopeKgPerDay * 7) / last.levelKg,
    intendedFractionPerWeek: current.targets.weeklyRateFraction,
  });
  return paceInWordsText(pace, { confident: snapshot.confidence.level === 'good' });
}
