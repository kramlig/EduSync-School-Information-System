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

console.log('[Firebase] 🔧 Initializing with config:', firebaseConfig);
console.log('[Firebase] 🔧 Raw env vars:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  emulatorHost: import.meta.env.VITE_FIRESTORE_EMULATOR_HOST,
});

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

// CRITICAL: Force long polling to avoid WebChannel 400 errors in emulator
// WebChannel has issues with the Firestore emulator causing connection exhaustion
console.log('[Firebase] 🔧 Force long polling: ENABLED (hardcoded)');

// NUCLEAR OPTION: Set experimental settings BEFORE app initialization
// This is the ONLY way to truly disable WebChannel
(globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// Modern approach: Use Fetch API instead of WebChannel
// This bypasses WebChannel entirely and uses standard HTTP
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  // Use Fetch API for all requests (no WebChannel)
  experimentalAutoDetectLongPolling: false,
  experimentalForceLongPolling: true,
  // @ts-ignore - undocumented but necessary option
  useFetchStreams: false,
} as any);
const auth = getAuth(app);
const storage = getStorage(app);

// Check if we're using emulator (needed for persistence logic)
const projId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const looksLocal = /(^|-)local$|demo/.test(projId);
const useFsEmuFlag = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
const fsHostEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined;
const shouldUseFsEmu = useFsEmuFlag || !!fsHostEnv || looksLocal;

// Optional: connect to emulators if requested or auto-detected
try {
  // Firestore emulator
  const fsPortEnv = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT as string | undefined;
  console.log(`[Firebase] Emulator config check: useFsEmuFlag=${useFsEmuFlag}, fsHostEnv=${fsHostEnv}, fsPortEnv=${fsPortEnv}, shouldUseFsEmu=${shouldUseFsEmu}`);
  if (shouldUseFsEmu) {
    let host = '127.0.0.1';
    let port = 8086; // Use updated port from firebase.json
    if (fsHostEnv && fsHostEnv.includes(':')) {
      const [h, p] = fsHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = fsHostEnv || host;
      const parsed = Number(fsPortEnv || '8086'); // Use updated port
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectFirestoreEmulator(db as any, host, port);
    console.info(`[Firebase] Firestore emulator connected: ${host}:${port} (projectId=${projId || 'no-project-id-set'})`);
  }
  // Auth emulator
  const useAuthFlag = String(import.meta.env.VITE_USE_AUTH_EMULATOR || '').toLowerCase() === 'true';
  const authHostEnv = import.meta.env.VITE_AUTH_EMULATOR_HOST as string | undefined;
  const authPortEnv = import.meta.env.VITE_AUTH_EMULATOR_PORT as string | undefined;
  const shouldUseAuthEmu = useAuthFlag || !!authHostEnv || looksLocal; // Simplify logic to directly use flag or host
  if (shouldUseAuthEmu) {
    let host = '127.0.0.1';
    let port = 9100; // Use updated port from firebase.json
    if (authHostEnv && authHostEnv.includes(':')) {
      const [h, p] = authHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = authHostEnv || host;
      const parsed = Number(authPortEnv || '9100'); // Use updated port
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
    let port = 9200; // Use updated port from firebase.json
    if (storageHostEnv && storageHostEnv.includes(':')) {
      const [h, p] = storageHostEnv.split(':');
      host = h || host;
      const parsed = Number(p);
      if (!Number.isNaN(parsed)) port = parsed;
    } else {
      host = storageHostEnv || host;
      const parsed = Number(storagePortEnv || '9200'); // Use updated port
      if (!Number.isNaN(parsed)) port = parsed;
    }
    connectStorageEmulator(storage, host, port);
    console.info(`[Firebase] Storage emulator: ${host}:${port}`);
  }
} catch (e) {
  console.warn('[Firebase] Emulator connection failed or not configured:', e);
}

// Enable persistence (but skip for emulator to reduce connection overhead)
// Attempt to enable multi-tab IndexedDB persistence for better cross-tab UX
// Fallback to single-tab persistence if multi-tab is not available (e.g., private mode)
const isEmulator = shouldUseFsEmu; // Using emulator check from above
if (!isEmulator) {
  // Only enable persistence in production (not emulator)
  (async () => {
    try {
      await enableMultiTabIndexedDbPersistence(db as any);
      console.info('[Firebase] ✅ Multi-tab IndexedDB persistence enabled.');
    } catch (e: any) {
      try {
        await enableIndexedDbPersistence(db as any);
        console.info('[Firebase] ✅ Single-tab IndexedDB persistence enabled (multi-tab unavailable).');
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn('[Firebase] ⚠️ Persistence not enabled:', err && err.message ? err.message : err);
      }
    }
  })();
} else {
  console.info('[Firebase] 🔧 Persistence disabled for emulator (reduces connection overhead)');
}


// Ensure we have an authenticated user for write-permission rules.
// Use a readiness promise so other modules can await before writing.
let authReadyResolve: undefined | (() => void);
let authReadyResolved = false;
let authInitialized = false; // Prevent duplicate initialization
const authReady: Promise<void> = new Promise((resolve) => { 
  authReadyResolve = () => { 
    if (!authReadyResolved) { 
      authReadyResolved = true; 
      resolve(); 
      console.info('[Firebase] Auth ready:', auth.currentUser?.uid || '(anon)'); 
    } 
  }; 
});

// Single initialization of auth
if (!authInitialized) {
  authInitialized = true;
  
  try {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user && authReadyResolve) { 
        try { authReadyResolve(); } catch {} 
      }
    });
    
    // Perform anonymous sign-in if needed
    (async () => {
      try {
        if (!auth.currentUser) {
          console.log('[Firebase] Performing anonymous sign-in...');
          await signInAnonymously(auth);
          console.log('[Firebase] Anonymous sign-in successful');
        } else {
          console.log('[Firebase] User already authenticated:', auth.currentUser.uid);
        }
      } catch (err) {
        console.warn('[Firebase] Anonymous sign-in failed (writes may 403 if rules require auth):', (err as any)?.message || err);
      } finally {
        if (auth.currentUser && authReadyResolve) { 
          try { authReadyResolve(); } catch {} 
        }
      }
    })();
  } catch (e) {
    console.warn('[Firebase] Anonymous auth setup failed:', e);
  }
}

// Export services
export const getFirestoreInstance = () => {
  console.log("[Firebase] getFirestoreInstance called, returning db:", db);
  return db;
};
export { auth, storage };
export const waitForAuthReady = async () => { await authReady; };
