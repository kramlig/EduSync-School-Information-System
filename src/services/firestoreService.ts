import { initializeApp } from 'firebase/app';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, connectFirestoreEmulator, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
// Ensure projectId is set (emulator requires a non-empty projectId)
if (!firebaseConfig.projectId) {
  (firebaseConfig as any).projectId = 'edusync-local';
}
const app = initializeApp(firebaseConfig);
const forceLongPolling = String(import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING || '').toLowerCase() === 'true';
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  // When ad blockers or corporate proxies interfere with WebChannel, long-polling avoids blocks
  ...(forceLongPolling ? { experimentalForceLongPolling: true } : { experimentalAutoDetectLongPolling: true }),
} as any);
const auth = getAuth(app);
const storage = getStorage(app);

// Optional: connect to emulators if requested or auto-detected
try {
  const projId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  // DISABLED auto-detection - causing issues in production
  // const looksLocal = /(^|-)local$|demo/.test(projId);
  const looksLocal = false; // Force disable emulator auto-detection
  // Firestore emulator
  const useFsEmuFlag = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
  const fsHostEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined; // may be host or host:port
  const fsPortEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT as string | undefined;
  const shouldUseFsEmu = useFsEmuFlag || !!fsHostEnv || looksLocal;
  console.log(`[Firebase] Emulator config check: useFsEmuFlag=${useFsEmuFlag}, fsHostEnv=${fsHostEnv}, fsPortEnv=${fsPortEnv}, shouldUseFsEmu=${shouldUseFsEmu}`);
  if (shouldUseFsEmu) {
    let host = '127.0.0.1';
    let port = 8085; // project default in firebase.json
    if (fsHostEnv && fsHostEnv.includes(':')) {
      const [h, p] = fsHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = fsHostEnv || host;
      const parsed = Number(fsPortEnv || '8085');
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectFirestoreEmulator(db as any, host, port);
    console.info(`[Firebase] Firestore emulator connected: ${host}:${port} (projectId=${projId || 'no-project-id-set'})`);
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
  // Storage emulator
  const useStorageFlag = String(import.meta.env.VITE_USE_STORAGE_EMULATOR || '').toLowerCase() === 'true';
  const storageHostEnv = import.meta.env.VITE_STORAGE_EMULATOR_HOST as string | undefined;
  const storagePortEnv = import.meta.env.VITE_STORAGE_EMULATOR_PORT as string | undefined;
  const shouldUseStorageEmu = useStorageFlag || !!storageHostEnv || looksLocal;
  if (shouldUseStorageEmu) {
    let host = '127.0.0.1';
    let port = 9199;
    if (storageHostEnv && storageHostEnv.includes(':')) {
      const [h, p] = storageHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = storageHostEnv || host;
      const parsed = Number(storagePortEnv || '9199');
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectStorageEmulator(storage, host, port);
    console.info(`[Firebase] Storage emulator: ${host}:${port}`);
  }
} catch (e) {
  console.warn('[Firebase] Emulator connection failed or not configured:', e);
}

// Attempt to enable multi-tab IndexedDB persistence for better cross-tab UX
// Fallback to single-tab persistence if multi-tab is not available (e.g., private mode)
(async () => {
  try {
    await enableMultiTabIndexedDbPersistence(db as any);
    console.info('[Firebase] Multi-tab IndexedDB persistence enabled.');
  } catch (e: any) {
    try {
      await enableIndexedDbPersistence(db as any);
      console.info('[Firebase] Single-tab IndexedDB persistence enabled (multi-tab unavailable).');
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn('[Firebase] Persistence not enabled:', err && err.message ? err.message : err);
    }
  }
})();

// Ensure we have an authenticated user for write-permission rules.
// Use a readiness promise so other modules can await before writing.
let authReadyResolve: undefined | (() => void);
let authReadyResolved = false;
const authReady: Promise<void> = new Promise((resolve) => { authReadyResolve = () => { if (!authReadyResolved) { authReadyResolved = true; resolve(); console.info('[Firebase] Auth ready:', auth.currentUser?.uid || '(anon)'); } }; });

try {
  onAuthStateChanged(auth, (user) => {
    if (user && authReadyResolve) { try { authReadyResolve(); } catch {} }
  });
  (async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.warn('[Firebase] Anonymous sign-in failed (writes may 403 if rules require auth):', (err as any)?.message || err);
    } finally {
      if (auth.currentUser && authReadyResolve) { try { authReadyResolve(); } catch {} }
    }
  })();
} catch (e) {
  console.warn('[Firebase] Anonymous auth setup failed:', e);
}

// Export services
export const getFirestoreInstance = () => {
  console.log("[Firebase] getFirestoreInstance called, returning db:", db);
  return db;
};
export { auth, storage };
export const waitForAuthReady = async () => { await authReady; };
