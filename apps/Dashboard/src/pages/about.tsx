import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { aboutQuery, useUpdateAbout } from '@/lib/queries';
import type { About } from '@/lib/api';

export function AboutPage() {
  const { data: about } = useSuspenseQuery(aboutQuery());
  const updateAbout = useUpdateAbout();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AboutForm
        initial={about}
        onSave={(data) => { updateAbout.mutate({ id: about.id, ...data }); setEditing(false); }}
        onCancel={() => setEditing(false)}
        isPending={updateAbout.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">About</h1>
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3 border-b border-border">Identity</p>
          {([
            ['Location', about.location],
            ['Email', about.email],
            ['GitHub', about.github_url],
            ['Status', `${about.status_label} (${about.status_active ? 'active' : 'inactive'})`],
            ['Tagline', about.tagline],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex gap-4 px-5 py-2.5 border-b border-border last:border-0">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground w-20 shrink-0 pt-0.5">{label}</span>
              <span className="text-sm break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3 border-b border-border">Quote</p>
          <div className="px-5 py-4 space-y-1 border-b border-border">
            <p className="text-sm font-medium">"{about.quote}"</p>
            <p className="text-xs text-muted-foreground">{about.quote_sub}</p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3 border-b border-border">Status</p>
          <div className="px-5 py-2.5">
            <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${about.status_active ? 'text-primary bg-primary/10 border-primary/20' : 'text-muted-foreground bg-white/5 border-border'}`}>
              {about.status_active ? 'Active' : 'Inactive'} — {about.status_label}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3 border-b border-border">Bio — Landing</p>
          <ul className="px-5 py-4 space-y-2">
            {about.bio_landing.map((line, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary shrink-0">—</span> {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-5 py-3 border-b border-border">Bio — About page</p>
          <ul className="px-5 py-4 space-y-2">
            {about.bio_about.map((line, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary shrink-0">—</span> {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AboutForm({ initial, onSave, onCancel, isPending }: {
  initial: About;
  onSave: (data: Partial<Omit<About, 'id'>>) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState({
    location: initial.location, email: initial.email,
    github_url: initial.github_url, status_label: initial.status_label,
    status_active: initial.status_active, tagline: initial.tagline,
    quote: initial.quote, quote_sub: initial.quote_sub,
    bio_landing: initial.bio_landing.join('\n'),
    bio_about: initial.bio_about.join('\n'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      bio_landing: form.bio_landing.split('\n').map((s) => s.trim()).filter(Boolean),
      bio_about: form.bio_about.split('\n').map((s) => s.trim()).filter(Boolean),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
          <h1 className="text-2xl font-semibold">Edit About</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={ghost}>Cancel</button>
          <button type="submit" disabled={isPending} className={primary}>{isPending ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Identity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Location"><input className={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Email"><input className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="GitHub URL"><input className={inp} value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} /></Field>
            <Field label="Tagline"><input className={inp} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Status label"><input className={inp} value={form.status_label} onChange={(e) => setForm({ ...form, status_label: e.target.value })} /></Field>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.status_active} onChange={(e) => setForm({ ...form, status_active: e.target.checked })} className="rounded border-border accent-primary" />
                Status active
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quote</p>
          <Field label="Quote"><input className={inp} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></Field>
          <Field label="Quote sub"><input className={inp} value={form.quote_sub} onChange={(e) => setForm({ ...form, quote_sub: e.target.value })} /></Field>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Bio — Landing</p>
          <Field label="One paragraph per line">
            <textarea className={`${inp} resize-none`} value={form.bio_landing} onChange={(e) => setForm({ ...form, bio_landing: e.target.value })} rows={5} />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Bio — About page</p>
          <Field label="One paragraph per line">
            <textarea className={`${inp} resize-none`} value={form.bio_about} onChange={(e) => setForm({ ...form, bio_about: e.target.value })} rows={5} />
          </Field>
        </div>
      </div>
    </form>
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
