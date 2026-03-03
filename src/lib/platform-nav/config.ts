import {
  Users,
  FileText,
  Wand2,
  Bot,
  LayoutDashboard,
} from 'lucide-react';
import type { AppConfig, ParsleeApp } from './types';

/**
 * Domain mapping for each platform application
 */
export const APP_DOMAINS: Record<ParsleeApp, string> = {
  crm: 'crm.parslee.ai',
  documents: 'odi.parslee.ai',
  studio: 'studio.parslee.ai',
  agents: 'app.parslee.ai',
  dashboard: 'dashboard.parslee.ai',
};

/**
 * Default application configurations
 */
export const DEFAULT_APPS: AppConfig[] = [
  {
    id: 'crm',
    label: 'CRM',
    shortLabel: 'CRM',
    href: `https://${APP_DOMAINS.crm}`,
    icon: Users,
  },
  {
    id: 'documents',
    label: 'Documents',
    shortLabel: 'Docs',
    href: `https://${APP_DOMAINS.documents}`,
    icon: FileText,
  },
  {
    id: 'studio',
    label: 'Studio',
    shortLabel: 'Studio',
    href: `https://${APP_DOMAINS.studio}`,
    icon: Wand2,
  },
  {
    id: 'agents',
    label: 'AI Agents',
    shortLabel: 'Agents',
    href: `https://${APP_DOMAINS.agents}`,
    icon: Bot,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dash',
    href: `https://${APP_DOMAINS.dashboard}`,
    icon: LayoutDashboard,
  },
];

/**
 * Resource ID prefixes for deep linking validation
 */
export const RESOURCE_PREFIXES: Record<string, string> = {
  accounts: 'acc_',
  contacts: 'con_',
  deals: 'deal_',
  invoices: 'inv_',
  complaints: 'cmp_',
  subscriptions: 'sub_',
  employees: 'emp_',
  workflows: 'wf_',
  conversations: 'conv_',
  transcripts: 'tx_',
  documents: 'doc_',
  schemas: 'sch_',
  sources: 'src_',
  classifications: 'cls_',
  projects: 'proj_',
  assets: 'ast_',
  organizations: 'org_',
};

/**
 * CSS variable definitions for theming
 */
export const CSS_VARS = {
  height: '--topbar-height',
  paddingX: '--topbar-padding-x',
  bg: '--topbar-bg',
  border: '--topbar-border',
  text: '--topbar-text',
  textActive: '--topbar-text-active',
  textMuted: '--topbar-text-muted',
  hoverBg: '--topbar-hover-bg',
  activeIndicator: '--topbar-active-indicator',
  focusRing: '--topbar-focus-ring',
  dropdownBg: '--topbar-dropdown-bg',
  dropdownBorder: '--topbar-dropdown-border',
  dropdownHover: '--topbar-dropdown-hover',
} as const;
