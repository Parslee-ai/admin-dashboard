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
  Select,
} from '@fluentui/react-components';
import {
  Money24Regular,
  Open24Regular,
  Warning24Regular,
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import {
  adminApi,
  AdminOrganization,
  InternalInvoice,
  ReconciliationReport,
  StripeSyncResponse,
} from '../services/adminApi';
import { CreateInvoiceDialog } from './OrgBillingTab';

interface AdminBillingTabProps {
  getAccessToken: () => Promise<string | null>;
}

function AdminBillingTab({ getAccessToken }: AdminBillingTabProps) {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invoice state
  const [invoices, setInvoices] = useState<InternalInvoice[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [invoicePeriodFilter, setInvoicePeriodFilter] = useState<string>('');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<StripeSyncResponse | null>(null);

  // Reconciliation state
  const [reconciling, setReconciling] = useState(false);
  const [reconReport, setReconReport] = useState<ReconciliationReport | null>(null);

  // Create invoice dialog state
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [createInvoiceToken, setCreateInvoiceToken] = useState<string | null>(null);

  // Credit dialog state
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditOrg, setCreditOrg] = useState<AdminOrganization | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditSuccess, setCreditSuccess] = useState<string | null>(null);

  // Platform API key from env (for invoice admin endpoints)
  const platformApiKey = (import.meta.env.VITE_PLATFORM_API_KEY as string) || '';

  const fetchOrganizations = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const response = await adminApi.listOrganizations(token, undefined, undefined, 0, 100);
      setOrganizations(response.organizations);
      setError(null);
    } catch (err: unknown) {
      let errorMsg = 'Failed to fetch organizations';
      if (err instanceof Error) errorMsg = err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const fetchInvoices = useCallback(async () => {
    if (!platformApiKey) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      setInvoiceLoading(true);
      const response = await adminApi.listAllInvoices(token, platformApiKey, {
        status: invoiceStatusFilter || undefined,
        billingPeriod: invoicePeriodFilter || undefined,
        limit: 100,
      });
      setInvoices(response.invoices);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setInvoiceLoading(false);
    }
  }, [getAccessToken, platformApiKey, invoiceStatusFilter, invoicePeriodFilter]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [invoiceStatusFilter, invoicePeriodFilter]);

  const handleSyncStripe = async () => {
    if (!platformApiKey) {
      setError('VITE_PLATFORM_API_KEY not configured');
      return;
    }
    const token = await getAccessToken();
    if (!token) return;

    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await adminApi.syncStripeInvoices(token, platformApiKey);
      setSyncResult(result);
      fetchInvoices();
    } catch (err: unknown) {
      let errorMsg = 'Stripe sync failed';
      if (err instanceof Error) errorMsg = err.message;
      setError(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleReconciliation = async () => {
    if (!platformApiKey) {
      setError('VITE_PLATFORM_API_KEY not configured');
      return;
    }
    const token = await getAccessToken();
    if (!token) return;

    setReconciling(true);
    setReconReport(null);
    try {
      const report = await adminApi.getReconciliationReport(token, platformApiKey);
      setReconReport(report);
    } catch (err: unknown) {
      let errorMsg = 'Reconciliation failed';
      if (err instanceof Error) errorMsg = err.message;
      setError(errorMsg);
    } finally {
      setReconciling(false);
    }
  };

  const handleIssueCredit = async () => {
    if (!creditOrg || !creditAmount || !creditReason) return;
    const token = await getAccessToken();
    if (!token) return;

    const amountCents = Math.round(parseFloat(creditAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setCreditError('Amount must be a positive number');
      return;
    }

    setCreditSubmitting(true);
    setCreditError(null);
    try {
      const result = await adminApi.issueCredit(token, creditOrg.id, amountCents, creditReason);
      if (result.success) {
        setCreditSuccess(`Credit of $${creditAmount} issued successfully. Transaction: ${result.transactionId}`);
        setCreditAmount('');
        setCreditReason('');
        setTimeout(() => {
          setCreditDialogOpen(false);
          setCreditSuccess(null);
          fetchOrganizations();
        }, 2000);
      }
    } catch (err: unknown) {
      let errorMsg = 'Failed to issue credit';
      if (err instanceof Error) errorMsg = err.message;
      setCreditError(errorMsg);
    } finally {
      setCreditSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getStatusColor = (status: string): 'success' | 'danger' | 'brand' | 'informative' | 'subtle' => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Failed':
      case 'Uncollectible': return 'danger';
      case 'Submitted': return 'brand';
      case 'Voided': return 'subtle';
      default: return 'informative';
    }
  };

  // Map org IDs to names for the invoice table
  const orgNameMap = organizations.reduce<Record<string, string>>((acc, org) => {
    acc[org.id] = org.displayName || org.name;
    return acc;
  }, {});

  // Filter to orgs with Stripe customers only (billable orgs)
  const billableOrgs = organizations.filter(org => org.stripeCustomerId);

  if (loading) {
    return (
      <div className="admin-loading">
        <Spinner size="large" label="Loading billing data..." />
      </div>
    );
  }

  return (
    <div className="organizations-tab">
      {error && (
        <div className="admin-error">
          <Warning24Regular />
          <Body1>{error}</Body1>
          <Button appearance="subtle" size="small" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <Card className="summary-card">
          <CardHeader
            header={<Title3>Billable Organizations</Title3>}
            description={<Body1>With Stripe customers</Body1>}
          />
          <div className="summary-value">
            <Money24Regular />
            <span>{billableOrgs.length}</span>
          </div>
        </Card>

        <Card className="summary-card">
          <CardHeader
            header={<Title3>Total Monthly Spend</Title3>}
            description={<Body1>Current month across all orgs</Body1>}
          />
          <div className="summary-value mrr">
            <Money24Regular />
            <span>{formatCurrency(billableOrgs.reduce((sum, org) => sum + org.currentMonthSpend, 0))}</span>
          </div>
        </Card>

        <Card className="summary-card">
          <CardHeader
            header={<Title3>Total AIEs</Title3>}
            description={<Body1>Subscribed employees</Body1>}
          />
          <div className="summary-value">
            <span>{billableOrgs.reduce((sum, org) => sum + org.subscribedEmployeeCount, 0)}</span>
          </div>
        </Card>

        <Card className="summary-card">
          <CardHeader
            header={<Title3>Internal Invoices</Title3>}
            description={<Body1>Total in system</Body1>}
          />
          <div className="summary-value">
            <span>{invoices.length}</span>
          </div>
        </Card>
      </div>

      {/* Stripe Sync & Reconciliation */}
      <div className="subscriptions-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Title2>Invoice Operations</Title2>
          <Button
            appearance="primary"
            icon={<ArrowSync24Regular />}
            onClick={handleSyncStripe}
            disabled={syncing || !platformApiKey}
          >
            {syncing ? 'Syncing...' : 'Sync Stripe Invoices'}
          </Button>
          <Button
            appearance="secondary"
            icon={<CheckmarkCircle24Regular />}
            onClick={handleReconciliation}
            disabled={reconciling || !platformApiKey}
          >
            {reconciling ? 'Checking...' : 'Run Reconciliation'}
          </Button>
        </div>

        {!platformApiKey && (
          <Body1 style={{ color: 'var(--colorPaletteRedForeground1)', marginBottom: '12px' }}>
            Set VITE_PLATFORM_API_KEY environment variable to enable sync and reconciliation.
          </Body1>
        )}

        {syncResult && (
          <Card style={{ marginBottom: '16px', padding: '12px' }}>
            <Title3>Sync Results</Title3>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <span>Orgs scanned: <b>{syncResult.organizationsScanned}</b></span>
              <span>Created: <b>{syncResult.invoicesCreated}</b></span>
              <span>Skipped (already synced): <b>{syncResult.invoicesSkipped}</b></span>
              {syncResult.errors.length > 0 && (
                <span style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                  Errors: <b>{syncResult.errors.length}</b>
                </span>
              )}
            </div>
            {syncResult.errors.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--colorPaletteRedForeground1)' }}>
                {syncResult.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </Card>
        )}

        {reconReport && (
          <Card style={{ marginBottom: '16px', padding: '12px' }}>
            <Title3>Reconciliation Report</Title3>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <span>Orgs checked: <b>{reconReport.organizationsChecked}</b></span>
              <span>Flags: <b>{reconReport.flagsFound}</b></span>
            </div>
            {reconReport.flags.length > 0 ? (
              <Table style={{ marginTop: '12px' }}>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Organization</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Severity</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconReport.flags.map((flag, i) => (
                    <TableRow key={i}>
                      <TableCell>{flag.organizationName || flag.organizationId}</TableCell>
                      <TableCell>
                        <Badge appearance="outline">{flag.flagType}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.85rem' }}>{flag.description}</TableCell>
                      <TableCell>
                        <Badge
                          appearance="filled"
                          color={flag.severity === 'critical' ? 'danger' : flag.severity === 'warning' ? 'warning' : 'informative'}
                        >
                          {flag.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Body1 style={{ marginTop: '8px', color: 'var(--colorPaletteGreenForeground1)' }}>
                No reconciliation issues found.
              </Body1>
            )}
          </Card>
        )}
      </div>

      {/* Global Invoice Table */}
      <div className="subscriptions-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Title2>All Invoices</Title2>
          <Button
            icon={<Add24Regular />}
            appearance="primary"
            size="small"
            onClick={async () => {
              const t = await getAccessToken();
              if (t) { setCreateInvoiceToken(t); setCreateInvoiceDialogOpen(true); }
            }}
            disabled={!platformApiKey}
          >
            Create Invoice
          </Button>
          <Select
            value={invoiceStatusFilter}
            onChange={(_, data) => setInvoiceStatusFilter(data.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Finalized">Finalized</option>
            <option value="Submitted">Submitted</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Voided">Voided</option>
          </Select>
          <Input
            placeholder="Period (yyyy-MM)"
            value={invoicePeriodFilter}
            onChange={(_, data) => setInvoicePeriodFilter(data.value)}
            style={{ width: '140px' }}
          />
          {invoiceLoading && <Spinner size="tiny" />}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Invoice #</TableHeaderCell>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Period</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Channel</TableHeaderCell>
              <TableHeaderCell>Stripe</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.number}</TableCell>
                <TableCell>{orgNameMap[inv.organizationId] || inv.organizationId}</TableCell>
                <TableCell>{inv.billingPeriod}</TableCell>
                <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                <TableCell>
                  <Badge appearance="filled" color={getStatusColor(inv.status)} size="small">
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge appearance="outline" size="small">{inv.billingChannel}</Badge>
                </TableCell>
                <TableCell>
                  {inv.channelReferenceId && (
                    <Button
                      as="a"
                      href={`https://dashboard.stripe.com/invoices/${inv.channelReferenceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      appearance="subtle"
                      size="small"
                      icon={<Open24Regular />}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && !invoiceLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  {platformApiKey ? 'No invoices found. Run "Sync Stripe Invoices" to import.' : 'Configure VITE_PLATFORM_API_KEY to view invoices.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Organization Billing Table */}
      <div className="subscriptions-section">
        <Title2>Organization Billing</Title2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Stripe Customer</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>AIEs</TableHeaderCell>
              <TableHeaderCell>Current Spend</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billableOrgs.map(org => (
              <TableRow
                key={org.id}
                className="clickable-row"
                onClick={() => { window.location.href = `/dashboard/admin/orgs/${org.id}`; }}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{org.displayName || org.name}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  {org.stripeCustomerId && (
                    <Button
                      as="a"
                      href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      appearance="subtle"
                      size="small"
                      icon={<Open24Regular />}
                      iconPosition="after"
                    >
                      {org.stripeCustomerId.substring(0, 18)}...
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="filled"
                    color={org.status === 'Active' ? 'success' : org.status === 'Suspended' ? 'danger' : 'informative'}
                  >
                    {org.status}
                  </Badge>
                </TableCell>
                <TableCell>{org.subscribedEmployeeCount}</TableCell>
                <TableCell>{formatCurrency(org.currentMonthSpend)}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Button
                    icon={<Money24Regular />}
                    size="small"
                    onClick={() => {
                      setCreditOrg(org);
                      setCreditDialogOpen(true);
                      setCreditError(null);
                      setCreditSuccess(null);
                      setCreditAmount('');
                      setCreditReason('');
                    }}
                  >
                    Credit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {billableOrgs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No billable organizations found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Invoice Dialog (global — needs org ID input) */}
      {createInvoiceDialogOpen && createInvoiceToken && (
        <CreateInvoiceDialog
          token={createInvoiceToken}
          hasStripe={false}
          onCreated={() => { setCreateInvoiceDialogOpen(false); fetchInvoices(); }}
          onClose={() => setCreateInvoiceDialogOpen(false)}
        />
      )}

      {/* Issue Credit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={(e, data) => setCreditDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Issue Credit</DialogTitle>
            <DialogContent>
              {creditOrg && (
                <>
                  <Body1 style={{ marginBottom: '1rem' }}>
                    Issue a credit to <b>{creditOrg.displayName || creditOrg.name}</b> ({creditOrg.id})
                  </Body1>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Input
                      type="number"
                      placeholder="Amount in USD (e.g., 50.00)"
                      value={creditAmount}
                      onChange={(e, data) => setCreditAmount(data.value)}
                      contentBefore={<span>$</span>}
                    />
                    <Textarea
                      placeholder="Reason for credit..."
                      value={creditReason}
                      onChange={(e, data) => setCreditReason(data.value)}
                      rows={3}
                    />
                  </div>
                  {creditError && (
                    <div style={{ color: 'var(--colorPaletteRedForeground1)', marginTop: '8px' }}>
                      {creditError}
                    </div>
                  )}
                  {creditSuccess && (
                    <div style={{ color: 'var(--colorPaletteGreenForeground1)', marginTop: '8px' }}>
                      {creditSuccess}
                    </div>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCreditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleIssueCredit}
                disabled={!creditAmount || !creditReason || creditSubmitting}
              >
                {creditSubmitting ? 'Issuing...' : 'Issue Credit'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default AdminBillingTab;
