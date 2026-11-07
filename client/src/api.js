const API_BASE = '/api';

export async function fetchCases() {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Failed to load cases');
  return res.json();
}

export async function fetchCase(id) {
  const res = await fetch(`${API_BASE}/cases/${id}`);
  if (!res.ok) throw new Error('Failed to load case');
  return res.json();
}

export async function createCase(data) {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create case' }));
    throw new Error(err.error || 'Failed to create case');
  }
  return res.json();
}

export async function updateCase(id, data) {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update case');
  return res.json();
}

export async function uploadEvidence(caseId, formData) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload evidence');
  return res.json();
}

export async function draftMerchantMessage(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/merchant-message/draft`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to draft message');
  return res.json();
}

export async function sendMerchantMessage(caseId, { interactionId, messageBody }) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/merchant-message/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interactionId, messageBody })
  });
  if (!res.ok) throw new Error('Failed to send merchant message');
  return res.json();
}

export async function simulateMerchantResponse(caseId, { responseType, comment }) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/merchant-response/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responseType, comment })
  });
  if (!res.ok) throw new Error('Failed to simulate response');
  return res.json();
}

export async function proposeAction(caseId, actionType = 'INITIATE_REFUND') {
  const res = await fetch(`${API_BASE}/cases/${caseId}/actions/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType })
  });
  if (!res.ok) throw new Error('Failed to propose action');
  return res.json();
}

export async function confirmAction(caseId, actionId, token) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/actions/${actionId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Confirmation failed' }));
    throw new Error(err.error || 'Confirmation failed');
  }
  return res.json();
}

export async function refreshPaymentStatus(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/refresh`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to refresh status');
  return res.json();
}

export async function analyzePolicy(caseId, policyText) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/policy-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policyText })
  });
  if (!res.ok) throw new Error('Policy analysis failed');
  return res.json();
}

export async function exportDisputePacket(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/export-packet`);
  if (!res.ok) throw new Error('Failed to export dispute packet');
  return res.json();
}

export async function seedDemoCase() {
  const res = await fetch(`${API_BASE}/demo/seed`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed demo case');
  return res.json();
}

