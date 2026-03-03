import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Card,
  Title1,
  Title2,
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
  Person24Regular,
  Building24Regular,
  Shield24Regular,
  Mail24Regular,
  Calendar24Regular,
  Document24Regular,
  People24Regular,
  ArrowRight24Regular,
  Info24Regular,
  CheckmarkCircle24Filled,
} from '@fluentui/react-icons';
import {
  getIndividualConsentUrl,
  getAdminConsentUrl,
  generateConsentState,
  storeConsentState,
  INDIVIDUAL_USER_SCOPES,
} from './consentConfig';
import './SignInOptions.css';

interface SignInOptionsProps {
  /**
   * Pre-fill the user's email if known (e.g., from query params)
   */
  loginHint?: string;
  /**
   * URL to return to after successful consent
   */
  returnUrl?: string;
  /**
   * Show success message (e.g., after admin consent approval)
   */
  showSuccess?: boolean;
  /**
   * Success message type
   */
  successType?: 'individual' | 'admin';
}

export function SignInOptions({
  loginHint,
  returnUrl,
  showSuccess,
  successType,
}: SignInOptionsProps) {
  const [isLoading, setIsLoading] = useState<'individual' | 'admin' | null>(null);

  const handleIndividualSignIn = () => {
    setIsLoading('individual');

    // Generate CSRF protection state
    const state = generateConsentState();
    storeConsentState(state, { type: 'individual', returnUrl });

    // Redirect to Microsoft login with user-consentable scopes
    const authUrl = getIndividualConsentUrl({ loginHint, state });
    window.location.href = authUrl;
  };

  const handleOrganizationConnect = () => {
    setIsLoading('admin');

    // Generate CSRF protection state
    const state = generateConsentState();
    storeConsentState(state, { type: 'admin', returnUrl });

    // Redirect to admin consent endpoint
    // - If user IS admin: Shows admin consent dialog
    // - If user is NOT admin: Shows "Request approval" button (triggers Admin Consent Workflow)
    const adminConsentUrl = getAdminConsentUrl({ state });
    window.location.href = adminConsentUrl;
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="sign-in-options-container">
        <Card className="sign-in-options-card">
          {/* Success Message */}
          {showSuccess && (
            <MessageBar intent="success" className="success-message">
              <MessageBarBody>
                <MessageBarTitle>
                  <CheckmarkCircle24Filled /> Successfully Connected!
                </MessageBarTitle>
                {successType === 'admin'
                  ? 'Your organization has been connected to Parslee. All users can now sign in.'
                  : 'Your Microsoft 365 account has been connected to Parslee.'}
              </MessageBarBody>
            </MessageBar>
          )}

          {/* Header */}
          <div className="sign-in-header">
            <Title1>Connect to Parslee</Title1>
            <Body1>
              Choose how you'd like to connect your Microsoft 365 account.
            </Body1>
          </div>

          <div className="sign-in-paths">
            {/* Path 1: Individual User */}
            <div className="sign-in-path individual-path">
              <div className="path-icon">
                <Person24Regular />
              </div>
              <div className="path-content">
                <div className="path-header">
                  <Title2>Personal Access</Title2>
                  <Badge appearance="outline" color="informative">
                    No Admin Required
                  </Badge>
                </div>
                <Body1 className="path-description">
                  Connect your own Microsoft 365 account. Parslee will only access
                  <strong> your personal</strong> email, calendar, and files.
                </Body1>

                {/* What you're granting */}
                <div className="permissions-preview">
                  <Body2>What Parslee can access:</Body2>
                  <ul className="permission-list">
                    <li>
                      <Mail24Regular /> Your email (read and send)
                    </li>
                    <li>
                      <Calendar24Regular /> Your calendar (view and manage)
                    </li>
                    <li>
                      <Document24Regular /> Your OneDrive files
                    </li>
                  </ul>
                </div>

                <Button
                  appearance="primary"
                  size="large"
                  icon={isLoading === 'individual' ? <Spinner size="tiny" /> : <ArrowRight24Regular />}
                  iconPosition="after"
                  onClick={handleIndividualSignIn}
                  disabled={isLoading !== null}
                  className="sign-in-button"
                >
                  {isLoading === 'individual' ? 'Redirecting...' : 'Sign In with Microsoft'}
                </Button>

                <Body2 className="consent-note">
                  You'll see a Microsoft consent dialog. Click "Accept" to grant access.
                </Body2>
              </div>
            </div>

            <Divider vertical className="path-divider">
              or
            </Divider>

            {/* Path 2: Organization */}
            <div className="sign-in-path organization-path">
              <div className="path-icon">
                <Building24Regular />
              </div>
              <div className="path-content">
                <div className="path-header">
                  <Title2>Organization Access</Title2>
                  <Badge appearance="filled" color="important">
                    Admin Approval
                  </Badge>
                </div>
                <Body1 className="path-description">
                  Enable Parslee for your entire organization. Unlocks full AI Employee
                  capabilities including team collaboration and org-wide features.
                </Body1>

                {/* What organization access enables */}
                <div className="permissions-preview">
                  <Body2>Additional capabilities:</Body2>
                  <ul className="permission-list">
                    <li>
                      <People24Regular /> Access to organization directory
                    </li>
                    <li>
                      <Shield24Regular /> Shared calendars and resources
                    </li>
                    <li>
                      <Building24Regular /> Teams and channel access
                    </li>
                  </ul>
                </div>

                <Button
                  appearance="primary"
                  size="large"
                  icon={isLoading === 'admin' ? <Spinner size="tiny" /> : <Shield24Regular />}
                  iconPosition="after"
                  onClick={handleOrganizationConnect}
                  disabled={isLoading !== null}
                  className="sign-in-button"
                >
                  {isLoading === 'admin' ? 'Redirecting...' : 'Connect Organization'}
                </Button>

                <Accordion collapsible className="admin-faq">
                  <AccordionItem value="not-admin">
                    <AccordionHeader>
                      <Info24Regular /> Not an admin?
                    </AccordionHeader>
                    <AccordionPanel>
                      <Body2>
                        No problem! When you click "Connect Organization", you'll see a
                        "Request approval" button. This sends a request to your IT admin,
                        who can approve it with one click from their email. No portal access
                        needed for anyone!
                      </Body2>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>

          {/* Publisher Verification Notice */}
          <div className="verification-notice">
            <MessageBar intent="warning">
              <MessageBarBody>
                <MessageBarTitle>Publisher Verification In Progress</MessageBarTitle>
                Parslee is currently undergoing Microsoft publisher verification. Some
                organizations may require admin approval for all app connections until
                verification is complete (expected within 2 weeks).
              </MessageBarBody>
            </MessageBar>
          </div>

          {/* Help Section */}
          <div className="help-section">
            <Body2>
              Need help? Contact{' '}
              <a href="mailto:support@parslee.ai">support@parslee.ai</a> or visit our{' '}
              <a href="https://docs.parslee.ai/setup" target="_blank" rel="noopener noreferrer">
                setup documentation
              </a>
              .
            </Body2>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default SignInOptions;
