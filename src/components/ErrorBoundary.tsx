import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
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
    console.error(`[HotelErrorBoundary${this.props.moduleName ? ` - ${this.props.moduleName}` : ''}] Caught unhandled React error:`, error, errorInfo);
    this.setState({ errorInfo });
    try {
      (window as any).__LAST_REACT_ERROR__ = {
        module: this.props.moduleName || 'Root',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      };
    } catch {}

    // Dispatch to Sentry when VITE_SENTRY_DSN is configured
    try {
      const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
      if (dsn) {
        Sentry.captureException(error, {
          extra: {
            module: this.props.moduleName || 'Root Application',
            componentStack: errorInfo.componentStack
          }
        });
      }
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
    window.location.href = '/erp';
  };

  private handleReloadApplication = (): void => {
    window.location.reload();
  };

  private handleReturnToFrontDesk = (): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {}
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/erp';
  };

  private handleRetryModule = (): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {}
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const isInlineModule = Boolean(this.props.moduleName);

      return (
        <div
          style={{
            minHeight: isInlineModule ? '380px' : '100vh',
            background: isInlineModule ? 'transparent' : 'linear-gradient(135deg, #0a111e 0%, #101c31 100%)',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            width: '100%'
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              padding: '32px 28px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                margin: '0 auto 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f2d77a, #d4af37)',
                color: '#0a111e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 900,
                fontFamily: 'serif',
                boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
              }}
            >
              SV
            </div>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#fae084',
                marginBottom: '4px',
                letterSpacing: '0.5px',
              }}
            >
              HOTEL SAI VASUDEV RESIDENCY
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
              {this.props.moduleName ? `${this.props.moduleName} • Self-Recovery Guard` : 'System Self-Recovery & Diagnostic Guard'}
            </p>

            <div
              style={{
                background: '#1e293b',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '20px',
                textAlign: 'left',
                borderLeft: '4px solid #ef4444',
                fontSize: '13px',
                color: '#e2e8f0',
                wordBreak: 'break-word',
              }}
            >
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Detected Runtime Notice:</span>
                {this.props.moduleName && (
                  <span style={{ fontSize: '11px', background: '#334155', padding: '1px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                    {this.props.moduleName}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                {this.state.error?.message || 'Unexpected state encountered during render.'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="error-boundary-reload-btn"
                  onClick={this.handleReloadApplication}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  🔄 Reload Application
                </button>

                <button
                  type="button"
                  id="error-boundary-frontdesk-btn"
                  onClick={this.handleReturnToFrontDesk}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  🛎️ Return to Front Desk Home
                </button>
              </div>

              {isInlineModule && (
                <button
                  type="button"
                  onClick={this.handleRetryModule}
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Try Reopening {this.props.moduleName}
                </button>
              )}

              <button
                type="button"
                onClick={this.handleClearStorage}
                style={{
                  background: 'transparent',
                  color: '#fbbf24',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                🧹 Reset Local Cache &amp; Reload (Safe Clean)
              </button>
            </div>

            <p style={{ color: '#64748b', fontSize: '11px', marginTop: '18px', marginBottom: 0 }}>
              Front Desk Hotline: +91 94402 89999 &bull; Shirdi VIP Road &bull; 24x7 IT Operations
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
