import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Get environment variables
  const firebaseConfig = process.env.VITE_FIREBASE_CONFIG || '';
  
  return {
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
    // Expose environment variables to the client
    define: {
      'import.meta.env.VITE_FIREBASE_CONFIG': JSON.stringify(firebaseConfig),
      'import.meta.env.VITE_APP_ID': JSON.stringify('morning-pulse-app')
    }
  };
});

