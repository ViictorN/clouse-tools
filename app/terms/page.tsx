import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for Clouse Tools: free, browser-based tools provided as-is without tracking.',
};

export default function TermsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Terms</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Legal Notice</span>
          </div>
          <h1 className="h-d2">Terms of Use</h1>
          <p className="lead">The short, human-readable version.</p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <h2>1. The service</h2>
          <p>
            Clouse Tools provides free, browser-based utilities that compute results locally on your device. The service is provided &ldquo;as-is&rdquo;, without warranties of any kind, express or implied.
          </p>

          <h2>2. Acceptable use</h2>
          <ul>
            <li>Use the tools for lawful purposes only.</li>
            <li>Do not attempt to disrupt or abuse the service.</li>
            <li>You remain exclusively responsible for any content you process with the tools.</li>
          </ul>

          <h2>3. Results and accuracy</h2>
          <p>
            Every tool is engineered for precision and tested against established reference algorithms. However, calculations are provided without legal or financial warranty. For mission-critical decisions — medical, legal, or specialized engineering — always verify results with standard accredited authorities.
          </p>

          <h2>4. Intellectual property</h2>
          <p>
            The interface, component architecture, code, and branding of Clouse Tools are the property of Victor Gomes and contributors. Your inputs and outputs remain 100% yours: we never receive, store, or claim any ownership over your data.
          </p>

          <h2>5. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Clouse Tools shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the service.
          </p>

          <h2>6. Contact</h2>
          <p>
            Questions regarding these terms? Contact: <strong>hello@clouse.tools</strong>
          </p>
        </div>
      </section>
    </>
  );
}
