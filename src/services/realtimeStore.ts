import { onSnapshot, collection, CollectionReference, DocumentData } from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreService';

// Simple singleton registry to avoid duplicate listeners per query key
// Key contract: caller passes a unique string key per logical subscription (e.g., `studentAssignmentGrades:school:${schoolId}`)

type Unsub = () => void;
const registry = new Map<string, Unsub>();

export function subscribeCollection<T = DocumentData>(key: string, colName: string, onData: (items: T[], hasLocalPending: boolean) => void) {
  // De-dup: if already subscribed, no-op
  if (registry.has(key)) return () => {};
  const db = getFirestoreInstance();
  const col = collection(db as any, colName) as CollectionReference<DocumentData>;
  const unsub = onSnapshot(col, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as T[];
    const hasLocalPending = snap.metadata.hasPendingWrites;
    onData(items, hasLocalPending);
  }, (err) => {
    console.warn(`[realtimeStore] onSnapshot error for ${colName}:`, err?.message || err);
  });
  registry.set(key, unsub);
  return () => {
    try { const u = registry.get(key); if (u) u(); } catch {}
    registry.delete(key);
  };
}

export function unsubscribe(key: string) {
  const u = registry.get(key);
  if (u) {
    try { u(); } catch {}
    registry.delete(key);
  }
}

export function unsubscribeAll(prefix?: string) {
  for (const [key, u] of registry.entries()) {
    if (prefix && !key.startsWith(prefix)) continue;
    try { u(); } catch {}
    registry.delete(key);
  }
}
