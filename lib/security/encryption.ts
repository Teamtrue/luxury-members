/**
 * lib/security/encryption.ts
 * ---------------------------------------------------------------------------
 * AES-256-GCM authenticated encryption for sensitive config values.
 *
 * Key material: ENCRYPTION_KEY env var (must be 64 hex chars = 32 bytes).
 * Output format: "iv_hex:ciphertext_hex:tag_hex"
 *
 * Backwards-compat: if ENCRYPTION_KEY is not set, encrypt/decrypt become
 * no-ops that return the plaintext so the system still works in dev without
 * the key configured.
 * ---------------------------------------------------------------------------
 */

import crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_BYTES   = 12; // 96-bit IV — optimal for GCM
const SEPARATOR  = ':';

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    console.error('[encryption] ENCRYPTION_KEY must be 64 hex characters (32 bytes). Encryption disabled.');
    return null;
  }
  return key;
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM.
 * Returns the ciphertext in "iv:encrypted:tag" hex format.
 * Falls back to plaintext if ENCRYPTION_KEY is not configured.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();

  return [iv.toString('hex'), enc.toString('hex'), tag.toString('hex')].join(SEPARATOR);
}

/**
 * Decrypts a value produced by `encrypt()`.
 * If the value is not in the expected "iv:enc:tag" format, returns it as-is
 * (handles plain-text values stored before encryption was enabled).
 */
export function decrypt(value: string): string {
  const key = getKey();
  if (!key) return value;

  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) {
    // Not encrypted — plain text stored before encryption was enabled.
    return value;
  }

  const [ivHex, encHex, tagHex] = parts;
  try {
    const iv       = Buffer.from(ivHex, 'hex');
    const enc      = Buffer.from(encHex, 'hex');
    const tag      = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc).toString('utf8') + decipher.final('utf8');
  } catch {
    // Auth tag mismatch or corrupt data — return raw value and log.
    console.error('[encryption] Decryption failed; returning raw value. Check ENCRYPTION_KEY.');
    return value;
  }
}

/**
 * Returns true if the value looks like an encrypted blob (iv:enc:tag format).
 */
export function isEncrypted(value: string): boolean {
  return value.split(SEPARATOR).length === 3;
}
