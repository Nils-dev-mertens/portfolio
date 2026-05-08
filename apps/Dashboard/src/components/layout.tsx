import { Link, Outlet, useRouterState, useRouter } from '@tanstack/react-router';
import { LayoutDashboard, FolderKanban, Briefcase, GraduationCap, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/api';

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/work', label: 'Work', icon: Briefcase },
  { to: '/education', label: 'Education', icon: GraduationCap },
  { to: '/about', label: 'About', icon: User },
];

export function DashboardLayout() {
  const { location } = useRouterState();
  const router = useRouter();

  function logout() {
    auth.clearToken();
    router.navigate({ to: '/login' });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border flex flex-col p-4 bg-card">
        <div className="px-2 mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Portfolio</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
                  active
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : '')} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-150 mt-2 border-t border-border pt-4"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
