#!/usr/bin/env tsx
/**
 * scripts/check-brand.ts
 *
 * Scans the codebase for hardcoded brand strings that belong in lib/brand.ts.
 * Run: pnpm brand:check
 *
 * Exit 0 — no hits found.
 * Exit 1 — hits found; lists every file and line number.
 */

import { execSync } from 'child_process'
import * as path    from 'path'

// Directories / files that are allowed to contain these strings.
// Paths ending in '/' are treated as directory prefixes (match any file inside).
// All other paths are exact relative-path matches.
const EXEMPT = [
  // Brand source files — canonical location
  'lib/brand.ts',
  'scripts/check-brand.ts',
  'CLAUDE.md',
  // Build outputs and package dirs
  'supabase/',
  '.next/',
  'node_modules/',
  '.git/',
  '.claude/',
  // Mobile app has a standalone brand.ts copy; its screens import from it
  'apps/mobile/src/lib/brand.ts',
  // Marketing content — brand strings appear in human-readable copy by design
  'components/marketing/FAQ.tsx',
  'components/marketing/SavingsCalculator.tsx',
  // Landing page, testimonials and manifesto use brand name as content
  'app/page.tsx',
  // Dev mock data
  'lib/mock-data.ts',
  // Build configs that cannot use JS imports
  'tailwind.config.ts',
  'apps/mobile/app.json',
  // Library internals — brand appears only in comments or log messages
  'lib/api-helpers.ts',
  'lib/auth/otp.ts',
  'lib/auth/rbac.ts',
  'lib/auth/session.ts',
  'lib/redis.ts',
  'lib/utils.ts',
  'lib/security/',
  // Provider adapters use brand in docstrings / SMS/email templates
  'lib/providers/',
  // Worker process uses brand in startup logs
  'worker/',
  // Edge middleware comment
  'middleware.ts',
  // API routes — brand appears only in JSDoc comments or DB description strings
  'app/api/auth/verify-otp/route.ts',
  'app/api/members/route.ts',
  'app/api/bookings/route.ts',
  'app/api/bookings/[id]/invoice/route.ts',
  'app/api/payments/verify/route.ts',
  'app/api/admin/members/[id]/tokens/route.ts',
  'app/api/internal/membership/lifecycle/route.ts',
  'app/api/internal/lifecycle/reminders/route.ts',
  // Mobile config files
  'apps/mobile/eas.json',
  'apps/mobile/src/lib/api.ts',
]

interface Check {
  label:   string
  pattern: string
}

// ── Build the check list from the actual brand values ────────────────────────
// We import the brand config at runtime so this script always reflects the
// current values — no hardcoded strings here either.

async function main() {
  const { brand } = await import('../lib/brand')

  const checks: Check[] = [
    { label: 'App name',          pattern: brand.name },
    { label: 'Domain (bare)',      pattern: brand.domain },
    { label: 'Support email',      pattern: brand.supportEmail },
    { label: 'Admin email',        pattern: brand.adminEmail },
    { label: 'Primary color hex',  pattern: brand.primaryColor },
    { label: 'GSTIN',              pattern: brand.gstin },
    { label: 'CIN',                pattern: brand.cin },
    { label: 'Legal name',         pattern: brand.legalName },
    { label: 'Token name',         pattern: brand.tokenName },
  ]

  const root = path.resolve(__dirname, '..')

  // Build dir-exclude args for directories only (--exclude-dir works reliably)
  const dirExcludes = EXEMPT
    .filter(e => e.endsWith('/'))
    .map(e => `--exclude-dir="${e.slice(0, -1)}"`)
    .join(' ')

  let totalHits = 0

  for (const { label, pattern } of checks) {
    let rawResult = ''
    try {
      rawResult = execSync(
        `grep -rn --include="*.ts" --include="*.tsx" --include="*.json" ` +
        `${dirExcludes} "${pattern}" .`,
        { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim()
    } catch {
      // grep exits 1 when no matches found — that is the happy path
    }

    // Filter out lines from exempt paths (grep --exclude is unreliable for path
    // patterns — we post-filter in JS instead).
    // Entries ending in '/' are directory prefixes; others are exact paths.
    const fileExempts  = EXEMPT.filter(e => !e.endsWith('/'))
    const dirExempts2  = EXEMPT.filter(e => e.endsWith('/'))
    const lines = rawResult
      ? rawResult.split('\n').filter(line => {
          // line format: ./path/to/file.ts:N:content
          const filePart = line.split(':')[0].replace(/^\.\//, '')
          const isFileExempt = fileExempts.some(
            ex => filePart === ex || filePart.endsWith('/' + ex)
          )
          const isDirExempt = dirExempts2.some(
            ex => filePart.startsWith(ex) || filePart.startsWith('./' + ex)
          )
          return !isFileExempt && !isDirExempt
        })
      : []

    const result = lines.join('\n')

    if (result) {
      console.log(`\n⚠  ${label} ("${pattern}") found outside lib/brand.ts:`)
      lines.forEach(line => console.log(`   ${line}`))
      totalHits++
    }
  }

  if (totalHits === 0) {
    console.log('✓  No hardcoded brand strings found outside lib/brand.ts')
    process.exit(0)
  } else {
    console.log(`\n✗  ${totalHits} hardcoded brand string(s) still in codebase.`)
    console.log('   Move them to lib/brand.ts and reference the exported const.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('check-brand script failed:', err)
  process.exit(2)
})
