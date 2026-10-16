import type { AppServices } from '../../state/AppServices';

/** What the story's phone brings in place of the fixtures' empty ones: a health platform, a camera (MM-320). */
export type StoryDevice = (services: AppServices) => Promise<AppServices>;
