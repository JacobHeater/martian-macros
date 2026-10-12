import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The app is served from files inside a native shell, never from a site, so
// every built path is relative.
// Where to read the list of downloadable packs (MM-56): the address the
// Flutter builds were given, from the repository's build config. Only the
// native shell uses it; a browser build offers no downloads.
const manifestUrl =
  process.env['MM_FOOD_PACK_MANIFEST_URL'] ??
  (JSON.parse(readFileSync(new URL('../../config/prod.json', import.meta.url), 'utf8')) as Record<string, string>)[
    'MM_FOOD_PACK_MANIFEST_URL'
  ] ??
  '';

export default defineConfig({
  base: './',
  define: { __MM_FOOD_PACK_MANIFEST_URL__: JSON.stringify(manifestUrl) },
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  // The evidence register is one file, docs/evidence.md at the top of the
  // repository, and the app is built with it; nothing else is read from
  // outside this folder.
  server: { fs: { allow: ['.', '../../docs'] } },
  test: {
    // Only tests of what is drawn need a browser's document. Making one for
    // each file of rules and arithmetic took most of the run.
    projects: [
      {
        extends: true,
        test: {
          name: 'rules',
          environment: 'node',
          include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'screens',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'test/**/*.test.tsx'],
          setupFiles: ['test/setup.ts'],
          css: true,
          // These draw the whole app and walk through it; several screens' worth
          // takes longer than the default on a busy machine.
          testTimeout: 20000,
        },
      },
    ],
  },
});
