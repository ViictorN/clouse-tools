'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale, switchLocalePath, setClientLocale } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLocale?: Locale;
  className?: string;
}

export function LanguageSelector({ currentLocale, className = '' }: LanguageSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Deduce locale from URL if not explicitly provided
  const activeLocale: Locale =
    currentLocale || (pathname.startsWith('/pt-br') || pathname.startsWith('/pt') ? 'pt-br' : 'en');

  const handleSelect = (newLocale: Locale) => {
    if (newLocale === activeLocale) return;
    setClientLocale(newLocale);
    const newPath = switchLocalePath(pathname, newLocale);
    window.dispatchEvent(new CustomEvent('clouse-locale-change', { detail: newLocale }));
    router.push(newPath);
  };

  return (
    <div
      className={`lang-selector ${className}`}
      role="group"
      aria-label="Language / Idioma"
    >
      <button
        type="button"
        className={`lang-btn ${activeLocale === 'pt-br' ? 'active' : ''}`}
        onClick={() => handleSelect('pt-br')}
        aria-label="Mudar para Português do Brasil"
        title="Português (BR)"
      >
        <span aria-hidden="true">🇧🇷</span>
        <span>PT</span>
      </button>

      <span className="lang-sep" aria-hidden="true" />

      <button
        type="button"
        className={`lang-btn ${activeLocale === 'en' ? 'active' : ''}`}
        onClick={() => handleSelect('en')}
        aria-label="Switch to English"
        title="English (US)"
      >
        <span aria-hidden="true">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
