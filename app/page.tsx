import React from 'react';
import Link from 'next/link';
import { CATEGORIES, popularTools } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Icon } from '@/lib/icons';
import { HeroSearch } from '@/components/HeroSearch';
import { UseCasesSection } from '@/components/UseCasesSection';
import { FAQSection } from '@/components/FAQSection';

export default function HomePage() {
  const popular = popularTools();

  return (
    <>
      {/* ---------- HERO SECTION ---------- */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow">
            <span className="dot" />
            <span>67 Client-Side Online Utilities</span>
          </div>

          <h1>
            Everyday tools, crafted to perfection.
          </h1>

          <p className="lead hero-sub">
            The minimal, lightning-fast suite of 67 free utilities. Zero tracking, zero telemetry, and 100% computed in your browser.
          </p>

          <HeroSearch />

          <div className="hero-chips">
            <Link href="/tool/percentage-calculator" className="chip">
              <Icon name="percentage" size={14} />
              <span>Percentage Calculator</span>
            </Link>
            <Link href="/tool/json-formatter" className="chip">
              <Icon name="braces" size={14} />
              <span>JSON Formatter</span>
            </Link>
            <Link href="/tool/word-counter" className="chip">
              <Icon name="letter-case" size={14} />
              <span>Word Counter</span>
            </Link>
            <Link href="/tool/date-difference" className="chip">
              <Icon name="calendar-event" size={14} />
              <span>Date Difference</span>
            </Link>
            <Link href="/tool/unit-converter" className="chip">
              <Icon name="ruler-2" size={14} />
              <span>Unit Converter</span>
            </Link>
            <Link href="/tool/qr-code-generator" className="chip">
              <Icon name="qrcode" size={14} />
              <span>QR Code Generator</span>
            </Link>
            <Link href="/tool/uuid-generator" className="chip">
              <Icon name="fingerprint" size={14} />
              <span>UUID Generator</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <b>67</b>
              <span>Handcrafted Tools</span>
            </div>
            <div className="stat">
              <b>100%</b>
              <span>Private & Client-Side</span>
            </div>
            <div className="stat">
              <b>0</b>
              <span>Data Sent to Server</span>
            </div>
            <div className="stat">
              <b>0ms</b>
              <span>Calculation Delay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          <div className="m-track">
            <div className="m-item"><Icon name="calculator" size={16} /> Math & Calculators</div>
            <div className="m-item"><Icon name="letter-case" size={16} /> Text & Prose Transformers</div>
            <div className="m-item"><Icon name="clock" size={16} /> Date, Time & Clocks</div>
            <div className="m-item"><Icon name="ruler-2" size={16} /> Universal Unit Converters</div>
            <div className="m-item"><Icon name="code" size={16} /> Developer Encoders & Parsers</div>
            <div className="m-item"><Icon name="palette" size={16} /> Graphic & Color Tools</div>
            <div className="m-item"><Icon name="shield-check" size={16} /> 100% In-Browser Computation</div>
          </div>
          <div className="m-track">
            <div className="m-item"><Icon name="calculator" size={16} /> Math & Calculators</div>
            <div className="m-item"><Icon name="letter-case" size={16} /> Text & Prose Transformers</div>
            <div className="m-item"><Icon name="clock" size={16} /> Date, Time & Clocks</div>
            <div className="m-item"><Icon name="ruler-2" size={16} /> Universal Unit Converters</div>
            <div className="m-item"><Icon name="code" size={16} /> Developer Encoders & Parsers</div>
            <div className="m-item"><Icon name="palette" size={16} /> Graphic & Color Tools</div>
            <div className="m-item"><Icon name="shield-check" size={16} /> 100% In-Browser Computation</div>
          </div>
        </div>
      </div>

      {/* ---------- POPULAR TOOLS ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head-row">
            <div className="section-head">
              <div className="eyebrow">
                <span className="dot" />
                <span>Featured Collection</span>
              </div>
              <h2 className="h-d2">Popular Utilities</h2>
              <p className="lead">
                The most frequently used tools, designed for quick access with keyboard ergonomics and 1-click clipboard actions.
              </p>
            </div>
            <Link href="/tools" className="link-arrow">
              <span>View all 67 tools</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>

          <div className="tools-grid">
            {popular.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DARK FEATURE BAND ---------- */}
      <section className="band-dark">
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow">
            <Icon name="shield-check" size={14} />
            <span>Architecture & Privacy</span>
          </div>
          <h2 className="h-d2">Built for speed. Zero compromises on privacy.</h2>
          <p className="lead">
            Every transformation, calculation, hash, and format happens strictly inside your browser window. No logs, no telemetry, and no external API requests.
          </p>

          <div className="band-chips">
            <div className="glass-chip">
              <Icon name="bolt" size={16} />
              <span>Instant Local Execution</span>
            </div>
            <div className="glass-chip">
              <Icon name="shield-check" size={16} />
              <span>No Cookies or Ads</span>
            </div>
            <div className="glass-chip">
              <Icon name="gauge" size={16} />
              <span>Sub-millisecond Compute</span>
            </div>
            <div className="glass-chip">
              <Icon name="copy" size={16} />
              <span>1-Click Copy with Feedback</span>
            </div>
          </div>

          <div className="band-grid">
            <div className="band-feature">
              <Icon name="bolt" size={28} />
              <h4>Instant Calculation</h4>
              <p>
                Calculations update as you type. No waiting for round-trips to distant cloud servers or spinners.
              </p>
            </div>
            <div className="band-feature">
              <Icon name="shield-check" size={28} />
              <h4>Absolute Confidentiality</h4>
              <p>
                Your passwords, JWT tokens, customer data, and image files never leave your device. Ever.
              </p>
            </div>
            <div className="band-feature">
              <Icon name="sparkles" size={28} />
              <h4>Apple-Grade Aesthetics</h4>
              <p>
                Clean typography, balanced contrast, liquid glass nav, and fluid interactions inspired by Cupertino design principles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- REAL-WORLD WORKFLOWS ---------- */}
      <UseCasesSection />

      {/* ---------- CATEGORIES SECTION ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head-row">
            <div className="section-head">
              <div className="eyebrow">
                <span className="dot" />
                <span>Categories</span>
              </div>
              <h2 className="h-d2">Browse by Domain</h2>
              <p className="lead">
                Explore tools organized across mathematics, linguistics, time calculation, converters, engineering, and visual design.
              </p>
            </div>
          </div>

          <div className="cat-grid">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ SECTION ---------- */}
      <FAQSection />

      {/* ---------- CTA SECTION ---------- */}
      <section className="cta-section">
        <div className="container">
          <div className="eyebrow">
            <span className="dot" />
            <span>Open Source & Free Forever</span>
          </div>
          <h2 className="h-d2">Everything you need. Nothing you don’t.</h2>
          <p className="lead">
            Bookmark Clouse Tools for instant access whenever you need to compute, convert, or format.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Link href="/tools" className="btn btn-primary">
              <Icon name="sparkles" size={18} />
              <span>Explore All 67 Tools</span>
            </Link>
            <a
              href="https://github.com/ViictorN/clouse-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <Icon name="code" size={18} />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
