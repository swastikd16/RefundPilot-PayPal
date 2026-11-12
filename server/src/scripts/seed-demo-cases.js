import prisma from '../db.js';
import { CASE_STATES } from '../engine/stateMachine.js';

async function seed() {
  console.log('Seeding demo cases...');

  const sampleCases = [
    {
      userId: 'demo-customer-1',
      complaintText: 'My Sony WH-1000XM5 headphones arrived with a cracked right earcup and damaged packaging in transit.',
      issueType: 'DAMAGED_ITEM',
      requestedOutcome: 'Obtain a full refund or a replacement for the damaged item',
      state: CASE_STATES.INVESTIGATING,
      captureId: 'DEMO-CAP-SONY1000',
      amount: 399.00,
      verifiedFacts: ['Purchase date: Nov 12, 2026', 'Merchant: TechDirect Store', 'PayPal Capture ID: DEMO-CAP-SONY1000'],
      customerClaims: ['Sony WH-1000XM5 arrived damaged', 'Package was crushed during delivery'],
      missingFacts: ['Product defect photo showing broken earcup'],
      policyFindings: ['Policy requires unboxing or visual evidence for physical defects']
    },
    {
      userId: 'sarah-j-99',
      complaintText: 'Ordered North Face Winter Parka on Nov 1st, tracking says delivered but parcel never received at front porch.',
      issueType: 'NOT_RECEIVED',
      requestedOutcome: 'Full refund of $289.00 via original payment method',
      state: CASE_STATES.NEEDS_INFO,
      captureId: 'DEMO-CAP-JACKET20',
      amount: 289.00,
      verifiedFacts: ['Tracking marked as delivered by courier', 'PayPal payment authorized and completed'],
      customerClaims: ['No parcel at porch or mailroom', 'Contacted building concierge with negative result'],
      missingFacts: ['Carrier lost shipment report or merchant denial note'],
      policyFindings: ['Requires proof of non-delivery inquiry with carrier']
    },
    {
      userId: 'alex-dev-22',
      complaintText: 'Received Keychron Wireless Mechanical Keyboard with tactile brown switches instead of optical banana switches.',
      issueType: 'WRONG_ITEM',
      requestedOutcome: 'Merchant exchange or store refund',
      state: CASE_STATES.MERCHANT_ACTION_REQUIRED,
      captureId: 'DEMO-CAP-KB9900',
      amount: 129.00,
      verifiedFacts: ['Model ordered: Banana Optical Switch', 'Model shipped barcode: Gateron Brown'],
      customerClaims: ['Switch variant received does not match order confirmation'],
      missingFacts: [],
      policyFindings: ['Merchant 30-day exchange window is active (14 days remaining)']
    },
    {
      userId: 'marcus-trade',
      complaintText: 'Double billed for Dell UltraSharp 4K Monitor on Nov 5th due to checkout gateway timeout.',
      issueType: 'INCORRECT_AMOUNT',
      requestedOutcome: 'Reverse the duplicate transaction authorization of $749.00',
      state: CASE_STATES.RESOLVED,
      captureId: 'DEMO-CAP-DELL4K',
      amount: 749.00,
      verifiedFacts: ['Duplicate capture identified within 12 seconds', 'Original transaction settled'],
      customerClaims: ['Charged twice for single order confirmation #DELL-9821'],
      missingFacts: [],
      policyFindings: ['Eligible for immediate duplicate charge reversal via PayPal Sandbox']
    },
    {
      userId: 'elena-r',
      complaintText: 'Subscription billed $49.00 after free trial was canceled in user settings.',
      issueType: 'UNAUTHORIZED_TRANSACTION',
      requestedOutcome: 'Full refund and cancellation of recurring billing agreement',
      state: CASE_STATES.CLOSED_BY_USER,
      captureId: 'DEMO-CAP-SUB49',
      amount: 49.00,
      verifiedFacts: ['Recurring profile ID: I-SUB9921', 'Billing agreement cancelled by merchant'],
      customerClaims: ['Canceled trial before 7-day grace expired'],
      missingFacts: [],
      policyFindings: ['Merchant issued direct store credit to customer']
    }
  ];

  for (const c of sampleCases) {
    const created = await prisma.refundCase.create({
      data: {
        userId: c.userId,
        complaintText: c.complaintText,
        issueType: c.issueType,
        requestedOutcome: c.requestedOutcome,
        state: c.state,
        purchaseReferences: {
          create: {
            provider: 'PAYPAL',
            captureId: c.captureId,
            amount: c.amount,
            currency: 'USD',
            sourceType: 'DEMO_FIXTURE'
          }
        },
        aiAnalyses: {
          create: {
            model: 'gemini-2.5-flash',
            issueClassification: c.issueType,
            customerGoal: c.requestedOutcome,
            recommendedAction: 'PREPARE_MERCHANT_REQUEST',
            rationale: 'Initial complaint filed. Contacting the seller with verified transaction facts is the required first step.',
            confidenceBand: 'HIGH',
            userConfirmationRequired: true,
            verifiedFactsJson: JSON.stringify(c.verifiedFacts),
            customerClaimsJson: JSON.stringify(c.customerClaims),
            missingFactsJson: JSON.stringify(c.missingFacts),
            policyFindingsJson: JSON.stringify(c.policyFindings)
          }
        },
        events: {
          create: [
            {
              eventType: 'CASE_CREATED',
              actorType: 'CUSTOMER',
              source: 'USER_INPUT',
              summary: `Dispute opened for ${c.issueType}`
            },
            {
              eventType: 'ANALYSIS_COMPLETED',
              actorType: 'AI_AGENT',
              source: 'AI_INFERENCE',
              summary: 'Triaged and corroborated against PayPal transaction'
            }
          ]
        }
      }
    });
    console.log(`Created demo case: ${created.id} [${created.state}]`);
  }

  console.log('✅ Demo cases seeded successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
