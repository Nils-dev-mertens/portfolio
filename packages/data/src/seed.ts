import { getDb } from './db';
import {
  projects,
  articles,
  work_experience,
  education,
  about,
  skill_categories,
  skills,
} from './db/schema';

const data: (typeof projects.$inferInsert)[] = [
  {
    id: 'portfolio-site',
    title: 'Portfolio Site',
    description:
      'Deze website — gebouwd met Astro, SQLite via bun:sqlite en een Turborepo monorepo. Geen CMS, geen cloud database: alles draait op mijn eigen VPS via Docker. Server islands voor dynamische secties, Drizzle ORM voor typeveilige queries en Tailwind voor de styling. Snel, simpel en volledig in eigen beheer.',
    category: 'website',
    tags: JSON.stringify(['Astro', 'SQLite', 'Bun', 'TypeScript', 'Docker', 'Drizzle']),
    url: 'https://nilsmertens.dev',
    repo_url: 'https://github.com/Nils-Dev-Mertens/portfolio',
    featured: true,
    created_at: '2025-10-01T00:00:00',
  },
  {
    id: 'playwright-test-suite',
    title: 'Playwright Test Suite',
    description:
      'End-to-end testframework voor een webapplicatie met volledige CI/CD integratie via GitHub Actions. De suite dekt kritieke gebruikersflows via het Page Object Model, draait automatisch bij elke pull request en rapporteert resultaten direct in de PR. Stabiel, snel en klaar voor productie.',
    category: 'tool',
    tags: JSON.stringify(['TypeScript', 'Playwright', 'CI/CD', 'GitHub Actions']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/playwright-test-suite',
    featured: true,
    created_at: '2025-08-01T00:00:00',
  },
  {
    id: 'docker-home-server',
    title: 'Docker Home Server',
    description:
      'Self-hosted VPS setup met Docker Compose, Nginx reverse proxy en meerdere actieve services. Volledig opgezet als infra-as-code: elke configuratie zit in version control. Inclusief monitoring via Uptime Kuma, automatische SSL via Let\'s Encrypt en een privé Docker registry.',
    category: 'tool',
    tags: JSON.stringify(['Docker', 'Nginx', 'Linux', 'Bash', 'Let\'s Encrypt']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/docker-home-server',
    featured: true,
    created_at: '2025-06-01T00:00:00',
  },
  {
    id: 'rest-api-dotnet',
    title: 'REST API (.NET)',
    description:
      'RESTful API gebouwd met ASP.NET Core volgens clean architecture principes. Voorzien van JWT authenticatie, request validatie via FluentValidation en volledige Swagger/OpenAPI documentatie. Repository pattern en dependency injection zorgen voor een testbare en uitbreidbare codebase.',
    category: 'api',
    tags: JSON.stringify(['C#', '.NET', 'ASP.NET', 'REST API', 'JWT', 'Swagger']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/rest-api-dotnet',
    featured: false,
    created_at: '2025-03-01T00:00:00',
  },
  {
    id: 'vue-dashboard',
    title: 'Vue Dashboard',
    description:
      'Interactief data dashboard gebouwd met Vue 3 en TypeScript. Visualiseert real-time data via een Node.js backend met WebSocket verbinding. Inclusief filterbare tabellen, grafieken via Chart.js en een responsief grid-layout dat werkt op desktop en mobiel.',
    category: 'website',
    tags: JSON.stringify(['Vue', 'TypeScript', 'Node.js', 'Chart.js', 'WebSocket']),
    url: null,
    repo_url: 'https://github.com/Nils-Dev-Mertens/vue-dashboard',
    featured: false,
    created_at: '2025-01-01T00:00:00',
  },
];

/**
 * Articles are rows like every other piece of content. `astro-server-islands`
 * is deliberately left as a draft without a body: that is the state an article
 * created from the dashboard starts in. `playwright-page-object` has no English
 * body so the site keeps showing the Dutch one until DeepL fills it in.
 */
const DOCKER_PIPELINE_BODY = `Deze site draait niet op Vercel of Netlify, maar op een VPS die ik zelf beheer. Dat betekent dat ik ook mijn eigen deploy-pipeline moest bouwen. In dit artikel leg ik uit hoe die eruitziet, en waarom er geen stap in zit die ik handmatig doe.

## Wat de pipeline moet doen

De eisen waren simpel: een push naar \`master\` moet binnen een paar minuten live staan, en als er iets stuk is mag er niets uitgerold worden. Verder wil ik kunnen terugkeren naar een vorige versie zonder eerst een git-revert te moeten schrijven.

De volgorde waarin dat gebeurt is belangrijker dan de stappen zelf:

1. **install** — Bun installeert de workspace dependencies. De lockfile is de bron van waarheid, dus een afwijkende versie laat de build meteen falen.
2. **check** — TypeScript controleert alle drie de apps tegelijk via Turborepo. Mislukt dit, dan stopt de pipeline hier, nog voor er iets gebouwd wordt.
3. **test** — De testsuite draait tegen een in-memory SQLite database, zodat hij nooit afhankelijk is van de staat van de echte database.
4. **ship** — Alleen als alles groen is worden de images gebouwd en naar de VPS gepusht. Daar start Docker Compose de nieuwe containers op.

## Waarom Turborepo

Alle builds lopen via Turborepo. Dat klinkt als extra gereedschap voor een klein project, maar het levert één concreet voordeel op: caching. De web-app, de API en het dashboard bouwen onafhankelijk van elkaar, dus een wijziging in alleen het dashboard herbouwt de rest niet opnieuw.

\`\`\`bash
bun run build          # wat de CI ook draait
turbo run build --dry  # wat er gecached is
\`\`\`

## Rollen terug zonder drama

De images worden getagd met de commit-hash én met \`latest\`. De VPS trekt alleen \`latest\`, maar de vorige hash blijft lokaal staan. Terugrollen is dan letterlijk een kwestie van de oude tag opnieuw starten:

\`\`\`bash
docker compose up -d api@sha-4f2c9a1
\`\`\`

Geen git-revert, geen nieuwe build, geen downtime van meer dan een paar seconden.

## Wat ik de volgende keer anders doe

De grootste fout die ik maakte was de database in dezelfde stap migreren als de code uitrollen. Als de nieuwe versie terugrolt, is je migratie dat niet. Sindsdien draaien migraties als aparte stap vóór het uitrollen, en zijn ze altijd backwards-compatible.`;

const DOCKER_PIPELINE_BODY_EN = `This site does not run on Vercel or Netlify — it runs on a VPS I manage myself. That also meant building my own deploy pipeline. Here is what it looks like, and why none of it needs a manual step.

## What the pipeline has to do

The requirements were simple: a push to \`master\` should be live within a few minutes, and nothing gets deployed if something is broken. I also want to roll back to a previous version without writing a git revert first.

The order these things happen in matters more than the steps themselves:

1. **install** — Bun installs the workspace dependencies. The lockfile is the source of truth, so a mismatched version fails the build immediately.
2. **check** — TypeScript checks all three apps at once through Turborepo. If that fails the pipeline stops here, before anything gets built.
3. **test** — The test suite runs against an in-memory SQLite database, so it never depends on the state of the real database.
4. **ship** — Only when everything is green are the images built and pushed to the VPS, where Docker Compose starts the new containers.

## Why Turborepo

Every build goes through Turborepo. That sounds like heavy machinery for a small project, but it buys one concrete thing: caching. The web app, the API and the dashboard build independently, so a change confined to the dashboard does not rebuild the rest.

\`\`\`bash
bun run build          # what CI runs too
turbo run build --dry  # what is cached
\`\`\`

## Rolling back without drama

Images are tagged with the commit hash and with \`latest\`. The VPS only pulls \`latest\`, but the previous hash stays on disk. Rolling back is then a matter of starting the old tag again:

\`\`\`bash
docker compose up -d api@sha-4f2c9a1
\`\`\`

No git revert, no rebuild, and no downtime beyond a few seconds.

## What I would do differently next time

My biggest mistake was migrating the database in the same step that shipped the code. If the new version rolls back, your migration does not. Since then migrations run as a separate step before the deploy, and they are always backwards-compatible.`;

const PLAYWRIGHT_BODY = `Page objects zijn geen nieuw idee, maar ze worden vaak verkeerd gebruikt: als een dun laagje om een selector heen. Dan schrijf je nog steeds dezelfde selector op tien plaatsen, alleen met een andere naam. Ik gebruik ze daarom voor iets anders: het afbakenen van de pagina zelf.

## Het probleem met losse selectors

Een test die rechtstreeks op de DOM werkt, breekt op het moment dat de opmaak verandert. Dat is niet erg als het om één test gaat. Het wordt pas een probleem als twintig tests allemaal dezelfde knop zoeken:

\`\`\`ts
await page.getByRole('button', { name: 'Opslaan' }).click();
\`\`\`

Zodra die knop een andere naam krijgt, is het zoeken in twintig bestanden.

## Wat een page object bij mij wel doet

Een page object beschrijft wat een pagina *is*, niet wat een test *doet*:

\`\`\`ts
export class ProjectPage {
  readonly saveButton = this.page.getByRole('button', { name: 'Opslaan' });

  constructor(private readonly page: Page) {}

  async open(slug: string) {
    await this.page.goto(\`/projects/\${slug}\`);
  }
}
\`\`\`

De test leest daardoor als een beschrijving van gedrag, en de selector staat op precies één plek. Verandert de knop, dan verandert er één regel.

## Waar ik de grens trek

Page objects horen geen assertions te bevatten. Zodra een page object gaat bepalen wat "goed" is, verhuist de logica uit je tests naar een laag die niemand meer leest. Assertions blijven in de test; het page object weet alleen hoe de pagina in elkaar zit.`;

const articleData: (typeof articles.$inferInsert)[] = [
  {
    id: 'a1f0c3d4-5b6e-4a70-9c81-0d2e3f4a5b60',
    slug: 'docker-home-server-pipeline',
    title: 'Van push naar productie: hoe mijn deploy-pipeline werkt',
    title_en: 'From push to production: how my deploy pipeline works',
    summary:
      'Een blik op de GitHub Actions pipeline die deze site bouwt, test en uitrolt op mijn eigen VPS — zonder cloudprovider en zonder handmatige stappen.',
    summary_en:
      'A look at the GitHub Actions pipeline that builds, tests and ships this site to my own VPS — no cloud provider, no manual steps.',
    body: DOCKER_PIPELINE_BODY,
    body_en: DOCKER_PIPELINE_BODY_EN,
    project_id: 'docker-home-server',
    status: 'published',
    published_at: '2025-07-08T09:00:00',
    created_at: '2025-07-08T09:00:00',
    updated_at: '2025-07-12T10:30:00',
  },
  {
    id: 'b2e1d4c5-6c7f-4b81-8d92-1e3f4a5b6c71',
    slug: 'playwright-page-object',
    title: 'Waarom ik mijn Playwright tests in page objects opdeel',
    summary:
      'Over selectors die op één plek staan, tests die elkaar niet meer raken en een suite die je durft uit te breiden.',
    body: PLAYWRIGHT_BODY,
    project_id: 'playwright-test-suite',
    status: 'published',
    published_at: '2025-08-20T08:15:00',
    created_at: '2025-08-20T08:15:00',
    updated_at: '2025-08-21T07:00:00',
  },
  {
    id: 'c3d2e5f6-7d8a-4c92-9ea3-2f4a5b6c7d82',
    slug: 'astro-server-islands',
    title: 'Server islands: alleen dynamisch wat dynamisch moet zijn',
    summary: 'Notities bij het herbouwen van deze site als voornamelijk statische Astro-pagina.',
    project_id: 'portfolio-site',
    status: 'draft',
    published_at: null,
    created_at: '2025-09-02T12:00:00',
    updated_at: '2025-09-02T12:00:00',
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

const skillCategoryData: (typeof skill_categories.$inferInsert)[] = [
  { id: 'languages', label: 'Talen', label_en: 'Languages', sort_order: 0 },
  { id: 'frontend', label: 'Frontend', label_en: 'Frontend', sort_order: 1 },
  { id: 'backend', label: 'Backend & Runtime', label_en: 'Backend & Runtime', sort_order: 2 },
  { id: 'devops', label: 'DevOps & Infra', label_en: 'DevOps & Infra', sort_order: 3 },
  { id: 'test', label: 'Test Automation', label_en: 'Test Automation', sort_order: 4 },
  { id: 'tooling', label: 'Tooling & Workflow', label_en: 'Tooling & Workflow', sort_order: 5 },
];

const skillGroup = (categoryId: string, names: string[]): (typeof skills.$inferInsert)[] =>
  names.map((name, i) => ({ id: `${categoryId}-${i}`, category_id: categoryId, name, sort_order: i }));

const skillData: (typeof skills.$inferInsert)[] = [
  ...skillGroup('languages', ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Bash']),
  ...skillGroup('frontend', ['React', 'Vue', 'Angular', 'Astro', 'HTML/CSS']),
  ...skillGroup('backend', ['Node.js', '.NET', 'ASP.NET', 'REST API', 'Bun']),
  ...skillGroup('devops', [
    'Docker',
    'Kubernetes',
    'GitHub Actions',
    'Jenkins',
    'Linux',
    'Nginx',
    'AWS',
    'Azure',
  ]),
  ...skillGroup('test', ['Playwright', 'Selenium', 'Cypress']),
  ...skillGroup('tooling', ['Git', 'GitHub', 'Turborepo', 'Vite', 'Tailwind CSS', 'ESLint', 'Prettier']),
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
    'Ik ben Nils — een junior developer uit Antwerpen met een brede interesse in alles wat met code te maken heeft. Van frontend tot backend, van pipelines tot scripts: ik vind het allemaal interessant. Quack.',
    'Momenteel studeer ik nog, maar doe ondertussen al werkervaring op via stages en bijklussen. Mijn DevOps kennis is grotendeels zelfgeleerd — toegepast op mijn eigen home server setup.',
  ]),
  bio_about: JSON.stringify([
    'Passie is het verschil tussen afvinken en bouwen. Als een project mij raakt — technisch, creatief of conceptueel — investeer ik er meer in dan gevraagd. Niet omdat het verwacht wordt, maar omdat ik het wil zien werken.',
    'Dat zie je terug in mijn keuzes: TypeScript, Astro, open source, self-hosted infra. Geen tools uit gemak — tools die ik begrijp en in geloof. Mijn DevOps kennis is volledig zelfgeleerd, toegepast op een eigen home server met Docker en Nginx. Hands-on leren is de enige manier die voor mij werkt. Kwak.',
  ]),
};

// Export seed function - only export, no direct execution
export function seed() {
  const db = getDb();

  db.delete(projects).run();
  db.insert(projects).values(data).run();

  db.delete(articles).run();
  db.insert(articles).values(articleData).run();

  db.delete(work_experience).run();
  db.insert(work_experience).values(workExperienceData).run();

  db.delete(education).run();
  db.insert(education).values(educationData).run();

  db.delete(about).run();
  db.insert(about).values(aboutData).run();

  db.delete(skills).run();
  db.delete(skill_categories).run();
  db.insert(skill_categories).values(skillCategoryData).run();
  db.insert(skills).values(skillData).run();

  console.log(`Seeded ${data.length} projects, ${articleData.length} articles, ${workExperienceData.length} work experience entries, ${educationData.length} education entries, ${skillCategoryData.length} skill categories and about data into portfolio.db`);
}

// `bun run seed` (and `db:seed`) call this file directly. Tests import `seed`
// instead, which is why the reset only happens when the file is the entrypoint.
if (import.meta.main) {
  seed();
}

/**
 * Fills the default skill categories and skills, but only while the table is
 * still empty. Databases created before skills existed get the content that used
 * to be hardcoded in the web component, without overwriting anything that was
 * edited in the dashboard since.
 */
export function seedSkillsDefaults(): boolean {
  const db = getDb();
  const existing = db.select().from(skill_categories).all().length;
  if (existing > 0) return false;

  db.insert(skill_categories).values(skillCategoryData).run();
  db.insert(skills).values(skillData).run();
  console.log(`Seeded ${skillCategoryData.length} skill categories and ${skillData.length} skills`);
  return true;
}
