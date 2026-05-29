#!/usr/bin/env node
/**
 * Release gates — run before any public launch.
 * Checks required files exist, env template is complete, and
 * launch-dangerous code patterns are absent.
 *
 * Usage: node scripts/release-gates.mjs
 * Exit: 0 = pass, 1 = fail (with error messages to stderr)
 */

import fs from 'fs';
import path from 'path';

// WEB_ROOT = apps/web/, REPO_ROOT = monorepo root
const WEB_ROOT = new URL('..', import.meta.url).pathname;
const REPO_ROOT = path.join(WEB_ROOT, '..', '..');
const resolveWeb = (p) => path.join(WEB_ROOT, p);
const resolveRepo = (p) => path.join(REPO_ROOT, p);
const resolve = (p) => p.startsWith('supabase/') ? resolveRepo(p) : resolveWeb(p);
const exists = (p) => fs.existsSync(resolve(p));
const read = (p) => fs.readFileSync(resolve(p), 'utf8');

let failed = false;

const fail = (msg) => {
  failed = true;
  console.error(`[FAIL] ${msg}`);
};

// ---------------------------------------------------------------------------
// 1. Required files
// ---------------------------------------------------------------------------

const requiredFiles = [
  // Docs
  'docs/store-submission-checklist.md',
  'docs/security-runbook.md',
  'docs/operations-runbook.md',
  'docs/release-readiness-report.md',
  'docs/final-submission-readiness.md',
  'docs/go-live-pass-fail-checklist.md',
  'docs/ui-ux-design-handoff.md',
  'docs/production-launch-gap-map.md',

  // Database migrations
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/004_seed_data.sql',

  // Legal pages
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/refund-policy/page.tsx',
  'app/grievance/page.tsx',
  'app/trust-center/page.tsx',
  'app/memberships/page.tsx',

  // Member pages
  'app/member/value/page.tsx',
  'app/member/support/page.tsx',

  // Public pages
  'app/bookings/page.tsx',

  // Admin pages
  'app/admin/ops/page.tsx',

  // API routes
  'app/api/health/route.ts',
  'app/api/auth/csrf/route.ts',
  'app/api/deals/route.ts',
  'app/api/payments/verify/route.ts',
  'app/api/payments/disputes/my/route.ts',
  'app/api/refunds/create/route.ts',
  'app/api/refunds/my/route.ts',
  'app/api/admin/dashboard/executive/route.ts',
  'app/api/admin/refunds/queue/route.ts',
  'app/api/admin/refunds/resolve/route.ts',
  'app/api/admin/reconciliation/queue/route.ts',
  'app/api/admin/reconciliation/resolve/route.ts',
  'app/api/admin/disputes/queue/route.ts',
  'app/api/admin/disputes/resolve/route.ts',
  'app/api/internal/lifecycle/reminders/route.ts',
  'app/api/internal/refunds/process/route.ts',
  'app/api/internal/notifications/dispatch/route.ts',
];

for (const file of requiredFiles) {
  if (!exists(file)) {
    fail(`Missing required release asset: ${file}`);
  }
}

// ---------------------------------------------------------------------------
// 2. .env.example completeness
// ---------------------------------------------------------------------------

const envTemplatePath = resolveRepo('.env.example');
if (!fs.existsSync(envTemplatePath)) {
  fail('Missing .env.example template');
} else {
  const envTemplate = fs.readFileSync(envTemplatePath, 'utf8');
  const requiredEnvKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'APP_SECRET',
    'CSRF_SECRET',
    'OTP_SIGNING_SECRET',
    'EMAIL_TOKEN_SECRET',
    'INTERNAL_JOB_TOKEN',
    'NEXT_PUBLIC_APP_URL',
  ];

  for (const key of requiredEnvKeys) {
    if (!envTemplate.includes(`${key}=`)) {
      fail(`Missing env template key: ${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Forbidden patterns (launch-dangerous code)
// ---------------------------------------------------------------------------

const forbiddenPatterns = [
  {
    file: 'app/bookings/page.tsx',
    pattern: /name="amount"|placeholder="Amount INR"/,
    reason: 'booking UI must not accept customer-entered amount',
  },
  {
    file: 'app/api/auth/login/route.ts',
    pattern: /admin=true|raw\.admin|admin: true/,
    reason: 'admin role must never come from client input',
  },
  {
    file: 'app/api/membership/create-order/route.ts',
    pattern: /status:\s*'active'|status",\s*"active"/i,
    reason: 'membership purchase must not activate before payment verification',
  },
  {
    file: 'app/bookings/page.tsx',
    pattern: /Math\.random\(\)/,
    reason: 'browser idempotency keys must use Web Crypto',
  },
];

for (const item of forbiddenPatterns) {
  if (exists(item.file) && item.pattern.test(read(item.file))) {
    fail(`Forbidden launch pattern in ${item.file}: ${item.reason}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Result
// ---------------------------------------------------------------------------

if (failed) {
  process.exit(1);
}

console.log('[PASS] Release gates passed. Safe to launch.');
