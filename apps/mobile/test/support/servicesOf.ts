import type { FixedClock } from '../../src/fixtures/FixedClock';
import type { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { fixtureServices } from '../../src/gallery/fixtureServices';
import type { AppServices } from '../../src/state/AppServices';

/** The stores `repos` holds, with `clock`, as the app takes them: the same ones the stories use (MM-237). */
export function servicesOf(repos: InMemoryRepositories, clock: FixedClock): AppServices {
  return fixtureServices(repos, clock);
}
