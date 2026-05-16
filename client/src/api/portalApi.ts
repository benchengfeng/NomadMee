import {
  clearAdminToken,
  clearInvestorToken,
  getAdminToken,
  getInvestorToken,
} from '../utils/auth';

const API_BASE = process.env['REACT_APP_API_URL'] || 'http://localhost:8000/api/portal';

type ApiMessage = { message?: string };

export type Cargo = {
  _id: string;
  productBeingShipped: string;
  quantity: number;
  purchaseLocation: string;
  purchasePrice: number;
  shippingDestination: string;
  shippingPrice: number;
  otherExpenses: number;
  estimatedTimeOfArrival: string;
  estimatedTimeOfSelling: string;
  assignedInvestorIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type InvestorRecord = {
  _id: string;
  name: string;
  username: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  estimatedROI: number;
  assignedCargoIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboardResponse = {
  cargos: Cargo[];
  investors: InvestorRecord[];
};

export type InvestorHomeResponse = {
  investor: {
    name: string;
    username: string;
    investmentAmount: number;
    profitPercentageOnInvestment: number;
    estimatedROI: number;
  };
  cargos: Cargo[];
};

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ApiMessage;

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  return parseJsonOrThrow<T>(response);
}

export async function loginAdmin(username: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutAdmin(): Promise<void> {
  await request('/admin/logout', { method: 'POST' }, getAdminToken());
  clearAdminToken();
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return request<AdminDashboardResponse>('/admin/dashboard', { method: 'GET' }, getAdminToken());
}

export async function createCargo(payload: Omit<Cargo, '_id' | 'assignedInvestorIds' | 'createdAt' | 'updatedAt'>): Promise<Cargo> {
  const response = await request<{ cargo: Cargo }>('/admin/cargos', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.cargo;
}

export async function createInvestor(payload: {
  name: string;
  username: string;
  password: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  cargoIds: string[];
}): Promise<InvestorRecord> {
  const response = await request<{ investor: InvestorRecord }>('/admin/investors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.investor;
}

export async function loginInvestor(username: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/investor/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutInvestor(): Promise<void> {
  await request('/investor/logout', { method: 'POST' }, getInvestorToken());
  clearInvestorToken();
}

export async function getInvestorHome(): Promise<InvestorHomeResponse> {
  return request<InvestorHomeResponse>('/investor/home', { method: 'GET' }, getInvestorToken());
}
