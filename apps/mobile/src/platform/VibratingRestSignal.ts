import type { RestSignal } from '../domain/integration/RestSignal';

/**
 * Signals the end of a rest with one vibration (MM-191), where the phone
 * can. The system decides whether it vibrates, so its own settings are
 * respected.
 */
export class VibratingRestSignal implements RestSignal {
  restOver(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(400);
  }
}
