import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FoodPackFormat } from '../../foodCatalog/FoodPackFormat';
import type { FoodPackHeader } from '../../foodCatalog/FoodPackHeader';
import type { BuildProvenance } from '../BuildProvenance';
import type { PackBuildResult } from '../PackBuildResult';
import { packAttribution, packLicense } from '../packTerms';
import { writePackFile } from './writePackFile';

/** Writes `generic.pack`, `barcode_us.pack` and `report.txt` into the folder `out`. */
export async function writePacks(result: PackBuildResult, provenance: BuildProvenance, out: string): Promise<void> {
  mkdirSync(out, { recursive: true });
  const header = (packId: string): FoodPackHeader => ({
    packId,
    formatVersion: FoodPackFormat.version,
    builtOn: provenance.builtOn,
    region: 'US',
    sources: provenance.sources,
    license: packLicense,
    attribution: packAttribution,
  });
  await writePackFile(join(out, 'generic.pack'), header('generic'), result.generic);
  await writePackFile(join(out, 'barcode_us.pack'), header('barcode_us'), result.barcode);
  writeFileSync(join(out, 'report.txt'), result.report.format());
}
