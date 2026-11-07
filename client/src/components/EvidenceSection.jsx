import React, { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { uploadEvidence } from '../api';

export default function EvidenceSection({ caseId, evidenceItems = [], onEvidenceUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [evidenceType, setEvidenceType] = useState('PRODUCT_PHOTO');
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large (max 10MB).');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('evidenceType', evidenceType);

      await uploadEvidence(caseId, formData);
      onEvidenceUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={18} style={{ color: 'var(--accent-paypal-light)' }} />
          Evidence Vault ({evidenceItems.length})
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          JPG, PNG, PDF (max 10MB)
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Upload Control */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--card-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select 
            className="form-select" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
          >
            <option value="PRODUCT_PHOTO">Product Defect Photo</option>
            <option value="ORDER_CONFIRMATION">Order / Receipt Proof</option>
            <option value="DELIVERY_DETAIL">Shipping / Courier Label</option>
            <option value="MERCHANT_MESSAGE">Seller Chat Screenshot</option>
          </select>
          <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.4rem 0.85rem', fontSize: '0.8rem', margin: 0 }}>
            <Upload size={14} />
            {uploading ? 'Validating & Uploading...' : 'Upload File'}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp,application/pdf" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Encrypted & stored privately
        </span>
      </div>

      {/* Evidence items list */}
      {evidenceItems.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
          No evidence uploaded yet. Attach photos or receipts to strengthen your refund claim.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {evidenceItems.map((item) => (
            <div key={item.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                {item.mimeType.startsWith('image') ? <ImageIcon size={16} color="var(--accent-paypal-light)" /> : <FileText size={16} />}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.originalName}>
                  {item.originalName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>{item.evidenceType.replace(/_/g, ' ')}</span>
                <span>{(item.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

