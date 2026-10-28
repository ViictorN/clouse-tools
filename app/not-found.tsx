import React from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export default function NotFound() {
  return (
    <section className="page-hero" style={{ padding: '160px 0 120px' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow">
          <span className="dot" />
          <span>Error 404</span>
        </div>
        <h1 className="h-display" style={{ margin: '18px 0' }}>Page Not Found</h1>
        <p className="lead" style={{ maxWidth: 480, margin: '0 auto 36px' }}>
          The tool or page you requested could not be found. It may have been moved or renamed.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">
            <Icon name="world" size={18} />
            <span>Return Home</span>
          </Link>
          <Link href="/tools" className="btn btn-ghost">
            <Icon name="search" size={18} />
            <span>Browse All 67 Tools</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
