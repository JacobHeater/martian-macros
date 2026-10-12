import type { PackEntry } from '../foodCatalog/PackEntry';
import type { BuildReport } from './BuildReport';

/** What a build produced, before it is written to files. */
export interface PackBuildResult {
  /** Foods without barcodes, sorted by name. */
  readonly generic: readonly PackEntry[];

  /** Products with barcodes, sorted by barcode. */
  readonly barcode: readonly PackEntry[];
  readonly report: BuildReport;
}
