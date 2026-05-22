import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Derive a 32-byte key from the environment secret
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'unseen_default_encryption_secret_32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string using AES-256-CBC
 */
export function encrypt(plaintext: string): { encryptedContent: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt an AES-256-CBC encrypted string
 */
export function decrypt(encryptedContent: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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
