import { initializeApp } from 'firebase/app';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Read config from Vite env (VITE_ prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate minimal config to avoid cryptic runtime errors
const required = ['apiKey','authDomain','projectId','appId'] as const;
for (const key of required) {
  if (!(firebaseConfig as any)[key]) {
    // eslint-disable-next-line no-console
    console.warn(`[Firebase] Missing VITE_FIREBASE_${key.toUpperCase()} in environment. Local dev may fail until configured.`);
  }
}

// Initialize app
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});
const auth = getAuth(app);

// Optional: connect to emulators if requested
try {
  const useFsEmu = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
  if (useFsEmu) {
    const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost';
    const portRaw = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || '8080';
    const port = Number(portRaw);
    connectFirestoreEmulator(db as any, host, port);
    // eslint-disable-next-line no-console
    console.info(`[Firebase] Connected Firestore emulator at ${host}:${port}`);
  }
  const useAuthEmu = String(import.meta.env.VITE_USE_AUTH_EMULATOR || '').toLowerCase() === 'true';
  if (useAuthEmu) {
    const host = import.meta.env.VITE_AUTH_EMULATOR_HOST || 'localhost';
    const portRaw = import.meta.env.VITE_AUTH_EMULATOR_PORT || '9099';
    const port = Number(portRaw);
    connectAuthEmulator(auth as any, `http://${host}:${port}`, { disableWarnings: true });
    // eslint-disable-next-line no-console
    console.info(`[Firebase] Connected Auth emulator at ${host}:${port}`);
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[Firebase] Emulator connection failed or not configured:', e);
}

// Export services
export const getFirestoreInstance = () => db;
export { auth };
