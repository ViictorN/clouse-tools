import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { PaletteCtaButton } from '@/components/PaletteCtaButton';
import { CalibGrid } from '@/components/CalibGrid';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/lib/icons';
import { getCanonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'All 67 Tools — Directory',
  description:
    'Browse all 67 free, fast, private online tools for mathematics, text editing, date calculation, unit conversion, developer formatting, and graphic design.',
  alternates: {
    canonical: getCanonicalUrl('/en/tools'),
    languages: {
      'en-US': getCanonicalUrl('/en/tools'),
      'pt-BR': getCanonicalUrl('/pt-br/tools'),
    },
  },
};

export default function ToolsPage() {
  const marqueeItems = [
    { icon: 'calculator', label: 'Math & Calculators' },
    { icon: 'letter-case', label: 'Text & Prose Transformers' },
    { icon: 'clock', label: 'Date, Time & Clocks' },
    { icon: 'ruler-2', label: 'Universal Unit Converters' },
    { icon: 'code', label: 'Developer Encoders & Parsers' },
    { icon: 'palette', label: 'Graphic & Color Tools' },
    { icon: 'shield-check', label: '100% In-Browser Computation' },
  ] as const;

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/en">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Tools</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Complete Suite</span>
          </div>
          <h1 className="h-d2">
            Every tool you need. <span className="grad-blue">Instantly ready.</span>
          </h1>
          <p className="lead">
            Explore 67 finely crafted, zero-friction utilities. Everything runs locally in your
            browser with instant feedback and total data privacy.
          </p>

          <div className="page-hero-cta">
            <PaletteCtaButton locale="en" />
          </div>

          <div className="stat-ticker" aria-label="Directory statistics">
            <div className="stat-cell">
              <span className="stat-num">
                <CountUp value={67} />
              </span>
              <span className="stat-lbl">Active Tools</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">
                <CountUp value={6} />
              </span>
              <span className="stat-lbl">Categories</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">100%</span>
              <span className="stat-lbl">Client-Side</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">0 ms</span>
              <span className="stat-lbl">Server Delay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <section className="marquee-bar" aria-label="Capability Highlights">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, idx) => (
            <div key={idx} className="marquee-item">
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <ToolsDirectory locale="en" />
        </div>
      </section>
    </>
  );
}
