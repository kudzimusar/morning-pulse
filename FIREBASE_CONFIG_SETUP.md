# Firebase Configuration Setup for Website

## The Problem
The website needs Firebase web app configuration to connect to Firestore and display real-time news.

## Solution

### Step 1: Get Your Firebase Web App Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0999441419`
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" and select the web icon `</>`
7. Copy the config object that looks like this:

```javascript
{
  apiKey: "AIza...",
  authDomain: "gen-lang-client-0999441419.firebaseapp.com",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "gen-lang-client-0999441419.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

### Step 2: Add to GitHub Secrets

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `FIREBASE_CONFIG`
5. Value: Paste the entire config object as a JSON string (one line):
   ```json
   {"apiKey":"AIza...","authDomain":"gen-lang-client-0999441419.firebaseapp.com","projectId":"gen-lang-client-0999441419","storageBucket":"gen-lang-client-0999441419.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abcdef"}
   ```
6. Click "Add secret"

### Step 3: For Local Development

Create `website/.env.local`:
```bash
VITE_FIREBASE_CONFIG={"apiKey":"YOUR_API_KEY","authDomain":"gen-lang-client-0999441419.firebaseapp.com","projectId":"gen-lang-client-0999441419","storageBucket":"gen-lang-client-0999441419.appspot.com","messagingSenderId":"YOUR_MESSAGING_SENDER_ID","appId":"YOUR_APP_ID"}
```

## How It Works

1. **GitHub Pages**: The workflow uses `FIREBASE_CONFIG` secret to generate `firebase-config.js` during build
2. **Local Dev**: Uses `.env.local` with `VITE_FIREBASE_CONFIG`
3. **Runtime**: The website loads `firebase-config.js` which sets `window.__firebase_config`

## Security Note

The Firebase web config is safe to expose publicly. The API key is restricted by domain in Firebase Console. However, make sure:
- Firestore security rules are properly configured
- Consider enabling Firebase App Check for additional security
