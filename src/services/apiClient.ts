/**
 * Enterprise API Client for SRI SAI VASUDEV RESIDENCY (Cloudflare Pages Frontend)
 * Implements:
 * 1. Automatic UUIDv4 X-Idempotency-Key injection on all POST/PUT/PATCH/DELETE mutations (#1)
 * 2. Silent JWT refresh token rotation with mutex queue on 401 Unauthorized (#47)
 * 3. Optimistic Locking conflict interception (409 Conflict) alerting staff & triggering view refresh (#25)
 * 4. Decentro Circuit Breaker fallback detection (decentro_unavailable: true) triggering smooth manual POS switch (#13)
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api/v1';
    }
  }
  const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  return raw.replace(/\/$/, '');
};
export const API_BASE_URL = getApiBaseUrl();

// Storage keys
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'svr_access_token',
  REFRESH_TOKEN: 'svr_refresh_token',
  USER_ROLE: 'svr_user_role',
  USER_INFO: 'svr_user_info'
};

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipIdempotency?: boolean;
  idempotencyKey?: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  decentro_unavailable?: boolean;
  status_code?: number;
  [key: string]: any;
}

// Generate secure UUIDv4
export function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Global Mutex for Refresh Token Rotation (#47)
let refreshPromise: Promise<string | null> | null = null;

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  getUserRole(): string {
    if (typeof window === 'undefined') return 'RECEPTIONIST';
    return localStorage.getItem(AUTH_KEYS.USER_ROLE) || 'RECEPTIONIST';
  },

  getUserInfo(): any {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_KEYS.USER_INFO);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken?: string, role?: string, user?: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    }
    if (role) {
      localStorage.setItem(AUTH_KEYS.USER_ROLE, role);
    }
    if (user) {
      localStorage.setItem(AUTH_KEYS.USER_INFO, JSON.stringify(user));
    }
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER_ROLE);
    localStorage.removeItem(AUTH_KEYS.USER_INFO);
  }
};

/**
 * Executes a silent refresh token rotation to obtain a fresh access token (#47).
 * Deduplicates concurrent requests using a singleton Promise.
 */
async function performTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    authStorage.clearTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('svr:session_expired', { detail: { reason: 'NO_REFRESH_TOKEN' } }));
    }
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': generateUUIDv4()
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error(`Token refresh rejected with HTTP ${response.status}`);
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      if (newAccessToken) {
        authStorage.setTokens(newAccessToken, newRefreshToken, data.role);
        return newAccessToken;
      }
      return null;
    } catch (err) {
      console.warn('[ApiClient] Silent JWT refresh token rotation failed:', err);
      authStorage.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('svr:session_expired', { detail: { error: String(err) } }));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core Request Dispatcher with Idempotency, JWT Refresh, Optimistic Locking, and Circuit Breaker Interceptors
 */
export async function apiRequest<T = any>(
  endpointOrUrl: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = endpointOrUrl.startsWith('http://') || endpointOrUrl.startsWith('https://')
    ? endpointOrUrl
    : `${API_BASE_URL}${endpointOrUrl.startsWith('/') ? endpointOrUrl : `/${endpointOrUrl}`}`;

  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // 1. Automatic UUIDv4 X-Idempotency-Key Header on all POST/PUT/PATCH/DELETE mutations (#1)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !options.skipIdempotency) {
    if (!headers.has('X-Idempotency-Key')) {
      const key = options.idempotencyKey || generateUUIDv4();
      headers.set('X-Idempotency-Key', key);
    }
  }

  // Set default JSON Content-Type if payload exists and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT Bearer Token if available
  if (!options.skipAuth) {
    const token = authStorage.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Execute Initial Request
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      method,
      headers
    });
  } catch (networkError: any) {
    // Check if network error is offline related
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      console.warn('[ApiClient] Offline detected during request to:', url);
    }
    throw networkError;
  }

  // 2. Handle Silent JWT Refresh Token Rotation on 401 Unauthorized (#47)
  if (response.status === 401 && !options.skipAuth) {
    console.info('[ApiClient] 401 Unauthorized detected. Attempting silent token rotation...');
    const newAccessToken = await performTokenRefresh();

    if (newAccessToken) {
      // Retry original request with newly rotated token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      // Regenerate idempotency key for retry if necessary
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !options.skipIdempotency) {
        headers.set('X-Idempotency-Key', generateUUIDv4());
      }

      response = await fetch(url, {
        ...options,
        method,
        headers
      });
    }
  }

  // Parse JSON response body safely
  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    } catch {
      responseData = null;
    }
  }

  // 3. Handle 409 Conflict Responses (Optimistic Locking #25)
  if (response.status === 409) {
    const errorMsg = responseData?.detail || responseData?.message || 'Another staff member updated this record.';
    console.warn('[ApiClient] 409 Conflict (Optimistic Lock violation):', errorMsg);

    if (typeof window !== 'undefined') {
      // Alert the receptionist and notify PMS views to refresh state
      window.dispatchEvent(
        new CustomEvent('svr:conflict_detected', {
          detail: {
            endpoint: url,
            message: errorMsg,
            timestamp: new Date().toISOString()
          }
        })
      );
      window.dispatchEvent(
        new CustomEvent('svr:refresh_view', {
          detail: {
            reason: 'OPTIMISTIC_LOCK_CONFLICT',
            endpoint: url
          }
        })
      );
    }

    const error = new Error(`Optimistic Concurrency Conflict: ${errorMsg}`);
    (error as any).status = 409;
    (error as any).data = responseData;
    throw error;
  }

  // 4. Handle Decentro Circuit Breaker Fallback Flags (decentro_unavailable: true) (#13)
  if (
    responseData?.decentro_unavailable === true ||
    responseData?.fallback_mode === 'MANUAL_CASH_CARD_POS' ||
    (response.status === 503 && responseData?.service === 'decentro')
  ) {
    console.warn('[ApiClient] Decentro Circuit Breaker tripped / unavailable flag detected:', responseData);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('svr:decentro_circuit_tripped', {
          detail: {
            message: responseData?.message || 'Decentro banking gateway temporarily unavailable.',
            fallbackMode: 'MANUAL_CASH_CARD_POS',
            data: responseData
          }
        })
      );
    }
  }

  // If HTTP error (other than handled 401/409), throw descriptive error
  if (!response.ok) {
    const errorDetail = responseData?.detail || responseData?.message || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorDetail);
    (err as any).status = response.status;
    (err as any).data = responseData;
    throw err;
  }

  return responseData as T;
}

/**
 * Convenient API Client Object
 */
export const apiClient = {
  get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  put<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  patch<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Drop-in fetch wrapper
  fetch: apiRequest,

  // Token and Persona management
  auth: authStorage,
  generateUUID: generateUUIDv4
};
