import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  Auth, 
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  updateDoc, 
  increment, 
  setDoc, 
  Firestore,
  getDoc
} from "firebase/firestore";
import { PollData, UserPreferences } from "../types";
import { INITIAL_POLL_DATA } from "../constants";

// Get globals
const appId = window.__app_id || 'default-app-id';
const firebaseConfigStr = window.__firebase_config || '{}';
const initialAuthToken = window.__initial_auth_token;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

// Mock State for Simulation
let mockPollState: PollData = JSON.parse(JSON.stringify(INITIAL_POLL_DATA));
let mockPollListeners: ((data: PollData) => void)[] = [];

try {
  const config = JSON.parse(firebaseConfigStr);
  // Basic validation to prevent crash if config is empty in dev
  if (Object.keys(config).length > 0) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;
  } else {
    console.warn("Firebase config is empty. App will run in mock mode (UI only).");
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

// Authentication
export const authenticateUser = async (): Promise<User | null> => {
  if (!isInitialized) return null;
  
  try {
    let userCredential;
    if (initialAuthToken) {
      userCredential = await signInWithCustomToken(auth, initialAuthToken);
    } else {
      userCredential = await signInAnonymously(auth);
    }
    return userCredential.user;
  } catch (error) {
    console.error("Auth failed:", error);
    return null;
  }
};

// Polls
const POLL_PATH = `artifacts/${appId}/public/data/polls/current_pulse_poll`;

export const subscribeToPoll = (callback: (data: PollData) => void) => {
  if (!isInitialized) {
    // Register listener for mock updates
    mockPollListeners.push(callback);
    // Send current mock state immediately
    callback(mockPollState);
    return () => {
      mockPollListeners = mockPollListeners.filter(l => l !== callback);
    };
  }

  const pollRef = doc(db, POLL_PATH);
  
  const unsubscribe = onSnapshot(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as PollData);
    } else {
      // Create if doesn't exist
      setDoc(pollRef, INITIAL_POLL_DATA);
      callback(INITIAL_POLL_DATA);
    }
  });

  return unsubscribe;
};

export const submitVote = async (userId: string, optionKey: string) => {
  if (!isInitialized) {
    // --- Mock Mode Logic ---
    // Prevent multiple votes in mock mode if that's the rule, 
    // though for simulation sometimes it's nice to see it update.
    // We'll enforce one vote per user for consistency.
    if (mockPollState.voters[userId]) return;

    // Update local state
    const currentCount = mockPollState.options[optionKey] || 0;
    mockPollState = {
      ...mockPollState,
      options: {
        ...mockPollState.options,
        [optionKey]: currentCount + 1
      },
      voters: {
        ...mockPollState.voters,
        [userId]: optionKey
      },
      totalVotes: mockPollState.totalVotes + 1
    };

    // Notify all listeners
    mockPollListeners.forEach(listener => listener(mockPollState));
    return;
  }

  // --- Real Firestore Logic ---
  const pollRef = doc(db, POLL_PATH);
  
  try {
    await updateDoc(pollRef, {
      [`options.${optionKey}`]: increment(1),
      [`voters.${userId}`]: optionKey,
      totalVotes: increment(1)
    });
  } catch (e) {
    console.error("Vote failed:", e);
  }
};

// User Preferences
export const subscribeToUserPreferences = (userId: string, callback: (prefs: UserPreferences) => void) => {
  if (!isInitialized) {
    callback({ isPremium: false, alertKeywords: [] });
    return () => {};
  }

  const prefPath = `artifacts/${appId}/users/${userId}/preferences/settings`;
  const prefRef = doc(db, prefPath);

  const unsubscribe = onSnapshot(prefRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Ensure defaults
      callback({
        isPremium: data.isPremium || false,
        alertKeywords: data.alertKeywords || []
      });
    } else {
      // Initialize defaults
      const defaults: UserPreferences = { isPremium: false, alertKeywords: [] };
      setDoc(prefRef, defaults);
      callback(defaults);
    }
  });

  return unsubscribe;
};

export const upgradeUserToPremium = async (userId: string) => {
  if (!isInitialized) return;
  const prefPath = `artifacts/${appId}/users/${userId}/preferences/settings`;
  await updateDoc(doc(db, prefPath), { isPremium: true });
};

export const updateUserKeywords = async (userId: string, keywords: string[]) => {
  if (!isInitialized) return;
  const prefPath = `artifacts/${appId}/users/${userId}/preferences/settings`;
  await updateDoc(doc(db, prefPath), { alertKeywords: keywords });
};