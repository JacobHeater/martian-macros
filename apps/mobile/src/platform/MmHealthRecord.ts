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
}
