import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { getCanonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Clouse Tools: 100% client-side computation with zero data collection.',
  alternates: {
    canonical: getCanonicalUrl('/en/privacy'),
    languages: {
      'en-US': getCanonicalUrl('/en/privacy'),
      'pt-BR': getCanonicalUrl('/pt-br/privacy'),
    },
  },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/en">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Privacy</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Legal & Privacy</span>
          </div>
          <h1 className="h-d2">Privacy Policy</h1>
          <p className="lead">
            Last updated: October 2026. Zero telemetry. Zero cookies. 100% local computation.
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <h2>1. The Short Version</h2>
          <p>
            We do not collect your personal data, we do not store your inputs, and we do not track your browsing behavior. All computations in Clouse Tools happen directly inside your browser on your device.
          </p>

          <div className="card-note">
            <strong>Key takeaway:</strong> When you paste JSON, enter passwords, calculate percentages, or convert units, that information stays in your device&apos;s memory. Nothing is transmitted to our servers or third parties.
          </div>

          <h2>2. Data We Do NOT Collect</h2>
          <p>Clouse Tools operates on a strict zero-telemetry policy:</p>
          <ul>
            <li>No analytical cookies or tracking pixels.</li>
            <li>No personal identification or account requirement.</li>
            <li>No clipboard logging or input telemetry.</li>
            <li>No remote storage of user inputs or computed results.</li>
          </ul>

          <h2>3. Local Storage & Preferences</h2>
          <p>
            Certain tools (such as recent tool history or your preferred color theme) store minimal state inside your browser&apos;s local storage. This data never leaves your browser and can be cleared at any time via your browser settings.
          </p>

          <h2>4. Contact Us</h2>
          <p>
            If you have questions about our privacy practices, contact us via our official contact channel.
          </p>
        </div>
      </section>
    </>
  );
}
