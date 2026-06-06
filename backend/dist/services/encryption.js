"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hashOneWay = hashOneWay;
exports.generateSecureToken = generateSecureToken;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
// Derive a 32-byte key from the environment secret
function getKey() {
    const secret = process.env.ENCRYPTION_SECRET || 'unseen_default_encryption_secret_32b';
    return crypto_1.default.createHash('sha256').update(secret).digest();
}
/**
 * Encrypt a string using AES-256-CBC
 */
function encrypt(plaintext) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, getKey(), iv);
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
function decrypt(encryptedContent, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Hash a string one-way (for IPs, sensitive lookups)
 */
function hashOneWay(value) {
    return crypto_1.default
        .createHmac('sha256', process.env.IP_HASH_SECRET || 'unseen_ip_hash_secret')
        .update(value)
        .digest('hex');
}
/**
 * Generate a secure random token
 */
function generateSecureToken(bytes = 40) {
    return crypto_1.default.randomBytes(bytes).toString('hex');
}
