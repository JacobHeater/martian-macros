import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The app is served from files inside a native shell, never from a site, so
// every built path is relative.
export default defineConfig({
  base: './',
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
