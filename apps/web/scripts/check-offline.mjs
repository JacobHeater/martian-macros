// MM-229: the built app loads nothing from a network address. It runs from
// files inside a native shell, offline. This reads what the browser would
// fetch: the page's own tags and every stylesheet's url() and @import.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const network = /^(https?:)?\/\//i;
const problems = [];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

for (const path of files(dist)) {
  const where = relative(dist, path);
  const text = /\.(html|css)$/.test(path) ? readFileSync(path, 'utf8') : null;
  if (text === null) continue;
  const loaded = path.endsWith('.html')
    ? [...text.matchAll(/<(?:script|link|img|source|iframe)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    : [...text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi), ...text.matchAll(/@import\s+["']([^"']+)["']/gi)];
  for (const match of loaded) {
    if (network.test(match[1])) problems.push(`${where} loads ${match[1]}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} network load(s) in the built app. It must run offline.`);
  process.exit(1);
}
console.log('Offline check passed: the built app loads nothing from the network.');
