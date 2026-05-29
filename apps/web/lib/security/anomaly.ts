/**
 * lib/security/anomaly.ts
 * ---------------------------------------------------------------------------
 * Signal-based anomaly detection helpers.
 * Used by auth and admin routes to detect brute-force and privilege abuse.
 * ---------------------------------------------------------------------------
 */

export interface AuthSignal {
  key: string;
  attemptsInWindow: number;
  failedRatio: number;
}

/**
 * Return true if the auth signal looks like a brute-force or credential-stuffing attack.
 */
export function isSuspiciousAuthSignal(signal: AuthSignal): boolean {
  if (signal.attemptsInWindow >= 20) return true;
  if (signal.attemptsInWindow >= 10 && signal.failedRatio >= 0.7) return true;
  return false;
}

export interface AdminSignal {
  roleChangesInHour: number;
  permissionChangesInHour: number;
}

/**
 * Return true if admin activity looks anomalous (bulk role/permission changes).
 */
export function isSuspiciousAdminSignal(signal: AdminSignal): boolean {
  if (signal.roleChangesInHour >= 20) return true;
  if (signal.permissionChangesInHour >= 50) return true;
  return false;
}
