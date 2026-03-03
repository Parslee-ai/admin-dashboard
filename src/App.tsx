import { useEffect, useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Spinner,
  Title1,
  Body1,
  Button,
} from '@fluentui/react-components';
import { useMsal } from '@azure/msal-react';
import { Money24Regular } from '@fluentui/react-icons';
import { app } from '@microsoft/teams-js';
import axios from 'axios';
import { PlatformTopBar } from './lib/platform-nav';
import { EmployeeStatusCard } from './components/EmployeeStatusCard';
import { TokenUsageCard } from './components/TokenUsageCard';
import { HealthStatusCard } from './components/HealthStatusCard';
import { BusinessMetricsCard } from './components/BusinessMetricsCard';
import { dashboardApi } from './services/dashboardApi';
import type { DashboardSummaryResponse } from './models/types';
import './styles/App.css';

const DASHBOARD_REFRESH_INTERVAL_MS = 30_000; // 30 seconds
const DEFAULT_ORGANIZATION_ID = 'org_parslee';

/** Extract initials from a name (first letter of first and last name) */
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function App() {
  const { accounts, instance } = useMsal();
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get the active MSAL account (may be undefined if not authenticated)
  const activeAccount = accounts[0];

  // Handle logout via MSAL
  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/dashboard',
    });
  };

  useEffect(() => {
    // Initialize Teams SDK and extract organization context
    const initTeams = async () => {
      try {
        await app.initialize();
        const context = await app.getContext();

        // TODO: Map context.user.tenant.id to organization ID via API
        setOrganizationId(DEFAULT_ORGANIZATION_ID);
      } catch (err) {
        console.warn('[Teams] SDK not available, using default organization');
        setOrganizationId(DEFAULT_ORGANIZATION_ID);
      }
    };

    initTeams();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardApi.getDashboardSummary(organizationId!);
        setDashboardData(data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
          setError(`API Error (${err.response?.status || 'Network'}): ${message}`);
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
        console.error('[Dashboard] Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!organizationId) {
      return; // Skip fetch hook until org ID initialized
    }

    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [organizationId]);

  // Build user info for the top bar
  const userInfo = {
    name: activeAccount?.name || 'User',
    email: activeAccount?.username || '',
    initials: getInitials(activeAccount?.name),
  };

  // Build organization info (using tenant ID from MSAL or default)
  const orgInfo = {
    id: activeAccount?.tenantId || organizationId || DEFAULT_ORGANIZATION_ID,
    name: 'Parslee', // Could be enhanced to fetch org name from API
  };

  // Wrapper to render the top bar OUTSIDE FluentProvider
  const renderWithTopBar = (content: React.ReactNode) => (
    <>
      <PlatformTopBar
        currentApp="dashboard"
        user={userInfo}
        organization={orgInfo}
        onLogout={handleLogout}
      />
      <FluentProvider theme={webLightTheme} style={{ paddingTop: 'var(--topbar-height)', minHeight: '100vh' }}>
        {content}
      </FluentProvider>
    </>
  );

  if (loading) {
    return renderWithTopBar(
      <div className="loading-container">
        <Spinner size="large" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return renderWithTopBar(
      <div className="error-container">
        <Title1>Error</Title1>
        <Body1>{error}</Body1>
      </div>
    );
  }

  if (!dashboardData) {
    return renderWithTopBar(
      <div className="error-container">
        <Body1>No dashboard data available</Body1>
      </div>
    );
  }

  return renderWithTopBar(
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <Title1>AI Employee Dashboard</Title1>
        </div>
        <Button
          as="a"
          href="/dashboard/billing"
          appearance="subtle"
          icon={<Money24Regular />}
        >
          Billing
        </Button>
      </div>
      <Body1 className="last-updated">
        Last updated: {new Date(dashboardData.generatedAt).toLocaleString()}
      </Body1>

      <div className="dashboard-grid">
        <EmployeeStatusCard employees={dashboardData.employees} />
        <TokenUsageCard tokenUsage={dashboardData.tokenUsage} />
        <HealthStatusCard healthStatus={dashboardData.healthStatus} />
        <BusinessMetricsCard businessMetrics={dashboardData.businessMetrics} />
      </div>
    </div>
  );
}

export default App;
