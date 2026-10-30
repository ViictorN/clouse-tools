'use client';
import { useEffect, useRef } from 'react';
import { countUp } from '@/lib/motion';

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

/**
 * Animated statistic. The SSR payload holds the final value (so no-JS and
 * assistive tech read the truth), then the client counts from zero on first
 * view. Reduced motion lands instantly via lib/motion.
 */
export function CountUp({ value, prefix = '', suffix = '', decimals = 0, duration = 1600 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    started.current = true;

    const run = () => {
      countUp(el, value, { duration, prefix, suffix, decimals });
    };

    if (!('IntersectionObserver' in window)) {
      run();
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          obs.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
