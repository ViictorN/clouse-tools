'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedTools, getLocalizedCategoryById } from '@/lib/translations';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Tool[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  const localizedTools = getLocalizedTools(locale);

  const searchInList = (q: string): Tool[] => {
    const term = q.trim().toLowerCase();
    if (!term) return localizedTools.slice(0, 8);
    return localizedTools
      .filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.desc.toLowerCase().includes(term) ||
          t.kw.toLowerCase().includes(term) ||
          t.cat.toLowerCase().includes(term)
      )
      .slice(0, 10);
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(searchInList('').slice(0, 8));
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, locale]);

  useEffect(() => {
    const list = searchInList(query);
    setResults(list);
    setSelectedIndex(0);
  }, [query, locale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        }
      } else if (
        e.key === '/' &&
        !isOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      } else if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            try {
              const recent: string[] = JSON.parse(localStorage.getItem('clouse-recent') || '[]');
              const filtered = recent.filter((s) => s !== results[selectedIndex].slug);
              const updated = [results[selectedIndex].slug, ...filtered].slice(0, 6);
              localStorage.setItem('clouse-recent', JSON.stringify(updated));
              window.dispatchEvent(new CustomEvent('clouse-recent-updated', { detail: updated }));
            } catch {}
            router.push(`/${locale}/tool/${results[selectedIndex].slug}`);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose, locale]);

  const handleItemClick = (slug: string) => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem('clouse-recent') || '[]');
      const filtered = recent.filter((s) => s !== slug);
      const updated = [slug, ...filtered].slice(0, 6);
      localStorage.setItem('clouse-recent', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('clouse-recent-updated', { detail: updated }));
    } catch {}
    onClose();
  };

  if (!isOpen) return null;

  const placeholder =
    locale === 'pt-br'
      ? 'Buscar 67 ferramentas... (ex: json, idade, porcentagem)'
      : 'Search all 67 tools... (e.g. json, age, percentage)';

  return (
    <div
      className="search-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="search-panel">
        <div className="search-row">
          <Icon name="search" size={22} />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={placeholder}
          />
          <span className="search-hint">ESC</span>
        </div>

        <div className="search-results">
          {results.length > 0 ? (
            results.map((tool, index) => {
              const catObj = getLocalizedCategoryById(tool.cat, locale);
              const catName = catObj?.name || tool.cat;
              return (
                <Link
                  key={tool.slug}
                  href={`/${locale}/tool/${tool.slug}`}
                  className={`sr-item ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => handleItemClick(tool.slug)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="sr-icn">
                    <Icon name={tool.icon} size={18} />
                  </div>
                  <div className="sr-text">
                    <div className="sr-title">{tool.name}</div>
                    <div className="sr-desc">{tool.desc}</div>
                  </div>
                  <span className="sr-cat">{catName}</span>
                </Link>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Icon name="search" size={32} />
              <p style={{ marginTop: 12, color: 'var(--ink-2)' }}>
                {locale === 'pt-br' ? 'Nenhuma ferramenta encontrada.' : 'No tools found.'}
              </p>
            </div>
          )}
        </div>

        <div className="search-footer">
          <div className="sf-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> <span>{locale === 'pt-br' ? 'Navegar' : 'Navigate'}</span>
          </div>
          <div className="sf-hint">
            <kbd>↵</kbd> <span>{locale === 'pt-br' ? 'Selecionar' : 'Select'}</span>
          </div>
          <div className="sf-hint">
            <kbd>ESC</kbd> <span>{locale === 'pt-br' ? 'Fechar' : 'Close'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
