import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * vitest.config.ts
 * ---------------
 * Now includes setupFiles to load "setupTests.ts",
 * ensuring the minimal WebGL mock is in place for JSDOM.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // This is critical:
    setupFiles: ['./src/setupTests.ts']
  }
});