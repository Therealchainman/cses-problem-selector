import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const entry = process.env.ENTRY as 'content' | 'background';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: entry === 'content',
    rollupOptions: {
      input: entry === 'content'
        ? { content: resolve(__dirname, 'src/content/index.tsx') }
        : { background: resolve(__dirname, 'src/background/index.ts') },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        name: 'Extension',
      },
    },
    cssCodeSplit: false,
  },
  publicDir: entry === 'content' ? 'public' : false,
});
