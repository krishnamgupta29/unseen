import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc';

/**
 * Derive a 32-byte key from the environment secret
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.MESSAGE_ENCRYPTION_KEY || 'unseen_default_encryption_secret_32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(plaintext: string): { encryptedContent: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypt an AES-256 encrypted string
 * Supports GCM (with auth tag), CBC fallback (without tag), and plaintext fallback.
 */
export function decrypt(encryptedContent: string, ivHex?: string, tagHex?: string): string {
  if (!encryptedContent) return '';
  if (!ivHex) return encryptedContent; // Fallback for raw plaintext if any

  try {
    const iv = Buffer.from(ivHex, 'hex');
    if (tagHex) {
      // AES-256-GCM authenticated decryption
      const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // Legacy AES-256-CBC decryption fallback
      const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, getKey(), iv);
      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  } catch {
    // If decryption fails, return original content or fallback indicator
    return encryptedContent;
  }
}

/**
 * Hash a string one-way (for IPs, sensitive lookups)
 */
export function hashOneWay(value: string): string {
  return crypto
    .createHmac('sha256', process.env.IP_HASH_SECRET || 'unseen_ip_hash_secret')
    .update(value)
    .digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(bytes = 40): string {
  return crypto.randomBytes(bytes).toString('hex');
}
