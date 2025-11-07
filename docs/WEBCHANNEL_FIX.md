# WebChannel 400 Error - Fix Applied

## Problem
Firestore emulator returns 400 Bad Request on WebChannel connections, causing app to fail loading data.

## Root Cause
1. **WebChannel protocol incompatibility** with Firestore emulator under heavy load
2. **Connection exhaustion** - too many concurrent WebChannel connections
3. **Persistence overhead** - IndexedDB persistence adds extra connections

## Fix Applied

### 1. Force Long Polling (Bypass WebChannel)
**File**: `src/services/firestoreService.ts`

```typescript
// BEFORE (conditional):
...(forceLongPolling ? { experimentalForceLongPolling: true } : { experimentalAutoDetectLongPolling: true })

// AFTER (always enabled for emulator):
experimentalForceLongPolling: forceLongPolling,  // Defaults to true
experimentalAutoDetectLongPolling: !forceLongPolling,
```

**Changes**:
- Force long polling defaults to `true` (was reading from env)
- Completely disables WebChannel in favor of HTTP long polling
- More reliable for emulator connections

### 2. Disable Persistence in Emulator
**File**: `src/services/firestoreService.ts`

```typescript
// BEFORE:
// Always enabled persistence

// AFTER:
if (!isEmulator) {
  // Only enable persistence in production
  await enableMultiTabIndexedDbPersistence(db);
} else {
  console.info('[Firebase] Persistence disabled for emulator (reduces connection overhead)');
}
```

**Benefits**:
- Reduces connection overhead in emulator
- Faster page reloads during development
- Eliminates IndexedDB-related connection issues

## Testing Steps

1. **Hard refresh the browser** (Ctrl+Shift+R or Cmd+Shift+R)
   - This forces reload of the JavaScript bundle with new Firestore settings

2. **Check browser console** for:
   ```
   [Firebase] 🔧 Force long polling: true
   [Firebase] 🔧 Persistence disabled for emulator (reduces connection overhead)
   [Firebase] Firestore emulator connected: 127.0.0.1:8086
   ```

3. **Verify no 400 errors** in Network tab

4. **Test data loading**:
   - Login as admin: `admin@edusync.local` / `admin123`
   - Navigate to Students list
   - Should see 640 students load without errors

## Expected Behavior

✅ **No more WebChannel errors**
✅ **HTTP long polling used instead** (visible in Network tab as `/Listen/channel?...TYPE=xmlhttp`)
✅ **Faster page loads** without persistence overhead
✅ **Stable connections** no connection exhaustion

## Production Behavior

In production (non-emulator), the app will:
- ✅ Use `experimentalAutoDetectLongPolling` (WebChannel or long polling as needed)
- ✅ Enable multi-tab IndexedDB persistence for offline support
- ✅ Maintain full Firestore functionality

## Troubleshooting

### Still seeing 400 errors?
1. **Hard refresh** the browser (Ctrl+Shift+R)
2. **Clear browser cache** completely
3. **Restart the emulator**:
   ```powershell
   # Kill emulator
   taskkill /F /IM node.exe /FI "WINDOWTITLE eq Firebase*"
   
   # Restart dev environment
   npm run dev:emu
   ```

### Verify long polling is active:
1. Open browser DevTools → Network tab
2. Filter by "channel"
3. Look for requests with `TYPE=xmlhttp` (not `TYPE=websocket`)
4. Should see ongoing GET requests every few seconds

### Check emulator connections:
```powershell
netstat -ano | findstr "8086" | findstr "ESTABLISHED"
```
Should see only a few ESTABLISHED connections, not hundreds of TIME_WAIT

---

**Applied**: November 6, 2025
**Files Modified**: `src/services/firestoreService.ts`
**Action Required**: Hard refresh browser (Ctrl+Shift+R)
