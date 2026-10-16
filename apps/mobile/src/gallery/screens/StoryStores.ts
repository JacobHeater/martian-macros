import type { AppServices } from '../../state/AppServices';

/**
 * How the story's storage behaves, in place of the fixtures' always-ready
 * reads: a read that has not come back yet, or one that went wrong (MM-321).
 */
export type StoryStores = (services: AppServices) => AppServices;
