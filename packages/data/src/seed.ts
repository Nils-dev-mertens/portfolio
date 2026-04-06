import { getDb } from './db';
import { projects } from './db/schema';

const data: (typeof projects.$inferInsert)[] = [
  {
    id: 'playwright-test-suite',
    title: 'Playwright Test Suite',
    description:
      'End-to-end test framework voor een web applicatie met CI/CD integratie via GitHub Actions. Automatisch draaien bij elke pull request.',
    tags: JSON.stringify(['TypeScript', 'Playwright', 'CI/CD', 'GitHub Actions']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/playwright-test-suite',
    featured: true,
  },
  {
    id: 'docker-home-server',
    title: 'Docker Home Server',
    description:
      'Self-hosted VPS setup met Docker Compose, Nginx reverse proxy en diverse services. Volledig gedocumenteerd als infra-as-code.',
    tags: JSON.stringify(['Docker', 'Nginx', 'Linux', 'Bash']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/docker-home-server',
    featured: true,
  },
  {
    id: 'portfolio-site',
    title: 'Portfolio Site',
    description:
      'Deze website — gebouwd met Astro, SQLite via bun:sqlite en een Turborepo monorepo. Server islands voor dynamische secties.',
    tags: JSON.stringify(['Astro', 'SQLite', 'Bun', 'TypeScript']),
    url: 'https://nilsmertens.dev',
    repo_url: 'https://github.com/Nils-Dev-Mertens/portfolio',
    featured: true,
  },
  {
    id: 'rest-api-dotnet',
    title: 'REST API (.NET)',
    description:
      'RESTful API gebouwd met ASP.NET Core. Inclusief authenticatie, validatie en Swagger documentatie.',
    tags: JSON.stringify(['C#', '.NET', 'ASP.NET', 'REST API']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/rest-api-dotnet',
    featured: false,
  },
  {
    id: 'vue-dashboard',
    title: 'Vue Dashboard',
    description:
      'Data dashboard gebouwd met Vue 3 en TypeScript. Visualiseert real-time data via een Node.js backend.',
    tags: JSON.stringify(['Vue', 'TypeScript', 'Node.js', 'Dashboard']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/vue-dashboard',
    featured: false,
  },
];

const db = getDb();

db.delete(projects).run();
db.insert(projects).values(data).run();

console.log(`Seeded ${data.length} projects into portfolio.db`);
