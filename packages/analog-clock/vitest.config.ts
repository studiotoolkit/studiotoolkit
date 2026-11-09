import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Load the face stylesheets for real (Vitest blanks CSS by default)
    css: { include: [/src\/faces\/.*\.css/] },
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
