import { getDb } from './db';

const projects = [
  {
    id: 'playwright-test-suite',
    title: 'Playwright Test Suite',
    description:
      'End-to-end test framework voor een web applicatie met CI/CD integratie via GitHub Actions. Automatisch draaien bij elke pull request.',
    tags: JSON.stringify(['TypeScript', 'Playwright', 'CI/CD', 'GitHub Actions']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/playwright-test-suite',
    featured: 1,
  },
  {
    id: 'docker-home-server',
    title: 'Docker Home Server',
    description:
      'Self-hosted VPS setup met Docker Compose, Nginx reverse proxy en diverse services. Volledig gedocumenteerd als infra-as-code.',
    tags: JSON.stringify(['Docker', 'Nginx', 'Linux', 'Bash']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/docker-home-server',
    featured: 1,
  },
  {
    id: 'portfolio-site',
    title: 'Portfolio Site',
    description:
      'Deze website — gebouwd met Astro, SQLite via bun:sqlite en een Turborepo monorepo. Server islands voor dynamische secties.',
    tags: JSON.stringify(['Astro', 'SQLite', 'Bun', 'TypeScript']),
    url: 'https://nilsmertens.dev',
    repo_url: 'https://github.com/Nils-Dev-Mertens/portfolio',
    featured: 1,
  },
  {
    id: 'rest-api-dotnet',
    title: 'REST API (.NET)',
    description:
      'RESTful API gebouwd met ASP.NET Core. Inclusief authenticatie, validatie en Swagger documentatie.',
    tags: JSON.stringify(['C#', '.NET', 'ASP.NET', 'REST API']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/rest-api-dotnet',
    featured: 0,
  },
  {
    id: 'vue-dashboard',
    title: 'Vue Dashboard',
    description:
      'Data dashboard gebouwd met Vue 3 en TypeScript. Visualiseert real-time data via een Node.js backend.',
    tags: JSON.stringify(['Vue', 'TypeScript', 'Node.js', 'Dashboard']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/vue-dashboard',
    featured: 0,
  },
];

const db = getDb();

db.exec('DELETE FROM projects');

const insert = db.prepare(
  'INSERT INTO projects (id, title, description, tags, url, repo_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

for (const p of projects) {
  insert.run(p.id, p.title, p.description, p.tags, p.url, p.repo_url, p.featured);
}

console.log(`Seeded ${projects.length} projects into portfolio.db`);
