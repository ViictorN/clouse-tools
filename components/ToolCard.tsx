'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedTool, getLocalizedCategoryById } from '@/lib/translations';
import { prefersReducedMotion } from '@/lib/motion';
import { useInView } from '@/hooks/use-in-view';

export function ToolCard({ tool, locale: propLocale, className = '' }: { tool: Tool; locale?: Locale; className?: string }) {
  const { ref: cardRef, inView } = useInView<HTMLAnchorElement>();
  const [isFav, setIsFav] = useState(false);
  const [pop, setPop] = useState(false);
  const pathname = usePathname();

  const tiltAllowed =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: fine)').matches &&
    !prefersReducedMotion();

  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');
  const localizedTool = getLocalizedTool(tool, locale);
  const category = getLocalizedCategoryById(tool.cat, locale);
  const categoryName = category?.name || tool.cat;

  useEffect(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('clouse-favorites') || '[]');
      setIsFav(favs.includes(tool.slug));
    } catch {
      // ignore storage access errors
    }

    const handleFavChange = () => {
      try {
        const favs: string[] = JSON.parse(localStorage.getItem('clouse-favorites') || '[]');
        setIsFav(favs.includes(tool.slug));
      } catch {}
    };

    window.addEventListener('clouse-favorites-updated', handleFavChange);
    return () => window.removeEventListener('clouse-favorites-updated', handleFavChange);
  }, [tool.slug]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    if (tiltAllowed) {
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      card.style.setProperty('--ry', `${px * 5}deg`);
      card.style.setProperty('--rx', `${-py * 4}deg`);
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('clouse-favorites') || '[]');
      let updated: string[];
      if (favs.includes(tool.slug)) {
        updated = favs.filter((s) => s !== tool.slug);
      } else {
        updated = [...favs, tool.slug];
      }
      localStorage.setItem('clouse-favorites', JSON.stringify(updated));
      setIsFav(updated.includes(tool.slug));
      window.dispatchEvent(new CustomEvent('clouse-favorites-updated', { detail: updated }));
      setPop(true);
      window.setTimeout(() => setPop(false), 600);
    } catch {}
  };

  const handleCardClick = () => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem('clouse-recent') || '[]');
      const filtered = recent.filter((s) => s !== tool.slug);
      const updated = [tool.slug, ...filtered].slice(0, 6);
      localStorage.setItem('clouse-recent', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('clouse-recent-updated', { detail: updated }));
    } catch {}
  };

  const ariaLabel =
    locale === 'pt-br'
      ? `Abrir ${localizedTool.name}`
      : `Open ${localizedTool.name}`;

  return (
    <Link
      ref={cardRef}
      href={`/${locale}/tool/${tool.slug}`}
      className={`t-card ${tool.popular ? 'popular' : ''} ${className} ${inView ? 'is-in' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`fav-btn ${isFav ? 'active' : ''} ${pop ? 'pop' : ''}`}
        onClick={toggleFavorite}
        aria-label={
          isFav
            ? locale === 'pt-br'
              ? `Remover ${localizedTool.name} dos favoritos`
              : `Remove ${localizedTool.name} from pinned favorites`
            : locale === 'pt-br'
              ? `Fixar ${localizedTool.name} nos favoritos`
              : `Pin ${localizedTool.name} to favorites`
        }
        title={
          isFav
            ? locale === 'pt-br'
              ? 'Remover dos favoritos'
              : 'Remove from favorites'
            : locale === 'pt-br'
              ? 'Fixar nos favoritos'
              : 'Pin to favorites'
        }
      >
        <Icon name={isFav ? 'star-filled' : 'star'} size={15} />
        <span className="burst" aria-hidden="true" />
      </button>

      <div className="tile-icn soft">
        <Icon name={tool.icon} size={26} />
      </div>
      <div>
        <h3>{localizedTool.name}</h3>
      </div>
      <p>{localizedTool.desc}</p>
      <div className="t-foot">
        <span className="t-cat">{categoryName}</span>
        <span className="t-go" aria-hidden="true">
          <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </Link>
  );
}
