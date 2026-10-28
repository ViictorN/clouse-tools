'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function ToolCard({ tool }: { tool: Tool }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isFav, setIsFav] = useState(false);

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
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
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

  return (
    <Link
      ref={cardRef}
      href={`/tool/${tool.slug}`}
      className={`t-card ${tool.popular ? 'popular' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={handleCardClick}
      aria-label={`Open ${tool.name}`}
    >
      <button
        type="button"
        className={`fav-btn ${isFav ? 'active' : ''}`}
        onClick={toggleFavorite}
        aria-label={isFav ? `Remove ${tool.name} from pinned favorites` : `Pin ${tool.name} to favorites`}
        title={isFav ? 'Remove from favorites' : 'Pin to favorites'}
      >
        <Icon name={isFav ? 'star-filled' : 'star'} size={15} />
      </button>

      <div className="tile-icn soft">
        <Icon name={tool.icon} size={26} />
      </div>
      <div>
        <h3>{tool.name}</h3>
      </div>
      <p>{tool.desc}</p>
      <div className="t-foot">
        <span className="t-cat">{tool.cat}</span>
        <span className="t-go" aria-hidden="true">
          <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </Link>
  );
}
