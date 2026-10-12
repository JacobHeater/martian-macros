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
const prefer = option('--prefer') ?? 'recent';
if (!extract || !provenance || !out) {
  console.error('Usage: node scripts/food-build.mjs --extract DIR --provenance FILE --out DIR [--prefer recent|off|usda_branded]');
  process.exit(64);
}

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { PackBuilder } = await server.ssrLoadModule('/src/foodPipeline/PackBuilder.ts');
  const { MostRecentPolicy } = await server.ssrLoadModule('/src/foodPipeline/MostRecentPolicy.ts');
  const { PreferredSourcePolicy } = await server.ssrLoadModule('/src/foodPipeline/PreferredSourcePolicy.ts');
  const { readExtract } = await server.ssrLoadModule('/src/foodPipeline/node/readExtract.ts');
  const { readBuildProvenance } = await server.ssrLoadModule('/src/foodPipeline/node/readBuildProvenance.ts');
  const { writePacks } = await server.ssrLoadModule('/src/foodPipeline/node/writePacks.ts');

  const policy = prefer === 'recent' ? new MostRecentPolicy({ tieBreak: 'off' }) : new PreferredSourcePolicy(prefer);
  const result = await new PackBuilder({ policy }).build(readExtract(extract));
  await writePacks(result, readBuildProvenance(provenance), out);
  console.log(`packs written to ${out}`);
  console.log(result.report.format());
} finally {
  await server.close();
}
