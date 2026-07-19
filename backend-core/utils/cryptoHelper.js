import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Legacy hashing routine (HMAC-SHA256 with a single static salt shared by
 * every user). Kept ONLY so existing accounts created before this fix can
 * still log in — new passwords are never hashed with this function.
 * A shared static salt provides no real per-user protection and SHA-256
 * is not a password hashing algorithm (too fast, brute-forceable).
 */
const legacyHashPassword = (password) => {
  const systemSalt = 'llm_eval_platform_secure_salt_2026';
  return crypto.createHmac('sha256', systemSalt).update(password).digest('hex');
};

/**
 * Current password hashing routine: bcrypt with a random per-password salt
 * and a real work factor. This is the only method used for new signups
 * and for any password rehashed during migration.
 */
export const hashSecurePassword = async (password) => {
  if (!password) return '';
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Verifies a plaintext password against a stored hash, supporting both
 * bcrypt hashes (new format, starts with "$2") and legacy HMAC-SHA256
 * hashes (old format, 64 hex chars) so existing accounts keep working.
 * Returns { valid, needsRehash } — needsRehash is true when the stored
 * hash is still in the old legacy format and should be upgraded now that
 * the password is known to be correct.
 */
export const verifyPassword = async (password, storedHash) => {
  if (!password || !storedHash) return { valid: false, needsRehash: false };

  const looksLikeBcrypt = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$');

  if (looksLikeBcrypt) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  }

  // Legacy HMAC-SHA256 hash — compare directly, flag for upgrade on success.
  const legacyHash = legacyHashPassword(password);
  const valid = legacyHash === storedHash;
  return { valid, needsRehash: valid };
};
