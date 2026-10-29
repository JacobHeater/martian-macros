import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-694: `openAppServices` opens the photo database inside the lazy repository, on first use, never at start. Before
 * the fix it was awaited at start, and a start made while the phone was locked died at it (MM-157's protection).
 */
it('the photo database is opened on first use, inside the lazy repository, never when the services open', () => {
  const source = readFileSync('src/app/openAppServices.ts', 'utf8');
  expect(source).toMatch(/new LazyProgressPhotoRepository\(async \(\) =>[\s\S]*?name: `\$\{databaseName\}-photos`/);
  expect(source).not.toMatch(/const progressPhotos = await/);
});
