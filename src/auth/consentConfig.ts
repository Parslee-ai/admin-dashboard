/**
 * Two-Tier Consent Configuration for Parslee
 *
 * Path 1: Individual User Consent
 *   - User consents for their own data only
 *   - No admin required
 *   - Limited to user-consentable scopes
 *
 * Path 2: Organization Admin Consent
 *   - Admin grants consent for entire organization
 *   - Enables full Graph API access
 *   - Non-admins can trigger Admin Consent Workflow (request approval from IT)
 */

// The Parslee multi-tenant app registration
// This is the app that external customers consent to
export const PARSLEE_MULTI_TENANT_APP = {
  clientId: '44e729cf-6068-4c1f-bd97-1ed6913c69a9',
  displayName: 'Parslee App',
};

// Redirect URIs for consent callbacks
export const CONSENT_REDIRECT_URIS = {
  // Individual user consent - back to settings page
  individual: `${window.location.origin}/settings`,
  // Admin consent - back to onboarding success
  adminConsent: `${window.location.origin}/dashboard/getting-started`,
  // Production URLs
  production: {
    individual: 'https://app.parslee.ai/settings',
    adminConsent: 'https://app.parslee.ai/dashboard/getting-started',
  },
};

/**
 * Path 1: Individual User Scopes
 *
 * These scopes DO NOT require admin consent.
 * Any user can grant these permissions for their own account.
 * Perfect for: Individual users wanting Parslee to access their personal M365 data.
 */
export const INDIVIDUAL_USER_SCOPES = [
  // OpenID Connect standard scopes
  'openid',
  'profile',
  'email',
  'offline_access', // Required for refresh tokens

  // User's own profile
  'User.Read', // Read signed-in user's profile

  // User's own email
  'Mail.Read', // Read user's email
  'Mail.Send', // Send email as user
  'Mail.ReadWrite', // Full mailbox access for user

  // User's own calendar
  'Calendars.Read', // Read user's calendar
  'Calendars.ReadWrite', // Manage user's calendar

  // User's own OneDrive
  'Files.Read', // Read user's files
  'Files.ReadWrite', // Manage user's files

  // User's mailbox settings
  'MailboxSettings.Read', // Read mailbox settings

  // User's Teams meetings (their own)
  'OnlineMeetings.Read', // Read user's meetings
];

/**
 * Path 2: Organization Admin Scopes
 *
 * These scopes REQUIRE admin consent.
 * Only a Global Administrator (or delegated admin) can grant these.
 * Enables: Full organization access for Parslee AI Employees.
 */
export const ORGANIZATION_ADMIN_SCOPES = [
  // All individual scopes (admin consent covers these too)
  ...INDIVIDUAL_USER_SCOPES,

  // Organization-wide user access
  'User.Read.All', // Read all users' profiles
  'User.ReadBasic.All', // Read basic profile of all users

  // Group access
  'Group.Read.All', // Read all groups
  'GroupMember.Read.All', // Read group memberships

  // Directory access
  'Directory.Read.All', // Read directory data

  // Organization-wide calendar access
  'Calendars.Read.Shared', // Read shared calendars

  // Teams access
  'Team.ReadBasic.All', // Read all teams
  'Channel.ReadBasic.All', // Read all channels
  'ChannelMessage.Read.All', // Read channel messages (admin)

  // Meeting transcripts (admin required)
  'OnlineMeetingTranscript.Read.All', // Read all meeting transcripts
];

/**
 * Application Permissions (documentation only - not used in consent URL construction)
 *
 * Since the admin consent flow uses .default scope, the actual permissions granted
 * come from the app registration manifest (config/app-permissions.json), not this list.
 * This list exists as a developer reference for the application-level permissions
 * that Parslee requires for background/daemon operations (e.g., shared mailbox access).
 */
export const APPLICATION_PERMISSIONS = [
  'Mail.ReadWrite', // Read/write all mailboxes (app) - required for shared mailbox access
  'Mail.Send', // Send mail as any user (app)
  'User.Read.All', // Read all users (app)
];

/**
 * Generate Individual User Authorization URL
 *
 * This uses the standard OAuth2 authorization endpoint with user-consentable scopes.
 * Works for any user without admin involvement.
 */
export function getIndividualConsentUrl(options?: {
  loginHint?: string;
  state?: string;
}): string {
  const params = new URLSearchParams({
    client_id: PARSLEE_MULTI_TENANT_APP.clientId,
    response_type: 'code',
    redirect_uri: CONSENT_REDIRECT_URIS.individual,
    response_mode: 'query',
    scope: INDIVIDUAL_USER_SCOPES.join(' '),
    prompt: 'consent', // Always show consent dialog
  });

  if (options?.loginHint) {
    params.set('login_hint', options.loginHint);
  }

  if (options?.state) {
    params.set('state', options.state);
  }

  // Use 'organizations' to allow any Azure AD tenant
  return `https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Get the API base URL or throw if not configured.
 * Admin consent redirect_uri MUST point to the backend API, not the frontend origin.
 */
function getApiBaseUrlOrThrow(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'VITE_API_BASE_URL environment variable is not set. ' +
      'Admin consent redirect_uri requires the API base URL.'
    );
  }
  return baseUrl;
}

/**
 * Generate Admin Consent URL
 *
 * This uses the special /adminconsent endpoint which:
 * 1. If user IS an admin: Shows admin consent dialog directly
 * 2. If user is NOT an admin: Shows "Request approval" button
 *    (triggers built-in Admin Consent Workflow in customer's tenant)
 *
 * No portal access required for either case!
 */
export function getAdminConsentUrl(options?: {
  tenantId?: string;
  state?: string;
}): string {
  const tenantId = options?.tenantId || 'organizations';

  // Use .default to grant all declared permissions (delegated + application) on the app registration
  const scopes = 'https://graph.microsoft.com/.default openid profile';

  // IMPORTANT: The /adminconsent endpoint ONLY supports .default scope
  // To show explicit permissions, we must use /authorize with prompt=admin_consent
  const params = new URLSearchParams({
    client_id: PARSLEE_MULTI_TENANT_APP.clientId,
    response_type: 'code',
    redirect_uri: `${getApiBaseUrlOrThrow()}/api/v1/consent/admin/callback`,
    response_mode: 'query',
    scope: scopes, // .default grants all app registration permissions
    prompt: 'admin_consent', // This triggers admin consent flow
  });

  if (options?.state) {
    params.set('state', options.state);
  }

  // Use /authorize endpoint with prompt=admin_consent to show explicit scopes
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Generate state token for CSRF protection
 */
export function generateConsentState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Store consent state in sessionStorage for validation on callback
 */
export function storeConsentState(
  state: string,
  metadata: { type: 'individual' | 'admin'; returnUrl?: string }
): void {
  sessionStorage.setItem(
    `parslee_consent_state_${state}`,
    JSON.stringify({
      ...metadata,
      timestamp: Date.now(),
    })
  );
}

/**
 * Validate and retrieve consent state from sessionStorage
 */
export function validateConsentState(
  state: string
): { type: 'individual' | 'admin'; returnUrl?: string } | null {
  const key = `parslee_consent_state_${state}`;
  const stored = sessionStorage.getItem(key);

  if (!stored) {
    return null;
  }

  // Remove state (one-time use)
  sessionStorage.removeItem(key);

  try {
    const data = JSON.parse(stored);

    // Check expiry (5 minutes)
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      return null;
    }

    // Validate expected properties exist
    if (typeof data.type !== 'string' || !['individual', 'admin'].includes(data.type)) {
      console.error('[Consent] Invalid consent state data: missing or invalid type');
      return null;
    }

    return { type: data.type, returnUrl: data.returnUrl };
  } catch (error) {
    // Malformed JSON in sessionStorage - treat as invalid state
    console.error('[Consent] Failed to parse consent state:', error);
    return null;
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

/**
 * Get appropriate redirect URI based on environment
 */
export function getRedirectUri(type: 'individual' | 'admin'): string {
  if (isDevelopment()) {
    return type === 'individual'
      ? CONSENT_REDIRECT_URIS.individual
      : CONSENT_REDIRECT_URIS.adminConsent;
  }

  return type === 'individual'
    ? CONSENT_REDIRECT_URIS.production.individual
    : CONSENT_REDIRECT_URIS.production.adminConsent;
}
