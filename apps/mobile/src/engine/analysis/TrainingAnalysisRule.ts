import type { MuscleGroup } from '../../domain/training/MuscleGroup';
import { ReliefRule } from '../ReliefRule';

const majorGroups: readonly MuscleGroup[] = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes'];

/**
 * The thresholds of the training, water and sleep signals (MM-609), from
 * the training panel's catalog. Those the ticket marks uncertain are
 * calibrated by MM-605's null simulation; the rest are choices recorded in
 * the ticket. Tune them here.
 */
export const TrainingAnalysisRule = {
  /** The shortest span each signal is judged in; a shorter span reports its area as not judged. */
  needsDays: {
    /** T1's holding up: a session in each of the last 4 weeks. Its notice runs in any span. */
    lapseHoldingUp: 28,
    trainingDropped: 14,
    setsPerMuscle: 28,
    strength: 42,
    /** T7's falling lifts, over MM-117's three weeks. */
    strengthFalling: ReliefRule.strengthWindowDays,
    trainingDays: 28,
    rirUnrecorded: 14,
    proteinByTrainingDay: 14,
    waterOnTrainingDays: 14,
  },

  /** T1's holding up: a session in each of this many weeks. */
  lapseHoldingUpWeeks: 4,

  /** A pause on any of this many days through `asOf` silences T1 and T2. */
  pauseSilencesDays: 14,

  dropped: {
    recentDays: 14,
    /** The usual rate is read over the weeks before the recent days. */
    usualWeeks: 4,
    usualPerWeek: 2,
    usualWeeksTrained: 3,
    /** The recent days at this share of the usual or less... */
    recentShare: 0.5,
    /** ...and this many sessions fewer at least. */
    fewerBy: 2,
    /** At this share of the usual or more, the rate is in line with it (a choice). */
    inLineShare: 0.75,
  },

  sets: {
    weeks: 4,
    sessionsPerWeek: 2,
    majorGroups,
    /** A major group under this many hard sets a week... */
    lowSets: 4,
    /** ...while another reaches this many. */
    highSets: 10,
    /** MM-78's typical range, held in this many of the weeks. */
    rangeLow: 10,
    rangeHigh: 20,
    rangeWeeks: 3,
  },

  strength: {
    /** A lift's change is read over at least this many days... */
    days: 42,
    /** ...on this many sessions at least... */
    sessions: 4,
    /** ...trained within this many days of `asOf`. */
    recentDays: 14,
    /** T5 names at most this many lifts. */
    risingLifts: 2,
    /** T6 needs this many lifts stalled. */
    stalledLifts: 2,
    /** At most this many lifts are named in one finding. */
    namedLifts: 3,
  },

  trainingDays: {
    weeks: 4,
    usualWeekdays: 2,
    weeksTrained: 3,
  },

  rir: {
    days: 14,
    hardSets: 15,
    /** Reps in reserve recorded on fewer than this share of hard sets. */
    recordedShare: 0.25,
  },

  protein: {
    days: 14,
    /** At least this many training days and this many rest days. */
    eachDays: 4,
    /** The met shares differ by this much or more... */
    gap: 0.3,
    /** ...and the lower is under this. */
    lowerUnder: 0.5,
  },

  water: {
    days: 14,
    loggedDays: 10,
    trainingDays: 4,
    /** A training day this far under the goal, and under the rest-day average, is under. */
    underMl: 500,
    /** On at least this share of the training days. */
    underShare: 0.5,
    /** Holding up: training days at the goal on at least this share of them (a choice). */
    atGoalShare: 0.75,
  },
} as const;
