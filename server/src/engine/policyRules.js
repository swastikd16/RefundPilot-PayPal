/**
 * Deterministic business policy evaluator.
 * Evaluates case facts, evidence, and payment snapshot to determine legitimate next steps.
 * Aligns with SRS Section 7.1, 7.2, and Section 10.2.
 */

export function evaluatePolicy(caseData) {
  const { complaintText, issueType, evidenceItems = [], merchantInteractions = [], paymentSnapshots = [] } = caseData;

  const latestPayment = paymentSnapshots[0] || null;
  const latestMerchant = merchantInteractions[0] || null;
  const hasPhotos = evidenceItems.some((e) => e.evidenceType === 'PRODUCT_PHOTO');
  const hasOrderConfirmation = evidenceItems.some((e) => e.evidenceType === 'ORDER_CONFIRMATION');

  const policyFindings = [];
  const missingFacts = [];
  const safetyFlags = [];

  // Default: refunds require authoritative confirmation
  safetyFlags.push('REFUND_NOT_CONFIRMED');

  // Evidence rules
  if (['DAMAGED_ITEM', 'DEFECTIVE', 'WRONG_ITEM'].includes(issueType)) {
    if (!hasPhotos) {
      missingFacts.push('Product photo showing defect/damage');
      policyFindings.push('Visual evidence is required by standard merchant policies for physical defect claims.');
    }
  }

  if (!hasOrderConfirmation && (!caseData.purchaseReferences || caseData.purchaseReferences.length === 0)) {
    missingFacts.push('PayPal Order/Transaction ID or receipt');
    policyFindings.push('An authoritative PayPal transaction reference is needed to verify eligibility.');
  }

  // Merchant coordination status check
  let recommendedAction = 'PREPARE_MERCHANT_REQUEST';
  let rationale = 'Initial complaint filed. Contacting the seller directly with evidence is the required first step before escalation.';

  if (latestMerchant) {
    if (latestMerchant.responseType === 'ACCEPTED') {
      recommendedAction = 'INITIATE_REFUND';
      rationale = 'Merchant agreed to issue refund. A sandbox refund can be initiated with customer confirmation.';
    } else if (latestMerchant.responseType === 'DECLINED') {
      recommendedAction = 'ESCALATE_DISPUTE';
      rationale = 'Merchant declined the refund. Escalation to PayPal Resolution Center guidance is recommended.';
      policyFindings.push('Merchant refused amicable resolution. Eligible for PayPal Buyer Protection review within 180 days.');
    } else if (latestMerchant.status === 'SENT') {
      recommendedAction = 'AWAIT_MERCHANT_REPLY';
      rationale = 'Message dispatched to merchant. Allow standard 48-72 hours response window before escalating.';
    }
  }

  if (latestPayment && (latestPayment.status === 'REFUNDED' || latestPayment.status === 'PARTIALLY_REFUNDED')) {
    recommendedAction = 'VERIFY_PAYMENT_STATUS';
    rationale = `PayPal API records show status: ${latestPayment.status}. Remaining refundable balance: ${latestPayment.capturedAmount - latestPayment.refundedAmount} ${latestPayment.currency}.`;
  }

  return {
    missingFacts,
    policyFindings,
    safetyFlags,
    recommendedAction,
    rationale,
    confidenceBand: missingFacts.length === 0 ? 'HIGH' : 'MEDIUM'
  };
}

