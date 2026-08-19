/**
 * Authentic Google Identity Services & OAuth Client for OrthoCase
 * Integrates directly with Google Identity Services (GIS) SDK.
 * Renders authentic Google accounts dynamically from browser session.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  emailVerified?: boolean;
}

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '942086774912-87r3a5q1nvoq3713000g2g7i29j4v8sm.apps.googleusercontent.com';

/**
 * Decodes a verified Google OAuth2 ID Token (JWT) into the authentic user profile
 */
export function decodeGoogleJwt(jwtToken: string): GoogleUserProfile {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid JWT format');
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    return {
      id: payload.sub || `google-${Date.now()}`,
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Google User',
      email: (payload.email || '').toLowerCase().trim(),
      picture: payload.picture,
      givenName: payload.given_name,
      familyName: payload.family_name,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch (err) {
    console.error('Failed to decode Google JWT:', err);
    throw new Error('Failed to parse Google OAuth identity token.');
  }
}

/**
 * Fetches user profile from Google UserInfo API using OAuth2 access token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google UserInfo API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.sub || `google-${Date.now()}`,
    name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'Google User',
    email: (data.email || '').toLowerCase().trim(),
    picture: data.picture,
    givenName: data.given_name,
    familyName: data.family_name,
    emailVerified: Boolean(data.email_verified),
  };
}

/**
 * Initializes Google Identity Services (One Tap & Sign In)
 */
export function initGoogleIdentityServices(
  onSuccess: (profile: GoogleUserProfile) => void,
  onError?: (err: any) => void
): boolean {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          try {
            const profile = decodeGoogleJwt(response.credential);
            onSuccess(profile);
          } catch (e) {
            onError?.(e);
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    return true;
  } catch (e) {
    console.warn('Google Identity Services initialization failed:', e);
    onError?.(e);
    return false;
  }
}

/**
 * Launches the native Google OAuth2 popup window directly via token client
 */
export function triggerNativeGoogleOAuth(
  onSuccess: (profile: GoogleUserProfile) => void,
  onError?: (err: any) => void
): void {
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError?.(new Error(tokenResponse.error));
            return;
          }
          if (tokenResponse.access_token) {
            try {
              const profile = await fetchGoogleUserProfile(tokenResponse.access_token);
              onSuccess(profile);
            } catch (err) {
              onError?.(err);
            }
          }
        },
        error_callback: (err) => {
          onError?.(err);
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (e) {
      console.warn('OAuth2 token client failed, falling back to One Tap prompt / standard popup:', e);
    }
  }

  // Fallback: Trigger Google One Tap / Credential popup prompt
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap status:', notification.getNotDisplayedReason?.());
        }
      });
      return;
    } catch (e) {
      console.warn('Google prompt failed:', e);
    }
  }

  // Fallback 2: Open standard Google Accounts OAuth popup window
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    GOOGLE_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;

  const width = 500;
  const height = 600;
  const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 100;
  const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 100;

  const popup = window.open(
    authUrl,
    'GoogleSignInPopup',
    `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes`
  );

  if (!popup) {
    onError?.(new Error('Popup was blocked by your browser. Please allow popups for this site.'));
  }
}
