# Firebase Configuration Setup

## Getting Your Firebase Web App Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0999441419`
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" and select the web icon `</>`
7. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "gen-lang-client-0999441419.firebaseapp.com",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "gen-lang-client-0999441419.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## For Local Development

1. Create a file `.env.local` in the `website` directory
2. Add your Firebase config as a JSON string:

```bash
VITE_FIREBASE_CONFIG={"apiKey":"YOUR_API_KEY","authDomain":"gen-lang-client-0999441419.firebaseapp.com","projectId":"gen-lang-client-0999441419","storageBucket":"gen-lang-client-0999441419.appspot.com","messagingSenderId":"YOUR_MESSAGING_SENDER_ID","appId":"YOUR_APP_ID"}
```

## For GitHub Pages

1. Create `website/public/firebase-config.js` with:

```javascript
window.__firebase_config = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gen-lang-client-0999441419.firebaseapp.com",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "gen-lang-client-0999441419.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Note:** This file contains public keys and is safe to commit. The API key is restricted by domain in Firebase Console.

## Security Note

The Firebase web config is safe to expose publicly. However, make sure to:
1. Set up Firebase App Check (recommended)
2. Configure Firestore security rules properly
3. Restrict API key by domain in Google Cloud Console if needed

## Firestore Security Rules (required for public pages)

If the public site reads from Firestore under `artifacts/{APP_ID}/public/data/**`, the simplest safe baseline is:
- **Allow reads for authenticated users** (`request.auth != null`) — this includes **anonymous auth**
- **Keep writes locked down** (typically to staff/editor accounts)

Example snippet to ensure public reads work (adjust as needed for your project):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```
