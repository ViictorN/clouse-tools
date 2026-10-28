import React from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

interface CaseItem {
  role: string;
  badge: string;
  desc: string;
  icon: string;
  tools: { name: string; slug: string }[];
}

const CASES: CaseItem[] = [
  {
    role: 'Developers & DevOps Engineers',
    badge: 'Code & Security',
    icon: 'code',
    desc: 'Validate formatted JSON payloads, decode JWT tokens locally without exposing secrets, test regex patterns, and hash assets with SHA-256.',
    tools: [
      { name: 'JSON Formatter', slug: 'json-formatter' },
      { name: 'JWT Decoder', slug: 'jwt-decoder' },
      { name: 'Regex Tester', slug: 'regex-tester' },
      { name: 'Hash Generator', slug: 'hash-generator' },
    ],
  },
  {
    role: 'Designers & Front-End Teams',
    badge: 'Visual & UI',
    icon: 'palette',
    desc: 'Extract color palettes, solve aspect ratios for responsive video embeds, generate multi-layer box shadows, and craft smooth CSS gradients.',
    tools: [
      { name: 'Aspect Ratio Calculator', slug: 'aspect-ratio-calculator' },
      { name: 'Gradient Generator', slug: 'gradient-generator' },
      { name: 'Shadow Generator', slug: 'shadow-generator' },
      { name: 'Color Converter', slug: 'color-converter' },
    ],
  },
  {
    role: 'Students, Analysts & Finance',
    badge: 'Math & Logic',
    icon: 'calculator',
    desc: 'Calculate three-way percentages, loan amortizations, average distributions, BMI scores, and numeric bases with zero formulas to memorize.',
    tools: [
      { name: 'Percentage Calculator', slug: 'percentage-calculator' },
      { name: 'Loan Calculator', slug: 'loan-calculator' },
      { name: 'Average Calculator', slug: 'average-calculator' },
      { name: 'Number Base Converter', slug: 'number-base-converter' },
    ],
  },
  {
    role: 'Remote Teams & Content Creators',
    badge: 'Time & Prose',
    icon: 'clock',
    desc: 'Coordinate worldwide meetings across timezones, count prose reading times, clean duplicate rows, and generate URL-friendly slugs.',
    tools: [
      { name: 'Timezone Converter', slug: 'timezone-converter' },
      { name: 'Word Counter', slug: 'word-counter' },
      { name: 'Slug Generator', slug: 'slug-generator' },
      { name: 'Date Difference', slug: 'date-difference' },
    ],
  },
];

export function UseCasesSection() {
  return (
    <section className="section section-pt-0">
      <div className="container">
        <div className="section-head-row">
          <div className="section-head">
            <div className="eyebrow">
              <span className="dot" />
              <span>Real-World Workflows</span>
            </div>
            <h2 className="h-d2 mt-12">Engineered for Daily Craft</h2>
            <p className="lead">
              From software engineering to creative production, see how Clouse Tools accelerates daily tasks.
            </p>
          </div>
        </div>

        <div className="tools-grid cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {CASES.map((item, idx) => (
            <div
              key={idx}
              className="t-card"
              style={{ padding: '32px', cursor: 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div className="tile-icn soft">
                  <Icon name={item.icon} size={24} />
                </div>
                <span className="badge b-gray">{item.badge}</span>
              </div>
              <h3 style={{ fontSize: '20px' }}>{item.role}</h3>
              <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', lineHeight: 1.6 }}>{item.desc}</p>
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {item.tools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tool/${t.slug}`}
                    className="chip"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <span>{t.name}</span>
                    <Icon name="arrow-right" size={12} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
