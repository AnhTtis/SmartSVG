import { defineConfig } from 'vite';

// The Studio app lives in playground/, so serve and build from there.
// The engine source (../svgEngine) is imported directly by playground/main.ts.
export default defineConfig({
  root: 'playground',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
