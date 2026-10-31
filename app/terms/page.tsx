import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { getCanonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for Clouse Tools: free, browser-based tools provided as-is without tracking.',
  alternates: {
    canonical: getCanonicalUrl('/en/terms'),
    languages: {
      'en-US': getCanonicalUrl('/en/terms'),
      'pt-BR': getCanonicalUrl('/pt-br/terms'),
    },
  },
};

export default function TermsPage() {
  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/en">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Terms</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Legal</span>
          </div>
          <h1 className="h-d2">Terms of Use</h1>
          <p className="lead">
            Last updated: October 2026. Clear, fair, and transparent terms for everyone.
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Clouse Tools, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the website.
          </p>

          <h2>2. Permitted Use</h2>
          <p>
            Clouse Tools provides utilities for personal, educational, and commercial productivity. You may use our tools freely for any lawful purpose without fees or mandatory subscriptions.
          </p>

          <div className="card-note">
            <strong>Usage Guidelines:</strong> Automated scraping or distributed denial-of-service attacks that degrade availability for other users are strictly prohibited.
          </div>

          <h2>3. Intellectual Property</h2>
          <p>
            The interface, brand marks, and underlying software are the intellectual property of Clouse Tools. The outputs, calculations, transformed text, and files you generate belong exclusively to you.
          </p>

          <h2>4. Disclaimer of Warranties</h2>
          <p>
            Clouse Tools is provided &ldquo;as is&rdquo; without warranties of any kind, whether express or implied. While we strive for mathematical and algorithmic precision, we recommend verifying critical calculations for financial, legal, or medical applications.
          </p>
        </div>
      </section>
    </>
  );
}
