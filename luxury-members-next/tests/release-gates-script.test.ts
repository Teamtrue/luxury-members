import fs from 'fs';
import { describe, expect, it } from 'vitest';

describe('release gates script', () => {
  it('exists and references required docs', () => {
    const script = fs.readFileSync('scripts/release-gates.mjs', 'utf-8');
    expect(script).toContain('store-submission-checklist.md');
    expect(script).toContain('security-runbook.md');
  });
});
