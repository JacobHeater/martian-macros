import type { Watched } from '../../lang/Watched';

/** Reads whether carbohydrate is shown as net (MM-396). */
export interface NetCarbsReader {
  /** The setting, then each change. On until it is switched off. */
  watchNetCarbs(): Watched<boolean>;
}
