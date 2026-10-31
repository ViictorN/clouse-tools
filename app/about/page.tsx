import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { getCanonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Clouse Tools',
  description:
    'The story behind Clouse Tools: 67 free, private, client-side tools designed for everyday productivity without compromise.',
  alternates: {
    canonical: getCanonicalUrl('/en/about'),
    languages: {
      'en-US': getCanonicalUrl('/en/about'),
      'pt-BR': getCanonicalUrl('/pt-br/about'),
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/en">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>About</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>About Us</span>
          </div>
          <h1 className="h-d2">About Clouse Tools</h1>
          <p className="lead">
            Simple tools. Real productivity. Free, forever, for everyone.
          </p>
          <div className="page-hero-cta">
            <Link href="/en/tools" className="btn btn-primary">
              <span>Explore 67 Tools</span>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <p>
            <strong>Clouse Tools</strong> is a library of 67 free online utilities built around one simple principle: the shortest path from a question to an answer. No sign-up walls, no cookies, no tracking, and no upsells — you open a tool, you type, and you get your answer instantly.
          </p>

          <div className="card-note">
            <strong>Our fundamental promise:</strong> every tool runs 100% inside your browser. Your text, dates, passwords, tokens, and images are processed locally on your device and never uploaded to any remote server.
          </div>

          <h2>Why We Built It</h2>
          <p>
            The modern web is filled with utility sites wrapped in intrusive ads, multi-step popups, mandatory email captures, and slow page loads. We wanted the opposite: an Apple-calibrated, high-contrast, distraction-free environment that treats your time and privacy with total respect.
          </p>

          <h2>Six Essential Categories</h2>
          <p>
            Whether you are calculating compound interest, formatting minified JSON, generating cryptographically secure UUIDs, converting culinary units, or calculating age intervals to the exact second, Clouse Tools has a purpose-built utility ready in under 50 milliseconds.
          </p>

          <h2>Privacy By Design (Zero Telemetry)</h2>
          <p>
            We do not track you. We do not store your clipboard, we do not log your calculations, and we do not use third-party analytics scripts. The code you execute is delivered directly to your device via edge CDN and runs client-side inside a secure, sandboxed browser environment.
          </p>

          <div style={{ marginTop: '2.5rem' }}>
            <Link href="/en/tools" className="btn btn-primary">
              <span>Start Using Clouse Tools</span>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
