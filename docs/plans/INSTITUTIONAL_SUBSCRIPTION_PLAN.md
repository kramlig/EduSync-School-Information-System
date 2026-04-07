# Institutional Subscription Implementation Plan

**Date:** April 7, 2026  
**Status:** Implementation Ready  
**Author:** Auto-generated from codebase analysis

---

## 1. Problem Statement

The personal workspace subscription system is **code-complete** (PayMongo checkout, tier enforcement, billing history, referral tracking). However, institutional workspaces currently:

- Have **no subscription table** — they default to hardcoded `SCHOOL_LIMITS` (all unlimited)
- Have **no payment flow** — school plans are "contact us" only
- Have **no billing dashboard** — `SchoolSettingsPostgreSQL.tsx` only manages school profile info
- Have **no limit enforcement** — no student/teacher/section caps for institutional plans
- Have **no trial system** — schools get unlimited access immediately with no conversion funnel

---

## 2. Current State (What Already Exists)

### Database
| Table | Scope | Purpose |
|-------|-------|---------|
| `subscriptions` | Per user (Firebase UID) | Personal workspace billing (free/pro) |
| `payment_history` | Per user | PayMongo payment records |
| `referral_codes` | Per user | Referral program |
| `schools.tier` | Per school | `'free'` / `'pro'` / `'school'` — but `'school'` has no sub-tiers |

### Code
| File | What It Does |
|------|-------------|
| `functions/src/payments.js` | 6 Cloud Functions for personal Pro checkout, webhooks, billing |
| `src/services/paymentService.ts` | Client wrapper for personal payment functions |
| `src/services/personalWorkspaceService.ts` | Tier constants (`FREE_LIMITS`, `PRO_LIMITS`, `SCHOOL_LIMITS`), limit enforcement |
| `src/contexts/WorkspaceContext.tsx` | Detects personal vs institutional, provides `tier` + `limits` |
| `components/SchoolSettingsPostgreSQL.tsx` | Institutional settings — profile only (no billing tab) |
| `src/components/personal/PersonalSettings.tsx` | Personal settings — includes billing + subscription management |
| `src/components/personal/UpgradeModal.tsx` | Plan comparison UI (Free vs Pro) |

### Pricing (Defined in Architecture Plan)
| Plan | Monthly | Student Cap | Key Differentiator |
|------|---------|-------------|-------------------|
| **Trial** | Free (30 days) | 100 students, 5 teachers, 10 sections | Time-limited |
| **Starter** | ₱1,999 | 500 students | Full SIS, unlimited teachers |
| **Professional** | ₱4,999 | 1,500 students | AI (Gemini), advanced analytics, priority support |
| **Enterprise** | Custom | Unlimited | Contact sales |

---

## 3. Architecture Decision: Separate `school_subscriptions` Table

**Why not reuse the `subscriptions` table?**

| Concern | `subscriptions` (personal) | `school_subscriptions` (institutional) |
|---------|---------------------------|---------------------------------------|
| **Keyed by** | `user_id` (Firebase UID) | `school_id` (UUID) |
| **Tiers** | `free` / `pro` | `trial` / `starter` / `professional` / `enterprise` |
| **Limits** | Student count, sections, downloads | Students, teachers, sections, features |
| **Billing owner** | Individual teacher | School superadmin |
| **Scope** | One user = one subscription | One school = one subscription shared by all users |

A school subscription is organization-level — it covers all teachers/admins in that school. Personal subscriptions are per-user. Merging them would require awkward `type` column discrimination and complex queries.

---

## 4. Implementation Plan

### Phase 1: Database (Migration 009)

**File:** `scripts/migrations/009_school_subscriptions.sql`

```sql
CREATE TABLE school_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) UNIQUE,
  plan TEXT NOT NULL DEFAULT 'trial',       -- 'trial'|'starter'|'professional'|'enterprise'
  status TEXT NOT NULL DEFAULT 'trial',     -- 'trial'|'active'|'cancelled'|'expired'|'past_due'
  
  -- Limits
  max_students INT NOT NULL DEFAULT 100,
  max_teachers INT NOT NULL DEFAULT 5,
  max_sections INT NOT NULL DEFAULT 10,
  
  -- Feature flags
  ai_enabled BOOLEAN DEFAULT false,
  parent_portal_enabled BOOLEAN DEFAULT false,
  division_reporting BOOLEAN DEFAULT false,
  advanced_analytics BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- PayMongo billing
  payment_provider TEXT DEFAULT 'paymongo',
  payment_provider_customer_id TEXT,
  payment_provider_subscription_id TEXT,
  billing_cycle TEXT,                       -- 'monthly'|'yearly'
  amount_cents INT,
  currency TEXT DEFAULT 'PHP',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Audit
  subscribed_by TEXT,                       -- Firebase UID of admin who subscribed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Only school superadmins can read/update their school's subscription.

**Trigger:** Auto-create trial row when a new institutional school is inserted.

**Backfill:** Insert trial rows for all existing institutional schools (with `trial_ends_at = NULL` to grandfather them in without forcing immediate upgrade).

### Phase 2: Client Service

**File:** `src/services/schoolSubscriptionService.ts`

| Export | Purpose |
|--------|---------|
| `SchoolPlan` type | `'trial'` \| `'starter'` \| `'professional'` \| `'enterprise'` |
| `SchoolSubscription` interface | Typed subscription record |
| `SchoolPlanLimits` interface | Limits + feature flags |
| `getSchoolSubscription(schoolId)` | Fetch from `school_subscriptions` |
| `getSchoolPlanLimits(plan)` | Hardcoded limits per plan |
| `createSchoolCheckout(schoolId, plan, billingCycle)` | Calls Cloud Function → returns PayMongo URL |
| `getSchoolBillingHistory(schoolId)` | Calls Cloud Function → returns payment records |
| `cancelSchoolSubscription(schoolId)` | Calls Cloud Function |
| `SCHOOL_PRICING` constant | Plan prices (mirrors server-side) |

### Phase 3: WorkspaceContext Update

**File:** `src/contexts/WorkspaceContext.tsx`

Current behavior for institutional users:
```typescript
// Today: hardcoded unlimited
const tier: WorkspaceTier = isPersonal ? (subscription?.tier || 'free') : 'school';
```

New behavior:
```typescript
// New: fetch actual school subscription
if (!isPersonal && schoolId) {
  const schoolSub = await getSchoolSubscription(schoolId);
  // Derive limits from school plan instead of hardcoding
}
```

**Context additions:**
- `schoolSubscription: SchoolSubscription | null` — exposed to all components
- `schoolPlan: SchoolPlan` — current plan name
- Updated `limits` derivation: `getSchoolPlanLimits(schoolSub?.plan ?? 'trial')`

### Phase 4: Cloud Functions

**File:** `functions/src/payments.js` (extend existing)

| Function | Type | Purpose |
|----------|------|---------|
| `createSchoolCheckout` | `onCall` | Creates PayMongo session for school plan |
| `getSchoolSubscriptionStatus` | `onCall` | Returns school plan, status, limits |
| `cancelSchoolSubscription` | `onCall` | Cancels at period end |
| `getSchoolBillingHistory` | `onCall` | Returns school payment records |

**Webhook update:** `paymongoWebhook` checks `metadata.type === 'school'` to write to `school_subscriptions` instead of `subscriptions`.

**New pricing constant:**
```javascript
const SCHOOL_PRICING = {
  starter_monthly:      { amountCents: 199900, description: 'EduSync Starter — Monthly' },
  starter_yearly:       { amountCents: 1999000, description: 'EduSync Starter — Yearly' },
  professional_monthly: { amountCents: 499900, description: 'EduSync Professional — Monthly' },
  professional_yearly:  { amountCents: 4999000, description: 'EduSync Professional — Yearly' },
};
```

### Phase 5: Billing Dashboard

**File:** `src/components/settings/SchoolBillingSettings.tsx`

**Sections:**
1. **Current Plan** — Plan name, status badge, student/teacher/section usage bars
2. **Trial Banner** — Days remaining (if trial), upgrade CTA
3. **Plan Comparison** — Starter vs Professional vs Enterprise cards with feature lists
4. **Upgrade/Downgrade** — PayMongo checkout redirect
5. **Billing History** — Table of past payments
6. **Cancel Subscription** — Cancel with confirmation, shows effective end date

**Route:** Add `/settings/billing` to institutional dashboard routes in `App.tsx`.  
**Navigation:** Add "Billing" item to institutional sidebar under Settings.

### Phase 6: Enforcement Points

| Check | Component | Logic |
|-------|-----------|-------|
| Student cap | Student enrollment/import | `COUNT(students) >= max_students` → show upgrade prompt |
| Teacher cap | Teacher creation | `COUNT(teachers) >= max_teachers` → block + show upgrade |
| Section cap | Section creation | `COUNT(sections) >= max_sections` → block + show upgrade |
| AI features | Lesson plan button | `!schoolSub.aiEnabled` → show "Professional plan required" |
| Trial expired | App-wide banner | `status === 'trial' && trial_ends_at < NOW()` → read-only mode |

**Hook:** `useSchoolSubscription()` — Returns `{ plan, limits, isTrialExpired, canAddStudents, canAddTeachers, canAddSections, showUpgrade }`.

---

## 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `scripts/migrations/009_school_subscriptions.sql` | **CREATE** | Table, RLS, trigger, backfill |
| `src/services/schoolSubscriptionService.ts` | **CREATE** | Client service for school subscriptions |
| `src/hooks/useSchoolSubscription.ts` | **CREATE** | React hook with limit checks |
| `src/components/settings/SchoolBillingSettings.tsx` | **CREATE** | Billing dashboard UI |
| `src/contexts/WorkspaceContext.tsx` | **MODIFY** | Add `schoolSubscription` to context |
| `src/services/personalWorkspaceService.ts` | **MODIFY** | Update `SCHOOL_LIMITS` to use dynamic limits |
| `functions/src/payments.js` | **MODIFY** | Add school checkout, update webhook |
| `src/services/paymentService.ts` | **MODIFY** | Add school payment wrappers |
| `App.tsx` | **MODIFY** | Add `/settings/billing` route |
| Sidebar component | **MODIFY** | Add "Billing" nav item |

---

## 6. Data Flow

```
School Superadmin clicks "Upgrade to Starter"
    ↓
SchoolBillingSettings.tsx → createSchoolCheckout(schoolId, 'starter', 'monthly')
    ↓
paymentService.ts → httpsCallable('createSchoolCheckout')
    ↓
Cloud Function: createSchoolCheckout
  - Verifies auth.uid is superadmin of schoolId
  - Creates PayMongo checkout session with metadata: { school_id, plan, type: 'school' }
  - Returns checkout URL
    ↓
User redirected to PayMongo → pays via GCash/Card/etc.
    ↓
PayMongo webhook POST → paymongoWebhook
  - Detects metadata.type === 'school'
  - Updates school_subscriptions (not subscriptions)
  - Records in payment_history (with school_id)
    ↓
User redirected to /settings/billing?payment=success
    ↓
SchoolBillingSettings fetches fresh subscription → shows "Starter" plan active
    ↓
WorkspaceContext picks up new limits → all components enforce new caps
```

---

## 7. Critical Finding: `payment_history` Needs `school_id`

The existing `payment_history` table only has `user_id` (Firebase UID). For school billing history, we need to either:

- **Option A (chosen):** Add `school_id UUID REFERENCES schools(id)` column to `payment_history` in migration 009. School payments populate both `user_id` (admin who paid) and `school_id`. Personal payments leave `school_id` NULL.
- **Option B:** Create separate `school_payment_history` table — rejected (too much duplication).

The `Sidebar.tsx` institutional sidebar has a **Financial** section with Fee Structures, Record Payment, Receipt Register, and Financial Reports. The "Billing & Subscription" item fits here naturally.

---

## 8. Migration Safety

- **Backfill:** All existing institutional schools get `plan: 'trial'` with `trial_ends_at: NULL` (grandfathered — no forced upgrade)
- **Default:** New schools auto-get trial with 30-day expiry via trigger
- **Rollback:** Table can be dropped without affecting existing functionality (current code falls back to `SCHOOL_LIMITS`)
- **RLS:** Only superadmins can view/modify their school's subscription

---

## 8. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking current unlimited access | Backfill with `trial_ends_at = NULL` = no expiry for existing schools |
| PayMongo webhook confusion (personal vs school) | Metadata `type` field differentiates; existing personal flow unchanged |
| WorkspaceContext re-render loops | Follow memoization pattern per copilot-instructions.md |
| Enterprise plan pricing | Not automated — manual process via `support@edusync.ph` |
| Trial expiry UX | Read-only mode, not data deletion; upgrade restores full access |

---

## 9. Testing Strategy

1. **SQL Migration:** Run 009 against emulator, verify backfill, trigger, and RLS
2. **Service Layer:** Unit test `getSchoolPlanLimits()` for all plan types
3. **WorkspaceContext:** Verify institutional users get dynamic limits from `school_subscriptions`
4. **Cloud Functions:** Test `createSchoolCheckout` with mock auth + Supabase
5. **E2E:** Playwright test for billing dashboard render + plan comparison display
6. **Webhook:** Mock PayMongo webhook with `type: 'school'` metadata → verify `school_subscriptions` updated

---

## 10. Implementation Order

1. ✅ **This document** — Plan review
2. `009_school_subscriptions.sql` — Database foundation
3. `schoolSubscriptionService.ts` — Client data layer
4. `useSchoolSubscription.ts` — React hook
5. WorkspaceContext update — Wire into app-wide context
6. Cloud Functions — Payment processing
7. `SchoolBillingSettings.tsx` — Admin UI
8. Enforcement — Cap checks in enrollment/teacher/section components
9. E2E tests
