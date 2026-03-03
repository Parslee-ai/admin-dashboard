/**
 * TypeScript types matching C# dashboard API DTOs EXACTLY.
 * DateTimeOffset in C# serializes to ISO 8601 string in JSON.
 * Dictionary<string, T> serializes to Record<string, T> in TypeScript.
 */

/**
 * Current status and metadata of an AI employee.
 * Maps to: Parslee.M365.Core.Models.Dashboard.EmployeeStatusDto
 */
export interface EmployeeStatusDto {
  employeeId: string;
  employeeName: string;
  employeeLevel: string;              // EmployeeLevel enum (Junior/Senior/Master)
  status: string;                      // EmployeeStatus enum (Active/Idle/Busy/Offline)
  enabledCapabilities: string[];       // IReadOnlyList<string>
  currentConversationCount: number;    // int
  lastActiveAt: string | null;         // DateTimeOffset? (null if never active)
}

/**
 * Token usage statistics for an organization's billing period.
 * Maps to: Parslee.M365.Core.Models.Dashboard.TokenUsageDto
 */
export interface TokenUsageDto {
  organizationId: string;
  totalTokensIncluded: number;         // long (5M per AIE)
  tokensUsedThisMonth: number;         // long (may exceed included)
  periodStart: string;                 // DateTimeOffset
  periodEnd: string;                   // DateTimeOffset
  usageBreakdown: Record<string, number>; // IReadOnlyDictionary<string, long>
}

/**
 * Health status of a service or capability dependency.
 * Maps to: Parslee.M365.Core.Models.Dashboard.HealthStatusDto
 */
export interface HealthStatusDto {
  serviceName: string;
  status: string;                      // CapabilityHealth enum (Healthy/Degraded/Unhealthy)
  lastCheckedAt: string;               // DateTimeOffset
  message?: string;                    // Optional diagnostic message
}

/**
 * Business metric from external analytics sources.
 * Maps to: Parslee.M365.Core.Models.Dashboard.BusinessMetricsDto
 */
export interface BusinessMetricsDto {
  source: string;                      // Source system (e.g., 'mixpanel', 'powerbi')
  metricName: string;                  // Metric identifier
  value: number;                       // decimal serializes to number
  timestamp: string;                   // DateTimeOffset
  dimensions?: Record<string, string>; // Optional dimensional breakdown
}

/**
 * Dashboard response aggregating organization metrics and status.
 * Maps to: Parslee.M365.Core.Models.Dashboard.DashboardSummaryResponse
 */
export interface DashboardSummaryResponse {
  employees: EmployeeStatusDto[];           // IReadOnlyList<EmployeeStatusDto>
  tokenUsage: TokenUsageDto;                // TokenUsageDto
  healthStatus: HealthStatusDto[];          // IReadOnlyList<HealthStatusDto>
  businessMetrics: BusinessMetricsDto[];    // IReadOnlyList<BusinessMetricsDto>
  generatedAt: string;                      // DateTimeOffset
}

/**
 * Current billing period usage summary.
 * Maps to: Parslee.M365.Api.Controllers.CurrentUsageSummaryResponse
 */
export interface CurrentUsageSummaryResponse {
  organizationId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  tokenUsage: TokenUsageSummary;
  meterBreakdowns: MeterBreakdown[];
}

export interface TokenUsageSummary {
  included: number;
  used: number;
  remaining: number;
  overage: number;
  overageCostEstimate: number;
}

export interface MeterBreakdown {
  meterType: string;
  quantity: number;
  unit: string;
}

export interface BillingPortalResponse {
  url: string;
  expiresAt: string;
}
