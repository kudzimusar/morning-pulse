// Firebase Web Configuration
// This file will be injected at runtime for GitHub Pages
// For local development, create a .env.local file with VITE_FIREBASE_CONFIG

// You can get your Firebase web config from:
// Firebase Console > Project Settings > General > Your apps > Web app

// Example structure (replace with your actual values):
window.__firebase_config = window.__firebase_config || {
  apiKey: "YOUR_API_KEY",
  authDomain: "gen-lang-client-0999441419.firebaseapp.com",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "gen-lang-client-0999441419.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// REMOVED: Gemini API Key - Now handled securely via backend proxy
// The API key is no longer exposed in frontend code
// All Gemini API calls go through askPulseAIProxy Cloud Function
