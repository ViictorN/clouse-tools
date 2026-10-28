'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS, Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function HomePersonalization() {
  const [pinnedTools, setPinnedTools] = useState<Tool[]>([]);
  const [recentTools, setRecentTools] = useState<Tool[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadPersonalization = () => {
    try {
      const favSlugs: string[] = JSON.parse(localStorage.getItem('clouse-favorites') || '[]');
      const pinned = favSlugs
        .map((slug) => TOOLS.find((t) => t.slug === slug))
        .filter((t): t is Tool => Boolean(t));
      setPinnedTools(pinned);

      const recSlugs: string[] = JSON.parse(localStorage.getItem('clouse-recent') || '[]');
      const recent = recSlugs
        .map((slug) => TOOLS.find((t) => t.slug === slug))
        .filter((t): t is Tool => Boolean(t))
        .slice(0, 5);
      setRecentTools(recent);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setMounted(true);
    loadPersonalization();

    const handleFavChange = () => loadPersonalization();
    const handleRecentChange = () => loadPersonalization();

    window.addEventListener('clouse-favorites-updated', handleFavChange);
    window.addEventListener('clouse-recent-updated', handleRecentChange);

    return () => {
      window.removeEventListener('clouse-favorites-updated', handleFavChange);
      window.removeEventListener('clouse-recent-updated', handleRecentChange);
    };
  }, []);

  const clearPinned = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem('clouse-favorites');
      setPinnedTools([]);
      window.dispatchEvent(new CustomEvent('clouse-favorites-updated', { detail: [] }));
    } catch {}
  };

  const removePinnedItem = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('clouse-favorites') || '[]');
      const updated = favs.filter((s) => s !== slug);
      localStorage.setItem('clouse-favorites', JSON.stringify(updated));
      loadPersonalization();
      window.dispatchEvent(new CustomEvent('clouse-favorites-updated', { detail: updated }));
    } catch {}
  };

  if (!mounted) return null;

  return (
    <>
      {recentTools.length > 0 && (
        <div className="recent-strip" aria-label="Recently used utilities">
          <span className="recent-label">
            <Icon name="history" size={13} />
            <span>Recent:</span>
          </span>
          {recentTools.map((tool) => (
            <Link key={tool.slug} href={`/tool/${tool.slug}`} className="recent-chip">
              <Icon name={tool.icon} size={13} />
              <span>{tool.name}</span>
            </Link>
          ))}
        </div>
      )}

      {pinnedTools.length > 0 && (
        <div className="shelf-wrap" aria-label="Pinned favorites shelf">
          <div className="shelf-head">
            <div className="shelf-title">
              <Icon name="star-filled" size={17} />
              <span>Your Pinned Tools ({pinnedTools.length})</span>
            </div>
            <button
              type="button"
              className="shelf-clear"
              onClick={clearPinned}
              aria-label="Clear all pinned tools"
            >
              Clear All
            </button>
          </div>
          <div className="shelf-grid">
            {pinnedTools.map((tool) => (
              <Link key={tool.slug} href={`/tool/${tool.slug}`} className="shelf-item">
                <div className="tile-icn soft">
                  <Icon name={tool.icon} size={18} />
                </div>
                <div className="shelf-item-meta">
                  <h4>{tool.name}</h4>
                  <span>{tool.cat}</span>
                </div>
                <button
                  type="button"
                  className="fav-btn active"
                  style={{ position: 'static', width: 26, height: 26 }}
                  onClick={(e) => removePinnedItem(e, tool.slug)}
                  aria-label={`Unpin ${tool.name}`}
                  title="Unpin tool"
                >
                  <Icon name="star-filled" size={13} />
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
