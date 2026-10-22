import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAuth = () => {
    try {
      sessionStorage.removeItem('drift_auth');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#F6F5EF',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid #E3E7DD',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 36px rgba(36, 51, 47, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#FFF1F2',
              color: '#F43F5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.15)'
            }}>
              <AlertCircle size={28} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#24332F', marginBottom: '8px' }}>
              Interface Display Recovery
            </h2>
            <p style={{ fontSize: '13.5px', color: '#63736B', lineHeight: '1.6', marginBottom: '24px' }}>
              A temporary display hitch occurred while rendering your wellness view. Your student data is completely safe.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)'
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAuth}
                style={{
                  background: '#FFFFFF',
                  color: '#63736B',
                  border: '1px solid #E3E7DD',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={15} />
                <span>Back to Sign In</span>
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left', fontSize: '11px', color: '#84938B', background: '#FAFBF9', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E3E7DD' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Diagnostic Details</summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#E11D48' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
