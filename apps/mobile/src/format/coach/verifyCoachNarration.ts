import { whyCoachNarrationRejected } from './whyCoachNarrationRejected';

/**
 * Verifies that a candidate coaching narration (such as one returned by a BYOK
 * LLM provider) is non-empty, bounded in length, free of banned words, respects
 * the protected eating-disorder safeguard, and does not contradict the
 * mathematical invariant when protein is unrecoverable (MM-663). The reason a
 * narration fails is `whyCoachNarrationRejected` (MM-671).
 */
export function verifyCoachNarration(
  text: string,
  context: {
    readonly protectedPath: boolean;
    readonly proteinUnrecoverable: boolean;
    readonly allowedNumbers?: readonly number[] | undefined;
  },
): boolean {
  return whyCoachNarrationRejected(text, context) === undefined;
}
