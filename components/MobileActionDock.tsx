'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export function MobileActionDock() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });

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

  return (
    <div className="mobile-dock" aria-label="Mobile quick actions">
      <button
        type="button"
        className="mobile-dock-btn search-trigger"
        onClick={openSearch}
      >
        <Icon name="search" size={17} />
        <span>Search...</span>
        <kbd>⌘K</kbd>
      </button>

      <Link href="/tools" className="mobile-dock-btn pill-btn" aria-label="Directory">
        <Icon name="dice-5" size={17} />
        <span>Tools</span>
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
