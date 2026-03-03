import { useState } from 'react';
import type { PlatformTopBarProps } from './types';
import { DEFAULT_APPS } from './config';
import { useIsMobile } from './hooks/useMediaQuery';
import { Logo } from './components/Logo';
import { AppSwitcher } from './components/AppSwitcher';
import { UserMenu } from './components/UserMenu';
import { HelpButton } from './components/HelpButton';
import { MobileMenu, MobileMenuTrigger, CurrentAppDropdown } from './components/MobileMenu';

/**
 * Universal top bar for Parslee platform navigation
 *
 * @example
 * ```tsx
 * <PlatformTopBar
 *   currentApp="crm"
 *   user={{ name: 'Jane Smith', email: 'jane@acme.com', initials: 'JS' }}
 *   organization={{ id: 'org_123', name: 'Acme Corp' }}
 *   onLogout={() => handleLogout()}
 * />
 * ```
 */
export function PlatformTopBar({
  currentApp,
  user,
  organization,
  organizations = [],
  onLogout,
  onSwitchOrg,
  apps = DEFAULT_APPS,
  showNotifications: _showNotifications = false,
  notificationCount: _notificationCount = 0,
  className = '',
}: PlatformTopBarProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current app config for logo link
  const currentAppConfig = apps.find((app) => app.id === currentApp);
  const logoHref = currentAppConfig?.href || '/';

  return (
    <>
      <header
        role="banner"
        aria-label="Platform navigation"
        className={`topbar ${className}`}
      >
        <div className="topbar-container">
          {/* Logo */}
          <Logo href={logoHref} collapsed={isMobile} />

          {/* Desktop/Tablet: App switcher tabs */}
          {!isMobile && <AppSwitcher currentApp={currentApp} apps={apps} />}

          {/* Mobile: Current app indicator */}
          {isMobile && (
            <CurrentAppDropdown
              currentApp={currentApp}
              apps={apps}
            />
          )}

          {/* Spacer */}
          <div className="topbar-spacer" />

          {/* Right section */}
          <div className="topbar-right">
            {/* Help button (hidden on mobile, shown in menu) */}
            {!isMobile && <HelpButton />}

            {/* User menu (hidden on mobile, shown in menu) */}
            {!isMobile && (
              <UserMenu
                user={user}
                organization={organization}
                organizations={organizations}
                onLogout={onLogout}
                onSwitchOrg={onSwitchOrg}
              />
            )}

            {/* Mobile: Hamburger menu trigger */}
            {isMobile && (
              <MobileMenuTrigger onClick={() => setMobileMenuOpen(true)} />
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentApp={currentApp}
        apps={apps}
        user={user}
        organization={organization}
        organizations={organizations}
        onLogout={onLogout}
        onSwitchOrg={onSwitchOrg}
      />
    </>
  );
}
