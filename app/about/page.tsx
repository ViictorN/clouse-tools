import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'About Clouse Tools',
  description:
    'The story behind Clouse Tools: 67 free, private, client-side tools designed for everyday productivity without compromise.',
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>About</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>About Us</span>
          </div>
          <h1 className="h-d2">About Clouse Tools</h1>
          <p className="lead">
            Simple tools. Real productivity. Free, forever, for everyone.
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <p>
            <strong>Clouse Tools</strong> is a library of 67 free online utilities built around one simple principle: the shortest path from a question to an answer. No sign-up walls, no cookies, no tracking, and no upsells — you open a tool, you type, and you get your answer instantly.
          </p>

          <div className="card-note">
            <strong>Our fundamental promise:</strong> every tool runs 100% inside your browser. Your text, dates, passwords, tokens, and images are processed locally on your device and never uploaded to any remote server.
          </div>

          <h2>Why we built it</h2>
          <p>
            Most &ldquo;free online tools&rdquo; are weighed down with ads, cookie banners, mandatory registrations, and silently uploaded user files. We built the complete antithesis: a clean, lightning-fast toolbox with the everyday utilities people actually need — percentages, dates, text manipulation, units, image formatting, and essential developer helpers.
          </p>

          <h2>Core Engineering Principles</h2>
          <ul>
            <li>
              <strong>Instant by default:</strong> Results update live as you type with zero calculation round-trips.
            </li>
            <li>
              <strong>Keyboard-first ergonomics:</strong> Press <code className="mono">Ctrl + K</code> or <code className="mono">/</code> anywhere to trigger the global command palette.
            </li>
            <li>
              <strong>Private by design:</strong> Media is handled via HTML5 Canvas in-memory; random numbers and cryptographic hashes utilize the native Web Crypto API.
            </li>
            <li>
              <strong>Accessible:</strong> Semantic HTML, high contrast tokens, keyboard focus rings, and reduced-motion compliance.
            </li>
          </ul>

          <h2>What is inside</h2>
          <p>
            Six curated categories cover every routine task: <strong>Math</strong> (percentages, averages, loans, BMI, base converter), <strong>Text</strong> (word counts, slug generation, diffing, case switching), <strong>Date &amp; Time</strong> (differences, ages, countdowns, time zones), <strong>Unit Converters</strong> (length, weight, temperature, data storage, speed), <strong>Developer</strong> (Base64, JSON formatter, regex tester, SHA-256, JWT decoder), and <strong>Design</strong> (image resizing, CSS gradients, QR codes, color palettes).
          </p>

          <h2>Open Source &amp; Feedback</h2>
          <p>
            Found an issue or want to contribute a tool? The toolbox is fully open-source and welcoming contributions on GitHub at{' '}
            <a
              href="https://github.com/ViictorN/clouse-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow"
            >
              github.com/ViictorN/clouse-tools
              <Icon name="arrow-up-right" size={14} />
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
