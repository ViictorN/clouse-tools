'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

export function MobileActionDock() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dockVisible, setDockVisible] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  useEffect(() => {
    let lastY = window.scrollY;
    const checkScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const atBottom = y + window.innerHeight >= doc.scrollHeight - 4;
      const atTop = y < 24;
      setShowScrollTop(y > 400);
      if (atTop) {
        setDockVisible(false);
      } else if (atBottom) {
        setDockVisible(true);
      } else if (y > lastY + 8) {
        setDockVisible(false);
      } else if (y < lastY - 8) {
        setDockVisible(true);
      }
      lastY = y;
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    try {
      const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
      if (current) {
        setTheme(current);
      }
    } catch {}

    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'dark' || customEvent.detail === 'light') {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener('clouse-theme-change', handleThemeEvent);

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('clouse-theme-change', handleThemeEvent);
    };
  }, []);

  useEffect(() => {
    const onLangChange = () => setDockVisible(false);
    window.addEventListener('clouse-locale-change', onLangChange);
    return () => window.removeEventListener('clouse-locale-change', onLangChange);
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

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchLabel = locale === 'pt-br' ? 'Buscar...' : 'Search...';
  const toolsLabel = locale === 'pt-br' ? 'Ferramentas' : 'Tools';

  return (
    <div className={`mobile-dock${dockVisible ? ' visible' : ''}`} aria-label="Mobile quick actions">
      <button
        type="button"
        className="mobile-dock-btn search-trigger"
        onClick={openSearch}
        aria-label={searchLabel}
      >
        <Icon name="search" size={17} />
        <span>{searchLabel}</span>
        <kbd>⌘K</kbd>
      </button>

      <Link href={`/${locale}/tools`} className="mobile-dock-btn pill-btn" aria-label={toolsLabel}>
        <Icon name="box" size={17} />
        <span>{toolsLabel}</span>
      </Link>


      <button
        type="button"
        className="mobile-dock-btn icon-only"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <Icon name={theme === 'dark' ? 'sun-high' : 'moon'} size={17} />
      </button>

      {showScrollTop && (
        <button
          type="button"
          className="mobile-dock-btn icon-only"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <Icon name="arrow-up-right" size={17} />
        </button>
      )}
    </div>
  );
}
