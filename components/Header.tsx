'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
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

  const locale: Locale = pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';
  const prefix = locale === 'pt-br' ? '/pt-br' : '/en';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
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
    const apply = () => {
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('clouse-theme', next);
      } catch {}
      window.dispatchEvent(new CustomEvent('clouse-theme-change', { detail: next }));
    };
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !document.startViewTransition) {
      apply();
      return;
    }
    document.startViewTransition(apply);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isHome = pathname === prefix || pathname === `${prefix}/` || pathname === '/';
  const isCategories = pathname.includes('/category');
  const isTools = pathname.includes('/tools');

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container" style={{ width: '100%' }}>
          <div className="nav-inner">
            <Link href={prefix} className="nav-logo" aria-label="CLOUSE TOOLS Home">
              <span className="logo-mark" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17 3.5C14.5 1.5 11 1.8 8.8 4L4 8.8C1.8 11 1.5 14.5 3.5 17C5.5 19.5 9 19.2 11.2 17L16 12.2C18.2 10 18.5 6.5 16.5 4"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.5 14.5L19.5 19.5"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
                </svg>
              </span>
              <span className="logo-text">CLOUSE TOOLS</span>
            </Link>

            <nav className="nav-links" aria-label="Main Navigation">
              <Link
                href={prefix}
                className={isHome ? 'active' : ''}
              >
                <span>{locale === 'pt-br' ? 'Início' : 'Home'}</span>
                {isHome && <span className="active-dot" />}
              </Link>
              <Link
                href={`${prefix}/category/math`}
                className={isCategories ? 'active' : ''}
              >
                <span>{t('nav.categories', locale)}</span>
              </Link>
              <Link
                href={`${prefix}/tools`}
                className={`nav-link-arrow ${isTools ? 'active' : ''}`}
              >
                <span>{t('nav.allTools', locale)}</span>
                <span className="arr" aria-hidden="true">→</span>
              </Link>
            </nav>

            <div className="nav-cta">
              {/* Search button with circular glass/pill styling */}
              <button
                type="button"
                className="nav-search-btn circular"
                onClick={onOpenSearch}
                aria-label={t('nav.searchPlaceholder', locale)}
                title={t('nav.searchPlaceholder', locale)}
              >
                <Icon name="search" size={17} />
              </button>

              {/* Theme toggle button */}
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Icon name={theme === 'dark' ? 'sun-high' : 'moon'} size={17} />
              </button>

              {/* Primary CTA button matching master spec */}
              <Link href={`${prefix}/tools`} className="btn btn-primary btn-sm nav-explore-btn">
                <span>{locale === 'pt-br' ? 'Explorar 67 Ferramentas' : 'Explore 67 Tools'}</span>
                <span className="arr" aria-hidden="true">→</span>
              </Link>

              {/* Mobile Burger */}
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
        <nav className="m-nav" aria-label="Mobile Navigation">
          <Link href={prefix} className="m-link">
            <span>{locale === 'pt-br' ? 'Início' : 'Home'}</span>
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
        </nav>

        <div className="m-foot">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '0 4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>
              {locale === 'pt-br' ? 'Idioma' : 'Language'}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Link
                href="/pt-br"
                className={`btn btn-sm ${locale === 'pt-br' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                PT-BR
              </Link>
              <Link
                href="/en"
                className={`btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                EN
              </Link>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost full-width"
            onClick={toggleTheme}
            style={{ marginBottom: '10px' }}
          >
            <Icon name={theme === 'dark' ? 'sun-high' : 'moon'} size={16} />
            <span>
              {locale === 'pt-br'
                ? theme === 'dark'
                  ? 'Mudar para Modo Claro'
                  : 'Mudar para Modo Escuro'
                : `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            </span>
          </button>
          <button
            type="button"
            className="btn btn-primary full-width"
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
