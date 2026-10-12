import type { GoalMode } from '../domain/GoalMode';
import type { ModeReason } from './ModeReason';

export interface ModeRecommendation {
  readonly mode: GoalMode;
  readonly reason: ModeReason;
}
