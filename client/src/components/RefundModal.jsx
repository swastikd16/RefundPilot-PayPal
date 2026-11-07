import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, X, CheckCircle, Lock } from 'lucide-react';
import { confirmAction } from '../api';

export default function RefundModal({ isOpen, onClose, actionData, caseData, onConfirmed }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !actionData) return null;

  const purchase = caseData.purchaseReferences?.[0];
  const amountStr = purchase ? `$${purchase.amount.toFixed(2)} ${purchase.currency}` : 'Full Amount';

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await confirmAction(caseData.id, actionData.id, actionData.confirmationToken);
      onConfirmed();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px', color: 'var(--accent-green)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2>Authorize PayPal Sandbox Refund</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Two-Phase Consequential Action Guard (SRS §7.3)
              </span>
            </div>
          </div>
          <button className="back-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.5 }}>
          <strong>Safety Guardrail Active:</strong> AI models cannot trigger financial mutation autonomously. This action will issue an API call against PayPal Sandbox for the verified capture below.
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div className="fact-item">
            <span className="label">Target Capture ID</span>
            <span className="val" style={{ color: 'var(--accent-paypal-light)' }}>{purchase?.captureId || 'DEMO-CAP-SONY1000'}</span>
          </div>
          <div className="fact-item">
            <span className="label">Refund Amount</span>
            <span className="val" style={{ color: 'var(--accent-green)', fontSize: '1rem' }}>{amountStr}</span>
          </div>
          <div className="fact-item">
            <span className="label">Authorization Token</span>
            <span className="val" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{actionData.confirmationToken?.substring(0, 16)}...</span>
          </div>
          <div className="fact-item" style={{ borderBottom: 'none' }}>
            <span className="label">Token Expiration</span>
            <span className="val" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>10 minutes (Single Use)</span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={submitting} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <Lock size={15} />
            {submitting ? 'Executing Sandbox Refund...' : 'Confirm & Authorize Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

