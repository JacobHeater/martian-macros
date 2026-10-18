// MM-52: builds the food packs from a DuckDB extract. Run by `mm food
// build`; vite resolves the app's TypeScript the same way the tests do.
import { createServer } from 'vite';

const option = (name) => {
  const at = process.argv.indexOf(name);
  return at >= 0 && at + 1 < process.argv.length ? process.argv[at + 1] : undefined;
};

const extract = option('--extract');
const provenance = option('--provenance');
const out = option('--out');
const prefer = option('--prefer') ?? 'reliability';
const expected = (option('--expect') ?? '').split(',').filter((id) => id !== '');
if (!extract || !provenance || !out) {
  console.error(
    'Usage: node scripts/food-build.mjs --extract DIR --provenance FILE --out DIR [--prefer reliability|recent|off|usda_branded] [--expect id,id,...]',
  );
  process.exit(64);
}

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { PackBuilder } = await server.ssrLoadModule('/src/foodPipeline/PackBuilder.ts');
  const { MostRecentPolicy } = await server.ssrLoadModule('/src/foodPipeline/MostRecentPolicy.ts');
  const { PreferredSourcePolicy } = await server.ssrLoadModule('/src/foodPipeline/PreferredSourcePolicy.ts');
  const { ReliabilityPolicy } = await server.ssrLoadModule('/src/foodPipeline/ReliabilityPolicy.ts');
  const { readExtract } = await server.ssrLoadModule('/src/foodPipeline/node/readExtract.ts');
  const { readBuildProvenance } = await server.ssrLoadModule('/src/foodPipeline/node/readBuildProvenance.ts');
  const { writePacks } = await server.ssrLoadModule('/src/foodPipeline/node/writePacks.ts');

  // The app's own reliability score decides a shared barcode (MM-383); the older rules stay for comparison builds.
  const policy =
    prefer === 'reliability'
      ? new ReliabilityPolicy()
      : prefer === 'recent'
        ? new MostRecentPolicy({ tieBreak: 'off' })
        : new PreferredSourcePolicy(prefer);
  const result = await new PackBuilder({ policy, expectedSources: expected }).build(readExtract(extract));
  await writePacks(result, readBuildProvenance(provenance), out);
  console.log(`packs written to ${out}`);
  console.log(result.report.format());
  const missing = result.report.missingSources;
  if (missing.length > 0) {
    // A configured source that gave nothing means a file name or a data type is wrong (MM-383): not fit to publish.
    console.error(`Build failed: ${missing.join(', ')} read or wrote nothing. Check the source's files and extract.sql.`);
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
