import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        chatgpt: resolve(__dirname, 'src/content/chatgpt-index.ts'),
        overlay: resolve(__dirname, 'src/overlay/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => `src/${chunkInfo.name}/index.js`,
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Each entry gets its own scope via a wrapper function — prevents
        // minified variable collisions between content and chatgpt scripts
        generatedCode: { arrowFunctions: true },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
