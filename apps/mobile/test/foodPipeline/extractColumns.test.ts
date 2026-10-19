import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-409: the Open Food Facts read in extract.sql names only columns the
 * export has. The export's header of 2026-10-19 is kept beside this test;
 * the build failed when the export renamed `brands` to `brands_en`.
 */
const sql = readFileSync(new URL('../../src/foodPipeline/node/extract.sql', import.meta.url), 'utf8');
const header = new Set(
  readFileSync(new URL('./support/off-header-2026-10-19.txt', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== ''),
);

/** The Open Food Facts branch: from its comment to its WHERE clause. */
const offBranch = (): string => {
  const from = sql.indexOf('-- Open Food Facts: products sold');
  const to = sql.indexOf('ORDER BY source, source_id', from);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return sql.slice(from, to);
};

it("every column the Open Food Facts read names is in the export's header", () => {
  const branch = offBranch();
  const quoted = [...branch.matchAll(/"([a-z0-9_-]+)"/g)].map((m) => m[1] as string);
  // Bare names are looked for once the quoted ones are gone, so "vitamin-c_100g" does not leave a "c_100g".
  const unquoted = branch.replaceAll(/"[a-z0-9_-]+"/g, '');
  const bare = [...unquoted.matchAll(/\b(code|product_name|brands(?:_en|_tags)?|serving_size|serving_quantity|last_modified_t|countries_tags|[a-z]+_100g)\b/g)].map(
    (m) => m[1] as string,
  );
  const named = [...new Set([...quoted, ...bare])].filter((name) => !name.startsWith('try_')).sort();
  expect(named.length).toBeGreaterThan(20);
  const missing = named.filter((name) => !header.has(name));
  expect(missing).toEqual([]);
});

it('reads the export without strict parsing, which DuckDB 1.5 would otherwise stop on', () => {
  expect(offBranch()).toMatch(/off\.csv\.gz'[^;]*strict_mode = false/);
});
