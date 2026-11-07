import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { draftMerchantMessage, sendMerchantMessage, simulateMerchantResponse } from '../api';

export default function MerchantHub({ caseId, interactions = [], onUpdate }) {
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeDraft, setActiveDraft] = useState('');
  const [activeInteractionId, setActiveInteractionId] = useState(null);
  const [simType, setSimType] = useState('ACCEPTED');
  const [simComment, setSimComment] = useState('We apologize for the damaged item. We approve your refund request.');

  const handleCreateDraft = async () => {
    try {
      setDrafting(true);
      const res = await draftMerchantMessage(caseId);
      setActiveDraft(res.messageBody);
      setActiveInteractionId(res.id);
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrafting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeInteractionId) return;
    try {
      setSending(true);
      await sendMerchantMessage(caseId, {
        interactionId: activeInteractionId,
        messageBody: activeDraft
      });
      setActiveDraft('');
      setActiveInteractionId(null);
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSimulateReply = async () => {
    try {
      await simulateMerchantResponse(caseId, {
        responseType: simType,
        comment: simComment
      });
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} style={{ color: 'var(--accent-paypal-light)' }} />
          Merchant Resolution Hub
        </h3>
        <button 
          className="btn-secondary" 
          onClick={handleCreateDraft} 
          disabled={drafting}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <Sparkles size={14} />
          {drafting ? 'Generating...' : 'AI Draft Inquiry'}
        </button>
      </div>

      {/* Active Draft Review Box */}
      {activeDraft && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-paypal)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-paypal-light)' }}>
              Review & Approve Inquiry to Seller
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Editable before sending
            </span>
          </div>
          <textarea
            className="form-textarea"
            style={{ fontSize: '0.85rem', marginBottom: '0.75rem', minHeight: '90px' }}
            value={activeDraft}
            onChange={(e) => setActiveDraft(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setActiveDraft('')}>
              Discard
            </button>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={handleSendMessage} disabled={sending}>
              <Send size={14} />
              {sending ? 'Dispatching...' : 'Approve & Send to Seller'}
            </button>
          </div>
        </div>
      )}

      {/* Prior Interactions */}
      {interactions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {interactions.map((msg) => (
            <div key={msg.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: msg.responseType ? 'var(--accent-amber)' : 'var(--accent-paypal-light)' }}>
                  {msg.responseType ? `Seller Response [${msg.responseType}]` : `Outbound Message (${msg.status})`}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {msg.sourceType}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                {msg.responseContent || msg.messageBody}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Judge / Demo Sandbox Simulator */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Simulate Merchant Response (Sandbox Evaluation Mode)
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <select 
            className="form-select" 
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            value={simType} 
            onChange={(e) => {
              const val = e.target.value;
              setSimType(val);
              if (val === 'ACCEPTED') setSimComment('We apologize for the damaged item. We approve your refund request.');
              else if (val === 'DECLINED') setSimComment('Item was delivered undamaged according to courier. We decline the refund.');
              else setSimComment('Please provide an unboxing video showing the shipping label and defect.');
            }}
          >
            <option value="ACCEPTED">Merchant: Accept Claim</option>
            <option value="DECLINED">Merchant: Decline Claim</option>
            <option value="MORE_INFO_REQUESTED">Merchant: Request More Evidence</option>
          </select>
          <input 
            type="text" 
            className="form-input" 
            style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} 
            value={simComment} 
            onChange={(e) => setSimComment(e.target.value)} 
          />
          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={handleSimulateReply}>
            Record Reply
          </button>
        </div>
      </div>
    </div>
  );
}

