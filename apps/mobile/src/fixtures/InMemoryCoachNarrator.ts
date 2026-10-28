import type { CoachNarrationRequest } from '../domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../domain/integration/CoachNarrator';

/**
 * `CoachNarrator` for tests and stories: makes no network request and returns
 * a configured answer or `request.fallbackText` (MM-665).
 */
export class InMemoryCoachNarrator implements CoachNarrator {
  readonly requests: CoachNarrationRequest[] = [];
  readonly answers = new Map<string, string>();

  answer(cacheKeyPrefix: string, text: string): this {
    this.answers.set(cacheKeyPrefix, text);
    return this;
  }

  async narrate(request: CoachNarrationRequest): Promise<string> {
    this.requests.push(request);
    for (const [prefix, text] of this.answers) {
      if (request.cacheKey.includes(prefix)) return text;
    }
    return request.fallbackText;
  }
}
