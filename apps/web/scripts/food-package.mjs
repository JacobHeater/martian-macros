// MM-56: compresses built packs and writes the manifest to publish. Run by
// `mm food package`; nothing is uploaded here.
import { createServer } from 'vite';

const option = (name) => {
  const at = process.argv.indexOf(name);
  return at >= 0 && at + 1 < process.argv.length ? process.argv[at + 1] : undefined;
};

const packs = option('--packs');
const out = option('--out');
const baseUrl = option('--base-url');
if (!packs || !out || !baseUrl) {
  console.error('Usage: node scripts/food-package.mjs --packs DIR --out DIR --base-url https://...');
  process.exit(64);
}

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { packagePacks } = await server.ssrLoadModule('/src/foodPipeline/node/packagePacks.ts');
  await packagePacks({ packs, out, baseUrl: new URL(baseUrl) });
  console.log(`publishable packs and manifest written to ${out}`);
} finally {
  await server.close();
}
