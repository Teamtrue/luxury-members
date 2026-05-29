/**
 * lib/security/encrypt.ts
 * ---------------------------------------------------------------------------
 * AES-256-GCM symmetric encryption for secrets stored at rest in the DB
 * (e.g. TOTP secrets, provider credentials).
 *
 * Key derivation: PBKDF2-SHA256 from APP_SECRET + a fixed context label,
 * so the DB encryption key is different from the HMAC signing key.
 *
 * Cipher text format (base64):
 *   <12-byte IV> | <ciphertext> | <16-byte auth tag>
 * ---------------------------------------------------------------------------
 */

import crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_BYTES   = 12;
const KEY_BYTES  = 32;
const ITERATIONS = 100_000;

function deriveKey(secret: string): Buffer {
  return crypto.pbkdf2Sync(
    secret,
    'plutusclub-db-encryption-v1',
    ITERATIONS,
    KEY_BYTES,
    'sha256'
  );
}

/**
 * Encrypt a UTF-8 plaintext string.
 *
 * @returns Base64-encoded ciphertext (IV + ciphertext + auth tag).
 * @throws  If APP_SECRET is not set.
 */
export function encrypt(plaintext: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET env var is required for encryption.');

  const key = deriveKey(secret);
  const iv  = crypto.randomBytes(IV_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, tag]).toString('base64');
}

/**
 * Decrypt a base64-encoded ciphertext produced by `encrypt()`.
 *
 * @returns Decrypted UTF-8 plaintext.
 * @throws  If the auth tag is invalid (tampered ciphertext) or APP_SECRET changed.
 */
export function decrypt(ciphertextB64: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET env var is required for decryption.');

  const key = deriveKey(secret);
  const buf = Buffer.from(ciphertextB64, 'base64');

  const iv         = buf.subarray(0, IV_BYTES);
  const tag        = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(IV_BYTES, buf.length - 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}
