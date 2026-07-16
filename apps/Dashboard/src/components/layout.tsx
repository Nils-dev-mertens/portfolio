import { useState, useEffect } from 'react';
import { Link, Outlet, useRouterState, useRouter } from '@tanstack/react-router';
import { LayoutDashboard, FolderKanban, Briefcase, GraduationCap, User, LogOut, Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleExpired = () => router.navigate({ to: '/login' });
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [router]);

  function logout() {
    auth.clearToken();
    router.navigate({ to: '/login' });
  }

  const NavLinks = () => (
    <>
      <nav className="flex flex-col gap-0.5 flex-1">
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
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
        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-150 border-t border-border pt-4 mt-2"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-border flex-col p-4 bg-card">
        <div className="px-2 mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Portfolio</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 flex flex-col p-4 bg-card border-r border-border transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-2 mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Portfolio</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-primary uppercase tracking-widest">Portfolio</p>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
