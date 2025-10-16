import { initializeApp } from 'firebase/app';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
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
// Attempt to enable multi-tab IndexedDB persistence for better cross-tab UX
enableIndexedDbPersistence(db as any).catch((err) => {
  // eslint-disable-next-line no-console
  console.warn('[Firebase] Persistence not enabled:', err && err.message ? err.message : err);
});
const auth = getAuth(app);

// Optional: connect to emulators if requested or auto-detected
try {
  const projId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  const looksLocal = /(^|-)local$|demo/.test(projId);
  // Firestore emulator
  const useFsEmuFlag = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
  const fsHostEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined; // may be host or host:port
  const fsPortEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT as string | undefined;
  const shouldUseFsEmu = useFsEmuFlag || !!fsHostEnv || looksLocal;
  if (shouldUseFsEmu) {
    let host = '127.0.0.1';
    let port = 8080;
    if (fsHostEnv && fsHostEnv.includes(':')) {
      const [h, p] = fsHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = fsHostEnv || host;
      const parsed = Number(fsPortEnv || '8080');
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectFirestoreEmulator(db as any, host, port);
    console.info(`[Firebase] Firestore emulator: ${host}:${port} (${projId || 'no-project-id-set'})`);
  }
  // Auth emulator
  const useAuthFlag = String(import.meta.env.VITE_USE_AUTH_EMULATOR || '').toLowerCase() === 'true';
  const authHostEnv = import.meta.env.VITE_AUTH_EMULATOR_HOST as string | undefined;
  const authPortEnv = import.meta.env.VITE_AUTH_EMULATOR_PORT as string | undefined;
  const shouldUseAuthEmu = useAuthFlag || !!authHostEnv || looksLocal;
  if (shouldUseAuthEmu) {
    let host = '127.0.0.1';
    let port = 9099;
    if (authHostEnv && authHostEnv.includes(':')) {
      const [h, p] = authHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = authHostEnv || host;
      const parsed = Number(authPortEnv || '9099');
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectAuthEmulator(auth as any, `http://${host}:${port}`, { disableWarnings: true });
    console.info(`[Firebase] Auth emulator: ${host}:${port}`);
  }
} catch (e) {
  console.warn('[Firebase] Emulator connection failed or not configured:', e);
}

// Export services
export const getFirestoreInstance = () => db;
export { auth };
