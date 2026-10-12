import type { MmNavDestination } from '../ui/MmNavDestination';
import type { DestinationId } from './DestinationId';

/** The destinations in the order they are shown, Dashboard first (MM-99). */
export const destinations: readonly MmNavDestination<DestinationId>[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'train', label: 'Train', icon: 'train' },
  { id: 'progress', label: 'Progress', icon: 'trend' },
  { id: 'coach', label: 'Coach', icon: 'coach' },
];
