import React from 'react';

interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', gap: 16, fontFamily: 'sans-serif', background: '#0a0c14',
        }}>
          <p style={{ fontSize: '2.5rem', margin: 0 }}>😕</p>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontWeight: 800 }}>Something went wrong</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#38bdf8', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
