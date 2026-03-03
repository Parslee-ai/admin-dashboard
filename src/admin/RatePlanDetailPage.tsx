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
  Textarea,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Archive24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { adminApi, RatePlan, UpdateRatePlanRequest } from '../services/adminApi';
import { isLocalDev } from '../auth/AuthProvider';
import { apiRequest } from '../auth/msalConfig';
import './AdminDashboard.css';

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

function RatePlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
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

  const [plan, setPlan] = useState<RatePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateRatePlanRequest>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Archive confirmation
  const [showArchive, setShowArchive] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const data = await adminApi.getRatePlan(token, planId);
      setPlan(data);
      setEditForm({
        name: data.name,
        description: data.description || '',
        basePrice: data.basePrice,
        includedTokens: data.includedTokens,
        overageRatePerThousand: data.overageRatePerThousand,
        stripePriceId: data.stripePriceId || '',
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rate plan:', err);
      setError('Failed to load rate plan');
    } finally {
      setLoading(false);
    }
  }, [planId, getAccessToken]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleSave = async () => {
    if (!planId || !plan) return;
    const token = await getAccessToken();
    if (!token) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      const updates: UpdateRatePlanRequest = {};
      if (editForm.name !== plan.name) updates.name = editForm.name;
      if (editForm.description !== (plan.description || '')) updates.description = editForm.description;
      if (editForm.basePrice !== plan.basePrice) updates.basePrice = editForm.basePrice;
      if (editForm.includedTokens !== plan.includedTokens) updates.includedTokens = editForm.includedTokens;
      if (editForm.overageRatePerThousand !== plan.overageRatePerThousand) updates.overageRatePerThousand = editForm.overageRatePerThousand;
      if (editForm.stripePriceId !== (plan.stripePriceId || '')) updates.stripePriceId = editForm.stripePriceId;

      await adminApi.updateRatePlan(token, planId, updates);
      setSaveMessage('Saved successfully');
      setEditing(false);
      fetchPlan();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!planId) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await adminApi.archiveRatePlan(token, planId);
      setShowArchive(false);
      fetchPlan();
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const formatTokens = (tokens: number) =>
    tokens >= 1_000_000 ? (tokens / 1_000_000).toFixed(1) + 'M' : tokens.toLocaleString();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'informative'> = {
      active: 'success', archived: 'informative', draft: 'warning',
    };
    return <Badge appearance="filled" color={colors[status] || 'informative'}>{status}</Badge>;
  };

  const handleBack = () => { window.location.href = '/dashboard/admin'; };

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
          <div className="admin-loading"><Spinner size="large" label="Loading rate plan..." /></div>
        </div>
      </FluentProvider>
    );
  }

  if (error || !plan) {
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
          Back to Rate Plans
        </Button>

        {/* Header Card */}
        <Card className="org-header-card">
          <div className="org-header-top">
            <div className="org-header-title">
              <Title1>{plan.name}</Title1>
              <div className="org-header-meta">
                {getStatusBadge(plan.status)}
                <CopyableId value={plan.id} />
              </div>
            </div>
            <div className="org-header-actions">
              {!editing && (
                <Button appearance="subtle" onClick={() => setEditing(true)}>Edit</Button>
              )}
              {plan.status !== 'archived' && (
                <Button icon={<Archive24Regular />} appearance="subtle" onClick={() => setShowArchive(true)}>
                  Archive
                </Button>
              )}
            </div>
          </div>

          <div className="org-header-stats">
            <div className="stat-item">
              <span className="stat-label">Product</span>
              <span className="stat-value" style={{ fontSize: '0.9rem' }}>{plan.productId}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Base Price</span>
              <span className="stat-value">${plan.basePrice.toFixed(2)}/mo</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Included Tokens</span>
              <span className="stat-value">{formatTokens(plan.includedTokens)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Overage Rate</span>
              <span className="stat-value">${plan.overageRatePerThousand.toFixed(3)}/1K</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Assigned Orgs</span>
              <span className="stat-value">{plan.assignedOrganizationCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Billing</span>
              <span className="stat-value" style={{ fontSize: '0.9rem' }}>{plan.billingInterval}</span>
            </div>
          </div>
        </Card>

        {/* Plan Details / Edit Form */}
        {editing ? (
          <Card className="settings-form">
            <Title3>Edit Rate Plan</Title3>

            <div className="settings-field">
              <label>Name</label>
              <Input
                value={editForm.name || ''}
                onChange={(_, data) => setEditForm(f => ({ ...f, name: data.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="settings-field">
              <label>Description</label>
              <Textarea
                value={editForm.description || ''}
                onChange={(_, data) => setEditForm(f => ({ ...f, description: data.value }))}
                rows={3}
                style={{ width: '100%' }}
              />
            </div>

            <div className="settings-field">
              <label>Base Price (USD/month)</label>
              <Input
                type="number"
                value={String(editForm.basePrice ?? '')}
                onChange={(_, data) => setEditForm(f => ({ ...f, basePrice: parseFloat(data.value) || 0 }))}
                style={{ width: '200px' }}
              />
            </div>

            <div className="settings-field">
              <label>Included Tokens</label>
              <Input
                type="number"
                value={String(editForm.includedTokens ?? '')}
                onChange={(_, data) => setEditForm(f => ({ ...f, includedTokens: parseInt(data.value) || 0 }))}
                style={{ width: '200px' }}
              />
            </div>

            <div className="settings-field">
              <label>Overage Rate (per 1K tokens)</label>
              <Input
                type="number"
                value={String(editForm.overageRatePerThousand ?? '')}
                onChange={(_, data) => setEditForm(f => ({ ...f, overageRatePerThousand: parseFloat(data.value) || 0 }))}
                style={{ width: '200px' }}
              />
            </div>

            <div className="settings-field">
              <label>Stripe Price ID</label>
              <Input
                value={editForm.stripePriceId || ''}
                onChange={(_, data) => setEditForm(f => ({ ...f, stripePriceId: data.value }))}
                placeholder="price_..."
                style={{ width: '100%' }}
              />
            </div>

            <div className="settings-actions">
              <Button appearance="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button appearance="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              {saveMessage && (
                <Body1 style={{ color: saveMessage.includes('Failed') ? '#d13438' : '#107c10' }}>
                  {saveMessage}
                </Body1>
              )}
            </div>
          </Card>
        ) : (
          <div className="overview-tab">
            <Card className="info-section">
              <Title3>Plan Configuration</Title3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Description</span>
                  <span className="info-value">{plan.description || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Currency</span>
                  <span className="info-value">{plan.currency}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stripe Price ID</span>
                  <span className="info-value">
                    {plan.stripePriceId ? <CopyableId value={plan.stripePriceId} /> : '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Covered Products</span>
                  <span className="info-value">
                    {plan.coveredProductIds.length > 0 ? plan.coveredProductIds.join(', ') : '-'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="info-section">
              <Title3>History</Title3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatDate(plan.createdAt)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDate(plan.updatedAt)}</span>
                </div>
              </div>
            </Card>

            {saveMessage && (
              <Body1 style={{ color: '#107c10', marginTop: '0.5rem' }}>{saveMessage}</Body1>
            )}
          </div>
        )}

        {/* Archive Confirmation */}
        {showArchive && (
          <div className="suspend-overlay">
            <Card className="suspend-card">
              <Title3>Archive Rate Plan</Title3>
              <Body1>
                Are you sure you want to archive <b>{plan.name}</b>?
                This plan has {plan.assignedOrganizationCount} assigned organization(s).
                Archived plans cannot be assigned to new organizations.
              </Body1>
              <div className="suspend-actions">
                <Button appearance="secondary" onClick={() => setShowArchive(false)}>Cancel</Button>
                <Button appearance="primary" onClick={handleArchive}>Archive</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </FluentProvider>
  );
}

export default RatePlanDetailPage;
