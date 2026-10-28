'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';

import { LanguageSelector } from './LanguageSelector';
import { Locale } from '@/lib/i18n';
import { t } from '@/lib/translations';

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  const locale: Locale = pathname.startsWith('/pt-br') || pathname.startsWith('/pt') ? 'pt-br' : 'en';
  const prefix = locale === 'pt-br' ? '/pt-br' : '/en';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
      if (current) {
        setTheme(current);
      } else {
        const stored = localStorage.getItem('clouse-theme') as 'light' | 'dark' | null;
        if (stored) {
          setTheme(stored);
          document.documentElement.setAttribute('data-theme', stored);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      }
    } catch {}

    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'dark' || customEvent.detail === 'light') {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener('clouse-theme-change', handleThemeEvent);
    return () => window.removeEventListener('clouse-theme-change', handleThemeEvent);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('clouse-theme', next);
    } catch {}
    window.dispatchEvent(new CustomEvent('clouse-theme-change', { detail: next }));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container" style={{ width: '100%' }}>
          <div className="nav-inner">
            <Link href={prefix} className="nav-logo" aria-label="Clouse Tools Home">
              <span className="logo-mark">C</span>
              <span>Clouse Tools</span>
            </Link>

            <nav className="nav-links" aria-label="Main Navigation">
              <Link
                href={`${prefix}/tools`}
                className={pathname.endsWith('/tools') ? 'active' : ''}
              >
                {t('nav.allTools', locale)}
              </Link>
              <Link
                href={`${prefix}/category/math`}
                className={pathname.includes('/category') ? 'active' : ''}
              >
                {t('nav.categories', locale)}
              </Link>
              <Link
                href={`${prefix}/about`}
                className={pathname.endsWith('/about') ? 'active' : ''}
              >
                {t('nav.about', locale)}
              </Link>
              <Link
                href={`${prefix}/contact`}
                className={pathname.endsWith('/contact') ? 'active' : ''}
              >
                {t('nav.contact', locale)}
              </Link>
              <Link
                href={`${prefix}/components`}
                className={pathname.endsWith('/components') ? 'active' : ''}
              >
                {t('nav.designSystem', locale)}
              </Link>
            </nav>

            <div className="nav-cta">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Icon name={theme === 'dark' ? 'sun-high' : 'moon'} size={19} />
              </button>

              <button
                type="button"
                className="nav-search-btn"
                onClick={onOpenSearch}
                aria-label={t('nav.searchPlaceholder', locale)}
                title={t('nav.searchPlaceholder', locale)}
              >
                <Icon name="search" size={20} />
                <kbd>⌘K</kbd>
              </button>

              <Link href={`${prefix}/tools`} className="btn btn-primary btn-sm">
                <span>{t('nav.exploreTools', locale)}</span>
                <Icon name="arrow-up-right" size={14} />
              </Link>

              <button
                type="button"
                className={`burger ${mobileMenuOpen ? 'menu-open' : ''}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`m-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link href={prefix} className="m-link">
          <span>Home</span>
          <small>01</small>
        </Link>
        <Link href={`${prefix}/tools`} className="m-link">
          <span>{t('nav.allTools', locale)}</span>
          <small>02</small>
        </Link>
        <Link href={`${prefix}/category/math`} className="m-link">
          <span>{t('nav.categories', locale)}</span>
          <small>03</small>
        </Link>
        <Link href={`${prefix}/about`} className="m-link">
          <span>{t('nav.about', locale)}</span>
          <small>04</small>
        </Link>
        <Link href={`${prefix}/contact`} className="m-link">
          <span>{t('nav.contact', locale)}</span>
          <small>05</small>
        </Link>
        <Link href={`${prefix}/components`} className="m-link">
          <span>{t('nav.designSystem', locale)}</span>
          <small>06</small>
        </Link>

        <div className="m-foot">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', width: '100%' }}>
            <LanguageSelector currentLocale={locale} />
          </div>

          <button
            type="button"
            className="btn btn-ghost full-width"
            onClick={toggleTheme}
            style={{ marginBottom: '8px' }}
          >
            <Icon name={theme === 'dark' ? 'sun-high' : 'moon'} size={16} />
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>
          <button
            type="button"
            className="btn btn-blue full-width"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
          >
            <Icon name="search" size={16} />
            <span>{t('nav.searchButton', locale)}</span>
          </button>
        </div>
      </div>
    </>
  );
}
