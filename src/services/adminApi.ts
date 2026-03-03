import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// PascalCase ↔ camelCase conversion
// The .NET backend uses PascalCase globally (Teams bot compatibility).
// The React dashboard expects camelCase. These interceptors bridge the gap.

// Properties whose values are dictionaries with data keys (not property names).
// These keys should NOT be transformed — they are identifiers like product IDs.
const DICTIONARY_PROPERTIES_CAMEL = new Set([
  'productRatePlanIds', 'metadata', 'settings', 'quotas',
]);
const DICTIONARY_PROPERTIES_PASCAL = new Set([
  'ProductRatePlanIds', 'Metadata', 'Settings', 'Quotas',
]);

function toCamelCase(obj: unknown, isDictionaryValue = false): unknown {
  if (Array.isArray(obj)) return obj.map(item => toCamelCase(item, false));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    // If this object is a dictionary value, preserve its keys as-is
    // but still recurse into its values
    if (isDictionaryValue) {
      return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
        acc[key] = toCamelCase((obj as Record<string, unknown>)[key], false);
        return acc;
      }, {} as Record<string, unknown>);
    }
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      const isDict = DICTIONARY_PROPERTIES_CAMEL.has(camelKey);
      acc[camelKey] = toCamelCase((obj as Record<string, unknown>)[key], isDict);
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

function toPascalCase(obj: unknown, isDictionaryValue = false): unknown {
  if (Array.isArray(obj)) return obj.map(item => toPascalCase(item, false));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    // If this object is a dictionary value, preserve its keys as-is
    // but still recurse into its values
    if (isDictionaryValue) {
      return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
        acc[key] = toPascalCase((obj as Record<string, unknown>)[key], false);
        return acc;
      }, {} as Record<string, unknown>);
    }
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      const isDict = DICTIONARY_PROPERTIES_PASCAL.has(pascalKey);
      acc[pascalKey] = toPascalCase((obj as Record<string, unknown>)[key], isDict);
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

// Convert PascalCase responses → camelCase
api.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object') {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  error => {
    console.error('Admin API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Convert camelCase request bodies → PascalCase
api.interceptors.request.use(config => {
  if (config.data && typeof config.data === 'object') {
    config.data = toPascalCase(config.data);
  }
  return config;
});

// Helper to create auth headers
const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// Types
export interface AdminDashboardSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  suspendedSubscriptions: number;
  pendingSubscriptions: number;
  cancelledSubscriptions: number;
  totalSeats: number;
  monthlyRecurringRevenue: number;
  generatedAt: string;
}

export interface AdminSubscription {
  id: string;
  marketplaceSubscriptionId: string;
  organizationId: string | null;
  offerId: string;
  planId: string;
  status: string;
  quantity: number;
  beneficiaryEmail: string | null;
  beneficiaryTenantId: string | null;
  purchaserEmail: string | null;
  termStartDate: string | null;
  termEndDate: string | null;
  createdAt: string;
  activatedAt: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
  tokensReportedThisPeriod: number;
  lastMeteringEventTime: string | null;
  adminNotes: string | null;
  suspensionReason: string | null;
  employeeTemplateId: string | null;
  autoRenew: boolean;
  updatedAt: string;
  monthlyRevenue: number;
}

export interface SubscriptionListResponse {
  subscriptions: AdminSubscription[];
  continuationToken: string | null;
  hasMore: boolean;
}

export interface UsageHistory {
  subscriptionId: string;
  tokensReportedThisPeriod: number;
  lastMeteringEventTime: string | null;
  currentSeats: number;
  usageEvents: UsageEvent[];
}

export interface UsageEvent {
  dimension: string;
  quantity: number;
  timestamp: string;
  status: string;
}

// Organization Types
export interface OrganizationSummary {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  trialOrganizations: number;
  totalSubscribedEmployees: number;
  generatedAt: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  displayName: string | null;
  m365TenantId: string;
  connectionType: string;
  status: string;
  subscribedEmployeeCount: number;
  subscribedEmployeeIds: string[];
  currentMonthSpend: number;
  monthlySpendLimit: number;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  allowedDomains: string[];
  createdAt: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
  settings: AdminOrganizationSettings;
  productRatePlanIds: Record<string, string>;
}

export interface AdminOrganizationSettings {
  enableVoiceCalls: boolean;
  enableSMS: boolean;
  enableTeamsIntegration: boolean;
  requireApprovalForHighRiskActions: boolean;
  conversationRetentionDays: number;
  defaultTimeZone: string | null;
  sharePointConsentStatus: string | null;
}

export interface OrganizationListResponse {
  organizations: AdminOrganization[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface AdminUser {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  m365UserPrincipalName: string | null;
  aadObjectId: string;
  role: string;
  status: string;
  m365ConsentStatus: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface OrganizationSubscription {
  id: string;
  marketplaceSubscriptionId: string;
  offerId: string;
  planId: string;
  status: string;
  quantity: number;
  termStartDate: string | null;
  termEndDate: string | null;
  createdAt: string;
  activatedAt: string | null;
  // Note: purchaserEmail, beneficiaryEmail, employeeTemplateId, adminNotes
  // are available on AdminSubscription (full detail) but not populated by
  // the org-scoped GetOrganizationSubscriptions endpoint's .Select() mapping.
}

export interface UpdateOrganizationRequest {
  displayName?: string;
  billingEmail?: string;
  monthlySpendLimit?: number;
  allowedDomains?: string[];
  stripeCustomerId?: string;
  settings?: {
    enableVoiceCalls?: boolean;
    enableSMS?: boolean;
    enableTeamsIntegration?: boolean;
    requireApprovalForHighRiskActions?: boolean;
    defaultTimeZone?: string;
  };
}

// Rate Plan Types
export interface RatePlan {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  billingInterval: string;
  basePrice: number;
  currency: string;
  includedTokens: number;
  overageRatePerThousand: number;
  stripePriceId: string | null;
  status: string;
  coveredProductIds: string[];
  assignedOrganizationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatePlanRequest {
  productId: string;
  name: string;
  description?: string;
  basePrice: number;
  includedTokens: number;
  overageRatePerThousand: number;
  stripePriceId?: string;
  billingInterval?: string;
}

export interface UpdateRatePlanRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  includedTokens?: number;
  overageRatePerThousand?: number;
  stripePriceId?: string;
}

// Entitlement Types
export interface ProductEntitlement {
  id: string;
  organizationId: string;
  productId: string;
  enabled: boolean;
  enabledAt: string | null;
  enabledBy: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
  tier: string;
  settings: Record<string, unknown> | null;
  quotas: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface OrganizationEntitlementSummary {
  organizationId: string;
  entitlements: ProductEntitlement[];
  enabledProducts: string[];
  generatedAt: string;
}

export interface UpdateEntitlementRequest {
  tier?: string;
  settings?: Record<string, unknown>;
  quotas?: Record<string, unknown>;
}

// Invoice Types
export interface InvoiceLineItem {
  id: string;
  productCode: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  isMeteredUsage: boolean;
  ratePlanId: string | null;
}

export interface InternalInvoice {
  id: string;
  organizationId: string;
  number: string;
  status: string;
  billingPeriod: string;
  billingChannel: string;
  channelReferenceId: string | null;
  channelPaymentUrl: string | null;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  credits: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  finalizedAt: string | null;
  submittedAt: string | null;
  paidAt: string | null;
  erpExportStatus: string;
  notes: string | null;
  failureReason: string | null;
  paymentIntentId: string | null;
}

export interface InvoiceListResponse {
  invoices: InternalInvoice[];
  count: number;
  skip: number;
  limit: number;
}

export interface StripeSyncResponse {
  organizationsScanned: number;
  invoicesCreated: number;
  invoicesSkipped: number;
  errors: string[];
  syncedAt: string;
}

export interface ReconciliationFlag {
  organizationId: string;
  organizationName: string | null;
  flagType: string;
  description: string;
  severity: string;
  stripeInvoiceId: string | null;
  internalInvoiceId: string | null;
}

export interface ReconciliationReport {
  generatedAt: string;
  organizationsChecked: number;
  flagsFound: number;
  flags: ReconciliationFlag[];
}

// Billing Summary Types
export interface OrgBillingSummary {
  organizationId: string;
  billingPeriod: string;
  generatedAt: string;
  currency: string;

  totalAmount: number;
  subscriptionTotal: number;
  usageTotal: number;
  credits: number;
  budgetLimit: number;

  stripeCustomerId: string | null;
  ratePlanId: string | null;
  ratePlanName: string | null;

  products: ProductBillingEntry[];
  employees: EmployeeBillingEntry[];
  invoices: BillingInvoiceSummary[];
}

export interface ProductBillingEntry {
  productCode: string;
  productName: string;
  category: 'subscription' | 'usage';
  totalAmount: number;

  quantity?: number;
  unitPrice?: number;
  marketplaceSubscriptionId?: string;
  marketplacePlanId?: string;

  totalConsumption?: number;
  includedAmount?: number;
  overageAmount?: number;
  unitRate?: number;
  unitLabel?: string;

  employeeBreakdown: ProductEmployeeEntry[];
}

export interface ProductEmployeeEntry {
  employeeId: string;
  employeeName: string;
  status?: string;
  cost: number;
  consumption?: number;
  percentOfTotal?: number;
}

export interface EmployeeBillingEntry {
  employeeId: string;
  employeeName: string;
  totalCost: number;
  productBreakdown: EmployeeProductEntry[];
}

export interface EmployeeProductEntry {
  productCode: string;
  productName: string;
  category: 'subscription' | 'usage';
  cost: number;
  detail?: string;
}

export interface BillingInvoiceSummary {
  id: string;
  number: string;
  billingPeriod: string;
  totalAmount: number;
  status: string;
  paidAt?: string;
  channelReferenceId: string;
  channelPaymentUrl?: string;
}

export interface CreateInvoiceRequest {
  organizationId: string;
  billingPeriod?: string;
  notes?: string;
  submitToStripe: boolean;
  lineItems: CreateInvoiceLineItemRequest[];
}

export interface CreateInvoiceLineItemRequest {
  productCode: string;
  description: string;
  quantity: number;
  unitAmount: number;
}

// Employee Admin Types
export interface AdminEmployee {
  id: string;
  name: string;
  preferredName?: string;
  employeeStatus: string;
  sourceTemplateId?: string;
  typeId: string;
  subscription?: AdminEmployeeSubscription;
}

export interface AdminEmployeeSubscription {
  subscriptionId: string;
  priceId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UpdateEmployeeSubscriptionRequest {
  subscriptionId?: string;
  priceId?: string;
  status?: string;
}

export const adminApi = {
  /**
   * Fetch admin dashboard summary with key metrics
   */
  getSummary: async (token: string): Promise<AdminDashboardSummary> => {
    const response = await api.get<AdminDashboardSummary>('/admin/marketplace/summary', {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /**
   * List all marketplace subscriptions with optional filtering
   */
  listSubscriptions: async (
    token: string,
    status?: string,
    search?: string,
    pageSize: number = 50,
    continuationToken?: string
  ): Promise<SubscriptionListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('pageSize', pageSize.toString());
    if (continuationToken) params.append('continuationToken', continuationToken);

    const response = await api.get<SubscriptionListResponse>(
      `/admin/marketplace/subscriptions?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Get a single subscription by ID
   */
  getSubscription: async (token: string, subscriptionId: string): Promise<AdminSubscription> => {
    const response = await api.get<AdminSubscription>(
      `/admin/marketplace/subscriptions/${subscriptionId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Suspend a subscription
   */
  suspendSubscription: async (token: string, subscriptionId: string, reason: string): Promise<void> => {
    await api.post(
      `/admin/marketplace/subscriptions/${subscriptionId}/suspend`,
      { reason },
      { headers: authHeaders(token) }
    );
  },

  /**
   * Reinstate a suspended subscription
   */
  reinstateSubscription: async (token: string, subscriptionId: string): Promise<void> => {
    await api.post(
      `/admin/marketplace/subscriptions/${subscriptionId}/reinstate`,
      {},
      { headers: authHeaders(token) }
    );
  },

  /**
   * Update subscription notes
   */
  updateNotes: async (token: string, subscriptionId: string, notes: string): Promise<void> => {
    await api.patch(
      `/admin/marketplace/subscriptions/${subscriptionId}/notes`,
      { notes },
      { headers: authHeaders(token) }
    );
  },

  /**
   * Get usage history for a subscription
   */
  getUsageHistory: async (
    token: string,
    subscriptionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageHistory> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get<UsageHistory>(
      `/admin/marketplace/subscriptions/${subscriptionId}/usage?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ==================== Organization Admin APIs ====================

  /**
   * Fetch organization summary with key metrics
   */
  getOrganizationSummary: async (token: string): Promise<OrganizationSummary> => {
    const response = await api.get<OrganizationSummary>('/admin/organizations/summary', {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /**
   * List all organizations with optional filtering
   */
  listOrganizations: async (
    token: string,
    status?: string,
    search?: string,
    skip: number = 0,
    take: number = 50
  ): Promise<OrganizationListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('skip', skip.toString());
    params.append('take', take.toString());

    const response = await api.get<OrganizationListResponse>(
      `/admin/organizations?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Get a single organization by ID
   */
  getOrganization: async (token: string, organizationId: string): Promise<AdminOrganization> => {
    const response = await api.get<AdminOrganization>(
      `/admin/organizations/${organizationId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Update organization settings
   */
  updateOrganization: async (
    token: string,
    organizationId: string,
    data: UpdateOrganizationRequest
  ): Promise<AdminOrganization> => {
    const response = await api.put<AdminOrganization>(
      `/admin/organizations/${organizationId}`,
      data,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Suspend an organization
   */
  suspendOrganization: async (token: string, organizationId: string, reason: string): Promise<void> => {
    await api.post(
      `/admin/organizations/${organizationId}/suspend`,
      { reason },
      { headers: authHeaders(token) }
    );
  },

  /**
   * Reactivate a suspended organization
   */
  reactivateOrganization: async (token: string, organizationId: string): Promise<void> => {
    await api.post(
      `/admin/organizations/${organizationId}/reactivate`,
      {},
      { headers: authHeaders(token) }
    );
  },

  /**
   * List users in an organization
   */
  getOrganizationUsers: async (
    token: string,
    organizationId: string,
    status?: string,
    skip: number = 0,
    take: number = 50
  ): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('skip', skip.toString());
    params.append('take', take.toString());

    const response = await api.get<UserListResponse>(
      `/admin/organizations/${organizationId}/users?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getUser: async (token: string, organizationId: string, userId: string): Promise<AdminUser> => {
    const response = await api.get<AdminUser>(
      `/admin/organizations/${organizationId}/users/${userId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Update user role
   */
  updateUserRole: async (
    token: string,
    organizationId: string,
    userId: string,
    role: string
  ): Promise<AdminUser> => {
    const response = await api.patch<AdminUser>(
      `/admin/organizations/${organizationId}/users/${userId}/role`,
      { role },
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Suspend a user
   */
  suspendUser: async (token: string, organizationId: string, userId: string): Promise<void> => {
    await api.post(
      `/admin/organizations/${organizationId}/users/${userId}/suspend`,
      {},
      { headers: authHeaders(token) }
    );
  },

  /**
   * Reactivate a suspended user
   */
  reactivateUser: async (token: string, organizationId: string, userId: string): Promise<void> => {
    await api.post(
      `/admin/organizations/${organizationId}/users/${userId}/reactivate`,
      {},
      { headers: authHeaders(token) }
    );
  },

  /**
   * Delete a user (soft delete)
   */
  deleteUser: async (token: string, organizationId: string, userId: string): Promise<void> => {
    await api.delete(
      `/admin/organizations/${organizationId}/users/${userId}`,
      { headers: authHeaders(token) }
    );
  },

  /**
   * Get subscriptions for an organization
   */
  getOrganizationSubscriptions: async (
    token: string,
    organizationId: string
  ): Promise<{ subscriptions: OrganizationSubscription[] }> => {
    const response = await api.get<{ subscriptions: OrganizationSubscription[] }>(
      `/admin/organizations/${organizationId}/subscriptions`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Issue a credit to an organization's Stripe account
   */
  issueCredit: async (
    token: string,
    organizationId: string,
    amountCents: number,
    reason: string
  ): Promise<{ success: boolean; transactionId: string | null; newBalanceCents: number }> => {
    const response = await api.post(
      '/admin/billing/credits',
      { organizationId, amountCents, reason },
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ==================== Rate Plan Admin APIs ====================

  /**
   * List all rate plans with optional filtering by product or status
   */
  listRatePlans: async (
    token: string,
    productId?: string,
    status?: string
  ): Promise<RatePlan[]> => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (status) params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `/admin/rate-plans?${queryString}` : '/admin/rate-plans';
    const response = await api.get<RatePlan[]>(url, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /**
   * Get a single rate plan by ID
   */
  getRatePlan: async (token: string, planId: string): Promise<RatePlan> => {
    const response = await api.get<RatePlan>(
      `/admin/rate-plans/${planId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Create a new rate plan
   */
  createRatePlan: async (token: string, data: CreateRatePlanRequest): Promise<RatePlan> => {
    const response = await api.post<RatePlan>(
      '/admin/rate-plans',
      data,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Update an existing rate plan
   */
  updateRatePlan: async (
    token: string,
    planId: string,
    data: UpdateRatePlanRequest
  ): Promise<RatePlan> => {
    const response = await api.put<RatePlan>(
      `/admin/rate-plans/${planId}`,
      data,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Archive a rate plan (soft delete)
   */
  archiveRatePlan: async (token: string, planId: string): Promise<void> => {
    await api.post(
      `/admin/rate-plans/${planId}/archive`,
      {},
      { headers: authHeaders(token) }
    );
  },

  /**
   * Assign a rate plan to an organization for a product
   */
  assignRatePlan: async (
    token: string,
    organizationId: string,
    productId: string,
    ratePlanId: string
  ): Promise<void> => {
    await api.post(
      '/admin/rate-plans/assignments',
      { organizationId, productId, ratePlanId },
      { headers: authHeaders(token) }
    );
  },

  /**
   * Remove a rate plan assignment from an organization
   */
  removeRatePlanAssignment: async (
    token: string,
    organizationId: string,
    productId: string
  ): Promise<void> => {
    await api.delete(
      `/admin/rate-plans/assignments/${organizationId}/${productId}`,
      { headers: authHeaders(token) }
    );
  },

  // ==================== Entitlement Admin APIs ====================

  /**
   * Get all entitlements for an organization
   */
  getEntitlements: async (
    token: string,
    organizationId: string
  ): Promise<OrganizationEntitlementSummary> => {
    // GET lives on the non-admin controller (EntitlementsController), not the admin one.
    // Admin controller only has POST/PATCH for enable/disable/update operations.
    const response = await api.get<OrganizationEntitlementSummary>(
      `/orgs/${organizationId}/entitlements`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Enable a product for an organization
   */
  enableProduct: async (
    token: string,
    organizationId: string,
    productId: string,
    tier?: string
  ): Promise<ProductEntitlement> => {
    const response = await api.post<ProductEntitlement>(
      `/admin/orgs/${organizationId}/entitlements/${productId}/enable`,
      tier ? { tier } : {},
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Disable a product for an organization
   */
  disableProduct: async (
    token: string,
    organizationId: string,
    productId: string
  ): Promise<ProductEntitlement> => {
    const response = await api.post<ProductEntitlement>(
      `/admin/orgs/${organizationId}/entitlements/${productId}/disable`,
      {},
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Update entitlement settings (tier, settings, quotas) without changing enabled status
   */
  updateEntitlement: async (
    token: string,
    organizationId: string,
    productId: string,
    data: UpdateEntitlementRequest
  ): Promise<ProductEntitlement> => {
    const response = await api.patch<ProductEntitlement>(
      `/admin/orgs/${organizationId}/entitlements/${productId}`,
      data,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ==================== Invoice Admin APIs ====================

  /**
   * Get invoices for an organization
   */
  getOrgInvoices: async (
    token: string,
    orgId: string,
    status?: string,
    billingPeriod?: string
  ): Promise<{ invoices: InternalInvoice[] }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (billingPeriod) params.append('billingPeriod', billingPeriod);

    const queryString = params.toString();
    const url = queryString
      ? `/admin/organizations/${orgId}/invoices?${queryString}`
      : `/admin/organizations/${orgId}/invoices`;
    const response = await api.get<{ invoices: InternalInvoice[] }>(url, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /**
   * Get billing summary for an organization (composite endpoint)
   */
  getBillingSummary: async (
    token: string,
    orgId: string,
    period?: string
  ): Promise<OrgBillingSummary> => {
    const params = period ? `?period=${period}` : '';
    const response = await api.get<OrgBillingSummary>(
      `/admin/organizations/${orgId}/billing-summary${params}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Sync Stripe invoices into internal invoice store.
   * Uses Platform API key header (X-Platform-Api-Key).
   */
  syncStripeInvoices: async (
    token: string,
    apiKey: string
  ): Promise<StripeSyncResponse> => {
    const response = await api.post<StripeSyncResponse>(
      '/admin/invoices/sync-stripe',
      {},
      { headers: { ...authHeaders(token), 'X-Platform-Api-Key': apiKey } }
    );
    return response.data;
  },

  /**
   * Get billing reconciliation report.
   * Uses Platform API key header (X-Platform-Api-Key).
   */
  getReconciliationReport: async (
    token: string,
    apiKey: string
  ): Promise<ReconciliationReport> => {
    const response = await api.get<ReconciliationReport>(
      '/admin/invoices/reconciliation',
      { headers: { ...authHeaders(token), 'X-Platform-Api-Key': apiKey } }
    );
    return response.data;
  },

  /**
   * List all invoices globally with filtering.
   * Uses Platform API key header (X-Platform-Api-Key).
   */
  /**
   * Create an à la carte / one-off invoice for an organization.
   * Uses Platform API key header (X-Platform-Api-Key).
   */
  createInvoice: async (
    token: string,
    apiKey: string,
    request: CreateInvoiceRequest
  ): Promise<InternalInvoice> => {
    const response = await api.post<InternalInvoice>(
      '/admin/invoices',
      request,
      { headers: { ...authHeaders(token), 'X-Platform-Api-Key': apiKey } }
    );
    return response.data;
  },

  listAllInvoices: async (
    token: string,
    apiKey: string,
    params?: { status?: string; billingPeriod?: string; organizationId?: string; skip?: number; limit?: number }
  ): Promise<InvoiceListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.billingPeriod) searchParams.append('billingPeriod', params.billingPeriod);
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/admin/invoices?${queryString}` : '/admin/invoices';
    const response = await api.get<InvoiceListResponse>(url, {
      headers: { ...authHeaders(token), 'X-Platform-Api-Key': apiKey },
    });
    return response.data;
  },

  // ==================== Employee Admin APIs ====================

  /**
   * List all employees in an organization with subscription state
   */
  getOrganizationEmployees: async (
    token: string,
    organizationId: string
  ): Promise<AdminEmployee[]> => {
    const response = await api.get<AdminEmployee[]>(
      `/admin/organizations/${organizationId}/employees`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  /**
   * Update or clear an employee's subscription data
   */
  updateEmployeeSubscription: async (
    token: string,
    organizationId: string,
    employeeId: string,
    data: UpdateEmployeeSubscriptionRequest
  ): Promise<void> => {
    await api.put(
      `/admin/organizations/${organizationId}/employees/${employeeId}/subscription`,
      data,
      { headers: authHeaders(token) }
    );
  },
};
