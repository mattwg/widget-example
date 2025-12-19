import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ============================================
  // DEVELOPMENT MODE (Standalone App)
  // ============================================
  // Run with: npm run dev
  // - Widget runs as normal React SPA on localhost:3001
  // - Uses mock authentication for testing
  // - Entry point: index.html -> standalone.tsx
  if (mode === 'development') {
    return {
      plugins: [react()],
      server: {
        port: 3001,
        cors: true,
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
        },
      },
    };
  }

  // ============================================
  // PRODUCTION MODE (Embeddable Library)
  // ============================================
  // Run with: npm run build
  // - Outputs single IIFE bundle: widget.iife.js
  // - Exposes window.MyWidget global API
  // - Bundles React and all dependencies inline
  // - Entry point: embed.tsx
  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/embed.tsx'),
        name: 'MyWidget',
        fileName: 'widget',
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          // Bundle everything into one file (React, dependencies, etc.)
          inlineDynamicImports: true,
          // Ensure CSS is injected into the JS bundle
          assetFileNames: 'widget.[ext]',
        },
      },
      // Generate source maps for debugging
      sourcemap: true,
      // Don't minify for demo purposes (easier to read/debug)
      minify: false,
    },
  };
});


