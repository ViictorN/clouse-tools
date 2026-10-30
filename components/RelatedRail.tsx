'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { Tool } from '@/lib/data';
import { Locale } from '@/lib/i18n';
import { ToolCard } from './ToolCard';

interface RelatedRailProps {
  tools: Tool[];
  title: string;
  locale?: Locale;
}

/**
 * Related tools as a snap rail with keyboard-accessible arrows. The rail is
 * still scrollable by trackpad, touch and keyboard (focusable container).
 */
export function RelatedRail({ tools, title, locale = 'en' }: RelatedRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
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
    el.scrollBy({ left: dir * Math.min(720, el.clientWidth * 0.8), behavior: 'smooth' });
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
      <div className="rail-track" ref={railRef} tabIndex={0} role="region" aria-label={title}>
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} locale={locale} />
        ))}
      </div>
    </div>
  );
}
