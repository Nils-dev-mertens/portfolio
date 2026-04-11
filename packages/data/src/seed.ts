import { getDb } from './db';
import { projects, work_experience, education, about } from './db/schema';

const data: (typeof projects.$inferInsert)[] = [
  {
    id: 'playwright-test-suite',
    title: 'Playwright Test Suite',
    description:
      'End-to-end test framework voor een web applicatie met CI/CD integratie via GitHub Actions. Automatisch draaien bij elke pull request.',
    category: 'tool',
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
    category: 'tool',
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
    category: 'website',
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
    category: 'api',
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
    category: 'website',
    tags: JSON.stringify(['Vue', 'TypeScript', 'Node.js', 'Dashboard']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/vue-dashboard',
    featured: false,
  },
];

const workExperienceData: (typeof work_experience.$inferInsert)[] = [
  {
    id: 'zorgi-test-automation',
    company: 'ZORGI',
    role: 'Test Automation Engineer',
    description:
      'Test automation engineer binnen een zorggerelateerde applicatieomgeving. Schrijven en uitvoeren van geautomatiseerde end-to-end tests.',
    start_date: '2025-07-01',
    end_date: '2025-08-31',
    current: false,
    tags: JSON.stringify(['Playwright', 'Test Automation', 'CI/CD']),
  },
  {
    id: 'wexso-lead-media-web',
    company: 'WEXSO BV',
    role: 'Lead Media/Web',
    description:
      'Lead rol in media en webontwikkeling. Verantwoordelijk voor frontend development, contentontwikkeling en technisch beheer van webprojecten.',
    start_date: '2024-06-01',
    end_date: '2024-11-30',
    current: false,
    tags: JSON.stringify(['Web Development', 'Frontend', 'Media']),
  },
  {
    id: 'adminesstration-media-web',
    company: 'Adminesstration.be',
    role: 'Media/Web',
    description: 'Kortlopende media/web opdracht.',
    start_date: '2024-02-01',
    end_date: '2024-02-28',
    current: false,
    tags: JSON.stringify(['Web', 'Media']),
  },
];

const educationData: (typeof education.$inferInsert)[] = [
  {
    id: 'ap-hogeschool',
    institution: 'AP Hogeschool — Antwerpen',
    program: 'Graduaat Programmeren',
    description: 'Technische opleiding gericht op softwareontwikkeling. Focus op fullstack development, OOP en projectwerk.',
    start_date: '2023-09-01',
    end_date: null,
  },
  {
    id: 'cadix',
    institution: 'Cadix — Noorderlaan, Antwerpen',
    program: 'Opleiding Multimedia',
    description: 'Opleiding met focus op multimedia, web en digitale media.',
    start_date: '2022-09-01',
    end_date: '2023-06-30',
  },
];

const aboutData: (typeof about.$inferInsert) = {
  id: 'main',
  location: 'Antwerpen, België',
  email: 'nilsdevmertens@gmail.com',
  github_url: 'https://github.com/Nils-Dev-Mertens',
  status_label: 'Open voor freelance',
  status_active: true,
  tagline: 'Code, Automate, Deploy — van frontend tot infra, van pipelines tot scripts.',
  quote: 'Als het mij boeit, gaat er alles in.',
  quote_sub: 'Niet omdat het moet — omdat het telt.',
  bio_landing: JSON.stringify([
    'Ik ben Nils — een junior developer uit Antwerpen met een brede interesse in alles wat met code te maken heeft. Van frontend tot backend, van pipelines tot scripts: ik vind het allemaal interessant.',
    'Momenteel studeer ik nog, maar doe ondertussen al werkervaring op via stages en bijklussen. Mijn DevOps kennis is grotendeels zelfgeleerd — toegepast op mijn eigen home server setup.',
  ]),
  bio_about: JSON.stringify([
    'Passie is het verschil tussen afvinken en bouwen. Als een project mij raakt — technisch, creatief of conceptueel — investeer ik er meer in dan gevraagd. Niet omdat het verwacht wordt, maar omdat ik het wil zien werken.',
    'Dat zie je terug in mijn keuzes: TypeScript, Astro, open source, self-hosted infra. Geen tools uit gemak — tools die ik begrijp en in geloof. Mijn DevOps kennis is volledig zelfgeleerd, toegepast op een eigen home server met Docker en Nginx. Hands-on leren is de enige manier die voor mij werkt.',
  ]),
};

const db = getDb();

db.delete(projects).run();
db.insert(projects).values(data).run();

db.delete(work_experience).run();
db.insert(work_experience).values(workExperienceData).run();

db.delete(education).run();
db.insert(education).values(educationData).run();

db.delete(about).run();
db.insert(about).values(aboutData).run();

console.log(`Seeded ${data.length} projects, ${workExperienceData.length} work experience entries, ${educationData.length} education entries, and about data into portfolio.db`);
