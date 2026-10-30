import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { PaletteCtaButton } from '@/components/PaletteCtaButton';
import { CalibGrid } from '@/components/CalibGrid';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'All 67 Tools — Directory',
  description:
    'Browse all 67 free, fast, private online tools for mathematics, text editing, date calculation, unit conversion, developer formatting, and graphic design.',
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
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Tools</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Complete Directory</span>
          </div>
          <h1 className="h-d2">All 67 Online Tools</h1>
          <p className="lead">
            Every utility in Clouse Tools is built to run entirely inside your browser. No server calls, no telemetry, instant feedback.
          </p>
          <div className="page-hero-cta">
            <PaletteCtaButton />
          </div>

          <div className="hero-stats" data-reveal-group>
            <div className="stat">
              <b>
                <CountUp value={67} />
              </b>
              <span>Tools</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={6} />
              </b>
              <span>Categories</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={0} />
              </b>
              <span>Sign-ups required</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          {[0, 1].map((track) => (
            <div className="m-track" key={track}>
              {marqueeItems.map((item) => (
                <div className="m-item" key={item.label}>
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="section section-pt-0">
        <div className="container">
          <h2 className="sr-only">Tools directory</h2>
          <ToolsDirectory />
        </div>
      </section>
    </>
  );
}
