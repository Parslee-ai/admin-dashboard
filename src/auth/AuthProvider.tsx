import { ReactNode, useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';

export const isLocalDev = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname.endsWith('.trycloudflare.com');

export const msalInstance = new PublicClientApplication(msalConfig);

if (!isLocalDev) {
  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      msalInstance.setActiveAccount(payload.account);
    }
  });
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      if (isLocalDev) {
        setIsInitialized(true);
        return;
      }
      msalInstance.handleRedirectPromise()
        .then((response) => {
          if (response) {
            msalInstance.setActiveAccount(response.account);
          } else {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
              msalInstance.setActiveAccount(accounts[0]);
            }
          }
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error('MSAL redirect error:', error);
          setIsInitialized(true);
        });
    }).catch((error) => {
      console.error('MSAL init error:', error);
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
