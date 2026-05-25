export type AuthSignal = {
  key: string;
  attemptsInWindow: number;
  failedRatio: number;
};

export function isSuspiciousAuthSignal(signal: AuthSignal): boolean {
  if (signal.attemptsInWindow >= 20) return true;
  if (signal.attemptsInWindow >= 10 && signal.failedRatio >= 0.7) return true;
  return false;
}

export type AdminSignal = {
  roleChangesInHour: number;
  permissionChangesInHour: number;
};

export function isSuspiciousAdminSignal(signal: AdminSignal): boolean {
  if (signal.roleChangesInHour >= 20) return true;
  if (signal.permissionChangesInHour >= 50) return true;
  return false;
}
