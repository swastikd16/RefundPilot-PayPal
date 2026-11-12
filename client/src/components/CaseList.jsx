import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Clock, CheckCircle2, ShieldAlert, LayoutGrid, Table } from 'lucide-react';
import CaseLedgerGrid from './CaseLedgerGrid';

export default function CaseList({ cases, onSelectCase, onOpenNewCase }) {
  const [viewMode, setViewMode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('view') === 'grid' ? 'grid' : 'cards';
    } catch (e) {
      return 'cards';
    }
  }); // 'cards' | 'grid'
  const caseList = Array.isArray(cases) ? cases : [];

  if (caseList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
        <ShieldAlert size={48} style={{ color: 'var(--accent-paypal-light)', marginBottom: '1rem' }} />
        <h2>No refund cases created yet</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem 0' }}>
          File a new complaint in natural language, or click "Load Sample Case" above to start an interactive walkthrough.
        </p>
        <button className="btn-primary" onClick={onOpenNewCase} style={{ margin: '0 auto' }}>
          Create First Case
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Active Resolution Cases</h2>
          <p>Track complaints, verified PayPal transaction snapshots, and guided escalations.</p>
        </div>

        {/* View Switcher: Cards vs AG Grid Ledger */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Card View"
          >
            <LayoutGrid size={15} /> Cards
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="AG Grid Audit Ledger View"
          >
            <Table size={15} /> AG Grid Ledger
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <CaseLedgerGrid cases={caseList} onSelectCase={onSelectCase} />
      ) : (
        <div className="cases-grid">
        {caseList.map((c) => {
          const purchase = c.purchaseReferences?.[0];
          const payment = c.paymentSnapshots?.[0];
          const amountDisplay = purchase?.amount ? `$${purchase.amount.toFixed(2)} ${purchase.currency}` : 'Amount Unknown';

          return (
            <div key={c.id} className="case-card" onClick={() => onSelectCase(c.id)}>
              <div>
                <div className="card-top">
                  <span className="case-id-badge">ID: {c.id.substring(0, 8)}...</span>
                  <span className={`state-badge state-${c.state}`}>
                    {c.state.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-paypal-light)', background: 'rgba(0, 207, 222, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {c.issueType}
                  </span>
                  {purchase?.sourceType && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      • {purchase.sourceType}
                    </span>
                  )}
                </div>

                <p className="card-complaint">"{c.complaintText}"</p>
              </div>

              <div className="card-meta">
                <span className="meta-amount">{amountDisplay}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Open Details <ArrowRight size={14} />
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

