// CRITICAL: Patch Firebase SDK to force long polling BEFORE any imports
// This must be the VERY FIRST thing to run
(window as any).FIRESTORE_FORCE_LONG_POLLING = true;
(window as any).FIRESTORE_NO_WEBCHANNEL = true;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SchoolContextProvider } from './src/contexts/SchoolContext';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // console.error('🚨 Global error caught:', event.error);
  // console.error('Error message:', event.message);
  // console.error('Error stack:', event.error?.stack);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // console.error('🚨 Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Add error boundary wrapper
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // console.error('🚨 React Error Boundary caught error:', error);
    // console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#fee',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
            <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#c00' }}>
              Application Error
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              The application failed to load. Please check the browser console for details.
            </p>
            <pre style={{
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'left',
              overflow: 'auto',
              fontSize: '12px',
              border: '1px solid #ddd'
            }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#c00',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SchoolContextProvider>
        <App />
      </SchoolContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
