import type { InsightArea } from '../domain/InsightArea';

/** One rule of the inline catalog as Settings > Coach lists it (MM-364): its title and an example of its line. */
export interface InlineInsightRule {
  readonly area: InsightArea;
  readonly title: string;
  readonly example: string;
  /** Left out entirely with an eating-disorder history (MM-362), so never offered as a switch. */
  readonly notWithEatingDisorderHistory?: boolean;
}
