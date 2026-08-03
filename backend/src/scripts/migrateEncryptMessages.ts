/**
 * ONE-TIME MIGRATION SCRIPT: Encrypt Existing Direct Messages at Rest
 *
 * This script scans the MongoDB 'messages' collection and encrypts any plaintext
 * or legacy-encrypted messages using AES-256-GCM.
 *
 * Usage:
 *   npx ts-node src/scripts/migrateEncryptMessages.ts [--dry-run]
 *
 * Requirements:
 *   - MONGODB_URI environment variable must be set (or in .env)
 *   - ENCRYPTION_SECRET environment variable must be set (or in .env)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Message from '../models/Message';
import { encrypt, decrypt } from '../services/encryption';

const isDryRun = process.argv.includes('--dry-run');

async function runMigration() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const secret = process.env.ENCRYPTION_SECRET || process.env.MESSAGE_ENCRYPTION_KEY;
  if (!secret) {
    console.warn('⚠️ ENCRYPTION_SECRET is not set. Default fallback secret will be used for key derivation.');
  }

  console.log(`🚀 Starting Message Encryption Migration ${isDryRun ? '[DRY RUN MODE]' : ''}...`);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas.');

    // Fetch all message documents
    const totalCount = await Message.countDocuments();
    console.log(`📦 Found ${totalCount} total message(s) in database.`);

    const cursor = Message.find().cursor();
    let migratedCount = 0;
    let alreadyEncryptedCount = 0;
    let errorCount = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      try {
        const rawDoc: any = doc.toObject();
        let plainTextToEncrypt: string | null = null;

        // Check Case 1: Plaintext stored in legacy 'text' field
        if (rawDoc.text && typeof rawDoc.text === 'string' && rawDoc.text.trim()) {
          plainTextToEncrypt = rawDoc.text.trim();
        } 
        // Check Case 2: Missing IV or missing GCM tag (unencrypted or legacy format)
        else if (!rawDoc.iv || !rawDoc.tag) {
          // If IV exists without tag, attempt legacy CBC decryption
          if (rawDoc.iv && rawDoc.encryptedContent) {
            try {
              const decrypted = decrypt(rawDoc.encryptedContent, rawDoc.iv);
              plainTextToEncrypt = decrypted;
            } catch {
              // If decryption fails, assume raw content
              plainTextToEncrypt = rawDoc.encryptedContent;
            }
          } else if (rawDoc.encryptedContent) {
            plainTextToEncrypt = rawDoc.encryptedContent;
          }
        }

        // If we found plaintext needing AES-256-GCM encryption
        if (plainTextToEncrypt) {
          const { encryptedContent, iv, tag } = encrypt(plainTextToEncrypt);

          if (!isDryRun) {
            await Message.updateOne(
              { _id: doc._id },
              {
                $set: { encryptedContent, iv, tag },
                $unset: { text: '' }
              }
            );
          }
          migratedCount++;
        } else {
          alreadyEncryptedCount++;
        }
      } catch (err: any) {
        errorCount++;
        console.error(`❌ Error migrating message ID ${doc._id}:`, err.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   • Total messages scanned: ${totalCount}`);
    console.log(`   • Messages encrypted:     ${migratedCount} ${isDryRun ? '(dry run - no writes made)' : ''}`);
    console.log(`   • Already encrypted:      ${alreadyEncryptedCount}`);
    console.log(`   • Errors encountered:     ${errorCount}`);

    console.log('\n✨ Migration script completed successfully.');
  } catch (error: any) {
    console.error('💥 Fatal error during migration:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runMigration();
