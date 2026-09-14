import { useState } from 'react';
import { X } from 'lucide-react';
import type { Article, ArticleStatus, Project } from '@/lib/api';

type FormData = {
  title: string;
  summary: string;
  slug: string;
  project_id: string | null;
  status: ArticleStatus;
};

/** Mirrors `slugify` in @portfolio/data so the body path below is accurate. */
function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function ArticleForm({
  initial,
  projects,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Article;
  projects: Project[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    slug: initial?.slug ?? '',
    project_id: initial?.project_id ?? null,
    status: initial?.status ?? 'draft',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{initial ? 'Edit Article' : 'New Article'}</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Title">
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Field>

          <Field label="Summary">
            <textarea
              className={`${input} resize-none`}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={3}
              placeholder="One or two sentences, shown on the article cards."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <select
                className={input}
                value={form.project_id ?? ''}
                onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={input}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </Field>
          </div>

          <Field label="Slug (URL)">
            <input
              className={input}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={slugify(form.title) || 'derived from the title'}
            />
          </Field>


          <div className="rounded-md border border-border bg-background px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">The text itself</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Write the article in <strong className="text-foreground">Write body</strong> on the
              article card: markdown with a live preview, stored with the article. An English
              version is generated from it when a DeepL key is configured.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-border">
          <button type="button" onClick={onCancel} className={ghostBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isPending} className={primaryBtn}>
            {isPending ? 'Saving…' : 'Save Article'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const input =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors';
const primaryBtn =
  'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 disabled:opacity-50 transition-opacity';
const ghostBtn =
  'rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
