import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/morning-pulse/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  define: {
    // Inject Firebase config at build time if available
    'import.meta.env.VITE_FIREBASE_CONFIG': JSON.stringify(process.env.VITE_FIREBASE_CONFIG || '')
  }
});

