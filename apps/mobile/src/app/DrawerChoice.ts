import type { HomeDestination } from '../state/HomeDestination';

/** What a row of the drawer stands for (MM-704): a destination of the bar, or a screen pushed over it. */
export type DrawerChoice = HomeDestination | 'profile' | 'library' | 'settings';
