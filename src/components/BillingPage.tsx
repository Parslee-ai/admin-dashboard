import { useEffect, useState, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Spinner,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  CardHeader,
  Button,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { useMsal } from '@azure/msal-react';
import { Money24Regular, ArrowRight24Regular, DataUsageRegular } from '@fluentui/react-icons';
import { PlatformTopBar } from '../lib/platform-nav';
import { dashboardApi } from '../services/dashboardApi';
import { apiRequest } from '../auth/msalConfig';
import type { CurrentUsageSummaryResponse } from '../models/types';
import '../styles/App.css';

const DEFAULT_ORGANIZATION_ID = 'org_parslee';

function BillingPage() {
  const { accounts, instance } = useMsal();
  const activeAccount = accounts[0];
  const [usageSummary, setUsageSummary] = useState<CurrentUsageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const organizationId = DEFAULT_ORGANIZATION_ID;

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!activeAccount) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...apiRequest,
        account: activeAccount,
      });
      return response.accessToken;
    } catch {
      return null;
    }
  }, [instance, activeAccount]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          dashboardApi.setAccessToken(token);
        }
        const data = await dashboardApi.getCurrentUsageSummary(organizationId);
        setUsageSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizationId, getAccessToken]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const portal = await dashboardApi.getBillingPortalUrl(organizationId);
      window.open(portal.url, '_blank');
    } catch (err) {
      setError('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/dashboard',
    });
  };

  const formatNumber = (num: number): string => num.toLocaleString('en-US');
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const userInfo = {
    name: activeAccount?.name || 'User',
    email: activeAccount?.username || '',
    initials: activeAccount?.name ? activeAccount.name.charAt(0).toUpperCase() : '?',
  };
  const orgInfo = { id: organizationId, name: 'Parslee' };

  const renderContent = (content: React.ReactNode) => (
    <>
      <PlatformTopBar currentApp="dashboard" user={userInfo} organization={orgInfo} onLogout={handleLogout} />
      <FluentProvider theme={webLightTheme} style={{ paddingTop: 'var(--topbar-height)', minHeight: '100vh' }}>
        {content}
      </FluentProvider>
    </>
  );

  if (loading) {
    return renderContent(
      <div className="loading-container">
        <Spinner size="large" label="Loading billing information..." />
      </div>
    );
  }

  if (error) {
    return renderContent(
      <div className="error-container">
        <Title1>Error</Title1>
        <Body1>{error}</Body1>
      </div>
    );
  }

  if (!usageSummary) {
    return renderContent(
      <div className="error-container">
        <Body1>No billing data available. Create a subscription to get started.</Body1>
      </div>
    );
  }

  const { tokenUsage } = usageSummary;
  const usagePercent = tokenUsage.included > 0 ? Math.min(tokenUsage.used / tokenUsage.included, 1) : 0;

  return renderContent(
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title1>Billing</Title1>
        <Button
          appearance="primary"
          icon={<ArrowRight24Regular />}
          iconPosition="after"
          onClick={handleManageBilling}
          disabled={portalLoading}
        >
          {portalLoading ? 'Opening...' : 'Manage Billing'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Billing Period */}
        <Card>
          <CardHeader
            header={<Body1><b>Billing Period</b></Body1>}
            description={
              <Caption1>
                {formatDate(usageSummary.billingPeriodStart)} — {formatDate(usageSummary.billingPeriodEnd)}
              </Caption1>
            }
          />
        </Card>

        {/* Estimated Cost */}
        <Card>
          <CardHeader
            image={<Money24Regular fontSize={24} />}
            header={<Body1><b>Estimated Overage</b></Body1>}
            description={
              <Caption1>
                {tokenUsage.overage > 0
                  ? `${formatNumber(tokenUsage.overage)} tokens over limit`
                  : 'Within included tokens'}
              </Caption1>
            }
          />
          <div style={{ padding: '0 16px 16px' }}>
            <Title2>{formatCurrency(tokenUsage.overageCostEstimate)}</Title2>
          </div>
        </Card>
      </div>

      {/* Token Usage */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader
          image={<DataUsageRegular fontSize={24} />}
          header={<Body1><b>Token Usage</b></Body1>}
          description={
            <Caption1>
              {formatNumber(tokenUsage.used)} of {formatNumber(tokenUsage.included)} tokens used
            </Caption1>
          }
        />
        <div style={{ padding: '0 16px 16px' }}>
          <ProgressBar value={usagePercent} max={1} style={{ marginBottom: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <Caption1>Included</Caption1>
              <Body1>{formatNumber(tokenUsage.included)}</Body1>
            </div>
            <div>
              <Caption1>Used</Caption1>
              <Body1>{formatNumber(tokenUsage.used)}</Body1>
            </div>
            <div>
              <Caption1>Remaining</Caption1>
              <Body1>{formatNumber(tokenUsage.remaining)}</Body1>
            </div>
            <div>
              <Caption1>Overage</Caption1>
              <Body1>{tokenUsage.overage > 0 ? formatNumber(tokenUsage.overage) : '-'}</Body1>
            </div>
          </div>
        </div>
      </Card>

      {/* Meter Breakdowns */}
      {usageSummary.meterBreakdowns.length > 0 && (
        <Card>
          <CardHeader header={<Body1><b>Usage by Meter</b></Body1>} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Meter</TableHeaderCell>
                <TableHeaderCell>Quantity</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageSummary.meterBreakdowns.map((meter) => (
                <TableRow key={meter.meterType}>
                  <TableCell>{meter.meterType}</TableCell>
                  <TableCell>{formatNumber(meter.quantity)}</TableCell>
                  <TableCell>{meter.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default BillingPage;
