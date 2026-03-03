import { Configuration, LogLevel } from '@azure/msal-browser';

// MSAL configuration for Parslee internal admin authentication
// Uses the existing Azure AD app registration for the API
export const msalConfig: Configuration = {
  auth: {
    // Client ID from Azure AD app registration (same as API backend)
    clientId: '44e729cf-6068-4c1f-bd97-1ed6913c69a9',
    // Parslee M365 tenant
    authority: 'https://login.microsoftonline.com/4535fc14-827e-4939-8416-bcb4260cbc23',
    // Redirect back to the admin dashboard after login
    redirectUri: window.location.origin + '/dashboard/admin',
    postLogoutRedirectUri: window.location.origin + '/dashboard',
    // Don't navigate away after handling redirect - stay on current page
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            break;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            break;
          case LogLevel.Info:
            console.info('[MSAL]', message);
            break;
          case LogLevel.Verbose:
            console.debug('[MSAL]', message);
            break;
        }
      },
      // Enable verbose logging to debug the issue
      logLevel: LogLevel.Info,
    },
  },
};

// Scopes for accessing the admin API and Microsoft Graph
// When an admin logs into the dashboard, request all necessary M365 permissions
// This way admins grant consent once for the entire organization
// Login request for dashboard authentication
// NOTE: MSAL can only request scopes from ONE resource per token request.
// We request API access here; Graph permissions are granted via admin consent flow.
export const loginRequest = {
  scopes: [
    'api://44e729cf-6068-4c1f-bd97-1ed6913c69a9/user_impersonation',
  ],
};

// Scopes for calling the admin API endpoints
export const apiRequest = {
  scopes: ['api://44e729cf-6068-4c1f-bd97-1ed6913c69a9/user_impersonation'],
};
