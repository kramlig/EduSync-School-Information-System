import { useState, useEffect } from 'react';
import { onSnapshot, collection, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';

/**
 * Hook to monitor Firestore sync status and track pending writes
 * 
 * @param skip - If true, skip monitoring (returns default values)
 * 
 * Returns:
 * - hasPendingWrites: Whether any documents have pending writes
 * - pendingCount: Number of documents with pending writes
 * 
 * How it works:
 * - Monitors specific collections for metadata changes
 * - Detects doc.metadata.hasPendingWrites flag
 * - Only monitors frequently-edited collections (grades, attendance, announcements)
 * 
 * Example:
 * const { hasPendingWrites, pendingCount } = useFirestoreSyncStatus(shouldSkip);
 * if (hasPendingWrites) {
 *   <Badge>Syncing {pendingCount} changes...</Badge>
 * }
 */
export const useFirestoreSyncStatus = (skip: boolean = false) => {
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Skip monitoring if requested (e.g., for public routes or login page)
    if (skip) {
      setHasPendingWrites(false);
      setPendingCount(0);
      return;
    }
    const db = getFirestoreInstance();
    
    // Monitor only frequently-edited collections to avoid too many listeners
    // Add more collections as needed
    const collectionsToMonitor = [
      'grades',
      'attendanceRecords',
      'announcements',
      'assignments'
    ];
    
    const unsubscribes: (() => void)[] = [];
    const pendingDocs = new Set<string>(); // Track pending doc IDs across collections
    
    collectionsToMonitor.forEach(collectionName => {
      try {
        const colRef = collection(db, collectionName);
        
        // Subscribe with includeMetadataChanges to get hasPendingWrites updates
        const unsubscribe = onSnapshot(
          colRef,
          { includeMetadataChanges: true },
          (snapshot: QuerySnapshot<DocumentData>) => {
            // Check which documents have pending writes
            snapshot.docs.forEach(doc => {
              const docId = `${collectionName}/${doc.id}`;
              
              if (doc.metadata.hasPendingWrites) {
                // Document has unsaved changes
                pendingDocs.add(docId);
              } else {
                // Document is synced
                pendingDocs.delete(docId);
              }
            });
            
            // Update state
            const count = pendingDocs.size;
            setPendingCount(count);
            setHasPendingWrites(count > 0);
            
            if (count > 0) {
              // console.log(`[SyncStatus] 📝 ${count} pending write(s)`);
            }
          },
          (error) => {
            // console.error(`[SyncStatus] ❌ Error monitoring ${collectionName}:`, error);
          }
        );
        
        unsubscribes.push(unsubscribe);
      } catch (error) {
        // console.error(`[SyncStatus] ❌ Failed to monitor ${collectionName}:`, error);
      }
    });

    // Cleanup: Unsubscribe from all listeners
    return () => {
      unsubscribes.forEach(unsub => unsub());
      pendingDocs.clear();
    };
  }, [skip]); // Re-run if skip changes

  return { hasPendingWrites, pendingCount };
};
