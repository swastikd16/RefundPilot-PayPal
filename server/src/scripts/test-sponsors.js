import assert from 'node:assert';
import { lookupProductCatalog } from '../services/channel3.js';
import { searchDisputePrecedents } from '../services/elasticSearch.js';
import { fetchLiveMerchantPolicyWithKernel } from '../services/kernelBrowser.js';
import { dispatchZapierEvent } from '../services/zapierWebhook.js';
import { AstropodsResolutionContainer } from '../agents/astropodsRunner.js';

async function runSponsorChecks() {
  console.log('--- Verifying Sponsor Integrations ---');

  // 1. Channel3 Unified Product Catalog
  const catalog = await lookupProductCatalog('Sony WH-1000XM5 headphones broken');
  assert.strictEqual(catalog.brand, 'Sony', 'Channel3 brand match failed');
  assert.strictEqual(catalog.fragileGoods, true, 'Channel3 fragile status failed');
  console.log('✅ Channel3 catalog lookup verified.');

  // 2. Elastic Vector & Precedent Search
  const precedent = await searchDisputePrecedents('DAMAGED_ITEM', 'Cracked headset band');
  assert.strictEqual(precedent.source, 'ELASTIC_VECTOR_INDEX', 'Elastic source failed');
  assert.ok(precedent.topMatch.id.startsWith('PREC-'), 'Elastic precedent ID invalid');
  console.log('✅ Elastic dispute precedent search verified.');

  // 3. KERNEL Cloud Browser Policy Navigation
  const policy = await fetchLiveMerchantPolicyWithKernel('audio-store.com');
  assert.strictEqual(policy.source, 'KERNEL_CLOUD_BROWSER', 'KERNEL source failed');
  assert.ok(policy.extractedText.includes('14-day window'), 'KERNEL policy text failed');
  console.log('✅ KERNEL cloud browser policy extraction verified.');

  // 4. Zapier Webhook Automation
  const zapier = await dispatchZapierEvent('refund.executed', { caseId: 'test-123', amount: 399.99 });
  assert.strictEqual(zapier.success, true, 'Zapier dispatch failed');
  console.log('✅ Zapier webhook automation verified.');

  // 5. Astropods Multi-Stage Agent Runtime
  const container = new AstropodsResolutionContainer({ id: 'test-case', evidenceItems: [], merchantInteractions: [], state: 'NEW' });
  const plan = container.getExecutionPlan();
  assert.strictEqual(plan.runtime, 'ASTROPODS_AGENT_NATIVE_CONTAINER', 'Astropods runtime signature invalid');
  assert.strictEqual(plan.stages.length, 4, 'Astropods stages count must be 4');
  console.log('✅ Astropods multi-stage agent runtime verified.');

  console.log('🎉 All 5 Backend Sponsor Integrations Verified Successfully!');
}

runSponsorChecks().catch((err) => {
  console.error('Sponsor verification failed:', err);
  process.exit(1);
});

