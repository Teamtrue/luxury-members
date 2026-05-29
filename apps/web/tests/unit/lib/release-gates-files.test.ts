import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const webRoot = path.resolve(__dirname, '../../../');
const doc = (p: string) => path.join(webRoot, 'docs', p);

const requiredDocs = [
  'store-submission-checklist.md',
  'security-runbook.md',
  'operations-runbook.md',
  'release-readiness-report.md',
];

describe('release assets', () => {
  it('has required docs', () => {
    for (const file of requiredDocs) {
      expect(fs.existsSync(doc(file)), `Missing: docs/${file}`).toBe(true);
    }
  });
});
