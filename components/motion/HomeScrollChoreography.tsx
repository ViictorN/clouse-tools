'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GSAP_EASE, STAGGER, prefersReducedMotion } from '@/lib/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Editorial Scroll Choreography for Homepage Sections.
 * Binds GSAP ScrollTrigger to:
 * 1. Category strip entrance (subtle upward stagger)
 * 2. Essentials cards elevation & specularity
 * 3. Black banner ribbon ambient scrub (subtle horizontal drift)
 * Automatically disabled under prefers-reduced-motion.
 */
export function HomeScrollChoreography() {
  const initialized = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion() || typeof window === 'undefined') return;
    if (initialized.current) return;
    initialized.current = true;

    const ctx = gsap.context(() => {
      // 1. Categories Section Stagger
      const catCards = document.querySelectorAll('.section-categories-strip .cat-card-row');
      if (catCards.length > 0) {
        gsap.fromTo(
          catCards,
          {
            y: 28,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: STAGGER.cards,
            ease: GSAP_EASE.smooth,
            scrollTrigger: {
              trigger: '.section-categories-strip',
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          },
        );
      }

      // 2. Essentials Cards Staggered Reveal
      const essentialCards = document.querySelectorAll('.section-essentials .essential-card');
      if (essentialCards.length > 0) {
        gsap.fromTo(
          essentialCards,
          {
            y: 35,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: GSAP_EASE.smooth,
            scrollTrigger: {
              trigger: '.section-essentials',
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          },
        );
      }

      // 3. Black Feature Banner: Ambient SVG Ribbon Scrub
      const ribbonSvg = document.querySelector('.black-banner-ribbon svg');
      if (ribbonSvg) {
        gsap.fromTo(
          ribbonSvg,
          {
            x: -25,
            rotate: -1,
          },
          {
            x: 25,
            rotate: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.section-black-banner',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          },
        );
      }

      // 4. Use Cases Section Cards
      const caseCards = document.querySelectorAll('.use-cases-grid .case-card');
      if (caseCards.length > 0) {
        gsap.fromTo(
          caseCards,
          {
            y: 30,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: GSAP_EASE.smooth,
            scrollTrigger: {
              trigger: '.use-cases-section',
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          },
        );
      }
    });

    return () => {
      ctx.revert();
      initialized.current = false;
    };
  }, []);

  return null;
}
