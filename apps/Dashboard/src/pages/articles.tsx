import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, FileText, PenLine } from 'lucide-react';
import {
  articlesQuery,
  projectsQuery,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/lib/queries';
import type { Article } from '@/lib/api';
import { ArticleForm } from '@/components/article-form';
import { ArticleBodyEditor } from '@/components/article-body-editor';

export function ArticlesPage() {
  const { data: articles } = useSuspenseQuery(articlesQuery());
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [writing, setWriting] = useState<Article | null>(null);

  const projectTitles = new Map(projects.map((project) => [project.id, project.title]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">Articles</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/85 transition-opacity shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Article</span>
        </button>
      </div>

      {articles.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          No articles yet. Create one here, then write its body as markdown or MDX in the repository.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-sm truncate">{article.title}</span>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(article)}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteArticle.mutate(article.id)}
                  disabled={deleteArticle.isPending}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              {article.summary || 'No summary yet.'}
            </p>

            <button
              onClick={() => setWriting(article)}
              className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <PenLine className="h-3.5 w-3.5" />
              {article.has_body ? 'Edit body' : 'Write body'}
            </button>

            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className={
                    article.status === 'published'
                      ? 'font-mono text-[11px] text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5'
                      : 'font-mono text-[11px] text-muted-foreground bg-white/5 border border-border rounded px-1.5 py-0.5'
                  }
                >
                  {article.status}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground truncate">/{article.slug}</span>
              </div>
              {article.project_id && (
                <span className="text-[11px] text-pink uppercase tracking-widest truncate shrink-0">
                  {projectTitles.get(article.project_id) ?? article.project_id}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {writing && <ArticleBodyEditor article={writing} onClose={() => setWriting(null)} />}

      {(creating || editing) && (
        <ArticleForm
          initial={editing ?? undefined}
          projects={projects}
          onSubmit={(data) => {
            // An empty slug means "derive it from the title" — the API does that.
            const payload = { ...data, slug: data.slug.trim() || undefined };

            if (editing) {
              updateArticle.mutate({ id: editing.id, ...payload });
              setEditing(null);
              setCreating(false);
              return;
            }

            // A new article has no text yet, so go straight to the editor.
            createArticle
              .mutateAsync(payload)
              .then((created) => {
                setCreating(false);
                setWriting(created);
              })
              .catch(() => setCreating(false));
          }}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          isPending={createArticle.isPending || updateArticle.isPending}
        />
      )}
    </div>
  );
}
