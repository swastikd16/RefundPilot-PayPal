import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { CASE_STATES, canTransition, transitionCase, generateConfirmationToken } from '../engine/stateMachine.js';
import { evaluatePolicy } from '../engine/policyRules.js';
import { analyzeComplaint, draftMerchantMessage, inspectEvidenceImage, analyzeMerchantPolicy } from '../services/ai.js';
import * as paypalService from '../services/paypal.js';
import { lookupProductCatalog } from '../services/channel3.js';
import { searchDisputePrecedents } from '../services/elasticSearch.js';
import { fetchLiveMerchantPolicyWithKernel } from '../services/kernelBrowser.js';
import { dispatchZapierEvent } from '../services/zapierWebhook.js';
import { AstropodsResolutionContainer } from '../agents/astropodsRunner.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for evidence uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and PDF files are supported.'));
    }
  }
});

/**
 * POST /api/cases
 * Create new refund case, run initial AI analysis, and link initial transaction facts.
 */
router.post('/', async (req, res) => {
  try {
    const { complaintText, orderReference, captureId, amount, currency, userId = 'demo-customer-1' } = req.body;

    if (!complaintText || complaintText.trim().length === 0) {
      return res.status(400).json({ error: 'Complaint text is required.' });
    }

    // Run AI fact extraction
    const aiExtracted = await analyzeComplaint(complaintText);

    const initialIssue = aiExtracted.issueType || 'UNCLEAR';
    const effectiveCaptureId = captureId || aiExtracted.extractedOrderRef || orderReference;
    const effectiveAmount = amount || aiExtracted.extractedAmount || 0;
    const effectiveCurrency = currency || aiExtracted.extractedCurrency || 'USD';

    // Create the case record in DB
    const newCase = await prisma.refundCase.create({
      data: {
        userId,
        complaintText,
        issueType: initialIssue,
        requestedOutcome: aiExtracted.customerGoal || 'REFUND',
        state: CASE_STATES.NEW,
        events: {
          create: {
            eventType: 'CASE_CREATED',
            actorType: 'CUSTOMER',
            source: 'USER_INPUT',
            summary: `Case initiated with issue category: ${initialIssue}`
          }
        }
      }
    });

    // If purchase/capture ID was provided or extracted, link it
    if (effectiveCaptureId) {
      const isDemoId = effectiveCaptureId.startsWith('DEMO-') || effectiveCaptureId.startsWith('MOCK-');
      await prisma.purchaseReference.create({
        data: {
          caseId: newCase.id,
          provider: 'PAYPAL',
          captureId: effectiveCaptureId,
          orderId: orderReference || null,
          amount: parseFloat(effectiveAmount) || 0,
          currency: effectiveCurrency,
          sourceType: (!isDemoId && paypalService.hasCredentials()) ? 'LIVE_SANDBOX' : 'DEMO_FIXTURE'
        }
      });

      // Try looking up in PayPal Sandbox if credentials exist and not a demo fixture
      let initialPaymentStatus = isDemoId ? 'COMPLETED' : 'UNKNOWN';
      let rawJson = null;
      if (!isDemoId && paypalService.hasCredentials()) {
        try {
          const captureData = await paypalService.getCapture(effectiveCaptureId);
          initialPaymentStatus = captureData.status || 'COMPLETED';
          rawJson = JSON.stringify(captureData);
        } catch (err) {
          console.warn('Sandbox capture lookup during case creation failed:', err.message);
        }
      }

      await prisma.paymentSnapshot.create({
        data: {
          caseId: newCase.id,
          currency: effectiveCurrency,
          capturedAmount: parseFloat(effectiveAmount) || 0,
          refundedAmount: 0.0,
          status: initialPaymentStatus,
          rawResponseJson: rawJson
        }
      });
    }

    // Evaluate deterministic policy
    const policyResult = evaluatePolicy({
      complaintText,
      issueType: initialIssue,
      evidenceItems: [],
      paymentSnapshots: [],
      merchantInteractions: []
    });

    // Store AI analysis record
    await prisma.aIAnalysis.create({
      data: {
        caseId: newCase.id,
        model: aiExtracted.source || 'gemini-3.5-flash-lite',
        issueClassification: initialIssue,
        customerGoal: aiExtracted.customerGoal,
        customerClaimsJson: JSON.stringify(aiExtracted.customerClaims || [complaintText]),
        verifiedFactsJson: JSON.stringify(
          effectiveCaptureId ? [{ field: 'captureId', value: effectiveCaptureId, source: 'user_provided' }] : []
        ),
        missingFactsJson: JSON.stringify(policyResult.missingFacts),
        policyFindingsJson: JSON.stringify(policyResult.policyFindings),
        recommendedAction: policyResult.recommendedAction,
        rationale: policyResult.rationale,
        confidenceBand: policyResult.confidenceBand,
        safetyFlagsJson: JSON.stringify(policyResult.safetyFlags)
      }
    });

    // Corroborate product details with Channel3 unified catalog
    try {
      const catalogResult = await lookupProductCatalog(complaintText);
      await prisma.caseEvent.create({
        data: {
          caseId: newCase.id,
          eventType: 'STATUS_CHECKED',
          actorType: 'AI_AGENT',
          source: 'CHANNEL3_CATALOG',
          summary: `Channel3 Catalog Match: ${catalogResult.canonicalTitle}${catalogResult.msrp ? ` (MSRP: $${catalogResult.msrp})` : ''}`,
          metadataJson: JSON.stringify(catalogResult)
        }
      });
    } catch (e) {
      // ponytail: non-blocking catalog enrichment fallback
    }

    // Search historical dispute precedents with Elastic vector index
    try {
      const precedentResult = await searchDisputePrecedents(initialIssue, complaintText);
      await prisma.caseEvent.create({
        data: {
          caseId: newCase.id,
          eventType: 'STATUS_CHECKED',
          actorType: 'AI_AGENT',
          source: 'ELASTIC_VECTOR_INDEX',
          summary: `Elastic Precedent Search: Ref ${precedentResult.topMatch?.id} (${precedentResult.historicalSettlementRate}% historical success rate)`,
          metadataJson: JSON.stringify(precedentResult)
        }
      });
    } catch (e) {
      // ponytail: non-blocking precedent enrichment fallback
    }

    // Move state to INVESTIGATING or NEEDS_INFO
    const nextState = policyResult.missingFacts.length > 0 ? CASE_STATES.NEEDS_INFO : CASE_STATES.INVESTIGATING;
    const transitionedCase = await transitionCase(newCase.id, nextState, {
      actorType: 'AI_AGENT',
      source: 'AI_INFERENCE',
      summary: `Initial triage complete. Case moved to ${nextState}.`
    });

    res.status(201).json(transitionedCase);
  } catch (err) {
    console.error('Failed to create case:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases
 * List all cases with high-level summaries.
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};

    const cases = await prisma.refundCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseReferences: true,
        paymentSnapshots: { orderBy: { retrievedAt: 'desc' }, take: 1 },
        evidenceItems: { select: { id: true, evidenceType: true } },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases/:id
 * Retrieve full case details.
 */
router.get('/:id', async (req, res) => {
  try {
    const caseData = await prisma.refundCase.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseReferences: true,
        paymentSnapshots: { orderBy: { retrievedAt: 'desc' } },
        evidenceItems: true,
        events: { orderBy: { occurredAt: 'desc' } },
        actions: { orderBy: { createdAt: 'desc' } },
        merchantInteractions: { orderBy: { createdAt: 'desc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(caseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases/:id/timeline
 * Retrieve chronological case events.
 */
router.get('/:id/timeline', async (req, res) => {
  try {
    const events = await prisma.caseEvent.findMany({
      where: { caseId: req.params.id },
      orderBy: { occurredAt: 'asc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/cases/:id
 * Update case details (e.g. user closing the case).
 */
router.patch('/:id', async (req, res) => {
  try {
    const { state, requestedOutcome } = req.body;
    const currentCase = await prisma.refundCase.findUnique({ where: { id: req.params.id } });

    if (!currentCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (state && state !== currentCase.state) {
      // Transition through state engine
      const updated = await transitionCase(currentCase.id, state, {
        actorType: 'CUSTOMER',
        source: 'USER_INPUT',
        summary: `User updated case state to ${state}`
      });
      return res.json(updated);
    }

    if (requestedOutcome) {
      const updated = await prisma.refundCase.update({
        where: { id: req.params.id },
        data: { requestedOutcome }
      });
      return res.json(updated);
    }

    res.json(currentCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/evidence
 * Handle evidence upload with server-side validation.
 */
router.post('/:id/evidence', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { evidenceType = 'PRODUCT_PHOTO' } = req.body;
    const caseId = req.params.id;

    const evidence = await prisma.evidenceItem.create({
      data: {
        caseId,
        fileKey: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        evidenceType,
        sharingStatus: 'PRIVATE'
      }
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: 'EVIDENCE_UPLOADED',
        actorType: 'CUSTOMER',
        source: 'USER_INPUT',
        summary: `Evidence uploaded: ${req.file.originalname} (${evidenceType})`
      }
    });

    // Check if case was NEEDS_INFO, move to INVESTIGATING
    const currentCase = await prisma.refundCase.findUnique({ where: { id: caseId } });
    if (currentCase && currentCase.state === CASE_STATES.NEEDS_INFO) {
      await transitionCase(caseId, CASE_STATES.INVESTIGATING, {
        actorType: 'SYSTEM',
        source: 'SYSTEM_ENGINE',
        summary: 'Evidence received; continuing investigation.'
      });
    }

    // Enhancement 4: Multimodal visual inspection if image uploaded
    let visualCheck = null;
    if (req.file.mimetype.startsWith('image/')) {
      visualCheck = await inspectEvidenceImage(
        req.file.path,
        req.file.mimetype,
        currentCase?.issueType || 'DAMAGED_ITEM',
        currentCase?.complaintText || ''
      );

      await prisma.caseEvent.create({
        data: {
          caseId,
          eventType: 'STATUS_CHECKED',
          actorType: 'AI_AGENT',
          source: 'AI_INFERENCE',
          summary: `Visual Evidence Inspection: ${visualCheck.visualAssessment || 'Consistent with claim'}`,
          metadataJson: JSON.stringify(visualCheck)
        }
      });
    }

    res.status(201).json({ ...evidence, visualCheck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/merchant-message/draft
 * AI drafts a structured message to the merchant.
 */
router.post('/:id/merchant-message/draft', async (req, res) => {
  try {
    const caseData = await prisma.refundCase.findUnique({
      where: { id: req.params.id },
      include: { evidenceItems: true, aiAnalyses: { take: 1, orderBy: { createdAt: 'desc' } } }
    });

    if (!caseData) return res.status(404).json({ error: 'Case not found' });

    const claims = caseData.aiAnalyses[0]
      ? JSON.parse(caseData.aiAnalyses[0].customerClaimsJson || '[]')
      : [caseData.complaintText];

    const draft = await draftMerchantMessage({
      complaintText: caseData.complaintText,
      issueType: caseData.issueType,
      customerClaims: claims,
      evidenceCount: caseData.evidenceItems.length
    });

    const interaction = await prisma.merchantInteraction.create({
      data: {
        caseId: caseData.id,
        channel: 'SIMULATED',
        status: 'DRAFT',
        messageSubject: `Issue with order: ${caseData.issueType}`,
        messageBody: draft,
        sourceType: 'SIMULATED_DEMO'
      }
    });

    await prisma.caseEvent.create({
      data: {
        caseId: caseData.id,
        eventType: 'MERCHANT_MESSAGE_DRAFTED',
        actorType: 'AI_AGENT',
        source: 'AI_INFERENCE',
        summary: 'Drafted resolution inquiry for seller.'
      }
    });

    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/merchant-message/send
 * Customer reviews and authorizes sending the drafted message to the merchant.
 */
router.post('/:id/merchant-message/send', async (req, res) => {
  try {
    const { interactionId, messageBody } = req.body;
    const caseId = req.params.id;

    const interaction = await prisma.merchantInteraction.findUnique({ where: { id: interactionId } });
    if (!interaction || interaction.caseId !== caseId) {
      return res.status(404).json({ error: 'Draft message not found' });
    }

    const updated = await prisma.merchantInteraction.update({
      where: { id: interactionId },
      data: {
        status: 'SENT',
        messageBody: messageBody || interaction.messageBody
      }
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: 'MERCHANT_MESSAGE_SENT',
        actorType: 'CUSTOMER',
        source: 'USER_INPUT',
        summary: 'Customer approved and dispatched inquiry to merchant (Simulated Sandbox Channel).'
      }
    });

    // Transition state
    await transitionCase(caseId, CASE_STATES.MERCHANT_ACTION_REQUIRED, {
      actorType: 'CUSTOMER',
      source: 'USER_INPUT',
      summary: 'Inquiry sent to seller; awaiting response.'
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/merchant-response/simulate
 * Simulates merchant reply (ACCEPTED, DECLINED, MORE_INFO_REQUESTED) with clear simulation badge.
 */
router.post('/:id/merchant-response/simulate', async (req, res) => {
  try {
    const { responseType = 'ACCEPTED', comment = 'We apologize for the inconvenience and approve the refund.' } = req.body;
    const caseId = req.params.id;

    const interaction = await prisma.merchantInteraction.create({
      data: {
        caseId,
        channel: 'SIMULATED',
        status: 'DELIVERED',
        messageSubject: 'Merchant Response',
        messageBody: 'Inbound seller message',
        responseType,
        responseContent: comment,
        sourceType: 'SIMULATED_DEMO'
      }
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: 'MERCHANT_RESPONSE_RECORDED',
        actorType: 'MERCHANT',
        source: 'SYSTEM_ENGINE',
        summary: `Seller responded [${responseType}]: "${comment}" (Visibly Simulated Demo Channel)`
      }
    });

    // Transition state based on response
    if (responseType === 'ACCEPTED') {
      await transitionCase(caseId, CASE_STATES.MERCHANT_RESPONSE_RECEIVED, {
        actorType: 'MERCHANT',
        source: 'SYSTEM_ENGINE',
        summary: 'Merchant accepted the refund claim.'
      });
    } else if (responseType === 'DECLINED') {
      await transitionCase(caseId, CASE_STATES.ESCALATION_GUIDANCE, {
        actorType: 'MERCHANT',
        source: 'SYSTEM_ENGINE',
        summary: 'Merchant declined; PayPal escalation guidance active.'
      });
    }

    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/actions/propose
 * Generates an expiring confirmation token for a consequential action (e.g. INITIATE_REFUND).
 */
router.post('/:id/actions/propose', async (req, res) => {
  try {
    const { actionType = 'INITIATE_REFUND' } = req.body;
    const caseId = req.params.id;

    const { token, expiresAt } = generateConfirmationToken();

    const action = await prisma.resolutionAction.create({
      data: {
        caseId,
        actionType,
        status: 'PENDING_CONFIRMATION',
        proposedBy: 'AI_AGENT',
        confirmationToken: token,
        tokenExpiresAt: expiresAt
      }
    });

    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: 'REFUND_PROPOSED',
        actorType: 'AI_AGENT',
        source: 'AI_INFERENCE',
        summary: `Action proposed: ${actionType}. Requires user confirmation within 10 minutes.`
      }
    });

    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/actions/:actionId/confirm
 * Validates confirmation token and triggers the actual operation (e.g. PayPal Sandbox Refund).
 */
router.post('/:id/actions/:actionId/confirm', async (req, res) => {
  try {
    const { token } = req.body;
    const { id: caseId, actionId } = req.params;

    const action = await prisma.resolutionAction.findUnique({ where: { id: actionId } });
    if (!action || action.caseId !== caseId) {
      return res.status(404).json({ error: 'Action record not found.' });
    }

    // Idempotent guard: if already executed, return success cleanly
    if (action.status === 'EXECUTED') {
      try {
        await transitionCase(caseId, CASE_STATES.RESOLVED, {
          actorType: 'SYSTEM',
          source: 'PAYPAL_API',
          summary: `Case marked RESOLVED after verified refund confirmation (${action.externalReference || 'EXECUTED'}).`
        });
      } catch (e) {
        // ignore if already resolved
      }
      return res.json({
        success: true,
        refundId: action.externalReference || 'EXECUTED',
        status: 'COMPLETED',
        alreadyExecuted: true
      });
    }

    if (action.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: `Action cannot be confirmed in status: ${action.status}` });
    }

    if (action.confirmationToken !== token) {
      return res.status(403).json({ error: 'Invalid confirmation token.' });
    }

    if (new Date() > new Date(action.tokenExpiresAt)) {
      return res.status(400).json({ error: 'Confirmation token has expired. Please re-propose the action.' });
    }

    // Lookup purchase reference
    const purchaseRef = await prisma.purchaseReference.findFirst({
      where: { caseId },
      orderBy: { retrievedAt: 'desc' }
    });

    let externalRefundId = null;
    let actualRefundStatus = 'COMPLETED';

    if (action.actionType === 'INITIATE_REFUND') {
      const isDemoFixture = !purchaseRef?.captureId || 
        purchaseRef.captureId.startsWith('DEMO-') || 
        purchaseRef.captureId.startsWith('MOCK-') || 
        purchaseRef.sourceType === 'DEMO_FIXTURE';

      // Execute via PayPal REST API only for real sandbox captures
      if (!isDemoFixture && paypalService.hasCredentials() && purchaseRef && purchaseRef.captureId) {
        try {
          const refundResult = await paypalService.refundCapture(purchaseRef.captureId, {
            note: 'RefundPilot AI Case Resolution',
            idempotencyKey: action.id
          });
          externalRefundId = refundResult.id;
          actualRefundStatus = refundResult.status || 'COMPLETED';
        } catch (paypalErr) {
          await prisma.caseEvent.create({
            data: {
              caseId,
              eventType: 'ERROR_REVIEW',
              actorType: 'PAYPAL_API',
              source: 'PAYPAL_API',
              summary: `PayPal Sandbox API refund failed: ${paypalErr.message}`
            }
          });
          return res.status(502).json({ error: `PayPal Sandbox error: ${paypalErr.message}` });
        }
      } else {
        // Fallback demo fixture simulation for benchmark / demonstration captures
        externalRefundId = 'DEMO-REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        actualRefundStatus = 'COMPLETED';
      }

      // Update payment snapshot
      await prisma.paymentSnapshot.create({
        data: {
          caseId,
          currency: purchaseRef?.currency || 'USD',
          capturedAmount: purchaseRef?.amount || 0,
          refundedAmount: purchaseRef?.amount || 0,
          status: 'REFUNDED',
          rawResponseJson: JSON.stringify({ refundId: externalRefundId, status: actualRefundStatus })
        }
      });

      // Update action record
      await prisma.resolutionAction.update({
        where: { id: actionId },
        data: {
          status: 'EXECUTED',
          confirmedAt: new Date(),
          externalReference: externalRefundId
        }
      });

      // Log verified event
      await prisma.caseEvent.create({
        data: {
          caseId,
          eventType: 'REFUND_EXECUTED',
          actorType: !isDemoFixture && paypalService.hasCredentials() ? 'PAYPAL_API' : 'SYSTEM_ENGINE',
          source: !isDemoFixture && paypalService.hasCredentials() ? 'PAYPAL_API' : 'SYSTEM_ENGINE',
          summary: `Refund of ${purchaseRef?.amount || 0} ${purchaseRef?.currency || 'USD'} confirmed (ID: ${externalRefundId})`
        }
      });

      // ponytail: dispatch Zapier automated resolution notification webhook
      try {
        await dispatchZapierEvent('refund.executed', {
          caseId,
          refundId: externalRefundId,
          amount: purchaseRef?.amount || 0,
          currency: purchaseRef?.currency || 'USD'
        });
        await prisma.caseEvent.create({
          data: {
            caseId,
            eventType: 'STATUS_CHECKED',
            actorType: 'SYSTEM',
            source: 'ZAPIER_AUTOMATION',
            summary: `Dispatched Zapier webhook for refund notification (${externalRefundId})`
          }
        });
      } catch (zapErr) {
        // ponytail: non-blocking Zapier dispatch
      }

      // Transition case to RESOLVED
      await transitionCase(caseId, CASE_STATES.RESOLVED, {
        actorType: 'SYSTEM',
        source: 'PAYPAL_API',
        summary: `Case marked RESOLVED after verified refund confirmation (${externalRefundId}).`
      });
    }

    res.json({ success: true, refundId: externalRefundId, status: actualRefundStatus });
  } catch (err) {
    console.error('Confirmation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/refresh
 * Refreshes transaction state from PayPal Sandbox API.
 */
router.post('/:id/refresh', async (req, res) => {
  try {
    const caseId = req.params.id;
    const purchaseRef = await prisma.purchaseReference.findFirst({
      where: { caseId },
      orderBy: { retrievedAt: 'desc' }
    });

    if (!purchaseRef || !purchaseRef.captureId) {
      return res.status(400).json({ error: 'No capture ID associated with this case.' });
    }

    const isDemoFixture = !purchaseRef?.captureId || 
      purchaseRef.captureId.startsWith('DEMO-') || 
      purchaseRef.captureId.startsWith('MOCK-') || 
      purchaseRef.sourceType === 'DEMO_FIXTURE';

    if (!isDemoFixture && paypalService.hasCredentials()) {
      const capture = await paypalService.getCapture(purchaseRef.captureId);
      const snapshot = await prisma.paymentSnapshot.create({
        data: {
          caseId,
          currency: capture.amount?.currency_code || 'USD',
          capturedAmount: parseFloat(capture.amount?.value || 0),
          refundedAmount: 0.0,
          status: capture.status,
          rawResponseJson: JSON.stringify(capture)
        }
      });

      await prisma.caseEvent.create({
        data: {
          caseId,
          eventType: 'STATUS_CHECKED',
          actorType: 'PAYPAL_API',
          source: 'PAYPAL_API',
          summary: `Refreshed status from PayPal Sandbox: ${capture.status}`
        }
      });

      return res.json(snapshot);
    } else {
      const latestSnapshot = await prisma.paymentSnapshot.findFirst({
        where: { caseId },
        orderBy: { retrievedAt: 'desc' }
      });
      return res.json(latestSnapshot || { message: 'Demo fixture snapshot is up to date.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cases/:id/policy-analyze
 * Enhancement 5: Analyze custom merchant policy excerpt or crawl live merchant site via KERNEL Cloud Browser
 */
router.post('/:id/policy-analyze', async (req, res) => {
  try {
    const { policyText, merchantDomain } = req.body;
    let effectivePolicyText = policyText;

    if (!effectivePolicyText && merchantDomain) {
      const kernelRes = await fetchLiveMerchantPolicyWithKernel(merchantDomain);
      effectivePolicyText = kernelRes.extractedText;
    }

    if (!effectivePolicyText) {
      return res.status(400).json({ error: 'Policy text or merchant domain is required.' });
    }

    const currentCase = await prisma.refundCase.findUnique({
      where: { id: req.params.id },
      include: { purchaseReferences: true }
    });

    if (!currentCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const result = await analyzeMerchantPolicy(effectivePolicyText, {
      issueType: currentCase.issueType,
      purchaseDate: currentCase.purchaseReferences?.[0]?.retrievedAt
    });

    await prisma.caseEvent.create({
      data: {
        caseId: currentCase.id,
        eventType: 'STATUS_CHECKED',
        actorType: 'AI_AGENT',
        source: merchantDomain ? 'KERNEL_CLOUD_BROWSER' : 'AI_INFERENCE',
        summary: `Analyzed Merchant Return Policy: ${result.summary} (Return Window: ${result.returnWindowDays || 'N/A'} days)`,
        metadataJson: JSON.stringify(result)
      }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases/:id/export-packet
 * Enhancement 2: Generate formal markdown dispute evidence packet (SRS FR-090 & FR-094)
 */
router.get('/:id/export-packet', async (req, res) => {
  try {
    const caseData = await prisma.refundCase.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseReferences: true,
        paymentSnapshots: { orderBy: { retrievedAt: 'desc' }, take: 1 },
        evidenceItems: true,
        events: { orderBy: { occurredAt: 'asc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        merchantInteractions: true
      }
    });

    if (!caseData) return res.status(404).json({ error: 'Case not found' });

    const purchase = caseData.purchaseReferences?.[0];
    const payment = caseData.paymentSnapshots?.[0];
    const analysis = caseData.aiAnalyses?.[0];
    const claims = analysis ? JSON.parse(analysis.customerClaimsJson || '[]') : [];

    let packet = `# PayPal Dispute Resolution Packet\n`;
    packet += `**Generated By:** RefundPilot AI System\n`;
    packet += `**Date:** ${new Date().toISOString()}\n`;
    packet += `**Case ID:** ${caseData.id}\n`;
    packet += `**Issue Classification:** ${caseData.issueType}\n`;
    packet += `**Current Status:** ${caseData.state}\n\n`;

    packet += `## 1. Verified PayPal Transaction Details (Authoritative Source)\n`;
    packet += `- **Capture ID:** ${purchase?.captureId || 'N/A'}\n`;
    packet += `- **Order ID:** ${purchase?.orderId || 'N/A'}\n`;
    packet += `- **Captured Amount:** $${purchase?.amount?.toFixed(2) || '0.00'} ${purchase?.currency || 'USD'}\n`;
    packet += `- **Authoritative Status:** ${payment?.status || 'UNKNOWN'}\n`;
    packet += `- **Source Type:** ${purchase?.sourceType || 'PAYPAL_SANDBOX'}\n\n`;

    packet += `## 2. Customer Stated Claims & Problem Description\n`;
    packet += `> "${caseData.complaintText}"\n\n`;
    if (claims.length > 0) {
      packet += `### Specific Claim Items:\n`;
      claims.forEach((c) => { packet += `- ${c}\n`; });
      packet += `\n`;
    }

    packet += `## 3. Uploaded Evidence Files (${caseData.evidenceItems.length})\n`;
    if (caseData.evidenceItems.length === 0) {
      packet += `*No external files attached yet.*\n\n`;
    } else {
      caseData.evidenceItems.forEach((ev, idx) => {
        packet += `${idx + 1}. **${ev.originalName}** (${ev.evidenceType}) — ${(ev.size / 1024).toFixed(1)} KB — Uploaded: ${new Date(ev.createdAt).toLocaleString()}\n`;
      });
      packet += `\n`;
    }

    packet += `## 4. Merchant Communication Log\n`;
    if (caseData.merchantInteractions.length === 0) {
      packet += `*No prior seller contact recorded.*\n\n`;
    } else {
      caseData.merchantInteractions.forEach((mi, idx) => {
        packet += `### Interaction ${idx + 1} (${mi.channel} / ${mi.status})\n`;
        packet += `- **Subject:** ${mi.messageSubject || 'Dispute Inquiry'}\n`;
        packet += `- **Message Body:** ${mi.messageBody}\n`;
        if (mi.responseType) {
          packet += `- **Seller Reply [${mi.responseType}]:** ${mi.responseContent || 'None'}\n`;
        }
        packet += `\n`;
      });
    }

    packet += `## 5. Chronological Audit History\n`;
    caseData.events.forEach((evt) => {
      packet += `- **[${new Date(evt.occurredAt).toLocaleString()}]** [${evt.actorType}] (${evt.source}): ${evt.summary}\n`;
    });

    res.json({ packet, filename: `RefundPilot-Dispute-Packet-${caseData.id.substring(0, 8)}.md` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases/:id/astropods
 * Returns the multi-stage autonomous Astropods execution plan and container state.
 */
router.get('/:id/astropods', async (req, res) => {
  try {
    const caseData = await prisma.refundCase.findUnique({
      where: { id: req.params.id },
      include: {
        evidenceItems: true,
        merchantInteractions: true,
        actions: true
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const container = new AstropodsResolutionContainer(caseData);
    res.json(container.getExecutionPlan());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

