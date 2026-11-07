import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeHero from './components/HomeHero';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import NewCaseModal from './components/NewCaseModal';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchCases, fetchCase, createCase, seedDemoCase } from './api';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseData, setSelectedCaseData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadAllCases = async () => {
    try {
      setLoading(true);
      const data = await fetchCases();
      setCases(data);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (id) => {
    try {
      const data = await fetchCase(id);
      setSelectedCaseData(data);
      setSelectedCaseId(id);
    } catch (err) {
      console.error('Error fetching case detail:', err);
    }
  };

  useEffect(() => {
    loadAllCases();
  }, []);

  const handleCreateCase = async (formData) => {
    try {
      setSubmitting(true);
      const newCase = await createCase(formData);
      setIsModalOpen(false);
      await loadAllCases();
      await loadCaseDetails(newCase.id);
    } catch (err) {
      alert(`Failed to create case: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const res = await seedDemoCase();
      await loadAllCases();
      if (res.caseId) {
        await loadCaseDetails(res.caseId);
      }
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <Header
        onOpenNewCase={() => setIsModalOpen(true)}
        onSeedDemo={handleSeedDemo}
        seeding={seeding}
      />

      <main className="app-container">
        <ErrorBoundary>
          {submitting && (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--accent-paypal)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <div className="dot pulse-red" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-paypal-light)' }}></div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>RefundPilot AI is analyzing your complaint and querying PayPal Sandbox...</span>
            </div>
          )}

          {selectedCaseId && selectedCaseData ? (
            <CaseDetail
              caseData={selectedCaseData}
              onBack={() => {
                setSelectedCaseId(null);
                setSelectedCaseData(null);
                loadAllCases();
              }}
              onRefresh={() => loadCaseDetails(selectedCaseId)}
            />
          ) : (
            <div>
              <HomeHero
                onStartIntake={(promptText) => {
                  handleCreateCase({ complaintText: promptText });
                }}
                onSelectScenario={(scen) => {
                  handleCreateCase({
                    complaintText: scen.fullText,
                    captureId: scen.captureId,
                    amount: scen.amount,
                    currency: 'USD'
                  });
                }}
              />
              <div style={{ marginTop: '2.5rem' }}>
                <CaseList
                  cases={cases}
                  onSelectCase={(id) => loadCaseDetails(id)}
                  onOpenNewCase={() => setIsModalOpen(true)}
                />
              </div>
            </div>
          )}
        </ErrorBoundary>
      </main>

      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCase}
        submitting={submitting}
      />
    </div>
  );
}

