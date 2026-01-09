## Copilot Instructions for EduSync-School-Information-System

- **Architecture**: Vite + React + TypeScript with Tailwind; offline-first PWA backed by Firestore. Frontend reads/writes Firestore directly; Firebase Functions (functions/) are only for secure APIs (Gemini proxy). Multi-tenant data is keyed by school IDs; keep isolation intact when adding queries or seeds.
- **Local dev (required)**: Use emulator flow, not production. `npm run dev:emu` switches env, starts Firestore/Auth emulators, seeds via `scripts/emu-seed-and-admin.cjs`, then runs Vite. If emulator is already running, use targeted seeds: `npm run emu:seed:small|big|admin`.
- **Builds**: `npm run build:prod` and `npm run build:uat` inject the correct Firebase configs. Avoid `npm run build` for release artifacts unless you know which env is active.
- **Firestore rules**: Authoritative files are `firestore.rules` and `firestore.indexes.json`. Local tests: `node scripts/test-firestore-rules.cjs` (emulator). Deploy: `npx firebase deploy --only firestore --project=edusync-sis`.
- **Functions**: Inside functions/ run `npm install`; set Gemini key with `firebase functions:config:set gemini.key="..."`; deploy `firebase deploy --only functions:generateLessonPlan`. Frontend must call the function endpoint—never embed keys client-side.
- **E2E / QA**: Playwright tests live in tests/. Production smoke: `npx playwright test tests/production-smoke-test.spec.ts` (see scripts/production-e2e/ for seeded demo accounts and data assumptions). UIs expect the demo school `demo-e2e-testing` and test accounts (`superadmin-demo@...`, `admin-demo@...`, etc.) with password `Demo123!`.
- **Onboarding simulation**: scripts/real-onboarding/ phases 1–8 mirror real production onboarding (create school, teachers, sections, assignments, students, manual grade entry, reports). Use the provided order; phase 4 teacher assignments are critical for gradebook to load.
- **Migrations**: scripts/migrate-to-firestore/index.cjs migrates JSON datasets into Firestore with dry-run by default. Key flags: `--source`, `--project`, `--dry-run=false`, `--transform-config`, `--auth-map`, `--checkpoint`. Failed batches are written under `failed_batches/`.
- **Docs map**: docs/README.md indexes guides, plans, fixes, deployments, and quick references. For quick starts, see guides/TESTING_QUICK_START.md and guides/SEEDING.md; for infinite-loop prevention see fixes/INFINITE_LOOP_PREVENTION.md.
- **Component convention (critical)**: Any component using `useSchoolData(['settings'])` or feature flag helpers must memoize derived values to avoid infinite re-render loops. Pattern:
  - import `useMemo`
  - wrap feature flag hooks and `FeatureFlags.*` calls: `const enrollment = useMemo(() => useEnrollmentFeatures(settings), [settings]);`
  - add comment `// Memoize to prevent infinite loops`
- **Data integrity patterns**: Teacher documents need `assignments[]` populated with sectionIds and subjects (see scripts/production-e2e/phase4-create-teachers.cjs). Gradebook and reports assume that structure—avoid schema drift.
- **Environment variables**: Vite configs use `VITE_*` keys. `scripts/switch-env.cjs` rewrites `.env.local` for emulator vs prod/uat; do not hardcode project IDs.
- **When unsure**: Prefer Firestore emulator + Playwright smoke before touching production. Keep multi-tenant isolation and offline behavior in mind (avoid brittle reads, use real-time listeners via existing hooks).
