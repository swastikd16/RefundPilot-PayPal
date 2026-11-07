import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeHero from './components/HomeHero';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import NewCaseModal from './components/NewCaseModal';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchCases, fetchCase, createCase, seedDemoCase, resetDatabase } from './api';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseData, setSelectedCaseData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadAllCases = async () => {
    try {
      setLoading(true);
      const data = await fetchCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (id) => {
    if (!id || id === 'null' || id === 'undefined') return;
    try {
      const data = await fetchCase(id);
      if (data && data.id) {
        setSelectedCaseData(data);
        setSelectedCaseId(id);
      }
    } catch (err) {
      console.error('Error fetching case detail:', err);
      setSelectedCaseId(null);
      setSelectedCaseData(null);
    }
  };

  const navigateToCase = (id, pushState = true) => {
    loadCaseDetails(id);
    if (pushState) {
      window.history.pushState({ caseId: id }, '', `?case=${id}`);
    }
  };

  const navigateToHome = (pushState = true) => {
    setSelectedCaseId(null);
    setSelectedCaseData(null);
    if (pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
    loadAllCases();
  };

  useEffect(() => {
    loadAllCases();

    // Check if initial URL has ?case=...
    const params = new URLSearchParams(window.location.search);
    const initialCase = params.get('case');
    if (initialCase) {
      loadCaseDetails(initialCase);
    }

    // Support browser / mouse back and forward button navigation
    const handlePopState = (event) => {
      const caseId = event.state?.caseId;
      if (caseId) {
        loadCaseDetails(caseId);
      } else {
        const queryParams = new URLSearchParams(window.location.search);
        const queryCase = queryParams.get('case');
        if (queryCase) {
          loadCaseDetails(queryCase);
        } else {
          setSelectedCaseId(null);
          setSelectedCaseData(null);
          loadAllCases();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCreateCase = async (formData) => {
    try {
      setSubmitting(true);
      const newCase = await createCase(formData);
      setIsModalOpen(false);
      await loadAllCases();
      navigateToCase(newCase.id);
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
        navigateToCase(res.caseId);
      }
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all case data back to empty state for a fresh demo run?')) return;
    try {
      setResetting(true);
      await resetDatabase();
      navigateToHome();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <Header
        onGoHome={() => navigateToHome()}
        onOpenNewCase={() => setIsModalOpen(true)}
        onSeedDemo={handleSeedDemo}
        onReset={handleResetData}
        seeding={seeding}
        resetting={resetting}
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
                if (window.history.state?.caseId) {
                  window.history.back();
                } else {
                  navigateToHome();
                }
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
                  onSelectCase={(id) => navigateToCase(id)}
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

