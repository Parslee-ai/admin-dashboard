import { useState } from 'react';
import { ChevronDown, ChevronLeft, LogOut, Plus, Settings } from 'lucide-react';
import type { UserInfo, Organization } from '../types';
import { useDropdown } from '../hooks/useDropdown';
import { useIsDesktop } from '../hooks/useMediaQuery';

interface UserMenuProps {
  user: UserInfo;
  organization: Organization;
  organizations?: Organization[];
  onLogout: () => void;
  onSwitchOrg?: (orgId: string) => void;
  className?: string;
}

/**
 * User menu with avatar, organization switcher, and logout
 */
export function UserMenu({
  user,
  organization,
  organizations = [],
  onLogout,
  onSwitchOrg,
  className = '',
}: UserMenuProps) {
  const isDesktop = useIsDesktop();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const { isOpen, triggerProps, contentProps, close } = useDropdown({
    onClose: () => setShowOrgSwitcher(false),
  });

  const handleOrgSwitch = (orgId: string) => {
    onSwitchOrg?.(orgId);
    close();
  };

  const handleLogout = () => {
    onLogout();
    close();
  };

  return (
    <div className={`topbar-user-menu ${className}`}>
      <button
        {...triggerProps}
        className={`topbar-user-trigger ${isOpen ? 'topbar-user-trigger--open' : ''}`}
        aria-label={`User menu for ${user.name}`}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            aria-hidden="true"
            className="topbar-avatar"
          />
        ) : (
          <span className="topbar-avatar topbar-avatar--initials" aria-hidden="true">
            {user.initials}
          </span>
        )}
        {isDesktop && <span className="topbar-user-name">{user.name.split(' ')[0]}</span>}
        <ChevronDown
          className={`topbar-user-chevron ${isOpen ? 'topbar-user-chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div {...contentProps} className="topbar-dropdown">
          {showOrgSwitcher ? (
            <OrgSwitcherPanel
              organizations={organizations}
              currentOrgId={organization.id}
              onBack={() => setShowOrgSwitcher(false)}
              onSelect={handleOrgSwitch}
            />
          ) : (
            <MainMenuPanel
              user={user}
              organization={organization}
              hasMultipleOrgs={organizations.length > 1}
              onShowOrgSwitcher={() => setShowOrgSwitcher(true)}
              onLogout={handleLogout}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface MainMenuPanelProps {
  user: UserInfo;
  organization: Organization;
  hasMultipleOrgs: boolean;
  onShowOrgSwitcher: () => void;
  onLogout: () => void;
}

function MainMenuPanel({
  user,
  organization,
  hasMultipleOrgs,
  onShowOrgSwitcher,
  onLogout,
}: MainMenuPanelProps) {
  return (
    <>
      {/* User info header */}
      <div className="topbar-dropdown-header">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            aria-hidden="true"
            className="topbar-dropdown-avatar"
          />
        ) : (
          <span className="topbar-dropdown-avatar topbar-dropdown-avatar--initials">
            {user.initials}
          </span>
        )}
        <div className="topbar-dropdown-user-info">
          <div className="topbar-dropdown-user-name">{user.name}</div>
          <div className="topbar-dropdown-user-email">{user.email}</div>
        </div>
      </div>

      <div className="topbar-dropdown-divider" role="separator" />

      {/* Organization section */}
      <div className="topbar-dropdown-section">
        <div className="topbar-dropdown-section-header">ORGANIZATION</div>
        <div className="topbar-dropdown-org-current">
          {organization.name}
          <span className="topbar-dropdown-check" aria-hidden="true">✓</span>
        </div>
      </div>

      {hasMultipleOrgs && (
        <button
          className="topbar-dropdown-item"
          role="menuitem"
          onClick={onShowOrgSwitcher}
        >
          <Settings className="topbar-dropdown-item-icon" aria-hidden="true" />
          <span>Switch Organization</span>
          <ChevronDown
            className="topbar-dropdown-item-chevron"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden="true"
          />
        </button>
      )}

      <div className="topbar-dropdown-divider" role="separator" />

      {/* Logout */}
      <button
        className="topbar-dropdown-item topbar-dropdown-item--danger"
        role="menuitem"
        onClick={onLogout}
      >
        <LogOut className="topbar-dropdown-item-icon" aria-hidden="true" />
        <span>Sign Out</span>
      </button>
    </>
  );
}

interface OrgSwitcherPanelProps {
  organizations: Organization[];
  currentOrgId: string;
  onBack: () => void;
  onSelect: (orgId: string) => void;
}

function OrgSwitcherPanel({
  organizations,
  currentOrgId,
  onBack,
  onSelect,
}: OrgSwitcherPanelProps) {
  return (
    <>
      <button
        className="topbar-dropdown-back"
        role="menuitem"
        onClick={onBack}
      >
        <ChevronLeft className="topbar-dropdown-back-icon" aria-hidden="true" />
        <span>Organizations</span>
      </button>

      <div className="topbar-dropdown-divider" role="separator" />

      <div className="topbar-dropdown-org-list">
        {organizations.map((org) => {
          const isSelected = org.id === currentOrgId;
          return (
            <button
              key={org.id}
              className={`topbar-dropdown-org-item ${isSelected ? 'topbar-dropdown-org-item--selected' : ''}`}
              role="menuitem"
              onClick={() => onSelect(org.id)}
            >
              <span>{org.name}</span>
              {isSelected && (
                <span className="topbar-dropdown-check" aria-hidden="true">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="topbar-dropdown-divider" role="separator" />

      <button className="topbar-dropdown-item" role="menuitem">
        <Plus className="topbar-dropdown-item-icon" aria-hidden="true" />
        <span>Add Organization</span>
      </button>
    </>
  );
}

interface MobileUserMenuProps {
  user: UserInfo;
  organization: Organization;
  organizations?: Organization[];
  onLogout: () => void;
  onSwitchOrg?: (orgId: string) => void;
  className?: string;
}

/**
 * Mobile-optimized user menu as vertical list
 */
export function MobileUserMenu({
  user,
  organization,
  organizations = [],
  onLogout,
  onSwitchOrg,
  className = '',
}: MobileUserMenuProps) {
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);

  return (
    <div className={`topbar-mobile-user-menu ${className}`}>
      <div className="topbar-mobile-section-header">USER</div>

      {/* User info */}
      <div className="topbar-mobile-user-info">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            aria-hidden="true"
            className="topbar-mobile-avatar"
          />
        ) : (
          <span className="topbar-mobile-avatar topbar-mobile-avatar--initials">
            {user.initials}
          </span>
        )}
        <div className="topbar-mobile-user-details">
          <div className="topbar-mobile-user-name">{user.name}</div>
          <div className="topbar-mobile-user-org">{organization.name}</div>
        </div>
      </div>

      {/* Org switcher */}
      {organizations.length > 1 && (
        <button
          className="topbar-mobile-menu-item"
          onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
        >
          <Settings className="topbar-mobile-menu-icon" aria-hidden="true" />
          <span>Switch Organization</span>
          <ChevronDown
            className={`topbar-mobile-menu-chevron ${showOrgSwitcher ? 'topbar-mobile-menu-chevron--open' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}

      {showOrgSwitcher && (
        <div className="topbar-mobile-org-list">
          {organizations.map((org) => (
            <button
              key={org.id}
              className={`topbar-mobile-org-item ${org.id === organization.id ? 'topbar-mobile-org-item--selected' : ''}`}
              onClick={() => onSwitchOrg?.(org.id)}
            >
              <span>{org.name}</span>
              {org.id === organization.id && (
                <span className="topbar-mobile-check" aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Logout */}
      <button className="topbar-mobile-menu-item topbar-mobile-menu-item--danger" onClick={onLogout}>
        <LogOut className="topbar-mobile-menu-icon" aria-hidden="true" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
