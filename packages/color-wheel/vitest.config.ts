import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: resolve(__dirname, '../../node_modules/.pnpm/react@19.2.4/node_modules/react'),
      'react-dom': resolve(
        __dirname,
        '../../node_modules/.pnpm/react-dom@19.2.4_react@19.2.4/node_modules/react-dom'
      ),
      'react/jsx-runtime': resolve(
        __dirname,
        '../../node_modules/.pnpm/react@19.2.4/node_modules/react/jsx-runtime'
      ),
      'react/jsx-dev-runtime': resolve(
        __dirname,
        '../../node_modules/.pnpm/react@19.2.4/node_modules/react/jsx-dev-runtime'
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
