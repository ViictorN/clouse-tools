'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchTools } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/EmptyState';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';
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
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
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
            <div className="hero-search no-go" style={{ margin: 0 }}>
              <span className="hs-icon" aria-hidden="true">
                <Icon name="search" size={20} />
              </span>
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
                  className="hs-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear query"
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
                ? `Found ${results.length} results for "${query}"`
                : `Showing all ${results.length} tools`}
            </h2>
            <Link href="/tools" className="link-arrow">
              <span>Directory view</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </Reveal>

          {results.length > 0 ? (
            <div className="tools-grid" data-reveal-group>
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} className="reveal-fade" />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No tools found matching “${query}”`}
              hint="Try searching for a broader term like “convert”, “math”, or “code”."
              actionLabel="Reset search"
              onAction={() => setQuery('')}
            />
          )}
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
