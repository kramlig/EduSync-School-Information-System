# Header/Sidebar PostgreSQL Migration

**Date:** November 27, 2025  
**Status:** ✅ COMPLETE

## Overview

Migrated Header and Sidebar components to fetch school information (name, school year) from PostgreSQL instead of Firestore settings. This completes the Settings → PostgreSQL migration.

## Changes Made

### 1. Created PostgreSQL Hook: `useSchoolProfilePostgreSQL`

**File:** `src/hooks/useSchoolProfilePostgreSQL.ts`

**Purpose:** Lightweight hook to fetch basic school profile data for navigation components

**Features:**
- Fetches: `name`, `current_school_year`, `region`, `division`, `district`
- Auto-updates every 60 seconds via polling
- Handles errors gracefully with fallback defaults
- Uses SchoolContext for multi-tenant schoolId

**Usage:**
```typescript
const { schoolName, schoolYear, loading, error } = useSchoolProfilePostgreSQL();
```

### 2. Updated Header Component

**File:** `components/Header.tsx`

**Changes:**
- ❌ Removed: `schoolName` and `schoolYear` props from interface
- ✅ Added: `useSchoolProfilePostgreSQL()` hook call
- ✅ Import: `import { useSchoolProfilePostgreSQL } from '../src/hooks/useSchoolProfilePostgreSQL';`

**Before:**
```typescript
interface HeaderProps {
  schoolYear?: string;
  schoolName?: string;
  // ... other props
}

const Header: React.FC<HeaderProps> = ({ schoolYear, schoolName, ... }) => {
  // Used props directly
}
```

**After:**
```typescript
interface HeaderProps {
  // schoolYear and schoolName removed
  // ... other props
}

const Header: React.FC<HeaderProps> = ({ ... }) => {
  const { schoolName, schoolYear } = useSchoolProfilePostgreSQL();
  // Now fetched from PostgreSQL
}
```

### 3. Updated Sidebar Component

**File:** `components/Sidebar.tsx`

**Changes:**
- ❌ Removed: `schoolName` and `schoolYear` props from interface
- ✅ Added: `useSchoolProfilePostgreSQL()` hook call
- ✅ Import: `import { useSchoolProfilePostgreSQL } from '../src/hooks/useSchoolProfilePostgreSQL';`

**Before:**
```typescript
interface SidebarProps {
  schoolName?: string;
  schoolYear?: string;
  // ... other props
}

const Sidebar: React.FC<SidebarProps> = ({ schoolName = 'School', schoolYear, ... }) => {
  // Used props with defaults
}
```

**After:**
```typescript
interface SidebarProps {
  // schoolName and schoolYear removed
  // ... other props
}

const Sidebar: React.FC<SidebarProps> = ({ ... }) => {
  const { schoolName, schoolYear } = useSchoolProfilePostgreSQL();
  // Now fetched from PostgreSQL with defaults in hook
}
```

### 4. Updated App.tsx

**File:** `App.tsx`

**Changes:**
- ❌ Removed: `schoolName={settings.schoolName}` from Sidebar
- ❌ Removed: `schoolYear={settings.schoolYear}` from Sidebar
- ❌ Removed: `schoolName={settings.schoolName}` from Header
- ❌ Removed: `schoolYear={settings.schoolYear}` from Header

**Before:**
```typescript
<Sidebar 
  session={session} 
  schoolName={settings.schoolName}
  schoolYear={settings.schoolYear}
  announcements={announcements}
/>
<Header
  schoolYear={settings.schoolYear}
  schoolName={settings.schoolName}
  session={session}
  onLogout={handleLogout}
  // ... other props
/>
```

**After:**
```typescript
<Sidebar 
  session={session} 
  announcements={announcements}
/>
<Header
  session={session}
  onLogout={handleLogout}
  // ... other props
/>
```

## Data Flow

### Before (Firestore)
```
App.tsx
  ↓ useSchoolData(['settings'])
  ↓ Firestore: schools/{schoolId} → settings
  ↓ Pass as props
  ↓
Header/Sidebar
  ↓ Receive schoolName, schoolYear
  ↓ Display
```

### After (PostgreSQL)
```
Header/Sidebar
  ↓ useSchoolProfilePostgreSQL()
  ↓ PostgreSQL: SELECT name, current_school_year FROM schools
  ↓ Display
```

**Benefits:**
- ✅ Direct data fetching (no prop drilling)
- ✅ Auto-updates via polling (every 60s)
- ✅ Simpler component interfaces
- ✅ No dependency on Firestore settings

## PostgreSQL Schema

**Table:** `schools`

**Columns Used:**
- `id` (UUID) - Primary key, from SchoolContext
- `name` (VARCHAR) - School name for display
- `current_school_year` (VARCHAR) - e.g., "2023-2024"
- `region` (VARCHAR) - Optional
- `division` (VARCHAR) - Optional
- `district` (VARCHAR) - Optional

## Testing Checklist

- [x] Header displays school name from PostgreSQL
- [x] Header displays school year from PostgreSQL
- [x] Sidebar displays school name from PostgreSQL
- [x] Sidebar displays school year from PostgreSQL
- [x] No TypeScript errors in updated files
- [x] Hook handles missing schoolId gracefully
- [x] Hook provides fallback defaults on error

## Dependencies

**Required Files:**
1. `src/hooks/useSchoolProfilePostgreSQL.ts` (new)
2. `src/contexts/SchoolContext.tsx` (existing)
3. `src/lib/supabase.ts` (existing)

**Environment Variables:**
- `VITE_USE_POSTGRESQL=true` (already set in all env files)

## Next Steps

1. ✅ Header/Sidebar migration complete
2. ⏭️ Identify other components using Firestore `settings`
3. ⏭️ Migrate remaining components to PostgreSQL
4. ⏭️ Deprecate Firestore settings collection completely
5. ⏭️ Remove `/settings-legacy` route
6. ⏭️ Update `useSchoolData` to remove settings subscription

## Verification Commands

```powershell
# Start dev server with emulator
npm run dev:emu

# Check TypeScript errors
npm run build

# Verify Header/Sidebar display correct school data
# 1. Login to application
# 2. Check header shows school name and year
# 3. Check sidebar shows school name and year
# 4. Go to /settings and update school name
# 5. Wait 60 seconds or refresh page
# 6. Verify Header/Sidebar show updated name
```

## Migration Summary

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| Header.tsx | Firestore (via props) | PostgreSQL (direct hook) | ✅ COMPLETE |
| Sidebar.tsx | Firestore (via props) | PostgreSQL (direct hook) | ✅ COMPLETE |
| SchoolSettingsPostgreSQL.tsx | N/A | PostgreSQL (direct queries) | ✅ COMPLETE |
| SettingsView.tsx | Firestore | Firestore (legacy route) | ⚠️ DEPRECATED |

## Notes

- **Polling Interval:** 60 seconds - balances freshness with performance
- **Fallback Strategy:** Returns "School" and "2023-2024" on errors
- **Multi-tenant Ready:** Uses SchoolContext.schoolId for queries
- **No Breaking Changes:** Components still display same data, just from different source
