import crypto from 'crypto';

/**
 * Enterprise SHA-256 secure password hashing routine with a static system salt
 */
export const hashSecurePassword = (password) => {
  if (!password) return '';
  const systemSalt = 'llm_eval_platform_secure_salt_2026';
  return crypto
    .createHmac('sha256', systemSalt)
    .update(password)
    .digest('hex');
};