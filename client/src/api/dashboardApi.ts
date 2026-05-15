import { clearSessionToken, getSessionToken } from '../utils/auth';

const API_BASE = process.env['REACT_APP_API_URL'] || 'http://localhost:8000/api/dashboard';

type LoginResponse = {
  token: string;
  user: {
    firstName: string;
    lastName: string;
  };
};

export type DashboardResponse = {
  investor: {
    firstName: string;
    lastName: string;
    initialInvestment: number;
    currency: 'YUAN' | 'TND' | 'EURO';
    projectedProfit: number;
    projectedPayout: number;
    expectedProfitRate: number;
  };
  cargo: {
    info: {
      shipmentId: string;
      containerId: string;
      vesselName: string;
      origin: string;
      destination: string;
      estimatedArrivalInDays: number;
      status: string;
    };
    location: {
      currentLabel: string;
      nextLabel: string;
      lat: number;
      lng: number;
      progressPercent: number;
    };
  };
};

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export async function loginInvestor(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  return parseJsonOrThrow<LoginResponse>(response);
}

export async function getDashboardHome(): Promise<DashboardResponse> {
  const token = getSessionToken();

  const response = await fetch(`${API_BASE}/home`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  if (response.status === 401) {
    clearSessionToken();
  }

  return parseJsonOrThrow<DashboardResponse>(response);
}

export async function logoutInvestor(): Promise<void> {
  const token = getSessionToken();

  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  clearSessionToken();
}
