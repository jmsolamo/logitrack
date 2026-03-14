import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // On Vercel, read from environment variable
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // CRITICAL FIX: Vercel environment variables often escape newlines. We must unescape the private key.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", error);
  }
} else {
  // On local machine, read from the JSON file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const keyPath = join(__dirname, 'serviceAccountKey.json');
  
  if (existsSync(keyPath)) {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error("FIREBASE WARNING: No service account provided. Authentication checks will fail.");
}

export default admin;
