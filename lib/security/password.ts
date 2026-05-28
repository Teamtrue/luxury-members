/**
 * lib/security/password.ts
 * ---------------------------------------------------------------------------
 * Password hashing, verification, and strength validation for PlutusClub.
 *
 * Dependency: bcryptjs (pure-JS bcrypt, works in Node.js and Edge runtimes)
 *   Install: pnpm add bcryptjs && pnpm add -D @types/bcryptjs
 * ---------------------------------------------------------------------------
 */

// NOTE: bcryptjs must be added to package.json before using this module:
//   pnpm add bcryptjs
//   pnpm add -D @types/bcryptjs
//
// The dynamic require below avoids a hard compile-time error when the package
// is not yet installed, allowing the rest of the codebase to type-check.
// In production, bcryptjs MUST be present — the functions will throw at runtime if not.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bcrypt: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bcrypt = require('bcryptjs');
} catch {
  // Provide a clear error message rather than a cryptic "cannot find module".
  bcrypt = {
    genSalt:  () => { throw new Error('bcryptjs is not installed. Run: pnpm add bcryptjs'); },
    hash:     () => { throw new Error('bcryptjs is not installed. Run: pnpm add bcryptjs'); },
    compare:  () => { throw new Error('bcryptjs is not installed. Run: pnpm add bcryptjs'); },
  };
}

/** bcrypt cost factor — 12 rounds balances security and latency (~300 ms on modern hardware). */
const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt (12 rounds).
 *
 * @param password - The plaintext password supplied by the user.
 * @returns bcrypt hash string (60 chars, includes salt + cost factor).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * Uses bcrypt's built-in constant-time comparison.
 *
 * @param password - The plaintext password to verify.
 * @param hash     - The stored bcrypt hash from the database.
 * @returns `true` if password matches, `false` otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength against PlutusClub's security policy.
 *
 * Requirements:
 *  - Minimum 10 characters
 *  - At least 1 uppercase letter (A-Z)
 *  - At least 1 lowercase letter (a-z)
 *  - At least 1 digit (0-9)
 *  - At least 1 special character (!@#$%^&*…)
 *
 * @param password - The plaintext password to validate.
 * @returns Object with `valid` boolean and an array of human-readable `errors`.
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * The 20 most commonly used / breached passwords (case-insensitive check).
 * Extend this list or integrate with HaveIBeenPwned API in production.
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456789',
  '1234567890',
  '12345678',
  'qwerty123',
  'qwerty',
  'iloveyou',
  'admin123',
  'admin1234',
  'letmein',
  'welcome1',
  'monkey123',
  'dragon123',
  'master123',
  'sunshine1',
  'princess1',
  'football1',
  'superman1',
]);

/**
 * Check if a password appears in a curated list of the most commonly used passwords.
 * This is a lightweight first-pass check before full strength validation.
 *
 * @param password - The plaintext password to check (case-insensitive).
 * @returns `true` if the password is dangerously common, `false` if it is not found.
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
