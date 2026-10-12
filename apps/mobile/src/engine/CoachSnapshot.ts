import type { CalendarDate } from '../domain/CalendarDate';
import type { CoachingPolicy } from '../domain/CoachingPolicy';
import type { ActivityGap } from './ActivityGap';
import type { BodyFatEstimate } from './BodyFatEstimate';
import type { CoachConfidence } from './CoachConfidence';
import type { ModeRecommendation } from './ModeRecommendation';
import type { TdeeEstimate } from './TdeeEstimate';
import { weightEventReductionPauseDays } from './weightEventConstants';
import type { WeightTrendPoint } from './WeightTrendPoint';

interface CoachSnapshotInit {
  policy: CoachingPolicy;
  trend: readonly WeightTrendPoint[];
  trendWeightKg: number;
  bodyFat: BodyFatEstimate;
  bmrKcal: number;
  calorieFloorKcal: number;
  tdee: TdeeEstimate;
  confidence: CoachConfidence;
  recommendation: ModeRecommendation;
  lastCreatineEventOn?: CalendarDate | undefined;
  deficitRestartOn?: CalendarDate | undefined;
  gaps?: readonly ActivityGap[];
}

/** Everything the engine currently believes about the user. */
export class CoachSnapshot {
  readonly policy: CoachingPolicy;

  /** One point per day from the first weigh-in; empty before any weigh-in. */
  readonly trend: readonly WeightTrendPoint[];
  readonly trendWeightKg: number;
  readonly bodyFat: BodyFatEstimate;
  readonly bmrKcal: number;

  /**
   * The lowest calorie target the app would ever suggest for this person
   * (`SafetyBounds.calorieFloorKcal`). Intake is described against it
   * (MM-114, MM-149).
   */
  readonly calorieFloorKcal: number;
  readonly tdee: TdeeEstimate;
  readonly confidence: CoachConfidence;
  readonly recommendation: ModeRecommendation;
  readonly lastCreatineEventOn: CalendarDate | undefined;

  /**
   * The first day back after the latest gap long enough to count as a break
   * from the deficit (MM-147); undefined with none.
   */
  readonly deficitRestartOn: CalendarDate | undefined;

  /** Runs of days with nothing recorded, oldest first (MM-147). */
  readonly gaps: readonly ActivityGap[];

  constructor(init: CoachSnapshotInit) {
    this.policy = init.policy;
    this.trend = init.trend;
    this.trendWeightKg = init.trendWeightKg;
    this.bodyFat = init.bodyFat;
    this.bmrKcal = init.bmrKcal;
    this.calorieFloorKcal = init.calorieFloorKcal;
    this.tdee = init.tdee;
    this.confidence = init.confidence;
    this.recommendation = init.recommendation;
    this.lastCreatineEventOn = init.lastCreatineEventOn;
    this.deficitRestartOn = init.deficitRestartOn;
    this.gaps = init.gaps ?? [];
  }

  creatineReductionPausedOn(today: CalendarDate): boolean {
    const event = this.lastCreatineEventOn;
    return event !== undefined && !event.isAfter(today) && event.daysUntil(today) <= weightEventReductionPauseDays;
  }
}
