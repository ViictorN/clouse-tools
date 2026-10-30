'use client';
import React from 'react';
import { useInView } from '@/hooks/use-in-view';

type RevealVariant = 'reveal' | 'reveal-fade' | 'reveal-scale';

interface RevealProps {
  children: React.ReactNode;
  /** Motion shape; defaults to a settle fade. */
  variant?: RevealVariant;
  /** Extra classes for layout/styling (e.g. "section-head"). */
  className?: string;
  /** Stagger in seconds; `0` renders no inline style at all. */
  delay?: number;
  /** Emits `data-reveal-group` so CSS can stagger direct children. */
  group?: boolean;
  /** Element to render; defaults to a div. */
  as?: React.ElementType;
}

/**
 * Scroll-reveal wrapper. Renders its `is-in` state through React (never by
 * patching the DOM), so hydration stays clean and reduced-motion still lands
 * instantly via the global CSS guard.
 */
export function Reveal({
  children,
  variant = 'reveal-fade',
  className = '',
  delay = 0,
  group = false,
  as: Tag = 'div',
}: RevealProps) {
  const { ref, inView } = useInView();

  return (
    <Tag
      ref={ref}
      className={`${variant} ${inView ? 'is-in' : ''} ${className}`.trim()}
      style={delay > 0 ? ({ '--reveal-d': `${delay}s` } as React.CSSProperties) : undefined}
      {...(group ? { 'data-reveal-group': '' } : {})}
    >
      {children}
    </Tag>
  );
}
