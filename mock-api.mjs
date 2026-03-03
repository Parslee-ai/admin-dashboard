/**
 * Mock API server for local UI development.
 * Returns dummy data for all admin dashboard endpoints.
 * Run: node mock-api.mjs
 */
import http from 'http';

const PORT = 5000;

// Dummy data
const ratePlans = [
  {
    id: 'rate-plan-core-standard',
    productId: 'core',
    name: 'Core Standard',
    description: 'Standard plan for Parslee Core AI Employees — $500/mo per AIE with 5M shared tokens',
    billingInterval: 'monthly',
    basePrice: 500.00,
    currency: 'USD',
    includedTokens: 5000000,
    overageRatePerThousand: 0.01,
    stripePriceId: 'price_core_standard_monthly',
    status: 'active',
    coveredProductIds: [],
    assignedOrganizationCount: 3,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    type: 'rate-plan',
  },
  {
    id: 'rate-plan-core-enterprise',
    productId: 'core',
    name: 'Core Enterprise',
    description: 'Enterprise plan with higher token limits and priority support — custom pricing',
    billingInterval: 'monthly',
    basePrice: 1200.00,
    currency: 'USD',
    includedTokens: 20000000,
    overageRatePerThousand: 0.005,
    stripePriceId: null,
    status: 'active',
    coveredProductIds: [],
    assignedOrganizationCount: 1,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    type: 'rate-plan',
  },
  {
    id: 'rate-plan-core-consumption-standard',
    productId: 'core-consumption',
    name: 'Parslee Core',
    description: 'Consumption-only plan — $20 per 1M tokens, no base fee, auto-charge at 50K token balance',
    billingInterval: 'monthly',
    basePrice: 0.00,
    currency: 'USD',
    includedTokens: 0,
    overageRatePerThousand: 0.02,
    stripePriceId: null,
    status: 'active',
    coveredProductIds: [],
    assignedOrganizationCount: 0,
    createdAt: '2026-02-13T00:00:00Z',
    updatedAt: '2026-02-13T00:00:00Z',
    type: 'rate-plan',
  },
  {
    id: 'rate-plan-voicerail-standard',
    productId: 'voicerail',
    name: 'VoiceRail Standard',
    description: 'Standard plan for VoiceRail voice AI — placeholder pricing, editable via admin UI',
    billingInterval: 'monthly',
    basePrice: 200.00,
    currency: 'USD',
    includedTokens: 2000000,
    overageRatePerThousand: 0.015,
    stripePriceId: null,
    status: 'active',
    coveredProductIds: [],
    assignedOrganizationCount: 0,
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z',
    type: 'rate-plan',
  },
  {
    id: 'rate-plan-core-starter',
    productId: 'core',
    name: 'Core Starter',
    description: 'Starter plan for small teams — reduced price with lower token allocation',
    billingInterval: 'monthly',
    basePrice: 250.00,
    currency: 'USD',
    includedTokens: 2000000,
    overageRatePerThousand: 0.02,
    stripePriceId: null,
    status: 'draft',
    coveredProductIds: [],
    assignedOrganizationCount: 0,
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    type: 'rate-plan',
  },
  {
    id: 'rate-plan-core-legacy',
    productId: 'core',
    name: 'Core Legacy (Deprecated)',
    description: 'Legacy $300/mo plan — grandfathered customers only',
    billingInterval: 'monthly',
    basePrice: 300.00,
    currency: 'USD',
    includedTokens: 3000000,
    overageRatePerThousand: 0.01,
    stripePriceId: 'price_core_legacy',
    status: 'archived',
    coveredProductIds: [],
    assignedOrganizationCount: 2,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    type: 'rate-plan',
  },
];

const organizations = [
  {
    id: 'org_parslee',
    name: 'Parslee',
    displayName: 'Parslee Inc.',
    m365TenantId: '4535fc14-827e-4939-8416-bcb4260cbc23',
    connectionType: 'M365',
    status: 'Active',
    subscribedEmployeeCount: 5,
    subscribedEmployeeIds: ['emp_ada', 'emp_nova', 'emp_sage', 'emp_aria', 'emp_atlas'],
    currentMonthSpend: 2500.00,
    monthlySpendLimit: 10000.00,
    billingEmail: 'billing@parslee.ai',
    stripeCustomerId: 'cus_parslee123',
    allowedDomains: ['parslee.ai'],
    createdAt: '2025-06-01T00:00:00Z',
    suspendedAt: null,
    suspensionReason: null,
    settings: {
      enableVoiceCalls: true,
      enableSMS: true,
      enableTeamsIntegration: true,
      requireApprovalForHighRiskActions: true,
      conversationRetentionDays: 90,
      defaultTimeZone: 'America/New_York',
      sharePointConsentStatus: 'Granted',
    },
    productRatePlanIds: { core: 'rate-plan-core-standard' },
  },
  {
    id: 'org_acme',
    name: 'Acme Corp',
    displayName: 'Acme Corporation',
    m365TenantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    connectionType: 'M365',
    status: 'Active',
    subscribedEmployeeCount: 12,
    subscribedEmployeeIds: [],
    currentMonthSpend: 14400.00,
    monthlySpendLimit: 25000.00,
    billingEmail: 'finance@acmecorp.com',
    stripeCustomerId: 'cus_acme456',
    allowedDomains: ['acmecorp.com'],
    createdAt: '2025-09-15T00:00:00Z',
    suspendedAt: null,
    suspensionReason: null,
    settings: {
      enableVoiceCalls: true,
      enableSMS: false,
      enableTeamsIntegration: true,
      requireApprovalForHighRiskActions: true,
      conversationRetentionDays: 365,
      defaultTimeZone: 'America/Chicago',
      sharePointConsentStatus: 'Pending',
    },
    productRatePlanIds: { core: 'rate-plan-core-enterprise' },
  },
  {
    id: 'org_startup',
    name: 'TechStart',
    displayName: 'TechStart LLC',
    m365TenantId: '11111111-2222-3333-4444-555555555555',
    connectionType: 'M365',
    status: 'Active',
    subscribedEmployeeCount: 2,
    subscribedEmployeeIds: [],
    currentMonthSpend: 600.00,
    monthlySpendLimit: 5000.00,
    billingEmail: 'admin@techstart.io',
    stripeCustomerId: 'cus_tech789',
    allowedDomains: ['techstart.io'],
    createdAt: '2026-01-20T00:00:00Z',
    suspendedAt: null,
    suspensionReason: null,
    settings: {
      enableVoiceCalls: false,
      enableSMS: false,
      enableTeamsIntegration: true,
      requireApprovalForHighRiskActions: false,
      conversationRetentionDays: 30,
      defaultTimeZone: 'America/Los_Angeles',
      sharePointConsentStatus: null,
    },
    productRatePlanIds: {},
  },
  {
    id: 'org_legacy',
    name: 'OldCo',
    displayName: 'OldCo Industries',
    m365TenantId: 'abababab-cdcd-efef-1212-343434343434',
    connectionType: 'M365',
    status: 'Active',
    subscribedEmployeeCount: 3,
    subscribedEmployeeIds: [],
    currentMonthSpend: 900.00,
    monthlySpendLimit: 5000.00,
    billingEmail: 'billing@oldco.com',
    stripeCustomerId: 'cus_oldco',
    allowedDomains: ['oldco.com'],
    createdAt: '2025-07-01T00:00:00Z',
    suspendedAt: null,
    suspensionReason: null,
    settings: {
      enableVoiceCalls: false,
      enableSMS: false,
      enableTeamsIntegration: true,
      requireApprovalForHighRiskActions: true,
      conversationRetentionDays: 60,
      defaultTimeZone: 'America/New_York',
      sharePointConsentStatus: null,
    },
    productRatePlanIds: { core: 'rate-plan-core-legacy' },
  },
  {
    id: 'org_volato',
    name: 'Volato',
    displayName: 'Volato Group',
    m365TenantId: 'deadbeef-1234-5678-abcd-volato000001',
    connectionType: 'M365',
    status: 'Active',
    subscribedEmployeeCount: 2,
    subscribedEmployeeIds: [],
    currentMonthSpend: 1200.00,
    monthlySpendLimit: 10000.00,
    billingEmail: 'billing@flyvolato.com',
    stripeCustomerId: 'cus_volato',
    allowedDomains: ['flyvolato.com', 'flyexclusive.com'],
    createdAt: '2025-09-15T00:00:00Z',
    suspendedAt: null,
    suspensionReason: null,
    settings: {
      enableVoiceCalls: true,
      enableSMS: true,
      enableTeamsIntegration: true,
      requireApprovalForHighRiskActions: true,
      conversationRetentionDays: 90,
      defaultTimeZone: 'America/New_York',
      sharePointConsentStatus: null,
    },
    productRatePlanIds: { core: 'rate-plan-core-enterprise' },
  },
];

const subscriptions = [
  {
    id: 'sub_001',
    marketplaceSubscriptionId: 'mp_sub_001',
    organizationId: 'org_parslee',
    offerId: 'parslee-aie',
    planId: 'standard',
    status: 'Subscribed',
    quantity: 5,
    beneficiaryEmail: 'mike@parslee.ai',
    beneficiaryTenantId: '4535fc14-827e-4939-8416-bcb4260cbc23',
    purchaserEmail: 'mike@parslee.ai',
    termStartDate: '2026-01-01T00:00:00Z',
    termEndDate: '2026-12-31T00:00:00Z',
    createdAt: '2025-12-15T00:00:00Z',
    activatedAt: '2026-01-01T00:00:00Z',
    suspendedAt: null,
    cancelledAt: null,
    tokensReportedThisPeriod: 12500000,
    lastMeteringEventTime: '2026-02-11T00:15:00Z',
    adminNotes: 'Parslee internal account',
    monthlyRevenue: 2500.00,
  },
  {
    id: 'sub_002',
    marketplaceSubscriptionId: 'mp_sub_002',
    organizationId: 'org_acme',
    offerId: 'parslee-aie',
    planId: 'enterprise',
    status: 'Subscribed',
    quantity: 12,
    beneficiaryEmail: 'it@acmecorp.com',
    beneficiaryTenantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    purchaserEmail: 'procurement@acmecorp.com',
    termStartDate: '2025-10-01T00:00:00Z',
    termEndDate: '2026-09-30T00:00:00Z',
    createdAt: '2025-09-20T00:00:00Z',
    activatedAt: '2025-10-01T00:00:00Z',
    suspendedAt: null,
    cancelledAt: null,
    tokensReportedThisPeriod: 45000000,
    lastMeteringEventTime: '2026-02-10T23:45:00Z',
    adminNotes: null,
    monthlyRevenue: 14400.00,
  },
  {
    id: 'sub_003',
    marketplaceSubscriptionId: 'mp_sub_003',
    organizationId: 'org_startup',
    offerId: 'parslee-aie',
    planId: 'standard',
    status: 'Subscribed',
    quantity: 2,
    beneficiaryEmail: 'cto@techstart.io',
    beneficiaryTenantId: '11111111-2222-3333-4444-555555555555',
    purchaserEmail: 'cto@techstart.io',
    termStartDate: '2026-02-01T00:00:00Z',
    termEndDate: '2027-01-31T00:00:00Z',
    createdAt: '2026-01-25T00:00:00Z',
    activatedAt: '2026-02-01T00:00:00Z',
    suspendedAt: null,
    cancelledAt: null,
    tokensReportedThisPeriod: 1200000,
    lastMeteringEventTime: '2026-02-10T18:00:00Z',
    adminNotes: null,
    monthlyRevenue: 1000.00,
  },
];

/** Compute marketplace summary dynamically from current subscription state */
function getSummary() {
  const active = subscriptions.filter(s => s.status === 'Subscribed');
  const suspended = subscriptions.filter(s => s.status === 'Suspended');
  const pending = subscriptions.filter(s => s.status === 'PendingFulfillment');
  const cancelled = subscriptions.filter(s => s.status === 'Unsubscribed');
  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: active.length,
    suspendedSubscriptions: suspended.length,
    pendingSubscriptions: pending.length,
    cancelledSubscriptions: cancelled.length,
    totalSeats: subscriptions.reduce((sum, s) => sum + s.quantity, 0),
    monthlyRecurringRevenue: active.reduce((sum, s) => sum + s.monthlyRevenue, 0),
    generatedAt: new Date().toISOString(),
  };
}

const dashboardSummary = {
  employees: [
    { employeeId: 'emp_ada', employeeName: 'Ada', employeeLevel: 'Master', status: 'Active', enabledCapabilities: ['calendar_management', 'email_management', 'data_analytics'], currentConversationCount: 2, lastActiveAt: new Date().toISOString() },
    { employeeId: 'emp_nova', employeeName: 'Nova', employeeLevel: 'Senior', status: 'Active', enabledCapabilities: ['sales_training', 'crm_operations'], currentConversationCount: 1, lastActiveAt: new Date().toISOString() },
    { employeeId: 'emp_sage', employeeName: 'Sage', employeeLevel: 'Senior', status: 'Idle', enabledCapabilities: ['data_analytics', 'business_analytics'], currentConversationCount: 0, lastActiveAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  tokenUsage: {
    organizationId: 'org_parslee',
    totalTokensIncluded: 25000000,
    tokensUsedThisMonth: 12500000,
    periodStart: '2026-02-01T00:00:00Z',
    periodEnd: '2026-03-01T00:00:00Z',
    usageBreakdown: { emp_ada: 5000000, emp_nova: 4500000, emp_sage: 3000000 },
  },
  healthStatus: [
    { serviceName: 'Azure OpenAI', status: 'Healthy', lastCheckedAt: new Date().toISOString() },
    { serviceName: 'Cosmos DB', status: 'Healthy', lastCheckedAt: new Date().toISOString() },
    { serviceName: 'Microsoft Graph', status: 'Healthy', lastCheckedAt: new Date().toISOString() },
  ],
  businessMetrics: [],
  generatedAt: new Date().toISOString(),
};

const usageSummary = {
  organizationId: 'org_parslee',
  billingPeriodStart: '2026-02-01T00:00:00Z',
  billingPeriodEnd: '2026-03-01T00:00:00Z',
  tokenUsage: {
    included: 25000000,
    used: 12500000,
    remaining: 12500000,
    overage: 0,
    overageCostEstimate: 0.00,
  },
  meterBreakdowns: [
    { meterType: 'ai_tokens', quantity: 12500000, unit: 'tokens' },
  ],
};

// Entitlement data (per-org)
const entitlements = {
  org_parslee: [
    { id: 'org_parslee:aie', organizationId: 'org_parslee', productId: 'aie', enabled: true, enabledAt: '2025-06-01T00:00:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Enterprise', settings: null, quotas: null, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z', metadata: null },
    { id: 'org_parslee:odi', organizationId: 'org_parslee', productId: 'odi', enabled: true, enabledAt: '2026-02-03T17:20:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Enterprise', settings: null, quotas: null, createdAt: '2026-02-03T17:20:00Z', updatedAt: '2026-02-03T17:20:00Z', metadata: null },
    { id: 'org_parslee:studio', organizationId: 'org_parslee', productId: 'studio', enabled: true, enabledAt: '2026-02-03T17:20:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Enterprise', settings: null, quotas: null, createdAt: '2026-02-03T17:20:00Z', updatedAt: '2026-02-03T17:20:00Z', metadata: null },
    { id: 'org_parslee:crm', organizationId: 'org_parslee', productId: 'crm', enabled: true, enabledAt: '2026-02-03T17:20:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Enterprise', settings: null, quotas: null, createdAt: '2026-02-03T17:20:00Z', updatedAt: '2026-02-03T17:20:00Z', metadata: null },
  ],
  org_acme: [
    { id: 'org_acme:aie', organizationId: 'org_acme', productId: 'aie', enabled: true, enabledAt: '2025-09-15T00:00:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Standard', settings: null, quotas: null, createdAt: '2025-09-15T00:00:00Z', updatedAt: '2025-09-15T00:00:00Z', metadata: null },
  ],
  org_startup: [],
  org_legacy: [
    { id: 'org_legacy:aie', organizationId: 'org_legacy', productId: 'aie', enabled: true, enabledAt: '2025-07-01T00:00:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Standard', settings: null, quotas: null, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2025-07-01T00:00:00Z', metadata: null },
  ],
  org_volato: [
    { id: 'org_volato:aie', organizationId: 'org_volato', productId: 'aie', enabled: true, enabledAt: '2025-09-15T00:00:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Enterprise', settings: null, quotas: null, createdAt: '2025-09-15T00:00:00Z', updatedAt: '2025-09-15T00:00:00Z', metadata: null },
    { id: 'org_volato:odi', organizationId: 'org_volato', productId: 'odi', enabled: true, enabledAt: '2026-02-19T00:00:00Z', enabledBy: 'platform_admin', disabledAt: null, disabledBy: null, tier: 'Standard', settings: null, quotas: null, createdAt: '2026-02-19T00:00:00Z', updatedAt: '2026-02-19T00:00:00Z', metadata: null },
  ],
};

// Helpers
function parseUrl(url) {
  const [path, qs] = (url || '').split('?');
  const params = new URLSearchParams(qs || '');
  return { path: path.replace(/\/+$/, ''), params };
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// Router
const server = http.createServer(async (req, res) => {
  const { path, params } = parseUrl(req.url);
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    });
    return res.end();
  }

  console.log(`${method} ${path}`);

  // Health
  if (path === '/api/v1/health') return json(res, { status: 'ok' });

  // Dashboard summary
  if (path.match(/^\/api\/v1\/orgs\/[^/]+\/dashboard\/summary$/))
    return json(res, dashboardSummary);

  // Usage summary
  if (path.match(/^\/api\/v1\/orgs\/[^/]+\/usage\/current$/))
    return json(res, usageSummary);

  // Billing portal
  if (path.match(/^\/api\/v1\/orgs\/[^/]+\/billing\/portal$/))
    return json(res, { url: 'https://billing.stripe.com/mock-portal', expiresAt: new Date(Date.now() + 3600000).toISOString() });

  // Admin: marketplace summary (computed dynamically)
  if (path === '/api/v1/admin/marketplace/summary')
    return json(res, getSummary());

  // Admin: list subscriptions
  if (path === '/api/v1/admin/marketplace/subscriptions' && method === 'GET')
    return json(res, { subscriptions, continuationToken: null, hasMore: false });

  // Admin: get subscription by ID
  if (path.match(/^\/api\/v1\/admin\/marketplace\/subscriptions\/[^/]+$/) && method === 'GET') {
    const id = path.split('/').pop();
    const sub = subscriptions.find(s => s.id === id);
    return sub ? json(res, sub) : json(res, { error: 'Not found' }, 404);
  }

  // Admin: suspend subscription
  if (path.match(/^\/api\/v1\/admin\/marketplace\/subscriptions\/[^/]+\/suspend$/) && method === 'POST') {
    const id = path.split('/')[path.split('/').length - 2];
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    sub.status = 'Suspended';
    sub.suspendedAt = new Date().toISOString();
    sub.adminNotes = (sub.adminNotes ? sub.adminNotes + '\n' : '') + `Suspended: ${body.reason || 'No reason given'}`;
    return json(res, { success: true });
  }

  // Admin: reinstate subscription
  if (path.match(/^\/api\/v1\/admin\/marketplace\/subscriptions\/[^/]+\/reinstate$/) && method === 'POST') {
    const id = path.split('/')[path.split('/').length - 2];
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return json(res, { error: 'Not found' }, 404);
    sub.status = 'Subscribed';
    sub.suspendedAt = null;
    return json(res, { success: true });
  }

  // Admin: update subscription notes
  if (path.match(/^\/api\/v1\/admin\/marketplace\/subscriptions\/[^/]+\/notes$/) && method === 'PATCH') {
    const id = path.split('/')[path.split('/').length - 2];
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    sub.adminNotes = body.notes;
    return json(res, { success: true });
  }

  // Admin: subscription usage history
  if (path.match(/^\/api\/v1\/admin\/marketplace\/subscriptions\/[^/]+\/usage$/) && method === 'GET') {
    const id = path.split('/')[path.split('/').length - 2];
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return json(res, { error: 'Not found' }, 404);
    return json(res, {
      subscriptionId: sub.id,
      tokensReportedThisPeriod: sub.tokensReportedThisPeriod,
      lastMeteringEventTime: sub.lastMeteringEventTime,
      currentSeats: sub.quantity,
      usageEvents: [
        { dimension: 'ai_tokens', quantity: Math.round(sub.tokensReportedThisPeriod * 0.6), timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'Accepted' },
        { dimension: 'ai_tokens', quantity: Math.round(sub.tokensReportedThisPeriod * 0.4), timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'Accepted' },
      ],
    });
  }

  // Admin: org summary (computed dynamically)
  if (path === '/api/v1/admin/organizations/summary')
    return json(res, {
      totalOrganizations: organizations.length,
      activeOrganizations: organizations.filter(o => o.status === 'Active').length,
      suspendedOrganizations: organizations.filter(o => o.status === 'Suspended').length,
      trialOrganizations: organizations.filter(o => o.status === 'Trial').length,
      totalSubscribedEmployees: organizations.reduce((sum, o) => sum + o.subscribedEmployeeCount, 0),
      generatedAt: new Date().toISOString(),
    });

  // Admin: list organizations
  if (path === '/api/v1/admin/organizations' && method === 'GET')
    return json(res, { organizations, totalCount: organizations.length, skip: 0, take: 50 });

  // Admin: get single organization
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+$/) && method === 'GET') {
    const id = path.split('/').pop();
    const org = organizations.find(o => o.id === id);
    return org ? json(res, org) : json(res, { error: 'Not found' }, 404);
  }

  // Admin: update organization
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/').pop();
    const org = organizations.find(o => o.id === id);
    if (!org) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    if (body.displayName !== undefined) org.displayName = body.displayName;
    if (body.billingEmail !== undefined) org.billingEmail = body.billingEmail;
    if (body.monthlySpendLimit !== undefined) org.monthlySpendLimit = body.monthlySpendLimit;
    if (body.allowedDomains !== undefined) org.allowedDomains = body.allowedDomains;
    if (body.settings) Object.assign(org.settings, body.settings);
    return json(res, org);
  }

  // Admin: suspend organization
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+\/suspend$/) && method === 'POST') {
    const id = path.split('/')[path.split('/').length - 2];
    const org = organizations.find(o => o.id === id);
    if (!org) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    org.status = 'Suspended';
    org.suspendedAt = new Date().toISOString();
    org.suspensionReason = body.reason || null;
    return json(res, { success: true });
  }

  // Admin: reactivate organization
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+\/reactivate$/) && method === 'POST') {
    const id = path.split('/')[path.split('/').length - 2];
    const org = organizations.find(o => o.id === id);
    if (!org) return json(res, { error: 'Not found' }, 404);
    org.status = 'Active';
    org.suspendedAt = null;
    org.suspensionReason = null;
    return json(res, { success: true });
  }

  // Admin: org users
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+\/users$/) && method === 'GET')
    return json(res, { users: [], totalCount: 0, skip: 0, take: 50 });

  // Admin: org subscriptions
  if (path.match(/^\/api\/v1\/admin\/organizations\/[^/]+\/subscriptions$/) && method === 'GET')
    return json(res, { subscriptions: [] });

  // ==================== Rate Plan endpoints ====================

  // List rate plans
  if (path === '/api/v1/admin/rate-plans' && method === 'GET') {
    let filtered = [...ratePlans];
    const productId = params.get('productId');
    const status = params.get('status');
    if (productId) filtered = filtered.filter(p => p.productId === productId);
    if (status) filtered = filtered.filter(p => p.status === status);
    return json(res, filtered);
  }

  // Get single rate plan
  if (path.match(/^\/api\/v1\/admin\/rate-plans\/[^/]+$/) && method === 'GET' && !path.includes('/archive') && !path.includes('/organizations')) {
    const id = path.split('/').pop();
    const plan = ratePlans.find(p => p.id === id);
    return plan ? json(res, plan) : json(res, { error: 'Not found' }, 404);
  }

  // Create rate plan
  if (path === '/api/v1/admin/rate-plans' && method === 'POST') {
    const body = await readBody(req);
    const newPlan = {
      id: `rate-plan-${body.productId}-${(body.name || '').toLowerCase().replace(/\s+/g, '-')}`,
      ...body,
      currency: 'USD',
      billingInterval: body.billingInterval || 'monthly',
      status: 'active',
      coveredProductIds: [],
      assignedOrganizationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'rate-plan',
    };
    ratePlans.push(newPlan);
    return json(res, newPlan, 201);
  }

  // Update rate plan
  if (path.match(/^\/api\/v1\/admin\/rate-plans\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/').pop();
    const plan = ratePlans.find(p => p.id === id);
    if (!plan) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    Object.assign(plan, body, { updatedAt: new Date().toISOString() });
    return json(res, plan);
  }

  // Archive rate plan
  if (path.match(/^\/api\/v1\/admin\/rate-plans\/[^/]+\/archive$/) && method === 'POST') {
    const id = path.split('/')[path.split('/').length - 2];
    const plan = ratePlans.find(p => p.id === id);
    if (!plan) return json(res, { error: 'Not found' }, 404);
    plan.status = 'archived';
    plan.updatedAt = new Date().toISOString();
    return json(res, { success: true });
  }

  // Get orgs on plan
  if (path.match(/^\/api\/v1\/admin\/rate-plans\/[^/]+\/organizations$/) && method === 'GET') {
    const id = path.split('/')[path.split('/').length - 2];
    const orgs = organizations.filter(o =>
      Object.values(o.productRatePlanIds || {}).includes(id)
    ).map(o => ({
      organizationId: o.id,
      organizationName: o.displayName || o.name,
      productId: Object.entries(o.productRatePlanIds).find(([, v]) => v === id)?.[0] || 'core',
    }));
    return json(res, orgs);
  }

  // Assign rate plan
  if (path === '/api/v1/admin/rate-plans/assignments' && method === 'POST') {
    const body = await readBody(req);
    const org = organizations.find(o => o.id === body.organizationId);
    if (!org) return json(res, { error: 'Organization not found' }, 404);
    org.productRatePlanIds[body.productId] = body.ratePlanId;
    return json(res, { success: true });
  }

  // Remove rate plan assignment
  if (path.match(/^\/api\/v1\/admin\/rate-plans\/assignments\/[^/]+\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const productId = parts.pop();
    const orgId = parts.pop();
    const org = organizations.find(o => o.id === orgId);
    if (org) delete org.productRatePlanIds[productId];
    return json(res, { success: true });
  }

  // Admin: issue credit
  if (path === '/api/v1/admin/billing/credits' && method === 'POST') {
    const body = await readBody(req);
    return json(res, { success: true, transactionId: `txn_${Date.now()}`, newBalanceCents: body.amountCents });
  }

  // ==================== Entitlement endpoints ====================

  // Get entitlements for org (matches non-admin EntitlementsController route)
  if (path.match(/^\/api\/v1\/orgs\/[^/]+\/entitlements$/) && method === 'GET') {
    const orgId = path.split('/')[4];
    const orgEntitlements = entitlements[orgId] || [];
    return json(res, {
      organizationId: orgId,
      entitlements: orgEntitlements,
      enabledProducts: orgEntitlements.filter(e => e.enabled).map(e => e.productId),
      generatedAt: new Date().toISOString(),
    });
  }

  // Enable product for org
  if (path.match(/^\/api\/v1\/admin\/orgs\/[^/]+\/entitlements\/[^/]+\/enable$/) && method === 'POST') {
    const parts = path.split('/');
    const orgId = parts[5];
    const productId = parts[7];
    const body = await readBody(req);
    if (!entitlements[orgId]) entitlements[orgId] = [];
    const existing = entitlements[orgId].find(e => e.productId === productId);
    const now = new Date().toISOString();
    if (existing) {
      existing.enabled = true;
      existing.enabledAt = now;
      existing.enabledBy = body.enabledBy || 'platform_admin';
      existing.disabledAt = null;
      existing.disabledBy = null;
      existing.tier = body.tier || existing.tier;
      existing.updatedAt = now;
      return json(res, existing);
    }
    const newEnt = { id: `${orgId}:${productId}`, organizationId: orgId, productId, enabled: true, enabledAt: now, enabledBy: body.enabledBy || 'platform_admin', disabledAt: null, disabledBy: null, tier: body.tier || 'Standard', settings: null, quotas: null, createdAt: now, updatedAt: now, metadata: null };
    entitlements[orgId].push(newEnt);
    return json(res, newEnt);
  }

  // Disable product for org
  if (path.match(/^\/api\/v1\/admin\/orgs\/[^/]+\/entitlements\/[^/]+\/disable$/) && method === 'POST') {
    const parts = path.split('/');
    const orgId = parts[5];
    const productId = parts[7];
    const body = await readBody(req);
    const existing = (entitlements[orgId] || []).find(e => e.productId === productId);
    if (!existing) return json(res, { error: 'Not found' }, 404);
    const now = new Date().toISOString();
    existing.enabled = false;
    existing.disabledAt = now;
    existing.disabledBy = body.disabledBy || 'platform_admin';
    existing.updatedAt = now;
    return json(res, existing);
  }

  // Update entitlement
  if (path.match(/^\/api\/v1\/admin\/orgs\/[^/]+\/entitlements\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const orgId = parts[5];
    const productId = parts[7];
    const existing = (entitlements[orgId] || []).find(e => e.productId === productId);
    if (!existing) return json(res, { error: 'Not found' }, 404);
    const body = await readBody(req);
    if (body.tier) existing.tier = body.tier;
    if (body.settings) existing.settings = body.settings;
    if (body.quotas) existing.quotas = body.quotas;
    existing.updatedAt = new Date().toISOString();
    return json(res, existing);
  }

  // Fallback
  console.log(`  -> 404 Not Found`);
  json(res, { error: 'Not found', path }, 404);
});

server.listen(PORT, () => {
  console.log(`\nMock API server running on http://localhost:${PORT}`);
  console.log('Endpoints (all stateful — mutations persist in memory):');
  console.log('  GET    /api/v1/health');
  console.log('  GET    /api/v1/admin/marketplace/summary          (computed)');
  console.log('  GET    /api/v1/admin/marketplace/subscriptions');
  console.log('  GET    /api/v1/admin/marketplace/subscriptions/:id');
  console.log('  POST   /api/v1/admin/marketplace/subscriptions/:id/suspend');
  console.log('  POST   /api/v1/admin/marketplace/subscriptions/:id/reinstate');
  console.log('  PATCH  /api/v1/admin/marketplace/subscriptions/:id/notes');
  console.log('  GET    /api/v1/admin/marketplace/subscriptions/:id/usage');
  console.log('  GET    /api/v1/admin/organizations/summary        (computed)');
  console.log('  GET    /api/v1/admin/organizations');
  console.log('  GET    /api/v1/admin/organizations/:id');
  console.log('  PUT    /api/v1/admin/organizations/:id');
  console.log('  POST   /api/v1/admin/organizations/:id/suspend');
  console.log('  POST   /api/v1/admin/organizations/:id/reactivate');
  console.log('  GET    /api/v1/admin/rate-plans');
  console.log('  POST   /api/v1/admin/rate-plans');
  console.log('  PUT    /api/v1/admin/rate-plans/:id');
  console.log('  POST   /api/v1/admin/rate-plans/:id/archive');
  console.log('  POST   /api/v1/admin/rate-plans/assignments');
  console.log('  DELETE /api/v1/admin/rate-plans/assignments/:orgId/:productId');
  console.log('  POST   /api/v1/admin/billing/credits');
  console.log('  GET    /api/v1/orgs/:orgId/entitlements');
  console.log('  POST   /api/v1/admin/orgs/:orgId/entitlements/:productId/enable');
  console.log('  POST   /api/v1/admin/orgs/:orgId/entitlements/:productId/disable');
  console.log('  PATCH  /api/v1/admin/orgs/:orgId/entitlements/:productId');
  console.log('  GET    /api/v1/orgs/:orgId/dashboard/summary');
  console.log('  GET    /api/v1/orgs/:orgId/usage/current');
  console.log('');
});
