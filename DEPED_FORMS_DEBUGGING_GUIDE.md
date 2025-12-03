# DepEd Forms Debugging Guide

**Document Version:** 1.0  
**Created:** December 3, 2025  
**Last Updated:** December 3, 2025

---

## 🎯 Purpose

This guide provides systematic debugging procedures for all DepEd forms implementations. Use this when troubleshooting issues during development, testing, or production.

---

## 🔍 Common Issues & Solutions

### 1. Data Not Loading / Empty Tables

#### Symptoms
- Dashboard shows loading state indefinitely
- "No data available" message appears immediately
- Table remains empty despite data existing in database

#### Debugging Steps

```typescript
// Step 1: Check database connection
console.log('Database URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Is PostgreSQL enabled:', import.meta.env.VITE_USE_POSTGRESQL);

// Step 2: Verify query execution
const { data, error, count } = await supabase
  .from('books')
  .select('*', { count: 'exact' })
  .eq('school_id', schoolId);

console.log('Query result:', { data, error, count });

// Step 3: Check RLS policies
// Run in Supabase SQL Editor:
SELECT * FROM books WHERE school_id = 'your-school-id';
-- If this works but app doesn't, RLS is blocking access

// Step 4: Verify school_id context
console.log('Current school ID:', await getCurrentSchoolId());
console.log('User role:', await getCurrentUserRole());
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| RLS blocking queries | Temporarily disable RLS: `ALTER TABLE books DISABLE ROW LEVEL SECURITY;` |
| Wrong school_id filter | Check `useSchoolData` hook returns correct school |
| Missing indexes | Run index creation scripts from TECHNICAL_SPECS.md |
| Network timeout | Increase Supabase client timeout configuration |
| Empty database | Run seeding scripts: `npm run emu:seed:admin` |

---

### 2. PDF Generation Fails / Blank PDFs

#### Symptoms
- PDF downloads but shows blank pages
- "Failed to generate PDF" error
- PDF missing school logo/DepEd seal
- Data not rendering in PDF template

#### Debugging Steps

```typescript
// Step 1: Log data before PDF generation
console.log('PDF Generation Data:', {
  students: students.length,
  schoolInfo: school,
  hasLogo: !!school.logoUrl,
  template: 'SF3'
});

// Step 2: Check jsPDF initialization
import jsPDF from 'jspdf';
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'in',
  format: 'letter'
});
console.log('jsPDF initialized:', doc);

// Step 3: Verify image loading
const loadImage = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Step 4: Test PDF save
try {
  doc.text('Test', 1, 1);
  doc.save('test.pdf');
  console.log('PDF save successful');
} catch (error) {
  console.error('PDF save failed:', error);
}
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| CORS blocking image load | Add crossOrigin="anonymous" to images |
| Missing font | Install jsPDF fonts: `npm install jspdf-autotable` |
| Data undefined | Add null checks: `students?.length || 0` |
| Logo URL invalid | Validate URLs before loading: `if (isValidUrl(logoUrl))` |
| Memory limit exceeded | Generate PDFs in batches for large datasets |

---

### 3. Form Auto-Generation Errors

#### Symptoms
- "Auto-generate" button does nothing
- Partial data generated (some students missing)
- Duplicate records created
- Wrong calculations (averages, BMI, etc.)

#### Debugging Steps

```typescript
// Step 1: Check source data availability
const students = await getStudentsForSection(sectionId);
const grades = await getGradesForStudents(students.map(s => s.id));
console.log('Source data:', {
  studentCount: students.length,
  gradeRecords: grades.length,
  missingGrades: students.filter(s => !grades.find(g => g.studentId === s.id))
});

// Step 2: Validate calculation logic
const calculateGeneralAverage = (grades: Grade[]) => {
  console.log('Calculating average for grades:', grades);
  const sum = grades.reduce((acc, g) => acc + g.score, 0);
  const avg = sum / grades.length;
  console.log('Average:', avg);
  return avg;
};

// Step 3: Check for duplicate prevention
const existingRecords = await supabase
  .from('promotion_records')
  .select('*')
  .eq('student_id', studentId)
  .eq('school_year', schoolYear)
  .eq('grading_period', 'final');

if (existingRecords.data?.length > 0) {
  console.warn('Record already exists:', existingRecords.data);
  // Handle duplicate logic
}

// Step 4: Test batch insert
const batchInsert = async (records: any[]) => {
  console.log('Inserting batch:', records.length);
  const { data, error } = await supabase
    .from('promotion_records')
    .insert(records);
  console.log('Insert result:', { data, error });
  return { data, error };
};
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| Missing prerequisite data | Check grades exist before generation |
| Calculation errors | Add unit tests for all calculations |
| Duplicate key violations | Use `upsert` instead of `insert` with unique constraints |
| Transaction failures | Wrap batch operations in try-catch with rollback |
| Race conditions | Use database locks: `FOR UPDATE` in queries |

---

### 4. Performance Issues / Slow Loading

#### Symptoms
- Dashboard takes >5 seconds to load
- Browser freezes during PDF generation
- Pagination not working
- Search/filter very slow

#### Debugging Steps

```typescript
// Step 1: Measure query performance
console.time('Query Execution');
const { data } = await supabase
  .from('health_records')
  .select('*, students(first_name, last_name)')
  .eq('school_id', schoolId);
console.timeEnd('Query Execution');

// Step 2: Check query explain plan (run in Supabase SQL Editor)
EXPLAIN ANALYZE
SELECT hr.*, s.first_name, s.last_name
FROM health_records hr
JOIN students s ON hr.student_id = s.id
WHERE hr.school_id = 'your-school-id';

// Step 3: Monitor network requests
// Open Chrome DevTools > Network tab
// Filter: XHR/Fetch
// Look for slow requests (>1s)

// Step 4: Profile React renders
import { Profiler } from 'react';

const onRenderCallback = (
  id, phase, actualDuration, baseDuration, startTime, commitTime
) => {
  console.log('Render stats:', {
    id, phase, actualDuration, baseDuration
  });
};

<Profiler id="SF8Dashboard" onRender={onRenderCallback}>
  <SF8Dashboard />
</Profiler>
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| Missing database indexes | Add indexes per TECHNICAL_SPECS.md |
| N+1 query problem | Use JOIN or batch fetching |
| Large dataset without pagination | Implement server-side pagination |
| No query result caching | Use React Query or SWR for caching |
| Unoptimized re-renders | Use `React.memo`, `useMemo`, `useCallback` |

---

### 5. Infinite Render Loop

#### ⚠️ CRITICAL: Most Common DepEd Forms Issue

#### Symptoms
- Component re-renders continuously
- Console shows hundreds of identical logs
- Browser becomes unresponsive
- "Maximum update depth exceeded" error

#### Debugging Steps

```typescript
// Step 1: Check useEffect dependencies
useEffect(() => {
  console.log('Effect running, dependencies:', { settings, schoolId });
  fetchData();
}, [settings, schoolId]); // ❌ BAD: settings object changes every render

// Step 2: Add render counter
let renderCount = 0;
const MyComponent = () => {
  console.log('Render #', ++renderCount);
  if (renderCount > 10) {
    console.error('INFINITE LOOP DETECTED!');
    debugger; // Pause execution
  }
  // ... rest of component
};

// Step 3: Check for feature flag hook calls
const enrollmentFeatures = useEnrollmentFeatures(settings); // ❌ WRONG
// Should be:
const enrollmentFeatures = useMemo(
  () => useEnrollmentFeatures(settings),
  [settings]
); // ✅ CORRECT
```

#### ✅ SOLUTION: Always Use useMemo

```typescript
import React, { useMemo } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';
import { useEnrollmentFeatures } from '../services/featureFlags';

const SF5Dashboard: React.FC = () => {
  const { settings, loading } = useSchoolData(['settings']);
  
  // ✅ CORRECT: Memoize all feature flag hooks
  const enrollmentFeatures = useMemo(
    () => useEnrollmentFeatures(settings),
    [settings]
  );
  
  // ✅ CORRECT: Memoize all computed values from settings
  const isFormEnabled = useMemo(
    () => FeatureFlags.isDepEdFormsEnabled(settings),
    [settings]
  );
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

#### Prevention Checklist

- [ ] Import `useMemo` from React
- [ ] Wrap ALL feature flag hooks in `useMemo`
- [ ] Wrap ALL FeatureFlags method calls in `useMemo`
- [ ] Add dependency array `[settings]` to useMemo
- [ ] Test component in browser for continuous re-renders
- [ ] Add comment: `// Memoize to prevent infinite loops`

---

### 6. Date/Time Issues

#### Symptoms
- Dates show wrong timezone
- "Invalid date" errors
- Dates off by one day
- Month showing incorrectly

#### Debugging Steps

```typescript
// Step 1: Check date format in database
console.log('Database date:', rawDate);
console.log('Parsed date:', new Date(rawDate));
console.log('ISO string:', new Date(rawDate).toISOString());

// Step 2: Test timezone handling
const dbDate = '2025-12-03'; // From PostgreSQL DATE field
const jsDate = new Date(dbDate);
console.log('JavaScript Date:', jsDate.toString());
console.log('UTC Date:', jsDate.toUTCString());
console.log('Local Date:', jsDate.toLocaleDateString());

// Step 3: Verify input format
const inputElement = document.querySelector('input[type="date"]');
console.log('Input value:', inputElement?.value); // Should be YYYY-MM-DD
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| Timezone conversion | Use `date-fns` or `luxon` for consistent timezone handling |
| Wrong date format | Always use ISO format (YYYY-MM-DD) for database |
| Month index off by 1 | Remember JS months are 0-indexed (Jan = 0) |
| Date string parsing | Use `parseISO` from date-fns, not `new Date(string)` |

---

### 7. Permission Denied / Access Errors

#### Symptoms
- "Permission denied" error in console
- 403 Forbidden HTTP errors
- User can't access specific forms
- Data shows for admin but not teacher

#### Debugging Steps

```typescript
// Step 1: Check user role
const { data: user } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('User role:', user?.user_metadata?.role);

// Step 2: Verify RLS policy
// Run in Supabase SQL Editor:
SELECT * FROM pg_policies WHERE tablename = 'health_records';

// Step 3: Test with superuser
// Temporarily disable RLS to confirm it's the issue
ALTER TABLE health_records DISABLE ROW LEVEL SECURITY;

// Step 4: Check app.current_* settings
SELECT 
  current_setting('app.current_school_id', true) AS school_id,
  current_setting('app.current_user_id', true) AS user_id,
  current_setting('app.current_user_role', true) AS user_role;
```

#### Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| RLS policy too restrictive | Update policy to include appropriate roles |
| User role not set | Set user_metadata.role during signup/login |
| Missing context variables | Set `app.current_*` variables before queries |
| Cross-school access | Ensure school_id filter applied correctly |

---

## 🧪 Testing Procedures

### Unit Testing

```typescript
// Example: Test BMI calculation
describe('calculateBMI', () => {
  it('should calculate BMI correctly', () => {
    const weightKg = 50;
    const heightCm = 165;
    const expectedBMI = 18.37;
    
    const result = calculateBMI(weightKg, heightCm);
    
    expect(result).toBeCloseTo(expectedBMI, 2);
  });
  
  it('should handle edge cases', () => {
    expect(calculateBMI(0, 165)).toBeNull();
    expect(calculateBMI(50, 0)).toBeNull();
    expect(calculateBMI(-50, 165)).toBeNull();
  });
});
```

### Integration Testing

```typescript
// Example: Test SF4 generation
describe('SF4 Generation', () => {
  it('should generate monthly snapshot', async () => {
    const schoolId = 'test-school-id';
    const year = 2024;
    const month = 9;
    
    const result = await generateMonthlySnapshot(schoolId, year, month);
    
    expect(result).toBeDefined();
    expect(result.snapshotMonth).toBe(month);
    expect(result.totalCount).toBeGreaterThan(0);
  });
  
  it('should track student movements correctly', async () => {
    const movement = await createStudentMovement({
      studentId: 'student-1',
      movementType: 'transferred_in',
      movementDate: '2024-09-05',
      toSectionId: 'section-1',
      schoolYear: '2024-2025'
    });
    
    expect(movement.status).toBe('success');
    
    // Verify enrollment count updated
    const snapshot = await getMonthlySnapshot(schoolId, 2024, 9);
    expect(snapshot.transferredIn).toBeGreaterThan(0);
  });
});
```

### E2E Testing with Playwright

```typescript
// Example: Test complete SF5 workflow
test('SF5 auto-generation and PDF export', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('#email', 'test@school.com');
  await page.fill('#password', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  // Navigate to SF5
  await page.goto('/forms/sf5');
  await page.waitForLoadState('networkidle');
  
  // Select parameters
  await page.selectOption('#schoolYear', '2024-2025');
  await page.selectOption('#gradeLevel', '6');
  
  // Generate records
  await page.click('#btnAutoGenerate');
  await page.waitForSelector('.success-message');
  
  // Verify table populated
  const rowCount = await page.locator('table tbody tr').count();
  expect(rowCount).toBeGreaterThan(0);
  
  // Export PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btnExportPDF')
  ]);
  
  expect(download.suggestedFilename()).toContain('SF5');
});
```

---

## 🔧 Debugging Tools & Commands

### Supabase SQL Editor Queries

```sql
-- Check table row counts
SELECT 
  'books' AS table_name, COUNT(*) AS row_count FROM books
UNION ALL
SELECT 'book_issuances', COUNT(*) FROM book_issuances
UNION ALL
SELECT 'health_records', COUNT(*) FROM health_records
UNION ALL
SELECT 'student_movements', COUNT(*) FROM student_movements
UNION ALL
SELECT 'teacher_assignments', COUNT(*) FROM teacher_assignments;

-- Check for orphaned records (missing foreign keys)
SELECT bi.id, bi.book_id, bi.student_id
FROM book_issuances bi
LEFT JOIN books b ON bi.book_id = b.id
LEFT JOIN students s ON bi.student_id = s.id
WHERE b.id IS NULL OR s.id IS NULL;

-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Browser Console Debugging

```javascript
// Enable verbose logging
localStorage.setItem('DEBUG', 'eduSync:*');

// Check current environment
console.table({
  'PostgreSQL': import.meta.env.VITE_USE_POSTGRESQL,
  'Supabase URL': import.meta.env.VITE_SUPABASE_URL,
  'Firebase Project': import.meta.env.VITE_FIREBASE_PROJECT_ID,
  'Environment': import.meta.env.MODE
});

// Test database connection
async function testConnection() {
  const { data, error } = await supabase.from('schools').select('count');
  console.log('Connection test:', error ? 'FAILED' : 'SUCCESS', { data, error });
}
testConnection();

// Monitor React Query cache
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
console.log('Cache:', queryClient.getQueryCache().getAll());
```

### Network Debugging

```bash
# Monitor Supabase requests in real-time
# Open Chrome DevTools > Network > Filter: "supabase.co"

# Check for failed requests
# Look for red/400/500 status codes

# Inspect request/response
# Click on request > Headers/Payload/Response tabs
```

---

## 📝 Logging Best Practices

### Production Logging

```typescript
// Use structured logging
const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};

// Usage
logger.info('SF5 generation started', {
  schoolId,
  gradeLevel,
  studentCount: students.length
});
```

### Debug Mode

```typescript
// Enable debug mode via environment variable
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('Debug: Fetching health records', {
    schoolId,
    filters,
    timestamp: Date.now()
  });
}
```

---

## 🚨 Error Handling Patterns

### API Error Handling

```typescript
async function fetchWithErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      logger.error('Database operation failed', error, {
        operation: operation.name
      });
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Show user-friendly error
      toast.error(`Failed to load data: ${error.message}`);
    }
    throw error;
  }
}

// Usage
const books = await fetchWithErrorHandling(() =>
  supabase.from('books').select('*').eq('school_id', schoolId)
);
```

### Component Error Boundaries

```typescript
class DepEdFormErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Form rendering error', error, {
      componentStack: errorInfo.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
<DepEdFormErrorBoundary>
  <SF5Dashboard />
</DepEdFormErrorBoundary>
```

---

## 📞 Escalation Procedures

### Level 1: Self-Service Debugging
- Use this guide
- Check existing documentation
- Search GitHub issues
- Review commit history

### Level 2: Team Support
- Post in team Slack channel
- Include: error message, steps to reproduce, screenshots
- Tag relevant team members

### Level 3: External Support
- Supabase support: https://supabase.com/support
- Firebase support: https://firebase.google.com/support
- DepEd Division Office (for compliance questions)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Debugging](https://tanstack.com/query/latest/docs/react/devtools)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [DepEd Official Forms](https://www.deped.gov.ph/)

---

**Next Update:** As new issues are discovered and resolved  
**Maintained By:** EduSync Development Team  
**Version:** 1.0 (Dec 3, 2025)
