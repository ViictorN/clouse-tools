import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="nav-logo" aria-label="Clouse Tools Home">
              <span className="logo-mark">C</span>
              <span>Clouse Tools</span>
            </Link>
            <p>
              67 free, private, client-side tools designed with the utmost craft. Zero tracking, zero ads, zero accounts required.
            </p>
          </div>

          <div>
            <h5>Categories</h5>
            <ul>
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Popular Tools</h5>
            <ul>
              <li><Link href="/tool/percentage-calculator">Percentage Calculator</Link></li>
              <li><Link href="/tool/json-formatter">JSON Formatter</Link></li>
              <li><Link href="/tool/word-counter">Word Counter</Link></li>
              <li><Link href="/tool/date-difference">Date Difference</Link></li>
              <li><Link href="/tool/unit-converter">Unit Converter</Link></li>
              <li><Link href="/tool/qr-code-generator">QR Code Generator</Link></li>
            </ul>
          </div>

          <div>
            <h5>Product & Legal</h5>
            <ul>
              <li><Link href="/about">About Clouse</Link></li>
              <li><Link href="/components">Design System</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li>
                <a
                  href="https://github.com/ViictorN/clouse-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow"
                >
                  GitHub Repository
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Clouse Tools. Built with Next.js, React 19 and Apple-inspired craft.</p>
          <div className="footer-social">
            <a
              href="https://github.com/ViictorN/clouse-tools"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Icon name="code" size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
