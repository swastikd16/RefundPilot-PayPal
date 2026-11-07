import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import SpeechButton from './SpeechButton';

export default function NewCaseModal({ isOpen, onClose, onSubmit, submitting }) {
  const [complaintText, setComplaintText] = useState('');
  const [captureId, setCaptureId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    onSubmit({
      complaintText,
      captureId: captureId.trim() || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      currency
    });
  };

  const handlePreFill = () => {
    setComplaintText('Sony WH-1000XM5 headphones arrived with a cracked right earcup. The package was crushed during delivery. Merchant hasn\'t responded in 3 days. I want a full refund.');
    setCaptureId('DEMO-CAP-SONY1000');
    setAmount('399.00');
    setCurrency('USD');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2>Open New Refund Case</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Explain what happened in natural language. RefundPilot AI will classify the issue and cross-reference your PayPal purchase.
            </p>
          </div>
          <button className="back-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ margin: 0 }}>Natural Language Complaint *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SpeechButton onTranscript={(txt) => setComplaintText((prev) => (prev ? `${prev} ${txt}` : txt))} />
                <button 
                  type="button" 
                  onClick={handlePreFill}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-paypal-light)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Sparkles size={12} /> Auto-fill Sample
                </button>
              </div>
            </div>
            <textarea
              className="form-textarea"
              placeholder="e.g. My order arrived with severe physical damage. The right earcup is broken and the seller hasn't replied to my messages. I would like a refund."
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>PayPal Capture / Transaction ID (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DEMO-CAP-SONY1000 or 9AB..."
                value={captureId}
                onChange={(e) => setCaptureId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount & Currency (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="399.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <select 
                  className="form-select" 
                  style={{ width: '90px' }}
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !complaintText.trim()}>
              <Send size={16} />
              {submitting ? 'Analyzing & Filing Case...' : 'Analyze & Open Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

