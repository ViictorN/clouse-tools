'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchTools } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { Icon } from '@/lib/icons';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const results = useMemo(() => {
    return searchTools(query);
  }, [query]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Search</span>
          </nav>

          <div className="eyebrow">
            <span className="dot" />
            <span>Instant Search</span>
          </div>

          <h1 className="h-d2">Find Any Tool</h1>
          <p className="lead">
            Search across all 67 utilities by keyword, function, or domain.
          </p>

          <div style={{ maxWidth: 620, margin: '28px auto 0' }}>
            <div className="hero-search" style={{ margin: 0 }}>
              <Icon name="search" size={22} />
              <input
                type="search"
                placeholder="Search tools (e.g. json, age, percentage, unit)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{ padding: '6px 10px', color: 'var(--ink-3)' }}
                  aria-label="Clear query"
                >
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <div className="section-head-row">
            <div className="result-count">
              {query
                ? `Found ${results.length} results for "${query}"`
                : `Showing all ${results.length} tools`}
            </div>
            <Link href="/tools" className="link-arrow">
              <span>Directory view</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>

          <div className="tools-grid">
            {results.length > 0 ? (
              results.map((tool) => <ToolCard key={tool.slug} tool={tool} />)
            ) : (
              <div className="sr-empty" style={{ gridColumn: '1 / -1', padding: '60px 20px' }}>
                <b>No tools found matching &ldquo;{query}&rdquo;</b>
                <p style={{ marginTop: 8 }}>
                  Try searching for a broader term like &ldquo;convert&rdquo;, &ldquo;math&rdquo;, or &ldquo;code&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
