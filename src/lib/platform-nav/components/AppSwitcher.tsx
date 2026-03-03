import type { AppConfig, ParsleeApp } from '../types';
import { useIsDesktop, useIsTablet } from '../hooks/useMediaQuery';

interface AppSwitcherProps {
  currentApp: ParsleeApp;
  apps: AppConfig[];
  className?: string;
}

/**
 * App switcher tabs for desktop and tablet
 */
export function AppSwitcher({ currentApp, apps, className = '' }: AppSwitcherProps) {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  return (
    <nav
      role="navigation"
      aria-label="Application switcher"
      className={`topbar-app-switcher ${className}`}
    >
      <ul role="tablist" aria-label="Parslee applications" className="topbar-app-list">
        {apps.map((app) => {
          const isActive = app.id === currentApp;
          const Icon = app.icon;
          const label = isDesktop ? app.label : app.shortLabel;

          return (
            <li key={app.id} role="presentation">
              <a
                href={app.href}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`topbar-app-tab ${isActive ? 'topbar-app-tab--active' : ''}`}
              >
                {isTablet && <Icon className="topbar-app-icon" aria-hidden="true" />}
                <span>{label}</span>
                {isActive && <span className="topbar-active-indicator" aria-hidden="true" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface MobileAppSwitcherProps {
  currentApp: ParsleeApp;
  apps: AppConfig[];
  onSelect?: () => void;
  className?: string;
}

/**
 * Mobile app switcher as vertical list
 */
export function MobileAppSwitcher({
  currentApp,
  apps,
  onSelect,
  className = '',
}: MobileAppSwitcherProps) {
  return (
    <div className={`topbar-mobile-app-switcher ${className}`}>
      <div className="topbar-mobile-section-header">SWITCH APP</div>
      <ul role="menu" className="topbar-mobile-app-list">
        {apps.map((app) => {
          const isActive = app.id === currentApp;
          const Icon = app.icon;

          return (
            <li key={app.id} role="presentation">
              <a
                href={app.href}
                role="menuitem"
                className={`topbar-mobile-app-item ${isActive ? 'topbar-mobile-app-item--active' : ''}`}
                onClick={onSelect}
              >
                <Icon className="topbar-mobile-app-icon" aria-hidden="true" />
                <span>{app.label}</span>
                {isActive && (
                  <span className="topbar-mobile-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
