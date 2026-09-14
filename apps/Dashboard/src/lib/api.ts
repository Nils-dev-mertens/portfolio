const BASE = '';

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

export type ArticleStatus = 'draft' | 'published';
export type BodyLang = 'nl' | 'en';

export type Article = {
  id: string;
  slug: string;
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  project_id: string | null;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  /** Whether a body file exists for this article, in either language. */
  has_body: boolean;
};

/** The markdown body of one language, as returned by the API. */
export type ArticleBody = {
  lang: BodyLang;
  body: string;
};

/** An uploaded image, with the URL to reference it by in markdown. */
export type ArticleImage = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  byte_size: number;
};

/** Only the metadata is editable here — the body is a file in the repo. */
export type ArticleInput = {
  title: string;
  summary?: string;
  slug?: string;
  project_id?: string | null;
  status?: ArticleStatus;
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

export type SkillItem = {
  id: string;
  name: string;
  sort_order: number;
};

export type SkillCategory = {
  id: string;
  label: string;
  label_en: string;
  sort_order: number;
  skills: SkillItem[];
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

// ── Articles ─────────────────────────────────────────────────────────────────

export const articlesApi = {
  list: (params?: { project_id?: string; status?: ArticleStatus; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    return request<Article[]>(`/api/articles?${q}`);
  },
  get: (id: string) => request<Article>(`/api/articles/${id}`),
  create: (body: ArticleInput) =>
    request<Article>('/api/articles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<ArticleInput>) =>
    request<Article>(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/articles/${id}`, { method: 'DELETE' }),
  // The body is a column on the article, edited per language.
  getBody: (id: string, lang: BodyLang = 'nl') =>
    request<ArticleBody>(`/api/articles/${id}/body?lang=${lang}`),
  saveBody: (id: string, lang: BodyLang, body: string) =>
    request<{ lang: BodyLang; body: string; bytes: number }>(
      `/api/articles/${id}/body?lang=${lang}`,
      { method: 'PUT', body: JSON.stringify({ body }) },
    ),
  preview: (body: string) =>
    request<{ html: string }>('/api/articles/preview', {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  // Uploads need their own fetch: the shared helper sets a JSON content type,
  // which would break the multipart boundary.
  uploadImage: async (articleId: string, file: File): Promise<ArticleImage> => {
    const form = new FormData();
    form.append('file', file);

    const token = auth.getToken();
    const res = await fetch(`/api/articles/${articleId}/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
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
    return res.json() as Promise<ArticleImage>;
  },
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

// ── Skills ────────────────────────────────────────────────────────────────────

// Every mutation returns the full, updated list of categories.
export const skillsApi = {
  list: () => request<SkillCategory[]>('/api/skills'),
  createCategory: (body: { label: string; label_en?: string; sort_order?: number }) =>
    request<SkillCategory[]>('/api/skills/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCategory: (
    id: string,
    body: Partial<{ label: string; label_en: string; sort_order: number }>
  ) =>
    request<SkillCategory[]>(`/api/skills/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request<SkillCategory[]>(`/api/skills/categories/${id}`, { method: 'DELETE' }),
  createItem: (body: { category_id: string; name: string }) =>
    request<SkillCategory[]>('/api/skills/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: string, body: Partial<{ name: string; sort_order: number }>) =>
    request<SkillCategory[]>(`/api/skills/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteItem: (id: string) =>
    request<SkillCategory[]>(`/api/skills/items/${id}`, { method: 'DELETE' }),
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
