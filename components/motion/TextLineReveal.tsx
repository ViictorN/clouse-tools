'use client';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GSAP_EASE, STAGGER, prefersReducedMotion } from '@/lib/motion';

interface TextLineRevealProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  className?: string;
  lineClassNames?: string[];
  delay?: number;
  stagger?: number;
}

/**
 * Editorial masked typography reveal.
 * Wraps each line in an overflow-hidden box and rises with power4 deceleration.
 * Eliminates layout shifts and preserves SSR text structure.
 */
export function TextLineReveal({
  lines,
  as: Tag = 'h1',
  className = '',
  lineClassNames,
  delay = 0.05,
  stagger = STAGGER.lines,
}: TextLineRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;

    const lineSpans = containerRef.current.querySelectorAll<HTMLElement>('.editorial-line-inner');
    if (!lineSpans.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineSpans,
        {
          y: '115%',
          opacity: 0,
        },
        {
          y: '0%',
          opacity: 1,
          duration: 0.95,
          stagger,
          delay,
          ease: GSAP_EASE.editorial,
          clearProps: 'transform,opacity',
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [lines, delay, stagger]);

  return (
    <Tag ref={containerRef as any} className={`editorial-line-container ${className}`.trim()}>
      {lines.map((line, idx) => (
        <span key={idx} className="editorial-line-mask">
          <span
            className={`editorial-line-inner ${lineClassNames?.[idx] || ''}`.trim()}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
