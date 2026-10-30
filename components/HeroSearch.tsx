'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedTools, getLocalizedCategoryById, t } from '@/lib/translations';
import { Tool } from '@/lib/data';

const REMEMBER_KEY = 'clouse-recent';

function rememberRecent(slug: string) {
  try {
    const recent: string[] = JSON.parse(localStorage.getItem(REMEMBER_KEY) || '[]');
    const updated = [slug, ...recent.filter((s) => s !== slug)].slice(0, 6);
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('clouse-recent-updated', { detail: updated }));
  } catch {}
}

export function HeroSearch() {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';
  const isPt = locale === 'pt-br';
  const prefix = isPt ? '/pt-br' : '/en';

  const allTools = useMemo(() => getLocalizedTools(locale), [locale]);
  const term = val.trim().toLowerCase();

  const matches = useMemo<Tool[]>(() => {
    if (!term) return [];
    return allTools
      .filter(
        (tool) =>
          tool.name.toLowerCase().includes(term) ||
          tool.desc.toLowerCase().includes(term) ||
          tool.kw.toLowerCase().includes(term) ||
          tool.cat.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [allTools, term]);

  const open = focused && term.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && matches[active]) {
      choose(matches[active]);
      return;
    }
    if (term) {
      router.push(`/${locale}/search?q=${encodeURIComponent(term)}`);
      return;
    }
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const choose = (tool: Tool) => {
    rememberRecent(tool.slug);
    setFocused(false);
    router.push(`/${locale}/tool/${tool.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((prev) => (prev + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === 'Escape') {
      setFocused(false);
      e.currentTarget.blur();
    }
  };

  const placeholder = isPt ? 'O que você gostaria de fazer?' : 'What would you like to do?';

  const tryPills = [
    { label: isPt ? 'Porcentagem' : 'Percentages', slug: 'percentage-calculator' },
    { label: isPt ? 'Contador' : 'Word count', slug: 'word-counter' },
    { label: 'JSON', slug: 'json-formatter' },
  ];

  return (
    <div className="hero-search-wrapper">
      {/* 100% Pill-shaped search bar matching master design spec */}
      <form
        className="hero-pill-search"
        onSubmit={handleSubmit}
        role="search"
        autoComplete="off"
      >
        <span className="hs-pill-icon" aria-hidden="true">
          <Icon name="search" size={20} />
        </span>

        <input
          type="search"
          placeholder={placeholder}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls="hero-suggest"
          aria-autocomplete="list"
        />

        {/* Circular solid black submit button with white arrow */}
        <button
          type="submit"
          className="hs-pill-submit"
          aria-label={isPt ? 'Buscar' : 'Search'}
          title={isPt ? 'Buscar' : 'Search'}
        >
          <span className="hs-pill-arrow" aria-hidden="true">→</span>
        </button>
      </form>

      {/* Auto-suggest dropdown */}
      {open ? (
        <div className="hero-suggest" id="hero-suggest" role="listbox" aria-label={t('hero.suggest.label', locale)}>
          {matches.length > 0 ? (
            <>
              <span className="hs-label">{t('hero.suggest.label', locale)}</span>
              {matches.map((tool, index) => {
                const cat = getLocalizedCategoryById(tool.cat, locale);
                return (
                  <Link
                    key={tool.slug}
                    href={`/${locale}/tool/${tool.slug}`}
                    className={`hs-item ${index === active ? 'active' : ''}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(tool);
                    }}
                  >
                    <span className="sr-icn">
                      <Icon name={tool.icon} size={17} />
                    </span>
                    <span className="sr-text">
                      <span className="sr-title">{tool.name}</span>
                      <span className="sr-desc">{tool.desc}</span>
                    </span>
                    {cat && <span className="sr-cat">{cat.name}</span>}
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="hs-empty">{t('hero.suggest.empty', locale)}</div>
          )}
        </div>
      ) : null}

      {/* TRY Pills Row */}
      <div className="hero-try-row">
        <span className="hero-try-label">TRY:</span>
        <div className="hero-try-chips">
          {tryPills.map((pill) => (
            <Link
              key={pill.slug}
              href={`${prefix}/tool/${pill.slug}`}
              className="hero-try-pill"
            >
              <span>{pill.label}</span>
              <span className="pill-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trust Badges Row */}
      <div className="hero-trust-row">
        <span className="trust-item">
          <span className="check" aria-hidden="true">✓</span>
          <span>{isPt ? 'Sem cadastro' : 'No sign-up'}</span>
        </span>
        <span className="trust-item">
          <span className="check" aria-hidden="true">✓</span>
          <span>{isPt ? '100% gratuito' : 'Free to use'}</span>
        </span>
        <span className="trust-item">
          <span className="check" aria-hidden="true">✓</span>
          <span>{isPt ? 'Para todos' : 'Made for everyone'}</span>
        </span>
      </div>
    </div>
  );
}
