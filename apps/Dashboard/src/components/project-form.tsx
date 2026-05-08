import { useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '@/lib/api';

const CATEGORIES = ['website', 'cli', 'api', 'library', 'tool', 'other'] as const;

type FormData = Omit<Project, 'id' | 'created_at'>;

export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Project;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'other',
    tags: initial?.tags ?? [],
    url: initial?.url ?? null,
    repo_url: initial?.repo_url ?? null,
    featured: initial?.featured ?? false,
  });
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(', ') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...form, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{initial ? 'Edit Project' : 'New Project'}</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Title">
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>

          <Field label="Description">
            <textarea className={`${input} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Project['category'] })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tags (comma-separated)">
              <input className={input} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, TypeScript" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Live URL">
              <input className={input} value={form.url ?? ''} onChange={(e) => setForm({ ...form, url: e.target.value || null })} placeholder="https://…" />
            </Field>
            <Field label="Repo URL">
              <input className={input} value={form.repo_url ?? ''} onChange={(e) => setForm({ ...form, repo_url: e.target.value || null })} placeholder="https://github.com/…" />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="rounded border-border accent-primary"
            />
            <span>Featured on homepage</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-border">
          <button type="button" onClick={onCancel} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={isPending} className={primaryBtn}>
            {isPending ? 'Saving…' : 'Save Project'}
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

const input = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors';
const primaryBtn = 'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 disabled:opacity-50 transition-opacity';
const ghostBtn = 'rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
