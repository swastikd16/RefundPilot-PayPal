import React from 'react';
import { ShieldAlert, ExternalLink, CheckSquare, FileText, ArrowRight } from 'lucide-react';

export default function DisputeEscalatorGuide({ caseData }) {
  const purchase = caseData.purchaseReferences?.[0];
  const orderId = purchase?.orderId || purchase?.captureId || 'DEMO-ORD-987654';

  const steps = [
    {
      step: 1,
      title: 'Open PayPal Resolution Center',
      desc: 'Log in to your PayPal account and visit the Resolution Center.',
      actionText: 'Go to Resolution Center',
      url: 'https://www.paypal.com/disputes/'
    },
    {
      step: 2,
      title: 'Select Report a Problem',
      desc: `Locate transaction reference ${orderId} in your activity list and choose "Report a Problem".`
    },
    {
      step: 3,
      title: 'Choose Dispute Reason',
      desc: caseData.issueType === 'NOT_RECEIVED'
        ? 'Select: "I didn’t receive an item I purchased".'
        : 'Select: "The item I received was significantly not as described or arrived damaged".'
    },
    {
      step: 4,
      title: 'Upload RefundPilot Evidence Packet',
      desc: 'Attach the exported Dispute Packet and your uploaded photos showing the unboxing/defect.'
    }
  ];

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '8px', color: '#f87171' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f87171' }}>
              PayPal Resolution Center Escalator Guide
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Official PayPal Buyer Protection (180-Day Window)
            </span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        Since direct merchant negotiation was declined or unfulfilled, you can formally request PayPal intervention under <strong>PayPal Buyer Protection</strong>. Follow the verified steps below:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((s) => (
          <div key={s.step} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(0, 112, 186, 0.15)', color: 'var(--accent-paypal-light)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
              {s.step}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                {s.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {s.desc}
              </p>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-paypal-light)', marginTop: '0.35rem', textDecoration: 'none', fontWeight: 500 }}
                >
                  {s.actionText} <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

