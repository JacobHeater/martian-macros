import type { PhotoSettings } from './PhotoSettings';

/**
 * Whether the progress photo section is offered (MM-157): as chosen in
 * Settings, or else to everyone without an eating-disorder history (MM-11).
 */
export function photosOffered(settings: PhotoSettings | undefined, eatingDisorderHistory: boolean): boolean {
  return settings?.offered ?? !eatingDisorderHistory;
}
