import type { InsightArea } from '../domain/InsightArea';

/** Which inline insights are on (MM-364): all of them, each area, each rule by its title. */
export interface InsightSwitches {
  readonly all: boolean;
  readonly offAreas: ReadonlySet<InsightArea>;
  readonly offRules: ReadonlySet<string>;
}
