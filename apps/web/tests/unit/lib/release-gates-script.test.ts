import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve(__dirname, '../../../scripts/release-gates.mjs');

describe('release gates script', () => {
  it('exists and checks migrations and pages', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const script = fs.readFileSync(scriptPath, 'utf-8');
    expect(script).toContain('004_seed_data.sql');
    expect(script).toContain('app/privacy/page.tsx');
    expect(script).toContain('app/terms/page.tsx');
  });

  it('guards known launch-dangerous patterns', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');
    expect(script).toContain('booking UI must not accept customer-entered amount');
    expect(script).toContain('membership purchase must not activate before payment verification');
    expect(script).toContain('browser idempotency keys must use Web Crypto');
  });
});
