'use client';
import React, { useState, useMemo } from 'react';
import { TOOLS, CATEGORIES, Tool } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { Icon } from '@/lib/icons';

export function ToolsDirectory() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    let list = TOOLS;

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
  }, [selectedCat, searchQuery]);

  return (
    <>
      <div className="filter-bar">
        <button
          type="button"
          className={`fchip ${selectedCat === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCat('all')}
        >
          All (67)
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`fchip ${selectedCat === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCat(cat.id)}
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
            placeholder="Filter list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter tools list"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ padding: '4px 8px', color: 'var(--ink-3)' }}
              aria-label="Clear filter"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }} className="result-count">
        Showing {filteredTools.length} of {TOOLS.length} tools
      </div>

      <div className="tools-grid">
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)
        ) : (
          <div className="sr-empty" style={{ gridColumn: '1 / -1' }}>
            <b>No tools match your criteria</b>
            <span>Try adjusting your category filter or search terms.</span>
          </div>
        )}
      </div>
    </>
  );
}
