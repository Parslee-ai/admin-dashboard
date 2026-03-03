import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Spinner,
  Badge,
  ProgressBar,
  Divider,
  tokens,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Regular,
  Rocket24Regular,
  Person24Regular,
  Mail24Regular,
  Building24Regular,
  Calendar24Regular,
  Sparkle24Filled,
} from '@fluentui/react-icons';
import axios from 'axios';
import './WelcomePage.css';

interface SubscriptionInfo {
  subscriptionId: string;
  planId: string;
  quantity: number;
  status: string;
  email?: string;
}

type WelcomeStep = 'loading' | 'review' | 'activating' | 'success' | 'error';

function WelcomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<WelcomeStep>('loading');
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<any>(null);

  useEffect(() => {
    // Parse query params from marketplace redirect
    const subscriptionId = searchParams.get('subscription_id');
    const planId = searchParams.get('plan_id');
    const quantity = searchParams.get('quantity');
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    // Check for error redirect
    if (errorParam) {
      setError(errorMessage || 'An error occurred during marketplace activation');
      setStep('error');
      return;
    }

    // Validate required params
    if (!subscriptionId || !planId) {
      setError('Missing subscription information. Please try again from Azure Marketplace.');
      setStep('error');
      return;
    }

    setSubscriptionInfo({
      subscriptionId,
      planId,
      quantity: parseInt(quantity || '1', 10),
      status: status || 'pending',
      email: email || undefined,
    });
    setStep('review');
  }, [searchParams]);

  const handleActivate = async () => {
    if (!subscriptionInfo) return;

    setStep('activating');

    try {
      const response = await axios.post('/api/v1/marketplace/activate', {
        subscriptionId: subscriptionInfo.subscriptionId,
        planId: subscriptionInfo.planId,
        quantity: subscriptionInfo.quantity,
      });

      setActivationResult(response.data);
      setStep('success');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Activation failed');
      } else {
        setError('An unexpected error occurred');
      }
      setStep('error');
    }
  };

  const getPlanDisplayName = (planId: string) => {
    const planNames: Record<string, string> = {
      'parslee-agent': 'Parslee AI Employees',
      'parslee-agents-standard': 'Parslee AI Employees - Standard',
      'parslee-agents-professional': 'Parslee AI Employees - Professional',
      'parslee-agents-enterprise': 'Parslee AI Employees - Enterprise',
    };
    return planNames[planId] || planId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: 'warning' | 'success' | 'informative'; label: string }> = {
      pending: { color: 'warning', label: 'Pending Activation' },
      pendingfulfillment: { color: 'warning', label: 'Pending Activation' },
      subscribed: { color: 'success', label: 'Active' },
      active: { color: 'success', label: 'Active' },
    };
    const config = statusConfig[status.toLowerCase()] || { color: 'informative', label: status };
    return <Badge appearance="filled" color={config.color}>{config.label}</Badge>;
  };

  if (step === 'loading') {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="welcome-container">
          <div className="welcome-loading">
            <Spinner size="large" label="Loading subscription details..." />
          </div>
        </div>
      </FluentProvider>
    );
  }

  if (step === 'error') {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="welcome-container">
          <Card className="welcome-card error-card">
            <div className="welcome-header">
              <ErrorCircle24Regular className="error-icon" />
              <Title1>Activation Error</Title1>
            </div>
            <Body1 className="error-message">{error}</Body1>
            <div className="welcome-actions">
              <Button appearance="primary" onClick={() => window.location.href = 'https://portal.azure.com'}>
                Return to Azure Portal
              </Button>
              <Button appearance="secondary" onClick={() => window.location.href = 'mailto:support@parslee.ai'}>
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </FluentProvider>
    );
  }

  if (step === 'success') {
    // Redirect to getting started page with activation info
    const gettingStartedUrl = `/getting-started?email=${encodeURIComponent(subscriptionInfo?.email || '')}&org_id=${encodeURIComponent(activationResult?.organizationId || '')}&quantity=${subscriptionInfo?.quantity || 1}`;

    return (
      <FluentProvider theme={webLightTheme}>
        <div className="welcome-container">
          <Card className="welcome-card success-card">
            <div className="welcome-header">
              <CheckmarkCircle24Filled className="success-icon" />
              <Title1>Subscription Activated!</Title1>
            </div>
            <Body1 className="success-message">
              Your AI Employee subscription has been activated successfully. Let's get you set up!
            </Body1>

            <div className="activation-details">
              <div className="detail-item">
                <Building24Regular />
                <div>
                  <Body2>Organization ID</Body2>
                  <Body1>{activationResult?.organizationId}</Body1>
                </div>
              </div>
              <div className="detail-item">
                <Person24Regular />
                <div>
                  <Body2>AI Employees</Body2>
                  <Body1>{activationResult?.quantity} seat(s) activated</Body1>
                </div>
              </div>
            </div>

            <div className="welcome-actions">
              <Button
                appearance="primary"
                size="large"
                icon={<Rocket24Regular />}
                onClick={() => navigate(gettingStartedUrl)}
              >
                Continue to Setup Guide
              </Button>
            </div>
          </Card>
        </div>
      </FluentProvider>
    );
  }

  if (step === 'activating') {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="welcome-container">
          <Card className="welcome-card">
            <div className="welcome-header">
              <Spinner size="large" />
              <Title1>Activating Your Subscription</Title1>
            </div>
            <Body1>Please wait while we set up your AI Employees...</Body1>
            <ProgressBar className="activation-progress" />
          </Card>
        </div>
      </FluentProvider>
    );
  }

  // Review step
  return (
    <FluentProvider theme={webLightTheme}>
      <div className="welcome-container">
        <Card className="welcome-card">
          <div className="welcome-header">
            <div className="welcome-brand">
              <div className="welcome-brand-icon">
                <Sparkle24Filled />
              </div>
              <span className="welcome-brand-text">Parslee</span>
            </div>
            <Title1>Welcome to Parslee AI Employees</Title1>
          </div>

          <Body1 className="welcome-intro">
            Thank you for choosing Parslee! Please review your subscription details below and click "Activate" to complete your setup.
          </Body1>

          <Divider className="welcome-divider" />

          <Title2>Subscription Details</Title2>

          <div className="subscription-details">
            <div className="detail-row">
              <div className="detail-item">
                <Building24Regular />
                <div>
                  <Body2>Plan</Body2>
                  <Body1>{getPlanDisplayName(subscriptionInfo?.planId || '')}</Body1>
                </div>
              </div>
              <div className="detail-item">
                <Person24Regular />
                <div>
                  <Body2>AI Employees</Body2>
                  <Body1>{subscriptionInfo?.quantity} seat(s)</Body1>
                </div>
              </div>
            </div>

            <div className="detail-row">
              {subscriptionInfo?.email && (
                <div className="detail-item">
                  <Mail24Regular />
                  <div>
                    <Body2>Email</Body2>
                    <Body1>{subscriptionInfo.email}</Body1>
                  </div>
                </div>
              )}
              <div className="detail-item">
                <Calendar24Regular />
                <div>
                  <Body2>Status</Body2>
                  {getStatusBadge(subscriptionInfo?.status || 'pending')}
                </div>
              </div>
            </div>
          </div>

          <div className="pricing-info">
            <Title3>Pricing</Title3>
            <div className="price-breakdown">
              <div className="price-line">
                <Body1>AI Employee Seat</Body1>
                <Body1>$500/month</Body1>
              </div>
              <div className="price-line">
                <Body1>Quantity</Body1>
                <Body1>x {subscriptionInfo?.quantity}</Body1>
              </div>
              <Divider />
              <div className="price-line total">
                <Body1>Monthly Total</Body1>
                <Title3>${(subscriptionInfo?.quantity || 1) * 500}/month</Title3>
              </div>
            </div>
            <Body2 className="pricing-note">
              Includes 5M tokens per AI Employee. Additional usage billed at market rates.
            </Body2>
          </div>

          <Divider className="welcome-divider" />

          <div className="terms-section">
            <Body2>
              By clicking "Activate", you agree to the{' '}
              <a href="https://parslee.ai/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://parslee.ai/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>.
            </Body2>
          </div>

          <div className="welcome-actions">
            <Button
              appearance="primary"
              size="large"
              icon={<Rocket24Regular />}
              onClick={handleActivate}
            >
              Activate Subscription
            </Button>
            <Button
              appearance="secondary"
              onClick={() => window.location.href = 'https://portal.azure.com'}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default WelcomePage;
