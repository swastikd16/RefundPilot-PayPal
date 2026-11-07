import React from 'react';
import { Clock, Shield, User, Bot, Building2, CreditCard } from 'lucide-react';

const getActorIcon = (actor) => {
  switch (actor) {
    case 'CUSTOMER': return <User size={13} style={{ color: '#38bdf8' }} />;
    case 'AI_AGENT': return <Bot size={13} style={{ color: '#c084fc' }} />;
    case 'MERCHANT': return <Building2 size={13} style={{ color: '#fb923c' }} />;
    case 'PAYPAL_API': return <CreditCard size={13} style={{ color: '#4ade80' }} />;
    default: return <Shield size={13} style={{ color: '#94a3b8' }} />;
  }
};

export default function Timeline({ events = [] }) {
  return (
    <div className="timeline-card">
      <h3>
        <Clock size={18} style={{ color: 'var(--accent-paypal-light)' }} />
        Case History & Audit Trail ({events.length})
      </h3>

      {events.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No events logged yet.</p>
      ) : (
        <div className="timeline-list">
          {events.map((evt) => {
            const dateStr = new Date(evt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={evt.id} className="timeline-item">
                <div className="timeline-node" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="actor-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {getActorIcon(evt.actorType)}
                      {evt.actorType}
                    </span>
                    <span>{dateStr}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0.2rem 0' }}>
                    {evt.summary}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Source: {evt.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

