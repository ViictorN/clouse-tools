'use client';
import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ToolCard } from '@/components/ToolCard';
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
        <div className="hero-search" style={{ margin: 0 }}>
          <Icon name="search" size={20} />
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
              className="btn btn-sm btn-subtle"
              onClick={() => setSearchQuery('')}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              {locale === 'pt-br' ? 'Limpar' : 'Clear'}
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
        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Icon name="search" size={42} />
          <h3 style={{ marginTop: 16 }}>
            {locale === 'pt-br' ? 'Nenhuma ferramenta encontrada' : 'No tools matched your search'}
          </h3>
          <p style={{ color: 'var(--text-sub)', marginTop: 8 }}>
            {locale === 'pt-br'
              ? 'Tente buscar com outros termos ou selecione outra categoria.'
              : 'Try adjusting your search terms or browse all categories.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => {
              setSearchQuery('');
              setSelectedCat('all');
            }}
          >
            {locale === 'pt-br' ? 'Ver Todas as 67 Ferramentas' : 'Reset Filters'}
          </button>
        </div>
      )}
    </>
  );
}
