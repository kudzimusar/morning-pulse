import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Get environment variables - Vite automatically loads .env files
  const firebaseConfig = process.env.VITE_FIREBASE_CONFIG || '';
  
  // For Vite define, we need to pass the JSON string properly
  // The firebase-config.js file will be the primary source for runtime
  // This env var is a fallback
  let configValue = 'null';
  if (firebaseConfig && firebaseConfig.trim()) {
    try {
      // Validate it's JSON by parsing first
      const parsed = JSON.parse(firebaseConfig);
      // Store as JSON string for the client to parse (double-stringify for Vite define)
      configValue = JSON.stringify(firebaseConfig);
    } catch (e) {
      // If it's not valid JSON, set to null and let firebase-config.js handle it
      console.warn('⚠️ VITE_FIREBASE_CONFIG is not valid JSON, will use hardcoded fallback');
      configValue = 'null';
    }
  } else {
    console.log('ℹ️ VITE_FIREBASE_CONFIG not set, will use hardcoded fallback config');
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
    // CSP headers for local development
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: http: data: blob:; connect-src 'self' https: http: wss:; frame-src 'self' https:;"
      }
    },
    // Expose environment variables to the client
    define: {
      'import.meta.env.VITE_FIREBASE_CONFIG': configValue,
      'import.meta.env.VITE_APP_ID': JSON.stringify('morning-pulse-app')
    }
  };
});

