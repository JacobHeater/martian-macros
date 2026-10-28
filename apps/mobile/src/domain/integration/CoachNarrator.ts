import type { CoachNarrationRequest } from './CoachNarrationRequest';

/**
 * Produces coaching narration for a pre-calculated brief or meal breakdown
 * (MM-665). Always resolves to a verified coaching paragraph, falling back to
 * `request.fallbackText` when offline, unconfigured, or rejected by
 * verification.
 */
export interface CoachNarrator {
  narrate(request: CoachNarrationRequest): Promise<string>;
}
