import { useEffect, useState, useCallback } from 'react';
import {
  Spinner,
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Archive24Regular,
  ArrowClockwise24Regular,
  Warning24Regular,
  DataBarVertical24Regular,
} from '@fluentui/react-icons';
import { adminApi, RatePlan, CreateRatePlanRequest } from '../services/adminApi';

interface RatePlansTabProps {
  getAccessToken: () => Promise<string | null>;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return (tokens / 1_000_000).toFixed(1) + 'M';
  }
  return tokens.toLocaleString();
}

function formatPrice(amount: number): string {
  return '$' + amount.toFixed(2);
}

function formatOverageRate(rate: number): string {
  return '$' + rate.toFixed(3) + '/1K';
}

function RatePlansTab({ getAccessToken }: RatePlansTabProps) {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRatePlanRequest>({
    productId: '',
    name: '',
    description: '',
    basePrice: 0,
    includedTokens: 0,
    overageRatePerThousand: 0,
    stripePriceId: '',
    billingInterval: 'monthly',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Archive confirmation state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingPlan, setArchivingPlan] = useState<RatePlan | null>(null);

  // Assign dialog state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOrgId, setAssignOrgId] = useState('');
  const [assignProductId, setAssignProductId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchRatePlans = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const data = await adminApi.listRatePlans(
        token,
        undefined,
        statusFilter || undefined
      );
      setRatePlans(data);
      setError(null);
    } catch (err: unknown) {
      let errorMsg = 'Failed to fetch rate plans';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; details?: string }; status?: number } };
        if (axiosErr.response?.data?.details) {
          errorMsg = `${axiosErr.response.data.error}: ${axiosErr.response.data.details}`;
        } else if (axiosErr.response?.data?.error) {
          errorMsg = axiosErr.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, statusFilter]);

  useEffect(() => {
    fetchRatePlans();
  }, []);

  useEffect(() => {
    fetchRatePlans();
  }, [statusFilter]);

  const handleRefresh = () => {
    fetchRatePlans();
  };

  // Summary calculations
  const totalPlans = ratePlans.length;
  const activePlans = ratePlans.filter(p => p.status === 'active').length;
  const distinctProducts = new Set(ratePlans.map(p => p.productId)).size;

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'informative'> = {
      active: 'success',
      archived: 'informative',
      draft: 'warning',
    };
    return <Badge appearance="filled" color={statusColors[status] || 'informative'}>{status}</Badge>;
  };

  // Create plan handler
  const handleCreate = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const payload: CreateRatePlanRequest = {
        productId: createForm.productId,
        name: createForm.name,
        basePrice: createForm.basePrice,
        includedTokens: createForm.includedTokens,
        overageRatePerThousand: createForm.overageRatePerThousand,
      };
      if (createForm.description) payload.description = createForm.description;
      if (createForm.stripePriceId) payload.stripePriceId = createForm.stripePriceId;
      if (createForm.billingInterval) payload.billingInterval = createForm.billingInterval;

      await adminApi.createRatePlan(token, payload);
      setCreateOpen(false);
      setCreateForm({
        productId: '',
        name: '',
        description: '',
        basePrice: 0,
        includedTokens: 0,
        overageRatePerThousand: 0,
        stripePriceId: '',
        billingInterval: 'monthly',
      });
      fetchRatePlans();
    } catch (err: unknown) {
      let errorMsg = 'Failed to create rate plan';
      if (err instanceof Error) errorMsg = err.message;
      setCreateError(errorMsg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Archive handler
  const handleArchive = async () => {
    if (!archivingPlan) return;
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.archiveRatePlan(token, archivingPlan.id);
      setArchiveOpen(false);
      setArchivingPlan(null);
      fetchRatePlans();
    } catch (err) {
      console.error('Failed to archive rate plan:', err);
    }
  };

  // Assign handler
  const handleAssign = async () => {
    if (!assignOrgId || !assignProductId || !assignPlanId) return;
    const token = await getAccessToken();
    if (!token) return;

    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await adminApi.assignRatePlan(token, assignOrgId, assignProductId, assignPlanId);
      setAssignOpen(false);
      setAssignOrgId('');
      setAssignProductId('');
      setAssignPlanId('');
      fetchRatePlans();
    } catch (err: unknown) {
      let errorMsg = 'Failed to assign rate plan';
      if (err instanceof Error) errorMsg = err.message;
      setAssignError(errorMsg);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const activePlanOptions = ratePlans.filter(p => p.status === 'active');

  if (loading && ratePlans.length === 0) {
    return (
      <div className="admin-loading">
        <Spinner size="large" label="Loading rate plans..." />
      </div>
    );
  }

  return (
    <div className="organizations-tab">
      {error && (
        <div className="admin-error">
          <Warning24Regular />
          <Body1>{error}</Body1>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <Card className="summary-card">
          <CardHeader
            header={<Title3>Total Plans</Title3>}
            description={<Body1>All rate plans</Body1>}
          />
          <div className="summary-value">
            <DataBarVertical24Regular />
            <span>{totalPlans}</span>
          </div>
        </Card>

        <Card className="summary-card">
          <CardHeader
            header={<Title3>Active Plans</Title3>}
            description={<Body1>Currently active</Body1>}
          />
          <div className="summary-value">
            <DataBarVertical24Regular />
            <span>{activePlans}</span>
          </div>
        </Card>

        <Card className="summary-card">
          <CardHeader
            header={<Title3>Products</Title3>}
            description={<Body1>Distinct products with plans</Body1>}
          />
          <div className="summary-value">
            <DataBarVertical24Regular />
            <span>{distinctProducts}</span>
          </div>
        </Card>
      </div>

      {/* Rate Plans Table */}
      <div className="subscriptions-section">
        <div className="section-header">
          <Title2>Rate Plans</Title2>
          <div className="action-buttons">
            <Button
              icon={<Add24Regular />}
              appearance="primary"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              Create Plan
            </Button>
            <Button
              icon={<Add24Regular />}
              appearance="outline"
              onClick={() => {
                setAssignError(null);
                setAssignOrgId('');
                setAssignProductId('');
                setAssignPlanId('');
                setAssignOpen(true);
              }}
            >
              Assign to Org
            </Button>
            <Button icon={<ArrowClockwise24Regular />} onClick={handleRefresh} appearance="subtle">
              Refresh
            </Button>
          </div>
        </div>

        <div className="filters-row">
          <Select
            value={statusFilter}
            onChange={(_e, data) => setStatusFilter(data.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Base Price</TableHeaderCell>
              <TableHeaderCell>Included Tokens</TableHeaderCell>
              <TableHeaderCell>Overage Rate</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Assigned Orgs</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratePlans.map(plan => (
              <TableRow
                key={plan.id}
                className="clickable-row"
                onClick={() => { window.location.href = `/dashboard/admin/rate-plans/${plan.id}`; }}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{plan.name}</TableCell>
                <TableCell><code>{plan.productId}</code></TableCell>
                <TableCell>{formatPrice(plan.basePrice)}</TableCell>
                <TableCell>{formatTokens(plan.includedTokens)}</TableCell>
                <TableCell>{formatOverageRate(plan.overageRatePerThousand)}</TableCell>
                <TableCell>{getStatusBadge(plan.status)}</TableCell>
                <TableCell>{plan.assignedOrganizationCount}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="action-buttons">
                    {plan.status !== 'archived' && (
                      <Button
                        icon={<Archive24Regular />}
                        size="small"
                        title="Archive"
                        onClick={() => {
                          setArchivingPlan(plan);
                          setArchiveOpen(true);
                        }}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {ratePlans.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>No rate plans found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={(_e, data) => setCreateOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '600px', width: '90vw' }}>
          <DialogBody>
            <DialogTitle>Create Rate Plan</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Product ID</Body1>
                  <Input
                    value={createForm.productId}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, productId: data.value }))}
                    placeholder="e.g., parslee-core"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Name</Body1>
                  <Input
                    value={createForm.name}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, name: data.value }))}
                    placeholder="e.g., Core Standard Monthly"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Description</Body1>
                  <Textarea
                    value={createForm.description || ''}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, description: data.value }))}
                    placeholder="Plan description..."
                    rows={2}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Base Price (USD)</Body1>
                  <Input
                    type="number"
                    value={String(createForm.basePrice)}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, basePrice: parseFloat(data.value) || 0 }))}
                    contentBefore={<span>$</span>}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Included Tokens</Body1>
                  <Input
                    type="number"
                    value={String(createForm.includedTokens)}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, includedTokens: parseInt(data.value) || 0 }))}
                    placeholder="e.g., 5000000"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Overage Rate (per 1K tokens)</Body1>
                  <Input
                    type="number"
                    value={String(createForm.overageRatePerThousand)}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, overageRatePerThousand: parseFloat(data.value) || 0 }))}
                    contentBefore={<span>$</span>}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Stripe Price ID (optional)</Body1>
                  <Input
                    value={createForm.stripePriceId || ''}
                    onChange={(_e, data) => setCreateForm(prev => ({ ...prev, stripePriceId: data.value }))}
                    placeholder="price_..."
                    style={{ width: '100%' }}
                  />
                </div>
                {createError && (
                  <div style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                    {createError}
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleCreate}
                disabled={!createForm.productId || !createForm.name || createSubmitting}
              >
                {createSubmitting ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveOpen} onOpenChange={(_e, data) => setArchiveOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Archive Rate Plan</DialogTitle>
            <DialogContent>
              {archivingPlan && (
                <Body1>
                  Are you sure you want to archive <b>{archivingPlan.name}</b>?
                  This plan has {archivingPlan.assignedOrganizationCount} assigned organization(s).
                  Archived plans cannot be assigned to new organizations.
                </Body1>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setArchiveOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleArchive}>
                Archive
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Assign to Org Dialog */}
      <Dialog open={assignOpen} onOpenChange={(_e, data) => setAssignOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '500px', width: '90vw' }}>
          <DialogBody>
            <DialogTitle>Assign Rate Plan to Organization</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Organization ID</Body1>
                  <Input
                    value={assignOrgId}
                    onChange={(_e, data) => setAssignOrgId(data.value)}
                    placeholder="org_..."
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Product ID</Body1>
                  <Input
                    value={assignProductId}
                    onChange={(_e, data) => setAssignProductId(data.value)}
                    placeholder="e.g., parslee-core"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Body1 style={{ fontWeight: 600, marginBottom: '4px' }}>Rate Plan</Body1>
                  <Select
                    value={assignPlanId}
                    onChange={(_e, data) => setAssignPlanId(data.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a plan...</option>
                    {activePlanOptions.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.productId}) - {formatPrice(plan.basePrice)}/mo
                      </option>
                    ))}
                  </Select>
                </div>
                {assignError && (
                  <div style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                    {assignError}
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleAssign}
                disabled={!assignOrgId || !assignProductId || !assignPlanId || assignSubmitting}
              >
                {assignSubmitting ? 'Assigning...' : 'Assign Plan'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default RatePlansTab;
