import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { Suspense } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout';
import { LoginPage } from './pages/login';
import { OverviewPage } from './pages/overview';
import { ProjectsPage } from './pages/projects';
import { WorkPage } from './pages/work';
import { EducationPage } from './pages/education';
import { AboutPage } from './pages/about';
import { auth } from './lib/api';
import {
  projectsQuery,
  workQuery,
  educationQuery,
  aboutQuery,
  githubQuery,
} from './lib/queries';

function Pending() {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

function RouteError() {
  return (
    <div className="flex items-center justify-center h-48 text-destructive text-sm">
      Something went wrong. Is the API running?
    </div>
  );
}

function wrap(Component: React.ComponentType) {
  return function Wrapped() {
    return (
      <Suspense fallback={<Pending />}>
        <Component />
      </Suspense>
    );
  };
}

export function createAppRouter(queryClient: QueryClient) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    beforeLoad: () => {
      if (auth.isLoggedIn()) throw redirect({ to: '/' });
    },
    component: LoginPage,
  });

  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'layout',
    beforeLoad: () => {
      if (!auth.isLoggedIn()) throw redirect({ to: '/login' });
    },
    component: DashboardLayout,
  });

  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    loader: () =>
      Promise.all([
        queryClient.ensureQueryData(projectsQuery()),
        queryClient.ensureQueryData(githubQuery(10)),
      ]).catch(() => null),
    errorComponent: RouteError,
    component: wrap(OverviewPage),
  });

  const projectsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/projects',
    loader: () => queryClient.ensureQueryData(projectsQuery()).catch(() => null),
    errorComponent: RouteError,
    component: wrap(ProjectsPage),
  });

  const workRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/work',
    loader: () => queryClient.ensureQueryData(workQuery()).catch(() => null),
    errorComponent: RouteError,
    component: wrap(WorkPage),
  });

  const educationRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/education',
    loader: () => queryClient.ensureQueryData(educationQuery()).catch(() => null),
    errorComponent: RouteError,
    component: wrap(EducationPage),
  });

  const aboutRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/about',
    loader: () => queryClient.ensureQueryData(aboutQuery()).catch(() => null),
    errorComponent: RouteError,
    component: wrap(AboutPage),
  });

  const routeTree = rootRoute.addChildren([
    loginRoute,
    layoutRoute.addChildren([
      indexRoute,
      projectsRoute,
      workRoute,
      educationRoute,
      aboutRoute,
    ]),
  ]);

  return createRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}
