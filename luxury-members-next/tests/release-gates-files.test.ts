import fs from 'fs';
import { describe, expect, it } from 'vitest';

const requiredFiles = [
  'docs/store-submission-checklist.md',
  'docs/security-runbook.md',
  'docs/operations-runbook.md',
  'docs/release-readiness-report.md'
];

describe('release assets', () => {
  it('has required docs', () => {
    for (const file of requiredFiles) {
      expect(fs.existsSync(file)).toBe(true);
    }
  });
});
