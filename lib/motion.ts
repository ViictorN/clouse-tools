import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * CLOUSE TOOLS — Professional Motion Design System
 * Inspired by Locomotive, Resn, Active Theory & Aristide Benoist.
 * Zero WebGL/particles/AI-cliches; pure intentional typography, choreographed
 * sequences, responsive scroll mechanics and high-precision micro-interactions.
 */

// Safe client-side registration
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const EASE = {
  /** Editorial settle: bold, fast start with graceful decel (Locomotive / Apple) */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Smooth symmetric in-out for reversible moves */
  inOut: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Controlled organic spring for micro-press and badges (no childish bounce) */
  spring: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
  /** Rapid micro-interaction easing */
  micro: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Fast exit easing */
  snappy: 'cubic-bezier(0.7, 0, 0.84, 0)',
} as const;

export const DURATION = {
  instant: 0,
  micro: 140,
  component: 240,
  section: 420,
  hero: 680,
  readout: 150,
  editorial: 950,
} as const;

export const GSAP_EASE = {
  expo: 'expo.out',
  editorial: 'power4.out',
  smooth: 'power3.out',
  micro: 'power2.out',
  snappy: 'power3.inOut',
} as const;

export const STAGGER = {
  lines: 0.08,
  words: 0.035,
  cards: 0.06,
  chips: 0.04,
  list: 0.05,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Get initialized GSAP and ScrollTrigger instance safely */
export function getMotionEngine() {
  if (typeof window === 'undefined') {
    return { gsap: null, ScrollTrigger: null };
  }
  return { gsap, ScrollTrigger };
}

/**
 * Masked line entrance for editorial headlines.
 * Slides text upwards from an overflow-hidden wrapper with high-tension deceleration.
 */
export function animateLineReveal(
  elements: HTMLElement[] | NodeListOf<HTMLElement> | string,
  options: {
    delay?: number;
    stagger?: number;
    duration?: number;
    onComplete?: () => void;
  } = {},
): gsap.core.Tween | null {
  if (prefersReducedMotion() || typeof window === 'undefined') {
    if (options.onComplete) options.onComplete();
    return null;
  }

  const { delay = 0.05, stagger = STAGGER.lines, duration = 0.95, onComplete } = options;

  return gsap.fromTo(
    elements,
    {
      y: '115%',
      opacity: 0,
      rotateX: 4,
    },
    {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      duration,
      stagger,
      delay,
      ease: GSAP_EASE.editorial,
      clearProps: 'transform,opacity,rotateX',
      onComplete,
    },
  );
}

/**
 * Scroll-triggered sequence wrapper that respects reduced-motion and cleans up properly.
 */
export function createScrollTrigger(
  trigger: HTMLElement | string,
  animation: gsap.core.Animation | ((self: ScrollTrigger) => void),
  options: {
    start?: string;
    end?: string;
    scrub?: boolean | number;
    pin?: boolean | HTMLElement | string;
    toggleActions?: string;
    markers?: boolean;
    onEnter?: () => void;
    onLeave?: () => void;
  } = {},
): ScrollTrigger | null {
  if (prefersReducedMotion() || typeof window === 'undefined') return null;

  const {
    start = 'top 85%',
    end = 'bottom 15%',
    scrub = false,
    pin = false,
    toggleActions = 'play none none none',
    markers = false,
  } = options;

  if (typeof animation === 'function') {
    return ScrollTrigger.create({
      trigger,
      start,
      end,
      scrub,
      pin,
      markers,
      onEnter: (self) => animation(self),
    });
  }

  return ScrollTrigger.create({
    trigger,
    animation,
    start,
    end,
    scrub,
    pin,
    toggleActions,
    markers,
  });
}

/**
 * Drives a numeric count-up with high precision and smooth deceleration.
 * Reduced motion lands on target immediately.
 */
export function countUp(
  el: HTMLElement,
  target: number,
  options: { duration?: number; suffix?: string; prefix?: string; decimals?: number } = {},
): () => void {
  const { duration = 1400, suffix = '', prefix = '', decimals = 0 } = options;
  const reduced = prefersReducedMotion();

  const render = (value: number) => {
    el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
  };

  if (reduced) {
    render(target);
    return () => {};
  }

  const state = { value: 0 };
  const tween = gsap.to(state, {
    value: target,
    duration: duration / 1000,
    ease: GSAP_EASE.smooth,
    onUpdate: () => render(state.value),
    onComplete: () => render(target),
  });

  return () => {
    tween.kill();
  };
}
