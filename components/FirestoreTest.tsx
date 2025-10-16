import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer, getDocs, query, limit } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { getAll, count as idbCount, StoreName } from '../src/services/dbService';
import { enqueueWrite, getQueueLength, startAutoSync, stopAutoSync, getAllQueued, flushItem, deleteQueued } from '../src/services/firestoreSync';

const db = getFirestoreInstance();

const FirestoreTest: React.FC = () => {
  const [counts, setCounts] = useState<{ users?: number; students?: number; grades?: number }>({});
  const [sampleUser, setSampleUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueLen, setQueueLen] = useState<number | null>(null);
  const [lastIdemKey, setLastIdemKey] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [queueItems, setQueueItems] = useState<any[] | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If navigator reports offline, skip remote reads and use IndexedDB fallback
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          // offline: use IDB
          const [usersLocal, studentsLocal, gradesLocal] = await Promise.all([
            idbCount('users' as StoreName),
            idbCount('students' as StoreName),
            idbCount('grades' as StoreName),
          ]);
          if (!mounted) return;
          setCounts({ users: usersLocal, students: studentsLocal, grades: gradesLocal });

          const localUsers = await getAll('users' as StoreName);
          if (!mounted) return;
          if (localUsers && localUsers.length > 0) setSampleUser(localUsers[0]);
          if (mounted) setError('Offline: showing local IndexedDB data');
          return;
        }

        // Try Firestore reads first
        const usersCountSnap = await getCountFromServer(collection(db, 'users'));
        const studentsCountSnap = await getCountFromServer(collection(db, 'students'));
        const gradesCountSnap = await getCountFromServer(collection(db, 'grades'));
        if (!mounted) return;
        setCounts({ users: usersCountSnap.data().count, students: studentsCountSnap.data().count, grades: gradesCountSnap.data().count });

        const q = query(collection(db, 'users'), limit(1));
        const docs = await getDocs(q);
        if (!mounted) return;
        if (!docs.empty) setSampleUser(docs.docs[0].data());
      } catch (e: any) {
        console.warn('FirestoreTest remote read failed, falling back to IndexedDB:', e && e.message ? e.message : e);
        try {
          const [usersLocal, studentsLocal, gradesLocal] = await Promise.all([
            idbCount('users' as StoreName),
            idbCount('students' as StoreName),
            idbCount('grades' as StoreName),
          ]);
          if (!mounted) return;
          setCounts({ users: usersLocal, students: studentsLocal, grades: gradesLocal });

          const localUsers = await getAll('users' as StoreName);
          if (!mounted) return;
          if (localUsers && localUsers.length > 0) setSampleUser(localUsers[0]);
          if (mounted) setError('Using local IndexedDB fallback after Firestore error');
        } catch (idbErr: any) {
          console.error('IndexedDB fallback also failed', idbErr);
          if (mounted) setError((idbErr && idbErr.message) || String(idbErr) || (e && e.message) || String(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    // refresh queue length
    (async () => { try { const l = await getQueueLength(); if (mounted) setQueueLen(l);} catch(e){} })();
    return () => { mounted = false; };
  }, []);

  async function handleEnqueue() {
    try {
      // enqueue and capture the idempotency key
  const qid = await enqueueWrite('users', { mock: true, name: 'Queued User ' + Date.now(), createdAt: new Date().toISOString() });
  const items = (await getAllQueued()) as any[];
  const added = items.find((it: any) => it.id === qid);
      const idem = added?.idemKey ?? null;
      setLastIdemKey(idem);
      const l = await getQueueLength();
      setQueueLen(l);
      alert('Enqueued write id=' + qid + (idem ? '\nidemKey=' + idem : ''));
    } catch (e: any) {
      alert('Failed to enqueue: ' + (e && e.message ? e.message : String(e)));
    }
  }

  async function handleRefreshQueue() {
    const l = await getQueueLength();
    setQueueLen(l);
    // also refresh items for inspector
    setInspectorLoading(true);
    try {
      const items = (await getAllQueued()) as any[];
      setQueueItems(items);
    } finally {
      setInspectorLoading(false);
    }
  }

  async function handleRetryItem(id: number) {
    setInspectorLoading(true);
    try {
      const res = await flushItem(id);
      if (res.applied) {
        alert('Item applied');
      } else {
        alert('Item not applied: ' + (res.error ? String(res.error) : 'unknown'));
      }
      await handleRefreshQueue();
    } finally { setInspectorLoading(false); }
  }

  async function handleDeleteItem(id: number) {
    setInspectorLoading(true);
    try {
      await deleteQueued(id);
      await handleRefreshQueue();
    } finally { setInspectorLoading(false); }
  }

  function handleToggleAutoSync() {
    if (!autoSync) {
      startAutoSync(30_000);
      setAutoSync(true);
    } else {
      stopAutoSync();
      setAutoSync(false);
    }
  }

  return (
    <div className="mt-6 p-4 rounded-md bg-slate-50 dark:bg-slate-700">
      <h3 className="text-lg font-medium mb-2">Firestore Test</h3>
      {loading && <div>Loading Firestore data...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded">Users: {counts.users ?? '—'}</div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded">Students: {counts.students ?? '—'}</div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded">Grades: {counts.grades ?? '—'}</div>
          </div>
          <div>
            <h4 className="font-semibold">Sample user</h4>
            {sampleUser ? <pre className="text-xs">{JSON.stringify(sampleUser, null, 2)}</pre> : <div>No sample user found</div>}
          </div>
        </div>
      )}
      <div className="mt-4">
        <h4 className="font-semibold">Offline sync queue</h4>
        <div className="flex items-center gap-3 mt-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleEnqueue}>Enqueue test write</button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={handleRefreshQueue}>Refresh queue</button>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleToggleAutoSync}>{autoSync ? 'Stop AutoSync' : 'Start AutoSync'}</button>
          <div>Queue length: {queueLen ?? '—'}</div>
        </div>
        {lastIdemKey && <div className="mt-2 text-sm">Last idempotency key: <code className="text-xs">{lastIdemKey}</code></div>}
        <div className="mt-4">
          <h5 className="font-semibold">Queue inspector</h5>
          <div className="mt-2">
            <button className="px-2 py-1 bg-gray-200 rounded" onClick={handleRefreshQueue}>Refresh inspector</button>
          </div>
          <div className="mt-2 text-sm">
            {inspectorLoading && <div>Loading...</div>}
            {!inspectorLoading && queueItems && queueItems.length === 0 && <div>No queued items</div>}
            {!inspectorLoading && queueItems && queueItems.length > 0 && (
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr><th className="text-left">id</th><th>collection</th><th>idem</th><th>attempts</th><th>actions</th></tr>
                </thead>
                <tbody>
                  {queueItems.map(it => (
                    <tr key={it.id} className="align-top border-t">
                      <td className="py-1">{it.id}</td>
                      <td className="py-1">{it.collection}</td>
                      <td className="py-1"><code className="text-xs">{it.idemKey}</code></td>
                      <td className="py-1">{it.attempts ?? 0}</td>
                      <td className="py-1">
                        <button className="px-2 py-1 bg-blue-500 text-white rounded mr-2" onClick={() => handleRetryItem(it.id)}>Retry</button>
                        <button className="px-2 py-1 bg-red-500 text-white rounded mr-2" onClick={() => handleDeleteItem(it.id)}>Delete</button>
                        <details className="inline-block"><summary className="underline cursor-pointer">View</summary><pre className="text-xs">{JSON.stringify(it.doc, null, 2)}</pre></details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreTest;
