import React from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export default function NotFound() {
  return (
    <section className="page-hero not-found">
      <span className="nf-art" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" focusable="false">
          <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="1.4" opacity="0.3" />
          <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="1.4" opacity="0.18" />
          <path d="M60 30 L68 60 L60 90 L52 60 Z" fill="currentColor" opacity="0.45" />
          <path d="M60 30 L68 60 L52 60 Z" fill="currentColor" />
          <circle cx="60" cy="60" r="3.4" fill="currentColor" />
        </svg>
      </span>

      <div className="eyebrow">
        <span className="dot" />
        <span>Error 404</span>
      </div>
      <h1 className="h-display">Signal lost.</h1>
      <p className="lead nf-lead">
        The tool or page you requested could not be found. It may have been moved, renamed, or never existed.
        Every one of the 67 instruments is still one search away.
      </p>
      <div className="cta-actions">
        <Link href="/" className="btn btn-primary">
          <Icon name="world" size={18} />
          <span>Return Home</span>
        </Link>
        <Link href="/tools" className="btn btn-ghost">
          <Icon name="search" size={18} />
          <span>Browse All 67 Tools</span>
        </Link>
      </div>
    </section>
  );
}
