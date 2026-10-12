import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The app is served from files inside a native shell, never from a site, so
// every built path is relative.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    css: true,
  },
});
