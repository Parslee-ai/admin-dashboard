import { ComponentType } from 'react';

/**
 * Platform application identifiers
 */
export type ParsleeApp = 'crm' | 'documents' | 'studio' | 'agents' | 'dashboard';

/**
 * Configuration for each platform application
 */
export interface AppConfig {
  id: ParsleeApp;
  label: string;
  shortLabel: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * User information for the top bar
 */
export interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

/**
 * Organization information
 */
export interface Organization {
  id: string;
  name: string;
}

/**
 * Props for the main PlatformTopBar component
 */
export interface PlatformTopBarProps {
  /** Current application identifier */
  currentApp: ParsleeApp;
  /** User information */
  user: UserInfo;
  /** Current organization */
  organization: Organization;
  /** List of organizations user can switch between */
  organizations?: Organization[];
  /** Callback when user logs out */
  onLogout: () => void;
  /** Callback when user switches organization */
  onSwitchOrg?: (orgId: string) => void;
  /** Custom apps configuration (overrides defaults) */
  apps?: AppConfig[];
  /** Show notifications button (future feature) */
  showNotifications?: boolean;
  /** Unread notification count */
  notificationCount?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Navigation context for cross-app deep linking
 */
export interface NavigationContext {
  sourceApp: ParsleeApp;
  sourceResource: string;
  sourceResourceId?: string;
  timestamp: number;
  userId?: string;
  intent?: 'view' | 'edit' | 'analyze' | 'reference';
  metadata?: Record<string, unknown>;
}

/**
 * Deep link parameters
 */
export interface DeepLinkParams {
  org?: string;
  ctx?: NavigationContext;
  returnUrl?: string;
  tab?: string;
  highlight?: string;
  action?: string;
  [key: string]: string | NavigationContext | undefined;
}

/**
 * Result of generating a deep link
 */
export interface DeepLinkResult {
  url: string;
  internalUri: string;
  isValid: boolean;
  validationErrors: string[];
}
