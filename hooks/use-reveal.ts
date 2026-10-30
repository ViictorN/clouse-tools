'use client';
import { useEffect } from 'react';

/**
 * Arms the reveal engine: the `data-reveal="ready"` attribute on <html> is the
 * only switch CSS needs to hide reveal targets. Per-element `is-in` state is
 * owned by React through the Reveal component / useInView hook, so hydration
 * never sees patched classes. Without JS the attribute is absent and every
 * reveal target renders visible.
 */
export function useReveal(): void {
  useEffect(() => {
    document.documentElement.setAttribute('data-reveal', 'ready');
  }, []);
}
