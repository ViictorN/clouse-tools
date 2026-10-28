'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

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
            <Link href="/" className="nav-logo" aria-label="Clouse Tools Home">
              <span className="logo-mark">C</span>
              <span>Clouse Tools</span>
            </Link>

            <nav className="nav-links" aria-label="Main Navigation">
              <Link href="/tools" className={pathname === '/tools' ? 'active' : ''}>
                All Tools
              </Link>
              <Link href="/category/math" className={pathname.startsWith('/category') ? 'active' : ''}>
                Categories
              </Link>
              <Link href="/about" className={pathname === '/about' ? 'active' : ''}>
                About
              </Link>
              <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>
                Contact
              </Link>
              <Link href="/components" className={pathname === '/components' ? 'active' : ''}>
                Design System
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
                aria-label="Search tools (Press Ctrl+K or /)"
                title="Search tools (Ctrl+K or /)"
              >
                <Icon name="search" size={20} />
                <kbd>⌘K</kbd>
              </button>

              <Link href="/tools" className="btn btn-primary btn-sm">
                <span>Explore 67 Tools</span>
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
        <Link href="/" className="m-link">
          <span>Home</span>
          <small>01</small>
        </Link>
        <Link href="/tools" className="m-link">
          <span>All 67 Tools</span>
          <small>02</small>
        </Link>
        <Link href="/category/math" className="m-link">
          <span>Categories</span>
          <small>03</small>
        </Link>
        <Link href="/about" className="m-link">
          <span>About Clouse</span>
          <small>04</small>
        </Link>
        <Link href="/contact" className="m-link">
          <span>Contact &amp; Support</span>
          <small>05</small>
        </Link>
        <Link href="/components" className="m-link">
          <span>Design System</span>
          <small>06</small>
        </Link>
        <div className="m-foot">
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
            <span>Search 67 Tools (Ctrl+K)</span>
          </button>
        </div>
      </div>
    </>
  );
}
