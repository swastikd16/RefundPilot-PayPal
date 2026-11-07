import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, ArrowRight, CheckCircle2, 
  Package, AlertTriangle, ShieldAlert, Zap, Headphones, Truck, ShoppingBag
} from 'lucide-react';
import SpeechButton from './SpeechButton';

export default function HomeHero({ onStartIntake, onSelectScenario }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartIntake(prompt);
  };

  const scenarios = [
    {
      id: 'scen-damaged',
      icon: <Headphones size={20} style={{ color: 'var(--accent-paypal-light)' }} />,
      tag: 'DAMAGED_ITEM',
      title: 'Cracked Audio Headphones',
      snippet: 'Sony WH-1000XM5 arrived crushed in transit with broken earcup. Order DEMO-ORD-987654.',
      fullText: 'Sony WH-1000XM5 headphones arrived with a cracked right earcup. The box was crushed in transit. Customer wants a full refund or replacement.',
      captureId: 'DEMO-CAP-SONY1000',
      amount: 399.00
    },
    {
      id: 'scen-missing',
      icon: <Truck size={20} style={{ color: 'var(--accent-amber)' }} />,
      tag: 'NOT_RECEIVED',
      title: 'Package Never Arrived',
      snippet: 'Tracking marked delivered 5 days ago, but courier never showed up. Seller unresponsive.',
      fullText: 'My order of winter jacket was marked as delivered 5 days ago by the courier, but no package was delivered to my address. The seller refuses to refund.',
      captureId: 'DEMO-CAP-JACKET20',
      amount: 149.00
    },
    {
      id: 'scen-wrong',
      icon: <ShoppingBag size={20} style={{ color: 'var(--accent-purple)' }} />,
      tag: 'WRONG_ITEM',
      title: 'Incorrect Model Shipped',
      snippet: 'Ordered mechanical gaming keyboard, received cheap membrane office keyboard.',
      fullText: 'I ordered a mechanical RGB gaming keyboard for $129, but received a basic membrane office keyboard instead. The seller will not authorize a return.',
      captureId: 'DEMO-CAP-KB9900',
      amount: 129.00
    }
  ];

  return (
    <div className="home-hero-container">
      {/* Trust pill */}
      <div className="hero-trust-badge">
        <ShieldCheck size={14} style={{ color: 'var(--accent-green)' }} />
        <span>Grounded Case Orchestration for PayPal Purchases</span>
      </div>

      <h1 className="hero-heading">
        Resolve Purchase Disputes with <span className="gradient-text">Authoritative AI</span>
      </h1>
      <p className="hero-subheading">
        Explain your issue in everyday words. RefundPilot cross-checks your purchase against PayPal records, gathers evidence, drafts seller inquiries, and secures your refund.
      </p>

      {/* Hero Natural Language Intake Bar */}
      <form onSubmit={handleSubmit} className="hero-input-card">
        <div className="hero-input-inner">
          <input
            type="text"
            className="hero-input-field"
            placeholder="e.g. My Sony headphones arrived with a cracked earcup and crushed packaging. Order ID DEMO-ORD-987654..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="hero-input-actions">
            <SpeechButton onTranscript={(txt) => setPrompt((prev) => (prev ? `${prev} ${txt}` : txt))} />
            <button type="submit" className="btn-primary hero-submit-btn" disabled={!prompt.trim()}>
              <span>Analyze & Open Case</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* Value Badges */}
      <div className="hero-stats-row">
        <div className="hero-stat-item">
          <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
          <span>Authoritative PayPal API Status</span>
        </div>
        <div className="hero-stat-item">
          <ShieldAlert size={16} style={{ color: 'var(--accent-amber)' }} />
          <span>Zero Autonomous Financial Moves</span>
        </div>
        <div className="hero-stat-item">
          <Zap size={16} style={{ color: 'var(--accent-paypal-light)' }} />
          <span>Single-Use Cryptographic Auth Tokens</span>
        </div>
      </div>

      {/* Pre-Built Benchmark Scenarios */}
      <div className="hero-scenarios-section">
        <div className="scenarios-header">
          <span className="scenarios-title">
            <Sparkles size={15} style={{ color: 'var(--accent-paypal-light)' }} />
            Quick-Start Purchase Scenarios
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            One-click interactive walkthroughs
          </span>
        </div>

        <div className="scenarios-grid">
          {scenarios.map((scen) => (
            <div 
              key={scen.id} 
              className="scenario-card"
              onClick={() => onSelectScenario(scen)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  {scen.icon}
                </div>
                <span className="scen-tag">{scen.tag}</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                {scen.title}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                {scen.snippet}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--accent-paypal-light)', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
                <span>${scen.amount.toFixed(2)} USD</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Launch Scenario <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

