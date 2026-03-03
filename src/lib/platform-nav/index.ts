// Main component
export { PlatformTopBar } from './PlatformTopBar';

// Sub-components (for advanced customization)
export { Logo } from './components/Logo';
export { AppSwitcher, MobileAppSwitcher } from './components/AppSwitcher';
export { UserMenu, MobileUserMenu } from './components/UserMenu';
export { HelpButton } from './components/HelpButton';
export {
  MobileMenu,
  MobileMenuTrigger,
  CurrentAppDropdown,
} from './components/MobileMenu';

// Hooks
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './hooks/useMediaQuery';
export { useDropdown } from './hooks/useDropdown';

// Deep link utilities
export {
  generateDeepLink,
  parseDeepLink,
  createNavigationContext,
  resolveInternalUri,
  generateReturnUrl,
  navigateBack,
  isValidParsleeUrl,
  navigateToApp,
} from './deep-links';

// Configuration
export { APP_DOMAINS, DEFAULT_APPS, RESOURCE_PREFIXES, CSS_VARS } from './config';

// Types
export type {
  ParsleeApp,
  AppConfig,
  UserInfo,
  Organization,
  PlatformTopBarProps,
  NavigationContext,
  DeepLinkParams,
  DeepLinkResult,
} from './types';
