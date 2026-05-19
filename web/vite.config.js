import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: true
  },

  preview: {
    host: '0.0.0.0',
    port: 4173
  },

  css: {
    devSourcemap: !isProd
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: !isProd,
    minify: isProd ? 'esbuild' : false,
    cssMinify: isProd,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },

        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  esbuild: {
    drop: isProd
      ? ['console', 'debugger']
      : []
  },

  optimizeDeps: {
    include: []
  },
  plugins: [react()]
});