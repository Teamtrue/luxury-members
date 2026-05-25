import fs from 'fs';

const requiredFiles = [
  'docs/store-submission-checklist.md',
  'docs/security-runbook.md',
  'docs/operations-runbook.md',
  'docs/release-readiness-report.md',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/refund-policy/page.tsx',
  'app/grievance/page.tsx',
  'app/api/health/route.ts'
];

let failed = false;

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failed = true;
    console.error(`Missing required release asset: ${file}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('Release gates passed.');
