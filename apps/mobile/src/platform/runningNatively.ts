import { Capacitor } from '@capacitor/core';

/** Whether the app is inside its native shell, where the phone's own storage and plugins are. */
export function runningNatively(): boolean {
  return Capacitor.isNativePlatform();
}
