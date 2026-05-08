import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Star, ExternalLink, GitBranch } from 'lucide-react';
import { projectsQuery, useDeleteProject, useCreateProject, useUpdateProject } from '@/lib/queries';
import type { Project } from '@/lib/api';
import { ProjectForm } from '@/components/project-form';

export function ProjectsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const deleteProject = useDeleteProject();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">Projects</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/85 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/60 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{project.title}</span>
                {project.featured && (
                  <Star className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />
                )}
                <span className="font-mono text-[11px] text-pink bg-pink/10 border border-pink/20 rounded px-1.5 py-0.5">
                  {project.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {tag}
                  </span>
                ))}
                {project.url && (
                  <a href={project.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors ml-auto">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {project.repo_url && (
                  <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <GitBranch className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(project)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteProject.mutate(project.id)}
                disabled={deleteProject.isPending}
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <ProjectForm
          initial={editing ?? undefined}
          onSubmit={(data) => {
            if (editing) updateProject.mutate({ id: editing.id, ...data });
            else createProject.mutate(data as Parameters<typeof createProject.mutate>[0]);
            setEditing(null);
            setCreating(false);
          }}
          onCancel={() => { setEditing(null); setCreating(false); }}
          isPending={createProject.isPending || updateProject.isPending}
        />
      )}
    </div>
  );
}
