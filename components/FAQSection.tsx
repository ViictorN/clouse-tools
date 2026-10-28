'use client';
import React, { useState } from 'react';
import { Icon } from '@/lib/icons';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'Are my files, passwords, and data safe when using Clouse Tools?',
    a: 'Absolutely. Every tool executes 100% locally on your device within your browser window using HTML5 Canvas and native Web Crypto APIs. No files, passwords, tokens, or numbers are ever uploaded or transmitted to any server.',
  },
  {
    q: 'Is Clouse Tools completely free? Are there any hidden limits or premium tiers?',
    a: 'Clouse Tools is 100% free with zero paywalls, zero account registrations, and zero premium tiers. All 67 utilities are fully accessible without restriction.',
  },
  {
    q: 'Can I use these tools offline without an active internet connection?',
    a: 'Yes! Because the platform is built with client-side Next.js static generation, once a page is loaded in your browser, the computation logic executes locally on your CPU with zero external API calls.',
  },
  {
    q: 'How accurate are the conversion and mathematical calculations?',
    a: 'All algorithms are grounded in official international standards (including ISO-8601 for calendar calculations, NIST unit constants, RFC 4122 for UUIDs, and FIPS 180-4 for SHA cryptographic hashes) ensuring precise, dependable results.',
  },
  {
    q: 'How can I report a bug or request a new utility to be added?',
    a: 'Clouse Tools is an open-source project hosted on GitHub. You can open an issue, propose a new tool idea, or submit a pull request directly at github.com/ViictorN/clouse-tools, or send a message via our Contact page.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <section className="section" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="section-head center mb-24">
          <div className="eyebrow">
            <span className="dot" />
            <span>Questions &amp; Answers</span>
          </div>
          <h2 className="h-d2 mt-12">Frequently Asked Questions</h2>
          <p className="lead">
            Everything you need to know about our privacy guarantees, performance, and tooling.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14, marginTop: 36 }}>
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--r-md)',
                  boxShadow: isOpen ? 'var(--sh-md)' : 'inset 0 0 0 1px var(--line)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  style={{
                    width: '100%',
                    padding: '22px 26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '17px',
                    letterSpacing: '-0.015em',
                    color: 'var(--ink)',
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      color: 'var(--ink-2)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="chevron-down" size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 26px 24px',
                      color: 'var(--ink-2)',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--line)',
                      paddingTop: 16,
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
