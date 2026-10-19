import type { StoryDevice } from './StoryDevice';

/**
 * The story's phone is an iPhone (MM-403), with whatever `device` brings
 * besides: the app names Apple Health, and offers nothing iOS has not got.
 */
export function onIos(device?: StoryDevice): StoryDevice {
  return async (services) => {
    const brought = device === undefined ? services : await device(services);
    return { ...brought, platform: 'ios' };
  };
}
