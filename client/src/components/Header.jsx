import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, PlusCircle, Sun, Moon, RotateCcw } from 'lucide-react';

export default function Header({ onGoHome, onOpenNewCase, onSeedDemo, onReset, seeding, resetting }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('color-scheme', nextTheme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', nextTheme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = nextTheme;
  };

  return (
    <header className="app-header">
      <div 
        className="brand" 
        onClick={onGoHome} 
        style={{ cursor: 'pointer' }}
        title="Go to Home Dashboard"
      >
        <div className="brand-logo">RP</div>
        <div className="brand-text">
          <h1>
            RefundPilot AI <span className="brand-tag">PayPal Dispute Copilot</span>
          </h1>
          <p>Intelligent Refund & Dispute Resolution</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="sandbox-pill">
          <span className="dot"></span>
          <span>PayPal Sandbox Active</span>
        </div>

        {/* Reset Database for Clean Demos */}
        <button 
          className="theme-toggle-btn"
          onClick={onReset}
          disabled={resetting}
          title="Reset all test cases for fresh demo recording"
          aria-label="Reset test database"
        >
          <RotateCcw size={15} className={resetting ? 'spin' : ''} />
        </button>

        {/* Light / Dark Mode Toggle Button */}
        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button 
          className="btn-secondary" 
          onClick={onSeedDemo} 
          disabled={seeding}
          title="Load sample purchase scenario"
        >
          <Sparkles size={16} />
          {seeding ? 'Loading...' : 'Load Sample Case'}
        </button>

        <button className="btn-primary" onClick={onOpenNewCase}>
          <PlusCircle size={16} />
          New Refund Case
        </button>
      </div>
    </header>
  );
}
