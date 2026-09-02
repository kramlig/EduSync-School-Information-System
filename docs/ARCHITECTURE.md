# EduSync Architecture Guide

## System Overview

EduSync is built on a **hybrid cloud architecture** combining real-time NoSQL (Firestore) with relational database (PostgreSQL) to achieve both real-time synchronization and complex analytical queries.

## High-Level Architecture

`
┌─────────────────────────────────┐
│     React 18 + TypeScript       │
│   Vite + Tailwind CSS (PWA)     │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼────────┐
│   Firestore  │    │  PostgreSQL     │
│  (Real-time) │    │  (Analytics)    │
└───┬──────────┘    └────────┬────────┘
    │                        │
    │      ┌─────────────────┘
    │      │
    └──────┼─────────────────┐
           │                 │
    ┌──────▼────────┐  ┌─────▼──────────┐
    │ Cloud         │  │ Cloud Storage  │
    │ Functions     │  │ (Files, Docs)  │
    └───────────────┘  └────────────────┘
`

## Technology Stack

### Frontend Layer
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite (sub-second HMR)
- **Styling:** Tailwind CSS + Headless UI components
- **PWA:** Service Worker for offline support
- **State Management:** React Context + Custom Hooks
- **Real-time Sync:** Firestore Web SDK with custom middleware

### Backend & Data Layer
- **Real-time DB:** Google Cloud Firestore (NoSQL)
- **Relational DB:** Supabase PostgreSQL
- **Authentication:** Firebase Auth (JWT + Custom Claims)
- **Cloud Functions:** Node.js for business logic
- **Storage:** Google Cloud Storage (CDN via Firebase Hosting)

### DevOps & Deployment
- **Hosting:** Firebase Hosting (CDN + Edge caching)
- **CI/CD:** GitHub Actions
- **Infrastructure as Code:** Firebase configuration files
- **Monitoring:** Firebase Console + Custom Logging

## Key Architectural Decisions

### 1. Hybrid Database Strategy

**Why two databases?**
- **Firestore:** Excels at real-time collaboration and instant data synchronization across clients
- **PostgreSQL:** Better for complex queries, reporting, and data analytics

**Data Flow:**
`
Frontend Changes → Firestore → Cloud Function → PostgreSQL
                                     ↓
                            Analytics, Reporting
`

**Benefit:** Real-time user experience + Powerful analytics without sacrificing performance

### 2. Multi-Tenant Architecture

Each school is a completely isolated tenant with:
- **Separate data collections** in Firestore
- **Firestore Security Rules** enforcing document-level access
- **PostgreSQL Row-Level Security (RLS)** for data isolation
- **Shared infrastructure** (cost-efficient) with complete data separation

`
Firestore Rules Example:
match /schools/{schoolId} {
  // Only teachers from this school can read/write
  match /students/{document=**} {
    allow read, write: if request.auth.token.schoolId == schoolId;
  }
}
`

### 3. Real-time Synchronization

**Problem:** Users expect instant updates across all devices

**Solution:**
1. **Optimistic Updates** on client (immediate UI feedback)
2. **Firestore Listeners** propagate changes server-side
3. **Conflict Resolution** via custom middleware
4. **Eventual Consistency** for cross-tenant operations

**Example - Grade Update:**
`
Teacher updates grade:
1. UI updates immediately (optimistic)
2. Firestore listener syncs to all parent devices in real-time
3. Student sees grade change within 100ms
4. Analytics pipeline updates for reporting
`

### 4. Microservices via Cloud Functions

Instead of monolithic backend, business logic is split into functions:
- onStudentEnroll() - Handle enrollment
- onGradeChange() - Grade change triggers
- generateReport() - Report generation
- syncWithPostgreSQL() - Data sync

**Benefits:**
- Independent scaling
- Isolated failure domains
- Pay-per-execution pricing
- Easy to test and deploy

### 5. Performance Optimizations

**Query Performance (45% improvement achieved):**
`javascript
// Before: Fetches all students, filters in app
const students = await db.collection('students')
  .where('schoolId', '==', schoolId)
  .get(); // Returns 5000 docs, slow

// After: Indexed query, Firestore filters
const students = await db.collection('students')
  .where('schoolId', '==', schoolId)
  .where('active', '==', true)
  .orderBy('lastName')
  .limit(50)
  .get(); // Returns 50 docs, fast
`

**Caching Strategy:**
- Browser Cache: 24-hour TTL for static assets
- Firestore Cache: Aggressive client-side caching
- Redis: (Future enhancement) for session data

**Pagination:**
- React Virtualization for 1000+ student lists
- Lazy loading components
- Code splitting via Vite

## Security Architecture

### Authentication
`
Login Flow:
User → Firebase Auth → JWT Token → Custom Claims (role, schoolId)
                            ↓
                    Firestore Rules
                    Can access only their school
`

### Authorization
- **Role-Based Access Control (RBAC):** Via Firebase Custom Claims
- **Document-Level Security:** Firestore Rules
- **Row-Level Security:** PostgreSQL policies

### Data Protection
- **TLS 1.3:** All data in transit
- **Encryption at Rest:** Google Cloud managed encryption
- **Audit Logging:** All changes logged with user ID
- **GDPR Compliance:** Right to be forgotten implementation

## Deployment Pipeline

`
Code Push to GitHub
        ↓
GitHub Actions CI:
  - Run tests
  - Lint code
  - Build check
  - Security scan
        ↓
   If main branch:
  - Deploy to staging
  - Run E2E tests
        ↓
   If release tag:
  - Deploy to production
  - Zero-downtime (CDN cache invalidation)
`

## Scalability Considerations

### Current Limits
- **Firestore:** 50k read/writes per second (Google managed)
- **PostgreSQL:** 100+ concurrent connections
- **Concurrent Users:** 1000+ (tested), can scale to 10k+

### Horizontal Scaling
- **Frontend:** CDN (Firebase Hosting) scales automatically
- **Functions:** Auto-scales with request volume
- **Database:** Firestore auto-scales; PostgreSQL can be upgraded

### Vertical Optimization
- Code splitting: 80KB main bundle
- Lazy loading: ~50ms per route
- Image optimization: WebP with fallbacks
- Database indexing: Strategic indexes on frequently queried fields

## Monitoring & Observability

### Logs
- Cloud Functions logs: Automatic via Firebase
- Frontend errors: Custom error tracking (Sentry integration ready)

### Metrics
- Page load time: Monitored via Lighthouse CI
- API latency: Custom middleware tracking
- Error rate: Real-time alerts

### Alerts
- Firebase quota warnings
- Function error rate > 5%
- Deployment failures

## Future Enhancements

1. **Caching Layer:** Add Redis for session/frequent queries
2. **GraphQL API:** Replace REST endpoints
3. **Event Streaming:** Kafka for cross-service events
4. **ML Predictions:** For student performance analytics
5. **Multi-region Deployment:** For disaster recovery

---

*Last updated: September 2025*
