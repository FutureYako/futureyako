// API Configuration for SaveWise Frontend

export const API_BASE_URL = '/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNUP: `${API_BASE_URL}/auth/signup/`,
    LOGIN: `${API_BASE_URL}/auth/login/`,
    LOGIN_2FA: `${API_BASE_URL}/auth/login/2fa/`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/token/refresh/`,
    LOGOUT: `${API_BASE_URL}/auth/logout/`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password/`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password/`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/me/change-password/`,
  },
  
  // User Profile
  USER: {
    PROFILE: `${API_BASE_URL}/users/me/`,
    SETTINGS: `${API_BASE_URL}/users/me/settings/`,
    NOTIFICATION_PREFS: `${API_BASE_URL}/users/me/notification-prefs/`,
    AVATAR: `${API_BASE_URL}/users/me/avatar/`,
    ONBOARDING: `${API_BASE_URL}/users/me/onboarding/`,
    SESSIONS: `${API_BASE_URL}/users/me/sessions/`,
    LOGIN_HISTORY: `${API_BASE_URL}/users/me/login-history/`,
  },
  
  // 2FA
  TWO_FACTOR: {
    STATUS: `${API_BASE_URL}/users/me/2fa/`,
    SETUP: `${API_BASE_URL}/users/me/2fa/setup/`,
    VERIFY: `${API_BASE_URL}/users/me/2fa/verify/`,
    DISABLE: `${API_BASE_URL}/users/me/2fa/disable/`,
    BACKUP_CODES: `${API_BASE_URL}/users/me/2fa/backup-codes/`,
  },
  
  // Wallets
  WALLETS: {
    DETAIL: `${API_BASE_URL}/wallets/me/`,
    FUNDING_SOURCES: `${API_BASE_URL}/wallets/funding-sources/`,
    SET_PRIMARY: `${API_BASE_URL}/wallets/funding-sources/`,
  },
  
  // Goals
  GOALS: {
    LIST: `${API_BASE_URL}/goals/`,
    DETAIL: (id: string) => `${API_BASE_URL}/goals/${id}/`,
    PARTICIPANTS: (id: string) => `${API_BASE_URL}/goals/${id}/participants/`,
    JOIN: `${API_BASE_URL}/goals/join/`,
    INVITE: (id: string) => `${API_BASE_URL}/goals/${id}/invite/`,
    REMOVE_PARTICIPANT: (id: string, userId: string) => `${API_BASE_URL}/goals/${id}/participants/${userId}/`,
    CONTRIBUTE: (id: string) => `${API_BASE_URL}/goals/${id}/contribute/`,
    WITHDRAWAL_REQUESTS: (id: string) => `${API_BASE_URL}/goals/${id}/withdrawal-requests/`,
    VOTE_WITHDRAWAL: (id: string, requestId: string) => `${API_BASE_URL}/goals/${id}/withdrawal-requests/${requestId}/vote/`,
  },
  
  // Investments
  INVESTMENTS: {
    FUNDS: `${API_BASE_URL}/investments/funds/`,
    FUND_DETAIL: (id: string) => `${API_BASE_URL}/investments/funds/${id}/`,
    HOLDINGS: `${API_BASE_URL}/investments/`,
    HOLDING_DETAIL: (id: string) => `${API_BASE_URL}/investments/${id}/`,
    REVIEW_INVESTMENT: `${API_BASE_URL}/investments/review/`,
    PORTFOLIO: `${API_BASE_URL}/investments/portfolio/`,
    ALLOCATION: `${API_BASE_URL}/investments/portfolio/allocation/`,
    RETURNS: `${API_BASE_URL}/investments/portfolio/returns/`,
    SNAPSHOT: `${API_BASE_URL}/investments/portfolio/snapshot/`,
  },
  
  // Auto-save
  AUTOSAVE: {
    PREFERENCES: `${API_BASE_URL}/saving-preferences/preferences/`,
    TOGGLE: `${API_BASE_URL}/saving-preferences/preferences/toggle/`,
    LOGS: `${API_BASE_URL}/saving-preferences/preferences/logs/`,
    GOAL_WEIGHTS: `${API_BASE_URL}/saving-preferences/goal-weights/`,
    GOAL_WEIGHT_DETAIL: (id: string) => `${API_BASE_URL}/saving-preferences/goal-weights/${id}/`,
    ONBOARDING: `${API_BASE_URL}/saving-preferences/onboarding/`,
    SUMMARY: `${API_BASE_URL}/saving-preferences/summary/`,
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: `${API_BASE_URL}/transactions/`,
    DETAIL: (id: string) => `${API_BASE_URL}/transactions/${id}/`,
    SUMMARY: `${API_BASE_URL}/transactions/summary/`,
    EXPORT: `${API_BASE_URL}/transactions/export/`,
    EXPORT_STATUS: (id: string) => `${API_BASE_URL}/transactions/export/${id}/`,
    DEPOSIT: `${API_BASE_URL}/transactions/deposit/`,
    INVESTMENT: `${API_BASE_URL}/transactions/investment/`,
  },
  
  // Ultraner payment gateway — MNO + bank deposits, webhook
  PAYMENTS: {
    MNO_DEPOSIT: `${API_BASE_URL}/payments/deposit/mno/`,
    BANK_DEPOSIT: `${API_BASE_URL}/payments/deposit/bank/`,
    WEBHOOK: `${API_BASE_URL}/payments/webhook/`,
  },

  // Withdrawals
  WITHDRAWALS: {
    LIST: `${API_BASE_URL}/transactions/withdrawals/`,
    DETAIL: (id: string) => `${API_BASE_URL}/transactions/withdrawals/${id}/`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications/`,
    DETAIL: (id: string) => `${API_BASE_URL}/notifications/${id}/`,
    MARK_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read/`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/read-all/`,
    DELETE: (id: string) => `${API_BASE_URL}/notifications/${id}/delete/`,
    STATS: `${API_BASE_URL}/notifications/stats/`,
    PREFERENCES: `${API_BASE_URL}/notifications/preferences/`,
    QUEUE: `${API_BASE_URL}/notifications/queue/`,
  },
  
  // Admin
  ADMIN: {
    OVERVIEW: `${API_BASE_URL}/admin/overview/`,
    CHARTS: `${API_BASE_URL}/admin/charts/`,
    USERS: `${API_BASE_URL}/admin/users/`,
    USER_DETAIL: (id: string) => `${API_BASE_URL}/admin/users/${id}/`,
    SUSPEND_USER: (id: string) => `${API_BASE_URL}/admin/users/${id}/suspend/`,
    ACTIVATE_USER: (id: string) => `${API_BASE_URL}/admin/users/${id}/activate/`,
    MAKE_ADMIN: (id: string) => `${API_BASE_URL}/admin/users/${id}/make-admin/`,
    REVOKE_ADMIN: (id: string) => `${API_BASE_URL}/admin/users/${id}/revoke-admin/`,
    DELETE_USER: (id: string) => `${API_BASE_URL}/admin/users/${id}/delete/`,
    GOALS: `${API_BASE_URL}/admin/goals/`,
    GOAL_DETAIL: (id: string) => `${API_BASE_URL}/admin/goals/${id}/`,
    FUNDS: `${API_BASE_URL}/admin/funds/`,
    FUND_DETAIL: (id: string) => `${API_BASE_URL}/admin/funds/${id}/`,
    TRANSACTIONS: `${API_BASE_URL}/admin/transactions/`,
    WITHDRAWALS: `${API_BASE_URL}/admin/withdrawals/`,
    APPROVE_WITHDRAWAL: (id: string) => `${API_BASE_URL}/admin/withdrawals/${id}/approve/`,
    REJECT_WITHDRAWAL: (id: string) => `${API_BASE_URL}/admin/withdrawals/${id}/reject/`,
    BROADCAST: `${API_BASE_URL}/admin/broadcast/`,
    SETTINGS: `${API_BASE_URL}/admin/settings/`,
    ALERTS: `${API_BASE_URL}/admin/alerts/`,
    ALERT_DETAIL: (id: string) => `${API_BASE_URL}/admin/alerts/${id}/`,
    DISMISS_ALERT: (id: string) => `${API_BASE_URL}/admin/alerts/${id}/dismiss/`,
    ACTIVITY_LOGS: `${API_BASE_URL}/admin/activity/`,
    MONTHLY_STATS: `${API_BASE_URL}/admin/stats/`,
    GENERATE_STATS: `${API_BASE_URL}/admin/stats/generate/`,
    BANKS: `${API_BASE_URL}/admin/payment-providers/banks/`,
    BANK_DETAIL: (id: string) => `${API_BASE_URL}/admin/payment-providers/banks/${id}/`,
    MOBILE_PROVIDERS: `${API_BASE_URL}/admin/payment-providers/mobile/`,
    MOBILE_PROVIDER_DETAIL: (id: string) => `${API_BASE_URL}/admin/payment-providers/mobile/${id}/`,
    PUBLIC_BANKS: `${API_BASE_URL}/admin/providers/banks/`,
    PUBLIC_MOBILE_PROVIDERS: `${API_BASE_URL}/admin/providers/mobile/`,
  },
} as const;

// API Helper Functions

// Attempts to refresh the access token. Returns new access token on success, throws on failure.
const refreshAccessToken = async (): Promise<string> => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token');

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw new Error('Authentication required');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  // SimpleJWT with ROTATE_REFRESH_TOKENS issues a new refresh token too
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data.access;
};

export const apiRequest = async (url: string, options: RequestInit = {}, _retry = true): Promise<any> => {
  const token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      // On 401, attempt one token refresh then retry
      if (response.status === 401 && _retry) {
        try {
          await refreshAccessToken();
          return apiRequest(url, options, false);
        } catch {
          throw new Error('Authentication required');
        }
      }

      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (response.status >= 500) {
        console.error(`API ${response.status} error on ${url}`);
        console.error('Request options:', options);
        console.error('Response data:', errorData);
      }

      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.field_errors && typeof errorData.field_errors === 'object') {
          const fieldErrors: Record<string, string> = {};
          Object.keys(errorData.field_errors).forEach(key => {
            const value = (errorData.field_errors as any)[key];
            fieldErrors[key] = Array.isArray(value) ? value.join(' ') : String(value);
          });
          if (Object.keys(fieldErrors).length > 0) throw new Error(JSON.stringify(fieldErrors));
        }

        const directFieldErrors: Record<string, string> = {};
        Object.keys(errorData).forEach(key => {
          if (key !== 'detail' && key !== 'status_code' && key !== 'error' && key !== 'code' && key !== 'messages') {
            const value = (errorData as any)[key];
            if (Array.isArray(value)) directFieldErrors[key] = value.join(' ');
            else if (typeof value === 'string') directFieldErrors[key] = value;
          }
        });
        if (Object.keys(directFieldErrors).length > 0) throw new Error(JSON.stringify(directFieldErrors));
      }

      throw new Error(errorData.detail || errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    // 204 No Content and other empty-body responses (e.g. DELETE success)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw error;
  }
};

export const apiGet = (url: string) => apiRequest(url, { method: 'GET' });

// Multipart upload — browser sets Content-Type boundary automatically
export const apiUpload = async (url: string, method: 'POST' | 'PATCH', formData: FormData, _retry = true): Promise<any> => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { method, headers, body: formData });

  if (!response.ok) {
    // On 401, attempt one token refresh then retry
    if (response.status === 401 && _retry) {
      try {
        await refreshAccessToken();
        return apiUpload(url, method, formData, false);
      } catch {
        throw new Error('Authentication required');
      }
    }

    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.error || err.message || `HTTP ${response.status}`);
  }

  return response.json();
};
export const apiPost = (url: string, data?: any) => apiRequest(url, { 
  method: 'POST', 
  body: data ? JSON.stringify(data) : undefined 
});
export const apiPut = (url: string, data?: any) => apiRequest(url, { 
  method: 'PUT', 
  body: data ? JSON.stringify(data) : undefined 
});
export const apiPatch = (url: string, data?: any) => apiRequest(url, { 
  method: 'PATCH', 
  body: data ? JSON.stringify(data) : undefined 
});
export const apiDelete = (url: string) => apiRequest(url, { method: 'DELETE' });
