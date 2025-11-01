# Copilot Instructions for EduSync-School-Information-System

This guide provides essential context for AI agents working on this codebase. Understanding these patterns and workflows is critical for making effective contributions.

## 1. Architecture Overview

This is a Vite-powered React application that uses Firebase for its backend services. The architecture is designed to be **offline-first**, leveraging Firestore's persistence capabilities.

- **Frontend**: The frontend is built with React and TypeScript, located in the `src/` directory. It uses Tailwind CSS for styling. Key libraries include `react-router-dom` for navigation and various `firebase` client SDKs for backend communication.

- **Backend (Firebase)**:
  - **Firestore**: The primary database. All data models, security rules (`firestore.rules`), and indexes (`firestore.indexes.json`) are defined for Firestore. The application is designed to work directly with Firestore, with a strong emphasis on real-time updates and offline data persistence.
  - **Firebase Functions**: Located in the `functions/` directory. These are Node.js functions that act as a secure backend proxy for services requiring private API keys, such as the Gemini API for generative AI features. The frontend calls these functions instead of the external APIs directly.
  - **Firebase Hosting**: Used for deploying the production application.

- **Data Flow**:
  - For most CRUD operations, the React client interacts directly with the Firestore database using the Firebase client SDK.
  - For operations requiring server-side logic or secure API keys (e.g., AI-powered lesson plan generation), the client calls a specific Firebase Function endpoint.

## 2. Critical Developer Workflows

The development environment relies heavily on the Firebase Local Emulator Suite. **You must use the emulator for local development.**

### Local Development with Emulator

The primary command to start a complete local development environment is:

```bash
npm run dev:emu
```

This single command automates the following sequence:
1.  **Sets Environment**: Switches the `.env.local` file to use emulator settings.
2.  **Starts Emulator**: Launches the Firebase emulators for Firestore and Auth.
3.  **Seeds Database**: Populates the local Firestore emulator with necessary data (users, sections, etc.) using the `scripts/emu-seed-and-admin.cjs` script. The database is not useful without seeding.
4.  **Starts Vite**: Runs the Vite development server for the React frontend.

### Seeding the Database

Seeding is essential. Different seeding scripts are available in `package.json` for different scenarios:
- `npm run emu:seed:small`: For a small, manageable dataset.
- `npm run emu:seed:big`: For a large dataset to test performance.
- `npm run emu:seed:admin`: The default for `dev:emu`, setting up a standard dev environment.

### Building the Application

- **Production Build**: `npm run build:prod`
- **Staging/UAT Build**: `npm run build:uat`

These scripts embed the correct Firebase project configurations and API keys into the build output.

## 3. Key Files and Directories

- `src/`: Contains all React frontend code.
  - `components/`: Reusable React components.
  - `hooks/`: Custom React hooks, often for managing Firestore subscriptions and data fetching.
  - `services/`: Modules for interacting with Firebase services (e.g., `services/firestore.ts`).
- `functions/`: Houses the server-side Firebase Cloud Functions.
- `scripts/`: Contains critical scripts for development and deployment.
  - `emu-exec-seed.cjs`: The core logic for seeding the database.
  - `switch-env.cjs`: Manages environment configurations between emulator and production.
- `firestore.rules`: Defines the security rules for the Firestore database. This is a critical file for ensuring data security.
- `package.json`: The source of truth for all dependencies and project scripts. Refer to the `scripts` section for a full list of available commands.

## 4. Project Conventions

- **Environment Variables**: All Firebase configuration is managed through Vite environment variables (e.g., `VITE_FIREBASE_PROJECT_ID`). The `scripts/switch-env.cjs` script and different `.env.*` files manage which configuration is active.
- **State Management**: The application prefers using custom hooks that subscribe directly to Firestore queries for real-time state management, rather than a global state library like Redux.
- **Testing**: End-to-end tests are written with Playwright and are located in the `tests/` directory.

## 5. Critical Bug Prevention: Infinite Render Loops

**⚠️ CRITICAL: This is a RECURRING issue that MUST be addressed in EVERY new component/module!**

### The Problem:
Components using `useSchoolData(['settings'])` can cause **infinite render loops** because the `settings` object reference changes on every render. This has occurred multiple times in:
- DepEd Forms module
- Enrollment Portal module
- Other components using feature flags

### The Solution (MANDATORY):
**ALWAYS use `useMemo` when passing `settings` to functions or hooks:**

```typescript
import React, { useMemo } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';
import { useEnrollmentFeatures, useFinancialFeatures } from '../services/featureFlags';

const MyComponent: React.FC = () => {
  const { settings, loading } = useSchoolData(['settings']);
  
  // ✅ CORRECT: Memoize feature flag hooks
  const enrollmentFeatures = useMemo(
    () => useEnrollmentFeatures(settings), 
    [settings]
  );
  
  const financialFeatures = useMemo(
    () => useFinancialFeatures(settings), 
    [settings]
  );
  
  // ✅ CORRECT: Memoize computed values
  const isFinancialEnabled = useMemo(
    () => FeatureFlags.isFinancialEnabled(settings),
    [settings]
  );
  
  if (loading) return <LoadingSpinner />;
  
  return <div>...</div>;
};
```

### ❌ NEVER DO THIS (Causes Infinite Loop):
```typescript
const MyComponent: React.FC = () => {
  const { settings } = useSchoolData(['settings']);
  
  // ❌ WRONG: Direct function call without memoization
  const enrollmentFeatures = useEnrollmentFeatures(settings);
  const isFinancial = FeatureFlags.isFinancialEnabled(settings);
  
  // This WILL cause an infinite loop!
};
```

### Checklist for New Components:
- [ ] Import `useMemo` from React
- [ ] Wrap ALL feature flag hooks in `useMemo`
- [ ] Wrap ALL FeatureFlags method calls in `useMemo`
- [ ] Add comment: `// Memoize to prevent infinite loops`
- [ ] Test in browser console for infinite loop warnings
- [ ] Verify component doesn't re-render continuously

### Standard Comment Template:
```typescript
/**
 * ComponentName - Brief description
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */
```

### Reference Documentation:
See `INFINITE_LOOP_PREVENTION.md` for detailed explanation, examples, and debugging guide.
