import type { Lang } from '@portfolio/data';

export function getLang(locale: string | undefined): Lang {
  return locale === 'en' ? 'en' : 'nl';
}

/** Swap the `/en` prefix on a pathname to point at the `target` locale. */
export function swapLocale(pathname: string, target: Lang): string {
  let p = pathname;
  if (p.startsWith('/en')) p = p.slice(3) || '/';
  if (target === 'en') return p === '/' ? '/en' : `/en${p}`;
  return p;
}
