'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export function MobileActionDock() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mobile-dock" aria-label="Mobile quick actions">
      <button
        type="button"
        className="mobile-dock-btn search-trigger"
        onClick={openSearch}
      >
        <Icon name="search" size={17} />
        <span>Search 67 Tools...</span>
        <kbd>⌘K</kbd>
      </button>

      <Link href="/tools" className="mobile-dock-btn pill-btn" aria-label="Directory">
        <Icon name="dice-5" size={17} />
        <span>Tools</span>
      </Link>

      {showScrollTop && (
        <button
          type="button"
          className="mobile-dock-btn icon-only"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <Icon name="arrow-up-right" size={17} />
        </button>
      )}
    </div>
  );
}
