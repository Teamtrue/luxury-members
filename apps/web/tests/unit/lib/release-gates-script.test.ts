import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve(__dirname, '../../../scripts/release-gates.mjs');

describe('release gates script', () => {
  it('exists and references required docs', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const script = fs.readFileSync(scriptPath, 'utf-8');
    expect(script).toContain('store-submission-checklist.md');
    expect(script).toContain('security-runbook.md');
    expect(script).toContain('production-launch-gap-map.md');
    expect(script).toContain('004_seed_data.sql');
  });

  it('guards known launch-dangerous patterns', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');
    expect(script).toContain('booking UI must not accept customer-entered amount');
    expect(script).toContain('membership purchase must not activate before payment verification');
    expect(script).toContain('browser idempotency keys must use Web Crypto');
  });
});
