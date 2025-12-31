import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Get environment variables
  const firebaseConfig = process.env.VITE_FIREBASE_CONFIG || '';
  
  // Parse and re-stringify to ensure it's valid JSON
  // This handles cases where the env var is already a JSON string
  let configValue = 'null';
  if (firebaseConfig && firebaseConfig.trim()) {
    try {
      // Try to parse it first to validate it's JSON
      const parsed = JSON.parse(firebaseConfig);
      // Then stringify it properly for injection
      configValue = JSON.stringify(JSON.stringify(parsed));
    } catch (e) {
      // If parsing fails, it might be malformed - just pass it through as-is
      // The app will handle the error
      console.warn('⚠️ VITE_FIREBASE_CONFIG is not valid JSON, passing through as-is');
      configValue = JSON.stringify(firebaseConfig);
    }
  }
  
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
      'import.meta.env.VITE_FIREBASE_CONFIG': configValue,
      'import.meta.env.VITE_APP_ID': JSON.stringify('morning-pulse-app')
    }
  };
});

