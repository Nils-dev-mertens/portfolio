import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { workQuery, useDeleteWork, useCreateWork, useUpdateWork } from '@/lib/queries';
import type { WorkExperience } from '@/lib/api';

export function WorkPage() {
  const { data: work } = useSuspenseQuery(workQuery());
  const deleteWork = useDeleteWork();
  const createWork = useCreateWork();
  const updateWork = useUpdateWork();
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">Work Experience</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/85 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Entry
        </button>
      </div>

      <div className="space-y-2">
        {work.map((w) => (
          <div key={w.id} className="group flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{w.role}</span>
                <span className="text-muted-foreground">@</span>
                <span className="text-foreground">{w.company}</span>
                {w.current && (
                  <span className="font-mono text-[11px] text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {w.start_date} — {w.current ? 'Present' : (w.end_date ?? '?')}
              </p>
              {w.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{w.description}</p>}
              {w.tags.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {w.tags.map((t) => (
                    <span key={t} className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(w)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteWork.mutate(w.id)} disabled={deleteWork.isPending} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <WorkForm
          initial={editing ?? undefined}
          onSubmit={(data) => {
            if (editing) updateWork.mutate({ id: editing.id, ...data });
            else createWork.mutate(data as Parameters<typeof createWork.mutate>[0]);
            setEditing(null); setCreating(false);
          }}
          onCancel={() => { setEditing(null); setCreating(false); }}
          isPending={createWork.isPending || updateWork.isPending}
        />
      )}
    </div>
  );
}

function WorkForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: WorkExperience;
  onSubmit: (data: Omit<WorkExperience, 'id'>) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    description: initial?.description ?? '',
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    current: initial?.current ?? false,
    tags: initial?.tags.join(', ') ?? '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      company: form.company, role: form.role,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.current ? null : (form.end_date || null),
      current: form.current,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  }

  return (
    <Modal title={initial ? 'Edit Work Experience' : 'New Work Experience'} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company"><input className={inp} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required /></Field>
          <Field label="Role"><input className={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></Field>
        </div>
        <Field label="Description"><textarea className={`${inp} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date"><input className={inp} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required placeholder="2023-01" /></Field>
          <Field label="End date"><input className={inp} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.current} placeholder="2024-06" /></Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked })} className="rounded border-border accent-primary" />
          Currently working here
        </label>
        <Field label="Tags (comma-separated)"><input className={inp} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, Node.js" /></Field>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button type="button" onClick={onCancel} className={ghost}>Cancel</button>
          <button type="submit" disabled={isPending} className={primary}>{isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        {children}
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

const inp = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors disabled:opacity-40';
const primary = 'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 disabled:opacity-50 transition-opacity';
const ghost = 'rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
