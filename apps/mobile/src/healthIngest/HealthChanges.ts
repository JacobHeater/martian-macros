import type { HealthSample } from './HealthSample';

interface HealthChangesInit {
  nextToken: string;
  upserted?: readonly HealthSample[];
  deletedIds?: readonly string[];
  tokenExpired?: boolean;
}

/** What changed on the platform since a token was issued (MM-67). */
export class HealthChanges {
  /** Readings added or edited, each in its latest state. */
  readonly upserted: readonly HealthSample[];

  /** The platform ids of readings deleted. */
  readonly deletedIds: readonly string[];

  /** What to ask with next time. Empty when `tokenExpired`. */
  readonly nextToken: string;
  readonly tokenExpired: boolean;

  constructor(init: HealthChangesInit) {
    this.nextToken = init.nextToken;
    this.upserted = init.upserted ?? [];
    this.deletedIds = init.deletedIds ?? [];
    this.tokenExpired = init.tokenExpired ?? false;
  }

  /**
   * The platform no longer honors the token asked with: nothing is known
   * of what changed, and everything has to be read again from no token.
   */
  static expired(): HealthChanges {
    return new HealthChanges({ nextToken: '', tokenExpired: true });
  }
}
