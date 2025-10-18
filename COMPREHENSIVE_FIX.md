/**
 * COMPREHENSIVE FIX FOR INFINITE LOOP
 * 
 * This file contains the complete solution to prevent infinite re-renders
 * caused by real-time Firestore listeners.
 * 
 * APPLY THIS FIX AFTER CHECKING DEBUG LOGS
 */

// ============================================================================
// FIX 1: Add throttling to useSchoolData.ts
// ============================================================================

// Add these imports at the top of useSchoolData.ts
import { useRef, useCallback } from 'react';

// Add these helper functions BEFORE the useSchoolData function
const createThrottledUpdater = (delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingUpdate: any = null;

  return {
    schedule: (callback: () => void) => {
      pendingUpdate = callback;
      
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          if (pendingUpdate) {
            pendingUpdate();
            pendingUpdate = null;
          }
          timeoutId = null;
        }, delay);
      }
    },
    flush: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pendingUpdate) {
        pendingUpdate();
        pendingUpdate = null;
      }
    }
  };
};

// Inside useSchoolData hook, add this after useState:
const gradesUpdater = useRef(createThrottledUpdater(1000));
const sagUpdater = useRef(createThrottledUpdater(1000));
const announcementsUpdater = useRef(createThrottledUpdater(1000));

// Then modify the subscribeCollection calls:

// BEFORE:
/*
const stopGrades = subscribeCollection<Grade>(key, 'grades', async (items) => {
    setState(prev => ({ ...prev, grades: mergeGrades(prev.grades, items) }));
    try { await dbService.bulkPut('grades', items as any); } catch {}
});
*/

// AFTER:
const stopGrades = subscribeCollection<Grade>(key, 'grades', async (items) => {
    gradesUpdater.current.schedule(() => {
        setState(prev => ({ ...prev, grades: mergeGrades(prev.grades, items) }));
    });
    try { await dbService.bulkPut('grades', items as any); } catch {}
});

// Same for SAG:
const stopSag = subscribeCollection<StudentAssignmentGrade>(
    'studentAssignmentGrades:all',
    'studentAssignmentGrades',
    async (items) => {
        sagUpdater.current.schedule(() => {
            setState(prev => ({
                ...prev,
                studentAssignmentGrades: mergeSAG(prev.studentAssignmentGrades, items)
            }));
        });
        try { await dbService.bulkPut('studentAssignmentGrades', items as any); } catch {}
    }
);

// Same for announcements onSnapshot:
const unsub = onSnapshot(announcementsCol, async (snap) => {
    if (snap.metadata.hasPendingWrites) return;
    
    announcementsUpdater.current.schedule(() => {
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) })) as Announcement[];
        let changed = false;
        const mapLocal = new Map(state.announcements?.map(a => [a.id, a]));
        
        for (const doc of docs) {
            const prev = mapLocal.get(doc.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(doc)) {
                mapLocal.set(doc.id, doc as any);
                changed = true;
            }
        }
        
        if (changed) {
            const merged = Array.from(mapLocal.values());
            setState(prev => ({ ...prev, announcements: merged }));
            try { dbService.bulkPut('announcements', merged); } catch {}
        }
    });
});

// In cleanup function, flush pending updates:
return () => {
    gradesUpdater.current.flush();
    sagUpdater.current.flush();
    announcementsUpdater.current.flush();
    // ... existing cleanup
};

// ============================================================================
// FIX 2: Memoize schoolData in App.tsx (SAFER APPROACH)
// ============================================================================

// In App.tsx, replace the schoolData usage with this:

const schoolDataRaw = useSchoolData();

// Memoize to prevent unnecessary re-renders
const schoolData = useMemo(() => {
  console.log('[App] schoolData memoization check');
  return schoolDataRaw;
}, [
  // Only re-create when these specific properties change
  schoolDataRaw.loading,
  schoolDataRaw.error,
  schoolDataRaw.students.length,
  schoolDataRaw.teachers.length,
  schoolDataRaw.parents.length,
  schoolDataRaw.sections.length,
  schoolDataRaw.grades.length,
  schoolDataRaw.learningAreas.length,
  schoolDataRaw.classSchedules.length,
  schoolDataRaw.attendanceRecords.length,
  schoolDataRaw.assignments.length,
  schoolDataRaw.studentAssignmentGrades.length,
  schoolDataRaw.announcements.length,
  schoolDataRaw.coreValues.length,
  schoolDataRaw.coreValueGrades.length,
  schoolDataRaw.lessonPlans.length,
  schoolDataRaw.substituteAssignments.length,
  // Settings object - track specific fields
  schoolDataRaw.settings.schoolName,
  schoolDataRaw.settings.schoolYear,
  schoolDataRaw.settings.currentQuarter,
]);

// ============================================================================
// FIX 3: React.memo for child components (OPTIONAL, RECOMMENDED)
// ============================================================================

// Wrap major components with React.memo to prevent unnecessary re-renders

// In StudentList.tsx:
export default React.memo(StudentList, (prevProps, nextProps) => {
  // Only re-render if these specific props changed
  return (
    prevProps.schoolData.students.length === nextProps.schoolData.students.length &&
    prevProps.schoolData.sections.length === nextProps.schoolData.sections.length &&
    prevProps.session.user.id === nextProps.session.user.id
  );
});

// Same pattern for other heavy components:
// - TeacherList
// - ParentsView
// - SectionsView
// - GradesView
// - etc.

// ============================================================================
// FIX 4: Emergency disable (USE ONLY IF ABOVE FAILS)
// ============================================================================

/*
// In useSchoolData.ts, temporarily disable real-time listeners:

// Comment out these lines:
const stopGrades = subscribeCollection<Grade>(...);  // DISABLED
const stopSag = subscribeCollection<StudentAssignmentGrade>(...);  // DISABLED
const unsub = onSnapshot(announcementsCol, ...);  // DISABLED

// Add manual refresh button in UI instead
*/

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
1. Clear browser cache and hard reload
2. Open console and check for:
   - [App] MOUNTED should appear ONCE
   - [App] render should be minimal (< 10 in first 5 seconds)
   - [useSchoolData] mounted should appear ONCE
   - No "[Broadcast]" spam
   
3. Navigate between pages - should not cause remounts

4. Wait 30 seconds - should see < 5 renders

5. Open Network tab - should see steady but not excessive Firestore requests
   - Acceptable: 1-2 requests per minute
   - Bad: 10+ requests per second

6. Test real-time sync:
   - Open in two tabs
   - Edit a grade in one tab
   - Should see update in other tab within 1-2 seconds

7. Check performance:
   - CPU usage should be low
   - No browser freezing
   - Scrolling should be smooth
*/

export {};
