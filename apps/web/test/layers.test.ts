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
  foodCatalog: ['lang', 'sql'],
  foodPipeline: ['lang', 'domain', 'foodCatalog', 'sql'],
  fixtures: ['lang', 'domain', 'engine', 'healthIngest'],
  data: ['lang', 'domain', 'engine', 'healthIngest', 'sql'],
};

/**
 * A library that reaches something outside the app, and the one folder
 * that may import it: its adapter (MM-159, MM-231). Everything else goes
 * through the interface the adapter implements.
 */
const adapters: Record<string, string> = {
  '@sqlite.org/sqlite-wasm': 'sql/wasm/',
  '@capacitor/core': 'platform/',
};

/**
 * Node's own modules exist on a developer's machine and not in the app, so
 * only a folder called `node` may import them: the file steps of a developer
 * tool, which no screen can reach.
 */
const isNodeOnly = (file: string) => relative(src, file).split(sep).includes('node');

const inFolder = (file: string, folder: string) => relative(src, file).split(sep).join('/').startsWith(folder);

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
          const target = specifier.startsWith('.') ? layerOf(resolve(dirname(file), specifier)) : specifier;
          const adapterFolder = adapters[specifier];
          if (adapterFolder !== undefined && inFolder(file, adapterFolder)) continue;
          if (specifier.startsWith('node:') && isNodeOnly(file)) continue;
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

  for (const [library, folder] of Object.entries(adapters)) {
    it(`only ${folder} imports ${library}`, () => {
      const outside = filesIn(src)
        .filter((file) => !inFolder(file, folder) && importsOf(file).includes(library))
        .map((file) => relative(src, file));
      expect(outside).toEqual([]);
    });
  }
});
