/**
 * How a goal that needs training reads the training log (MM-134).
 * Judgement; tune here.
 */
export const TrainingRule = {
  /** With no workout logged for this long, the coach says so. */
  noticeAfterDays: 14,
  /** On lean gain, with no workout for this long, the surplus pauses until one is logged. */
  suspendAfterDays: 21,
} as const;
