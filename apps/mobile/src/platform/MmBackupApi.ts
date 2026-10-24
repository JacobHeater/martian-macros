import type { MmClipboardApi } from './MmClipboardApi';
import type { MmMealShareApi } from './MmMealShareApi';
import type { MmOpenInBrowserApi } from './MmOpenInBrowserApi';
import type { MmPrivacyApi } from './MmPrivacyApi';

/**
 * The `MmBackup` plugin (MM-63): a consistent copy of a database, a temporary
 * file for a copy brought back, the share sheet and the file picker. Bytes
 * cross the bridge as base64. It also hands an address to the phone's
 * browser (MM-454), being the plugin that hands things to the phone's other
 * apps, keeps the photos private (MM-157), and reads and writes the
 * clipboard (MM-590), and picks a meal's photos and shares them with its
 * prompt (MM-599).
 */
export interface MmBackupApi extends MmOpenInBrowserApi, MmPrivacyApi, MmClipboardApi, MmMealShareApi {
  /** `VACUUM INTO` a temporary file from the database named, returned as base64 and then deleted. */
  snapshot(options: { name: string }): Promise<{ data: string }>;
  /** Writes `data` to a temporary file and gives its path, for `MmDb.open({ path })`. */
  writeTemp(options: { name: string; data: string }): Promise<{ path: string }>;
  /** Removes a temporary file `writeTemp` made. */
  removeTemp(options: { path: string }): Promise<void>;
  /** The share sheet (iOS) or the send chooser (Android) for a file named `name`. */
  share(options: { name: string; data: string }): Promise<{ outcome: 'saved' | 'sent' | 'cancelled' }>;
  /** The document picker; `cancelled` when nothing was chosen. */
  pick(): Promise<{ cancelled: boolean; data?: string }>;
}
