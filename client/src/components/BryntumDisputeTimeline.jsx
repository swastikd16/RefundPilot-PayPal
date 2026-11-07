import React from 'react';
import { Calendar, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

export default function BryntumDisputeTimeline({ caseData }) {
  const createdAt = new Date(caseData?.createdAt || Date.now());
  const now = new Date();

  // Milestones:
  // 1. Complaint Filed (T0)
  // 2. Merchant 72-Hour Response SLA (T0 + 3 days)
  // 3. Mutual Negotiation Window (T0 + 20 days)
  // 4. PayPal Buyer Protection Window (T0 + 180 days)
  const slaDate = new Date(createdAt.getTime() + 3 * 24 * 3600 * 1000);
  const claimDeadline = new Date(createdAt.getTime() + 180 * 24 * 3600 * 1000);

  const hoursRemainingSLA = Math.max(0, Math.round((slaDate - now) / (1000 * 3600)));
  const daysRemainingClaim = Math.max(0, Math.round((claimDeadline - now) / (1000 * 3600 * 24)));

  return (
    <div className="bryntum-scheduler-card">
      <div className="bryntum-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="bryntum-icon-badge">
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Resolution Timeline & Protection Schedule
              </h4>
              <span className="sponsored-badge">Sponsored: Bryntum</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Interactive Dispute Schedule • 72h Merchant SLA & 180d PayPal Protection
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="sla-badge">
            <Clock size={12} /> {hoursRemainingSLA > 0 ? `${hoursRemainingSLA}h Merchant SLA` : 'SLA Expired'}
          </span>
          <span className="window-badge">
            <ShieldCheck size={12} /> {daysRemainingClaim}d Protection Left
          </span>
        </div>
      </div>

      {/* Gantt / Schedule Bar */}
      <div className="gantt-track-container">
        <div className="gantt-bar-row">
          <div className="gantt-segment segment-sla" style={{ flex: 1 }}>
            <span className="gantt-segment-label">Merchant SLA (72h)</span>
          </div>
          <div className="gantt-segment segment-negotiate" style={{ flex: 2 }}>
            <span className="gantt-segment-label">Amicable Review (20d)</span>
          </div>
          <div className="gantt-segment segment-protection" style={{ flex: 5 }}>
            <span className="gantt-segment-label">PayPal Buyer Protection (180 Days)</span>
          </div>
        </div>

        {/* Milestone points */}
        <div className="gantt-milestones">
          <div className="milestone-point" style={{ left: '0%' }}>
            <div className="milestone-dot active"></div>
            <span className="milestone-text">Intake ({createdAt.toLocaleDateString()})</span>
          </div>
          <div className="milestone-point" style={{ left: '12%' }}>
            <div className="milestone-dot"></div>
            <span className="milestone-text">72h SLA ({slaDate.toLocaleDateString()})</span>
          </div>
          <div className="milestone-point" style={{ left: '100%', transform: 'translateX(-100%)' }}>
            <div className="milestone-dot"></div>
            <span className="milestone-text">180d Deadline ({claimDeadline.toLocaleDateString()})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

