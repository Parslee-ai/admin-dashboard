import { useEffect } from 'react';
import { X, Menu, ChevronDown } from 'lucide-react';
import type { AppConfig, ParsleeApp, UserInfo, Organization } from '../types';
import { MobileAppSwitcher } from './AppSwitcher';
import { MobileUserMenu } from './UserMenu';
import { HelpButton } from './HelpButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentApp: ParsleeApp;
  apps: AppConfig[];
  user: UserInfo;
  organization: Organization;
  organizations?: Organization[];
  onLogout: () => void;
  onSwitchOrg?: (orgId: string) => void;
  className?: string;
}

/**
 * Mobile menu overlay with app switcher and user menu
 */
export function MobileMenu({
  isOpen,
  onClose,
  currentApp,
  apps,
  user,
  organization,
  organizations,
  onLogout,
  onSwitchOrg,
  className = '',
}: MobileMenuProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="topbar-mobile-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`topbar-mobile-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="topbar-mobile-panel-header">
          <span className="topbar-mobile-panel-title">Menu</span>
          <button
            className="topbar-icon-button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="topbar-icon" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="topbar-mobile-panel-content">
          <MobileAppSwitcher
            currentApp={currentApp}
            apps={apps}
            onSelect={onClose}
          />

          <div className="topbar-mobile-divider" />

          <MobileUserMenu
            user={user}
            organization={organization}
            organizations={organizations}
            onLogout={onLogout}
            onSwitchOrg={onSwitchOrg}
          />

          <div className="topbar-mobile-divider" />

          <div className="topbar-mobile-section-header">HELP</div>
          <HelpButton className="topbar-mobile-help-button" />
        </div>
      </div>
    </>
  );
}

interface MobileMenuTriggerProps {
  onClick: () => void;
  className?: string;
}

/**
 * Hamburger button to open mobile menu
 */
export function MobileMenuTrigger({ onClick, className = '' }: MobileMenuTriggerProps) {
  return (
    <button
      className={`topbar-icon-button topbar-mobile-trigger ${className}`}
      onClick={onClick}
      aria-label="Open navigation menu"
      aria-haspopup="menu"
    >
      <Menu className="topbar-icon" aria-hidden="true" />
    </button>
  );
}

interface CurrentAppDropdownProps {
  currentApp: ParsleeApp;
  apps: AppConfig[];
  className?: string;
}

/**
 * Current app dropdown for mobile header
 */
export function CurrentAppDropdown({
  currentApp,
  apps,
  className = '',
}: CurrentAppDropdownProps) {
  const currentAppConfig = apps.find((app) => app.id === currentApp);

  if (!currentAppConfig) return null;

  return (
    <div className={`topbar-current-app ${className}`}>
      <span>{currentAppConfig.label}</span>
      <ChevronDown className="topbar-current-app-chevron" aria-hidden="true" />
    </div>
  );
}
