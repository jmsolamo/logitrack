import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let serviceAccount;

// Try environment variable first
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log('Firebase: Using FIREBASE_SERVICE_ACCOUNT env variable');
  } catch (error) {
    console.error("FIREBASE ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT.", error.message);
  }
}

// Try individual env variables
if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
    console.log('Firebase: Using individual env variables (PROJECT_ID, PRIVATE_KEY, CLIENT_EMAIL)');
  } catch (error) {
    console.error("FIREBASE ERROR: Failed to parse individual env variables.", error.message);
  }
}

// Try local JSON file
if (!serviceAccount) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const keyPath = join(__dirname, 'serviceAccountKey.json');
  
  if (existsSync(keyPath)) {
    try {
      serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
      console.log('Firebase: Using local serviceAccountKey.json file');
    } catch (error) {
      console.error("FIREBASE ERROR: Failed to read serviceAccountKey.json.", error.message);
    }
  }
}

// Initialize Firebase Admin
if (serviceAccount) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase Admin initialized successfully');
    } else {
      console.log('✓ Firebase Admin already initialized');
    }
  } catch (error) {
    console.error('✗ FIREBASE INITIALIZATION ERROR:', error.message);
    throw error;
  }
} else {
  console.error('✗ FIREBASE CRITICAL ERROR: No valid credentials found!');
  console.error('  Please set one of the following:');
  console.error('  1. FIREBASE_SERVICE_ACCOUNT (full JSON)');
  console.error('  2. FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  console.error('  3. config/serviceAccountKey.json file');
}

export default admin;
