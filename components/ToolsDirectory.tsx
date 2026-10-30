'use client';
import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedCategories, getLocalizedTools } from '@/lib/translations';

export function ToolsDirectory({ initialCategory = 'all' }: { initialCategory?: string }) {
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  const categories = useMemo(() => getLocalizedCategories(locale), [locale]);
  const allTools = useMemo(() => getLocalizedTools(locale), [locale]);

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

  const allLabel = locale === 'pt-br' ? `Todas (${allTools.length})` : `All (${allTools.length})`;
  const placeholder =
    locale === 'pt-br'
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

      <div style={{ maxWidth: 520, margin: '0 auto 36px' }}>
        <div className="hero-search no-go" style={{ margin: 0 }}>
          <span className="hs-icon" aria-hidden="true">
            <Icon name="search" size={20} />
          </span>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={placeholder}
          />
          {searchQuery && (
            <button
              type="button"
              className="hs-clear"
              onClick={() => setSearchQuery('')}
              aria-label={locale === 'pt-br' ? 'Limpar busca' : 'Clear search'}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <>
          <h2 className="result-count dir-count">
            {locale === 'pt-br'
              ? `${filteredTools.length} de ${allTools.length} ferramentas`
              : `${filteredTools.length} of ${allTools.length} tools`}
          </h2>
          <div className="tools-grid" data-reveal-group>
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} locale={locale} className="reveal-fade" />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={
            locale === 'pt-br' ? 'Nenhuma ferramenta encontrada' : 'No tools matched your search'
          }
          hint={
            locale === 'pt-br'
              ? 'Tente buscar com outros termos ou selecione outra categoria.'
              : 'Try adjusting your search terms or browse all categories.'
          }
          actionLabel={locale === 'pt-br' ? 'Ver Todas as 67 Ferramentas' : 'Reset Filters'}
          onAction={() => {
            setSearchQuery('');
            setSelectedCat('all');
          }}
        />
      )}
    </>
  );
}
