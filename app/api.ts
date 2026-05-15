const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(`${API_URL}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

const api = {
  getMe: () =>
    apiFetch('/auth/me').then(async (r) => {
      if (!r.ok) throw new Error('Not authenticated');
      return r.json();
    }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  getProfiles: () => apiFetch('/api/profiles').then((r) => r.json()),

  createProfile: (data: { name: string; avatar?: string; color?: string }) =>
    apiFetch('/api/profiles', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),

  inviteMember: (profileId: string, email: string) =>
    apiFetch(`/api/profiles/${profileId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }).then((r) => r.json()),

  getTransactions: (profileId: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/profiles/${profileId}/transactions${qs ? '?' + qs : ''}`).then((r) =>
      r.json()
    );
  },

  addTransaction: (profileId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  updateTransaction: (profileId: string, txId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/transactions/${txId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  deleteTransaction: (profileId: string, txId: string) =>
    apiFetch(`/api/profiles/${profileId}/transactions/${txId}`, { method: 'DELETE' }),

  getInvestments: (profileId: string) =>
    apiFetch(`/api/profiles/${profileId}/investments`).then((r) => r.json()),

  getInvestmentSummary: (profileId: string) =>
    apiFetch(`/api/profiles/${profileId}/investments/summary`).then((r) => r.json()),

  addInvestment: (profileId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/investments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  updateInvestment: (profileId: string, invId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/investments/${invId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  deleteInvestment: (profileId: string, invId: string) =>
    apiFetch(`/api/profiles/${profileId}/investments/${invId}`, { method: 'DELETE' }),

  getGoals: (profileId: string) =>
    apiFetch(`/api/profiles/${profileId}/goals`).then((r) => r.json()),

  createGoal: (profileId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  updateGoal: (profileId: string, goalId: string, data: unknown) =>
    apiFetch(`/api/profiles/${profileId}/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  deleteGoal: (profileId: string, goalId: string) =>
    apiFetch(`/api/profiles/${profileId}/goals/${goalId}`, { method: 'DELETE' }),

  getConsolidatedDashboard: (params?: { month?: string; year?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/dashboard/consolidated${qs}`).then(r => r.json());
  },

  getAIFinancialInsights: (transactions: unknown[]) =>
    apiFetch('/api/ai-insights', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    }).then((r) => r.json()),
};

export default api;
