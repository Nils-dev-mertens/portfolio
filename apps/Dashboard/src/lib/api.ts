const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const TOKEN_KEY = 'auth_token';
export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = auth.getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });
  if (res.status === 401) {
    auth.clearToken();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  title: string;
  description: string;
  category: 'website' | 'cli' | 'api' | 'library' | 'tool' | 'other';
  tags: string[];
  url: string | null;
  repo_url: string | null;
  featured: boolean;
  created_at: string;
};

export type WorkExperience = {
  id: string;
  company: string;
  role: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  current: boolean;
  tags: string[];
};

export type Education = {
  id: string;
  institution: string;
  program: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
};

export type About = {
  id: string;
  location: string;
  email: string;
  github_url: string;
  status_label: string;
  status_active: boolean;
  tagline: string;
  quote: string;
  quote_sub: string;
  bio_landing: string[];
  bio_about: string[];
};

export type GithubActivity = {
  id: string;
  type: string;
  repo: string;
  message: string | null;
  occurred_at: string;
};

// ── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (params?: { featured?: boolean; category?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.featured !== undefined) q.set('featured', String(params.featured));
    if (params?.category) q.set('category', params.category);
    if (params?.limit) q.set('limit', String(params.limit));
    return request<Project[]>(`/api/projects?${q}`);
  },
  get: (id: string) => request<Project>(`/api/projects/${id}`),
  create: (body: Omit<Project, 'id' | 'created_at'>) =>
    request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Omit<Project, 'id' | 'created_at'>>) =>
    request<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
};

// ── Work Experience ───────────────────────────────────────────────────────────

export const workApi = {
  list: () => request<WorkExperience[]>('/api/work'),
  get: (id: string) => request<WorkExperience>(`/api/work/${id}`),
  create: (body: Omit<WorkExperience, 'id'>) =>
    request<WorkExperience>('/api/work', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Omit<WorkExperience, 'id'>>) =>
    request<WorkExperience>(`/api/work/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/work/${id}`, { method: 'DELETE' }),
};

// ── Education ─────────────────────────────────────────────────────────────────

export const educationApi = {
  list: () => request<Education[]>('/api/education'),
  get: (id: string) => request<Education>(`/api/education/${id}`),
  create: (body: Omit<Education, 'id'>) =>
    request<Education>('/api/education', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Omit<Education, 'id'>>) =>
    request<Education>(`/api/education/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/education/${id}`, { method: 'DELETE' }),
};

// ── About ─────────────────────────────────────────────────────────────────────

export const aboutApi = {
  get: () => request<About>('/api/about'),
  update: (id: string, body: Partial<Omit<About, 'id'>>) =>
    request<About>(`/api/about/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ── GitHub Activity ───────────────────────────────────────────────────────────

export const githubApi = {
  list: (limit?: number) => {
    const q = limit ? `?limit=${limit}` : '';
    return request<GithubActivity[]>(`/api/github${q}`);
  },
  delete: (id: string) => request<{ success: boolean }>(`/api/github/${id}`, { method: 'DELETE' }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (password: string): Promise<{ token: string }> => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error((data as { error: string }).error ?? 'Login failed');
    return data as { token: string };
  },
};
