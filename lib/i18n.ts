export type Locale = 'en' | 'pt-br';

export const LOCALES: Locale[] = ['en', 'pt-br'];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string; short: string }> = {
  'pt-br': {
    label: 'Português (BR)',
    flag: '🇧🇷',
    short: 'PT-BR',
  },
  'en': {
    label: 'English (US)',
    flag: '🇺🇸',
    short: 'EN',
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return locale === 'en' || locale === 'pt-br';
}

export function normalizeLocale(locale?: string | null): Locale {
  if (!locale) return DEFAULT_LOCALE;
  const l = locale.toLowerCase().trim();
  if (l === 'pt' || l === 'pt-br' || l === 'pt_br' || l.startsWith('pt')) return 'pt-br';
  return 'en';
}

/**
 * Client-side locale detection from cookie, localStorage, or browser language/country.
 */
export function detectClientLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    // 1. User manual override in localStorage
    const saved = localStorage.getItem('clouse-locale');
    if (saved && isValidLocale(saved)) return saved;

    // 2. Cookie override
    const cookieMatch = document.cookie.match(/(?:^|;\s*)clouse-locale=([^;]+)/);
    if (cookieMatch && isValidLocale(cookieMatch[1])) {
      return cookieMatch[1] as Locale;
    }

    // 3. Browser language
    const languages = navigator.languages || [navigator.language || ''];
    for (const lang of languages) {
      if (lang && lang.toLowerCase().startsWith('pt')) {
        return 'pt-br';
      }
    }

    // 4. Timezone heuristic for Brazil
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.includes('Sao_Paulo') ||
      tz.includes('Fortaleza') ||
      tz.includes('Manaus') ||
      tz.includes('Belem') ||
      tz.includes('Recife') ||
      tz.includes('Cuiaba') ||
      tz.includes('Porto_Velho') ||
      tz.includes('Boa_Vista') ||
      tz.includes('Rio_Branco') ||
      tz.includes('Maceio') ||
      tz.includes('Campo_Grande') ||
      tz.includes('Bahia') ||
      tz.includes('Araguaina') ||
      tz.includes('Noronha')
    ) {
      return 'pt-br';
    }
  } catch {
    // fallback
  }

  return DEFAULT_LOCALE;
}

/**
 * Save user preference to cookie and localStorage.
 */
export function setClientLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('clouse-locale', locale);
    document.cookie = `clouse-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

/**
 * Switch the current pathname to a new locale.
 */
export function switchLocalePath(currentPath: string, newLocale: Locale): string {
  if (!currentPath) return `/${newLocale}`;
  
  // Strip leading locale if present
  let cleanPath = currentPath;
  if (cleanPath.startsWith('/en')) {
    cleanPath = cleanPath.slice(3) || '/';
  } else if (cleanPath.startsWith('/pt-br')) {
    cleanPath = cleanPath.slice(6) || '/';
  } else if (cleanPath.startsWith('/pt')) {
    cleanPath = cleanPath.slice(3) || '/';
  }

  if (cleanPath === '/') {
    return `/${newLocale}`;
  }

  return `/${newLocale}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
}
