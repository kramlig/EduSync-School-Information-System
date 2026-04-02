# EduSync SIS — Project Status Report

> **Date:** March 30, 2026  
> **Author:** Auto-generated from full codebase audit  
> **Purpose:** Living reference document — check back to track progress toward go-live

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature Inventory](#3-feature-inventory)
4. [Product Modes & Routes](#4-product-modes--routes)
5. [Database State](#5-database-state)
6. [Deployment & Infrastructure](#6-deployment--infrastructure)
7. [Monetization System](#7-monetization-system)
8. [Build Health](#8-build-health)
9. [Testing Coverage](#9-testing-coverage)
10. [Go-Live Blockers & Action Items](#10-go-live-blockers--action-items)
11. [Go-Live Strategy](#11-go-live-strategy)
12. [Progress Tracker](#12-progress-tracker)

---

## 1. Executive Summary

EduSync is a **full-featured School Information System** targeting Filipino K-12 schools and individual teachers. As of March 30, 2026, the platform has **3 product modes** (Personal, Institutional, Division), a **complete DepEd forms suite** (SF1-SF10 + SHS variants + ELLN), a **fully migrated PostgreSQL backend** (Supabase), and a **code-complete monetization system** (PayMongo).

**Overall Readiness: ~85% code-complete, ~60% production-ready.**

The gap is not features — it's activation: PayMongo keys, production deployment workflow, and user acquisition.

---

## 2. Architecture Overview

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Vite + React 18 + TypeScript + Tailwind CSS | SPA with code-splitting via lazy imports |
| **Database** | Supabase (PostgreSQL) | Full migration from Firestore complete |
| **Auth** | Firebase Auth (login only) | Hybrid: Firebase UID links to Supabase `users`/`teachers` tables |
| **Cloud Functions** | Firebase Functions (Node.js) | AI (Gemini), Payments (PayMongo), User management |
| **Payments** | PayMongo (code-complete, keys needed) | GCash, Maya, Cards, OTC |
| **AI** | Google Gemini 2.5 Flash | Lesson plan generator, student report generator |
| **Hosting** | Firebase Hosting | Staging: `edusync-sis-staging.web.app` / Prod: `edusync.ph` |
| **PWA** | Workbox via VitePWA | Offline-first, installable, auto-update |

### Data Flow

```
User → Firebase Auth (login) → get_user_by_firebase_uid RPC (PostgreSQL)
  → Determines role + workspace type
    ├── personal workspace → /personal/* routes
    ├── institutional      → /dashboard/* routes  
    ├── division           → /division/* routes
    └── student/parent     → /student or /parent dashboard
```

### Key Architectural Decisions

- **Personal workspace = virtual school record** in `schools` table with `type='personal'`
- **All queries use `school_id` for multi-tenant isolation** via PostgreSQL RLS
- **No Firestore for data** — all 28+ hooks use PostgreSQL (`use*PostgreSQL.ts`)
- **Form generator (Tier 0) is fully client-side** — no data leaves the browser
- **Code-splitting** — 80+ lazy-loaded components via `lazyWithRetry()`

---

## 3. Feature Inventory

### Core Modules (All PostgreSQL-backed)

| Module | Status | Key Files |
|--------|--------|-----------|
| **Student Management** | ✅ Complete | `useStudentsPostgreSQL.ts`, `StudentList.tsx` |
| **Teacher Management** | ✅ Complete | `useTeachersPostgreSQL.ts`, `TeachersViewPostgreSQL.tsx` |
| **Section Management** | ✅ Complete | `useSectionsPostgreSQL.ts`, `SectionsViewOptimized.tsx` |
| **Parent Management** | ✅ Complete | `useParentsPostgreSQL.ts`, `ParentsViewPostgreSQL.tsx` |
| **Teaching Assignments** | ✅ Complete | `useTeachingAssignments.ts`, `AssignmentsView.tsx` |
| **Grades (Academic)** | ✅ Complete | `useGradesPostgreSQL.ts`, `GradebookView.tsx`, `GradebookViewPostgreSQL.tsx` |
| **Core Values** | ✅ Complete | `useCoreValuesPostgreSQL.ts`, `CoreValuesGradebookView.tsx` |
| **Homeroom Guidance** | ✅ Complete | `useHomeroomGuidancePostgreSQL.ts`, `HomeroomGuidanceView.tsx` |
| **Attendance** | ✅ Complete | `useAttendancePostgreSQL.ts`, `AttendanceView.tsx` |
| **Scheduler** | ✅ Complete | `useSchedulePostgreSQL.ts`, `SchedulerView.tsx` |
| **Substitute Management** | ✅ Complete | `useSubstituteAssignmentsPostgreSQL.ts`, `SubstituteView.tsx` |
| **Lesson Plans** | ✅ Complete | `useLessonPlansPostgreSQL.ts`, `LessonPlanView.tsx` |
| **Announcements** | ✅ Complete | `useAnnouncementsPostgreSQL.ts`, `AnnouncementsView.tsx` |
| **Learning Areas** | ✅ Complete | `useLearningAreasPostgreSQL.ts`, `learningAreasServicePostgreSQL.ts` |
| **School Settings** | ✅ Complete | `useSchoolSettingsPostgreSQL.ts`, `SchoolSettingsPostgreSQL.tsx` |
| **Student Health** | ✅ Complete | `useStudentHealthPostgreSQL.ts` |
| **ELLN Assessment** | ✅ Complete | `useELLNPostgreSQL.ts`, `ELLNDashboard.tsx`, `ELLNAssessment.tsx` |
| **Electronic Class Record** | ✅ Complete | `useECR.ts`, `ClassRecordView.tsx`, `ClassRecordSelector.tsx` |
| **Enrollment Applications** | ✅ Complete | `useEnrollmentApplicationsPostgreSQL.ts`, portal + admin review |
| **School Profile** | ✅ Complete | `useSchoolProfilePostgreSQL.ts` |

### DepEd Forms (Complete Suite)

| Form | Route | Component | Target |
|------|-------|-----------|--------|
| **SF1** (School Register) | `/reports/school-forms/sf1` | `SF1Dashboard.tsx` | Elementary |
| **SF2** (Daily Attendance) | `/reports/school-forms/sf2` | `SF2Dashboard.tsx` | Elementary |
| **SF3** (Books Issued) | `/reports/sf3` | `SF3Dashboard.tsx` | Elementary |
| **SF4** (Monthly Learner Movement) | `/reports/sf4` | `SF4Dashboard.tsx` | Elementary |
| **SF5** (Report on Promotion) | `/reports/sf5` | `SF5Dashboard.tsx` | Elementary |
| **SF5-K** (Kindergarten) | `/reports/sf5k` | `SF5KDashboard.tsx` | Kindergarten |
| **SF6** (Summarized Promotion) | `/reports/sf6` | `SF6Dashboard.tsx` | Elementary |
| **SF7** (School Personnel) | `/reports/sf7` | `SF7Dashboard.tsx` | Elementary |
| **SF8** (Learner Basic Health) | `/reports/school-forms/sf8` | `SF8Dashboard.tsx` | Elementary |
| **SF9** (Report Card) | `/reports/school-forms/sf9` | `SF9Dashboard.tsx` + `SF9View.tsx` + `SF9Print.tsx` | Elementary |
| **SF10** (Permanent Record) | `/reports/school-forms/sf10` | `SF10Dashboard.tsx` | Elementary |
| **SF1-SHS** | `/reports/school-forms/sf1-shs` | `SF1SHSDashboard.tsx` | Senior High |
| **SF2-SHS** | `/reports/school-forms/sf2-shs` | `SF2SHSDashboard.tsx` | Senior High |
| **SF5A-SHS** | `/reports/school-forms/sf5a-shs` | `SF5ASHSDashboard.tsx` | Senior High |
| **SF5B-SHS** | `/reports/school-forms/sf5b-shs` | `SF5BSHSDashboard.tsx` | Senior High |
| **SF9-SHS** | `/reports/school-forms/sf9-shs` | `SF9SHSDashboard.tsx` | Senior High |
| **ELLN** (Early Literacy) | `/reports/elln/*` | `ELLNDashboard.tsx` + Assessment + Results + Reports + ILMP | K-3 |

> **Legacy naming:** `Form137Dashboard` = SF10, `Form138Dashboard` = SF9. Both legacy and SF routes coexist in the codebase.

### Management Tools

| Tool | Route | Component |
|------|-------|-----------|
| **Textbook Ledger** | `/management/textbook-ledger` | `TextbookManagementDashboard.tsx` |
| **Facilities Inventory** | `/management/facilities-inventory` | `FacilitiesManagementDashboard.tsx` |

### Financial System

| Feature | Status | Key Files |
|---------|--------|-----------|
| Fee Structure Management | ✅ Complete | `useFeeStructuresPostgreSQL.ts`, `FeeStructureManager.tsx` |
| Payment Recording | ✅ Complete | `PaymentRecording.tsx` |
| Receipt Generation (BIR-compliant) | ✅ Complete | `receiptPDFGenerator.ts`, `ReceiptManagement.tsx` |
| Student Ledgers | ✅ Complete | `useStudentLedgersPostgreSQL.ts` |
| Financial Reports | ✅ Complete | `FinancialReports.tsx` |
| Billing Statements | ⚠️ Has type errors | `billingServicePostgreSQL.ts` (2 type mismatches) |

### AI Features

| Feature | Backend | Status |
|---------|---------|--------|
| Lesson Plan Generator | Firebase Function → Gemini 2.5 Flash | ✅ Deployed |
| Student Report Generator | Firebase Function → Gemini 2.5 Flash | ✅ Deployed |

### Import/Export

| Feature | Key Files |
|---------|-----------|
| SF1 Import (CSV→Students) | `sf1ImportService.ts`, `sf1Parser.ts`, `SchoolSF1Import.tsx` |
| SF5 Import | `sf5ImportService.ts`, `sf5Parser.ts` |
| SF7 Import (Personnel) | `sf7ImportService.ts`, `sf7Parser.ts`, `sf7PersonnelService.ts` |
| Simple CSV Import | `SimpleCSVImport.tsx` |
| Excel/CSV Export | `xlsx`, `papaparse` dependencies |
| LIS Export | `lisExportService.ts` |

---

## 4. Product Modes & Routes

### Mode 1: Public (No Auth Required)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `LandingPageV2` | Main marketing landing page |
| `/teachers` | `TeachersLandingPage` | Personal workspace marketing page |
| `/tools/form-generator` | `FormGeneratorPage` | Free SF form generator (CSV→PDF, client-side) |
| `/enrollment` | `EnrollmentPortal` | Public enrollment portal |
| `/enrollment/apply` | `ApplicationForm` | Enrollment application form |
| `/enrollment/status` | `ApplicationStatus` | Check application status |
| `/register/parent` | `ParentRegistration` | Parent self-registration |
| `/personal/signup` | `PersonalSignupScreen` | Personal workspace signup (email + Google) |
| `/privacy` | `PrivacyPolicy` | Privacy policy page |
| `/terms` | `TermsOfService` | Terms of service page |

### Mode 2: Personal Workspace (`/personal/*`)

**Target:** Individual teachers. Free tier (50 students, 1 section) or Pro (₱79/mo, unlimited).

| Route | Component | Feature |
|-------|-----------|---------|
| `/personal` | `PersonalDashboard` | Overview dashboard |
| `/personal/sections` | `PersonalSections` | Section management |
| `/personal/students` | `PersonalStudentListWrapper` | Student list |
| `/personal/grades` | `PersonalGradebook` | Quick gradebook |
| `/personal/grades/quick` | `PersonalClassRecordSelector` | ECR selector |
| `/personal/class-record/:sectionId/:learningAreaId` | `PersonalClassRecordView` | Electronic Class Record |
| `/personal/forms` | `PersonalForms` | DepEd form generator |
| `/personal/settings` | `PersonalSettings` | Settings + Referral + Upgrade |
| `/personal/analytics` | `PersonalAnalytics` | Grade analytics |
| `/personal/attendance` | `PersonalAttendance` | Attendance tracking |
| `/personal/core-values` | `PersonalCoreValues` | Core values grading |
| `/personal/homeroom-guidance` | `PersonalHomeroomGuidance` | Homeroom guidance |

**Supporting Features:**
- `JoinSchoolModal.tsx` — Accept school invitation, migrate data
- `UpgradeModal.tsx` — Free→Pro upgrade with PayMongo checkout
- `ReferralCard.tsx` — Referral code + stats widget

### Mode 3: Institutional School (`/dashboard/*`)

**Target:** Schools with admin, multiple teachers, full SIS.

| Route | Component |
|-------|-----------|
| `/dashboard` | `Dashboard` |
| `/students` | `StudentList` |
| `/teachers` | `TeachersViewPostgreSQL` or `TeacherList` |
| `/parents` | `ParentsViewPostgreSQL` |
| `/sections` | `SectionsViewOptimized` |
| `/grades` | `GradesDashboard` |
| `/grades/academic` | `GradebookView` |
| `/grades/class-record-selector` | `ClassRecordSelector` |
| `/grades/class-record/:sectionId/:learningAreaId` | `ClassRecordView` |
| `/grades/core-values` | `CoreValuesGradebookView` |
| `/grades/homeroom-guidance` | `HomeroomGuidanceView` |
| `/grades/overview` | `GradesSummary` |
| `/grades/analytics` | `UnifiedAssessmentView` |
| `/scheduler` | `SchedulerView` |
| `/substitute` | `SubstituteView` |
| `/assignments` | `AssignmentsView` |
| `/lesson-plans` | `LessonPlanView` |
| `/announcements` | `AnnouncementsView` |
| `/settings` | `SchoolSettingsPostgreSQL` |
| `/reports/form137` | `Form137Dashboard` (SF10) |
| `/reports/form138` | `Form138Dashboard` (SF9) |
| `/reports/school-forms` | `SchoolFormsDashboard` |
| `/reports/school-forms/sf1` through `/sf10` | All SF dashboards |
| `/reports/elln/*` | ELLN suite (4 pages) |
| `/reports/sf3` through `/sf7` | DepEd operational forms |
| `/management/textbook-ledger` | `TextbookManagementDashboard` |
| `/management/facilities-inventory` | `FacilitiesManagementDashboard` |
| `/billing/*` | Fee structures, payments, receipts, reports |
| `/enrollment/admin` | `AdminEnrollmentDashboard` |
| `/users` | `UserManagementPanelV2` (admin) |
| `/courses` | `CourseList` (SHS) |
| `/validation-results` | `ValidationResultsDashboard` |

### Mode 4: Division Level (`/division/*`)

**Target:** Division offices overseeing multiple schools.

| Route | Component |
|-------|-----------|
| `/division` | `DivisionDashboard` |
| `/division/schools` | `DivisionSchools` |
| `/division/personnel` | `DivisionPersonnel` |
| `/division/enrollment` | `DivisionEnrollment` |
| `/division/reports` | `DivisionReports` |
| `/division/reports/sf5` | `DivisionSF5Dashboard` |
| `/division/reports/sf6` | `DivisionSF6Dashboard` |
| `/division/reports/sf7` | `DivisionSF7Dashboard` |
| `/division/reports/proficiency` | `DivisionProficiencyDashboard` |
| `/division/sf1-import` | `DivisionSF1Import` |
| `/division/sf5-import` | `DivisionSF5Import` |
| `/division/sf7-import` | `DivisionSF7Import` |
| `/division/users` | `DivisionUserManagement` |
| `/division/audit-log` | `DivisionAuditLog` |
| `/division/settings` | `DivisionSettingsEnhanced` |
| `/division/onboarding` | `DivisionOnboarding` |

### Mode 5: Student & Parent Portals

| Route | Component |
|-------|-----------|
| Student dashboard | `StudentDashboard` |
| Parent dashboard | `ParentDashboard` |
| Parent profile | `ParentProfile` |
| Parent billing | `ParentBilling` |

### Super Admin

| Route | Component |
|-------|-----------|
| `/super-admin` | `SuperAdminLayout` with tabs: Schools, Divisions, Global Users |

---

## 5. Database State

### Backend: Supabase PostgreSQL (Fully Migrated)

**Supabase Project:** `zjuxulhxxeeupcskkcok.supabase.co`

### Core Tables

| Table | Multi-tenant | Key Columns |
|-------|-------------|-------------|
| `schools` | Root | `id`, `name`, `school_id_number`, `type` ('personal'/'institutional'), `owner_uid`, `tier` |
| `users` | FK `school_id` | `id`, `firebase_uid`, `email`, `role`, `school_id` |
| `teachers` | FK `school_id` | `id`, `firebase_uid`, `email`, `name`, `role`, `workspace_type`, `tier` |
| `students` | FK `school_id` | `id`, `lrn`, `name`, `section_id`, `grade_level`, `enrollment_status` |
| `parents` | FK `school_id` | `id`, `user_id`, `student_ids` |
| `sections` | FK `school_id` | `id`, `name`, `grade_level`, `school_year`, `adviser_id` |
| `learning_areas` | FK `school_id` | `id`, `code`, `name`, `grade_levels[]`, `is_composite` |
| `grades` | FK `school_id` | `id`, `student_id`, `learning_area_id`, `q1`-`q4`, `final_grade`, `composite_grades` |
| `teaching_assignments` | FK `school_id` | `teacher_id`, `section_id`, `subject`, `is_advisory` |
| `attendance_records` | FK `school_id` | `student_id`, `date`, `status`, `recorded_by` |
| `subscriptions` | FK `user_id` | `tier`, `status`, `max_students`, `billing_cycle`, `amount_cents` |

### SQL Migrations Applied

| # | File | Purpose |
|---|------|---------|
| 001 | `001_personal_workspace.sql` | Personal workspace RPC, schools.type, teachers.workspace_type |
| 003 | `003_referral_system.sql` | Referral codes, tracking, credits |
| 004 | `004_school_invitations.sql` | School invitation codes, accept flow |
| 005 | `005_payment_history.sql` | Payment history for PayMongo |
| 006 | `006_personal_ecr_support.sql` | ECR support for personal workspaces |
| 007 | `007_fix_ecr_rls_personal.sql` | RLS fix for personal ECR access |

### Key RPC Functions

- `get_user_by_firebase_uid` — Role resolution across all user types
- `create_personal_workspace` — Atomic creation of school + teacher + section + subscription

---

## 6. Deployment & Infrastructure

### Environments

| Environment | Firebase Project | URL | Build Command |
|-------------|-----------------|-----|---------------|
| **Production** | `edusync-sis` | `edusync.ph` (DNS configured) | `npm run build:prod` |
| **Staging** | `edusync-staging` | `edusync-sis-staging.web.app` | `npm run build:uat` |
| **Emulator** | `edusync-local` | `localhost:5173` | `npm run dev:emu` |

### CI/CD

| Workflow | File | Trigger | Status |
|----------|------|---------|--------|
| Deploy to Staging | `.github/workflows/deploy-staging.yml` | Push to `main` + manual | ✅ Configured |
| Deploy to Production | — | — | ❌ **Not yet created** |
| Firestore Rules Tests | `.github/workflows/firestore-rules-tests.yml` | — | ✅ Configured |
| Firestore Rules Deploy | `.github/workflows/firestore-rules.yml` | — | ✅ Configured |

### Firebase Functions (Deployed)

| Function | Purpose | Trigger |
|----------|---------|---------|
| `generateLessonPlan` | AI lesson plan via Gemini | HTTP POST |
| `generateStudentReport` | AI student narrative via Gemini | HTTP POST |
| `createPayMongoCheckout` | Create payment checkout session | Callable |
| `paymongoWebhook` | Handle PayMongo webhook events | HTTP POST |
| `getSubscriptionStatus` | Get user's subscription | Callable |
| `cancelSubscription` | Cancel subscription | Callable |
| `getBillingHistory` | Get payment history | Callable |
| `expireOverdueSubscriptions` | Cron: expire past-due subs | Pub/Sub scheduled |
| `createUserAccount` | Admin user creation | Callable |
| `syncPostgresToAuth` | Sync PostgreSQL users to Firebase Auth | Callable |
| `trialSignup` | Handle trial signups from landing page | Callable |

### PWA Configuration

- **Display:** Standalone (app-like)
- **Theme:** `#4f46e5` (Indigo)
- **Icons:** `pwa-192x192.png`, `pwa-512x512.png`
- **Service Worker:** autoUpdate, Workbox caching
- **Caching:** Network-first for API, Cache-first for static assets
- **Offline:** Full offline support with data sync on reconnect

---

## 7. Monetization System

### Pricing Tiers

| Tier | Price | Target | Limits |
|------|-------|--------|--------|
| **Tier 0: Free Tools** | Free, no account | Anyone | 3 downloads/day, watermarked |
| **Tier 1: Free Account** | Free with signup | Individual teachers | 50 students, 1 section, 10 downloads/day |
| **Tier 2: Personal Pro** | ₱79/mo or ₱399/yr | Power teachers | Unlimited students/sections/downloads |
| **Tier 3: School Starter** | ₱1,999/mo | Schools ≤500 students | All teachers included |
| **Tier 3: School Professional** | ₱4,999/mo | Schools ≤1,500 students | AI + priority support |
| **Tier 3: Enterprise** | Custom | Large schools | Unlimited |

### Payment Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| PayMongo Cloud Functions | ✅ Code-complete | `functions/src/payments.js` — checkout, webhook, subscription management |
| Client Payment Service | ✅ Code-complete | `src/services/paymentService.ts` — checkout redirect, status, cancel, history |
| Upgrade Modal UI | ✅ Code-complete | `src/components/personal/UpgradeModal.tsx` |
| Subscription Tracking | ✅ Code-complete | `subscriptions` table + `getUserSubscription()` |
| Tier Enforcement | ✅ Code-complete | Limits checked in Personal Workspace components |
| Referral System | ✅ Code-complete | `src/services/referralService.ts` + `ReferralCard.tsx` |
| School Invitation Bridge | ✅ Code-complete | `schoolInvitationService.ts` + `JoinSchoolModal.tsx` |
| **PayMongo API Keys** | ❌ **Not configured** | Need `PAYMONGO_SECRET_KEY` + `PAYMONGO_WEBHOOK_SECRET` in `functions/.env` |
| Webhook Endpoint | ❌ **Not registered** | Need to register URL in PayMongo dashboard after function deploy |

### User Funnel (Built)

```
/tools/form-generator (free, no signup, client-side)
  → CTA: "Save your school info"
    → /personal/signup (email or Google, 30 seconds)
      → /personal (workspace — free tier)
        → UpgradeModal when hitting limits
          → PayMongo checkout (GCash/Maya/Card)
            → Pro tier activated via webhook
```

### Referral System

- Each user gets unique code (e.g., `MARIA-X4K2`)
- Shared via `/personal/signup?ref=MARIA-X4K2`
- Max 6 free months per year per referrer
- Stats tracked in `ReferralCard` widget on settings page

---

## 8. Build Health

### Package Version

```json
{
  "name": "edusync-prod",
  "version": "0.0.0"  // ⚠️ Should be 1.0.0 before launch
}
```

### Current Errors (as of March 30, 2026)

| File | Error | Severity |
|------|-------|----------|
| `billingServicePostgreSQL.ts:890` | `totalRequired` not in `FeeStructure` type | ⚠️ Medium — billing feature |
| `billingServicePostgreSQL.ts:936` | `studentName` not in `Receipt` type | ⚠️ Medium — billing feature |
| `billingServicePostgreSQL.ts:329` | `gradeLevel` unused variable | 🔵 Low |
| `billingServicePostgreSQL.ts:715` | `schoolYear` unused variable | 🔵 Low |
| `App.tsx:1` | `lazy` unused import | 🔵 Low |
| `TeachersLandingPage.tsx:22` | `CloudIcon` unused import | 🔵 Low |
| `PersonalForms.tsx:117` | `coreValues` unused variable | 🔵 Low |
| `useSectionsPostgreSQL.ts:262` | `data` unused variable | 🔵 Low |

**No blocking type errors prevent build.** The 2 medium errors are in the billing service and affect fee structure/receipt display in institutional mode billing.

### Dependencies

- **React:** 18.2.0
- **Firebase SDK:** 12.4.0
- **Supabase JS:** 2.81.1
- **Vite:** 4.4.5
- **TypeScript:** 5.0.2
- **Playwright:** 1.56.0
- **Jest:** 30.2.0

---

## 9. Testing Coverage

### E2E Tests (Playwright) — 50+ Spec Files

| Category | Tests | Config |
|----------|-------|--------|
| **Production Smoke** | `production-smoke-test.spec.ts`, `staging-smoke-test.spec.ts` | `playwright.prod.config.ts` |
| **Personal Workspace** | `personal-workspace.spec.ts`, `pro-vs-free-features.spec.ts` | Default |
| **Forms** | `form137-creation.spec.ts`, `form137-crud.spec.ts`, `form-generator/` | Default |
| **Grades** | `grades-display.spec.ts`, `grading-system-comprehensive.spec.ts` | Default |
| **CRUD** | `students-crud.spec.ts`, `teachers-crud.spec.ts`, `sections-crud.spec.ts` | Default |
| **ELLN** | `elln-assessment.spec.ts`, `elln-reports.spec.ts`, `elln-results.spec.ts`, `elln-simple.spec.ts` | Default |
| **Security** | `custom-claims-security.spec.ts`, `multi-tenant.spec.ts`, `security/` | Jest |
| **Performance** | `login-performance.spec.ts`, `landing-to-login-performance.spec.ts` | Default |
| **Offline** | `offline-audit.spec.ts`, `offline-first-visit.spec.ts` | Default |
| **Billing** | `billing-system-e2e.spec.ts` | Default |
| **Diagnostic** | `diagnostic-production.spec.ts`, `diagnostic-teacher-login.spec.ts` | Default |

### Test Commands

```bash
npm run test:e2e              # Local emulator
npm run test:staging          # Staging environment
npm run test:production       # Production (careful!)
npm run test:personal         # Personal workspace tests
npm run test:firestore-rules  # Security rules (Jest)
npm run test:security         # Multi-tenant + claims (Jest)
```

---

## 10. Go-Live Blockers & Action Items

### Critical (Must Fix Before Launch)

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1 | Get PayMongo API keys | Mark | ❌ Not started | Apply at paymongo.com, get test + live keys |
| 2 | Set PayMongo keys in `functions/.env` | Mark | ❌ Not started | `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| 3 | Deploy payment functions to production | Mark | ❌ Not started | `firebase deploy --only functions` |
| 4 | Register PayMongo webhook URL | Mark | ❌ Not started | Point to deployed `paymongoWebhook` function URL |
| 5 | Create production deploy GitHub Action | Mark | ❌ Not started | Copy `deploy-staging.yml`, change to `build:prod` + production project |
| 6 | Deploy to production | Mark | ❌ Not started | `npm run deploy:production` or GitHub Action |
| 7 | Activate `edusync.ph` domain | Mark | ❌ Not started | DNS A records per `DNS_SETUP_GUIDE.md` |

### Important (Should Fix Before Launch)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8 | Fix `billingServicePostgreSQL.ts` type errors | ❌ | Add `totalRequired`, `studentName` to interfaces |
| 9 | Bump version to `1.0.0` in `package.json` | ❌ | |
| 10 | Clean unused imports (5 warnings) | ❌ | `lazy`, `CloudIcon`, `coreValues`, `data`, `gradeLevel`, `schoolYear` |
| 11 | Verify personal signup flow end-to-end | ❌ | Test with real email + Google sign-in |
| 12 | Verify upgrade modal flow (with test PayMongo keys) | ❌ | Test free → Pro upgrade |
| 13 | Verify referral code generation + tracking | ❌ | Test signup with `?ref=CODE` |

### Nice-to-Have (Post-Launch)

| # | Item | Notes |
|---|------|-------|
| 14 | Consolidate Form137→SF10, Form138→SF9 naming in codebase | Legacy names still in routes/components |
| 15 | Auto-onboarding for institutional mode | Currently disabled — not needed for personal mode launch |
| 16 | Email verification flow | `.bak` files suggest it was disabled |
| 17 | More aggressive E2E tests (validate data renders in UI) | Current tests pass with empty data |
| 18 | Google Workspace integration | Docs exist but incomplete |

---

## 11. Go-Live Strategy

### Strategy: Lead with Personal Mode

The institutional mode has high onboarding friction (needs school admin). Personal mode is zero-friction: teacher signs up → starts using immediately.

### Phase 1: Activate & Deploy (Week 1)

1. Get PayMongo API keys (apply at paymongo.com)
2. Configure `functions/.env` with keys
3. Deploy functions + hosting to production
4. Activate `edusync.ph` custom domain
5. Test full flow: signup → workspace → upgrade → payment → Pro tier

### Phase 2: Teacher Acquisition (Week 2-4)

1. Post in Filipino teacher Facebook groups:
   - "Free SF5 generator — no account needed" → `/tools/form-generator`
   - "Free digital gradebook for Filipino teachers" → `/teachers`
2. The funnel is built: free tool → signup → workspace → upgrade prompts
3. Referral system activates organically once teachers share codes
4. **Target: 100 free signups, 5 Pro conversions in first month**

### Phase 3: Polish from Feedback (Week 3-6)

- Fix bugs reported by real teachers
- Optimize for mobile (most PH teachers use phones)
- Run `npm run test:production` weekly
- Monitor Supabase dashboard for query performance

### Phase 4: School Bridge (Month 2-3)

- When 10+ teachers from same school use Personal Mode → signal to approach school admin
- School admin creates invite codes → teachers accept → data migrates
- School plan (₱1,999/mo) < 25 individual Pro subscriptions (₱79 × 25 = ₱1,975)

### Phase 5: Division Expansion (Month 4+)

- Division module is already built and functional
- Approach Division Superintendent: "25 schools already use EduSync"
- Division-level reports, SF imports, personnel management already working

---

## 12. Progress Tracker

Use this section to check off items as they're completed. Update dates when done.

### Launch Checklist

- [x] PayMongo test keys obtained — Date: pre-existing
- [x] PayMongo live keys obtained — Date: pre-existing
- [x] Functions `.env` configured — Date: pre-existing
- [x] Payment functions deployed — Date: 2026-03-30
- [x] Webhook registered in PayMongo — Date: 2026-03-30 ✅ Verified (endpoint returns "Invalid signature" for unsigned requests)
- [x] Production deploy workflow created — Date: 2026-03-30
- [x] First production deployment — Date: 2026-03-30 ✅ https://edusync-sis.web.app
- [ ] `edusync.ph` domain active — Date: ___
- [x] Version bumped to 1.0.0 — Date: 2026-03-30
- [x] Billing type errors fixed — Date: 2026-03-30
- [x] Unused imports cleaned — Date: 2026-03-30
- [ ] Personal signup tested end-to-end — Date: ___
- [ ] Upgrade flow tested with test keys — Date: ___
- [ ] Referral system tested — Date: ___
- [ ] First Facebook post published — Date: ___

### Growth Milestones

- [ ] 10 free signups — Date: ___
- [ ] 50 free signups — Date: ___
- [ ] 100 free signups — Date: ___
- [ ] First Pro conversion — Date: ___
- [ ] 10 Pro subscribers — Date: ___
- [ ] First school converts from personal → institutional — Date: ___
- [ ] First division pilot — Date: ___
- [ ] ₱10,000/month revenue — Date: ___
- [ ] ₱50,000/month revenue — Date: ___

### Monthly Revenue Tracking

| Month | Free Users | Pro Subs | School Plans | Monthly Revenue |
|-------|-----------|----------|-------------|----------------|
| Apr 2026 | | | | |
| May 2026 | | | | |
| Jun 2026 | | | | |
| Jul 2026 | | | | |
| Aug 2026 | | | | |
| Sep 2026 | | | | |
| Oct 2026 | | | | |
| Nov 2026 | | | | |
| Dec 2026 | | | | |

---

*Last updated: March 30, 2026*  
*Next review: ___*
