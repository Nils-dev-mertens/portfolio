import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import {
  skillsQuery,
  useCreateSkillCategory,
  useUpdateSkillCategory,
  useDeleteSkillCategory,
  useCreateSkillItem,
  useUpdateSkillItem,
  useDeleteSkillItem,
} from '@/lib/queries';
import type { SkillCategory, SkillItem } from '@/lib/api';

export function SkillsPage() {
  const { data: categories } = useSuspenseQuery(skillsQuery());
  const createCategory = useCreateSkillCategory();

  const [newLabel, setNewLabel] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    createCategory.mutate(
      { label, label_en: newLabelEn.trim() },
      {
        onSuccess: () => {
          setNewLabel('');
          setNewLabelEn('');
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Content</p>
        <h1 className="text-2xl font-semibold">Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each category becomes a card in the About page grid and in the homepage preview. The
          English label falls back to the Dutch one when it is left empty.
        </p>
      </div>

      <form onSubmit={addCategory} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          New category
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Label (NL)">
            <input
              className={inp}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="bv. Talen"
            />
          </Field>
          <Field label="Label (EN)">
            <input
              className={inp}
              value={newLabelEn}
              onChange={(e) => setNewLabelEn(e.target.value)}
              placeholder="e.g. Languages"
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={createCategory.isPending || !newLabel.trim()}
          className={`${primary} flex items-center gap-2`}
        >
          <Plus className="h-3.5 w-3.5" />
          {createCategory.isPending ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories yet. The website hides the skills section while it is empty.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: SkillCategory }) {
  const update = useUpdateSkillCategory();
  const remove = useDeleteSkillCategory();
  const createItem = useCreateSkillItem();

  const [label, setLabel] = useState(category.label);
  const [labelEn, setLabelEn] = useState(category.label_en);
  const [order, setOrder] = useState(String(category.sort_order));
  const [newSkill, setNewSkill] = useState('');

  const parsedOrder = Number(order);
  const dirty =
    label.trim() !== category.label ||
    labelEn.trim() !== category.label_en ||
    (!Number.isNaN(parsedOrder) && parsedOrder !== category.sort_order);

  function save() {
    update.mutate({
      id: category.id,
      label: label.trim() || category.label,
      label_en: labelEn.trim(),
      ...(Number.isNaN(parsedOrder) ? {} : { sort_order: parsedOrder }),
    });
  }

  function addSkill(e: React.FormEvent) {
    e.preventDefault();
    const name = newSkill.trim();
    if (!name) return;
    createItem.mutate({ category_id: category.id, name }, { onSuccess: () => setNewSkill('') });
  }

  function deleteCategory() {
    if (
      window.confirm(
        `Delete "${category.label}" and its ${category.skills.length} skill(s)? This cannot be undone.`
      )
    ) {
      remove.mutate(category.id);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_5rem] gap-3">
          <Field label="Label (NL)">
            <input className={inp} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Label (EN)">
            <input className={inp} value={labelEn} onChange={(e) => setLabelEn(e.target.value)} />
          </Field>
          <Field label="Order">
            <input
              type="number"
              className={inp}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-mono text-[11px] text-muted-foreground">{category.id}</span>
          <div className="flex gap-2">
            <button onClick={deleteCategory} disabled={remove.isPending} className={dangerGhost}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button onClick={save} disabled={!dirty || update.isPending} className={primary}>
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <ul className="px-5 py-4 space-y-2 flex-1">
        {category.skills.map((skill) => (
          <SkillRow key={skill.id} skill={skill} />
        ))}
        {category.skills.length === 0 && (
          <li className="text-sm text-muted-foreground">No skills in this category yet.</li>
        )}
      </ul>

      <form onSubmit={addSkill} className="flex gap-2 px-5 py-3 border-t border-border">
        <input
          className={inp}
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill, e.g. TypeScript"
        />
        <button
          type="submit"
          disabled={!newSkill.trim() || createItem.isPending}
          className={`${primary} shrink-0`}
        >
          Add
        </button>
      </form>
    </div>
  );
}

function SkillRow({ skill }: { skill: SkillItem }) {
  const update = useUpdateSkillItem();
  const remove = useDeleteSkillItem();
  const [name, setName] = useState(skill.name);

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(skill.name);
      return;
    }
    if (trimmed !== skill.name) update.mutate({ id: skill.id, name: trimmed });
  }

  return (
    <li className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setName(skill.name);
            e.currentTarget.blur();
          }
        }}
        className={`${inp} py-1.5`}
      />
      <button
        onClick={() => remove.mutate(skill.id)}
        disabled={remove.isPending}
        aria-label={`Delete ${skill.name}`}
        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inp =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors';
const primary =
  'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 disabled:opacity-50 transition-opacity';
const dangerGhost =
  'flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50';
