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
}
