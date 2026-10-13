const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mrkcp_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  verifyEmail: (token: string) => request<any>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Contests
  getContests: (params?: { platform?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.platform) q.set('platform', params.platform);
    if (params?.search) q.set('search', params.search);
    return request<any>(`/contests?${q.toString()}`);
  },
  syncContests: () => request<any>('/contests/sync', { method: 'POST' }),

  // Reminders
  getReminderPreferences: () => request<any>('/reminders/preferences'),
  updateReminderPreference: (body: any) => request<any>('/reminders/preferences', { method: 'PUT', body: JSON.stringify(body) }),
  unsubscribeReminder: (token: string) => request<any>('/reminders/unsubscribe', { method: 'POST', body: JSON.stringify({ token }) }),

  // Platforms
  getSupportedPlatforms: () => request<any>('/platforms/supported'),
  startLinking: (platform: string, handle: string) => request<any>('/platforms/link/start', { method: 'POST', body: JSON.stringify({ platform, handle }) }),
  verifyHandle: (platform: string) => request<any>('/platforms/link/verify', { method: 'POST', body: JSON.stringify({ platform }) }),
  syncAccount: (platform: string) => request<any>('/platforms/sync', { method: 'POST', body: JSON.stringify({ platform }) }),
  syncAllAccounts: () => request<any>('/platforms/sync/all', { method: 'POST' }),

  // Journal
  getJournalEntries: (params?: any) => {
    const q = new URLSearchParams();
    if (params?.platform) q.set('platform', params.platform);
    if (params?.topic) q.set('topic', params.topic);
    if (params?.difficulty) q.set('difficulty', params.difficulty);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any>(`/journal?${q.toString()}`);
  },
  getJournalAnalytics: () => request<any>('/journal/analytics'),
  createManualEntry: (body: any) => request<any>('/journal', { method: 'POST', body: JSON.stringify(body) }),
  updateEntry: (id: string, body: any) => request<any>(`/journal/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEntry: (id: string) => request<any>(`/journal/${id}`, { method: 'DELETE' }),

  // Recommendations
  getTopics: () => request<any>('/recommendations/topics'),
  getRecommendations: (params?: any) => {
    const q = new URLSearchParams();
    if (params?.topic) q.set('topic', params.topic);
    if (params?.difficulty) q.set('difficulty', params.difficulty);
    if (params?.platform) q.set('platform', params.platform);
    if (params?.hideSolved !== undefined) q.set('hideSolved', String(params.hideSolved));
    return request<any>(`/recommendations?${q.toString()}`);
  },
  getLeetCodeSet: () => request<any>('/recommendations/leetcode'),

  // Dev Mailbox
  getDevEmails: () => request<any>('/dev/emails'),
  clearDevEmails: () => request<any>('/dev/emails', { method: 'DELETE' }),
  triggerRemindersCheck: () => request<any>('/dev/trigger-reminders', { method: 'POST' }),
};

export default api;
