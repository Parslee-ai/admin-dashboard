import axios from 'axios';
import type { DashboardSummaryResponse, CurrentUsageSummaryResponse, BillingPortalResponse } from '../models/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Convert PascalCase keys from .NET API to camelCase for frontend
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        toCamelCase(val),
      ])
    );
  }
  return obj;
}

// Add response interceptor for PascalCase → camelCase + error handling
api.interceptors.response.use(
  response => {
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

/**
 * Set Bearer token for authenticated API calls (billing endpoints require JWT)
 */
let _accessToken: string | null = null;

api.interceptors.request.use(config => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

export const dashboardApi = {
  /**
   * Set the access token for authenticated requests
   */
  setAccessToken: (token: string) => {
    _accessToken = token;
  },

  /**
   * Fetch complete dashboard summary for an organization
   */
  getDashboardSummary: async (organizationId: string): Promise<DashboardSummaryResponse> => {
    const response = await api.get<DashboardSummaryResponse>(
      `/orgs/${organizationId}/dashboard/summary`
    );
    return response.data;
  },

  /**
   * Health check endpoint
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * Get Stripe Customer Portal URL for self-service billing management
   */
  getBillingPortalUrl: async (organizationId: string): Promise<BillingPortalResponse> => {
    const response = await api.get<BillingPortalResponse>(
      `/orgs/${organizationId}/billing/portal`
    );
    return response.data;
  },

  /**
   * Get current billing period usage summary with meter breakdowns.
   * Maps the flat API response to the nested shape BillingPage expects.
   */
  getCurrentUsageSummary: async (organizationId: string): Promise<CurrentUsageSummaryResponse> => {
    const response = await api.get(`/orgs/${organizationId}/usage/current`);
    const d = response.data as any;
    const included = d.ratePlan?.includedTokens ?? d.totalTokensGranted ?? 0;
    const used = d.totalTokensConsumed ?? 0;
    const remaining = Math.max(0, included - used);
    const overage = d.overageTokens ?? Math.max(0, used - included);
    const overageCost = d.overageCost ?? (overage * (d.ratePlan?.overageRatePerThousand ?? 0.01) / 1000);
    return {
      organizationId: d.organizationId ?? organizationId,
      billingPeriodStart: d.periodStart ?? new Date().toISOString(),
      billingPeriodEnd: d.updatedAt ?? new Date().toISOString(),
      tokenUsage: { included, used, remaining, overage, overageCostEstimate: overageCost },
      meterBreakdowns: [],
    };
  },
};
