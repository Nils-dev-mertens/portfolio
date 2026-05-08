import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, workApi, educationApi, aboutApi, githubApi } from './api';

// ── Query keys ────────────────────────────────────────────────────────────────

export const keys = {
  projects: {
    all: ['projects'] as const,
    list: (params?: object) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  work: {
    all: ['work'] as const,
    list: () => ['work', 'list'] as const,
    detail: (id: string) => ['work', 'detail', id] as const,
  },
  education: {
    all: ['education'] as const,
    list: () => ['education', 'list'] as const,
  },
  about: {
    all: ['about'] as const,
    detail: () => ['about', 'detail'] as const,
  },
  github: {
    all: ['github'] as const,
    list: (limit?: number) => ['github', 'list', limit] as const,
  },
};

// ── Query options ──────────────────────────────────────────────────────────────

export const projectsQuery = (params?: Parameters<typeof projectsApi.list>[0]) =>
  queryOptions({ queryKey: keys.projects.list(params), queryFn: () => projectsApi.list(params) });

export const projectQuery = (id: string) =>
  queryOptions({ queryKey: keys.projects.detail(id), queryFn: () => projectsApi.get(id) });

export const workQuery = () =>
  queryOptions({ queryKey: keys.work.list(), queryFn: () => workApi.list() });

export const workDetailQuery = (id: string) =>
  queryOptions({ queryKey: keys.work.detail(id), queryFn: () => workApi.get(id) });

export const educationQuery = () =>
  queryOptions({ queryKey: keys.education.list(), queryFn: () => educationApi.list() });

export const aboutQuery = () =>
  queryOptions({ queryKey: keys.about.detail(), queryFn: () => aboutApi.get() });

export const githubQuery = (limit?: number) =>
  queryOptions({ queryKey: keys.github.list(limit), queryFn: () => githubApi.list(limit) });

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects.all }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof projectsApi.update>[1] & { id: string }) =>
      projectsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects.all }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects.all }),
  });
}

export function useCreateWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.work.all }),
  });
}

export function useUpdateWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof workApi.update>[1] & { id: string }) =>
      workApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.work.all }),
  });
}

export function useDeleteWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.work.all }),
  });
}

export function useCreateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: educationApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.education.all }),
  });
}

export function useUpdateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof educationApi.update>[1] & { id: string }) =>
      educationApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.education.all }),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: educationApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.education.all }),
  });
}

export function useUpdateAbout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof aboutApi.update>[1] & { id: string }) =>
      aboutApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.about.all }),
  });
}

export function useDeleteGithubActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: githubApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.github.all }),
  });
}
