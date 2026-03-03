import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  FluentProvider,
  webLightTheme,
  Spinner,
  Title1,
  Title3,
  Body1,
  Card,
  Badge,
  Button,
  Input,
  Switch,
  TabList,
  Tab,
  Textarea,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Pause24Regular,
  Play24Regular,
  Open24Regular,
  Search24Regular,
  Warning24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import {
  adminApi,
  AdminOrganization,
  AdminUser,
  OrganizationSubscription,
  UpdateOrganizationRequest,
  ProductEntitlement,
} from '../services/adminApi';
import { isLocalDev } from '../auth/AuthProvider';
import { apiRequest } from '../auth/msalConfig';
import OrgBillingTab from './OrgBillingTab';
import './AdminDashboard.css';

type DetailTab = 'overview' | 'billing' | 'users' | 'settings';

function CopyableId({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="copyable-id" title={value}>
      {label && <span className="copyable-id-label">{label}: </span>}
      <code>{value.length > 20 ? value.slice(0, 8) + '...' + value.slice(-8) : value}</code>
      <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
        {copied ? <Checkmark24Regular /> : <Copy24Regular />}
      </button>
    </span>
  );
}

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  DelegatedAccess: 'Self-Service',
  AdminConsent: 'Admin-Managed',
  ManagedIdentity: 'Internal (Parslee)',
  ServicePrincipal: 'Legacy',
};

const PRODUCT_CATALOG: Record<string, { name: string; description: string }> = {
  aie: { name: 'Parslee Core', description: 'M365 AI employee orchestration' },
  odi: { name: 'Document Intelligence (ODI)', description: 'Organizational document processing' },
  studio: { name: 'Agentic Studio', description: 'AI video production' },
  crm: { name: 'CRM', description: 'CRM integration' },
};

function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { instance, accounts } = useMsal();
  const msalAuthenticated = useIsAuthenticated();
  const isAuthenticated = isLocalDev || msalAuthenticated;
  const account = accounts[0];

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isLocalDev) return 'local-dev-token';
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({ ...apiRequest, account });
      return response.accessToken;
    } catch {
      return null;
    }
  }, [instance, account]);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState<OrganizationSubscription[]>([]);
  const [entitlements, setEntitlements] = useState<ProductEntitlement[]>([]);
  const [entitlementLoading, setEntitlementLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(0);
  const [userStatusFilter, setUserStatusFilter] = useState<string>('Active');
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Settings tab state
  const [editForm, setEditForm] = useState<UpdateOrganizationRequest>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Suspend dialog state
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchOrg = useCallback(async () => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;
    setAccessToken(token);

    try {
      setLoading(true);
      const [orgData, usersData, subsData, entitlementData] = await Promise.all([
        adminApi.getOrganization(token, orgId),
        adminApi.getOrganizationUsers(token, orgId, undefined, 0, 50),
        adminApi.getOrganizationSubscriptions(token, orgId),
        adminApi.getEntitlements(token, orgId),
      ]);
      setOrg(orgData);
      setUsers(usersData.users);
      setUserCount(usersData.totalCount);
      setSubscriptions(subsData.subscriptions);
      setEntitlements(entitlementData.entitlements || []);
      setEditForm({
        displayName: orgData.displayName || '',
        billingEmail: orgData.billingEmail || '',
        monthlySpendLimit: orgData.monthlySpendLimit,
        allowedDomains: orgData.allowedDomains,
        stripeCustomerId: orgData.stripeCustomerId || '',
        settings: {
          enableVoiceCalls: orgData.settings.enableVoiceCalls,
          enableSMS: orgData.settings.enableSMS,
          enableTeamsIntegration: orgData.settings.enableTeamsIntegration,
          requireApprovalForHighRiskActions: orgData.settings.requireApprovalForHighRiskActions,
          defaultTimeZone: orgData.settings.defaultTimeZone || undefined,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch org details:', err);
      setError('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  }, [orgId, getAccessToken]);

  const fetchUsers = useCallback(async (skip: number) => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      const data = await adminApi.getOrganizationUsers(token, orgId, undefined, skip, 50);
      setUsers(data.users);
      setUserCount(data.totalCount);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [orgId, getAccessToken]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  useEffect(() => {
    fetchUsers(usersPage * 50);
  }, [usersPage, fetchUsers]);

  const handleSave = async () => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await adminApi.updateOrganization(token, orgId, editForm);
      setOrg(updated);
      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!orgId || !suspendReason) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.suspendOrganization(token, orgId, suspendReason);
      setShowSuspend(false);
      setSuspendReason('');
      fetchOrg();
    } catch (err) {
      console.error('Failed to suspend:', err);
    }
  };

  const handleReactivate = async () => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.reactivateOrganization(token, orgId);
      fetchOrg();
    } catch (err) {
      console.error('Failed to reactivate:', err);
    }
  };

  const handleEntitlementToggle = async (productId: string, currentlyEnabled: boolean) => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    setError(null);
    setEntitlementLoading(prev => ({ ...prev, [productId]: true }));
    try {
      if (currentlyEnabled) {
        await adminApi.disableProduct(token, orgId, productId);
      } else {
        await adminApi.enableProduct(token, orgId, productId);
      }
      const data = await adminApi.getEntitlements(token, orgId);
      setEntitlements(data.entitlements || []);
    } catch (err: any) {
      console.error('Failed to toggle entitlement:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Unknown error';
      setError(`Failed to ${currentlyEnabled ? 'disable' : 'enable'} ${productId}: ${msg}`);
    } finally {
      setEntitlementLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    setDeletingUserId(userId);
    try {
      await adminApi.deleteUser(token, orgId, userId);
      await fetchUsers(usersPage * 50);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!orgId) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.reactivateUser(token, orgId, userId);
      await fetchUsers(usersPage * 50);
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      setError('Failed to reactivate user');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'informative'> = {
      Active: 'success', Trial: 'warning', Suspended: 'danger', Deleted: 'informative',
      Subscribed: 'success', Unsubscribed: 'informative', PendingFulfillmentStart: 'warning',
    };
    return <Badge appearance="filled" color={colors[status] || 'informative'}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, 'success' | 'warning' | 'informative'> = {
      Owner: 'success', Admin: 'warning', Member: 'informative', Guest: 'informative',
    };
    return <Badge appearance="outline" color={colors[role] || 'informative'}>{role}</Badge>;
  };

  const handleBack = () => {
    window.location.href = '/dashboard/admin';
  };

  if (!isAuthenticated) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page">
          <Body1>Please sign in to access admin features.</Body1>
        </div>
      </FluentProvider>
    );
  }

  if (loading) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page">
          <div className="admin-loading">
            <Spinner size="large" label="Loading organization..." />
          </div>
        </div>
      </FluentProvider>
    );
  }

  if (error || !org) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page">
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={handleBack}>
            Back to Organizations
          </Button>
          <div className="admin-error">
            <Warning24Regular />
            <Body1>{error || 'Organization not found'}</Body1>
          </div>
        </div>
      </FluentProvider>
    );
  }

  // Sort users: Owner first, then Admin, then others
  const rolePriority: Record<string, number> = { Owner: 0, Admin: 1, Member: 2, Guest: 3 };
  const sortedUsers = [...users].sort((a, b) =>
    (rolePriority[a.role] ?? 9) - (rolePriority[b.role] ?? 9)
  );

  // User summary stats (for overview)
  const activeUsers = users.filter(u => u.status === 'Active');
  const pendingUsers = users.filter(u => u.status === 'PendingActivation');
  const suspendedUsers = users.filter(u => u.status === 'Suspended');
  const owners = activeUsers.filter(u => u.role === 'Owner');

  // Duplicate detection: users sharing the same email
  const emailCounts = new Map<string, number>();
  for (const u of users.filter(u => u.status !== 'Deleted')) {
    const email = u.email.toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  }
  const duplicateEmails = [...emailCounts.entries()].filter(([, count]) => count > 1);

  // Users tab filtering
  const statusFilteredUsers = sortedUsers.filter(u => {
    if (!showDeleted && u.status === 'Deleted') return false;
    if (userStatusFilter === 'All') return true;
    return u.status === userStatusFilter;
  });
  const filteredUsers = userSearch
    ? statusFilteredUsers.filter(u =>
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : statusFilteredUsers;

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="org-detail-page">
        {/* Back button */}
        <Button
          icon={<ArrowLeft24Regular />}
          appearance="subtle"
          onClick={handleBack}
          style={{ marginBottom: '1rem' }}
        >
          Back to Organizations
        </Button>

        {/* Header Card */}
        <Card className="org-header-card">
          <div className="org-header-top">
            <div className="org-header-title">
              <Title1>{org.displayName || org.name}</Title1>
              <div className="org-header-meta">
                {getStatusBadge(org.status)}
                <CopyableId value={org.id} />
              </div>
            </div>
            <div className="org-header-actions">
              {org.status === 'Active' && (
                <Button
                  icon={<Pause24Regular />}
                  appearance="subtle"
                  onClick={() => setShowSuspend(true)}
                >
                  Suspend
                </Button>
              )}
              {org.status === 'Suspended' && (
                <Button icon={<Play24Regular />} appearance="primary" onClick={handleReactivate}>
                  Reactivate
                </Button>
              )}
              {org.stripeCustomerId && (
                <Button
                  icon={<Open24Regular />}
                  appearance="subtle"
                  as="a"
                  href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
                  target="_blank"
                >
                  Stripe
                </Button>
              )}
            </div>
          </div>

          <div className="org-header-stats">
            <div className="stat-item">
              <span className="stat-label">AI Employees</span>
              <span className="stat-value">{org.subscribedEmployeeCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current Spend</span>
              <span className="stat-value">{formatCurrency(org.currentMonthSpend)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Spend Limit</span>
              <span className="stat-value">
                {org.monthlySpendLimit > 0 ? formatCurrency(org.monthlySpendLimit) : 'Unlimited'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Created</span>
              <span className="stat-value">{formatDate(org.createdAt)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Users</span>
              <span className="stat-value">{activeUsers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">AIE Seats</span>
              <span className="stat-value">{org.subscribedEmployeeCount}</span>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <TabList
          className="org-tabs"
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as DetailTab)}
        >
          <Tab value="overview">Overview</Tab>
          <Tab value="billing">Billing</Tab>
          <Tab value="users">Users ({activeUsers.length})</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>

        <div className="org-tab-content">
          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Info Grid */}
              <Card className="info-section">
                <Title3>Organization Info</Title3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">M365 Tenant</span>
                    <span className="info-value">
                      <CopyableId value={org.m365TenantId} />
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Connection Type</span>
                    <span className="info-value">
                      {org.connectionType
                        ? `${CONNECTION_TYPE_LABELS[org.connectionType] || org.connectionType} (${org.connectionType})`
                        : '-'}
                    </span>
                  </div>
                  {org.suspendedAt && (
                    <>
                      <div className="info-row">
                        <span className="info-label">Suspended At</span>
                        <span className="info-value">{formatDateTime(org.suspendedAt)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Suspension Reason</span>
                        <span className="info-value">{org.suspensionReason || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Billing Summary (compact — details on Billing tab) */}
              <Card className="info-section">
                <div className="section-header-inline">
                  <Title3>Billing</Title3>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => setActiveTab('billing')}
                  >
                    View billing details
                  </Button>
                </div>
                <Body1>
                  {org.subscribedEmployeeCount} AIE seat{org.subscribedEmployeeCount !== 1 ? 's' : ''} active
                  {' '}&middot; {formatCurrency(org.currentMonthSpend)} this month
                  {org.stripeCustomerId && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                      &middot; Stripe linked
                    </span>
                  )}
                </Body1>
              </Card>

              {/* Settings Badges */}
              <Card className="info-section">
                <Title3>Feature Flags</Title3>
                <div className="settings-badges">
                  <Badge
                    appearance={org.settings.enableTeamsIntegration ? 'filled' : 'outline'}
                    color={org.settings.enableTeamsIntegration ? 'success' : 'informative'}
                  >
                    Teams: {org.settings.enableTeamsIntegration ? 'On' : 'Off'}
                  </Badge>
                  <Badge
                    appearance={org.settings.enableVoiceCalls ? 'filled' : 'outline'}
                    color={org.settings.enableVoiceCalls ? 'success' : 'informative'}
                  >
                    Voice: {org.settings.enableVoiceCalls ? 'On' : 'Off'}
                  </Badge>
                  <Badge
                    appearance={org.settings.enableSMS ? 'filled' : 'outline'}
                    color={org.settings.enableSMS ? 'success' : 'informative'}
                  >
                    SMS: {org.settings.enableSMS ? 'On' : 'Off'}
                  </Badge>
                  <Badge
                    appearance={org.settings.requireApprovalForHighRiskActions ? 'filled' : 'outline'}
                    color={org.settings.requireApprovalForHighRiskActions ? 'warning' : 'informative'}
                  >
                    Approval Required: {org.settings.requireApprovalForHighRiskActions ? 'On' : 'Off'}
                  </Badge>
                </div>
              </Card>

              {/* Product Entitlements */}
              <Card className="info-section">
                <Title3>Product Entitlements</Title3>
                <div className="entitlement-grid">
                  {Object.entries(PRODUCT_CATALOG).map(([productId, meta]) => {
                    const ent = entitlements.find(e => e.productId === productId);
                    const isEnabled = ent?.enabled ?? false;
                    const isLoading = entitlementLoading[productId] ?? false;
                    return (
                      <div key={productId} className={`entitlement-card ${isEnabled ? 'enabled' : 'disabled'}`}>
                        <div className="entitlement-header">
                          <span className="entitlement-name">{meta.name}</span>
                          <Switch
                            checked={isEnabled}
                            disabled={isLoading}
                            onChange={() => handleEntitlementToggle(productId, isEnabled)}
                          />
                        </div>
                        {isEnabled && ent ? (
                          <div className="entitlement-details">
                            <Badge appearance="outline" color="informative">{ent.tier}</Badge>
                            <span className="entitlement-audit">
                              Enabled by {ent.enabledBy || 'system'} on {formatDate(ent.enabledAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="entitlement-not-provisioned">Not provisioned</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Users Summary */}
              <Card className="info-section">
                <div className="section-header-inline">
                  <Title3>Users</Title3>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => setActiveTab('users')}
                  >
                    Manage users
                  </Button>
                </div>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Active</span>
                    <span className="info-value">{activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Owner</span>
                    <span className="info-value">
                      {owners.length > 0
                        ? owners.map(o => o.name || o.email).join(', ')
                        : <span style={{ color: '#d13438' }}>No owner assigned</span>}
                    </span>
                  </div>
                  {pendingUsers.length > 0 && (
                    <div className="info-row">
                      <span className="info-label">Pending Activation</span>
                      <span className="info-value" style={{ color: '#ca5010' }}>
                        {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} stuck
                      </span>
                    </div>
                  )}
                  {suspendedUsers.length > 0 && (
                    <div className="info-row">
                      <span className="info-label">Suspended</span>
                      <span className="info-value" style={{ color: '#d13438' }}>
                        {suspendedUsers.length} user{suspendedUsers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {duplicateEmails.length > 0 && (
                    <div className="info-row">
                      <span className="info-label">Duplicates</span>
                      <span className="info-value" style={{ color: '#d13438' }}>
                        {duplicateEmails.length} email{duplicateEmails.length !== 1 ? 's' : ''} with duplicates
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Subscriptions Summary */}
              <Card className="info-section">
                <div className="section-header-inline">
                  <Title3>Subscriptions</Title3>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => setActiveTab('billing')}
                  >
                    View billing details
                  </Button>
                </div>
                <Body1>
                  {org.subscribedEmployeeCount} AIE seat{org.subscribedEmployeeCount !== 1 ? 's' : ''} active
                  {subscriptions.length > 0 && (
                    <span style={{ color: '#666' }}> &middot; {subscriptions.length} marketplace subscription{subscriptions.length !== 1 ? 's' : ''}</span>
                  )}
                </Body1>
              </Card>
            </div>
          )}

          {/* ==================== USERS TAB ==================== */}
          {activeTab === 'users' && (
            <div className="users-tab">
              {/* Duplicate detection banner */}
              {duplicateEmails.length > 0 && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#fdf3d7',
                  border: '1px solid #f0c36d',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Warning24Regular style={{ color: '#ca5010' }} />
                  <Body1>
                    <strong>Duplicate users detected:</strong>{' '}
                    {duplicateEmails.map(([email, count]) => `${email} (${count}x)`).join(', ')}
                  </Body1>
                </div>
              )}

              <div className="tab-toolbar">
                <Input
                  placeholder="Search users..."
                  contentBefore={<Search24Regular />}
                  value={userSearch}
                  onChange={(_, data) => setUserSearch(data.value)}
                  style={{ maxWidth: '300px' }}
                />
                <select
                  value={userStatusFilter}
                  onChange={e => setUserStatusFilter(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #d1d1d1',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="PendingActivation">Pending</option>
                  <option value="Suspended">Suspended</option>
                  <option value="All">All statuses</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={e => setShowDeleted(e.target.checked)}
                  />
                  Show deleted
                </label>
                <Body1 style={{ color: '#666', marginLeft: 'auto' }}>
                  {filteredUsers.length} of {userCount} users
                </Body1>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Email</th>
                      <th style={{ width: '15%' }}>Name</th>
                      <th style={{ width: '10%' }}>Role</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '15%' }}>Last Login</th>
                      <th style={{ width: '15%' }}>M365 UPN</th>
                      <th style={{ width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} style={
                        duplicateEmails.some(([email]) => email === user.email.toLowerCase())
                          ? { background: '#fff8e1' }
                          : undefined
                      }>
                        <td title={user.email}>{user.email}</td>
                        <td>{user.name || '-'}</td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{getStatusBadge(user.status)}</td>
                        <td>{formatDate(user.lastLoginAt)}</td>
                        <td title={user.m365UserPrincipalName || '-'}>
                          {user.m365UserPrincipalName || '-'}
                        </td>
                        <td>
                          {user.status === 'Active' || user.status === 'PendingActivation' ? (
                            <Button
                              icon={<Delete24Regular />}
                              appearance="subtle"
                              size="small"
                              disabled={deletingUserId === user.id}
                              onClick={() => {
                                if (window.confirm(`Delete user ${user.email}?`)) {
                                  handleDeleteUser(user.id);
                                }
                              }}
                              title="Delete user"
                            />
                          ) : user.status === 'Suspended' ? (
                            <Button
                              icon={<Play24Regular />}
                              appearance="subtle"
                              size="small"
                              onClick={() => handleReactivateUser(user.id)}
                              title="Reactivate user"
                            />
                          ) : user.status === 'Deleted' ? (
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>Deleted</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: '#666' }}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {userCount > 50 && (
                <div className="pagination">
                  <Button
                    appearance="subtle"
                    disabled={usersPage === 0}
                    onClick={() => setUsersPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Body1>
                    Page {usersPage + 1} of {Math.ceil(userCount / 50)}
                  </Body1>
                  <Button
                    appearance="subtle"
                    disabled={(usersPage + 1) * 50 >= userCount}
                    onClick={() => setUsersPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ==================== BILLING TAB ==================== */}
          {activeTab === 'billing' && accessToken && (
            <OrgBillingTab
              orgId={orgId!}
              token={accessToken}
            />
          )}

          {/* ==================== SETTINGS TAB ==================== */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <Card className="settings-form">
                <Title3>Organization Settings</Title3>

                <div className="settings-field">
                  <label>Display Name</label>
                  <Input
                    value={editForm.displayName || ''}
                    onChange={(_, data) => setEditForm(f => ({ ...f, displayName: data.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="settings-field">
                  <label>Billing Email</label>
                  <Input
                    value={editForm.billingEmail || ''}
                    onChange={(_, data) => setEditForm(f => ({ ...f, billingEmail: data.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="settings-field">
                  <label>Stripe Customer ID</label>
                  <Input
                    value={editForm.stripeCustomerId || ''}
                    onChange={(_, data) => setEditForm(f => ({ ...f, stripeCustomerId: data.value }))}
                    placeholder="cus_xxxxxxxxxxxxxx"
                    style={{ width: '100%' }}
                  />
                  <Body1 style={{ color: '#666', fontSize: '0.85rem' }}>
                    Links this org to a Stripe customer for invoice sync and webhook processing
                  </Body1>
                </div>

                <div className="settings-field">
                  <label>Monthly Spend Limit ($)</label>
                  <Input
                    type="number"
                    value={String(editForm.monthlySpendLimit || 0)}
                    onChange={(_, data) =>
                      setEditForm(f => ({ ...f, monthlySpendLimit: parseFloat(data.value) || 0 }))
                    }
                    style={{ width: '200px' }}
                  />
                  <Body1 style={{ color: '#666', fontSize: '0.85rem' }}>
                    Set to 0 for unlimited
                  </Body1>
                </div>

                <div className="settings-field">
                  <label>Allowed Domains</label>
                  <Input
                    value={(editForm.allowedDomains || []).join(', ')}
                    onChange={(_, data) =>
                      setEditForm(f => ({
                        ...f,
                        allowedDomains: data.value.split(',').map(d => d.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="domain.com, other.com"
                    style={{ width: '100%' }}
                  />
                </div>

                <Title3 style={{ marginTop: '1.5rem' }}>Feature Toggles</Title3>

                <div className="settings-toggles">
                  <div className="toggle-row">
                    <Switch
                      checked={editForm.settings?.enableTeamsIntegration ?? false}
                      onChange={(_, data) =>
                        setEditForm(f => ({
                          ...f,
                          settings: { ...f.settings, enableTeamsIntegration: data.checked },
                        }))
                      }
                    />
                    <span>Teams Integration</span>
                  </div>
                  <div className="toggle-row">
                    <Switch
                      checked={editForm.settings?.enableVoiceCalls ?? false}
                      onChange={(_, data) =>
                        setEditForm(f => ({
                          ...f,
                          settings: { ...f.settings, enableVoiceCalls: data.checked },
                        }))
                      }
                    />
                    <span>Voice Calls</span>
                  </div>
                  <div className="toggle-row">
                    <Switch
                      checked={editForm.settings?.enableSMS ?? false}
                      onChange={(_, data) =>
                        setEditForm(f => ({
                          ...f,
                          settings: { ...f.settings, enableSMS: data.checked },
                        }))
                      }
                    />
                    <span>SMS</span>
                  </div>
                  <div className="toggle-row">
                    <Switch
                      checked={editForm.settings?.requireApprovalForHighRiskActions ?? false}
                      onChange={(_, data) =>
                        setEditForm(f => ({
                          ...f,
                          settings: { ...f.settings, requireApprovalForHighRiskActions: data.checked },
                        }))
                      }
                    />
                    <span>Require Approval for High-Risk Actions</span>
                  </div>
                </div>

                <div className="settings-actions">
                  <Button appearance="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {saveMessage && (
                    <Body1 style={{ color: saveMessage.includes('Failed') ? '#d13438' : '#107c10' }}>
                      {saveMessage}
                    </Body1>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Suspend Confirmation */}
        {showSuspend && (
          <div className="suspend-overlay">
            <Card className="suspend-card">
              <Title3>Suspend Organization</Title3>
              <Body1>
                All users will lose access and AIEs will be disabled.
              </Body1>
              <Textarea
                value={suspendReason}
                onChange={(_, data) => setSuspendReason(data.value)}
                placeholder="Reason for suspension..."
                rows={3}
                style={{ width: '100%', marginTop: '0.75rem' }}
              />
              <div className="suspend-actions">
                <Button appearance="secondary" onClick={() => setShowSuspend(false)}>Cancel</Button>
                <Button
                  appearance="primary"
                  style={{ backgroundColor: '#d13438' }}
                  onClick={handleSuspend}
                  disabled={!suspendReason}
                >
                  Suspend
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </FluentProvider>
  );
}

export default OrgDetailPage;
