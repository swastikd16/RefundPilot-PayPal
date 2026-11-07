import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, ChevronDown, ChevronUp, Bot, CheckCircle2, Clock } from 'lucide-react';
import { getAstropodsPlan } from '../api';

export default function AstropodsLifecycleViewer({ caseId }) {
  const [plan, setPlan] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (caseId) {
      getAstropodsPlan(caseId)
        .then(setPlan)
        .catch(() => {
          // ponytail: non-blocking graceful fallback
        });
    }
  }, [caseId]);

  if (!plan) return null;

  return (
    <div style={{
      background: 'rgba(99, 102, 241, 0.04)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      marginBottom: '1.25rem'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '5px', borderRadius: '6px', color: '#818cf8', display: 'flex' }}>
            <Cpu size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Astropods Agent Runtime Container
              </span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '1px 6px', borderRadius: '4px' }}>
                {plan.containerId}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Multi-Stage Autonomous Pipeline: Intake → Evidence Audit → Merchant Liaison → PayPal Settlement
            </div>
          </div>
        </div>

        <button 
          type="button" 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
            {plan.stages.map((stage, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.03em' }}>
                    {idx + 1}. {stage.name}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: stage.status === 'COMPLETED' || stage.status === 'EXECUTED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                    color: stage.status === 'COMPLETED' || stage.status === 'EXECUTED' ? 'var(--accent-green)' : '#eab308'
                  }}>
                    {stage.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-paypal-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Bot size={11} /> {stage.agent}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Tools: {stage.tools.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
