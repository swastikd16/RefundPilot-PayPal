import assert from 'assert';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hasCredentials, getAccessToken } from '../services/paypal.js';

dotenv.config();
const prisma = new PrismaClient();

async function runVerification() {
  console.log('--- RefundPilot Verification Self-Check ---');

  // 1. Verify Database
  console.log('[1/2] Verifying SQLite database and Prisma models...');
  const testCase = await prisma.refundCase.create({
    data: {
      userId: 'test-user-system-check',
      complaintText: 'Initial system health self-check verification record',
      issueType: 'UNCLEAR',
      state: 'NEW'
    }
  });

  assert.ok(testCase.id, 'Case ID should be defined');
  const fetched = await prisma.refundCase.findUnique({ where: { id: testCase.id } });
  assert.strictEqual(fetched.complaintText, 'Initial system health self-check verification record');

  // Clean up test record
  await prisma.refundCase.delete({ where: { id: testCase.id } });
  console.log('✅ SQLite database read/write/delete assertions passed.');

  // 2. Verify PayPal Sandbox Credentials
  console.log('[2/2] Checking PayPal Sandbox connectivity...');
  if (hasCredentials()) {
    try {
      const token = await getAccessToken();
      assert.ok(token && typeof token === 'string', 'Token should be a non-empty string');
      console.log('✅ PayPal Sandbox OAuth 2.0 Token acquired successfully!');
      console.log(`   Token prefix: ${token.substring(0, 10)}...`);
    } catch (err) {
      console.error('❌ PayPal Sandbox auth failed:', err.message);
    }
  } else {
    console.log('ℹ️  PayPal Sandbox credentials not yet populated in server/.env.');
    console.log('   Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to server/.env to enable live sandbox calls.');
  }

  await prisma.$disconnect();
  console.log('--- Self-Check Complete ---');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

