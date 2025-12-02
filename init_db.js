/**
 * Firebase Database Initialization Script
 * Run this script to initialize the database with default poll data
 */

import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const INITIAL_POLL_DATA = {
  id: 'current_pulse_poll',
  question: "Quick Community Poll: Do you feel the proposed speed limiters for buses will improve road safety?",
  options: {
    "Yes, enforcement will follow.": 0,
    "No, poor enforcement will negate the effect.": 0,
    "I am unsure.": 0
  },
  voters: {},
  totalVotes: 0,
  timestamp: Date.now()
};

async function initializeDatabase() {
  try {
    const appId = process.env.APP_ID || 'default-app-id';
    const pollPath = `artifacts/${appId}/public/data/polls/current_pulse_poll`;
    
    const pollRef = db.doc(pollPath);
    const pollDoc = await pollRef.get();
    
    if (!pollDoc.exists) {
      console.log('Initializing poll data...');
      await pollRef.set(INITIAL_POLL_DATA);
      console.log('✅ Poll data initialized successfully');
    } else {
      console.log('ℹ️  Poll data already exists, skipping initialization');
    }
    
    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

