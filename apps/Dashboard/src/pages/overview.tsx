import { useSuspenseQuery } from '@tanstack/react-query';
import { FolderKanban, Star, GitCommit, GitBranch } from 'lucide-react';
import { projectsQuery, githubQuery } from '@/lib/queries';

export function OverviewPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const { data: activity } = useSuspenseQuery(githubQuery(10));

  const featured = projects.filter((p) => p.featured).length;
  const categories = [...new Set(projects.map((p) => p.category))].length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Dashboard</p>
        <h1 className="text-2xl font-semibold">Overview</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total projects" value={projects.length} icon={<FolderKanban className="h-4 w-4" />} />
        <StatCard label="Featured" value={featured} icon={<Star className="h-4 w-4" />} accent />
        <StatCard label="Categories" value={categories} icon={<GitBranch className="h-4 w-4" />} />
        <StatCard label="Activity" value={activity.length} icon={<GitCommit className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recent Projects</p>
          <div className="space-y-1.5">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                <span className="font-medium text-sm truncate flex-1">{p.title}</span>
                <span className="font-mono text-[11px] text-pink bg-pink/10 border border-pink/20 rounded px-1.5 py-0.5 shrink-0">{p.category}</span>
                {p.featured && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">GitHub Activity</p>
          <div className="space-y-1.5">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity recorded.</p>
            )}
            {activity.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                <span className="font-mono text-[11px] text-pink bg-pink/10 border border-pink/20 rounded px-1.5 py-0.5 shrink-0">
                  {event.type}
                </span>
                <span className="font-medium truncate flex-1">{event.repo}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(event.occurred_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border p-5 bg-card', accent ? 'border-primary/20' : 'border-border')}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={accent ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      </div>
      <p className={cn('text-3xl font-bold', accent ? 'text-primary' : 'text-foreground')}>{value}</p>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
