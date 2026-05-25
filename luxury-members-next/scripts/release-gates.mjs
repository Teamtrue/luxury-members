import fs from 'fs';

const requiredFiles = [
  'docs/store-submission-checklist.md',
  'docs/security-runbook.md',
  'docs/operations-runbook.md',
  'docs/release-readiness-report.md',
  'docs/final-submission-readiness.md',
  'docs/go-live-pass-fail-checklist.md',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/refund-policy/page.tsx',
  'app/grievance/page.tsx',
  'app/api/health/route.ts',
  'app/api/auth/csrf/route.ts',
  'app/api/payments/verify/route.ts',
  'app/api/admin/reconciliation/queue/route.ts',
  'app/api/admin/reconciliation/resolve/route.ts',
  'app/api/admin/disputes/queue/route.ts',
  'app/api/admin/disputes/resolve/route.ts'
];

const requiredEnvKeys = [
  'JWT_SECRET',
  'DATABASE_URL',
  'PAYMENT_WEBHOOK_SECRET',
  'PAYMENT_SIGNING_SECRET',
  'INTERNAL_JOB_TOKEN'
];

let failed = false;

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failed = true;
    console.error(`Missing required release asset: ${file}`);
  }
}

const envTemplatePath = '.env.example';
if (!fs.existsSync(envTemplatePath)) {
  failed = true;
  console.error('Missing .env.example template');
} else {
  const envTemplate = fs.readFileSync(envTemplatePath, 'utf8');
  for (const key of requiredEnvKeys) {
    if (!envTemplate.includes(`${key}=`)) {
      failed = true;
      console.error(`Missing env template key: ${key}`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('Release gates passed.');
