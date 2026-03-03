import { useEffect, useState, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Spinner,
  Title1,
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Pause24Regular,
  Play24Regular,
  Money24Regular,
  People24Regular,
  DocumentBulletList24Regular,
  Warning24Regular,
  Person24Regular,
} from '@fluentui/react-icons';
import {
  FileText,
  Building2,
  CreditCard,
  SlidersHorizontal,
  Menu,
  X,
} from 'lucide-react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { adminApi, AdminDashboardSummary, AdminSubscription } from '../services/adminApi';
import { isLocalDev } from '../auth/AuthProvider';
import { loginRequest, apiRequest } from '../auth/msalConfig';
import { PlatformTopBar } from '../lib/platform-nav';
import OrganizationsTab from './OrganizationsTab';
import AdminBillingTab from './AdminBillingTab';
import RatePlansTab from './RatePlansTab';
import './AdminDashboard.css';

type AdminTab = 'organizations' | 'revenue' | 'rate-plans' | 'subscriptions';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'CUSTOMERS',
    items: [
      { id: 'organizations', label: 'Organizations', icon: <Building2 size={18} /> },
    ],
  },
  {
    title: 'BILLING',
    items: [
      { id: 'revenue', label: 'Revenue', icon: <CreditCard size={18} /> },
      { id: 'rate-plans', label: 'Rate Plans', icon: <SlidersHorizontal size={18} /> },
    ],
  },
  {
    title: 'ADVANCED',
    items: [
      { id: 'subscriptions', label: 'Marketplace Subs', icon: <FileText size={18} /> },
    ],
  },
];

const REFRESH_INTERVAL_MS = 60_000; // 1 minute

/** Extract initials from a name */
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function AdminDashboard() {
  const { instance, accounts, inProgress } = useMsal();
  const msalAuthenticated = useIsAuthenticated();
  const isAuthenticated = isLocalDev || msalAuthenticated;
  const account = accounts[0];

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isLocalDev) return 'local-dev-token';
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...apiRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token silently, trying redirect', error);
      try {
        await instance.acquireTokenRedirect(apiRequest);
        return null;
      } catch (redirectError) {
        console.error('Failed to acquire token via redirect', redirectError);
        return null;
      }
    }
  }, [instance, account]);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('organizations');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close mobile sidebar on selection
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response) {
        instance.setActiveAccount(response.account);
      }
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLoginError(errorMessage);
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscription | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchSummary = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const data = await adminApi.getSummary(token);
      setSummary(data);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to fetch summary:', err);
      let errorMsg = 'Failed to fetch summary';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; details?: string }; status?: number } };
        if (axiosErr.response?.data?.details) {
          errorMsg = `${axiosErr.response.data.error}: ${axiosErr.response.data.details}`;
        } else if (axiosErr.response?.data?.error) {
          errorMsg = axiosErr.response.data.error;
        } else if (axiosErr.response?.status) {
          errorMsg = `Request failed with status ${axiosErr.response.status}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    }
  }, [getAccessToken]);

  const fetchSubscriptions = useCallback(async (reset: boolean = false) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const response = await adminApi.listSubscriptions(
        token,
        statusFilter || undefined,
        searchTerm || undefined,
        50,
        reset ? undefined : continuationToken || undefined
      );

      if (reset) {
        setSubscriptions(response.subscriptions);
      } else {
        setSubscriptions(prev => [...prev, ...response.subscriptions]);
      }
      setContinuationToken(response.continuationToken);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err: unknown) {
      let errorMsg = 'Failed to fetch subscriptions';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; details?: string }; status?: number } };
        if (axiosErr.response?.data?.details) {
          errorMsg = `${axiosErr.response.data.error}: ${axiosErr.response.data.details}`;
        } else if (axiosErr.response?.data?.error) {
          errorMsg = axiosErr.response.data.error;
        } else if (axiosErr.response?.status) {
          errorMsg = `Request failed with status ${axiosErr.response.status}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, statusFilter, searchTerm, continuationToken]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const [summaryData, subsData] = await Promise.all([
          adminApi.getSummary(token),
          adminApi.listSubscriptions(token, statusFilter || undefined, searchTerm || undefined, 50),
        ]);
        setSummary(summaryData);
        setSubscriptions(subsData.subscriptions);
        setContinuationToken(subsData.continuationToken);
        setHasMore(subsData.hasMore);
        setError(null);
      } catch (err: unknown) {
        let errorMsg = 'Failed to load data';
        if (err instanceof Error) errorMsg = err.message;
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const intervalId = setInterval(async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const data = await adminApi.getSummary(token);
        setSummary(data);
      } catch (err) {
        console.error('Failed to refresh summary:', err);
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, statusFilter, searchTerm]);

  const handleRefresh = () => {
    fetchSummary();
    fetchSubscriptions(true);
  };

  const handleSuspend = async () => {
    if (!selectedSubscription || !suspendReason) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.suspendSubscription(token, selectedSubscription.id, suspendReason);
      setSuspendDialogOpen(false);
      setSuspendReason('');
      handleRefresh();
    } catch (err) {
      console.error('Failed to suspend subscription:', err);
    }
  };

  const handleReinstate = async (subscription: AdminSubscription) => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.reinstateSubscription(token, subscription.id);
      handleRefresh();
    } catch (err) {
      console.error('Failed to reinstate subscription:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'informative'> = {
      Subscribed: 'success',
      PendingFulfillment: 'warning',
      Suspended: 'danger',
      Unsubscribed: 'informative',
    };
    return <Badge appearance="filled" color={statusColors[status] || 'informative'}>{status}</Badge>;
  };

  // Build user info for the top bar
  const userInfo = isLocalDev
    ? { name: 'Mike Prachar', email: 'mike@parslee.ai', initials: 'MP' }
    : {
        name: account?.name || 'User',
        email: account?.username || '',
        initials: getInitials(account?.name),
      };

  // Build organization info
  const orgInfo = {
    id: account?.tenantId || 'org_parslee',
    name: 'Parslee',
  };

  // Wrapper to render PlatformTopBar OUTSIDE FluentProvider (same pattern as App.tsx)
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

  // Show loading while MSAL is initializing (skip in local dev)
  if (!isLocalDev && inProgress !== InteractionStatus.None) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="admin-loading">
          <Spinner size="large" label="Authenticating..." />
        </div>
      </FluentProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="admin-login">
          <Card className="login-card">
            <div className="login-content">
              <Person24Regular className="login-icon" />
              <Title1>Parslee Admin Dashboard</Title1>
              <Body1>Sign in with your Parslee M365 account to access the admin dashboard.</Body1>
              {loginError && (
                <div className="login-error">
                  <Warning24Regular />
                  <span>{loginError}</span>
                </div>
              )}
              <div className="login-buttons">
                <Button appearance="primary" size="large" onClick={handleLogin}>
                  Sign in with Microsoft
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </FluentProvider>
    );
  }

  // Sidebar component
  const sidebar = (
    <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-header">
        <span className="admin-sidebar-title">Admin</span>
        <button
          className="admin-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="admin-sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="admin-nav-section">
            <div className="admin-nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-item--active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span className="admin-nav-item-icon">{item.icon}</span>
                <span className="admin-nav-item-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );

  return renderWithTopBar(
    <div className="admin-layout">
      {/* Mobile sidebar toggle */}
      <button
        className="admin-sidebar-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebar}

      <main className="admin-content">
        {error && activeTab === 'subscriptions' && (
          <div className="admin-error">
            <Warning24Regular />
            <Body1>{error}</Body1>
          </div>
        )}

        {/* Organizations Tab Content */}
        {activeTab === 'organizations' && (
          <OrganizationsTab getAccessToken={getAccessToken} />
        )}

        {/* Revenue Tab Content */}
        {activeTab === 'revenue' && (
          <AdminBillingTab getAccessToken={getAccessToken} />
        )}

        {/* Rate Plans Tab Content */}
        {activeTab === 'rate-plans' && (
          <RatePlansTab getAccessToken={getAccessToken} />
        )}

        {/* Subscriptions Tab Content */}
        {activeTab === 'subscriptions' && loading && subscriptions.length === 0 && (
          <div className="admin-loading">
            <Spinner size="large" label="Loading subscriptions..." />
          </div>
        )}
        {activeTab === 'subscriptions' && summary && (
          <div className="summary-grid">
            <Card className="summary-card">
              <CardHeader
                header={<Title3>Monthly Recurring Revenue</Title3>}
                description={<Body1>Active subscriptions only</Body1>}
              />
              <div className="summary-value mrr">
                <Money24Regular />
                <span>{formatCurrency(summary.monthlyRecurringRevenue)}</span>
              </div>
            </Card>

            <Card className="summary-card">
              <CardHeader
                header={<Title3>Total Seats</Title3>}
                description={<Body1>AIE seats across all active subscriptions</Body1>}
              />
              <div className="summary-value">
                <People24Regular />
                <span>{summary.totalSeats}</span>
              </div>
            </Card>

            <Card className="summary-card">
              <CardHeader
                header={<Title3>Subscriptions</Title3>}
                description={<Body1>Active / Total</Body1>}
              />
              <div className="summary-value">
                <DocumentBulletList24Regular />
                <span>{summary.activeSubscriptions} / {summary.totalSubscriptions}</span>
              </div>
            </Card>

            <Card className="summary-card status-breakdown">
              <CardHeader header={<Title3>Status Breakdown</Title3>} />
              <div className="status-list">
                <div className="status-item">
                  <Badge color="success">Active</Badge>
                  <span>{summary.activeSubscriptions}</span>
                </div>
                <div className="status-item">
                  <Badge color="warning">Pending</Badge>
                  <span>{summary.pendingSubscriptions}</span>
                </div>
                <div className="status-item">
                  <Badge color="danger">Suspended</Badge>
                  <span>{summary.suspendedSubscriptions}</span>
                </div>
                <div className="status-item">
                  <Badge color="informative">Cancelled</Badge>
                  <span>{summary.cancelledSubscriptions}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Subscriptions Table */}
        {activeTab === 'subscriptions' && (
        <div className="subscriptions-section">
          <Title2>Subscriptions</Title2>

          <div className="filters-row">
            <Input
              placeholder="Search by email, org ID, or subscription ID..."
              contentBefore={<Search24Regular />}
              value={searchTerm}
              onChange={(e, data) => setSearchTerm(data.value)}
              className="search-input"
            />
            <Select
              value={statusFilter}
              onChange={(e, data) => setStatusFilter(data.value)}
            >
              <option value="">All Statuses</option>
              <option value="Subscribed">Active</option>
              <option value="PendingFulfillment">Pending</option>
              <option value="Suspended">Suspended</option>
              <option value="Unsubscribed">Cancelled</option>
            </Select>
          </div>

          <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Email</th>
                <th style={{ width: '16%' }}>Organization</th>
                <th style={{ width: '12%' }}>Plan</th>
                <th style={{ width: '6%' }}>Seats</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '10%' }}>MRR</th>
                <th style={{ width: '10%' }}>Created</th>
                <th style={{ width: '16%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr
                  key={sub.id}
                  className="clickable-row"
                  onClick={() => { window.location.href = `/dashboard/admin/subscriptions/${sub.id}`; }}
                >
                  <td title={sub.beneficiaryEmail || ''}>{sub.beneficiaryEmail || '-'}</td>
                  <td title={sub.organizationId || ''}>{sub.organizationId || 'Not activated'}</td>
                  <td>{sub.planId}</td>
                  <td>{sub.quantity}</td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td>{formatCurrency(sub.monthlyRevenue)}</td>
                  <td>{formatDate(sub.createdAt)}</td>
                  <td className="actions-cell" onClick={e => e.stopPropagation()}>
                    <div className="action-buttons">
                      {sub.status === 'Subscribed' && (
                        <Button
                          icon={<Pause24Regular />}
                          size="small"
                          title="Suspend"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setSuspendDialogOpen(true);
                          }}
                        />
                      )}
                      {sub.status === 'Suspended' && (
                        <Button
                          icon={<Play24Regular />}
                          size="small"
                          title="Reinstate"
                          onClick={() => handleReinstate(sub)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {hasMore && (
            <Button
              onClick={() => fetchSubscriptions(false)}
              disabled={loading}
              className="load-more-btn"
            >
              {loading ? <Spinner size="tiny" /> : 'Load More'}
            </Button>
          )}
        </div>
        )}

        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={(e, data) => setSuspendDialogOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Suspend Subscription</DialogTitle>
              <DialogContent>
                <Body1>
                  Are you sure you want to suspend this subscription? The customer's AIEs will be disabled.
                </Body1>
                <Textarea
                  value={suspendReason}
                  onChange={(e, data) => setSuspendReason(data.value)}
                  placeholder="Reason for suspension..."
                  rows={3}
                  style={{ width: '100%', marginTop: '1rem' }}
                  required
                />
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setSuspendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button appearance="primary" onClick={handleSuspend} disabled={!suspendReason}>
                  Suspend
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </main>
    </div>
  );
}

export default AdminDashboard;
