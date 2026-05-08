import { useSuspenseQuery } from '@tanstack/react-query';
import { FolderKanban, Star, GitCommit } from 'lucide-react';
import { projectsQuery, githubQuery } from '@/lib/queries';

export function OverviewPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const { data: activity } = useSuspenseQuery(githubQuery(10));

  const featured = projects.filter((p) => p.featured).length;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Dashboard</p>
        <h1 className="text-2xl font-semibold">Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Projects"
          value={projects.length}
          sub={`${featured} featured`}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <StatCard
          label="Featured"
          value={featured}
          sub="shown on homepage"
          icon={<Star className="h-4 w-4" />}
          accent
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <GitCommit className="h-3.5 w-3.5" /> Recent GitHub Activity
        </p>
        <div className="space-y-1.5">
          {activity.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity recorded.</p>
          )}
          {activity.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
            >
              <span className="font-mono text-[11px] text-pink bg-pink/10 border border-pink/20 rounded px-1.5 py-0.5 shrink-0">
                {event.type}
              </span>
              <span className="font-medium truncate flex-1">{event.repo}</span>
              {event.message && (
                <span className="text-muted-foreground text-xs truncate hidden sm:block max-w-48">
                  {event.message}
                </span>
              )}
              <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                {new Date(event.occurred_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 bg-card ${accent ? 'border-primary/20' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={accent ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
