import React, { useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Download, Search, Table, ArrowRight } from 'lucide-react';

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function CaseLedgerGrid({ cases = [], onSelectCase }) {
  const gridRef = useRef(null);
  const [quickFilterText, setQuickFilterText] = useState('');

  const rowData = useMemo(() => {
    return cases.map((c) => {
      const purchase = c.purchaseReferences?.[0];
      const payment = c.paymentSnapshots?.[0];
      return {
        id: c.id,
        shortId: c.id.substring(0, 10),
        complaintText: c.complaintText,
        issueType: c.issueType,
        state: c.state,
        amount: purchase?.amount ? `$${purchase.amount.toFixed(2)}` : '$0.00',
        currency: purchase?.currency || 'USD',
        captureId: purchase?.captureId || 'Unlinked',
        status: payment?.status || 'UNKNOWN',
        sourceType: purchase?.sourceType || 'PAYPAL_SANDBOX',
        createdAt: new Date(c.createdAt).toLocaleDateString()
      };
    });
  }, [cases]);

  const columnDefs = useMemo(() => [
    {
      field: 'shortId',
      headerName: 'Case ID',
      width: 140,
      cellRenderer: (p) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-paypal-light)' }}>
          {p.value}...
        </span>
      )
    },
    {
      field: 'issueType',
      headerName: 'Issue Type',
      width: 160,
      filter: true,
      cellRenderer: (p) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0, 207, 222, 0.1)', color: 'var(--accent-paypal-light)', padding: '2px 8px', borderRadius: '4px' }}>
          {p.value}
        </span>
      )
    },
    {
      field: 'state',
      headerName: 'Resolution State',
      width: 180,
      filter: true,
      cellRenderer: (p) => (
        <span className={`state-badge state-${p.value}`} style={{ fontSize: '0.7rem' }}>
          {p.value.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      cellRenderer: (p) => (
        <span style={{ fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
          {p.value}
        </span>
      )
    },
    {
      field: 'captureId',
      headerName: 'PayPal Capture ID',
      width: 200,
      cellRenderer: (p) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          {p.value}
        </span>
      )
    },
    {
      field: 'status',
      headerName: 'PayPal State',
      width: 140
    },
    {
      field: 'createdAt',
      headerName: 'Opened Date',
      width: 130
    },
    {
      headerName: 'Action',
      width: 120,
      cellRenderer: (p) => (
        <button
          className="btn-secondary"
          onClick={() => onSelectCase(p.data.id)}
          style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        >
          Open <ArrowRight size={11} />
        </button>
      )
    }
  ], [onSelectCase]);

  const exportCsv = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `RefundPilot-Dispute-Ledger-${new Date().toISOString().slice(0, 10)}.csv`
    });
  };

  return (
    <div className="ag-grid-wrapper">
      <div className="ag-grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '380px' }}>
          <div className="search-box">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter dispute records..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="quick-filter-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Powered by AG Grid Community
          </span>
          <button className="btn-secondary" onClick={exportCsv} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ height: '360px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          domLayout="autoHeight"
          rowSelection="single"
          onRowClicked={(event) => {
            if (event.data?.id) onSelectCase(event.data.id);
          }}
        />
      </div>
    </div>
  );
}
