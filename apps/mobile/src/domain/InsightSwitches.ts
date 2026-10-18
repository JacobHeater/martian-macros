import type { InsightArea } from './InsightArea';

/**
 * Which inline insights are on (MM-364): all of them, each area, and each
 * kind by its id. Turning all of them off keeps each area's and kind's
 * position, so turning them back on restores it.
 */
export interface InsightSwitches {
  readonly all: boolean;
  readonly offAreas: ReadonlySet<InsightArea>;
  readonly offKinds: ReadonlySet<string>;
}

/** `off` with `key` taken out when it is switched on, put in when off. */
function toggled<T>(off: ReadonlySet<T>, key: T, on: boolean): ReadonlySet<T> {
  const next = new Set(off);
  if (on) next.delete(key);
  else next.add(key);
  return next;
}

export const InsightSwitches = {
  /** Where everyone starts: everything on. */
  allOn: { all: true, offAreas: new Set(), offKinds: new Set() } as InsightSwitches,

  withAll(switches: InsightSwitches, on: boolean): InsightSwitches {
    return { ...switches, all: on };
  },

  withArea(switches: InsightSwitches, area: InsightArea, on: boolean): InsightSwitches {
    return { ...switches, offAreas: toggled(switches.offAreas, area, on) };
  },

  withKind(switches: InsightSwitches, kind: string, on: boolean): InsightSwitches {
    return { ...switches, offKinds: toggled(switches.offKinds, kind, on) };
  },
} as const;
