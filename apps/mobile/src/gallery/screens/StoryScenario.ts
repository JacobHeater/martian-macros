import type { CalendarDate } from '../../domain/CalendarDate';
import type { InMemoryRepositories } from '../../fixtures/InMemoryRepositories';

/** Puts into `repos` what a story's person has stored, as of `today`. */
export type StoryScenario = (repos: InMemoryRepositories, today: CalendarDate) => Promise<void>;
