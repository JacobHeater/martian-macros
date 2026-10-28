import { Haptics as Plugin, ImpactStyle } from '@capacitor/haptics';
import type { Haptics } from '../domain/integration/Haptics';

/**
 * `Haptics` through Capacitor's plugin (MM-661): the Taptic Engine on iOS,
 * the vibrator on Android, and the browser's vibration where it has one.
 * A phone that refuses is silent, never an error.
 */
export class CapacitorHaptics implements Haptics {
  tap(): void {
    void Plugin.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
  }
}
