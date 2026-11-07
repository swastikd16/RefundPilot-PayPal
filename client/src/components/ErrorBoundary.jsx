import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', margin: '2rem', border: '1px solid var(--accent-red)' }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>Something went wrong rendering this view</h2>
          <pre style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', textAlign: 'left', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button 
            className="btn-primary" 
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: '1rem' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

