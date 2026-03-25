# EduSync Personal Mode — Full Architecture & Business Plan

> **Status:** Phase 1 ✅ Deployed | Phase 2 ✅ Deployed | Phase 3 ✅ Code Complete (PayMongo keys needed to activate payments)
> **Author:** Mark Gil Dotillos  
> **Created:** March 23, 2026  
> **Last Updated:** March 24, 2026  
> **Goal:** Allow teachers to use EduSync independently — no school admin required. Upload data → generate DepEd forms → manage grades as an individual.

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Product Tiers & User Journey](#2-product-tiers--user-journey)
3. [Monetization Model](#3-monetization-model)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Schema Changes](#5-database-schema-changes)
6. [Route & Page Structure](#6-route--page-structure)
7. [Phase 1: Free Form Generator (Public Tool)](#7-phase-1-free-form-generator-public-tool)
8. [Phase 2: Personal Workspace (Free Account)](#8-phase-2-personal-workspace-free-account)
9. [Phase 3: Premium Features & School Bridge](#9-phase-3-premium-features--school-bridge)
10. [Security & Privacy](#10-security--privacy)
11. [Marketing & Growth Strategy](#11-marketing--growth-strategy)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Known Flaws & Mitigations](#13-known-flaws--mitigations)
14. [Risk Analysis](#14-risk-analysis)
15. [Decision Matrix](#15-decision-matrix)
16. [Architecture Evaluation Checklist](#16-architecture-evaluation-checklist)

---

## 1. Vision & Problem Statement

> **DepEd Form Naming Note:** DepEd has officially renamed legacy forms to the SF (School Form) numbering system.
> Throughout this document we use the **current official names**:
> - **SF9** = Learner's Progress Report Card *(formerly Form 138)*
> - **SF10** = Learner's Permanent Academic Record *(formerly Form 137)*
> The codebase still has both naming conventions in parallel (Form137/, SF10/, Form138/, SF9/) — consolidation is a Phase 1 task.

### The Problem

- 800,000+ teachers in the Philippines manually fill DepEd forms every quarter
- Current EduSync requires: School Admin → School Setup → Teacher account → Assignments → Then teacher can use it
- A single teacher wanting to generate an SF9 (Report Card) or SF5 has NO way to do it without institutional setup
- Teachers who want to try EduSync cannot — it's locked behind school-level onboarding

### The Vision

**"Any teacher, anywhere, right now."**

- No school? No problem. Generate forms immediately.
- No admin? No problem. Manage your own students and grades.
- Want the full system later? Your school can adopt EduSync and your data migrates seamlessly.

### User Personas

| Persona | Pain Point | What They Want |
|---------|-----------|----------------|
| **Maria** — Public school teacher, rural | Fills SF forms by hand every quarter, takes days | Upload class list → download clean PDF in 5 minutes |
| **Jose** — Private school teacher | School has no SIS, he tracks grades in Excel | Online gradebook → auto-generate report cards |
| **Ana** — New teacher, first year | Confused by DepEd form formats | Guided form generator that handles formatting |
| **Principal Santos** — Evaluating SIS | Needs to see the system before committing | Teachers already using it → easy school-wide adoption |

---

## 2. Product Tiers & User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EDUSYNC PRODUCT TIERS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TIER 0: FREE TOOLS (No account needed)                            │
│  ├─ Quick Form Generator: Upload CSV → Download PDF                │
│  ├─ Forms: SF5, SF9, SF2, SF5-K, ELLN (Category A only)            │
│  ├─ School info: Required (name, ID, division — prints on form)   │
│  ├─ Limit: 3 downloads/day, watermarked                           │
│  ├─ Data: NOT saved (processed client-side, discarded)            │
│  ├─ School info cached in browser for convenience                 │
│  └─ Purpose: Marketing magnet, zero friction                      │
│                                                                     │
│  TIER 1: FREE ACCOUNT ("EduSync Personal")                        │
│  ├─ Everything in Tier 0 (no watermark, 10 downloads/day)         │
│  ├─ Personal Workspace: 1 virtual school, up to 50 students       │
│  ├─ Teaching sections: 1 (grade entry / ECR)                      │
│  ├─ Advisory sections: 1 (form generation)                        │
│  ├─ School info saved to account (no re-typing)                   │
│  ├─ Data: Saved in cloud, accessible across devices               │
│  └─ Purpose: Convert visitors → registered users                  │
│                                                                     │
│  TIER 2: PERSONAL PRO (₱79/month or ₱399/year)                   │
│  ├─ Everything in Tier 1                                           │
│  ├─ Unlimited students (no 50-student cap)                        │
│  ├─ Teaching sections: Unlimited (ECR for all classes you teach)  │
│  ├─ Advisory sections: 2 (form generation for advisory classes)   │
│  ├─ Unlimited downloads (no daily cap, no watermark)              │
│  ├─ Grade history: Track across school years                       │
│  ├─ Bulk import/export (Excel + CSV)                               │
│  ├─ Offline mode (PWA full support)                                │
│  └─ Purpose: Power users who manage multiple classes               │
│                                                                     │
│  TIER 3: SCHOOL PLANS (existing pricing — NOT changed)             │
│  ├─ Starter: ₱1,999/mo (up to 500 students, all teachers)        │
│  ├─ Professional: ₱4,999/mo (up to 1,500 students, AI, priority) │
│  ├─ Enterprise: Custom (unlimited)                                 │
│  ├─ Everything in Tier 2 for ALL teachers at the school            │
│  ├─ Multi-teacher, centralized school management                   │
│  ├─ Admin dashboard, enrollment, parent portal, billing            │
│  ├─ Division-level reporting                                       │
│  ├─ Marketing frame: "Less than ₱4 per student per month"         │
│  └─ Purpose: Institutional adoption (current EduSync model)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### User Journey (Funnel)

```
Google: "SF5 form generator online"
  │
  ▼
TIER 0: Landing page → /tools/form-generator
  │  Teacher uploads CSV, downloads SF9 PDF
  │  Teacher fills school info (required: name, ID, division)  │
│  Sees: "Create free account to save your school info &      │
│         remove watermark"                                   │
  │
  ▼
TIER 1: Signs up (email only, 30 seconds)
  │  Gets personal workspace, manages 1 class of 50 students
  │  Sees: "Upgrade to Pro for unlimited classes & students"
  │
  ▼
TIER 2: Pays ₱79/month (less than a milk tea per day)
  │  Manages all their classes, full form library
  │  Tells colleagues → colleagues sign up
  │
  ▼
TIER 3: School admin notices 25+ teachers already on EduSync
  │  School officially adopts Starter plan (₱1,999/month for ALL teachers)
  │  Cheaper than 25 individual Pro subscriptions (₱79 × 25 = ₱1,975)
  │  Teachers' personal data migrates into school account
  │
  ▼
REFERRAL: "Each teacher you refer who upgrades = 1 month free"
```

---

## 3. Monetization Model

### Pricing Rationale

| Price Point | Why | Comparison |
|------------|-----|-----------|
| **Free (Tier 0)** | Zero friction entry. Teachers won't pay to *try* something. | Canva, Google Docs — free to start |
| **Free Account (Tier 1)** | They need to save data. Email capture = marketing asset. | Notion free tier, Grammarly free |
| **₱79/month (Tier 2)** | Affordable from personal budget. No school approval needed. | Netflix Mobile ₱149, Canva Pro ₱250, Spotify ₱129 — we're cheaper than all |
| **₱399/year (Tier 2)** | ~₱33/month — 32% savings. Incentivizes annual commit. | Standard SaaS annual discount |
| **₱1,999-₱4,999/month (Tier 3)** | Per-school (existing pricing unchanged). Covers all teachers. "Less than ₱4/student." | Competing PH SIS: ₱500-5000/month |

### Revenue Scenarios

```
Conservative (Year 1):
  - 10,000 free users (Tier 0/1)
  - 500 convert to Pro (₱79/month) = ₱39,500/month
  - 20 schools on Starter (₱1,999/month) = ₱39,980/month
  - Monthly revenue: ~₱79,500 (~$1,380 USD)
  - Annual: ~₱954,000

Moderate (Year 2):
  - 50,000 free users
  - 3,000 Pro users (₱79/month) = ₱237,000/month
  - 80 schools on Starter + 20 on Professional = ₱259,900/month
  - Monthly revenue: ~₱497,000 (~$8,600 USD)
  - Annual: ~₱5,960,000

Aggressive (Year 3):
  - 200,000 free users
  - 15,000 Pro users (₱79/month) = ₱1,185,000/month
  - 300 Starter + 100 Professional + 20 Enterprise = ~₱1,200,000/month
  - Monthly revenue: ~₱2,385,000 (~$41,300 USD)
  - Annual: ~₱28,600,000

NATURAL UPGRADE PRESSURE (Personal → School):
  - When 25+ teachers at one school use Personal Pro (₱79 × 25 = ₱1,975/mo),
    the Starter school plan (₱1,999/mo covering ALL teachers) becomes the
    obvious better deal. The math sells the upgrade — no sales team needed.
```

### Payment Methods (Philippines)

| Method | Implementation | Why |
|--------|---------------|-----|
| **GCash** | GCash API / PayMongo | 76M+ Filipino users, teachers' preferred mobile wallet |
| **Maya (PayMaya)** | PayMongo integration | Second-largest e-wallet in PH |
| **Credit/Debit Card** | Stripe or PayMongo | For school-level payments |
| **Over-the-Counter** | 7-Eleven, Cebuana via PayMongo | Rural teachers without e-wallets |
| **Bank Transfer** | BDO, BPI, UnionBank | For annual school plans |

**Recommended payment gateway: [PayMongo](https://paymongo.com)**
- Philippine-based, supports GCash + Maya + Cards + OTC
- 3.5% + ₱15 per transaction (standard PH rate)
- Easy API, good docs, popular in PH startups

---

## 4. Technical Architecture

### Current vs. New Architecture

```
CURRENT ARCHITECTURE:
  Firebase Auth (login only) → PostgreSQL lookup via get_user_by_firebase_uid()
    → SchoolContext (provides schoolId, role from teachers/students table)
      → All queries: WHERE school_id = ?
        → Everything requires a school

NEW ARCHITECTURE:
  Firebase Auth (login only) → PostgreSQL lookup (same RPC, extended result)
    → WorkspaceContext (replaces/wraps SchoolContext)
      → teachers table gains: workspace_type ('personal'|'institutional'), tier ('free'|'pro'|'school')
      ├─ If workspace_type = 'institutional' → existing school flow (unchanged)
      └─ If workspace_type = 'personal' → personal workspace flow
          → Same queries, same data model
          → schoolId = virtual personal school ID
          → Simplified UI (no admin features)
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Personal workspace = virtual school?** | YES | Avoids refactoring all queries. A "personal workspace" IS a school record with `type: 'personal'` |
| **Separate database?** | NO | Same Supabase tables. Personal workspace data follows same schema |
| **Separate frontend app?** | NO | Same React app, different routes and conditional UI |
| **Form generator (Tier 0) — client-side or server?** | CLIENT-SIDE | No data touches our servers. Pure browser processing. Privacy-first. Zero cost. |
| **Auth for Tier 0?** | NONE | Form generator works without login. No Firebase auth needed. |
| **Payment processing** | PayMongo | PH-native, GCash + Maya + Cards |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite + React)                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ /tools/*     │  │ /personal/*  │  │ /dashboard/*     │  │
│  │ (Public)     │  │ (Tier 1-2)   │  │ (Tier 3 School)  │  │
│  │              │  │              │  │                   │  │
│  │ FormGen Tool │  │ Personal     │  │ Full School SIS   │  │
│  │ No auth      │  │ Workspace    │  │ (existing)        │  │
│  │ Client-side  │  │ Simplified   │  │                   │  │
│  │ CSV → PDF    │  │ Dashboard    │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────────┘  │
│         │                 │                  │               │
│         │ (no backend)    │                  │               │
│         ▼                 ▼                  ▼               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WorkspaceContext (NEW)                   │   │
│  │  Wraps SchoolContext, adds: tier, limits, isPersonal │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │ Firebase  │   │ Supabase │   │ PayMongo     │
   │ Auth      │   │ (Postgres)│  │ (Payments)   │
   │           │   │           │  │              │
   │ Login     │   │ All data  │  │ GCash, Maya  │
   │ Users     │   │ Multi-    │  │ Cards, OTC   │
   │ Claims    │   │ tenant    │  │              │
   └──────────┘   └──────────┘   └──────────────┘
```

---

## 5. Database Schema Changes

### New Tables

```sql
-- =====================================================
-- SUBSCRIPTIONS TABLE (tracks user tier & billing)
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Firebase UID
  tier TEXT NOT NULL DEFAULT 'free',        -- 'free' | 'pro' | 'school'
  status TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'cancelled' | 'expired' | 'past_due'
  
  -- Limits based on tier
  max_students INT NOT NULL DEFAULT 50,              -- free=50, pro=unlimited(99999), school=unlimited
  max_teaching_sections INT NOT NULL DEFAULT 1,      -- free=1, pro=unlimited(99999), school=unlimited
  max_advisory_sections INT NOT NULL DEFAULT 1,      -- free=1, pro=2, school=unlimited
  max_downloads_per_day INT NOT NULL DEFAULT 10,     -- free=10, pro=unlimited(99999), school=unlimited
  
  -- Billing
  payment_provider TEXT,                    -- 'paymongo' | 'manual'
  payment_provider_customer_id TEXT,        -- PayMongo customer ID
  payment_provider_subscription_id TEXT,    -- PayMongo subscription ID
  billing_cycle TEXT,                       -- 'monthly' | 'yearly'
  amount_cents INT,                         -- Amount in centavos (7900 = ₱79)
  currency TEXT DEFAULT 'PHP',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- USAGE TRACKING TABLE (rate limits & analytics)
-- =====================================================
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,                             -- NULL for Tier 0 (anonymous)
  session_id TEXT,                          -- Browser session for anonymous users
  action TEXT NOT NULL,                     -- 'form_download' | 'form_preview' | 'grade_entry'
  form_type TEXT,                           -- 'sf5' | 'sf9' | 'sf2' | 'sf10'
  metadata JSONB DEFAULT '{}',             -- Extra info (student count, etc.)
  ip_hash TEXT,                            -- Hashed IP for anonymous rate limiting
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit queries
CREATE INDEX idx_usage_user_date ON usage_tracking(user_id, created_at);
CREATE INDEX idx_usage_session_date ON usage_tracking(session_id, created_at);
CREATE INDEX idx_usage_ip_date ON usage_tracking(ip_hash, created_at);
```

### Modified Tables

```sql
-- =====================================================
-- SCHOOLS TABLE — Add 'type' and 'owner' columns
-- =====================================================
ALTER TABLE schools ADD COLUMN type TEXT NOT NULL DEFAULT 'institutional';
  -- 'institutional' = real school (existing behavior)
  -- 'personal'      = virtual school for personal workspace

ALTER TABLE schools ADD COLUMN owner_uid TEXT;
  -- Firebase UID of the teacher who owns this personal workspace
  -- NULL for institutional schools (owned by admin)

ALTER TABLE schools ADD COLUMN tier TEXT DEFAULT 'school';
  -- 'free' | 'pro' | 'school' — inherited from owner's subscription

-- Index
CREATE INDEX idx_schools_type ON schools(type);
CREATE INDEX idx_schools_owner ON schools(owner_uid);

-- =====================================================
-- TEACHERS TABLE — Add workspace metadata columns
-- (Auth reads from this table, NOT Firebase custom claims)
-- =====================================================
ALTER TABLE teachers ADD COLUMN workspace_type TEXT NOT NULL DEFAULT 'institutional';
  -- 'institutional' = belongs to a real school (existing)
  -- 'personal'      = personal workspace owner

ALTER TABLE teachers ADD COLUMN tier TEXT NOT NULL DEFAULT 'school';
  -- 'free' | 'pro' | 'school' — drives UI and limit enforcement
```

### RLS (Row-Level Security) Updates

```sql
-- Personal workspace: owner can read/write their own virtual school's data
CREATE POLICY personal_workspace_access ON schools
  FOR ALL
  USING (
    type = 'personal' AND owner_uid = auth.uid()
  );

-- Existing school access policy stays unchanged
-- (institutional schools use existing schoolId-based RLS)
```

---

## 6. Route & Page Structure

### New Public Routes (No Auth)

```
/tools                          → Tools landing page (list of free tools)
/tools/form-generator           → Quick Form Generator (the main magnet)
/tools/form-generator/sf5       → SF5 Promotion List generator
/tools/form-generator/sf9       → SF9 Report Card generator
/tools/form-generator/sf2       → SF2 Attendance Summary generator
/tools/grade-calculator         → Simple grade calculator (bonus tool)
```

### New Authenticated Routes (Personal Workspace)

```
/personal                       → Personal Dashboard (simplified)
/personal/students              → My Students (manage list)
/personal/grades                → My Gradebook
/personal/forms                 → My Forms (generate from saved data)
/personal/forms/sf5             → SF5 from my data
/personal/forms/sf9             → SF9 from my data
/personal/settings              → Account settings, subscription
/personal/upgrade               → Upgrade to Pro / see plans
```

### Existing Routes (Unchanged)

```
/dashboard                      → School Dashboard (Tier 3, unchanged)
/students, /teachers, etc.      → Full school management (unchanged)
```

### Navigation Logic

```typescript
// In App.tsx or WorkspaceContext
function getHomeRoute(user: AuthUser): string {
  if (!user) return '/tools';                          // Not logged in → public tools
  if (user.tier === 'school') return '/dashboard';     // School user → full SIS
  return '/personal';                                  // Personal user → personal dashboard
}
```

---

## 7. Phase 1: Free Form Generator (Public Tool)

### Overview

A **standalone, client-side** tool at `/tools/form-generator` that requires NO login. Teacher uploads a CSV → sees a preview → downloads a DepEd-compliant PDF. Data never leaves the browser.

### Supported Forms (Phase 1 — Tier 0 Public Tool)

Only Category A (teacher/adviser) forms are offered in the standalone tool.
Category B (admin) and C (division) forms are not available here.

| Form | Input Required | Output | Category |
|------|---------------|--------|----------|
| **SF5** (Promotion List) | Student names, LRN, final grades, section/grade level | PDF: Paginated promotion list with pass/fail/promoted status | A — Adviser |
| **SF9** (Report Card) | Student name, LRN, grades Q1-Q4 per subject, attendance, core values | PDF: 2-page DepEd report card | A — Adviser |
| **SF2** (Attendance) | Student names, daily attendance (P/A/L/E) by month | PDF: Monthly attendance summary | A — Adviser |
| **SF5-K** (Kinder Competency) | Student names, readiness indicators, competency areas | PDF: Kinder promotion report | A — Adviser |
| **ELLN** (Early Literacy K-3) | Student names, literacy + numeracy domain scores (Q1-Q4) | PDF: ELLN proficiency report | A — Adviser |

**NOT available in standalone tool (requires saved data / School Plan):**
- ECR (needs ongoing score entry, not a one-shot upload)
- SF1, SF3, SF4, SF6, SF7, SF8 (school-admin forms → School Plan)
- SF10 (cumulative multi-year → School Plan)

### CSV Template Format

Teachers download a pre-made template, fill it in Excel/Google Sheets, upload it back.

**SF5 Template (`sf5-template.csv`):**
```csv
LRN,Last Name,First Name,Middle Name,Gender,Filipino,English,Math,Science,AP,ESP,MAPEH,EPP/TLE,Final Average
123456789012,DELA CRUZ,MARIA,SANTOS,Female,85,88,82,79,90,87,85,83,84.88
```

**SF9 Template (`sf9-template.csv`):**
```csv
LRN,Last Name,First Name,Middle Name,Gender,Subject,Q1,Q2,Q3,Q4
123456789012,DELA CRUZ,MARIA,SANTOS,Female,Filipino,85,87,88,86
123456789012,DELA CRUZ,MARIA,SANTOS,Female,English,88,85,90,87
```

### UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│  /tools/form-generator                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EduSync Free Form Generator                        │    │
│  │  Generate DepEd-compliant forms in seconds          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 1: Choose Form Type                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │   SF5    │  │   SF9    │  │   SF2    │                 │
│  │Promotion │  │Report Card│  │Attendance│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  Step 2: School Information (Required — every form needs this)│
│  ┌─────────────────────────────────────────────────────┐    │
│  │  * School Name: [__Mati Central Elementary__]       │    │
│  │  * School ID:   [__301457__________________]        │    │
│  │  * Division:    [__Davao Oriental__________]        │    │
│  │    Region:      [__Region XI___] (auto from Div.)   │    │
│  │    District:    [__Mati District I_________]        │    │
│  │  * School Year: [__2025-2026_______________]        │    │
│  │  * Grade Level: [__Grade 6_________________]        │    │
│  │  * Section:     [__Einstein________________]        │    │
│  │  * Adviser:     [__Maria Dela Cruz_________]        │    │
│  │                                                     │    │
│  │  (* = required — these print on the form header)    │    │
│  │                                                     │    │
│  │  💡 Tip: These fields are saved in your browser     │    │
│  │     so you don't need to re-type them next time.    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 3: Upload Data                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │     📄 Download Template (Excel/CSV)                │    │
│  │                                                     │    │
│  │     ┌───────────────────────────────────┐           │    │
│  │     │  Drop your file here or click     │           │    │
│  │     │  to upload (.csv, .xlsx)          │           │    │
│  │     └───────────────────────────────────┘           │    │
│  │                                                     │    │
│  │  ✅ 45 students loaded                              │    │
│  │  ⚠️  2 rows have missing grades (highlighted)      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Step 4: Preview & Download                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Live PDF Preview]                                 │    │
│  │                                                     │    │
│  │  Page 1 of 3                                        │    │
│  │  ┌─────────────────────────────────────────┐        │    │
│  │  │  Republic of the Philippines             │        │    │
│  │  │  Department of Education                 │        │    │
│  │  │  School Form 5 (SF5)                     │        │    │
│  │  │  ...                                     │        │    │
│  │  └─────────────────────────────────────────┘        │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │  ⬇ Download PDF  │  │  💾 Save (Create Free Acct)  │    │
│  └──────────────────┘  └──────────────────────────────┘    │
│                                                             │
│  ────────────────────────────────────────────────────       │
│  ⚡ Want to save your data & generate forms anytime?        │
│     Create a free EduSync account → [Sign Up Free]          │
│  ────────────────────────────────────────────────────       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Implementation

```
Form Generator Tool (Client-Side Only)
│
├─ Components:
│   src/components/tools/
│   ├─ FormGeneratorPage.tsx        ← Main page with wizard steps
│   ├─ FormTypeSelector.tsx         ← Step 1: Pick form type
│   ├─ SchoolInfoForm.tsx           ← Step 2: Manual school info
│   ├─ DataUploader.tsx             ← Step 3: CSV/Excel upload + validation
│   ├─ FormPreview.tsx              ← Step 4: Live PDF preview
│   └─ templates/
│       ├─ sf5-template.csv         ← Downloadable template
│       ├─ sf9-template.csv
│       └─ sf2-template.csv
│
├─ Services (client-side only):
│   src/services/tools/
│   ├─ csvParser.ts                 ← Parse uploaded CSV into structured data
│   ├─ excelParser.ts               ← Parse .xlsx (using SheetJS/xlsx library)
│   ├─ dataValidator.ts             ← Validate required fields, grade ranges
│   ├─ sf5StandaloneGenerator.ts    ← Generate SF5 PDF from raw data
│   ├─ sf9StandaloneGenerator.ts     ← Generate SF9 PDF from raw data
│   └─ sf2StandaloneGenerator.ts    ← Generate SF2 PDF from raw data
│
├─ Reuses existing:
│   src/utils/pdf/sf5Generator.ts   ← Refactor to accept raw data input
│   components/PrintableReport.tsx  ← Refactor render to accept raw data
│
└─ Dependencies (new):
    xlsx (SheetJS)                  ← Excel file parsing (~200KB)
```

### Rate Limiting (Tier 0 — Anonymous)

```typescript
// Client-side rate limit using localStorage
const DAILY_LIMIT = 3;

function canDownload(): boolean {
  const today = new Date().toDateString();
  const usage = JSON.parse(localStorage.getItem('edusync_tool_usage') || '{}');
  
  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
  }
  
  return usage.count < DAILY_LIMIT;
}

function recordDownload(): void {
  const today = new Date().toDateString();
  const usage = JSON.parse(localStorage.getItem('edusync_tool_usage') || '{}');
  
  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
  }
  
  usage.count++;
  localStorage.setItem('edusync_tool_usage', JSON.stringify(usage));
}
```

### Watermark (Tier 0)

```typescript
// Add subtle watermark to free-tier PDFs
function addWatermark(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      'Generated with EduSync Free Tools — edusync-sis.web.app/tools',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
}
```

---

## 8. Phase 2: Personal Workspace (Free Account)

### Signup Flow

```
┌────────────────────────────────────────────────────────┐
│  Create Your Free EduSync Account                      │
│                                                        │
│  Your Information                                      │
│  * Full Name: [__Maria Dela Cruz________]              │
│  * Email:     [__maria@gmail.com________]              │
│  * Password:  [••••••••••••••••••••••••]              │
│                                                        │
│  Your School                                           │
│  * School Name: [__Mati Central Elementary__]          │
│  * School ID:   [__301457__________________]          │
│  * Division:    [__Davao Oriental ▼________]          │
│    Region:      [__Region XI__] (auto-filled)          │
│    District:    [__Mati District I_________]          │
│                                                        │
│  Your Class                                            │
│  * Grade Level: [__Grade 6 ▼__]                       │
│  * Section:     [__Einstein___]                        │
│                                                        │
│  [  Create Free Account  ]                             │
│                                                        │
│  ─────── or ───────                                    │
│  [G] Continue with Google                              │
│                                                        │
│  Already have an account? [Log in]                     │
│  School admin? [Start School Trial]                    │
└────────────────────────────────────────────────────────┘
```

### What Happens on Signup

```typescript
async function createPersonalWorkspace(user: FirebaseUser, profile: SignupProfile) {
  // 1. Create virtual school record WITH real school info
  const virtualSchool = await supabase.from('schools').insert({
    name: profile.schoolName,                  // Real school name
    school_id_number: profile.schoolIdNumber,  // Real DepEd school ID
    division: profile.division,                // Real division
    region: profile.region,                    // Auto-derived from division
    district: profile.district || null,        // Optional
    type: 'personal',                          // Marks this as a personal workspace
    owner_uid: user.uid,
    tier: 'free',
    current_school_year: getCurrentSchoolYear(),
  }).select().single();

  // 2. Create teacher record (user is teacher + self-admin)
  await supabase.from('teachers').insert({
    school_id: virtualSchool.id,
    firebase_uid: user.uid,
    email: user.email,
    name: profile.fullName,
    role: 'admin',
  });

  // 3. Create default advisory section
  const section = await supabase.from('sections').insert({
    school_id: virtualSchool.id,
    name: profile.sectionName,
    grade_level: profile.gradeLevel,
    school_year: getCurrentSchoolYear(),
    adviser_id: null, // Will link after teacher record is created
  }).select().single();

  // 4. Create free subscription record
  await supabase.from('subscriptions').insert({
    user_id: user.uid,
    tier: 'free',
    max_students: 50,
    max_teaching_sections: 1,
    max_advisory_sections: 1,
    max_downloads_per_day: 10,
  });

  // 5. Update teacher record with workspace metadata
  //    (Auth reads from PostgreSQL, NOT Firebase custom claims)
  await supabase.from('teachers').update({
    workspace_type: 'personal',
    tier: 'free',
  }).eq('firebase_uid', user.uid);
}
```

### Personal Dashboard (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│  ☰  EduSync Personal                     Maria Dela Cruz   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 My Dashboard                                           │
│  ──────────────────────────────────────────────────         │
│                                                             │
│  Welcome, Maria! School Year 2025-2026                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  👥 Students │  │  📝 Grades   │  │  📄 Forms    │     │
│  │    32 / 50   │  │  Q2 in       │  │  3 generated │     │
│  │              │  │  progress    │  │  this month  │     │
│  │  [Manage]    │  │  [Open]      │  │  [Generate]  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Quick Actions:                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  + Add Students (Manual or CSV Import)        │          │
│  │  📝 Enter Grades for Q2                       │          │
│  │  📄 Generate SF9 (Report Cards)                │          │
│  │  📄 Generate SF5 (Promotion List)             │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⭐ Upgrade to Personal Pro — ₱79/month              │  │
│  │  Unlimited teaching sections & students               │  │
│  │  [See Plans]                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Sidebar:                                                   │
│  ├─ 📊 Dashboard                                           │
│  ├─ 👥 My Students                                         │
│  ├─ 📝 Gradebook / ECR                                     │
│  ├─ 📄 Generate Forms (advisory sections only)             │
│  │   ├─ SF9 (Report Card)                                 │
│  │   ├─ SF5 (Promotion)                                    │
│  │   ├─ SF5-K (Kinder)                                     │
│  │   ├─ SF2 (Attendance)                                   │
│  │   ├─ ELLN (K-3 Literacy)                                │
│  │   └─ 🔒 SF1, SF6, SF7, SF10 → School Plan             │
│  ├─ ⚙️ Settings                                            │
│  │   ├─ School Info                                        │
│  │   ├─ Learning Areas                                     │
│  │   └─ School Year                                        │
│  ├─ 💳 Subscription                                        │
│  └─ 🏫 Join a School (link to real school)                 │
└─────────────────────────────────────────────────────────────┘
```

### Tier Enforcement

The key insight is that Filipino teachers have TWO relationships with sections:

| Relationship | What They Do | Typical Count | Generates Forms? |
|---|---|---|---|
| **Advisory** (homeroom) | Class adviser, signs report cards, responsible for total student welfare | 1 (rarely 2) | YES — all forms for this section |
| **Teaching** (subject) | Teaches 1-2 subjects, enters grades for their subject only | 5-12+ sections | NO — only grade entry (ECR), not full forms |

```typescript
// WorkspaceContext.tsx (NEW — wraps SchoolContext)
interface WorkspaceLimits {
  tier: 'free' | 'pro' | 'school';
  maxStudents: number;
  maxTeachingSections: number;    // For grade entry (unlimited in Pro)
  maxAdvisorySections: number;    // For form generation (max 2 in Pro)
  maxDownloadsPerDay: number;
  downloadsUsedToday: number;
  isPersonal: boolean;
}

function useWorkspaceLimits(): WorkspaceLimits {
  const { subscription, usage } = useSubscription();
  
  return useMemo(() => ({
    tier: subscription?.tier || 'free',
    maxStudents: subscription?.max_students || 50,
    maxTeachingSections: subscription?.max_teaching_sections || 1,  // free=1, pro=unlimited
    maxAdvisorySections: subscription?.max_advisory_sections || 1,  // free=1, pro=2
    maxDownloadsPerDay: subscription?.max_downloads_per_day || 10,
    downloadsUsedToday: usage?.todayCount || 0,
    isPersonal: school?.type === 'personal',
  }), [subscription, usage, school]);
}

// Anti-abuse: Forms ALWAYS print the account holder's name as adviser
// If Maria generates SF9 for a section she doesn't advise,
// the form shows HER name — which is incorrect and DepEd won't accept it.
function getAdviserNameForForm(section: Section, currentUser: Teacher): string {
  // In personal workspace, adviser name is ALWAYS the account holder
  // This is a natural deterrent against abuse
  return currentUser.name;
}
```

---

## 9. Phase 3: Premium Features & School Bridge

### Pro Features (₱79/month) — Advisory vs. Teaching Model

#### Section Limits

| Limit | Free Account | Personal Pro | School Plan |
|---|---|---|---|
| **Teaching sections** (grade entry / ECR) | 1 | **Unlimited** | Unlimited |
| **Advisory sections** (form generation) | 1 | **2** | Unlimited |
| **Students (total across all sections)** | 50 | Unlimited | Unlimited |
| **PDF downloads/day** | 10 | Unlimited | Unlimited |
| **Watermark on PDFs** | Yes | No | No |
| **Excel/CSV bulk import** | ❌ | ✅ | ✅ |
| **Offline PWA mode** | ❌ | ✅ | ✅ |
| **Grade history (multi-year)** | ❌ | ✅ | ✅ |
| **Priority email support** | ❌ | ✅ | ✅ |

#### Complete Form Access Matrix (All 17 Forms/Reports)

Each form is categorized by WHO generates it in real DepEd practice, and whether
it makes sense for an individual teacher vs. requiring school-level authority.

**CATEGORY A: Teacher/Adviser Forms** — Appropriate for Personal Mode
These are forms a class adviser or subject teacher generates as part of their job.

| Form | Description | Scope | Who Generates (DepEd) | Free | Pro | School |
|------|-------------|-------|----------------------|------|-----|--------|
| **SF2** | Daily Attendance Record | Per-section, monthly | Class adviser | ✅ Advisory only | ✅ Advisory only | ✅ All |
| **SF9** | Progress Report Card / Report Card (quarterly grades) | Per-student | Adviser + subject teachers | ✅ Advisory only | ✅ Advisory only | ✅ All |
| **SF5** | Promotion/Competency Report | Per-student | Adviser (approved by principal) | ✅ Advisory only | ✅ Advisory only | ✅ All |
| **SF5-K** | Kindergarten Competency Report | Per-student (K only) | Kinder teacher | ✅ Advisory only | ✅ Advisory only | ✅ All |
| **ECR** | Electronic Class Record | Per-section, per-subject | Subject teacher | ✅ 1 section | ✅ **Unlimited** | ✅ All |
| **ELLN** | Early Literacy & Numeracy (K-3) | Per-student | Grade teacher (K-3) | ✅ Advisory only | ✅ Advisory only | ✅ All |

**CATEGORY B: School Administration Forms** — Require institutional authority
These are forms that a registrar, principal, or school-level admin generates.
Not appropriate for a single teacher to produce independently.

| Form | Description | Scope | Who Generates (DepEd) | Free | Pro | School |
|------|-------------|-------|----------------------|------|-----|--------|
| **SF1** | School Register (enrollment) | Per-school | Registrar/Principal | ❌ | ❌ | ✅ |
| **SF3** | Books & Instructional Materials | Per-school | Librarian/Compiler | ❌ | ❌ | ✅ |
| **SF4** | Monthly Learner Movement | Per-section, monthly | Principal/Registrar | ❌ | ❌ | ✅ |
| **SF6** | Summarized Promotion Report | Per-grade/school | Principal (aggregated) | ❌ | ❌ | ✅ |
| **SF7** | School Personnel Master List | Per-school | Principal/HR | ❌ | ❌ | ✅ |
| **SF8** | Health & Nutrition Record | Per-student | Health Teacher/Nurse | ❌ | ❌ | ✅ |
| **SF10** | Permanent Academic Record | Per-student, cumulative | Registrar | ❌ | ❌ | ✅ |

**CATEGORY C: Division-Level Forms** — Multi-school oversight only

| Form | Description | Scope | Who Generates | Free | Pro | School |
|------|-------------|-------|---------------|------|-----|--------|
| **Division SF5** | Consolidated promotion stats | Multi-school | Division office | ❌ | ❌ | ❌ (Division only) |
| **Division SF6** | Consolidated promotion summary | Multi-school | Division office | ❌ | ❌ | ❌ (Division only) |
| **Division SF7** | Consolidated personnel list | Multi-school | Division office | ❌ | ❌ | ❌ (Division only) |

#### Why This Categorization Works

```
CATEGORY A (Teacher forms) → Available in Personal Mode
  REASON: These are what a teacher ACTUALLY produces as part of their daily work.
  A class adviser generates SF9, SF5, SF2 for their advisory class.
  A subject teacher uses ECR to enter grades.
  These are the forms teachers fill out by hand/Excel today → our target use case.

CATEGORY B (Admin forms) → School Plan only
  REASON: These require institutional data that one teacher doesn't have.
  - SF1 needs the ENTIRE school enrollment, not just one section
  - SF6 needs ALL grades across ALL sections (aggregated promotion stats)
  - SF7 needs ALL teacher records (personnel list)
  - SF10 needs CUMULATIVE data across ALL years and ALL teachers
  - SF4 needs transfer/dropout data managed by registrar
  A single teacher generating SF1 or SF7 for a school is a red flag.
  This is the NATURAL differentiator for school plans — not artificial gating.

CATEGORY C (Division forms) → Division accounts only
  REASON: Multi-school consolidation. Not even school-level.
```

#### ECR (Electronic Class Record) — Special Case

```
ECR is the ONE form that follows TEACHING sections, not ADVISORY sections.

Why: A math teacher who teaches 8 sections enters grades via ECR for all 8.
      They don't need to be the adviser to enter their subject's grades.
      This is the core value proposition for subject teachers.

Personal Mode ECR flow:
  Free:  ECR for 1 teaching section
  Pro:   ECR for UNLIMITED teaching sections
  School: ECR for all, with principal/admin review layer

IMPORTANT: ECR data (per-subject grades) feeds INTO SF9 and SF5,
but only the ADVISER generates those forms by pulling all subjects together.
In Personal Mode, the adviser can only pull grades they entered themselves
(since there are no other teachers in a personal workspace).
```

#### ELLN — Special Case

```
ELLN assessments are for K-Grade 3 only.
In most schools, the grade teacher (who is also the adviser) does ELLN.
So ELLN follows ADVISORY sections — same as SF9.

Free:  ELLN for 1 advisory section
Pro:   ELLN for up to 2 advisory sections
School: ELLN for all, with statistical reports across sections
```

#### Form Generation Permission Check

```typescript
// Which forms can this user generate for this section?
function canGenerateForm(
  formType: FormType,
  section: Section,
  user: Teacher,
  workspace: WorkspaceLimits
): { allowed: boolean; reason?: string } {

  // Category C: Division-only
  if (['division_sf5', 'division_sf6', 'division_sf7'].includes(formType)) {
    return { allowed: false, reason: 'Division-level reports require a Division account.' };
  }

  // Category B: School-only
  const schoolOnlyForms = ['sf1', 'sf3', 'sf4', 'sf6', 'sf7', 'sf8', 'sf10'];
  if (schoolOnlyForms.includes(formType) && workspace.isPersonal) {
    return {
      allowed: false,
      reason: `${formType.toUpperCase()} requires a School Plan. This form needs school-wide data that a personal workspace cannot provide.`
    };
  }

  // Category A (except ECR): Requires advisory relationship
  const advisoryForms = ['sf2', 'sf5', 'sf5k', 'sf9', 'elln'];
  if (advisoryForms.includes(formType) && workspace.isPersonal) {
    const isAdviser = section.adviserId === user.id;
    if (!isAdviser) {
      return {
        allowed: false,
        reason: 'You can only generate this form for sections you advise.'
      };
    }
  }

  // ECR: Follows teaching sections (any section you teach)
  if (formType === 'ecr') {
    // Teaching sections are unlimited in Pro, so just check free tier limit
    if (workspace.tier === 'free' && teachingSectionCount >= workspace.maxTeachingSections) {
      return { allowed: false, reason: 'Free plan allows ECR for 1 section. Upgrade to Pro for unlimited.' };
    }
  }

  return { allowed: true };
}
```

### School Migration Flow

When a teacher's school adopts EduSync:

```
┌──────────────────────────────────────────────────────────────┐
│  🏫 You've been invited to join "Mati Central Elementary"!  │
│                                                              │
│  Your school is now on EduSync. Join to collaborate          │
│  with other teachers and access the full school system.      │
│                                                              │
│  What happens to my personal data?                           │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Option A: Import my students & grades into the    │      │
│  │            school (recommended)                    │      │
│  │                                                    │      │
│  │  Option B: Keep my personal workspace as a         │      │
│  │            separate read-only archive              │      │
│  │                                                    │      │
│  │  Option C: Delete my personal workspace            │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  [  Accept Invitation  ]    [ Maybe Later ]                  │
└──────────────────────────────────────────────────────────────┘
```

### Referral Program

```
- Teacher refers a colleague → colleague upgrades to Pro
- Referrer gets 1 month of Pro FREE
- Referred gets first month at ₱29 (40% off)
- Tracked via referral codes: MARIA-XXXX
- Max 6 free months per year (prevents abuse)
```

---

## 10. Security & Privacy

### Data Processing

| Tier | Where Data Lives | Privacy |
|------|-----------------|---------|
| **Tier 0 (Tools)** | Browser only. Never touches server. | Maximum privacy. We see nothing. |
| **Tier 1-2 (Personal)** | Supabase (encrypted at rest, TLS in transit) | Standard cloud SaaS. Teacher owns data. |
| **Tier 3 (School)** | Same Supabase, school-owned | Institutional data, school admin controls access |

### Key Security Rules

```
1. Personal workspace data is NEVER visible to other users
   → RLS policy: owner_uid = auth.uid()

2. Tier 0 tool NEVER sends data to any server
   → All processing in Web Workers or main thread
   → No fetch() calls, no analytics on file content

3. Personal workspace data is NEVER mixed with school data
   → schools.type = 'personal' filtered out of all admin/division views
   → Superadmin can see aggregate metrics but NOT personal workspace content

4. Student PII in personal workspaces follows RA 10173 (Data Privacy Act)
   → Teacher is the data controller (they uploaded it)
   → EduSync is the data processor
   → Clear Terms of Service on data handling

5. Payment data NEVER stored in our database
   → PayMongo handles all card/wallet info
   → We only store subscription status + expiry
```

### Forms Disclaimer

```
PDFs generated from personal workspaces include a footer:
"Generated via EduSync Personal — Not an official school document"

This is removable in the Pro tier if the teacher fills in complete school info.
```

---

## 11. Marketing & Growth Strategy

### SEO & Content (Long-term)

```
Target keywords (Filipino teacher searches):
├─ "SF5 form generator online"
├─ "SF9 report card template download"
├─ "DepEd report card generator"
├─ "free gradebook for teachers Philippines"
├─ "SF2 attendance form maker"
├─ "how to fill up SF10"
└─ "online grade computation DepEd"

Content strategy:
├─ Blog posts: "How to Fill Up SF5: Complete Guide (2026)"
├─ YouTube tutorials: "Generate Report Cards in 5 Minutes"
├─ Facebook groups: Share free tool link in teacher communities
└─ Tool landing page optimized for each form type
```

### Social Media (Quick wins)

```
Facebook (where PH teachers live):
├─ Share to: DepEd Teachers Club (500K+ members)
├─ Share to: Filipino Teachers' Lounge (200K+ members)
├─ Create: "EduSync Free Tools for Teachers" page
└─ Post: "Tired of filling SF forms by hand? Try our free generator"

TikTok / Reels:
├─ 30-second demo: "Excel → SF9 Report Card in 60 seconds"
└─ Teacher reaction videos: "This tool saved me 3 hours"
```

### Launch Strategy

```
Week 1: Soft launch
  → Deploy /tools/form-generator
  → Share in 2-3 small Facebook teacher groups
  → Collect feedback, fix bugs

Week 2-3: Content push
  → Blog post + YouTube tutorial
  → Share in larger Facebook groups
  → Ask early users for testimonials

Week 4: Official launch
  → Landing page update with "Free Tools" section
  → Product Hunt (PH EdTech category)
  → Email blast to existing school trial contacts

Month 2+: Personal Workspace launch
  → "Save your data" CTA on form generator
  → Email all tool users: "Personal workspace is here"
  → Start monetization with Pro tier
```

---

## 12. Implementation Roadmap

### Phase 1: Free Form Generator ✅ COMPLETE

```
Week 1: ✅ DONE
  ✅ Create /tools route structure and FormGeneratorPage
     → src/components/tools/FormGeneratorPage.tsx (4-step wizard)
  ✅ Build CSV parser + data validator for SF5 format
     → src/services/tools/csvParser.ts + dataValidator.ts
  ✅ Refactor sf5Generator.ts to accept raw data (not just DB queries)
  ✅ Build SF5 standalone PDF generator
     → src/services/tools/sf5StandaloneGenerator.ts
  ✅ Build DataUploader component (drag-drop CSV/Excel)
     → src/components/tools/DataUploader.tsx
  ✅ Create downloadable CSV templates
     → Generated on-demand via downloadTemplate() in DataUploader

Week 2: ✅ DONE
  ✅ Build SF9 standalone PDF generator
     → src/services/tools/sf9StandaloneGenerator.ts
  ✅ Build SchoolInfoForm (manual input for form headers)
     → src/components/tools/SchoolInfoForm.tsx
  ✅ Build FormPreview component (live PDF preview)
     → src/components/tools/FormPreview.tsx
  ✅ Add watermark logic for free tier
     → src/services/tools/watermark.ts
  ✅ Add client-side rate limiting (3 downloads/day)
     → src/services/tools/rateLimiter.ts
  ✅ Landing page: Add "Free Tools" section
     → src/components/marketing/LandingPage.tsx (Free Tools CTA)

Week 3: ✅ DONE
  ✅ Build SF2 standalone PDF generator
     → src/services/tools/sf2StandaloneGenerator.ts
  ✅ Polish UI, responsive design, error handling
  ✅ Add Excel (.xlsx) support via SheetJS
     → Dynamic import in csvParser.ts (accepts .csv/.xlsx/.xls)
  ✅ SEO: Meta tags, structured data, sitemap update
     → index.html (og:title, description, keywords)
  ✅ Testing & bug fixes — 24/24 form generator tests passing
  ☐ Deploy to production (pending build verification)

Phase 1 Test Results: 24/24 tests passing ✅
```

### Phase 2: Personal Workspace ~90% Complete

```
Week 4-5: ✅ DONE
  ✅ Database: Create subscriptions + usage_tracking tables
     → scripts/migrations/001_personal_workspace.sql
  ✅ Database: Add type, owner_uid, tier columns to schools
     → Same migration file; schools.type, schools.owner_uid, schools.tier
  ⚠️ Database: RLS policies for personal workspaces
     → Using SECURITY DEFINER RPCs instead of RLS policies
     → create_personal_workspace, get_user_subscription, get_personal_workspace
  ✅ Build personal signup flow (simplified)
     → src/components/personal/PersonalSignupScreen.tsx (2-step: Account → School/Class)
  ✅ Build virtual school auto-creation logic
     → src/services/personalWorkspaceService.ts (signup creates virtual school)
  ✅ Build WorkspaceContext (wraps SchoolContext)
     → src/contexts/WorkspaceContext.tsx (useWorkspace hook, tier/limits/isPersonal)
  ✅ Build personal dashboard layout
     → src/components/personal/PersonalDashboard.tsx + PersonalLayout.tsx

Week 6-7: ~75% DONE
  ✅ Adapt student management for personal workspace
     → src/components/personal/PersonalStudents.tsx (CRUD + tier enforcement)
  ✅ Adapt gradebook for personal workspace
     → src/components/personal/PersonalGradebook.tsx (students × subjects × Q1-Q4 grid, debounced save)
  ✅ Adapt form generation to use saved data
     → src/components/personal/PersonalForms.tsx (auto-fill SF5/SF9/SF2 from Supabase)
  ✅ Build tier enforcement (student limits, section limits)
     → personalWorkspaceService.ts enforces max_students, max_sections
     → PersonalStudents.tsx shows count vs limit
  ✅ Build upgrade prompts (free → pro CTAs)
     → UpgradeModal.tsx created (pricing comparison, Free vs Pro)
     → Wired into Dashboard, Students, Gradebook, Sidebar, Settings
     → All existing dead buttons now open the upgrade modal
  ✅ Testing: personal workspace E2E tests
     → tests/personal-workspace/personal-workspace.spec.ts — 64/65 passing ✅
  ☐ Deploy personal workspace (pending build verification)

Remaining Phase 2 work:
  → Build verification ✅ (npm run build passes cleanly — 1,798 modules, no TS errors)
  → Upgrade prompts ✅ (UpgradeModal.tsx + wired into all 5 components)
  → Production deployment
```

### Phase 3: Monetization + Growth — In Progress

```
Week 8-9: ✅ DONE
  ✅ Integrate PayMongo (GCash + Maya + Cards)
     → functions/src/payments.js — 5 Cloud Functions (checkout, webhook, status, cancel, history)
     → src/services/paymentService.ts — Client-side service (httpsCallable)
     → Supports GCash, Maya, GrabPay, Credit/Debit Cards
     → HMAC-SHA256 webhook signature verification (timestamp + replay protection)
     → ⚠️ ACTIVATION NEEDED: Set PAYMONGO_SECRET_KEY + PAYMONGO_WEBHOOK_SECRET in functions/.env
  ✅ Build subscription management page
     → PersonalSettings.tsx expanded with usage stats, progress bars, data export
     → Usage section: students count vs limit, subjects, grades
     → Data Export: download all workspace data as JSON
     → Payment return handling: success/cancelled banner on redirect from PayMongo
  ✅ Build upgrade/downgrade flow
     → UpgradeModal.tsx: billing cycle toggle (monthly/yearly), checkout redirect
     → Cancel subscription UI with confirmation (keeps Pro until period ends)
     → Duplicate subscription check (prevents double-paying)
     → Auto-expires subscriptions past current_period_end
  ✅ Build billing history (REAL — backed by payment_history table)
     → scripts/migrations/005_payment_history.sql — payment_history table + RPC
     → getBillingHistory Cloud Function queries real payment_history records
     → PersonalSettings.tsx billing history shows: date, amount, status, payment method, coverage period
     → Idempotent webhook processing (prevents duplicate payment records)
     → Records both successful and failed payment attempts
  ✅ Webhook handling: payment success/failure
     → paymongoWebhook verifies signature, records to payment_history, updates subscription
     → Handles both checkout_session.payment.paid and payment.failed events
     → Idempotency check prevents duplicate processing

Week 10: ✅ DONE
  ✅ Build referral system
     → scripts/migrations/003_referral_system.sql — referral_codes + referrals tables + credits view
     → src/services/referralService.ts — getOrCreateReferralCode, applyReferralCode, getReferralStats
     → src/components/personal/ReferralCard.tsx — referral card UI with code, copy link, stats
     → PersonalSignupScreen.tsx — reads ?ref= URL param, shows referral banner, applies code on signup
     → Referral format: FIRSTNAME-XXXX, max 6 credits/year, referred gets Pro at ₱29
  ✅ Build school invitation/migration flow
     → scripts/migrations/004_school_invitations.sql — school_invitations + workspace_migrations tables
     → RPCs: accept_school_invitation(), create_school_invitation()
     → src/services/schoolInvitationService.ts — validateInviteCode, acceptInvitation, getPendingInvitations
     → src/components/personal/JoinSchoolModal.tsx — 3-step modal (code → confirm data action → success)
     → Data actions: import into school, keep as archive, or delete personal data
  ✅ Analytics dashboard (FIXED — all 3 bugs resolved)
     → src/components/personal/PersonalAnalytics.tsx — 6 summary cards, grade distribution, performance
     → /personal/analytics route + sidebar nav link
     → Form generation tracking via usage_tracking table (uses .contains() JSONB filter)
     → Period selector (quarter/semester/year) — NOW FUNCTIONAL with date-based grade filtering
     → Grading completion: calculated from (students with grades / total students), not hardcoded
     → Pro upgrade CTA for free users
  ✅ Launch marketing push
     → src/components/marketing/TeachersLandingPage.tsx — full teacher-focused landing page
     → Route: /teachers (lazy loaded, public route)
     → Sections: Hero, Problem, Features (6), Pricing (Free vs Pro), Testimonials (3), How It Works, Referral CTA, Footer
     → SEO: Updated index.html with OG image, twitter cards, canonical URL, robots meta, expanded keywords
     → Dynamic document.title via useEffect on /teachers page
     → Enhanced onboarding welcome flow in PersonalDashboard (interactive stepper, dismissible via localStorage)
     → E2E tests: Section 19 (8 tests — landing page) + Section 20 (3 tests — onboarding)

### Production Polish (March 24, 2026)

```
  ✅ SEO: robots.txt & sitemap.xml (public/)
  ✅ 404 NotFound page (src/components/marketing/NotFoundPage.tsx) — replaces silent redirect
  ✅ Dynamic document.title on Privacy Policy, Terms of Service, Teachers, 404 pages
  ✅ Post-signup success screen (PersonalSignupScreen.tsx) — 2.5s celebration before redirect
  ✅ Cross-links: LandingPage footer → /teachers "For Teachers" + "Free Form Generator" links
```

### Total Timeline: ~10 weeks from start to full monetization

### Progress Summary (Updated March 24, 2026)

```
┌───────────────────┬──────────┬─────────┬──────────────────────────────────────────────────┐
│ Phase             │ Total    │ Status  │ Notes                                            │
├───────────────────┼──────────┼─────────┼──────────────────────────────────────────────────┤
│ Phase 1 (Tools)   │ 18 items │ ✅ 18   │ Deployed to production                           │
│ Phase 2 (Worksp)  │ 14 items │ ✅ 14   │ Deployed, SQL migrations ran                     │
│ Phase 3 (Money)   │  9 items │ ✅ 9    │ Code complete — see activation steps below        │
│ Polish            │  5 items │ ✅ 5    │ SEO, 404, meta tags, post-signup                 │
├───────────────────┼──────────┼─────────┼──────────────────────────────────────────────────┤
│ TOTAL             │ 46 items │ 46 ✅   │ All code complete + deployed                     │
└───────────────────┴──────────┴─────────┴──────────────────────────────────────────────────┘

⚠️  ACTIVATION REQUIRED TO ENABLE PAID SUBSCRIPTIONS:
    1. Run migration: scripts/migrations/005_payment_history.sql in Supabase SQL Editor
    2. Create PayMongo account at https://paymongo.com
    3. Set env vars in functions/.env:
       PAYMONGO_SECRET_KEY=sk_live_...
       PAYMONGO_WEBHOOK_SECRET=whsec_...
    4. Register webhook in PayMongo dashboard:
       URL: https://us-central1-edusync-sis.cloudfunctions.net/paymongoWebhook
       Events: checkout_session.payment.paid, payment.failed
    5. Deploy functions: cd functions && firebase deploy --only functions

    Until these steps are done, everything works as FREE TIER.
    The upgrade button will show an error if PayMongo keys are not configured.

Key Files Implemented:
  Phase 1: src/components/tools/ (6 components)
           src/services/tools/ (6 services)
  Phase 2: src/components/personal/ (8 components)
           src/services/personalWorkspaceService.ts
           src/contexts/WorkspaceContext.tsx
           scripts/migrations/001_personal_workspace.sql
  Phase 3: src/services/paymentService.ts
           src/services/referralService.ts
           src/services/schoolInvitationService.ts
           functions/src/payments.js (5 Cloud Functions — checkout, webhook w/ HMAC, status, cancel, history)
           src/components/personal/UpgradeModal.tsx (checkout flow)
           src/components/personal/ReferralCard.tsx (referral program)
           src/components/personal/JoinSchoolModal.tsx (school invitation)
           src/components/personal/PersonalAnalytics.tsx (analytics — 6 cards, period filter, grading %)
           scripts/migrations/003_referral_system.sql
           scripts/migrations/004_school_invitations.sql
           scripts/migrations/005_payment_history.sql (payment_history table + RPC)
  Polish:  src/components/marketing/NotFoundPage.tsx (404 page)
           src/components/marketing/TeachersLandingPage.tsx (teacher marketing)
           public/robots.txt, public/sitemap.xml (SEO)
  Tests:   tests/personal-workspace/personal-workspace.spec.ts (20 sections, 110+ tests)
```

---

## 13. Known Flaws & Mitigations

### FLAW #1: "One Teacher Generates All Forms for the School" (CRITICAL)

**Problem:** One teacher pays ₱79/month, enters all 500 students, generates forms for every section.
School avoids paying ₱1,999/month.

**Mitigation (Advisory/Teaching Model):**
```
1. Advisory sections limited to 2 (Pro) or 1 (Free)
   → Can only generate forms (SF9, SF5, SF2, etc.) for advisory sections
   → Teaching sections (ECR grade entry) are unlimited — that's fine

2. All Personal Mode forms print the ACCOUNT HOLDER's name as adviser
   → If Maria generates Jose's class report cards, they show "Class Adviser: MARIA"
   → DepEd won't accept a form with the wrong adviser name
   → Natural deterrent — mirrors real-world practice

3. School-admin forms (SF1, SF6, SF7, SF10) are School Plan only
   → A personal account literally cannot produce school-wide documents
   → This is a genuine data limitation, not artificial gating
```

### FLAW #2: "Free Tier Bypass" (LOW RISK)

**Problem:** Client-side rate limit (localStorage) bypassed by clearing cache or incognito.

**Mitigation:** Accept it. Free tier is a marketing tool, not revenue.
Every freeloader is a potential word-of-mouth referrer.

### FLAW #3: "Garbage Data / Fake Forms" (MEDIUM)

**Problem:** Teacher uploads wrong LRNs or inflated grades → official-looking fake forms.

**Mitigation:**
- LRN format validation (12 digits)
- Grade range validation (60-100 per DepEd Order No. 8)
- Disclaimer footer: "Data provided by the user. Not verified by EduSync or any school."
- Personal forms include: "Generated via EduSync Personal"

### FLAW #4: "No Collaboration / Island Problem" (MEDIUM)

**Problem:** Multiple teachers at the same school on separate personal accounts can't share data.
Student transfers between grades have no continuity. SF10 (cumulative record) impossible.

**Mitigation:** This IS the selling point for School Plans.
- SF10 requires cross-teacher, multi-year data → School Plan only
- SF6 requires all grades across all sections → School Plan only
- "Upgrade to School Plan for centralized records across all teachers"

### FLAW #5: "Price Anchoring Cannibalization" (HIGH)

**Problem:** Admin sees Personal Pro at ₱79/teacher and buys 10 accounts instead of ₱1,999 school plan.

**Mitigation:**
- School Plan has features Personal CANNOT replicate (parent portal, admin dashboard,
  division reporting, centralized enrollment, billing/finance, multi-teacher visibility)
- Separate landing pages: /tools for teachers (shows Personal pricing),
  /landing for school admins (shows Starter/Professional/Enterprise only)
- When 25+ teachers use Personal Pro, School Plan becomes cheaper per-teacher

### FLAW #6: "Missing DepEd Signatures" (LOW)

**Problem:** Forms require Principal and Registrar signatures; personal workspace only has teacher.

**Mitigation:** Leave signature lines blank on printed forms (teacher signs, gets principal to sign manually).
This is what teachers already do with Excel-generated forms.

### FLAW #7: "Data Privacy Liability" (MEDIUM)

**Problem:** Student PII uploaded by individual teacher — RA 10173 (Data Privacy Act) applies.

**Mitigation:**
- Tier 0: Zero liability (data never leaves browser)
- Tier 1-2: Clear ToS — teacher is data controller, EduSync is processor
- Inactive workspaces auto-delete after 12 months
- Export + delete available anytime

---

## 14. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Teachers don't find the tool** | Medium | High | SEO + Facebook teacher groups + content marketing |
| **Free tier is "good enough" — nobody upgrades** | Medium | High | Free tier deliberately limited (50 students, 1 section, watermark). Most teachers have 40-60+ students → hits limit fast |
| **PayMongo integration complexity** | Low | Medium | PayMongo has excellent PH docs + sandbox. Well-documented API. |
| **Personal workspace data used to fake official records** | Low | Medium | Watermark + disclaimer. Schools can verify via their own records. |
| **Cost of free users (Supabase usage)** | Medium | Low | Tier 0 is entirely client-side (zero server cost). Free accounts: 50 students × 1 section = tiny data footprint. Supabase free tier supports 500MB. |
| **Competing tools emerge** | Low | Medium | First-mover advantage in PH EdTech. Deep DepEd compliance knowledge is hard to replicate. |
| **Teachers share Pro accounts** | Medium | Low | One workspace per account. Grades are personal — sharing is self-limiting. |
| **DepEd changes form formats** | Medium | Medium | Templates are versioned. Quick to update CSV format + PDF generator. |

### Cost Analysis (Infrastructure)

```
Tier 0 (Free Tools):
  → Cost to us: $0 (purely client-side, served as static files)
  → Revenue: $0 (but drives signups)

Tier 1 (Free Account):
  → Cost per user: ~$0.001/month (tiny Supabase storage)
  → 10,000 free users = ~$10/month
  → Revenue: $0 (but captures email + drives upgrades)

Tier 2 (Pro):  
  → Cost per user: ~$0.01/month (more storage, more queries)
  → 3,000 pro users = ~$30/month infra cost
  → Revenue: ~$4,140/month (3000 × ₱79 × $0.017/₱)
  → Margin: ~99%

Tier 3 (School):
  → Existing cost model (unchanged)

PayMongo fees:
  → 3.5% + ₱15 per transaction
  → On ₱79/month: ₱2.77 + ₱15 = ₱17.77 (22% fee — acceptable)
  → On ₱199/quarter: ₱6.97 + ₱15 = ₱21.97 (11% fee — better)
  → On ₱399/year: ₱13.97 + ₱15 = ₱28.97 (7.3% fee — best)
  → RECOMMENDATION: Push annual/quarterly. Show quarterly as default.
```

### Payment Fee Optimization

```
Monthly ₱79:    PayMongo takes ₱17.77 → You keep ₱61.24 (78%)  ⚠️ Okay
Quarterly ₱199: PayMongo takes ₱21.97 → You keep ₱177.04 (89%) ✅ Better
Annual ₱399:    PayMongo takes ₱28.97 → You keep ₱370.03 (93%) ✅ Best

REVISED PRICING RECOMMENDATION:
├─ Monthly:   ₱79/month  (absorbs PayMongo fees → you keep ~₱60/mo)
├─ Quarterly: ₱199/quarter (₱66/month equivalent → good balance)  ★ DEFAULT
├─ Annual:    ₱399/year  (₱33/month equivalent → best value)
└─ Show quarterly as default, highlight annual as "Best Value"

SCHOOL PLANS (UNCHANGED):
├─ Starter:      ₱1,999/month (up to 500 students)
├─ Professional: ₱4,999/month (up to 1,500 students)
└─ Enterprise:   Custom pricing (unlimited)
→ These are separate from Personal tiers — different buyer, different budget
```

---

## 15. Decision Matrix

| Question | Decision |
|----------|----------|
| **Build it?** | YES — high potential, low initial cost |
| **Start with?** | Phase 1: Free Form Generator (2-3 weeks, zero infra cost) |
| **School info on forms?** | REQUIRED — school name, ID, division, grade level, section, adviser. Every DepEd form needs it. |
| **Charge for downloads?** | No — free downloads with watermark. Charge for workspace + premium features |
| **Pricing model?** | Freemium: Free (limited) → Personal Pro ₱79/mo or ₱399/yr → School plans unchanged (₱1,999-₱4,999/mo) |
| **Change school pricing?** | NO — keep existing ₱1,999/₱4,999/Custom. Personal tiers are a separate product line. |
| **Per-student billing?** | NO — keep flat tiers. "₱4/student" stays as marketing frame, not billing model. |
| **Section model?** | Advisory (max 2 in Pro, for forms) vs Teaching (unlimited in Pro, for ECR) |
| **Form access?** | Category A (teacher forms) in Personal Mode. Category B (admin forms) School only. Category C (division) Division only. |
| **Payment gateway?** | PayMongo (GCash + Maya + Cards) |
| **Default billing cycle?** | Quarterly ₱199 (shown as default). Annual ₱399 as "Best Value." |
| **Canva model (₱50/day)?** | No — teachers need continuous access. Subscription model. |
| **Personal workspace = virtual school?** | YES — minimal code changes, same data model |
| **Data privacy?** | Tier 0: client-only (zero liability). Tier 1+: standard cloud with RA 10173 compliance |
| **Anti-abuse?** | Advisory cap + account holder name printed on forms = natural deterrent |

---

## 16. Architecture Evaluation Checklist

> Audited: March 23, 2026 — Post-finalization review against real codebase state.

### A. Business Viability

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Is the target market real? | ✅ **YES** | 800K+ PH teachers. Every one files SF forms quarterly by hand/Excel. Pain is documented. |
| 2 | Is the problem painful enough to pay? | ✅ **YES** | Teachers spend 2-5 days per quarter on forms. ₱79/mo is less than a milk tea/day. |
| 3 | Is freemium the right model? | ✅ **YES** | Teachers won't pay to *try* something. Free tool as entry point mirrors Canva, Notion. |
| 4 | Is there a natural upgrade path? | ✅ **YES** | Free (50 students, 1 section) → Pro (unlimited) → School (institutional). Each tier has real limits. |
| 5 | Does school pricing math self-sell? | ✅ **YES** | 25 teachers × ₱79 = ₱1,975 ≈ Starter at ₱1,999. No sales team needed. |
| 6 | Is there a competitor doing this? | ✅ **NO** (BLUE OCEAN) | No PH-specific tool offers individual teacher SIS + form generation. Excel is the real competitor. |
| 7 | Is the ₱79 price sustainable? | ⚠️ **TIGHT** | PayMongo takes ₱17.77 (22%) on monthly. Quarterly (₱199) or annual (₱399) fixes this. Push quarterly default. |

**Business Score: 6.5 / 7** — Strong. Quarterly default is a must-fix for margin health.

---

### B. Technical Soundness

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | "Virtual school" pattern avoids major refactor? | ✅ **YES** | All queries use `school_id` FK. Personal workspace = school record with `type: 'personal'`. Zero existing query changes. |
| 2 | Client-side Tier 0 = zero server cost? | ✅ **YES** | CSV → PDF entirely in browser. No fetch(), no backend. Can scale to millions for free. |
| 3 | Existing PDF generators are reusable? | ✅ **YES** | `sf5Generator.ts`, `PrintableReport.tsx`, etc. exist. Refactoring to accept raw data input is feasible. |
| 4 | Auth model is correct? | ✅ **FIXED** | Auth reads from PostgreSQL via `get_user_by_firebase_uid()` RPC. Added `workspace_type` and `tier` columns to `teachers` table. No Firebase custom claims needed. |
| 5 | RLS policies are sound? | ✅ **YES** | `owner_uid = auth.uid()` for personal workspaces. Institutional RLS unchanged. Clean separation. |
| 6 | New tables (subscriptions, usage_tracking) are minimal? | ✅ **YES** | 2 new tables, 3 new columns on existing `schools` table. Clean schema extension. |
| 7 | PWA/Offline listed as Pro feature — is it built? | ⚠️ **PARTIALLY** | Service worker exists (`sw.js`) but registration is commented out. No `manifest.json`. Enabling is small work but it's NOT "already built." Should be flagged as new work. |
| 8 | Route additions conflict with existing routes? | ✅ **NO** | `/tools/*` and `/personal/*` don't collide with existing `/dashboard`, `/students`, etc. |
| 9 | WorkspaceContext wrapping SchoolContext is feasible? | ✅ **YES** | SchoolContext has `schoolId`, `schoolIds`, `role`. Wrapping with tier/limits/isPersonal is clean. |

**Technical Score: 8 / 9** — Solid. Auth model fixed. One item remaining (PWA status).

---

### C. Practicality & Feasibility

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Phase 1 (Free Form Generator) is independently valuable? | ✅ **YES** | Even if nothing else ships, `/tools/form-generator` standalone has marketing value. |
| 2 | Phase 1 can ship in 2-3 weeks? | ⚠️ **AMBITIOUS** | 5 form generators (SF5, SF9, SF2, SF5-K, ELLN) + CSV parser + Excel support + UI + watermark + rate limiting. Realistic: 3-4 weeks. Suggest shipping SF5 + SF9 first, others follow. |
| 3 | Each phase is independently deployable? | ✅ **YES** | Phase 1 has zero backend. Phase 2 adds DB. Phase 3 adds payments. No circular dependencies. |
| 4 | 10-week total timeline is realistic? | ⚠️ **OPTIMISTIC** | For a solo developer, 12-14 weeks is more realistic with testing & polish. Plan doesn't include QA time. |
| 5 | Existing code can be refactored without breaking school features? | ✅ **YES** | New routes + new context wrapper + optional type column. Existing school flow is untouched. |
| 6 | PayMongo integration complexity is manageable? | ✅ **YES** | Well-documented API, sandbox available, popular in PH startups. Standard webhook model. |
| 7 | School migration flow (personal → school) is feasible? | ⚠️ **COMPLEX** | Plan shows nice UI mockup but migration logic (reassigning students, sections, grades to institutional school) is non-trivial. Needs detailed data migration plan. |

**Practicality Score: 5 / 7** — Feasible but timeline is optimistic. Ship Phase 1 with fewer forms first.

---

### D. Cost Efficiency

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Phase 1 costs us $0 to run? | ✅ **YES** | Static files served from existing Firebase Hosting. No new infra. |
| 2 | Free accounts have negligible cost? | ✅ **YES** | 50 students × 1 section = ~2KB data. 10K users = ~20MB. Supabase free tier handles this. |
| 3 | Pro revenue exceeds infra cost? | ✅ **YES** | $0.01/user/month cost vs ~$1.06 revenue per user (₱61. net). 99%+ margin. |
| 4 | Payment fees are optimized? | ✅ **YES** | Quarterly default (11% fee) over monthly (22% fee) is correct. Annual option (7.3%) for power users. |
| 5 | No new expensive services required? | ✅ **YES** | Supabase (existing), Firebase Auth (existing), PayMongo (new but pay-per-use). No fixed costs added. |

**Cost Score: 5 / 5** — Excellent. Near-zero marginal cost of growth.

---

### E. User Experience

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Zero-friction entry (Tier 0)? | ✅ **YES** | No login, no signup. Upload CSV → get PDF. 60-second value delivery. |
| 2 | Clear upgrade path with visible value? | ✅ **YES** | Watermark (free) → no watermark (account). 50 students → unlimited (Pro). Each upgrade solves a visible pain. |
| 3 | Mobile-friendly? | ✅ **YES** | Existing app is fully responsive (Tailwind mobile-first). New pages will follow same pattern. |
| 4 | Filipino teacher context considered? | ✅ **YES** | GCash as primary payment. Facebook as primary channel. Pricing in ₱ with local comparisons. |
| 5 | Template downloads reduce friction? | ✅ **YES** | Teacher gets pre-formatted CSV/Excel template → fills in familiar tool → uploads back. Minimal learning curve. |
| 6 | Signup flow collects too much info? | ⚠️ **BORDERLINE** | 9 fields on signup (name, email, password, school name, school ID, division, region, district, grade, section). Consider: collect just name/email/password first, ask school info in onboarding wizard. |
| 7 | Error handling for bad CSV data? | ✅ **PLANNED** | LRN validation (12 digits), grade range (60-100), missing field highlighting. Good UX patterns described. |

**UX Score: 6 / 7** — Strong. Signup form length is the one concern.

---

### F. Security & Privacy

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tier 0 data never touches server? | ✅ **YES** | All processing client-side. We literally can't leak what we never receive. |
| 2 | Personal workspace data isolated from school data? | ✅ **YES** | `schools.type = 'personal'` + RLS. Division/admin views filter out personal workspaces. |
| 3 | RA 10173 (Data Privacy Act) addressed? | ✅ **YES** | Teacher = data controller, EduSync = processor. Clear ToS. Export/delete available. |
| 4 | Payment data not stored? | ✅ **YES** | PayMongo handles all sensitive payment info. We only store subscription status. |
| 5 | Fake form generation addressed? | ✅ **YES** | Disclaimer footer + "Generated via EduSync Personal" + watermark on free tier. |
| 6 | Multi-tenant isolation preserved? | ✅ **YES** | Virtual personal school IS a school record with its own `school_id`. Existing RLS applies. |

**Security Score: 6 / 6** — Excellent. No gaps.

---

### G. Scalability

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tier 0 scales infinitely? | ✅ **YES** | Static files + client-side processing. CDN handles the load. |
| 2 | Database scales with users? | ✅ **YES** | Supabase/Postgres. Personal workspace = small data. Indexes on `owner_uid`, `type`, `user_id`. |
| 3 | Code architecture supports growth? | ✅ **YES** | New routes don't touch old ones. WorkspaceContext is a clean extension. |
| 4 | From 1 to 100K users without architecture change? | ✅ **YES** | Supabase handles this. PayMongo handles this. Firebase Auth handles this. |

**Scalability Score: 4 / 4** — No bottlenecks identified.

---

### H. DepEd Compliance & Accuracy

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Official SF form naming used? | ✅ **YES** | SF9 (not Form 138), SF10 (not Form 137). Updated throughout document. |
| 2 | All 10 SF forms accounted for? | ✅ **YES** | SF1-SF10 all categorized (A/B/C) with correct descriptions and scope. |
| 3 | Form categories match real DepEd practice? | ✅ **YES** | Advisory vs Teaching model mirrors actual DepEd roles (adviser = forms, subject teacher = ECR). |
| 4 | Grade range validation follows policy? | ✅ **YES** | 60-100 per DepEd Order No. 8, s. 2015. |
| 5 | LRN format validated? | ✅ **YES** | 12-digit format check. |
| 6 | School info required on all forms? | ✅ **YES** | School name, ID, division, grade level, section, adviser. All marked required. |

**DepEd Score: 6 / 6** — Fully compliant.

---

### I. Revenue & Conversion Model

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Conversion funnel is clear? | ✅ **YES** | SEO → Free Tool → Account → Pro → School. Each step has a clear trigger. |
| 2 | Free tier limits drive upgrades? | ✅ **YES** | 50 students (most classes = 40-60), 1 section, watermark. Hit limits fast. |
| 3 | Conservative revenue projections are believable? | ✅ **YES** | 500 Pro users × ₱79 = ₱39K/mo is modest. If the tool reaches even 1% of 800K teachers, it's 8,000 users. |
| 4 | School upgrade pressure is natural? | ✅ **YES** | 25 teachers × ₱79 ≥ ₱1,999 Starter. Math does the selling. |
| 5 | Referral system prevents abuse? | ✅ **YES** | Max 6 free months/year cap. Referred gets discount, not free. |

**Revenue Score: 5 / 5** — Well-designed funnel.

---

### J. Anti-Abuse & Flaw Coverage

| # | Criteria | Verdict | Notes |
|---|----------|---------|-------|
| 1 | One-teacher-generates-all addressed? | ✅ **YES** | Advisory cap (max 2) + account holder name on forms. Natural deterrent. |
| 2 | Free tier bypass addressed? | ✅ **YES** | Accepted as marketing cost. Free users = word-of-mouth. Correct tradeoff. |
| 3 | Fake data/forms addressed? | ✅ **YES** | Validation + disclaimer footer. Can't prevent 100% but liability is clear. |
| 4 | Collaboration gap addressed? | ✅ **YES** | This IS the school plan selling point. SF10, SF6 = school-only by design. |
| 5 | Price cannibalization addressed? | ✅ **YES** | Separate landing pages. School Plan has features Personal CANNOT replicate. |
| 6 | Missing signatures addressed? | ✅ **YES** | Blank signature lines = same as Excel-generated forms today. |
| 7 | Data privacy liability addressed? | ✅ **YES** | Tier 0 = zero liability. Tier 1+ = clear ToS + RA 10173 compliance + auto-delete. |

**Anti-Abuse Score: 7 / 7** — All 7 flaws have realistic mitigations.

---

### OVERALL SCORECARD

| Category | Score | Max | % |
|----------|-------|-----|---|
| A. Business Viability | 6.5 | 7 | 93% |
| B. Technical Soundness | 8 | 9 | 89% |
| C. Practicality | 5 | 7 | 71% |
| D. Cost Efficiency | 5 | 5 | 100% |
| E. User Experience | 6 | 7 | 86% |
| F. Security & Privacy | 6 | 6 | 100% |
| G. Scalability | 4 | 4 | 100% |
| H. DepEd Compliance | 6 | 6 | 100% |
| I. Revenue Model | 5 | 5 | 100% |
| J. Anti-Abuse | 7 | 7 | 100% |
| **TOTAL** | **58.5** | **63** | **93%** |

**Overall Verdict: STRONG — Ready to build. 1 critical issue fixed (auth model). Remaining items are medium/low severity.**

---

### ISSUES FOUND (Updated March 24, 2026)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | **Auth model ~~is wrong~~ FIXED.** Auth reads from PostgreSQL, not Firebase custom claims. Added `workspace_type` + `tier` columns to `teachers` table. Custom claims references removed from architecture diagram and `createPersonalWorkspace()`. | ✅ FIXED | Implemented in `personalWorkspaceService.ts` + `001_personal_workspace.sql` |
| 2 | **PWA/Offline is listed as Pro feature but isn't built.** Service worker exists but registration is commented out. No manifest.json. | 🟡 MEDIUM | Unchanged — PWA enablement is deferred to post-Phase 3. Not blocking. |
| 3 | **10-week timeline is optimistic for solo dev.** No QA time budgeted. 5 form generators in Week 1-2 is aggressive. | ✅ RESOLVED | Phase 1 completed with all 3 generators (SF5/SF9/SF2). Timeline was accurate for Phase 1. Phase 2 largely done. Revised to 12-14 weeks total. |
| 4 | **Signup form has 9+ fields.** May cause drop-off. | ✅ RESOLVED | Implemented 2-step wizard: Step 1 (Account: name/email/password) → Step 2 (School/Class info). See `PersonalSignupScreen.tsx`. |
| 5 | **School migration flow (personal → school) is under-specified.** UI mockup exists but data migration logic has no detail. | 🟡 MEDIUM | Unchanged — Phase 3 item. Flagged for detailed data migration plan before implementation. |
| 6 | **Free tier 50-student limit may not trigger upgrades.** Many PH classrooms have 40-55 students. | 🟢 LOW | Unchanged — Monitor in analytics post-launch. Section limit (1) is the primary driver. |
| 7 | **`landingPageConfig.ts` has stale pricing.** | 🟢 LOW | Technical debt — not blocking Personal Mode. |

---

### WHAT'S GENUINELY EXCELLENT

1. **"Virtual Personal School" pattern** — Brilliant. One new column (`type: 'personal'`) unlocks the entire feature without touching existing queries. Minimal engineering for maximum impact.

2. **Client-side Tier 0 at $0 cost** — Can scale to 1M teachers with zero infrastructure spend. The marketing ROI is infinite.

3. **Advisory vs Teaching section model** — Perfectly mirrors real DepEd practice. Not an artificial gate — it's how Filipino schools actually work. Teachers will understand it intuitively.

4. **Natural anti-abuse** — Account holder name printed on forms is elegant. DepEd won't accept a report card signed by the wrong adviser. No technical enforcement needed — the real world enforces it.

5. **School upgrade math** — 25 × ₱79 ≈ ₱1,999 creates a natural tipping point. The admin doesn't need convincing — the math speaks.

6. **Category A/B/C form classification** — Well-researched, accurate, and creates genuine (not artificial) differentiation between tiers.

7. **Phase 1 independence** — Even if Phase 2 and 3 never ship, the free form generator has standalone value as a marketing tool and brand builder.

---

*This document is the single source of truth for the Personal Mode feature. Update it as decisions change.*

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| March 23, 2026 | Initial plan created (Status: Planning) | Mark Gil Dotillos |
| March 24, 2026 | Updated to reflect implementation progress. Phase 1 ✅ complete (17/18 items, pending deploy). Phase 2 ~90% (10/14 items done, gradebook + auto-filled forms + deploy remaining). Phase 3 not started. Resolved issues #3 (timeline) and #4 (signup wizard). Updated §12 roadmap with file paths and test results (64/65 E2E passing). | Mark Gil Dotillos |
| March 24, 2026 | Phase 2 → ~95%. Implemented PersonalGradebook (students × subjects × Q1–Q4 grid, debounced save, auto final grade calc, stats bar). Implemented PersonalForms auto-fill (SF5/SF9/SF2 from Supabase data). Build verified clean. E2E tests updated. Only upgrade prompts + deploy remain. | Mark Gil Dotillos |
