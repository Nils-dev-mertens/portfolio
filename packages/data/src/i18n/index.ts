export type Lang = 'nl' | 'en';

type Messages = Record<string, string>;

const messages: Record<Lang, Messages> = {
  nl: {
    'nav.home': 'Home',
    'nav.projects': 'Projecten',
    'nav.about': 'Over mij',

    'cta.viewProjects': 'Bekijk projecten',
    'cta.about': 'Over mij',
    'cta.readMore': 'Lees meer',
    'cta.allProjects': 'Alle projecten',

    'hero.mosaic.controls': 'Fotocarrousel bediening',
    'hero.mosaic.previous': 'Vorige foto',
    'hero.mosaic.next': 'Volgende foto',
    'hero.mosaic.open': 'Selecteer foto',
    'hero.flip.ctaLabel': 'Meer weten?',
    'hero.flip.ctaTitle': 'Over mij →',

    'section.projects.label': 'Projecten',
    'section.projects.title': 'Wat ik bouw',

    'about.title': 'Wie is Nils?',
    'about.intro.githubNote':
      'Alles wat ik bouw is publiek op ',
    'about.skills.label': 'Vaardigheden',
    'about.skills.title': 'Technische stack',
    'about.education.label': 'Opleiding',
    'about.education.title': 'Achtergrond',
    'about.education.present': 'heden',
    'about.meta.location': 'Locatie',
    'about.meta.email': 'E-mail',
    'about.meta.github': 'GitHub',
    'about.meta.status': 'Status',

    'work.label': 'Werkervaring',
    'work.title': 'Waar ik gewerkt heb',
    'work.current': 'Huidig',

    'projects.page.label': 'Portfolio',
    'projects.page.title': 'Alle projecten',
    'projects.page.intro':
      'Ik bouw projecten omdat ik geloof dat je het meeste leert door gewoon te bouwen. Soms is het een probleem dat ik zelf tegenkom, soms pure nieuwsgierigheid naar een technologie, en soms wil ik iets bijdragen aan de open source community. Elk project is een kans om iets nieuws te ontdekken, te experimenteren en beter te worden in mijn vak.',
    'projects.page.intro2':
      "Op deze pagina staat alles wat ik heb gebouwd en nog onderhoud: websites, API's, CLI-tools en de infrastructuur eromheen. De nieuwste projecten staan bovenaan, elk met een link naar de repository of de live versie. Zo kan je meteen in de code duiken of het resultaat zelf uitproberen.",
    'projects.page.empty': 'Er staan nog geen projecten online. Kom binnenkort nog eens terug.',
    'projects.visitSite': 'Bekijk site',
    'projects.viewCode': 'Bekijk code',
    'projects.category.website': 'Website',
    'projects.category.cli': 'CLI',
    'projects.category.api': 'API',
    'projects.category.library': 'Bibliotheek',
    'projects.category.tool': 'Tool',
    'projects.category.other': 'Overig',
    'projects.latest': 'Nieuwste',

    'contact.available': 'Beschikbaar voor werk',
    'contact.ctaTitle': 'Laten we iets\nbouwen samen.',
    'contact.ctaSub': 'Open voor freelance projecten, samenwerkingen en vaste rollen.',
    'contact.mail': 'Stuur een mail',
    'contact.github': 'GitHub',

    'github.label': 'GitHub',
    'github.title': 'Code in cijfers',
    'github.none': 'Nog geen bijdragen gesynchroniseerd — de cronjob vult dit automatisch aan.',
    'github.contributions': '{total} bijdragen in het afgelopen jaar',
    'github.contribution': 'bijdrage',
    'github.contributions_plural': 'bijdragen',
  },
  en: {
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.about': 'About',

    'cta.viewProjects': 'View projects',
    'cta.about': 'About me',
    'cta.readMore': 'Read more',
    'cta.allProjects': 'All projects',

    'hero.mosaic.controls': 'Photo carousel controls',
    'hero.mosaic.previous': 'Previous photo',
    'hero.mosaic.next': 'Next photo',
    'hero.mosaic.open': 'Select photo',
    'hero.flip.ctaLabel': 'Want to know more?',
    'hero.flip.ctaTitle': 'About me →',

    'section.projects.label': 'Projects',
    'section.projects.title': 'What I build',

    'about.title': 'Who is Nils?',
    'about.intro.githubNote':
      'Everything I build is public on ',
    'about.skills.label': 'Skills',
    'about.skills.title': 'Tech stack',
    'about.education.label': 'Education',
    'about.education.title': 'Background',
    'about.education.present': 'present',
    'about.meta.location': 'Location',
    'about.meta.email': 'Email',
    'about.meta.github': 'GitHub',
    'about.meta.status': 'Status',

    'work.label': 'Work experience',
    'work.title': "Where I've worked",
    'work.current': 'Current',

    'projects.page.label': 'Portfolio',
    'projects.page.title': 'All projects',
    'projects.page.intro':
      "I build projects because I believe you learn the most by simply doing. Sometimes it's a problem I run into myself, sometimes pure curiosity about a technology, and sometimes I want to give back to the open source community. Every project is a chance to discover something new, experiment, and get better at my craft.",
    'projects.page.intro2':
      "This page collects everything I've built and still maintain: websites, APIs, CLI tools and the infrastructure around them. The newest projects are listed first, each with a link to the repository or the live version, so you can jump straight into the code or try the result yourself.",
    'projects.page.empty': 'No projects published yet. Check back soon.',
    'projects.visitSite': 'Visit site',
    'projects.viewCode': 'View code',
    'projects.category.website': 'Website',
    'projects.category.cli': 'CLI',
    'projects.category.api': 'API',
    'projects.category.library': 'Library',
    'projects.category.tool': 'Tool',
    'projects.category.other': 'Other',
    'projects.latest': 'Latest',

    'contact.available': 'Available for work',
    'contact.ctaTitle': 'Let’s build something\ntogether.',
    'contact.ctaSub': 'Open to freelance projects, collaborations and full-time roles.',
    'contact.mail': 'Send an email',
    'contact.github': 'GitHub',

    'github.label': 'GitHub',
    'github.title': 'Code in numbers',
    'github.none': 'No contributions synchronized yet — the cronjob fills this in automatically.',
    'github.contributions': '{total} contributions in the past year',
    'github.contribution': 'contribution',
    'github.contributions_plural': 'contributions',
  },
};

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let value = messages[lang]?.[key] ?? messages.nl[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return value;
}

/**
 * Returns the localized value for `field`. Falls back to the Dutch (`field`)
 * value when no English translation exists yet (e.g. not yet generated by
 * DeepL). Works on any row that carries `<field>_en` companion columns.
 */
export function pick<T extends Record<string, unknown>>(
  row: T,
  field: keyof T,
  lang: Lang,
): T[keyof T] {
  if (lang === 'en') {
    const en = (row as Record<string, unknown>)[`${String(field)}_en`];
    if (en !== null && en !== undefined && en !== '') return en as T[keyof T];
  }
  return row[field];
}
