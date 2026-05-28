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
  currency: string;
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
  currency: string;
  assignedCargoIds: string[];
  assignedInvestmentIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Investment = {
  _id: string;
  title: string;
  description: string;
  currency: string;
  minimumInvestment: number;
  cargoIds: string[];
  assignedInvestorIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboardResponse = {
  cargos: Cargo[];
  investors: InvestorRecord[];
  investments: Investment[];
};

export type InvestorProfile = {
  name: string;
  displayName: string;
  username: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  estimatedROI: number;
  currency: string;
  avatar?: string;
  kycCompleted: boolean;
};

export type InvestorHomeResponse = {
  investor: InvestorProfile;
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
  currency: string;
  investmentIds: string[];
}): Promise<InvestorRecord> {
  const response = await request<{ investor: InvestorRecord }>('/admin/investors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.investor;
}

export async function updateInvestor(id: string, payload: {
  name: string;
  username: string;
  password: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  currency: string;
  investmentIds: string[];
}): Promise<InvestorRecord> {
  const response = await request<{ investor: InvestorRecord }>(`/admin/investors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.investor;
}

export async function deleteInvestor(id: string): Promise<void> {
  await request<{ message: string }>(`/admin/investors/${id}`, {
    method: 'DELETE',
  }, getAdminToken());
}

export async function createInvestment(payload: {
  title: string;
  description: string;
  currency: string;
  minimumInvestment: number;
  cargoIds: string[];
}): Promise<Investment> {
  const response = await request<{ investment: Investment }>('/admin/investments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.investment;
}

export async function updateInvestment(id: string, payload: {
  title: string;
  description: string;
  currency: string;
  minimumInvestment: number;
  cargoIds: string[];
}): Promise<Investment> {
  const response = await request<{ investment: Investment }>(`/admin/investments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, getAdminToken());

  return response.investment;
}

export async function deleteInvestment(id: string): Promise<void> {
  await request<{ message: string }>(`/admin/investments/${id}`, {
    method: 'DELETE',
  }, getAdminToken());
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

export async function completeInvestorKyc(payload: { avatar: string; displayName: string }): Promise<InvestorProfile> {
  const response = await request<{ investor: InvestorProfile }>('/investor/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getInvestorToken());

  return response.investor;
}
