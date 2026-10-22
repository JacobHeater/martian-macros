import type { MmHealthSegment } from './MmHealthSegment';

/**
 * One workout as the plugin hands it over (MM-489): its span, whether the
 * platform calls it strength (MM-188's types), the id the app that wrote it
 * gave it ("" for none) and, from Health Connect, its segments.
 */
export interface MmHealthWorkout {
  readonly id: string;
  readonly clientId: string;
  readonly strength: boolean;
  readonly startMs: number;
  readonly endMs: number;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly segments: readonly MmHealthSegment[];
  /**
   * Written by this app, as the platform says by its source (MM-489,
   * MM-490): never imported, whatever its client id. Absent from an older
   * plugin, where the client id alone tells.
   */
  readonly ours?: boolean;
}
