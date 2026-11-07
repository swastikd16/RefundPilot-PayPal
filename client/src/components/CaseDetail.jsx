import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, 
  Sparkles, ExternalLink, ShieldAlert, XCircle, DollarSign, Lock, Download, BookOpen
} from 'lucide-react';
import EvidenceSection from './EvidenceSection';
import MerchantHub from './MerchantHub';
import Timeline from './Timeline';
import RefundModal from './RefundModal';
import PolicyAnalyzerModal from './PolicyAnalyzerModal';
import DisputeEscalatorGuide from './DisputeEscalatorGuide';
import StepProgress from './StepProgress';
import BryntumDisputeTimeline from './BryntumDisputeTimeline';
import AstropodsLifecycleViewer from './AstropodsLifecycleViewer';
import { proposeAction, updateCase, refreshPaymentStatus, exportDisputePacket } from '../api';

export default function CaseDetail({ caseData, onBack, onRefresh }) {
  const [proposing, setProposing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportPacket = async () => {
    try {
      setExporting(true);
      const res = await exportDisputePacket(caseData.id);
      const blob = new Blob([res.packet], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || `Dispute-Packet-${caseData.id.substring(0, 8)}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const analysis = caseData.aiAnalyses?.[0];
  const purchase = caseData.purchaseReferences?.[0];
  const payment = caseData.paymentSnapshots?.[0];

  const verifiedFacts = analysis ? JSON.parse(analysis.verifiedFactsJson || '[]') : [];
  const customerClaims = analysis ? JSON.parse(analysis.customerClaimsJson || '[]') : [caseData.complaintText];
  const missingFacts = analysis ? JSON.parse(analysis.missingFactsJson || '[]') : [];
  const policyFindings = analysis ? JSON.parse(analysis.policyFindingsJson || '[]') : [];

  const handleProposeRefund = async () => {
    try {
      setProposing(true);
      const action = await proposeAction(caseData.id, 'INITIATE_REFUND');
      setActiveAction(action);
      setShowRefundModal(true);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setProposing(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      await refreshPaymentStatus(caseData.id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseCase = async () => {
    if (!window.confirm('Close this case? (Note: Closing a case does not imply a refund was issued).')) return;
    try {
      await updateCase(caseData.id, { state: 'CLOSED_BY_USER' });
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header card */}
      <div className="case-header-card">
        <div className="case-header-nav">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowPolicyModal(true)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              title="Analyze merchant return policy clauses"
            >
              <BookOpen size={14} />
              Policy Analyzer
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleExportPacket}
              disabled={exporting}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              title="Download formal Markdown evidence packet for PayPal Resolution Center"
            >
              <Download size={14} />
              {exporting ? 'Generating...' : 'Export Dispute Packet'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleRefreshStatus} 
              disabled={refreshing}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync PayPal State'}
            </button>
            {caseData.state !== 'CLOSED_BY_USER' && caseData.state !== 'RESOLVED' && (
              <button 
                className="btn-secondary" 
                onClick={handleCloseCase}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
              >
                <XCircle size={14} />
                Close Case
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="case-id-badge">CASE #{caseData.id}</span>
              <span className={`state-badge state-${caseData.state}`}>
                {caseData.state.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Opened {new Date(caseData.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              Issue: {caseData.issueType.replace(/_/g, ' ')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Goal: {caseData.requestedOutcome} • User: {caseData.userId}
            </p>
          </div>

          {/* Action Trigger Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {caseData.state === 'RESOLVED' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--accent-green)', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Refund Settled via PayPal Sandbox
              </div>
            ) : caseData.state === 'ESCALATION_GUIDANCE' ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={16} /> PayPal Resolution Center Escalation Active
              </div>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleProposeRefund}
                disabled={proposing}
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Lock size={15} />
                {proposing ? 'Preparing Confirmation...' : 'Execute PayPal Sandbox Refund'}
              </button>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Requires Two-Phase Expiring Confirmation Token
            </span>
          </div>
        </div>

        {/* 4-Step Resolution Progress Stepper */}
        <StepProgress currentState={caseData.state} />

        {/* Bryntum Resolution Timeline & SLA Scheduler */}
        <BryntumDisputeTimeline caseData={caseData} />

        {/* Astropods Autonomous Agent Lifecycle Container */}
        <AstropodsLifecycleViewer caseId={caseData.id} />
      </div>

      {/* Tri-Color Grounding Container */}
      <div className="grounding-grid">
        {/* 1. Verified PayPal Facts */}
        <div className="grounding-box box-verified">
          <div className="box-title">
            <CheckCircle2 size={16} />
            Verified Facts (PayPal API)
          </div>
          <div className="fact-item">
            <span className="label">Capture ID</span>
            <span className="val">{purchase?.captureId || 'Unlinked'}</span>
          </div>
          <div className="fact-item">
            <span className="label">Payment Status</span>
            <span className="val" style={{ color: payment?.status === 'REFUNDED' ? 'var(--accent-green)' : 'var(--text-main)' }}>
              {payment?.status || 'UNKNOWN'}
            </span>
          </div>
          <div className="fact-item">
            <span className="label">Captured Amount</span>
            <span className="val">${purchase?.amount?.toFixed(2) || '0.00'} {purchase?.currency}</span>
          </div>
          <div className="fact-item" style={{ borderBottom: 'none' }}>
            <span className="label">Source Type</span>
            <span className="val" style={{ fontSize: '0.75rem' }}>{purchase?.sourceType || 'DEMO_FIXTURE'}</span>
          </div>
        </div>

        {/* 2. Customer Claims */}
        <div className="grounding-box box-claims">
          <div className="box-title">
            <AlertTriangle size={16} />
            Customer Claims (Unverified)
          </div>
          <ul style={{ paddingLeft: '1.1rem', margin: '0.25rem 0 0.75rem 0', lineHeight: 1.4 }}>
            {customerClaims.map((claim, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>{claim}</li>
            ))}
          </ul>
          {missingFacts.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-amber)' }}>
                Required Missing Evidence:
              </span>
              <ul style={{ paddingLeft: '1.1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                {missingFacts.map((mf, idx) => (
                  <li key={idx}>{mf}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3. AI Guidance & Policy Rules */}
        <div className="grounding-box box-guidance">
          <div className="box-title">
            <Sparkles size={16} />
            AI Guidance & Policy Checks
          </div>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '0.5rem' }}>
            <strong>Recommendation:</strong> {analysis?.recommendedAction?.replace(/_/g, ' ') || 'PREPARE MERCHANT REQUEST'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
            {analysis?.rationale || 'Contact seller with evidence before initiating dispute.'}
          </p>
          {policyFindings.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)', paddingTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>Policy Notes:</strong>
              <ul style={{ paddingLeft: '1.1rem', marginTop: '0.2rem' }}>
                {policyFindings.map((pf, idx) => <li key={idx}>{pf}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="case-detail-layout">
        <div>
          {/* Dispute Escalator Guide when Merchant declines or case escalates */}
          {(caseData.state === 'ESCALATION_GUIDANCE' || caseData.state === 'MERCHANT_RESPONSE_RECEIVED') && (
            <DisputeEscalatorGuide caseData={caseData} />
          )}

          {/* Evidence Vault */}
          <EvidenceSection
            caseId={caseData.id}
            evidenceItems={caseData.evidenceItems}
            onEvidenceUploaded={onRefresh}
          />

          {/* Merchant Hub */}
          <MerchantHub
            caseId={caseData.id}
            interactions={caseData.merchantInteractions}
            onUpdate={onRefresh}
          />
        </div>

        <div>
          {/* Audit Timeline */}
          <Timeline events={caseData.events} />
        </div>
      </div>

      {/* Policy Analyzer Modal */}
      <PolicyAnalyzerModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        caseId={caseData.id}
        onAnalyzed={onRefresh}
      />

      {/* Refund Consequential Action Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        actionData={activeAction}
        caseData={caseData}
        onConfirmed={() => {
          onRefresh();
        }}
      />
    </div>
  );
}

