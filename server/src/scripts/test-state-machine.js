import assert from 'assert';
import { CASE_STATES, canTransition, generateConfirmationToken } from '../engine/stateMachine.js';
import { evaluatePolicy } from '../engine/policyRules.js';

console.log('--- Testing Deterministic State Machine & Policy Rules ---');

// 1. Verify valid transitions
assert.strictEqual(canTransition(CASE_STATES.NEW, CASE_STATES.INVESTIGATING), true, 'NEW -> INVESTIGATING should be valid');
assert.strictEqual(canTransition(CASE_STATES.INVESTIGATING, CASE_STATES.MERCHANT_ACTION_REQUIRED), true, 'INVESTIGATING -> MERCHANT_ACTION_REQUIRED should be valid');
assert.strictEqual(canTransition(CASE_STATES.MERCHANT_ACTION_REQUIRED, CASE_STATES.MERCHANT_RESPONSE_RECEIVED), true, 'MERCHANT_ACTION_REQUIRED -> MERCHANT_RESPONSE_RECEIVED should be valid');
assert.strictEqual(canTransition(CASE_STATES.MERCHANT_RESPONSE_RECEIVED, CASE_STATES.RESOLVED), true, 'MERCHANT_RESPONSE_RECEIVED -> RESOLVED should be valid');

// 2. Verify illegal transitions are blocked (BR-10: AI cannot override state transitions)
assert.strictEqual(canTransition(CASE_STATES.NEW, CASE_STATES.RESOLVED), false, 'NEW -> RESOLVED must be illegal');
assert.strictEqual(canTransition(CASE_STATES.NEW, CASE_STATES.REFUND_MONITORING), false, 'NEW -> REFUND_MONITORING must be illegal');
assert.strictEqual(canTransition(CASE_STATES.CLOSED_BY_USER, CASE_STATES.RESOLVED), false, 'CLOSED_BY_USER -> RESOLVED must be illegal');
console.log('✅ State transition rules verified: illegal bypass transitions are blocked.');

// 3. Verify Confirmation Token generation
const tokenObj = generateConfirmationToken();
assert.ok(tokenObj.token && tokenObj.token.length >= 32, 'Confirmation token must be a secure hash');
assert.ok(tokenObj.expiresAt > new Date(), 'Token expiration must be in the future');
console.log('✅ Consequential action confirmation token generation verified.');

// 4. Verify Policy Evaluator
const damagedItemCase = {
  complaintText: 'Screen is cracked',
  issueType: 'DAMAGED_ITEM',
  evidenceItems: [], // No photos uploaded yet
  purchaseReferences: [],
  merchantInteractions: []
};

const evaluation = evaluatePolicy(damagedItemCase);
assert.ok(evaluation.missingFacts.includes('Product photo showing defect/damage'), 'Should flag missing photo for damaged item');
assert.strictEqual(evaluation.recommendedAction, 'PREPARE_MERCHANT_REQUEST', 'Default first action should be merchant inquiry');
assert.ok(evaluation.safetyFlags.includes('REFUND_NOT_CONFIRMED'), 'Must include REFUND_NOT_CONFIRMED safety flag');
console.log('✅ Policy rules evaluation verified: detects missing evidence and enforces safety flags.');

console.log('--- All Unit Verifications Passed Successfully ---');

