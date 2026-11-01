'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Tool } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { prefersReducedMotion } from '@/lib/motion';

interface RelatedRailProps {
  title: string;
  tools: Tool[];
  locale?: Locale;
}

/**
 * Editorial horizontal strip on tool pages. Shows sibling tools in the
 * same category. Keyboard-scrollable, honors prefers-reduced-motion.
 */
export function RelatedRail({ title, tools, locale = 'en' }: RelatedRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollHeight - 4 || el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges);
    return () => {
      el.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
    };
  }, [syncEdges]);

  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    el.scrollBy({ left: dir * Math.min(720, el.clientWidth * 0.8), behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="related-rail">
      <div className="rail-head">
        <h2>{title}</h2>
        <div className="rail-nav">
          <button
            type="button"
            className="rail-btn"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label={locale === 'pt-br' ? 'Rolar ferramentas relacionadas para a esquerda' : 'Scroll related tools left'}
          >
            <Icon name="chevron-right" size={16} />
          </button>
          <button
            type="button"
            className="rail-btn"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label={locale === 'pt-br' ? 'Rolar ferramentas relacionadas para a direita' : 'Scroll related tools right'}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
      <div className="rail-track" ref={railRef} tabIndex={0} aria-label={title}>
        {tools.map((t) => (
          <div key={t.slug} className="rail-card">
            <ToolCard tool={t} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}
