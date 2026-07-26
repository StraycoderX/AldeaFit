import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Single-file build.
 *
 * Produces one self-contained bundle for hosts that serve a lone HTML document
 * with no sibling assets. Differences from the normal build:
 *  - One IIFE chunk instead of ES modules, since there is no server to resolve
 *    a relative import against.
 *  - CSS is not split out.
 *  - Service worker registration is compiled out; there is no scope to claim.
 */
export default defineConfig({
  base: './',
  define: {
    __ENABLE_SERVICE_WORKER__: 'false',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-single',
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
});
