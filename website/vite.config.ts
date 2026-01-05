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
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob: https://images.unsplash.com https://*.unsplash.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://images.unsplash.com https://source.unsplash.com wss://*.firebaseio.com; font-src 'self' https://fonts.gstatic.com data:; frame-src 'self' https://*.firebaseapp.com;"
      }
    },
    // Expose environment variables to the client
    define: {
      'import.meta.env.VITE_FIREBASE_CONFIG': configValue,
      'import.meta.env.VITE_APP_ID': JSON.stringify('morning-pulse-app')
    }
  };
});

