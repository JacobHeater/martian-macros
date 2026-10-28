import type { CoachNarrationOutcome } from '../domain/integration/CoachNarrationOutcome';
import type { CoachNarrationRequest } from '../domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../domain/integration/CoachNarrator';

/**
 * `CoachNarrator` for tests and stories: makes no network request and returns
 * a configured answer or `request.fallbackText` (MM-665). An `outcome` set on
 * it is what every ask comes to, for a test of what Settings says of a
 * failure (MM-671).
 */
export class InMemoryCoachNarrator implements CoachNarrator {
  readonly requests: CoachNarrationRequest[] = [];
  readonly answers = new Map<string, string>();
  outcome: CoachNarrationOutcome | undefined;
  /** Never answers: the screen stays waiting, for a story or a test of the wait (MM-673). */
  pending = false;

  answer(cacheKeyPrefix: string, text: string): this {
    this.answers.set(cacheKeyPrefix, text);
    return this;
  }

  async narrate(request: CoachNarrationRequest): Promise<string> {
    const outcome = await this.probe(request);
    return outcome.kind === 'narrated' ? outcome.text : request.fallbackText;
  }

  async probe(request: CoachNarrationRequest): Promise<CoachNarrationOutcome> {
    this.requests.push(request);
    if (this.pending) return new Promise<CoachNarrationOutcome>(() => undefined);
    if (this.outcome !== undefined) return this.outcome;
    for (const [prefix, text] of this.answers) {
      if (request.cacheKey.includes(prefix)) return { kind: 'narrated', text, cached: false };
    }
    return { kind: 'narrated', text: request.fallbackText, cached: false };
  }
}
