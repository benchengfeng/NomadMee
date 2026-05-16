const INVESTOR_TOKEN_KEY = 'nomadme_investor_token';
const ADMIN_TOKEN_KEY = 'nomadme_admin_token';

export function getSessionToken(): string | null {
  return localStorage.getItem(INVESTOR_TOKEN_KEY);
}

export function saveSessionToken(token: string): void {
  localStorage.setItem(INVESTOR_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(INVESTOR_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getInvestorToken(): string | null {
  return getSessionToken();
}

export function saveInvestorToken(token: string): void {
  saveSessionToken(token);
}

export function clearInvestorToken(): void {
  clearSessionToken();
}
