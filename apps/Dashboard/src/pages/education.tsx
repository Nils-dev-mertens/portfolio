import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { educationQuery, useDeleteEducation, useCreateEducation, useUpdateEducation } from '@/lib/queries';
import type { Education } from '@/lib/api';

export function EducationPage() {
  const { data: education } = useSuspenseQuery(educationQuery());
  const deleteEd = useDeleteEducation();
  const createEd = useCreateEducation();
  const updateEd = useUpdateEducation();
  const [editing, setEditing] = useState<Education | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">Education</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/85 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Entry
        </button>
      </div>

      <div className="space-y-2">
        {education.map((ed) => (
          <div key={ed.id} className="group flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{ed.program}</p>
              <p className="text-sm text-muted-foreground">{ed.institution}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ed.start_date} — {ed.end_date ?? 'Present'}
              </p>
              {ed.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{ed.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(ed)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteEd.mutate(ed.id)} disabled={deleteEd.isPending} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <EducationForm
          initial={editing ?? undefined}
          onSubmit={(data) => {
            if (editing) updateEd.mutate({ id: editing.id, ...data });
            else createEd.mutate(data as Parameters<typeof createEd.mutate>[0]);
            setEditing(null); setCreating(false);
          }}
          onCancel={() => { setEditing(null); setCreating(false); }}
          isPending={createEd.isPending || updateEd.isPending}
        />
      )}
    </div>
  );
}

function EducationForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Education;
  onSubmit: (data: Omit<Education, 'id'>) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState({
    institution: initial?.institution ?? '',
    program: initial?.program ?? '',
    description: initial?.description ?? '',
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      institution: form.institution, program: form.program,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{initial ? 'Edit Education' : 'New Education'}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Institution"><input className={inp} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} required /></Field>
          <Field label="Program / Degree"><input className={inp} value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} required /></Field>
          <Field label="Description"><textarea className={`${inp} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><input className={inp} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required placeholder="2020-09" /></Field>
            <Field label="End date"><input className={inp} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} placeholder="2024-06" /></Field>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onCancel} className={ghost}>Cancel</button>
            <button type="submit" disabled={isPending} className={primary}>{isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
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

const inp = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors';
const primary = 'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 disabled:opacity-50 transition-opacity';
const ghost = 'rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
