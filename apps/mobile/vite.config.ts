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

// A FoodData Central API key, when the build has one (MM-58): from the
// environment or the git-ignored config/prod.local.json. Without one the app
// asks only Open Food Facts, which needs no key. Never committed.
const fdcApiKey =
  process.env['MM_FDC_API_KEY'] ??
  (() => {
    try {
      return (JSON.parse(readFileSync(new URL('../../config/prod.local.json', import.meta.url), 'utf8')) as Record<string, string>)['MM_FDC_API_KEY'];
    } catch {
      return undefined;
    }
  })() ??
  '';

// Which identity the shell around this build has (MM-8): the real app, the
// dev twin beside it, or the seeded demo. Only the demo may seed itself,
// and only the demo has its own database name. A build with none given is
// the dev one, which is also what a browser is.
const identity = process.env['MM_IDENTITY'] ?? 'dev';
if (!['prod', 'dev', 'demo'].includes(identity)) throw new Error(`MM_IDENTITY must be prod, dev or demo, not "${identity}".`);

// A build made by `mm demo --seed` replaces the demo app's data with the
// synthetic scenario on every launch (MM-177). Never set for a normal build.
const demoSeed = process.env['MM_DEMO_SEED'] === '1';
if (demoSeed && identity !== 'demo') throw new Error('Only the demo identity may seed itself (MM-177).');

/**
 * MM-619: the screen tests whose assertions depend on the stylesheets
 * (`toBeVisible` and the like, where CSS hides or shows a part). Only these
 * load the CSS; every other screen test runs without it.
 */
const styled = [
  'test/app.test.tsx',
  'test/app/termsOfUse.test.tsx',
  'test/coach/headsUpSection.test.tsx',
  'test/food/emptyDayCruft.test.tsx',
  'test/food/waterAndMicros.test.tsx',
  'test/settings/appleHealth.test.tsx',
  'test/settings/privacyPolicy.test.tsx',
  'test/settings/settingsAccordion.test.tsx',
  'test/ui/components.test.tsx',
  'test/ui/section.test.tsx',
];

export default defineConfig({
  base: './',
  define: {
    __MM_FOOD_PACK_MANIFEST_URL__: JSON.stringify(manifestUrl),
    __MM_FDC_API_KEY__: JSON.stringify(fdcApiKey),
    __MM_DEMO_SEED__: demoSeed,
    __MM_IDENTITY__: JSON.stringify(identity),
  },
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  // The evidence register is one file, docs/evidence.md at the top of the
  // repository, and the app is built with it; nothing else is read from
  // outside this folder.
  // `mm run --live` (MM-300, MM-557) builds the Android or iOS shell while the
  // server runs; their outputs, the Storybook build and dist are never sources
  // to reload on.
  server: {
    fs: { allow: ['.', '../../docs'] },
    watch: { ignored: ['**/android/**', '**/ios/**', '**/storybook-static/**', '**/dist/**'] },
  },
  test: {
    // What the stories draw (MM-321, `npm run unseen`): the app's components,
    // not the stories themselves. Off unless asked for.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.tsx'],
      exclude: ['src/**/*.stories.tsx', 'src/gallery/**'],
      reporter: ['json'],
      reportsDirectory: 'coverage/stories',
    },
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
          // The stories are drawn once, under coverage, by `npm run unseen`; the tests that need the
          // stylesheets run in screens-css (MM-619).
          exclude: ['test/gallery/stories/**', ...styled, 'node_modules/**'],
          setupFiles: ['test/setup.ts', 'test/fastComputedStyle.ts'],
          // MM-619: no stylesheets. With them, nine tenths of a screen test's time went to jsdom
          // matching every CSS rule for each role query's visibility check (CI's CPU profile, 2026-10-25).
          css: false,
          // These draw the whole app and walk through it; several screens' worth
          // takes longer than the default on a busy machine.
          testTimeout: 20000,
        },
      },
      {
        extends: true,
        test: {
          // MM-619: the screen tests whose assertions read the stylesheets (visibility set by CSS).
          name: 'screens-css',
          environment: 'jsdom',
          include: styled,
          setupFiles: ['test/setup.ts'],
          css: true,
          testTimeout: 20000,
        },
      },
      {
        extends: true,
        test: {
          // Every story drawn and walked (MM-237), in shards so they spread over the workers (MM-619).
          name: 'stories',
          environment: 'jsdom',
          include: ['test/gallery/stories/*.test.tsx'],
          setupFiles: ['test/setup.ts', 'test/fastComputedStyle.ts'],
          // The stories are looked at for their words, not their styles (MM-619).
          css: false,
          // Drawn under coverage (MM-321), a story with a long walk takes longer than a screen test does bare.
          testTimeout: 30000,
        },
      },
    ],
  },
});
