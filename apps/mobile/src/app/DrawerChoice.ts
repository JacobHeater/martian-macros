import type { HomeDestination } from '../state/HomeDestination';

/** What a row of the drawer stands for (MM-704): a destination, a screen pushed over it, or this phone's move code (MM-716). */
export type DrawerChoice = HomeDestination | 'profile' | 'library' | 'qrCode' | 'settings';
