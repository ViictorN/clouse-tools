import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Clouse Tools: 100% client-side computation with zero data collection.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Privacy</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Privacy & Security</span>
          </div>
          <h1 className="h-d2">Privacy Policy</h1>
          <p className="lead">The shortest, clearest privacy policy you will read today.</p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <div className="card-note">
            <strong>TL;DR:</strong> We do not collect your data. We cannot see your data. Your files, text, numbers, and generated results are processed entirely in your browser and never leave your device.
          </div>

          <h2>What happens when you use a tool</h2>
          <p>
            Every calculation — from percentage math to JSON formatting and image compression — runs as local JavaScript in your browser window. When you resize an image or extract a color palette, the file is read in-memory and rendered to an HTML5 canvas element. <strong>No file upload ever occurs.</strong>
          </p>

          <h2>What we do not have</h2>
          <ul>
            <li>No user accounts, profiles, or sign-up forms — so we store no names, emails, or credentials.</li>
            <li>No invasive trackers, advertising networks, or user fingerprinting scripts.</li>
            <li>No database storing your inputs or outputs — there is no backend server receiving your requests.</li>
            <li>No tracking cookies set on your browser.</li>
          </ul>

          <h2>Self-Hosted &amp; Private</h2>
          <p>
            In our Next.js architecture, fonts and static assets are bundled directly with the application rather than requested through external third-party tracking CDNs, guaranteeing maximum speed and privacy.
          </p>

          <h2>Total User Control</h2>
          <p>
            Because execution is purely client-side, closing the browser tab completely clears your active calculation state. There is simply nothing on any remote server to leak, breach, or sell.
          </p>

          <p>
            Questions? Contact: <strong>hello@clouse.tools</strong>
          </p>
        </div>
      </section>
    </>
  );
}
