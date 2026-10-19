import type { Platform } from '../domain';

/**
 * What the phone's health platform is called where the app names it (MM-69):
 * Apple Health on an iPhone, Health Connect everywhere else, since the
 * browser draws the app as it is on an Android phone.
 */
export const healthPlatformName = (platform: Platform): string => (platform === 'ios' ? 'Apple Health' : 'Health Connect');
