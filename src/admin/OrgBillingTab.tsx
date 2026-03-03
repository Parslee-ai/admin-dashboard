import { useEffect, useState, useCallback } from 'react';
import {
  Title3,
  Body1,
  Card,
  Badge,
  Button,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Textarea,
  Checkbox,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ArrowSync24Regular,
  Open24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Add24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import {
  adminApi,
  OrgBillingSummary,
  ProductBillingEntry,
  EmployeeBillingEntry,
  BillingInvoiceSummary,
  CreateInvoiceLineItemRequest,
  AdminEmployee,
  UpdateEmployeeSubscriptionRequest,
} from '../services/adminApi';
import { Edit24Regular } from '@fluentui/react-icons';

interface OrgBillingTabProps {
  orgId: string;
  token: string;
}

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M tokens`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K tokens`;
  return `${tokens} tokens`;
}

function getStatusBadgeColor(status: string): 'success' | 'danger' | 'informative' | 'brand' | 'subtle' {
  switch (status) {
    case 'Paid': return 'success';
    case 'Failed': return 'danger';
    case 'Voided': return 'subtle';
    case 'Submitted': return 'brand';
    default: return 'informative';
  }
}

export default function OrgBillingTab({ orgId, token }: OrgBillingTabProps) {
  const [billingData, setBillingData] = useState<OrgBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'product' | 'user'>('product');
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await adminApi.getOrganizationEmployees(token, orgId);
      setEmployees(data);
    } catch (err: unknown) {
      console.error('Failed to load employees:', err);
    }
  }, [token, orgId]);

  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getBillingSummary(token, orgId, period);
      setBillingData(data);
      // Auto-expand first product/employee
      if (data.products.length > 0) {
        setExpandedProducts(new Set([data.products[0].productCode]));
      }
      if (data.employees.length > 0) {
        setExpandedEmployees(new Set([data.employees[0].employeeId]));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load billing data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, orgId, period]);

  useEffect(() => {
    fetchBillingData();
    fetchEmployees();
  }, [fetchBillingData, fetchEmployees]);

  const navigatePeriod = (direction: -1 | 1) => {
    const [year, month] = period.split('-').map(Number);
    const d = new Date(year, month - 1 + direction, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const periodLabel = (() => {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  })();

  const toggleProduct = (code: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleEmployee = (id: string) => {
    setExpandedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Spinner label="Loading billing data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="info-section">
        <Body1 style={{ color: '#d13438' }}>Error: {error}</Body1>
        <Button appearance="subtle" onClick={fetchBillingData}>Retry</Button>
      </Card>
    );
  }

  if (!billingData) return null;

  const filteredInvoices = invoiceStatusFilter === 'All'
    ? billingData.invoices
    : billingData.invoices.filter(inv => inv.status === invoiceStatusFilter);

  const subscriptionProducts = billingData.products.filter(p => p.category === 'subscription');
  const usageProducts = billingData.products.filter(p => p.category === 'usage');

  return (
    <div className="billing-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Period Selector + View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button icon={<ChevronLeft24Regular />} appearance="subtle" size="small" onClick={() => navigatePeriod(-1)} title="Previous month" />
          <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>{periodLabel}</span>
          <Button icon={<ChevronRight24Regular />} appearance="subtle" size="small" onClick={() => navigatePeriod(1)} title="Next month" />
          <Button icon={<ArrowSync24Regular />} appearance="subtle" size="small" onClick={fetchBillingData} title="Refresh" />
        </div>
        <div style={{ display: 'flex', gap: '2px', background: '#f0f0f0', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setViewMode('product')}
            style={{
              padding: '0.35rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              background: viewMode === 'product' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'product' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              fontWeight: viewMode === 'product' ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            By Product
          </button>
          <button
            onClick={() => setViewMode('user')}
            style={{
              padding: '0.35rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              background: viewMode === 'user' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'user' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              fontWeight: viewMode === 'user' ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            By User
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <BillingSummaryCard data={billingData} />

      {/* By Product View */}
      {viewMode === 'product' && (
        <>
          <SubscriptionsSection
            products={subscriptionProducts}
            expanded={expandedProducts}
            onToggle={toggleProduct}
            employees={employees}
            orgId={orgId}
            token={token}
            onEmployeeUpdated={() => { fetchEmployees(); fetchBillingData(); }}
            ratePlanName={billingData.ratePlanName}
          />
          <UsageSection
            products={usageProducts}
            expanded={expandedProducts}
            onToggle={toggleProduct}
          />
        </>
      )}

      {/* By User View */}
      {viewMode === 'user' && (
        <ByUserSection
          employees={billingData.employees}
          expanded={expandedEmployees}
          onToggle={toggleEmployee}
          usageTotal={billingData.usageTotal}
        />
      )}

      {/* Invoices (shared) */}
      <InvoicesSection
        invoices={filteredInvoices}
        allInvoices={billingData.invoices}
        statusFilter={invoiceStatusFilter}
        onStatusFilterChange={setInvoiceStatusFilter}
        orgId={orgId}
        token={token}
        hasStripe={!!billingData.stripeCustomerId}
        onInvoiceCreated={fetchBillingData}
      />
    </div>
  );
}

// --- Sub-components ---

function BillingSummaryCard({ data }: { data: OrgBillingSummary }) {
  return (
    <Card className="info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Title3>Month Summary</Title3>
        <span style={{ color: '#666', fontSize: '0.85rem' }}>{data.billingPeriod}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '0.75rem 0' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Total</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(data.totalAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Subscriptions</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatCurrency(data.subscriptionTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Usage</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatCurrency(data.usageTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Credits</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>-{formatCurrency(data.credits)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#444', borderTop: '1px solid #e8e8e8', paddingTop: '0.5rem' }}>
        <span>
          Stripe:{' '}
          {data.stripeCustomerId ? (
            <>
              <CopyableId value={data.stripeCustomerId} />
              <a
                href={`https://dashboard.stripe.com/customers/${data.stripeCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '0.25rem' }}
              >
                <Open24Regular style={{ width: 14, height: 14, verticalAlign: 'middle' }} />
              </a>
            </>
          ) : (
            <span style={{ color: '#d13438' }}>Not linked</span>
          )}
        </span>
        {data.ratePlanName && (
          <span>Rate Plan: <strong>{data.ratePlanName}</strong></span>
        )}
        {data.budgetLimit > 0 && (
          <span>Budget: {formatCurrency(data.budgetLimit)}</span>
        )}
      </div>
    </Card>
  );
}

const TEMPLATE_CATEGORIES: Record<string, string> = {
  'generic-chat': 'General',
  'casey-support': 'Support',
  'charter-quoting': 'Sales',
  'quinn-sales': 'Sales',
  'sage-sales-trainer': 'Sales',
  'coach-sales-coaching': 'Sales',
  'devin-developer': 'Technology',
  'alex-pm': 'Operations',
  'sam-ea': 'Executive',
  'blake-legal': 'Legal',
  'harper-hr': 'HR',
  'jordan-analyst': 'Analytics',
  'marshall-pm': 'Operations',
  'morgan-finance': 'Finance',
  'riley-social': 'Marketing',
  'taylor-marketing': 'Marketing',
  'moira-compliance': 'Legal',
  'lana-admin': 'Operations',
  'flyex-ops': 'Support',
};

const SUBSCRIPTION_STATUSES = ['active', 'canceled', 'past_due', 'trialing', 'unpaid'];

function getSubStatusColor(status: string): 'success' | 'danger' | 'warning' | 'informative' | 'subtle' {
  switch (status) {
    case 'active': return 'success';
    case 'trialing': return 'informative';
    case 'canceled': return 'danger';
    case 'past_due':
    case 'unpaid': return 'warning';
    default: return 'subtle';
  }
}

function getEmpStatusColor(status: string): 'success' | 'danger' | 'informative' | 'subtle' {
  switch (status) {
    case 'Active': return 'success';
    case 'Suspended': return 'danger';
    case 'Deleted': return 'subtle';
    default: return 'informative';
  }
}

function getTemplateCategory(sourceTemplateId?: string): string {
  if (!sourceTemplateId) return 'General';
  return TEMPLATE_CATEGORIES[sourceTemplateId] ?? 'General';
}

function SubscriptionsSection({
  products,
  expanded,
  onToggle,
  employees,
  orgId,
  token,
  onEmployeeUpdated,
  ratePlanName,
}: {
  products: ProductBillingEntry[];
  expanded: Set<string>;
  onToggle: (code: string) => void;
  employees: AdminEmployee[];
  orgId: string;
  token: string;
  onEmployeeUpdated: () => void;
  ratePlanName: string | null;
}) {
  const total = products.reduce((sum, p) => sum + p.totalAmount, 0);
  return (
    <Card className="info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title3>Subscriptions</Title3>
          {ratePlanName && (
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{ratePlanName}</div>
          )}
        </div>
        <span style={{ fontWeight: 600, color: '#444' }}>{formatCurrency(total)}/mo</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        {products.map(product => (
          <ProductGroup
            key={product.productCode}
            product={product}
            isExpanded={expanded.has(product.productCode)}
            onToggle={() => onToggle(product.productCode)}
            employees={product.productCode === 'aie' ? employees : undefined}
            orgId={orgId}
            token={token}
            onEmployeeUpdated={onEmployeeUpdated}
            ratePlanName={ratePlanName}
          />
        ))}
        {products.length === 0 && (
          <Body1 style={{ color: '#666' }}>No active subscriptions</Body1>
        )}
      </div>
    </Card>
  );
}

function ProductGroup({
  product,
  isExpanded,
  onToggle,
  employees,
  orgId,
  token,
  onEmployeeUpdated,
  ratePlanName,
}: {
  product: ProductBillingEntry;
  isExpanded: boolean;
  onToggle: () => void;
  employees?: AdminEmployee[];
  orgId: string;
  token: string;
  onEmployeeUpdated: () => void;
  ratePlanName: string | null;
}) {
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeSubscriptionRequest>({});
  const [saving, setSaving] = useState(false);

  const toggleEmployeeRow = (id: string) => {
    setExpandedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startEdit = (emp: AdminEmployee) => {
    setEditingId(emp.id);
    setEditForm({
      subscriptionId: emp.subscription?.subscriptionId ?? '',
      priceId: emp.subscription?.priceId ?? '',
      status: emp.subscription?.status ?? '',
    });
    if (!expandedEmployeeIds.has(emp.id)) {
      setExpandedEmployeeIds(prev => new Set(prev).add(emp.id));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (employeeId: string) => {
    setSaving(true);
    try {
      await adminApi.updateEmployeeSubscription(token, orgId, employeeId, editForm);
      setEditingId(null);
      setEditForm({});
      onEmployeeUpdated();
    } catch (err: unknown) {
      console.error('Failed to update subscription:', err);
    } finally {
      setSaving(false);
    }
  };

  const isAie = product.productCode === 'aie' && employees;
  const hasBreakdown = product.employeeBreakdown.length > 0;

  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 0.75rem',
          border: 'none',
          background: isExpanded ? '#f8f8f8' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {isExpanded ? '▾' : '▸'} {product.productName}
        </span>
        <span style={{ color: '#444', fontSize: '0.9rem' }}>
          {product.quantity != null && product.unitPrice != null
            ? `${product.quantity} seat${product.quantity !== 1 ? 's' : ''} × ${formatCurrency(product.unitPrice)} = ${formatCurrency(product.totalAmount)}`
            : formatCurrency(product.totalAmount)}
        </span>
      </button>
      {isExpanded && isAie && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          {employees.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.5rem' }}>
              {employees.map(emp => {
                const isRowExpanded = expandedEmployeeIds.has(emp.id);
                const isEditing = editingId === emp.id;
                const category = getTemplateCategory(emp.sourceTemplateId);
                const displayName = emp.preferredName ?? emp.name;
                const breakdown = product.employeeBreakdown.find(b => b.employeeId === emp.id);
                const cost = breakdown?.cost;
                const tokens = breakdown?.consumption ?? 0;
                const isNonSubscribed = !emp.subscription || emp.subscription.status === 'canceled';

                return (
                  <div key={emp.id} style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', opacity: isNonSubscribed ? 0.7 : 1 }}>
                    <button
                      onClick={() => toggleEmployeeRow(emp.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.6rem',
                        border: 'none',
                        background: isRowExpanded ? '#fafafa' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>{isRowExpanded ? '▾' : '▸'}</span>
                        <span style={{ fontWeight: isNonSubscribed ? 400 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isNonSubscribed ? '#888' : undefined }}>
                          {displayName}
                        </span>
                        <Badge appearance="outline" color="brand" size="small" style={{ flexShrink: 0 }}>
                          {category} · {emp.typeId}
                        </Badge>
                        <Badge appearance="filled" color={getEmpStatusColor(emp.employeeStatus)} size="small" style={{ flexShrink: 0 }}>
                          {emp.employeeStatus}
                        </Badge>
                        {emp.subscription ? (
                          <Badge appearance="filled" color={getSubStatusColor(emp.subscription.status)} size="small" style={{ flexShrink: 0 }}>
                            {emp.subscription.status}
                          </Badge>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.8rem', flexShrink: 0 }}>No subscription</span>
                        )}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatTokens(tokens)}</span>
                        {!isNonSubscribed && cost != null ? (
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>{formatCurrency(cost)}/mo</span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#bbb' }}>-</span>
                        )}
                      </span>
                    </button>

                    {isRowExpanded && !isEditing && (
                      <div style={{ padding: '0.5rem 0.6rem 0.5rem', paddingLeft: '2rem', background: '#fafafa', fontSize: '0.85rem' }}>
                        {emp.subscription && !isNonSubscribed ? (
                          <>
                            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>
                              Billing: {formatDate(emp.subscription.currentPeriodStart)} – {formatDate(emp.subscription.currentPeriodEnd)}
                              {ratePlanName && cost != null && (
                                <span style={{ fontWeight: 400, color: '#666' }}> · Rate Plan: {ratePlanName} ({formatCurrency(cost)}/mo)</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', color: '#666' }}>
                              <span>Sub ID: {emp.subscription.subscriptionId ? <CopyableId value={emp.subscription.subscriptionId} /> : '-'}</span>
                              <span>Price ID: {emp.subscription.priceId ? <code style={{ fontSize: '0.8rem' }}>{emp.subscription.priceId}</code> : '-'}</span>
                              <span>Tokens: {formatNumber(tokens)} this period</span>
                              <Button
                                icon={<Edit24Regular />}
                                appearance="subtle"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); startEdit(emp); }}
                              >
                                Edit Subscription
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', color: '#888' }}>
                            <span>No active subscription</span>
                            <span>{formatNumber(tokens)} tokens this period</span>
                            <Button
                              icon={<Edit24Regular />}
                              appearance="subtle"
                              size="small"
                              onClick={(e) => { e.stopPropagation(); startEdit(emp); }}
                            >
                              Edit Subscription
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {isRowExpanded && isEditing && (
                      <div style={{ padding: '0.5rem 0.6rem', paddingLeft: '2rem', background: '#fafafa', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#666' }}>Status</label>
                          <Dropdown
                            value={editForm.status || '(none)'}
                            selectedOptions={editForm.status ? [editForm.status] : []}
                            onOptionSelect={(_, data) => setEditForm(prev => ({ ...prev, status: data.optionValue ?? '' }))}
                            size="small"
                            style={{ minWidth: '110px' }}
                          >
                            <Option value="">(none)</Option>
                            {SUBSCRIPTION_STATUSES.map(s => (
                              <Option key={s} value={s}>{s}</Option>
                            ))}
                          </Dropdown>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#666' }}>Subscription ID</label>
                          <Input
                            value={editForm.subscriptionId ?? ''}
                            onChange={(_, data) => setEditForm(prev => ({ ...prev, subscriptionId: data.value }))}
                            placeholder="sub_xxx"
                            size="small"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#666' }}>Price ID</label>
                          <Input
                            value={editForm.priceId ?? ''}
                            onChange={(_, data) => setEditForm(prev => ({ ...prev, priceId: data.value }))}
                            placeholder="price_xxx"
                            size="small"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button
                            appearance="primary"
                            size="small"
                            onClick={() => handleSave(emp.id)}
                            disabled={saving}
                          >
                            {saving ? '...' : 'Save'}
                          </Button>
                          <Button
                            appearance="subtle"
                            size="small"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Body1 style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              No employees found
            </Body1>
          )}
          {product.marketplaceSubscriptionId && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge appearance="outline" color="informative" size="small">Mktpl</Badge>
              <CopyableId value={product.marketplaceSubscriptionId} />
              {product.marketplacePlanId && (
                <span>· Plan: <code>{product.marketplacePlanId}</code></span>
              )}
            </div>
          )}
        </div>
      )}
      {isExpanded && !isAie && hasBreakdown && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <table className="admin-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Employee</th>
                <th style={{ width: '20%' }}>Status</th>
                <th style={{ width: '20%' }}>Since</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {product.employeeBreakdown.map(emp => (
                <tr key={emp.employeeId}>
                  <td>{emp.employeeName}</td>
                  <td>
                    <Badge
                      appearance="filled"
                      color={emp.status === 'active' ? 'success' : emp.status === 'canceled' ? 'danger' : 'informative'}
                      size="small"
                    >
                      {emp.status || 'active'}
                    </Badge>
                  </td>
                  <td style={{ color: '#666' }}>-</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(emp.cost)}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
          {product.marketplaceSubscriptionId && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge appearance="outline" color="informative" size="small">Mktpl</Badge>
              <CopyableId value={product.marketplaceSubscriptionId} />
              {product.marketplacePlanId && (
                <span>· Plan: <code>{product.marketplacePlanId}</code></span>
              )}
            </div>
          )}
        </div>
      )}
      {isExpanded && !isAie && !hasBreakdown && (
        <div style={{ padding: '0.5rem 0.75rem', color: '#666', fontSize: '0.85rem' }}>
          No employees assigned to this product
        </div>
      )}
    </div>
  );
}

function UsageSection({
  products,
  expanded,
  onToggle,
}: {
  products: ProductBillingEntry[];
  expanded: Set<string>;
  onToggle: (code: string) => void;
}) {
  const total = products.reduce((sum, p) => sum + p.totalAmount, 0);
  return (
    <Card className="info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title3>Usage</Title3>
        <span style={{ fontWeight: 600, color: '#444' }}>{formatCurrency(total)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        {products.map(product => (
          <UsageGroup
            key={product.productCode}
            product={product}
            isExpanded={expanded.has(product.productCode)}
            onToggle={() => onToggle(product.productCode)}
          />
        ))}
        {products.length === 0 && (
          <Body1 style={{ color: '#666' }}>No usage recorded for this period</Body1>
        )}
      </div>
    </Card>
  );
}

function UsageGroup({
  product,
  isExpanded,
  onToggle,
}: {
  product: ProductBillingEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 0.75rem',
          border: 'none',
          background: isExpanded ? '#f8f8f8' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {isExpanded ? '▾' : '▸'} {product.productName}
        </span>
        <span style={{ color: '#444', fontSize: '0.9rem' }}>
          {formatCurrency(product.totalAmount)}
        </span>
      </button>
      {isExpanded && (
        <div style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {product.includedAmount != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Pool</div>
                <div style={{ fontWeight: 600 }}>{formatNumber(product.includedAmount)}</div>
              </div>
            )}
            {product.totalConsumption != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Used</div>
                <div style={{ fontWeight: 600 }}>{formatNumber(product.totalConsumption)}</div>
              </div>
            )}
            {product.overageAmount != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Overage</div>
                <div style={{ fontWeight: 600, color: product.overageAmount > 0 ? '#d13438' : 'inherit' }}>
                  {formatNumber(product.overageAmount)}
                </div>
              </div>
            )}
            {product.unitRate != null && product.unitLabel && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Rate</div>
                <div style={{ fontWeight: 600 }}>{formatCurrency(product.unitRate)} {product.unitLabel}</div>
              </div>
            )}
          </div>
          {product.employeeBreakdown.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th style={{ textAlign: 'right' }}>Consumption</th>
                  <th style={{ textAlign: 'right' }}>% of Pool</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {product.employeeBreakdown.map(emp => (
                  <tr key={emp.employeeId}>
                    <td>{emp.employeeName}</td>
                    <td style={{ textAlign: 'right' }}>{emp.consumption != null ? formatNumber(emp.consumption) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{emp.percentOfTotal != null ? `${emp.percentOfTotal.toFixed(1)}%` : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(emp.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Body1 style={{ color: '#666', fontSize: '0.85rem' }}>
              Org-level totals only — per-employee breakdown coming soon
            </Body1>
          )}
        </div>
      )}
    </div>
  );
}

function ByUserSection({
  employees,
  expanded,
  onToggle,
  usageTotal,
}: {
  employees: EmployeeBillingEntry[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  usageTotal: number;
}) {
  return (
    <>
      <Card className="info-section">
        <Title3>Cost By User</Title3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {employees.map(emp => (
            <EmployeeGroup
              key={emp.employeeId}
              employee={emp}
              isExpanded={expanded.has(emp.employeeId)}
              onToggle={() => onToggle(emp.employeeId)}
            />
          ))}
          {employees.length === 0 && (
            <Body1 style={{ color: '#666' }}>No employees found</Body1>
          )}
        </div>
      </Card>
      {usageTotal > 0 && (
        <Card className="info-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title3>Unassigned Costs</Title3>
            <span style={{ fontWeight: 600, color: '#444' }}>{formatCurrency(usageTotal)}</span>
          </div>
          <Body1 style={{ color: '#666', marginTop: '0.5rem' }}>
            Token pool overage (shared, not attributable to individual users): {formatCurrency(usageTotal)}
          </Body1>
        </Card>
      )}
    </>
  );
}

function EmployeeGroup({
  employee,
  isExpanded,
  onToggle,
}: {
  employee: EmployeeBillingEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 0.75rem',
          border: 'none',
          background: isExpanded ? '#f8f8f8' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {isExpanded ? '▾' : '▸'} {employee.employeeName}
        </span>
        <span style={{ color: '#444', fontSize: '0.9rem' }}>
          Total: {formatCurrency(employee.totalCost)}
        </span>
      </button>
      {isExpanded && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <table className="admin-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Product</th>
                <th style={{ width: '20%' }}>Type</th>
                <th style={{ width: '30%' }}>Detail</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {employee.productBreakdown.map((prod, i) => (
                <tr key={i}>
                  <td>{prod.productName}</td>
                  <td>
                    <Badge appearance="outline" color={prod.category === 'subscription' ? 'brand' : 'informative'} size="small">
                      {prod.category}
                    </Badge>
                  </td>
                  <td style={{ color: '#666' }}>{prod.detail || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(prod.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const emptyLineItem = (): CreateInvoiceLineItemRequest => ({
  productCode: '',
  description: '',
  quantity: 1,
  unitAmount: 0,
});

export function CreateInvoiceDialog({
  orgId,
  token,
  hasStripe,
  onCreated,
  onClose,
}: {
  orgId?: string;
  token: string;
  hasStripe: boolean;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [lineItems, setLineItems] = useState<CreateInvoiceLineItemRequest[]>([emptyLineItem()]);
  const [notes, setNotes] = useState('');
  const [submitToStripe, setSubmitToStripe] = useState(hasStripe);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgIdInput, setOrgIdInput] = useState(orgId ?? '');

  const platformApiKey = (import.meta.env.VITE_PLATFORM_API_KEY as string) || '';

  const updateLineItem = (index: number, field: keyof CreateInvoiceLineItemRequest, value: string | number) => {
    setLineItems(prev => prev.map((li, i) => i === index ? { ...li, [field]: value } : li));
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const runningTotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitAmount, 0);

  const canSubmit = orgIdInput.trim() !== ''
    && lineItems.every(li => li.productCode.trim() !== '' && li.description.trim() !== '' && li.unitAmount > 0)
    && platformApiKey !== '';

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createInvoice(token, platformApiKey, {
        organizationId: orgIdInput,
        notes: notes || undefined,
        submitToStripe,
        lineItems,
      });
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: '640px' }}>
        <DialogBody>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!orgId && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Organization ID</label>
                  <Input
                    value={orgIdInput}
                    onChange={(_, data) => setOrgIdInput(data.value)}
                    placeholder="org_volato"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '-0.25rem' }}>Line Items</label>
              {lineItems.map((li, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', border: '1px solid #e8e8e8', borderRadius: '6px', padding: '0.5rem' }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#666' }}>Product Code</label>
                    <Input
                      value={li.productCode}
                      onChange={(_, data) => updateLineItem(i, 'productCode', data.value)}
                      placeholder="consulting"
                      size="small"
                    />
                  </div>
                  <div style={{ flex: '2 1 200px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#666' }}>Description</label>
                    <Input
                      value={li.description}
                      onChange={(_, data) => updateLineItem(i, 'description', data.value)}
                      placeholder="Onboarding consulting - February"
                      size="small"
                    />
                  </div>
                  <div style={{ flex: '0 0 70px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#666' }}>Qty</label>
                    <Input
                      type="number"
                      value={String(li.quantity)}
                      onChange={(_, data) => updateLineItem(i, 'quantity', parseFloat(data.value) || 0)}
                      size="small"
                    />
                  </div>
                  <div style={{ flex: '0 0 100px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#666' }}>Unit ($)</label>
                    <Input
                      type="number"
                      value={String(li.unitAmount)}
                      onChange={(_, data) => updateLineItem(i, 'unitAmount', parseFloat(data.value) || 0)}
                      size="small"
                    />
                  </div>
                  <Button
                    icon={<Dismiss24Regular />}
                    size="small"
                    appearance="subtle"
                    disabled={lineItems.length <= 1}
                    onClick={() => removeLineItem(i)}
                    title="Remove line item"
                  />
                </div>
              ))}
              <Button
                icon={<Add24Regular />}
                size="small"
                appearance="subtle"
                onClick={() => setLineItems(prev => [...prev, emptyLineItem()])}
              >
                Add line item
              </Button>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
                <Textarea
                  value={notes}
                  onChange={(_, data) => setNotes(data.value)}
                  placeholder="Optional notes..."
                  rows={2}
                  style={{ width: '100%' }}
                />
              </div>

              <Checkbox
                checked={submitToStripe}
                onChange={(_, data) => setSubmitToStripe(!!data.checked)}
                label="Submit to Stripe for payment"
              />

              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>
                Total: {formatCurrency(runningTotal)}
              </div>

              {error && (
                <div style={{ color: '#d13438', fontSize: '0.85rem' }}>{error}</div>
              )}
              {!platformApiKey && (
                <div style={{ color: '#d13438', fontSize: '0.85rem' }}>
                  VITE_PLATFORM_API_KEY not configured — cannot create invoices.
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>Cancel</Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function InvoicesSection({
  invoices,
  allInvoices,
  statusFilter,
  onStatusFilterChange,
  orgId,
  token,
  hasStripe,
  onInvoiceCreated,
}: {
  invoices: BillingInvoiceSummary[];
  allInvoices: BillingInvoiceSummary[];
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  orgId: string;
  token: string;
  hasStripe: boolean;
  onInvoiceCreated: () => void;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const statuses = ['All', ...Array.from(new Set(allInvoices.map(i => i.status)))];

  return (
    <Card className="info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title3>Invoices</Title3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            icon={<Add24Regular />}
            size="small"
            appearance="primary"
            onClick={() => setShowCreateDialog(true)}
          >
            Create Invoice
          </Button>
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
            style={{
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #d1d1d1',
              fontSize: '0.85rem',
            }}
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {showCreateDialog && (
        <CreateInvoiceDialog
          orgId={orgId}
          token={token}
          hasStripe={hasStripe}
          onCreated={() => { setShowCreateDialog(false); onInvoiceCreated(); }}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
      {invoices.length > 0 ? (
        <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Invoice #</th>
                <th style={{ width: '15%' }}>Period</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '15%' }}>Paid</th>
                <th style={{ width: '15%' }}>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.number}</td>
                  <td style={{ color: '#666' }}>{inv.billingPeriod}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                  <td>
                    <Badge appearance="filled" color={getStatusBadgeColor(inv.status)} size="small">
                      {inv.status}
                    </Badge>
                  </td>
                  <td style={{ color: '#666', fontSize: '0.85rem' }}>{formatDate(inv.paidAt)}</td>
                  <td>
                    {inv.channelReferenceId && (
                      <a
                        href={`https://dashboard.stripe.com/invoices/${inv.channelReferenceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <Open24Regular style={{ width: 14, height: 14, verticalAlign: 'middle' }} /> View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Body1 style={{ color: '#666', marginTop: '0.5rem' }}>No invoices found for this period</Body1>
      )}
    </Card>
  );
}
