import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `BASE_PATH` lets the same build target a root domain (default) or a GitHub
// Pages project subpath (`/AldeaFit/`). The CI workflow sets it.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // Keep the initial payload small: React is stable and cacheable on its own,
    // so it gets a chunk that survives app-code redeploys.
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/react') ? 'react' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
