import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Card,
  Title1,
  Title2,
  Title3,
  Body1,
  Body2,
  Button,
  Divider,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Person24Regular,
  Shield24Regular,
  Apps24Regular,
  Chat24Regular,
  Key24Regular,
  Organization24Regular,
  ArrowRight24Regular,
  Open24Regular,
  Copy24Regular,
  Mail24Regular,
  Sparkle24Filled,
  Building24Regular,
  Calendar24Regular,
  Document24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import {
  getIndividualConsentUrl,
  getAdminConsentUrl,
  generateConsentState,
  storeConsentState,
  PARSLEE_MULTI_TENANT_APP,
} from '../auth/consentConfig';
import './GettingStartedPage.css';

function GettingStartedPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const orgId = searchParams.get('org_id') || '';
  const quantity = searchParams.get('quantity') || '1';
  const consentSuccess = searchParams.get('success') === 'true';
  const consentError = searchParams.get('error');

  const [isLoading, setIsLoading] = useState<'individual' | 'admin' | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /**
   * Handle individual user sign-in (Path 1)
   * User consents for their own data only - no admin required
   */
  const handleIndividualSignIn = () => {
    setIsLoading('individual');
    const state = generateConsentState();
    storeConsentState(state, { type: 'individual', returnUrl: window.location.href });
    const authUrl = getIndividualConsentUrl({ loginHint: email, state });
    window.location.href = authUrl;
  };

  /**
   * Handle organization admin consent (Path 2)
   * - If user IS admin: Shows admin consent dialog
   * - If user is NOT admin: Shows "Request approval" button (Admin Consent Workflow)
   */
  const handleOrganizationConnect = () => {
    setIsLoading('admin');
    const state = generateConsentState();
    storeConsentState(state, { type: 'admin', returnUrl: window.location.href });
    const adminConsentUrl = getAdminConsentUrl({ state });
    window.location.href = adminConsentUrl;
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="getting-started-container">
        <Card className="getting-started-card">
          {/* Success/Error Messages */}
          {consentSuccess && (
            <MessageBar intent="success" className="consent-message">
              <MessageBarBody>
                <MessageBarTitle>
                  <CheckmarkCircle24Filled /> Successfully Connected!
                </MessageBarTitle>
                Your Microsoft 365 account has been connected to Parslee.
              </MessageBarBody>
            </MessageBar>
          )}
          {consentError && (
            <MessageBar intent="error" className="consent-message">
              <MessageBarBody>
                <MessageBarTitle>Connection Error</MessageBarTitle>
                {consentError === 'consent_denied'
                  ? 'Consent was denied. Please try again or contact your IT administrator.'
                  : `An error occurred: ${consentError}`}
              </MessageBarBody>
            </MessageBar>
          )}

          {/* Header */}
          <div className="getting-started-header">
            <div className="header-brand">
              <div className="brand-icon">
                <Sparkle24Filled />
              </div>
              <span className="brand-text">Parslee</span>
            </div>
            <div className="header-success">
              <CheckmarkCircle24Filled className="success-icon" />
              <Title1>Your AI Employees Are Ready!</Title1>
            </div>
            <Body1 className="header-subtitle">
              Follow these steps to complete your setup and start using your AI Employees.
            </Body1>
          </div>

          {/* Account Summary */}
          <div className="account-summary">
            <div className="summary-item">
              <Mail24Regular />
              <div>
                <Body2>Account Email</Body2>
                <Body1>{email || 'Your Microsoft 365 email'}</Body1>
              </div>
            </div>
            <div className="summary-item">
              <Person24Regular />
              <div>
                <Body2>AI Employees</Body2>
                <Body1>{quantity} seat(s) activated</Body1>
              </div>
            </div>
          </div>

          <Divider className="section-divider" />

          {/* Setup Steps */}
          <div className="setup-steps">
            <Title2>Setup Guide</Title2>

            {/* Step 1: Connect Microsoft 365 - Two-Tier Consent */}
            <div className="step-card step-1">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-header">
                  <Key24Regular />
                  <Title3>Connect Microsoft 365</Title3>
                  <Badge appearance="filled" color="important">Required</Badge>
                </div>
                <Body1 className="step-description">
                  Choose how to connect your Microsoft 365 account to Parslee.
                </Body1>

                {/* Two-Tier Consent Options */}
                <div className="consent-options">
                  {/* Option A: Individual Access */}
                  <div className="consent-option individual">
                    <div className="option-header">
                      <Person24Regular />
                      <Title3>Personal Access</Title3>
                      <Badge appearance="outline" color="success">No Admin Required</Badge>
                    </div>
                    <Body2 className="option-description">
                      Connect your own account only. Parslee accesses <strong>your</strong> email, calendar, and files.
                    </Body2>
                    <div className="permissions-list">
                      <div className="permission-item">
                        <Mail24Regular /> Your email
                      </div>
                      <div className="permission-item">
                        <Calendar24Regular /> Your calendar
                      </div>
                      <div className="permission-item">
                        <Document24Regular /> Your OneDrive
                      </div>
                    </div>
                    <Button
                      appearance="primary"
                      icon={isLoading === 'individual' ? <Spinner size="tiny" /> : <ArrowRight24Regular />}
                      iconPosition="after"
                      onClick={handleIndividualSignIn}
                      disabled={isLoading !== null}
                    >
                      {isLoading === 'individual' ? 'Redirecting...' : 'Sign In with Microsoft'}
                    </Button>
                  </div>

                  <Divider className="consent-divider">or</Divider>

                  {/* Option B: Organization Access */}
                  <div className="consent-option organization">
                    <div className="option-header">
                      <Building24Regular />
                      <Title3>Organization Access</Title3>
                      <Badge appearance="filled" color="brand">Full Features</Badge>
                    </div>
                    <Body2 className="option-description">
                      Enable Parslee for your entire organization. Unlocks team collaboration and org-wide AI Employee features.
                    </Body2>
                    <div className="permissions-list">
                      <div className="permission-item">
                        <Organization24Regular /> Organization directory
                      </div>
                      <div className="permission-item">
                        <Shield24Regular /> Shared resources
                      </div>
                      <div className="permission-item">
                        <Chat24Regular /> Teams integration
                      </div>
                    </div>
                    <Button
                      appearance="primary"
                      icon={isLoading === 'admin' ? <Spinner size="tiny" /> : <Shield24Regular />}
                      onClick={handleOrganizationConnect}
                      disabled={isLoading !== null}
                    >
                      {isLoading === 'admin' ? 'Redirecting...' : 'Connect Organization'}
                    </Button>
                    <Accordion collapsible className="admin-help">
                      <AccordionItem value="not-admin">
                        <AccordionHeader>
                          <Info24Regular /> Not an admin?
                        </AccordionHeader>
                        <AccordionPanel>
                          <Body2>
                            No problem! Click "Connect Organization" and you'll see a "Request approval"
                            button. This sends a request to your IT admin, who can approve it with one
                            click from their email - <strong>no portal access needed</strong>.
                          </Body2>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                {/* Publisher Verification Notice */}
                <MessageBar intent="warning" className="verification-notice">
                  <MessageBarBody>
                    <MessageBarTitle>Publisher Verification In Progress</MessageBarTitle>
                    Parslee is currently being verified by Microsoft. Some organizations may require
                    admin approval for all connections until verification completes (expected within 2 weeks).
                  </MessageBarBody>
                </MessageBar>
              </div>
            </div>

            {/* Step 2: Install Teams App - Simplified */}
            <div className="step-card step-2">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-header">
                  <Apps24Regular />
                  <Title3>Install Parslee in Microsoft Teams</Title3>
                  <Badge appearance="filled" color="informative">Recommended</Badge>
                </div>
                <Body1 className="step-description">
                  Add the Parslee app to Microsoft Teams to chat with your AI Employees directly.
                </Body1>

                <Accordion collapsible>
                  <AccordionItem value="install-options">
                    <AccordionHeader>Installation options</AccordionHeader>
                    <AccordionPanel>
                      <div className="accordion-content">
                        <Body2><strong>Option A: Install for yourself</strong></Body2>
                        <ol>
                          <li>Open Microsoft Teams</li>
                          <li>Click "Apps" in the left sidebar</li>
                          <li>Search for "Parslee"</li>
                          <li>Click "Add" to install</li>
                        </ol>

                        <Divider />

                        <Body2><strong>Option B: Deploy for your organization (Admin)</strong></Body2>
                        <ol>
                          <li>Go to Teams Admin Center</li>
                          <li>Navigate to Teams apps → Manage apps</li>
                          <li>Search for "Parslee"</li>
                          <li>Configure app policies for your organization</li>
                        </ol>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <Button
                  appearance="primary"
                  icon={<Chat24Regular />}
                  onClick={() => window.location.href = 'https://teams.microsoft.com/l/app/954340b8-476a-4511-9a16-5736ad4ccaf9'}
                >
                  Install Ada in Microsoft Teams
                </Button>
              </div>
            </div>

            {/* Step 3: Meet Your AI Employees */}
            <div className="step-card step-3">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-header">
                  <Organization24Regular />
                  <Title3>Meet Your AI Employees</Title3>
                </div>
                <Body1 className="step-description">
                  Once setup is complete, you can start chatting with your AI Employees in Teams or configure them in the Parslee dashboard.
                </Body1>

                <div className="ai-employees-preview">
                  <div className="employee-card">
                    <div className="employee-avatar ada">A</div>
                    <div className="employee-info">
                      <Body1><strong>Ada</strong></Body1>
                      <Body2>Executive Assistant</Body2>
                    </div>
                  </div>
                  <div className="employee-card">
                    <div className="employee-avatar casey">C</div>
                    <div className="employee-info">
                      <Body1><strong>Casey</strong></Body1>
                      <Body2>Customer Support</Body2>
                    </div>
                  </div>
                </div>

                <Body2 className="employee-note">
                  Your AI Employees are customizable. Configure their skills, personality, and access in the dashboard.
                </Body2>
              </div>
            </div>
          </div>

          <Divider className="section-divider" />

          {/* Help Section */}
          <div className="help-section">
            <Title3>Need Help?</Title3>
            <div className="help-options">
              <Button
                appearance="secondary"
                icon={<Open24Regular />}
                onClick={() => window.open('https://docs.parslee.ai', '_blank')}
              >
                Documentation
              </Button>
              <Button
                appearance="secondary"
                icon={<Mail24Regular />}
                onClick={() => window.location.href = 'mailto:support@parslee.ai'}
              >
                Contact Support
              </Button>
              <Button
                appearance="secondary"
                icon={<Chat24Regular />}
                onClick={() => window.open('https://www.parslee.ai/contact', '_blank')}
              >
                Schedule a Call
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default GettingStartedPage;
