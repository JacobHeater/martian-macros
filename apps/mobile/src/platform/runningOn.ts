import { Capacitor } from '@capacitor/core';
import type { Platform } from '../domain/integration/Platform';

/** Which platform the app is on, from the shell: a browser is `web`. */
export function runningOn(): Platform {
  const named = Capacitor.getPlatform();
  return named === 'ios' || named === 'android' ? named : 'web';
}
