import type { WeightEventType } from '../domain/WeightEventType';
import type { WeightJumpCauseKind } from './WeightJumpCauseKind';

/**
 * One likely cause of a weigh-in far from the trend (MM-142), with the
 * figures it rests on. The app is correlating, never measuring: a cause is
 * "likely", nothing more.
 *
 * Figures by kind: `carbohydrate` and `sodium` carry `amount` (g or mg),
 * `usual` and `daysAgo`; `calories` carries `kcal`, `targetKcal`,
 * `overTargetKcal` (negative under it), `overExpenditureKcal` and
 * `fatAtMostKg`, the most fat such a surplus could store; `alcohol` carries
 * `alcoholG` and `daysAgo`; `workout` carries `daysAgo`; `weightEvent`
 * carries `daysAgo` and names its `eventType`; `phaseChange` carries
 * `daysSince`; `cycleWindow` carries nothing.
 */
export interface WeightJumpCause {
  readonly kind: WeightJumpCauseKind;
  readonly figures: Readonly<Record<string, number>>;
  readonly eventType?: WeightEventType | undefined;
}
