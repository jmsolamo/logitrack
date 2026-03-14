import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (error) {
    console.error("FIREBASE ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT. Using manual env vars fallback.", error.message);
  }
} 

if (!serviceAccount) {
  // If no environment variable, try to load the JSON file (for local development)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const keyPath = join(__dirname, 'serviceAccountKey.json');
  
  if (existsSync(keyPath)) {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  }
}

try {
  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized via full service account.");
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Vercel strict fallback: Initialize using individual separated variables if the massive JSON fails
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log("Firebase Admin initialized via individual environment variables.");
    }
  } else {
    console.error("FIREBASE CRITICAL WARNING: No service account or required variables provided (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL). Firebase will crash.");
  }
} catch (error) {
  console.error("FIREBASE INITIALIZATION CRASH: ", error.message);
}

export default admin;
