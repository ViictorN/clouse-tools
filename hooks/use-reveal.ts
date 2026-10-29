'use client';
import { useEffect } from 'react';

/**
 * Scroll-reveal engine, CSS-first.
 *
 * Marks the document `data-reveal="ready"` on mount (that attribute is what
 * hides reveal targets, so without JS everything renders visible), then flips
 * `.is-in` on elements as they enter the viewport. Children of a
 * `[data-reveal-group]` get an incremental `--reveal-d` so siblings cascade.
 * Under `prefers-reduced-motion` the global CSS collapses transitions to ~0s,
 * so reveals land instantly.
 */
export function useReveal(): void {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-reveal', 'ready');

    const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal-group]'));
    for (const group of groups) {
      const items = group.querySelectorAll<HTMLElement>('.reveal, .reveal-fade');
      items.forEach((item, index) => {
        item.style.setProperty('--reveal-d', `${Math.min(index, 8) * 0.07}s`);
      });
    }

    const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .reveal-fade'));
    if (!('IntersectionObserver' in window) || targets.length === 0) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    for (const el of targets) observer.observe(el);

    // Route changes swap content: re-mark anything newly above the fold.
    const revealAdded = () => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-in), .reveal-fade:not(.is-in)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) el.classList.add('is-in');
        else observer.observe(el);
      });
    };
    window.addEventListener('pageshow', revealAdded);

    return () => {
      observer.disconnect();
      window.removeEventListener('pageshow', revealAdded);
    };
  }, []);
}
