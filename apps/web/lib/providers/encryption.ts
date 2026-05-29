/**
 * lib/providers/encryption.ts
 *
 * AES-256-GCM encryption/decryption for provider credentials stored in the
 * provider_config table.  Only runs server-side; never imported in browser code.
 *
 * Key format: ENCRYPTION_KEY env var must be exactly 64 hexadecimal characters
 * (representing 32 bytes / 256 bits).
 *
 * Encrypted envelope stored in JSONB as: { "__enc__": "<base64>" }
 * where base64 = IV (12 bytes) || AuthTag (16 bytes) || ciphertext.
 *
 * If ENCRYPTION_KEY is not set the functions are no-ops: plaintext config is
 * returned/stored as-is so development works without secrets.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO       = 'aes-256-gcm';
const IV_BYTES   = 12;
const TAG_BYTES  = 16;
const ENC_MARKER = '__enc__';

// ---------------------------------------------------------------------------
// Key helper
// ---------------------------------------------------------------------------

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;

  const buf = Buffer.from(raw, 'hex');
  if (buf.length !== 32) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).'
    );
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a credentials object.
 *
 * Returns `{ "__enc__": "<base64>" }` when ENCRYPTION_KEY is set.
 * Returns the original object unchanged when the key is absent (dev mode).
 */
export function encryptConfig(
  config: Record<string, string>
): Record<string, string> {
  const key = getKey();
  if (!key) return config; // dev mode: no-op

  const iv         = randomBytes(IV_BYTES);
  const cipher     = createCipheriv(ALGO, key, iv);
  const plaintext  = JSON.stringify(config);
  const encrypted  = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag        = cipher.getAuthTag();

  const envelope   = Buffer.concat([iv, tag, encrypted]).toString('base64');
  return { [ENC_MARKER]: envelope };
}

/**
 * Decrypt a credentials object that was previously encrypted by encryptConfig.
 *
 * If the object does not have the `__enc__` marker (plain JSONB from legacy rows
 * or dev mode), it is returned unchanged.
 */
export function decryptConfig(
  stored: Record<string, string>
): Record<string, string> {
  if (!stored || typeof stored !== 'object') return {};

  // Not an encrypted envelope — return as plain config.
  if (!Object.prototype.hasOwnProperty.call(stored, ENC_MARKER)) {
    return stored;
  }

  const key = getKey();
  if (!key) {
    // Key not configured but data is encrypted — log warning, return empty.
    console.error(
      '[providers/encryption] ENCRYPTION_KEY is not set but stored config is encrypted.'
    );
    return {};
  }

  try {
    const buf        = Buffer.from(stored[ENC_MARKER] as string, 'base64');
    const iv         = buf.subarray(0, IV_BYTES);
    const tag        = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);

    const decipher   = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);

    const decrypted  = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as Record<string, string>;
  } catch (err) {
    console.error('[providers/encryption] decryption failed:', err);
    return {};
  }
}

/** Returns true when ENCRYPTION_KEY is set and valid. */
export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}
