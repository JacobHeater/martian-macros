/**
 * The part of the `MmBackup` plugin that keeps the photos private (MM-157):
 * the phone's own lock, and a screen kept out of the app switcher and, on
 * Android, out of screenshots. On the plugin that hands things to the
 * phone, so no new plugin is registered.
 */
export interface MmPrivacyApi {
  /** Asks for the phone's lock (biometric or passcode), saying `reason`. */
  unlock(options: { reason: string }): Promise<{ outcome: 'unlocked' | 'refused' | 'noLock' }>;

  /** Hides the screen from the app switcher and screenshots while `on`. */
  protectScreen(options: { on: boolean }): Promise<void>;
}
