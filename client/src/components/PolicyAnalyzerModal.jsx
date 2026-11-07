import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { analyzePolicy } from '../api';

export default function PolicyAnalyzerModal({ isOpen, onClose, caseId, onAnalyzed }) {
  const [policyText, setPolicyText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!policyText.trim()) return;

    try {
      setAnalyzing(true);
      setError(null);
      const res = await analyzePolicy(caseId, policyText);
      setResult(res);
      if (onAnalyzed) onAnalyzed();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreFillSample = () => {
    setPolicyText(
      `MERCHANT RETURN POLICY:\n1. All physical returns must be initiated within 14 calendar days of delivery.\n2. Items must include photographic evidence if received broken or damaged in transit.\n3. Defective items are eligible for 100% refund or free replacement.\n4. Change of mind returns incur a 15% restocking fee.\n5. Refunds are issued to the original payment method (PayPal) within 3-5 business days.`
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '6px', borderRadius: '8px', color: '#818cf8' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2>Merchant Policy Auto-Triage</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by Gemini 3.5 Flash Lite (SRS §3.5 & FR-040)
              </span>
            </div>
          </div>
          <button className="back-btn" onClick={onClose}>✕</button>
        </div>

        {!result ? (
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ margin: 0 }}>Paste Merchant Policy Excerpt or Terms</label>
                <button
                  type="button"
                  onClick={handlePreFillSample}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-paypal-light)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Sparkles size={12} /> Load Standard Terms
                </button>
              </div>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Paste the seller's return policy or terms from their website..."
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={analyzing}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={analyzing || !policyText.trim()}>
                <Sparkles size={15} />
                {analyzing ? 'Extracting Rules...' : 'Triage Policy Clauses'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle size={16} /> Eligibility Assessment: {result.customerEligibleForReturn ? 'Eligible for Refund' : 'Conditional / Review Required'}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>
                  {result.returnWindowDays ? `${result.returnWindowDays}-Day Window` : 'Window Unspecified'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {result.summary}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Restocking Fee:</strong> {result.restockingFee}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Key Conditions Identified:</span>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {result.conditions?.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={onClose}>
                Done & Apply to Case
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

