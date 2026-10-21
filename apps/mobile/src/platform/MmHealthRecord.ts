/**
 * One Health Connect reading as the plugin hands it over (MM-68), its
 * value still in the platform's unit; `healthConnectSample` turns it into
 * the app's. A workout or a day of flow carries no number.
 */
export interface MmHealthRecord {
  readonly id: string;
  readonly type: string;
  readonly value?: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly sourceId: string;
  readonly sourceName: string;
  /** The device that took it, its maker and model as the platform names them, or '' (MM-502). */
  readonly deviceId?: string;
  /** Whether the person typed it in rather than a device measuring it (MM-502). */
  readonly manual?: boolean;
}
