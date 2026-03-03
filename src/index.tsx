import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import App from './App';
import BillingPage from './components/BillingPage';
import AdminDashboard from './admin/AdminDashboard';
import OrgDetailPage from './admin/OrgDetailPage';
import SubscriptionDetailPage from './admin/SubscriptionDetailPage';
import RatePlanDetailPage from './admin/RatePlanDetailPage';
import WelcomePage from './welcome/WelcomePage';
import GettingStartedPage from './welcome/GettingStartedPage';
import './lib/platform-nav/styles/topbar.css';
import './styles/App.css';

// Error boundary to catch and display React render crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Parslee] React crash:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>React Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Debug: log to confirm JS executes
console.log('[Parslee] index.tsx executing, pathname:', window.location.pathname);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename="/dashboard">
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orgs/:orgId" element={<OrgDetailPage />} />
            <Route path="/admin/subscriptions/:subId" element={<SubscriptionDetailPage />} />
            <Route path="/admin/rate-plans/:planId" element={<RatePlanDetailPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/getting-started" element={<GettingStartedPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
