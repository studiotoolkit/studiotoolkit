import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Temporarily disable React Compiler due to compatibility issues
      // babel: {
      //   plugins: [["babel-plugin-react-compiler"]],
      // },
    }),
  ],
  resolve: {
    alias: {
      // Ensure only one copy of React is used
      react: resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
