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
  } catch {
    // storage may be unavailable; history is a convenience, not a contract
  }
}

/**
 * Hero command line. Type to search: live matches drop down beneath the field
 * with full keyboard control (up/down/enter/esc). Enter with no selection runs
 * a full search; an empty submit opens the global command palette.
 */
export function HeroSearch() {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

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

  const placeholder = t('hero.searchPlaceholder', locale);
  const buttonText = t('hero.searchBtn', locale);

  return (
    <div className="hero-search-wrap">
      <form
        className="hero-search"
        onSubmit={handleSubmit}
        role="search"
        autoComplete="off"
      >
        <span className="hs-icon" aria-hidden="true">
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
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls="hero-suggest"
          aria-autocomplete="list"
        />
        <button type="submit" className="btn btn-primary hs-go">
          <span>{buttonText}</span>
        </button>
      </form>

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
                    <span className="sr-cat">{cat?.name || tool.cat}</span>
                  </Link>
                );
              })}
              <span className="hs-foot">
                <kbd>↵</kbd> <span>{t('hero.suggest.enter', locale)}</span>
              </span>
            </>
          ) : (
            <span className="hs-empty">
              <Icon name="search" size={16} />
              {t('hero.suggest.empty', locale)}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
