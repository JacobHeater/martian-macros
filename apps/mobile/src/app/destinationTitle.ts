import type { DestinationId } from './DestinationId';

/** The name at the top of a destination. Dashboard and Food are about a day. */
export function destinationTitle(id: DestinationId): string {
  switch (id) {
    case 'dashboard':
    case 'food':
      return 'Today';
    case 'train':
      return 'Train';
    case 'progress':
      return 'Progress';
    case 'coach':
      return 'Coach';
  }
}
