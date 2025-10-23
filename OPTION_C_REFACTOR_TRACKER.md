# Option C: Firestore Subscriptions + Service Worker Refactor

**Branch:** `refactor/firestore-subscriptions`  
**Start Date:** October 23, 2025  
**Target:** 3-4 days  
**Status:** 🔄 IN PROGRESS

---

## 🎯 Objective

Remove React Query layer and implement direct Firestore subscriptions with Service Worker for true offline-first architecture.

### Why This Refactor?

**Current Problem:**
- User workflow: Login online → Go offline → Click Students = **BLANK PAGE**
- Root cause: React Query + Firestore Persistence = dual caching systems not synchronized
- Test evidence: `tests/offline-first-visit.spec.ts` shows 0 content rendered

**Solution:**
- Remove React Query abstraction layer
- Use Firestore `onSnapshot()` with real-time subscriptions
- Add Service Worker for app shell caching
- Single source of truth: Firestore SDK

---

## 📊 Impact Assessment

### Files Affected: 27 Total

| Category | Count | Risk Level | Action |
|----------|-------|------------|--------|
| Core Hook | 1 | 🔴 HIGH | Complete rewrite |
| App Root | 1 | 🟡 MEDIUM | Remove React Query provider |
| Component Pages | 25 | 🟢 LOW | Interface-compatible (minimal changes) |
| Tests | 2 | 🟡 MEDIUM | Update for new architecture |

### Component Files (25) - Interface Compatible
✅ No breaking changes expected (consume `SchoolDataHook` interface):

**Staff Views (14):**
- [ ] `components/Dashboard.tsx`
- [ ] `components/StudentList.tsx`
- [ ] `components/TeacherList.tsx`
- [ ] `components/ParentsView.tsx`
- [ ] `components/SectionsView.tsx`
- [ ] `components/UnifiedAssessmentView.tsx`
- [ ] `components/GradebookView.tsx`
- [ ] `components/GradesView.tsx`
- [ ] `components/AttendanceView.tsx`
- [ ] `components/SchedulerView.tsx`
- [ ] `components/SubstituteView.tsx`
- [ ] `components/AssignmentsView.tsx`
- [ ] `components/AnnouncementsView.tsx`
- [ ] `components/CourseList.tsx`

**Shared/Utility Views (7):**
- [ ] `components/UnifiedGradesView.tsx`
- [ ] `components/CoreValuesGradebookView.tsx`
- [ ] `components/LessonPlanView.tsx`
- [ ] `components/GradebookViewNew.tsx`
- [ ] `components/SettingsView.tsx`
- [ ] `components/PrintableReport.tsx`
- [ ] `components/Header.tsx`

**Dashboard Views (4):**
- [ ] `components/StudentDashboard.tsx`
- [ ] `components/ParentDashboard.tsx`
- [ ] `components/StudentProfile.tsx`
- [ ] `App.tsx`

---

## 🗓️ Implementation Plan

### **Phase 1: Core Refactor (Days 1-2)**

#### Day 1 Morning: Backup & New Hook Structure
- [x] Create branch: `refactor/firestore-subscriptions`
- [x] Backup: `hooks/useSchoolData.REACT_QUERY_BACKUP.ts`
- [x] Create tracker: `OPTION_C_REFACTOR_TRACKER.md`
- [ ] Create: `hooks/useFirestoreData.ts` (new implementation)
- [ ] Test: Verify compilation with new hook

**Commit Checkpoint:** `feat: Create new useFirestoreData hook with onSnapshot`

#### Day 1 Afternoon: Implement Firestore Subscriptions
- [ ] Add `onSnapshot()` listeners for all 16 collections
- [ ] Implement `includeMetadataChanges: true` for cache detection
- [ ] Add loading/error state management
- [ ] Add cleanup on unmount
- [ ] Test: Single collection subscription works

**Commit Checkpoint:** `feat: Implement all 16 collection subscriptions`

#### Day 2 Morning: Switch App.tsx to New Hook
- [ ] Remove `@tanstack/react-query` imports from `App.tsx`
- [ ] Replace `useSchoolData()` with `useFirestoreData()`
- [ ] Remove `<QueryClientProvider>`
- [ ] Update conditional rendering logic
- [ ] Test: App compiles and runs

**Commit Checkpoint:** `feat: Switch App.tsx to useFirestoreData`

#### Day 2 Afternoon: Remove React Query Dependencies
- [ ] Delete old `hooks/useSchoolData.ts` (keep backup)
- [ ] Rename `useFirestoreData.ts` → `useSchoolData.ts`
- [ ] Run: `npm uninstall @tanstack/react-query`
- [ ] Update all imports in 25 component files (if needed)
- [ ] Test: Full app functionality online

**Commit Checkpoint:** `refactor: Complete React Query removal`

---

### **Phase 2: Service Worker + PWA (Days 3-4)**

#### Day 3 Morning: Service Worker Setup
- [ ] Install: `npm install -D vite-plugin-pwa`
- [ ] Create: `public/manifest.json`
- [ ] Configure: `vite.config.ts` with PWA plugin
- [ ] Add: Workbox runtime caching strategies
- [ ] Test: Service worker registers

**Commit Checkpoint:** `feat: Add Service Worker with Vite PWA plugin`

#### Day 3 Afternoon: PWA Configuration
- [ ] Configure: Precache app shell (HTML, CSS, JS)
- [ ] Configure: Runtime cache for Firestore API calls
- [ ] Add: Offline fallback page
- [ ] Update: `index.html` with manifest link
- [ ] Test: Offline app shell loads

**Commit Checkpoint:** `feat: Configure PWA precaching and runtime strategies`

#### Day 4 Morning: Testing & Validation
- [ ] Test: Original 14/14 offline audit tests pass
- [ ] Test: `offline-first-visit.spec.ts` now passes
- [ ] Test: All CRUD operations work offline
- [ ] Test: Sync status indicators accurate
- [ ] Manual: Test user's exact workflow

**Commit Checkpoint:** `test: Verify all offline scenarios pass`

#### Day 4 Afternoon: Optimization & Documentation
- [ ] Add: Error Boundary for safety net
- [ ] Optimize: Remove lazy loading (direct imports)
- [ ] Document: Update README with new architecture
- [ ] Review: Performance metrics vs. React Query
- [ ] Prepare: Merge to `perf/login-optimization`

**Commit Checkpoint:** `docs: Document Firestore subscription architecture`

---

## 🔧 Technical Details

### Current Architecture (React Query - REMOVING)
```typescript
// hooks/useSchoolData.ts (React Query version)
const queries = useQueries({
  queries: collectionConfigs.map(config => ({
    queryKey: [config.name, 'v2'],
    queryFn: async () => {
      try {
        snapshot = await getDocsFromCache(q);
      } catch {
        snapshot = await getDocsFromServer(q); // ❌ Fails offline
      }
      return []; // ❌ Returns empty, component crashes
    },
    retry: 0,
  }))
});
```

**Problem:** Empty array on first offline visit → Component fails to render → Blank page

---

### New Architecture (Firestore Subscriptions)
```typescript
// hooks/useSchoolData.ts (Firestore version)
useEffect(() => {
  const unsubscribers: (() => void)[] = [];
  
  // Real-time subscription with cache detection
  const unsubStudents = onSnapshot(
    collection(db, 'students'),
    { includeMetadataChanges: true },
    (snapshot) => {
      const fromCache = snapshot.metadata.fromCache;
      console.log(fromCache ? '📦 CACHE' : '📡 SERVER');
      
      setStudents(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      setLoading(false);
    },
    (error) => {
      console.error('Students subscription error:', error);
      setError(error.message);
      setLoading(false);
    }
  );
  
  unsubscribers.push(unsubStudents);
  
  // Cleanup
  return () => unsubscribers.forEach(unsub => unsub());
}, []);
```

**Benefits:**
- ✅ Cache-first automatic (Firestore SDK handles it)
- ✅ Real-time updates when online
- ✅ No empty array on offline first visit
- ✅ Component always renders (even with empty cache)
- ✅ Single source of truth

---

### Service Worker Strategy
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        
        // Runtime caching for Firestore API
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-api',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'EduSync SIS',
        short_name: 'EduSync',
        theme_color: '#3b82f6',
        icons: [...]
      }
    })
  ]
});
```

---

## 📝 Backups Created

| File | Backup Location | Purpose |
|------|----------------|---------|
| `hooks/useSchoolData.ts` | `hooks/useSchoolData.REACT_QUERY_BACKUP.ts` | React Query implementation |
| Branch checkpoint | `perf/login-optimization` | Rollback point if needed |

### Rollback Command
```powershell
# If refactor fails, restore original:
git checkout perf/login-optimization
Copy-Item "hooks\useSchoolData.REACT_QUERY_BACKUP.ts" -Destination "hooks\useSchoolData.ts" -Force
npm install @tanstack/react-query
```

---

## ✅ Success Criteria

### Must Pass (Critical):
1. ✅ `tests/offline-first-visit.spec.ts` Test 1 passes (blank page fixed)
2. ✅ All 14 original offline audit tests still pass
3. ✅ User workflow works: Login online → Go offline → Click Students → **Page renders**
4. ✅ CRUD operations work offline (create, update, delete queued)
5. ✅ Sync status indicators accurate (hasPendingWrites)

### Should Pass (Important):
6. ⚠️ No performance regression (load time ≤ React Query)
7. ⚠️ Real-time updates work (onSnapshot fires on changes)
8. ⚠️ Service worker caches app shell
9. ⚠️ Build size acceptable (check bundle analysis)

### Nice to Have (Optional):
10. 💡 Simpler codebase (less code than React Query version)
11. 💡 Better error messages for users
12. 💡 Sync progress indicators (X of Y operations pending)

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Hook returns correct interface (`SchoolDataHook`)
- [ ] Loading states transition correctly
- [ ] Error states handled gracefully
- [ ] Cleanup on unmount (no memory leaks)

### Integration Tests
- [ ] App.tsx integrates with new hook
- [ ] All 25 components still work
- [ ] Routes navigate without errors
- [ ] Session management unchanged

### E2E Tests (Playwright)
- [ ] `tests/offline-first-visit.spec.ts` - Test 1 passes ✅
- [ ] `tests/offline-first-visit.spec.ts` - Test 2 passes ✅
- [ ] `tests/offline-audit.spec.ts` - All 14 tests pass
- [ ] Manual: User's exact workflow (offline before visiting)

### Manual Testing
- [ ] Create student offline → Go online → Syncs
- [ ] Update grade offline → Sync badge shows count
- [ ] Delete attendance offline → Deletion syncs
- [ ] Navigate all pages offline (no blank screens)
- [ ] Dark mode works with new architecture
- [ ] Mobile responsive still works

---

## 📈 Metrics to Track

### Before (React Query):
- **Initial Load:** ~5-10s (16 collections)
- **Bundle Size:** Check `npm run build` output
- **Offline First Visit:** ❌ FAILS (blank page)
- **Test Pass Rate:** 14/14 audit, 1/2 offline-first (50%)

### After (Firestore Subscriptions):
- **Initial Load:** ??? (measure)
- **Bundle Size:** ??? (measure, should be smaller without React Query)
- **Offline First Visit:** ✅ TARGET PASS
- **Test Pass Rate:** ✅ 16/16 total (100%)

---

## 🚧 Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Component interface breaks | Low | High | Keep `SchoolDataHook` interface identical |
| Performance regression | Medium | Medium | Measure before/after, optimize if needed |
| Test failures | Medium | High | Fix iteratively, don't merge until green |
| Service worker conflicts | Low | Medium | Use Vite PWA plugin (battle-tested) |
| Real-time updates break app | Low | High | Add error boundaries, test exhaustively |

---

## 📚 Dependencies

### To Install:
```json
{
  "vite-plugin-pwa": "^0.17.0",
  "workbox-window": "^7.0.0"
}
```

### To Remove:
```json
{
  "@tanstack/react-query": "^5.x.x" // Currently installed
}
```

---

## 🎓 Learning Notes

### Firestore `onSnapshot()` Best Practices:
1. **Always use `includeMetadataChanges: true`** to detect cache vs. server
2. **Cleanup subscriptions** in `useEffect` return function
3. **Handle errors** in third parameter (error callback)
4. **Batch reads** when possible (but we need real-time, so skip)
5. **Use composite indexes** for complex queries (already have)

### Service Worker Gotchas:
1. Only works on **HTTPS** or **localhost**
2. Cache busting needed for updates (Vite PWA handles)
3. Test in **Incognito** to avoid cache pollution
4. Use **Update on Reload** in DevTools during development

---

## 🔄 Daily Standup Template

### End of Day Report:
```markdown
**Date:** [DATE]
**Hours Worked:** [X hours]
**Phase:** [Phase X - Task Name]

✅ Completed:
- [Task 1]
- [Task 2]

🔄 In Progress:
- [Task 3]

🚧 Blocked:
- [Issue if any]

📊 Tests Passing: [X/16]

🎯 Tomorrow:
- [Next tasks]
```

---

## 📞 Rollback Plan

### If Critical Issue Found:

**Step 1: Immediate Rollback**
```powershell
git checkout perf/login-optimization
npm install
npm run build
```

**Step 2: Restore Backup**
```powershell
Copy-Item "hooks\useSchoolData.REACT_QUERY_BACKUP.ts" -Destination "hooks\useSchoolData.ts" -Force
```

**Step 3: Verify**
```powershell
npm run build
npx playwright test tests/offline-audit.spec.ts
```

**Step 4: Document Issue**
- Add to `OPTION_C_REFACTOR_TRACKER.md` under "Issues Encountered"
- Create GitHub issue with reproduction steps
- Discuss alternative approach

---

## 📖 References

- [Firestore onSnapshot() Docs](https://firebase.google.com/docs/firestore/query-data/listen)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- Original issue: `tests/offline-first-visit.spec.ts` - blank page when offline first visit

---

## 🏁 Completion Checklist

- [ ] All 16 tests passing (14 audit + 2 offline-first)
- [ ] No console errors in production build
- [ ] Service worker registers successfully
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Merged to `perf/login-optimization`
- [ ] Deployed to staging
- [ ] Smoke tested in production

---

**Last Updated:** October 23, 2025  
**Next Review:** End of Day 1 (after Phase 1 checkpoint)
