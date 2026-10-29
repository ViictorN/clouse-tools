/**
 * Motion vocabulary shared by JS-driven touches (counts, caret blinks, reveal
 * stagger). CSS owns the long transitions; these constants keep every scripted
 * movement on the same easing family as the token set in globals.css.
 */

export const EASE = {
  /** Apple-style settle: fast start, graceful stop. */
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Symmetric in/out for reversible moves. */
  inOut: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Slight overshoot for tactile press feedback. */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const DURATION = {
  micro: 120,
  component: 200,
  section: 350,
  hero: 500,
  readout: 150,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Drives a numeric count-up; returns a cancel function. Reduced motion lands instantly. */
export function countUp(
  el: HTMLElement,
  target: number,
  options: { duration?: number; suffix?: string; prefix?: string; decimals?: number } = {},
): () => void {
  const { duration = 1600, suffix = '', prefix = '', decimals = 0 } = options;
  const reduced = prefersReducedMotion();
  const render = (value: number) => {
    el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
  };
  if (reduced) {
    render(target);
    return () => {};
  }
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    render(target * eased);
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
