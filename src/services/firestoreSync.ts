import { getFirestoreInstance } from './firestoreService';
import { doc, setDoc, addDoc, collection, runTransaction, deleteDoc } from 'firebase/firestore';

const db = getFirestoreInstance();

type QueueItem = {
  id?: number;
  collection: string;
  doc: any;
  createdAt: number;
  attempts?: number;
  idemKey?: string;
};

const DB_NAME = 'edusync-sync-queue';
const STORE_NAME = 'queue';

function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addToQueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'attempts'>): Promise<number> {
  const dbi = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
  const now = Date.now();
  const toAdd: QueueItem = { ...item, createdAt: now, attempts: 0 };
    const req = store.add(toAdd as any);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

async function getAllQueued(): Promise<QueueItem[]> {
  const dbi = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueued(id: number): Promise<void> {
  const dbi = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
export { deleteQueued as deleteQueued };

async function getQueuedById(id: number): Promise<QueueItem | null> {
  const dbi = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as QueueItem || null);
    req.onerror = () => reject(req.error);
  });
}

export async function flushItem(id: number): Promise<{ applied: boolean; error?: any }> {
  const it = await getQueuedById(id);
  if (!it) return { applied: false, error: 'not-found' };
  try {
    if (it.idemKey) {
      const idemRef = doc(db, '_sync_idempotency', it.idemKey);
      await runTransaction(db, async (tx) => {
        const idemSnap = await tx.get(idemRef as any);
        if (idemSnap.exists()) return;
        if (it.doc && it.doc.id) {
          const targetRef = doc(db, it.collection, it.doc.id);
          if (it.doc.__delete) {
            // Transactions don't have deleteDoc shortcut; use tx.delete
            (tx as any).delete(targetRef);
          } else {
            tx.set(targetRef as any, it.doc);
          }
        } else {
          const colRef = collection(db, it.collection);
          const autoIdRef = doc(colRef, it.idemKey!);
          tx.set(autoIdRef as any, it.doc);
        }
        tx.set(idemRef as any, { appliedAt: Date.now(), queueId: it.id });
      });
    } else {
      if (it.doc && it.doc.id) {
        const ref = doc(db, it.collection, it.doc.id);
        if (it.doc.__delete) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, it.doc);
        }
      } else {
        await addDoc(collection(db, it.collection), it.doc);
      }
    }
    await deleteQueued(it.id!);
    return { applied: true };
  } catch (err) {
    return { applied: false, error: err };
  }
}

export { getAllQueued as getAllQueued, getQueuedById };

async function updateQueued(item: QueueItem): Promise<void> {
  const dbi = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item as any);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function isRetriableError(err: any) {
  if (!err) return false;
  const m = String(err.message || err).toLowerCase();
  return m.includes('unavailable') || m.includes('timeout') || m.includes('network') || m.includes('econnreset') || m.includes('etimedout');
}

export async function enqueueWrite(collectionName: string, docObj: any): Promise<number> {
  // create an idempotency key for this write
  const idemKey = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  // add to local queue immediately and include idemKey
  const qId = await addToQueue({ collection: collectionName, doc: docObj, idemKey });
  // return both queue id and idempotency key so callers can inspect
  return qId as any as number & { idemKey: string };
}

export async function getQueueLength(): Promise<number> {
  const items = await getAllQueued();
  return items.length;
}

export async function flushQueue(options?: { maxRetries?: number; baseMs?: number }): Promise<{ success: number; failed: number }> {
  const maxRetries = options?.maxRetries ?? 5;
  const baseMs = options?.baseMs ?? 500;
  const items = await getAllQueued();
  let success = 0;
  let failed = 0;

  for (const it of items) {
    try {
      // attempt write with idempotency when an idemKey exists
      if (it.idemKey) {
        // Use a transaction on a dedicated idempotency collection to ensure single-apply
        const idemRef = doc(db, '_sync_idempotency', it.idemKey);
        await runTransaction(db, async (tx) => {
          const idemSnap = await tx.get(idemRef as any);
          if (idemSnap.exists()) {
            // already applied, skip
            return;
          }
          // apply the write
          if (it.doc && it.doc.id) {
            const targetRef = doc(db, it.collection, it.doc.id);
            tx.set(targetRef as any, it.doc);
          } else {
            const colRef = collection(db, it.collection);
            // Firestore transactions don't support addDoc (server-side auto-id) directly;
            // workaround: create a deterministic id using idemKey when no explicit id on doc
            const autoIdRef = doc(colRef, it.idemKey!);
            tx.set(autoIdRef as any, it.doc);
          }
          // mark idem applied
          tx.set(idemRef as any, { appliedAt: Date.now(), queueId: it.id });
        });
      } else {
        // no idem key: best-effort write
        if (it.doc && it.doc.id) {
          await setDoc(doc(db, it.collection, it.doc.id), it.doc);
        } else {
          await addDoc(collection(db, it.collection), it.doc);
        }
      }
      await deleteQueued(it.id!);
      success++;
    } catch (err: any) {
      const attempts = (it.attempts || 0) + 1;
      it.attempts = attempts;
      if (!isRetriableError(err) || attempts > maxRetries) {
        // give up on this item
        await deleteQueued(it.id!);
        failed++;
      } else {
        // update attempts and leave in queue
        await updateQueued(it);
        const backoff = baseMs * Math.pow(2, attempts - 1) + Math.floor(Math.random() * baseMs);
        // wait a small time before next attempt to avoid hot loops
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }

  return { success, failed };
}

let onlineListener: (() => void) | null = null;

export function startAutoSync(intervalMs = 60_000) {
  // flush immediately if online
  if (typeof window !== 'undefined') {
    const tryFlush = async () => {
      if (navigator.onLine) {
        try {
          await flushQueue();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('AutoSync flush error', e);
        }
      }
    };

    // run immediately
    tryFlush();

    // periodic flush
    const iv = setInterval(tryFlush, intervalMs);

    // listen for online event
    const onOnline = () => { tryFlush(); };
    window.addEventListener('online', onOnline);

    onlineListener = () => {
      clearInterval(iv);
      window.removeEventListener('online', onOnline);
    };
  }
}

export function stopAutoSync() {
  if (onlineListener) {
    onlineListener();
    onlineListener = null;
  }
}
