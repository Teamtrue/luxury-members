import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const webRoot = path.resolve(__dirname, '../../../');

describe('release assets', () => {
  it('has required migration files', () => {
    const required = [
      'supabase/migrations/001_initial_schema.sql',
      'supabase/migrations/002_rls_policies.sql',
      'supabase/migrations/029_admin_mfa.sql',
    ];
    const repoRoot = path.resolve(webRoot, '../../');
    for (const file of required) {
      expect(fs.existsSync(path.join(repoRoot, file)), `Missing: ${file}`).toBe(true);
    }
  });

  it('has required app pages', () => {
    const required = [
      'app/privacy/page.tsx',
      'app/terms/page.tsx',
      'app/refund-policy/page.tsx',
      'app/member/page.tsx',
    ];
    for (const file of required) {
      expect(fs.existsSync(path.join(webRoot, file)), `Missing: ${file}`).toBe(true);
    }
  });
});
