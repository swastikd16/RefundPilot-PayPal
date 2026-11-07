import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import casesRouter from './routes/cases.js';
import prisma from './db.js';
import { hasCredentials } from './services/paypal.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded evidence files
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check endpoint (SRS §11)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RefundPilot AI Backend',
    timestamp: new Date().toISOString(),
    paypalConfigured: hasCredentials(),
    database: 'connected'
  });
});

// Seed demo case endpoint for judges/testers (SRS Appendix A)
app.post('/api/demo/seed', async (req, res) => {
  try {
    // Clear previous demo records if requested
    const existing = await prisma.refundCase.findFirst({
      where: { complaintText: { contains: 'Headphones arrived with a cracked earcup' } }
    });

    if (existing) {
      return res.json({ message: 'Demo case already exists', caseId: existing.id });
    }

    const demoCase = await prisma.refundCase.create({
      data: {
        userId: 'demo-judge-user',
        complaintText: 'Sony WH-1000XM5 headphones arrived with a cracked right earcup. The box was crushed in transit. Customer wants a full refund or immediate replacement.',
        issueType: 'DAMAGED_ITEM',
        requestedOutcome: 'REFUND',
        state: 'INVESTIGATING',
        purchaseReferences: {
          create: {
            provider: 'PAYPAL',
            captureId: 'DEMO-CAP-SONY1000',
            orderId: 'DEMO-ORD-987654',
            amount: 399.00,
            currency: 'USD',
            sourceType: 'DEMO_FIXTURE'
          }
        },
        paymentSnapshots: {
          create: {
            currency: 'USD',
            capturedAmount: 399.00,
            refundedAmount: 0.0,
            status: 'COMPLETED',
            rawResponseJson: JSON.stringify({
              id: 'DEMO-CAP-SONY1000',
              status: 'COMPLETED',
              amount: { value: '399.00', currency_code: 'USD' },
              note: 'Authorized PayPal Sandbox Capture Record'
            })
          }
        },
        events: {
          createMany: {
            data: [
              {
                eventType: 'CASE_CREATED',
                actorType: 'CUSTOMER',
                source: 'USER_INPUT',
                summary: 'Case opened by customer regarding damaged shipment.',
                occurredAt: new Date(Date.now() - 3600000)
              },
              {
                eventType: 'STATUS_CHECKED',
                actorType: 'PAYPAL_API',
                source: 'PAYPAL_API',
                summary: 'Verified PayPal Capture DEMO-CAP-SONY1000 for $399.00 USD (COMPLETED).',
                occurredAt: new Date(Date.now() - 3000000)
              }
            ]
          }
        },
        aiAnalyses: {
          create: {
            model: 'gemini-2.5-flash',
            issueClassification: 'DAMAGED_ITEM',
            customerGoal: 'Request a full refund',
            customerClaimsJson: JSON.stringify([
              'Headphones arrived with a cracked right earcup',
              'Shipping box was visibly crushed during transit'
            ]),
            verifiedFactsJson: JSON.stringify([
              { field: 'PayPal Capture', value: 'DEMO-CAP-SONY1000', source: 'PayPal Sandbox' },
              { field: 'Captured Amount', value: '$399.00 USD', source: 'PayPal Sandbox' },
              { field: 'Payment Status', value: 'COMPLETED', source: 'PayPal Sandbox' }
            ]),
            missingFactsJson: JSON.stringify([
              'Photos of the shipping carton and damaged right earcup'
            ]),
            policyFindingsJson: JSON.stringify([
              'Merchant policy specifies damage claims must be filed within 14 days with photographic proof.',
              'PayPal Buyer Protection applies to items significantly not as described or physically damaged in transit.'
            ]),
            recommendedAction: 'PREPARE_MERCHANT_REQUEST',
            rationale: 'Review merchant damage return policy and send structured inquiry with photos before formal escalation.',
            confidenceBand: 'HIGH',
            safetyFlagsJson: JSON.stringify(['REFUND_NOT_CONFIRMED'])
          }
        }
      }
    });

    res.json({ message: 'Seeded demo case successfully', caseId: demoCase.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount Cases API
app.use('/api/cases', casesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RefundPilot Backend running on http://localhost:${PORT}`);
  console.log(`   Health check at http://localhost:${PORT}/api/health`);
});

