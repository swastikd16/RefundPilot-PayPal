import crypto from 'crypto';
import prisma from '../db.js';

export const CASE_STATES = {
  NEW: 'NEW',
  NEEDS_INFO: 'NEEDS_INFO',
  INVESTIGATING: 'INVESTIGATING',
  MERCHANT_ACTION_REQUIRED: 'MERCHANT_ACTION_REQUIRED',
  MERCHANT_RESPONSE_RECEIVED: 'MERCHANT_RESPONSE_RECEIVED',
  REFUND_MONITORING: 'REFUND_MONITORING',
  ESCALATION_GUIDANCE: 'ESCALATION_GUIDANCE',
  ERROR_REVIEW: 'ERROR_REVIEW',
  RESOLVED: 'RESOLVED',
  REOPENED: 'REOPENED',
  CLOSED_BY_USER: 'CLOSED_BY_USER'
};

// State transitions defined in SRS Section 10.1
export const VALID_TRANSITIONS = {
  [CASE_STATES.NEW]: [
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.INVESTIGATING,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.NEEDS_INFO]: [
    CASE_STATES.INVESTIGATING,
    CASE_STATES.MERCHANT_ACTION_REQUIRED,
    CASE_STATES.MERCHANT_RESPONSE_RECEIVED,
    CASE_STATES.RESOLVED,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.INVESTIGATING]: [
    CASE_STATES.MERCHANT_ACTION_REQUIRED,
    CASE_STATES.MERCHANT_RESPONSE_RECEIVED,
    CASE_STATES.REFUND_MONITORING,
    CASE_STATES.ESCALATION_GUIDANCE,
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.ERROR_REVIEW,
    CASE_STATES.RESOLVED,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.MERCHANT_ACTION_REQUIRED]: [
    CASE_STATES.MERCHANT_RESPONSE_RECEIVED,
    CASE_STATES.ESCALATION_GUIDANCE,
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.RESOLVED,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.MERCHANT_RESPONSE_RECEIVED]: [
    CASE_STATES.REFUND_MONITORING,
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.ESCALATION_GUIDANCE,
    CASE_STATES.RESOLVED,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.REFUND_MONITORING]: [
    CASE_STATES.RESOLVED,
    CASE_STATES.ERROR_REVIEW,
    CASE_STATES.ESCALATION_GUIDANCE,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.ESCALATION_GUIDANCE]: [
    CASE_STATES.INVESTIGATING,
    CASE_STATES.RESOLVED,
    CASE_STATES.ERROR_REVIEW,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.ERROR_REVIEW]: [
    CASE_STATES.INVESTIGATING,
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.ESCALATION_GUIDANCE,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.RESOLVED]: [
    CASE_STATES.REOPENED
  ],
  [CASE_STATES.REOPENED]: [
    CASE_STATES.INVESTIGATING,
    CASE_STATES.NEEDS_INFO,
    CASE_STATES.CLOSED_BY_USER
  ],
  [CASE_STATES.CLOSED_BY_USER]: [
    CASE_STATES.REOPENED
  ]
};

/**
 * Validates whether transition from currentState to nextState is permitted.
 */
export function canTransition(currentState, nextState) {
  if (currentState === nextState) return true;
  const allowed = VALID_TRANSITIONS[currentState];
  return Array.isArray(allowed) && allowed.includes(nextState);
}

/**
 * Safely transitions a case and appends an auditable CaseEvent.
 */
export async function transitionCase(caseId, nextState, { actorType = 'SYSTEM', source = 'SYSTEM_ENGINE', summary, metadata = null } = {}) {
  const currentCase = await prisma.refundCase.findUnique({ where: { id: caseId } });
  if (!currentCase) {
    throw new Error(`Case not found: ${caseId}`);
  }

  if (!canTransition(currentCase.state, nextState)) {
    throw new Error(`Illegal state transition from ${currentCase.state} to ${nextState}`);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.refundCase.update({
      where: { id: caseId },
      data: { state: nextState }
    });

    await tx.caseEvent.create({
      data: {
        caseId,
        eventType: 'STATE_CHANGED',
        actorType,
        source,
        summary: summary || `Case state changed from ${currentCase.state} to ${nextState}`,
        metadataJson: JSON.stringify({
          from: currentCase.state,
          to: nextState,
          ...metadata
        })
      }
    });

    return updated;
  });
}

/**
 * Generate a cryptographically random confirmation token for consequential actions (10m expiry).
 */
export function generateConfirmationToken() {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { token, expiresAt };
}

