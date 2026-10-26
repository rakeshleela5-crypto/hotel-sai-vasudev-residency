import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[HotelErrorBoundary] Caught unhandled React error:', error, errorInfo);
    this.setState({ errorInfo });
    try {
      (window as any).__LAST_REACT_ERROR__ = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
    } catch {}
  }

  private handleClearStorage = (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch {}
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleOpenErp = (): void => {
    window.location.href = '/erp';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a111e 0%, #101c31 100%)',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              padding: '36px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f2d77a, #d4af37)',
                color: '#0a111e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                fontFamily: 'serif',
                boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
              }}
            >
              SV
            </div>

            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#fae084',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}
            >
              HOTEL SAI VASUDEV RESIDENCY
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              System Self-Recovery &amp; Diagnostic Guard
            </p>

            <div
              style={{
                background: '#1e293b',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                borderLeft: '4px solid #ef4444',
                fontSize: '13px',
                color: '#e2e8f0',
                wordBreak: 'break-word',
              }}
            >
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                Detected Runtime Notice:
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                {this.state.error?.message || 'Unexpected state encountered during render.'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={this.handleClearStorage}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#0f172a',
                  border: 'none',
                  padding: '13px 20px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                }}
              >
                <span>🧹</span>
                <span>Reset Local Cache &amp; Reload (Recommended)</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={this.handleReload}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Reload Page
                </button>

                <button
                  type="button"
                  onClick={this.handleOpenErp}
                  style={{
                    flex: 1,
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🛎️ Open ERP Front Desk
                </button>
              </div>
            </div>

            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '24px' }}>
              Front Desk Hotline: +91 94402 89999 &bull; Shirdi VIP Road
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
