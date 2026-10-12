import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
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
};

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
          if (target !== layer && !mayImport.includes(target)) {
            broken.push(`${relative(src, file)} imports ${specifier}`);
          }
        }
      }
      expect(broken).toEqual([]);
    });
  }
});
