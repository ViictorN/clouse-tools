import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { Icon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'All 67 Tools — Directory',
  description:
    'Browse all 67 free, fast, private online tools for mathematics, text editing, date calculation, unit conversion, developer formatting, and graphic design.',
};

export default function ToolsPage() {
  return (
    <>
      <section className="page-hero">
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
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <h2 className="sr-only">Tools directory</h2>
          <ToolsDirectory />
        </div>
      </section>
    </>
  );
}
