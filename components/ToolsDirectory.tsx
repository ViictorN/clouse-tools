'use client';
import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Tool, Category } from '@/lib/data';
import { ToolCard } from './ToolCard';
import { Icon } from '@/lib/icons';
import { EmptyState } from './EmptyState';
import { Locale } from '@/lib/i18n';
import { getLocalizedTools, getLocalizedCategories } from '@/lib/translations';

interface ToolsDirectoryProps {
  initialTools?: Tool[];
  initialCategory?: string;
  locale?: Locale;
}

export function ToolsDirectory({
  initialCategory = 'all',
  locale: propLocale,
}: ToolsDirectoryProps) {
  const pathname = usePathname();
  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');
  const isPt = locale === 'pt-br';

  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const allTools = useMemo(() => getLocalizedTools(locale), [locale]);
  const categories = useMemo(() => getLocalizedCategories(locale), [locale]);

  const filteredTools = useMemo(() => {
    let list = allTools;

    if (selectedCat !== 'all') {
      list = list.filter((t) => t.cat === selectedCat);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.kw.toLowerCase().includes(q) ||
          t.cat.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allTools, selectedCat, searchQuery]);

  const allLabel = isPt ? `Todas (${allTools.length})` : `All (${allTools.length})`;
  const placeholder = isPt
    ? 'Filtrar ferramentas por nome, tag ou categoria...'
    : 'Filter tools by name, tag or category...';

  return (
    <>
      <div className="filter-bar" role="tablist" aria-label="Tool category filters">
        <button
          type="button"
          className={`fchip ${selectedCat === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCat('all')}
          role="tab"
          aria-selected={selectedCat === 'all'}
        >
          {allLabel}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`fchip ${selectedCat === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCat(cat.id)}
            role="tab"
            aria-selected={selectedCat === cat.id}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto 36px', width: '100%' }}>
        <div className="directory-filter-pill-wrap">
          <span className="hs-icon" aria-hidden="true">
            <Icon name="search" size={18} />
          </span>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={placeholder}
            className="directory-filter-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="hs-clear"
              onClick={() => setSearchQuery('')}
              aria-label={isPt ? 'Limpar busca' : 'Clear search'}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <div className="tools-grid">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={isPt ? 'Nenhuma ferramenta encontrada' : 'No tools found'}
          hint={
            isPt
              ? `Nenhum resultado corresponde a "${searchQuery}". Tente outro termo ou limpe os filtros.`
              : `No tools match "${searchQuery}". Try a different query or reset filters.`
          }
          actionLabel={isPt ? 'Limpar filtros' : 'Reset filters'}
          onAction={() => {
            setSelectedCat('all');
            setSearchQuery('');
          }}
        />
      )}
    </>
  );
}
