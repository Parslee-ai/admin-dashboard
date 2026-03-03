import { APP_DOMAINS, RESOURCE_PREFIXES } from './config';
import type {
  ParsleeApp,
  DeepLinkParams,
  DeepLinkResult,
  NavigationContext,
} from './types';

/**
 * Allowed domains for security validation
 */
const ALLOWED_DOMAINS = new Set(Object.values(APP_DOMAINS));

/**
 * Generate a deep link URL for any Parslee resource
 *
 * @example
 * generateDeepLink('crm', 'accounts', 'acc_123', { org: 'org_456' })
 * // => { url: 'https://crm.parslee.ai/accounts/acc_123?org=org_456', ... }
 */
export function generateDeepLink(
  app: ParsleeApp,
  resource: string,
  resourceId?: string,
  params?: DeepLinkParams
): DeepLinkResult {
  const validationErrors: string[] = [];

  // Validate app
  if (!APP_DOMAINS[app]) {
    validationErrors.push(
      `Invalid app: ${app}. Must be one of: ${Object.keys(APP_DOMAINS).join(', ')}`
    );
  }

  // Validate resource ID format if provided
  if (resourceId) {
    const expectedPrefix = RESOURCE_PREFIXES[resource];
    if (expectedPrefix && !resourceId.startsWith(expectedPrefix)) {
      validationErrors.push(
        `Resource ID '${resourceId}' should start with '${expectedPrefix}' for resource type '${resource}'`
      );
    }
  }

  // Build URL
  const domain = APP_DOMAINS[app];
  const protocol = 'https';

  let path = `/${resource}`;
  if (resourceId) {
    path += `/${resourceId}`;
  }

  // Build query string
  const queryParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;

      if (key === 'ctx' && typeof value === 'object') {
        // Encode context as base64
        queryParams.set('ctx', btoa(JSON.stringify(value)));
      } else if (typeof value === 'string') {
        queryParams.set(key, value);
      }
    }
  }

  const queryString = queryParams.toString();
  const url = `${protocol}://${domain}${path}${queryString ? '?' + queryString : ''}`;

  // Build internal URI
  const internalUri = `parslee://${app}/${resource}${resourceId ? '/' + resourceId : ''}`;

  return {
    url,
    internalUri,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

/**
 * Parse a deep link URL and extract components
 */
export function parseDeepLink(url: string): {
  app: ParsleeApp | null;
  resource: string | null;
  resourceId: string | null;
  params: Record<string, string>;
  context: NavigationContext | null;
} {
  try {
    const parsed = new URL(url);

    // Handle internal parslee:// URIs
    if (parsed.protocol === 'parslee:') {
      const [app, resource, resourceId] = parsed.pathname.split('/').filter(Boolean);
      return {
        app: (app as ParsleeApp) || null,
        resource: resource || null,
        resourceId: resourceId || null,
        params: {},
        context: null,
      };
    }

    // Handle HTTPS URLs
    const hostname = parsed.hostname;
    const app =
      (Object.entries(APP_DOMAINS).find(
        ([, domain]) => domain === hostname
      )?.[0] as ParsleeApp) || null;

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const resource = pathParts[0] || null;
    const resourceId = pathParts[1] || null;

    // Parse query params
    const params: Record<string, string> = {};
    let context: NavigationContext | null = null;

    for (const [key, value] of parsed.searchParams.entries()) {
      if (key === 'ctx') {
        try {
          context = JSON.parse(atob(value));
        } catch {
          // Invalid context encoding
        }
      } else {
        params[key] = value;
      }
    }

    return { app, resource, resourceId, params, context };
  } catch {
    return { app: null, resource: null, resourceId: null, params: {}, context: null };
  }
}

/**
 * Create a navigation context for tracking cross-app navigation
 */
export function createNavigationContext(
  sourceApp: ParsleeApp,
  sourceResource: string,
  sourceResourceId?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): NavigationContext {
  return {
    sourceApp,
    sourceResource,
    sourceResourceId,
    timestamp: Date.now(),
    userId,
    metadata,
  };
}

/**
 * Convert internal parslee:// URI to full URL
 */
export function resolveInternalUri(
  internalUri: string,
  params?: DeepLinkParams
): string {
  if (!internalUri.startsWith('parslee://')) {
    throw new Error('Invalid internal URI format. Must start with parslee://');
  }

  const parts = internalUri.replace('parslee://', '').split('/');
  const app = parts[0] as ParsleeApp;
  const resource = parts[1];
  const resourceId = parts[2];

  return generateDeepLink(app, resource, resourceId, params).url;
}

/**
 * Generate a return URL for the current page
 */
export function generateReturnUrl(): string {
  if (typeof window === 'undefined') return '';
  return encodeURIComponent(window.location.href);
}

/**
 * Navigate back using returnUrl parameter, or fall back to app home
 */
export function navigateBack(fallbackApp: ParsleeApp = 'crm'): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const returnUrl = url.searchParams.get('returnUrl');

  if (returnUrl && isValidParsleeUrl(decodeURIComponent(returnUrl))) {
    window.location.href = decodeURIComponent(returnUrl);
  } else {
    window.location.href = `https://${APP_DOMAINS[fallbackApp]}/`;
  }
}

/**
 * Validate that a URL is a valid Parslee domain
 */
export function isValidParsleeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Must be a Parslee domain
    if (!ALLOWED_DOMAINS.has(parsed.hostname)) {
      return false;
    }

    // No javascript: or data: in any parameter
    for (const value of parsed.searchParams.values()) {
      if (
        value.toLowerCase().startsWith('javascript:') ||
        value.toLowerCase().startsWith('data:')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to a specific app
 */
export function navigateToApp(
  app: ParsleeApp,
  path: string = '/',
  params?: Record<string, string>
): void {
  if (typeof window === 'undefined') return;

  const baseUrl = `https://${APP_DOMAINS[app]}${path}`;
  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';

  window.location.href = baseUrl + queryString;
}
