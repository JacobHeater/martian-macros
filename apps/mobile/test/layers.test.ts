import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * MM-230: the layers the Dart packages kept apart stay apart. Each layer is
 * a folder of `src/` and may import only the layers listed for it.
 */
const allowed: Record<string, readonly string[]> = {
  lang: [],
  domain: ['lang'],
  engine: ['lang', 'domain'],
  healthIngest: ['lang'],
  sql: ['lang'],
  // A catalog food carries its food group (MM-616), a domain type the coach reads too.
  foodCatalog: ['lang', 'domain', 'sql'],
  foodPipeline: ['lang', 'domain', 'foodCatalog', 'sql'],
  // Foods looked up online (MM-58): the services behind the domain's JSON seam, mapped with the pipeline's own rules.
  foodOnline: ['lang', 'domain', 'foodCatalog', 'foodPipeline'],
  fixtures: ['lang', 'domain', 'engine', 'healthIngest'],
  data: ['lang', 'domain', 'engine', 'healthIngest', 'sql'],
  format: ['lang', 'domain', 'engine', 'healthIngest', 'foodCatalog'],
  platform: ['lang', 'domain', 'healthIngest'],
  // The logs as they are told to the health platform (MM-70, MM-314, MM-489): over the domain's repositories and the writers' seams.
  healthWrite: ['lang', 'domain', 'engine', 'healthIngest'],
  // The backup's format, cipher and the phone's part of it (MM-63): over the database connection and the plugin's API.
  backup: ['lang', 'domain', 'sql', 'platform'],
  // Moving to another phone (MM-697): the link, the sealed stream and the code, over the plugin's API.
  transfer: ['lang', 'domain', 'platform'],
  state: ['lang', 'domain', 'engine', 'healthIngest', 'foodCatalog', 'foodOnline', 'platform', 'backup', 'transfer'],
};

/**
 * Node's own modules exist on a developer's machine and not in the app, so
 * only a folder called `node` may import them: the file steps of a developer
 * tool, which no screen can reach.
 */
const isNodeOnly = (file: string) => relative(src, file).split(sep).includes('node');

const src = resolve('src');

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** The layer a file of `src/` is in: its first folder. */
function layerOf(path: string): string {
  return relative(src, path).split(/[\\/]/)[0] ?? '';
}

function importsOf(path: string): string[] {
  const text = readFileSync(path, 'utf8');
  return [...text.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map((found) => found[1] as string);
}

describe('layers', () => {
  for (const [layer, mayImport] of Object.entries(allowed)) {
    it(`${layer} imports only ${mayImport.length === 0 ? 'itself' : `itself and ${mayImport.join(', ')}`}`, () => {
      const files = filesIn(join(src, layer));
      expect(files.length).toBeGreaterThan(0);
      const broken: string[] = [];
      for (const file of files) {
        for (const specifier of importsOf(file)) {
          // A library is the architecture test's business (which folder may import it).
          if (!specifier.startsWith('.')) continue;
          const target = layerOf(resolve(dirname(file), specifier));
          if (target !== layer && !mayImport.includes(target)) {
            broken.push(`${relative(src, file)} imports ${specifier}`);
          }
        }
      }
      expect(broken).toEqual([]);
    });
  }

  it('only a folder called node imports Node, and nothing outside it imports that folder', () => {
    const broken: string[] = [];
    for (const file of filesIn(src)) {
      if (isNodeOnly(file)) continue;
      for (const specifier of importsOf(file)) {
        const reachesNode = specifier.startsWith('node:') || specifier.split('/').includes('node');
        if (reachesNode) broken.push(`${relative(src, file)} imports ${specifier}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
