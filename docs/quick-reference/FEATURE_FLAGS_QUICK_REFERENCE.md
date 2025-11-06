# 🚦 Feature Flags - Quick Reference Guide

**Purpose**: Use feature flags to show/hide financial features based on school type

---

## 📋 **Quick Examples**

### **1. Check if Financial Features are Enabled**

```typescript
import { FeatureFlags } from '../services/featureFlags';

// In any component
const isFinancial = FeatureFlags.isFinancialEnabled(settings);

if (isFinancial) {
  // Show billing, payments, financial reports
} else {
  // Hide financial features (public school)
}
```

### **2. Conditional Navigation Menu**

```typescript
// In Navigation.tsx
import { FeatureFlags } from '../services/featureFlags';

function Navigation({ settings }) {
  return (
    <nav>
      {/* Always visible */}
      <NavItem label="Dashboard" route="/dashboard" />
      <NavItem label="Students" route="/students" />
      
      {/* Only show for private/hybrid schools */}
      {FeatureFlags.isFinancialEnabled(settings) && (
        <>
          <NavItem label="Billing" route="/financial/billing" />
          <NavItem label="Payments" route="/financial/payments" />
        </>
      )}
    </nav>
  );
}
```

### **3. Using React Hooks**

```typescript
import { useFinancialFeatures, useEnrollmentFeatures } from '../services/featureFlags';

function StudentProfile({ student, settings }) {
  // Get all financial features at once
  const financial = useFinancialFeatures(settings);
  const enrollment = useEnrollmentFeatures(settings);
  
  return (
    <div>
      <h1>{student.name}</h1>
      
      {/* Show balance if financial enabled */}
      {financial.enabled && (
        <div>
          Balance: {financial.currencySymbol}{student.balance}
        </div>
      )}
      
      {/* Show enrollment status if applications required */}
      {enrollment.requiresApplication && (
        <EnrollmentStatus studentId={student.id} />
      )}
    </div>
  );
}
```

### **4. Conditional Routes**

```typescript
// In App.tsx
import { FeatureFlags } from '../services/featureFlags';

function App() {
  const settings = useSchoolSettings();
  const financialEnabled = FeatureFlags.isFinancialEnabled(settings);
  
  return (
    <Routes>
      {/* Always available */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<StudentList />} />
      
      {/* Conditional routes */}
      {financialEnabled && (
        <>
          <Route path="/financial/billing" element={<BillingDashboard />} />
          <Route path="/financial/payments" element={<PaymentEntry />} />
          <Route path="/financial/reports" element={<FinancialReports />} />
        </>
      )}
    </Routes>
  );
}
```

### **5. Getting Currency Symbol**

```typescript
import { FeatureFlags } from '../services/featureFlags';

function PaymentForm({ settings }) {
  const currency = FeatureFlags.getCurrencySymbol(settings);
  
  return (
    <div>
      <label>Amount ({currency})</label>
      <input type="number" placeholder={`Enter amount in ${currency}`} />
    </div>
  );
}
```

### **6. Check Payment Requirements**

```typescript
import { FeatureFlags } from '../services/featureFlags';

function EnrollmentConfirmation({ application, settings }) {
  const requiresPayment = FeatureFlags.requiresPaymentForEnrollment(settings);
  
  if (requiresPayment) {
    return (
      <div>
        <h2>Payment Required</h2>
        <p>Please proceed to billing to complete enrollment.</p>
        <Button href="/financial/billing">Pay Now</Button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Enrollment Complete!</h2>
      <p>Welcome to our school.</p>
    </div>
  );
}
```

---

## 🏫 **Configuration Examples**

### **Public School (No Financial Features)**

```typescript
// In Firebase Console or migration script
const publicSchoolSettings: SchoolSettings = {
  schoolName: "Mati National High School",
  region: "Region XI - Davao",
  division: "Division of Mati City",
  district: "Governor Generoso North District",
  schoolYear: "2025-2026",
  
  schoolType: "public",
  
  enrollmentConfig: {
    requiresApplication: true,
    requiresDocuments: true,
    autoApprove: false,
    allowSelfRegistration: true
  }
  
  // No financialConfig - defaults to disabled
};
```

### **Private School (Full Financial Features)**

```typescript
const privateSchoolSettings: SchoolSettings = {
  schoolName: "St. Mary's Academy",
  region: "Region XI - Davao",
  division: "Division of Mati City",
  district: "Private Schools",
  schoolYear: "2025-2026",
  
  schoolType: "private",
  
  enrollmentConfig: {
    requiresApplication: true,
    requiresDocuments: true,
    autoApprove: false,
    allowSelfRegistration: true,
    academicYearStart: "2025-06-01",
    academicYearEnd: "2026-03-31"
  },
  
  financialConfig: {
    enabled: true,
    currency: "PHP",
    requiresPayment: true,
    allowPartialPayment: true,
    gracePeriodDays: 7,
    penaltyRate: 2 // 2% per month
  }
};
```

### **Hybrid School (Subsidized Private)**

```typescript
const hybridSchoolSettings: SchoolSettings = {
  schoolName: "Community Learning Center",
  region: "Region XI - Davao",
  division: "Division of Mati City",
  district: "Private Schools",
  schoolYear: "2025-2026",
  
  schoolType: "hybrid",
  
  enrollmentConfig: {
    requiresApplication: true,
    requiresDocuments: true,
    autoApprove: false,
    allowSelfRegistration: true
  },
  
  financialConfig: {
    enabled: true,
    currency: "PHP",
    requiresPayment: false, // Optional
    allowPartialPayment: true,
    gracePeriodDays: 30,
    penaltyRate: 0 // No penalties
  }
};
```

---

## 🎨 **Component Patterns**

### **Pattern 1: Feature Section**

Wrap entire sections in conditional rendering:

```typescript
function DashboardView({ settings }) {
  const financial = useFinancialFeatures(settings);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Always visible */}
      <MetricCard title="Total Students" value={250} />
      <MetricCard title="Active Sections" value={12} />
      
      {/* Conditional */}
      {financial.enabled && (
        <MetricCard 
          title="Outstanding Balance" 
          value={`${financial.currencySymbol}125,000`} 
        />
      )}
    </div>
  );
}
```

### **Pattern 2: Feature Badge**

Show school type badge:

```typescript
function SchoolHeader({ settings }) {
  const displayName = FeatureFlags.getSchoolDisplayName(settings);
  
  return (
    <header>
      <h1>{displayName}</h1>
      {/* Shows: "Mati National High School 🏫 Public" */}
    </header>
  );
}
```

### **Pattern 3: Admin Settings Panel**

Show feature summary:

```typescript
function SettingsPage({ settings }) {
  const features = FeatureFlags.getFeatureSummary(settings);
  
  return (
    <div>
      <h2>System Configuration</h2>
      <dl>
        <dt>School Type</dt>
        <dd>{features.schoolType}</dd>
        
        <dt>Financial System</dt>
        <dd>{features.financialEnabled ? '✅ Enabled' : '❌ Disabled'}</dd>
        
        <dt>Currency</dt>
        <dd>{features.currency}</dd>
        
        <dt>Enrollment Applications</dt>
        <dd>{features.enrollmentApplicationRequired ? '✅ Required' : '❌ Optional'}</dd>
      </dl>
    </div>
  );
}
```

---

## 🔒 **Security Patterns**

### **Pattern 1: Route Protection**

```typescript
// In ProtectedRoute.tsx
function FinancialRoute({ settings, children }) {
  const financialEnabled = FeatureFlags.isFinancialEnabled(settings);
  
  if (!financialEnabled) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Usage in App.tsx
<Route 
  path="/financial/*" 
  element={
    <FinancialRoute settings={settings}>
      <FinancialModule />
    </FinancialRoute>
  } 
/>
```

### **Pattern 2: API Validation**

```typescript
// In financial API endpoints
export async function recordPayment(studentId: string, amount: number) {
  const settings = await getSchoolSettings();
  
  if (!FeatureFlags.isFinancialEnabled(settings)) {
    throw new Error('Financial features are not enabled for this school');
  }
  
  // Proceed with payment recording
}
```

---

## ⚡ **Performance Tips**

### **1. Cache Settings**

Don't fetch settings on every component:

```typescript
// Good: Fetch once at app level
function App() {
  const settings = useSchoolSettings(); // Cached
  
  return (
    <SettingsContext.Provider value={settings}>
      <Routes>...</Routes>
    </SettingsContext.Provider>
  );
}

// Use context in child components
function ChildComponent() {
  const settings = useContext(SettingsContext);
  const financial = useFinancialFeatures(settings);
}
```

### **2. Memoize Feature Checks**

```typescript
function ExpensiveComponent({ settings }) {
  const financial = useMemo(
    () => useFinancialFeatures(settings),
    [settings.schoolType, settings.financialConfig]
  );
  
  // Rest of component
}
```

---

## 🧪 **Testing Examples**

### **Test Feature Flags**

```typescript
import { FeatureFlags } from '../services/featureFlags';

describe('FeatureFlags', () => {
  it('should disable financial for public schools', () => {
    const settings: SchoolSettings = {
      schoolName: 'Test School',
      schoolType: 'public',
      // ... other fields
    };
    
    expect(FeatureFlags.isFinancialEnabled(settings)).toBe(false);
  });
  
  it('should enable financial for private schools', () => {
    const settings: SchoolSettings = {
      schoolName: 'Test School',
      schoolType: 'private',
      financialConfig: {
        enabled: true,
        currency: 'PHP',
        // ... other fields
      }
    };
    
    expect(FeatureFlags.isFinancialEnabled(settings)).toBe(true);
  });
});
```

---

## 📚 **Migration Scripts**

### **Update Existing School Settings**

```typescript
// scripts/update-school-type.ts
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestoreInstance } from './services/firestoreService';

async function updateSchoolType() {
  const db = getFirestoreInstance();
  const settingsRef = doc(db, 'settings', 'school');
  
  await updateDoc(settingsRef, {
    schoolType: 'private', // or 'public'
    
    // For private schools
    'financialConfig.enabled': true,
    'financialConfig.currency': 'PHP',
    'financialConfig.requiresPayment': true,
    'financialConfig.allowPartialPayment': true,
    'financialConfig.gracePeriodDays': 7,
    'financialConfig.penaltyRate': 2,
    
    // For all schools
    'enrollmentConfig.requiresApplication': true,
    'enrollmentConfig.requiresDocuments': true,
    'enrollmentConfig.autoApprove': false,
    'enrollmentConfig.allowSelfRegistration': true
  });
  
  console.log('✅ School settings updated!');
}

updateSchoolType();
```

---

## 🎯 **Summary**

**Key Takeaway**: Use `FeatureFlags.isFinancialEnabled(settings)` everywhere you need to show/hide financial features.

**Best Practices**:
1. ✅ Always check feature flags before rendering financial components
2. ✅ Use the helper hooks for cleaner code
3. ✅ Cache settings at app level
4. ✅ Protect routes with feature checks
5. ✅ Validate API calls server-side

**Common Pattern**:
```typescript
import { FeatureFlags } from '../services/featureFlags';

const isFinancial = FeatureFlags.isFinancialEnabled(settings);

{isFinancial && <FinancialComponent />}
```

---

**Need help?** Check `FLEXIBLE_SCHOOL_SYSTEM_PLAN.md` for full implementation guide! 🚀
