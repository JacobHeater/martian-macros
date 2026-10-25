import type { TrendAspect } from './TrendAspect';

/**
 * Highest precedence first (MM-605): within the level, a shift, then recent
 * against baseline, a short run, a long run and level against target; then
 * the drift; then the weekend, one weekday and an unlogged weekday.
 */
const values = [
  'shift',
  'recentAgainstBaseline',
  'shortRun',
  'longRun',
  'levelAgainstTarget',
  'drift',
  'weekend',
  'weekday',
  'unloggedWeekday',
] as const;

/**
 * The trend engine's detectors (MM-605): D1 level against target, D2 drift,
 * D3 shift (change point), D4 long run (a, against target) and short run
 * (b, against the baseline), D5 weekend, one weekday and unlogged weekday,
 * D6 recent against baseline.
 */
export type TrendDetector = (typeof values)[number];

export const TrendDetector = {
  values,

  /** The aspect a detector's findings are about. */
  aspect(detector: TrendDetector): TrendAspect {
    if (detector === 'drift') return 'drift';
    if (detector === 'weekend' || detector === 'weekday' || detector === 'unloggedWeekday') return 'weekday';
    return 'level';
  },

  /** An event claim (D3, D4, D6) reports the most recent change in the span; a state claim reads the current regime. */
  isEvent(detector: TrendDetector): boolean {
    return detector === 'shift' || detector === 'recentAgainstBaseline' || detector === 'shortRun' || detector === 'longRun';
  },

  /** The detector's place in the precedence: 0 is highest. */
  precedence(detector: TrendDetector): number {
    return values.indexOf(detector);
  },
} as const;
