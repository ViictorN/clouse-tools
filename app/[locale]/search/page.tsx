'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/EmptyState';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedTools } from '@/lib/translations';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';
  const isPt = locale === 'pt-br';

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const allTools = useMemo(() => getLocalizedTools(locale), [locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTools;
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.kw.toLowerCase().includes(q) ||
        t.cat.toLowerCase().includes(q)
    );
  }, [allTools, query]);

  const placeholder = isPt
    ? 'Buscar ferramentas (ex: json, idade, porcentagem, unidade)...'
    : 'Search tools (e.g. json, age, percentage, unit)...';

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Buscar' : 'Search'}</span>
          </nav>

          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Busca Instantânea' : 'Instant Search'}</span>
          </div>

          <h1 className="h-d2">{isPt ? 'Encontre Qualquer Ferramenta' : 'Find Any Tool'}</h1>
          <p className="lead">
            {isPt
              ? 'Busque entre todos os 67 utilitários por palavra-chave, funcionalidade ou categoria.'
              : 'Search across all 67 utilities by keyword, function, or domain.'}
          </p>

          <div style={{ maxWidth: 620, margin: '28px auto 0' }}>
            <div className="hero-search no-go" style={{ margin: 0 }}>
              <span className="hs-icon" aria-hidden="true">
                <Icon name="search" size={20} />
              </span>
              <input
                type="search"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                aria-label={placeholder}
              />
              {query && (
                <button
                  type="button"
                  className="hs-clear"
                  onClick={() => setQuery('')}
                  aria-label={isPt ? 'Limpar busca' : 'Clear query'}
                >
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <Reveal className="section-head-row">
            <h2 className="result-count">
              {query
                ? isPt
                  ? `${results.length} resultado(s) para "${query}"`
                  : `Found ${results.length} result(s) for "${query}"`
                : isPt
                  ? `Exibindo todas as ${results.length} ferramentas`
                  : `Showing all ${results.length} tools`}
            </h2>
            <Link href={`/${locale}/tools`} className="link-arrow">
              <span>{isPt ? 'Ver diretório completo' : 'Directory view'}</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </Reveal>

          {results.length > 0 ? (
            <div className="tools-grid" data-reveal-group>
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} locale={locale} className="reveal-fade" />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                isPt
                  ? `Nenhuma ferramenta encontrada para "${query}"`
                  : `No tools found matching "${query}"`
              }
              hint={
                isPt
                  ? 'Tente termos mais amplos como "converter", "matemática" ou "código".'
                  : 'Try searching for a broader term like "convert", "math", or "code".'
              }
              actionLabel={isPt ? 'Limpar busca' : 'Reset search'}
              onAction={() => setQuery('')}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default function LocalizedSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
          Loading search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
