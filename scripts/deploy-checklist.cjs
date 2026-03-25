#!/usr/bin/env node
/**
 * deploy-checklist.cjs — Interactive production deployment checklist
 *
 * Run: node scripts/deploy-checklist.cjs
 *
 * Guides you through every step needed to deploy Personal Workspace
 * (Phases 1-3 + Polish) to production. Safe — only prints commands,
 * never executes destructive ops automatically.
 */

const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const check = `${GREEN}✓${RESET}`;
const warn = `${YELLOW}⚠${RESET}`;
const step = (n, title) => console.log(`\n${BOLD}${CYAN}═══ Step ${n}: ${title} ═══${RESET}\n`);

async function main() {
  console.log(`
${BOLD}╔══════════════════════════════════════════════════════════════╗
║  EduSync Personal Workspace — Production Deployment Guide  ║
║  Phases 1 (Tools) + 2 (Workspace) + 3 (Monetization)      ║
║  Date: March 2026                                          ║
╚══════════════════════════════════════════════════════════════╝${RESET}

${YELLOW}This checklist will guide you through each deployment step.
Nothing is executed automatically — you run each command yourself.${RESET}
`);

  await ask('Press Enter to begin...');

  // ──────────────────────────────────────────────────────────
  step(1, 'Pre-flight Checks');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}1a. Verify local build passes:${RESET}
  ${CYAN}npm run build${RESET}
  Expected: "built in ~15s", no errors (chunk size warnings OK)
`);
  await ask(`${check} Build passes? (Enter to continue) `);

  console.log(`${BOLD}1b. Verify you're on the correct git branch:${RESET}
  ${CYAN}git status${RESET}
  ${CYAN}git log --oneline -5${RESET}
  Ensure all Phase 1-3 + Polish commits are present.
`);
  await ask(`${check} Git status clean? (Enter to continue) `);

  console.log(`${BOLD}1c. Check Firebase CLI is authenticated:${RESET}
  ${CYAN}firebase projects:list${RESET}
  Verify "edusync-sis" appears in the list.
`);
  await ask(`${check} Firebase CLI ready? (Enter to continue) `);

  console.log(`${BOLD}1d. Check Supabase access:${RESET}
  Verify you can access the Supabase dashboard for your production project.
  URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
`);
  await ask(`${check} Supabase dashboard accessible? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(2, 'Run Supabase Migrations (PostgreSQL)');
  // ──────────────────────────────────────────────────────────

  console.log(`${RED}${BOLD}⚠ CRITICAL: Run migrations IN ORDER. Each is idempotent but order matters.${RESET}
${RED}Back up your database before running migrations on production!${RESET}

${BOLD}Migration order:${RESET}
`);

  const migrations = [
    {
      file: '001_personal_workspace.sql',
      desc: 'Creates subscriptions table, personal workspace RPCs, tier limits',
    },
    {
      file: '003_referral_system.sql',
      desc: 'Referral tracking, unique codes (FIRSTNAME-XXXX), referral credits',
    },
    {
      file: '004_school_invitations.sql',
      desc: 'School invitations, workspace_migrations, accept_school_invitation RPC',
    },
  ];

  for (let i = 0; i < migrations.length; i++) {
    const m = migrations[i];
    console.log(`  ${BOLD}${i + 1}. ${m.file}${RESET}`);
    console.log(`     ${m.desc}`);
    console.log(`     ${CYAN}Location: scripts/migrations/${m.file}${RESET}`);
    console.log(`     Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)`);
    console.log(`     Or via CLI: ${CYAN}psql $DATABASE_URL < scripts/migrations/${m.file}${RESET}`);
    console.log();
  }

  console.log(`${YELLOW}Tip: Test each migration on staging first before production.${RESET}`);
  await ask(`${check} All 3 migrations applied to production Supabase? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(3, 'Deploy Firestore Rules & Indexes');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}Deploy updated Firestore security rules and indexes:${RESET}
  ${CYAN}firebase deploy --only firestore --project edusync-sis${RESET}

  This deploys both:
  - firestore.rules (role-based access control)
  - firestore.indexes.json (composite indexes)
`);
  await ask(`${check} Firestore rules deployed? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(4, 'Deploy Cloud Functions');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}4a. Install function dependencies:${RESET}
  ${CYAN}cd functions && npm install && cd ..${RESET}

${BOLD}4b. Verify Gemini API key is set:${RESET}
  ${CYAN}firebase functions:config:get --project edusync-sis${RESET}
  Should show: { "gemini": { "key": "..." } }

  If missing: ${CYAN}firebase functions:config:set gemini.key="YOUR_KEY" --project edusync-sis${RESET}

${BOLD}4c. Deploy all functions:${RESET}
  ${CYAN}firebase deploy --only functions --project edusync-sis${RESET}

  Functions deployed:
  - generateLessonPlan (Gemini AI)
  - generateStudentReport (Gemini AI)
  - payments (PayMongo webhooks + checkout)
  - createUserAccount
  - autoOnboarding
  - trialSignup
  - syncPostgresToAuth
`);
  await ask(`${check} Cloud Functions deployed? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(5, 'Build & Deploy Frontend');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}5a. Switch to production environment:${RESET}
  ${CYAN}npm run env:prod${RESET}
  This rewrites .env.local with production Firebase + Supabase credentials.

${BOLD}5b. Build for production:${RESET}
  ${CYAN}npm run build:prod${RESET}
  Expected: Successful build with PWA service worker generated.

${BOLD}5c. Deploy to Firebase Hosting:${RESET}
  ${CYAN}firebase use edusync-sis${RESET}
  ${CYAN}firebase deploy --only hosting --project edusync-sis${RESET}

  Or use the all-in-one command:
  ${CYAN}npm run deploy:production${RESET}
  (This runs: use:production → build:prod → deploy)

${BOLD}5d. Switch back to emulator env after deploy:${RESET}
  ${CYAN}npm run env:emu${RESET}
`);
  await ask(`${check} Frontend deployed to production? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(6, 'Post-Deployment Verification');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}6a. Manual smoke test — Open in browser:${RESET}
  ${CYAN}https://edusync-sis.web.app${RESET}  (or https://edusync.ph)

  Verify these pages load:
  ${check} Homepage (/) — LandingPage renders
  ${check} /teachers — TeachersLandingPage with pricing
  ${check} /tools/form-generator — Free form generator works
  ${check} /personal/signup — Signup wizard renders
  ${check} /privacy — Privacy Policy with correct title
  ${check} /terms — Terms of Service with correct title
  ${check} /some-invalid-route — 404 page renders (not silent redirect)
  ${check} /admin — Login screen renders
`);
  await ask(`${check} Manual smoke test passed? (Enter to continue) `);

  console.log(`${BOLD}6b. Run automated production smoke tests:${RESET}
  ${CYAN}$env:TEST_BASE_URL="https://edusync-sis.web.app"; npx playwright test tests/production-smoke-test.spec.ts${RESET}

  Or for headed mode (watch tests run):
  ${CYAN}$env:TEST_BASE_URL="https://edusync-sis.web.app"; npx playwright test tests/production-smoke-test.spec.ts --headed${RESET}
`);
  await ask(`${check} Automated smoke tests passed? (Enter to continue) `);

  console.log(`${BOLD}6c. Test Personal Workspace signup flow:${RESET}
  1. Go to /personal/signup
  2. Create a test account (use a personal email)
  3. Verify success screen appears (2.5s celebration)
  4. Verify dashboard loads with onboarding stepper
  5. Add a test student
  6. Try generating an SF2 form
  7. Check /personal/settings page loads
`);
  await ask(`${check} Signup flow works end-to-end? (Enter to continue) `);

  console.log(`${BOLD}6d. Verify PayMongo webhook (if configured):${RESET}
  - Check Firebase Functions logs for payment webhook activity
  ${CYAN}firebase functions:log --project edusync-sis | Select-String "payment"${RESET}
`);
  await ask(`${check} Payment system verified? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  step(7, 'SEO Verification');
  // ──────────────────────────────────────────────────────────

  console.log(`${BOLD}Verify SEO assets are served correctly:${RESET}
  ${CYAN}curl https://edusync-sis.web.app/robots.txt${RESET}
  ${CYAN}curl https://edusync-sis.web.app/sitemap.xml${RESET}

  Then submit sitemap to Google Search Console:
  https://search.google.com/search-console
  → Sitemaps → Add: https://edusync-sis.web.app/sitemap.xml
`);
  await ask(`${check} SEO assets verified? (Enter to continue) `);

  // ──────────────────────────────────────────────────────────
  // Done!
  // ──────────────────────────────────────────────────────────

  console.log(`
${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎉  DEPLOYMENT COMPLETE!  🎉                               ║
║                                                              ║
║   EduSync Personal Workspace is LIVE                         ║
║                                                              ║
║   Production URL: https://edusync-sis.web.app                ║
║   Teachers Page:  https://edusync-sis.web.app/teachers       ║
║   Form Generator: https://edusync-sis.web.app/tools/form-generator ║
║   Signup:         https://edusync-sis.web.app/personal/signup║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${RESET}

${BOLD}What was deployed:${RESET}
  Phase 1: Free Form Generator (SF2, SF5, SF9 PDF generation)
  Phase 2: Personal Workspace (dashboard, students, grades, forms, settings)
  Phase 3: Monetization (PayMongo, subscriptions, referrals, analytics)
  Polish:  404 page, SEO, success screen, cross-links, document titles

${BOLD}Post-deploy reminders:${RESET}
  • Monitor Firebase Functions logs for errors
  • Check Supabase dashboard for migration health
  • Submit sitemap to Google Search Console
  • Test referral links: /personal/signup?ref=CODE
  • Share /teachers landing page on teacher Facebook groups
`);

  rl.close();
}

main().catch((err) => {
  console.error(`${RED}Error: ${err.message}${RESET}`);
  rl.close();
  process.exit(1);
});
