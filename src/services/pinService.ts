/**
 * Manager & Supervisor PIN Gate Client Service.
 * Benchmarked directly from HeyPuter Reference Architecture (everything/src/pos/src/lib/pin.js & pin-gate.js).
 * 
 * Manages:
 * 1. 5-minute counter-height grace period (PIN_GRACE_MS = 300,000ms)
 * 2. Rate-limit lockout tracking in sessionStorage
 * 3. Token injection into Axios/Fetch headers (X-Manager-PIN-Token)
 */

export const PIN_GRACE_MS = 5 * 60 * 1000; // 5 minutes
const PIN_TOKEN_KEY = 'svr_manager_pin_token';
const PIN_EXPIRY_KEY = 'svr_manager_pin_expires_at';
const PIN_ATTEMPTS_KEY = 'svr_pin_attempt_state';

export interface PinVerifyResult {
  success: boolean;
  token?: string;
  expiresIn?: number;
  message?: string;
  lockedUntil?: number;
}

class PinService {
  private activeToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = sessionStorage.getItem(PIN_TOKEN_KEY);
      const storedExp = sessionStorage.getItem(PIN_EXPIRY_KEY);
      if (storedToken && storedExp) {
        const expTime = parseInt(storedExp, 10);
        if (expTime > Date.now()) {
          this.activeToken = storedToken;
          this.tokenExpiresAt = expTime;
        } else {
          this.clearGraceToken();
        }
      }
    } catch {
      // Storage unavailable fallback
    }
  }

  /**
   * Returns true if a valid supervisor PIN token is currently within its 5-minute grace period.
   */
  public isGraceActive(): boolean {
    if (!this.activeToken || this.tokenExpiresAt <= Date.now()) {
      this.clearGraceToken();
      return false;
    }
    return true;
  }

  /**
   * Returns the active PIN authorization token for attaching to request headers.
   */
  public getActiveToken(): string | null {
    return this.isGraceActive() ? this.activeToken : null;
  }

  /**
   * Clears the supervisor authorization grace token (e.g., on manual lock or logout).
   */
  public clearGraceToken(): void {
    this.activeToken = null;
    this.tokenExpiresAt = 0;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(PIN_TOKEN_KEY);
        sessionStorage.removeItem(PIN_EXPIRY_KEY);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Check local lockout state to avoid hitting server when locked.
   */
  public getLockoutRemainingSeconds(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = sessionStorage.getItem(PIN_ATTEMPTS_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      if (data.lockedUntil && data.lockedUntil > Date.now()) {
        return Math.ceil((data.lockedUntil - Date.now()) / 1000);
      }
    } catch {
      // Ignore
    }
    return 0;
  }

  /**
   * Verifies the 4-6 digit supervisor PIN against the backend API.
   */
  public async verifyPin(pin: string, action: string = 'SUPERVISOR_ACTION'): Promise<PinVerifyResult> {
    const lockSec = this.getLockoutRemainingSeconds();
    if (lockSec > 0) {
      return {
        success: false,
        message: `Too many failed attempts. Locked for ${lockSec} more seconds.`,
        lockedUntil: Date.now() + lockSec * 1000
      };
    }

    try {
      const response = await fetch('/api/v1/auth/manager-pin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin, action })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const lockUntil = Date.now() + 60 * 1000;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify({ lockedUntil: lockUntil }));
          }
          return {
            success: false,
            message: data.detail || 'PIN verification locked for 60 seconds.',
            lockedUntil: lockUntil
          };
        }
        return {
          success: false,
          message: data.detail || 'Incorrect Manager PIN.'
        };
      }

      // Successful verification
      const token = data.token;
      const expiresInSec = data.expires_in || 300;
      const expiresAt = Date.now() + expiresInSec * 1000;

      this.activeToken = token;
      this.tokenExpiresAt = expiresAt;

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(PIN_TOKEN_KEY, token);
          sessionStorage.setItem(PIN_EXPIRY_KEY, expiresAt.toString());
          sessionStorage.removeItem(PIN_ATTEMPTS_KEY);
        } catch {
          // Ignore
        }
      }

      return {
        success: true,
        token,
        expiresIn: expiresInSec,
        message: 'Supervisor PIN verified successfully.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error verifying supervisor PIN.'
      };
    }
  }
}

export const pinService = new PinService();
