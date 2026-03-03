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
  Textarea,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Pause24Regular,
  Play24Regular,
  Open24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { adminApi, AdminSubscription } from '../services/adminApi';
import { isLocalDev } from '../auth/AuthProvider';
import { apiRequest } from '../auth/msalConfig';
import './AdminDashboard.css';

type DetailTab = 'overview' | 'usage' | 'notes';

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
      <code>{value.length > 24 ? value.slice(0, 8) + '...' + value.slice(-8) : value}</code>
      <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
        {copied ? <Checkmark24Regular /> : <Copy24Regular />}
      </button>
    </span>
  );
}

function SubscriptionDetailPage() {
  const { subId } = useParams<{ subId: string }>();
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

  const [sub, setSub] = useState<AdminSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // Notes editing
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

  // Suspend state
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchSubscription = useCallback(async () => {
    if (!subId) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const data = await adminApi.getSubscription(token, subId);
      setSub(data);
      setEditingNotes(data.adminNotes || '');
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, [subId, getAccessToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleSaveNotes = async () => {
    if (!subId) return;
    const token = await getAccessToken();
    if (!token) return;
    setNotesSaving(true);
    setNotesMessage(null);
    try {
      await adminApi.updateNotes(token, subId, editingNotes);
      setNotesMessage('Notes saved');
      setTimeout(() => setNotesMessage(null), 3000);
      fetchSubscription();
    } catch (err) {
      console.error('Failed to save notes:', err);
      setNotesMessage('Failed to save');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!subId || !suspendReason) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await adminApi.suspendSubscription(token, subId, suspendReason);
      setShowSuspend(false);
      setSuspendReason('');
      fetchSubscription();
    } catch (err) {
      console.error('Failed to suspend:', err);
    }
  };

  const handleReinstate = async () => {
    if (!subId) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await adminApi.reinstateSubscription(token, subId);
      fetchSubscription();
    } catch (err) {
      console.error('Failed to reinstate:', err);
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
      Subscribed: 'success', PendingFulfillmentStart: 'warning',
      Suspended: 'danger', Unsubscribed: 'informative',
    };
    return <Badge appearance="filled" color={colors[status] || 'informative'}>{status}</Badge>;
  };

  const handleBack = () => { window.location.href = '/admin'; };

  if (!isAuthenticated) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page"><Body1>Please sign in.</Body1></div>
      </FluentProvider>
    );
  }

  if (loading) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page">
          <div className="admin-loading"><Spinner size="large" label="Loading subscription..." /></div>
        </div>
      </FluentProvider>
    );
  }

  if (error || !sub) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="org-detail-page">
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={handleBack}>Back</Button>
          <div className="admin-error"><Warning24Regular /><Body1>{error || 'Not found'}</Body1></div>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="org-detail-page">
        <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={handleBack} style={{ marginBottom: '1rem' }}>
          Back to Subscriptions
        </Button>

        {/* Header Card */}
        <Card className="org-header-card">
          <div className="org-header-top">
            <div className="org-header-title">
              <Title1>{sub.planId}</Title1>
              <div className="org-header-meta">
                {getStatusBadge(sub.status)}
                <CopyableId value={sub.id} />
              </div>
            </div>
            <div className="org-header-actions">
              {sub.status === 'Subscribed' && (
                <Button icon={<Pause24Regular />} appearance="subtle" onClick={() => setShowSuspend(true)}>
                  Suspend
                </Button>
              )}
              {sub.status === 'Suspended' && (
                <Button icon={<Play24Regular />} appearance="primary" onClick={handleReinstate}>
                  Reinstate
                </Button>
              )}
              {sub.organizationId && (
                <Button
                  icon={<Open24Regular />}
                  appearance="subtle"
                  onClick={() => { window.location.href = `/admin/orgs/${sub.organizationId}`; }}
                >
                  View Org
                </Button>
              )}
            </div>
          </div>

          <div className="org-header-stats">
            <div className="stat-item">
              <span className="stat-label">Seats</span>
              <span className="stat-value">{sub.quantity}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">MRR</span>
              <span className="stat-value">{formatCurrency(sub.monthlyRevenue)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tokens This Period</span>
              <span className="stat-value">{sub.tokensReportedThisPeriod.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Created</span>
              <span className="stat-value">{formatDate(sub.createdAt)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activated</span>
              <span className="stat-value">{formatDate(sub.activatedAt)}</span>
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
          <Tab value="usage">Usage</Tab>
          <Tab value="notes">Notes</Tab>
        </TabList>

        <div className="org-tab-content">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <Card className="info-section">
                <Title3>Subscription Details</Title3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Offer</span>
                    <span className="info-value">{sub.offerId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Plan</span>
                    <span className="info-value">{sub.planId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Organization</span>
                    <span className="info-value">
                      {sub.organizationId ? (
                        <a
                          href={`/admin/orgs/${sub.organizationId}`}
                          style={{ color: 'var(--parslee-emerald)' }}
                        >
                          {sub.organizationId}
                        </a>
                      ) : 'Not activated'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Marketplace Sub ID</span>
                    <span className="info-value">
                      <CopyableId value={sub.marketplaceSubscriptionId} />
                    </span>
                  </div>
                  {sub.employeeTemplateId && (
                    <div className="info-row">
                      <span className="info-label">Employee Template</span>
                      <span className="info-value"><code>{sub.employeeTemplateId}</code></span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Auto-Renew</span>
                    <span className="info-value">
                      <Badge appearance="filled" color={sub.autoRenew ? 'success' : 'informative'}>
                        {sub.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="info-section">
                <Title3>People</Title3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Beneficiary Email</span>
                    <span className="info-value" title={sub.beneficiaryEmail || '-'}>
                      {sub.beneficiaryEmail || '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Beneficiary Tenant</span>
                    <span className="info-value">
                      {sub.beneficiaryTenantId ? <CopyableId value={sub.beneficiaryTenantId} /> : '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Purchaser Email</span>
                    <span className="info-value" title={sub.purchaserEmail || '-'}>
                      {sub.purchaserEmail || '-'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="info-section">
                <Title3>Timeline</Title3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Created</span>
                    <span className="info-value">{formatDateTime(sub.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Activated</span>
                    <span className="info-value">{formatDateTime(sub.activatedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Term Start</span>
                    <span className="info-value">{formatDate(sub.termStartDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Term End</span>
                    <span className="info-value">{formatDate(sub.termEndDate)}</span>
                  </div>
                  {sub.suspendedAt && (
                    <div className="info-row">
                      <span className="info-label">Suspended</span>
                      <span className="info-value">{formatDateTime(sub.suspendedAt)}</span>
                    </div>
                  )}
                  {sub.suspensionReason && (
                    <div className="info-row">
                      <span className="info-label">Suspension Reason</span>
                      <span className="info-value" style={{ color: '#d13438' }}>{sub.suspensionReason}</span>
                    </div>
                  )}
                  {sub.cancelledAt && (
                    <div className="info-row">
                      <span className="info-label">Cancelled</span>
                      <span className="info-value">{formatDateTime(sub.cancelledAt)}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Last Updated</span>
                    <span className="info-value">{formatDateTime(sub.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* USAGE */}
          {activeTab === 'usage' && (
            <div className="usage-tab">
              <Card className="info-section">
                <Title3>Usage This Period</Title3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Tokens Reported</span>
                    <span className="info-value">{sub.tokensReportedThisPeriod.toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Metering Event</span>
                    <span className="info-value">{formatDateTime(sub.lastMeteringEventTime)}</span>
                  </div>
                </div>
                <Body1 style={{ color: '#666', marginTop: '1rem', fontSize: '0.85rem' }}>
                  Detailed usage history will be available when usage tracking is fully implemented (Phase 2).
                </Body1>
              </Card>
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'notes' && (
            <div className="notes-tab">
              <Card className="settings-form">
                <Title3>Admin Notes</Title3>
                <Textarea
                  value={editingNotes}
                  onChange={(_, data) => setEditingNotes(data.value)}
                  placeholder="Internal notes about this subscription..."
                  rows={6}
                  style={{ width: '100%', marginTop: '0.75rem' }}
                />
                <div className="settings-actions">
                  <Button appearance="primary" onClick={handleSaveNotes} disabled={notesSaving}>
                    {notesSaving ? 'Saving...' : 'Save Notes'}
                  </Button>
                  {notesMessage && (
                    <Body1 style={{ color: notesMessage.includes('Failed') ? '#d13438' : '#107c10' }}>
                      {notesMessage}
                    </Body1>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Suspend overlay */}
        {showSuspend && (
          <div className="suspend-overlay">
            <Card className="suspend-card">
              <Title3>Suspend Subscription</Title3>
              <Body1>The customer's AIEs will be disabled.</Body1>
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

export default SubscriptionDetailPage;
