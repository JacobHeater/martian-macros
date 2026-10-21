// MM-247: the public page of the terms of use and the privacy policy, built
// from the same source the app shows (src/terms/legalPageHtml.ts), so the
// text the stores link to cannot differ from the app's. Writes one folder
// holding index.html and nothing else, which the Pages workflow publishes.
// Usage: node scripts/legal-page.mjs [out-dir]   (default: legal-site)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const app = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(process.argv[2] ?? join(app, 'legal-site'));

// The app's own Vite config is not loaded: the page needs only the text.
const { module } = await runnerImport(join(app, 'src/terms/legalPageHtml.ts'), { configFile: false, root: app, logLevel: 'error' });
const html = module.legalPageHtml();

// The page loads nothing from anywhere; refuse to write one that would.
if (/<(script|link|img|iframe|source)\b|@import|url\(/i.test(html)) {
  console.error('The legal page would load something. It must load nothing (MM-247).');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
console.log(`Legal page written to ${join(out, 'index.html')}`);
