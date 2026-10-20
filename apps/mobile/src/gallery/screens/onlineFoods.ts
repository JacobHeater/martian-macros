import { Unavailable } from '../../domain/integration/Unavailable';
import type { PackEntry } from '../../foodCatalog/PackEntry';
import { InMemoryOnlineFoodSource } from '../../foodOnline/InMemoryOnlineFoodSource';
import type { StoryDevice } from './StoryDevice';
import { storyOnlineNoodles } from './storyOnlineFoods';

/**
 * A phone whose build can ask Open Food Facts (MM-58): the service answers
 * from `entries`, or cannot be reached when `down`.
 */
export function onlineFoods({ entries = [storyOnlineNoodles], down = false }: { entries?: readonly PackEntry[]; down?: boolean } = {}): StoryDevice {
  return async (services) => {
    const source = new InMemoryOnlineFoodSource('off', entries);
    if (down) source.failWith(new Unavailable('No connection.'));
    return { ...services, onlineSources: [source] };
  };
}
