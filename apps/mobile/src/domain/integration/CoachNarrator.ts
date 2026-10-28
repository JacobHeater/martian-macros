import type { CoachNarrationOutcome } from './CoachNarrationOutcome';
import type { CoachNarrationRequest } from './CoachNarrationRequest';

/**
 * Produces coaching narration for a pre-calculated brief or meal breakdown
 * (MM-665). `narrate` always resolves to a verified coaching paragraph,
 * falling back to `request.fallbackText` when offline, unconfigured, or
 * rejected by verification; `fresh` asks the provider again rather than
 * answering from the cache (a pull to refresh, MM-670). `probe` tells what
 * came of the ask, so a screen can show the wait and then the model's words
 * or, only once it failed, the built-in ones (MM-673); `fresh` there too
 * skips the cache, as Settings' test of the voice does (MM-671).
 */
export interface CoachNarrator {
  narrate(request: CoachNarrationRequest, options?: { readonly fresh?: boolean }): Promise<string>;
  probe(request: CoachNarrationRequest, options?: { readonly fresh?: boolean }): Promise<CoachNarrationOutcome>;
}
