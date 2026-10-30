'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastContext';
import { Icon } from '@/lib/icons';

export default function ComponentsPage() {
  const { showToast } = useToast();
  const [rangeVal, setRangeVal] = useState(50);
  const [segActive, setSegActive] = useState('one');
  const [switchChecked, setSwitchChecked] = useState(true);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Components</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Design System</span>
          </div>
          <h1 className="h-d2">Design System &amp; Tokens</h1>
          <p className="lead">
            The foundational primitives of Clouse Tools: tokens, buttons, inputs, surfaces, and interactive feedback.
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container pb-40">
          {/* Buttons */}
          <div className="demo-block">
            <h2>Buttons</h2>
            <div className="demo-row">
              <button type="button" className="btn btn-primary">Primary</button>
              <button type="button" className="btn btn-blue">Blue</button>
              <button type="button" className="btn btn-ghost">Ghost</button>
              <button type="button" className="btn btn-primary btn-sm">Small</button>
              <Link href="/tools" className="link-arrow">
                <span>Text link</span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </div>

          {/* Badges */}
          <div className="demo-block">
            <h2>Badges</h2>
            <div className="demo-row">
              <span className="badge b-blue"><span className="dot" />Popular</span>
              <span className="badge b-green"><span className="dot" />Online</span>
              <span className="badge b-gray"><span className="dot" />Draft</span>
              <span className="badge b-orange"><span className="dot" />Beta</span>
              <span className="badge b-red"><span className="dot" />Error</span>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="demo-block">
            <h2>Inputs &amp; Controls</h2>
            <div className="t-fields">
              <div>
                <label className="t-label" htmlFor="demo-text">Text field</label>
                <input className="t-input" id="demo-text" type="text" placeholder="Type here…" defaultValue="Sample input text" />
              </div>
              <div>
                <label className="t-label" htmlFor="demo-select">Select</label>
                <select className="t-select" id="demo-select" defaultValue="Option A">
                  <option value="Option A">Option A</option>
                  <option value="Option B">Option B</option>
                </select>
              </div>
              <div>
                <label className="t-label" htmlFor="demo-area">Textarea</label>
                <textarea className="t-area" id="demo-area" defaultValue="The quick brown fox jumps over the lazy dog." />
              </div>
              <div>
                <label className="t-label" htmlFor="demo-range">Range</label>
                <div className="range-row">
                  <input
                    type="range"
                    id="demo-range"
                    min="0"
                    max="100"
                    value={rangeVal}
                    onChange={(e) => setRangeVal(Number(e.target.value))}
                  />
                  <span className="range-val">{rangeVal}</span>
                </div>
              </div>
              <div>
                <label className="t-label">Switch</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={switchChecked}
                    onChange={(e) => setSwitchChecked(e.target.checked)}
                  />
                  <i />
                  <span>{switchChecked ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <div>
                <label className="t-label">Segmented Control</label>
                <div className="seg">
                  <button
                    type="button"
                    className={segActive === 'one' ? 'active' : ''}
                    onClick={() => setSegActive('one')}
                  >
                    Option One
                  </button>
                  <button
                    type="button"
                    className={segActive === 'two' ? 'active' : ''}
                    onClick={() => setSegActive('two')}
                  >
                    Option Two
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Surfaces */}
          <div className="demo-block">
            <h2>Surfaces</h2>
            <div className="demo-row">
              <div className="t-card">
                <h3>Card — Inset Hairline</h3>
                <p>Clean minimal surface with subtle hairline border token.</p>
              </div>
              <div className="t-card" style={{ boxShadow: 'var(--sh-md)' }}>
                <h3>Card — Elevated</h3>
                <p>Depth surface with smooth multi-layer ambient shadow.</p>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="demo-block">
            <h2>Result panel</h2>
            <div className="t-result">
              <div className="r-label">Result</div>
              <div className="r-main">42</div>
              <div className="r-sub">The answer to life, the universe, and everything</div>
            </div>
          </div>

          {/* Color Tokens */}
          <div className="demo-block">
            <h2>Color Tokens</h2>
            <div className="token-grid">
              <div className="token"><i className="swatch-bg" /><span>bg (#f5f5f7)</span></div>
              <div className="token"><i className="swatch-surface" /><span>surface (#fff)</span></div>
              <div className="token"><i className="swatch-ink" /><span>ink (#0b0b0e)</span></div>
              <div className="token"><i className="swatch-ink-2" /><span>ink-2 (#6e6e73)</span></div>
              <div className="token"><i className="swatch-blue" /><span>blue (#0071e3)</span></div>
              <div className="token"><i className="swatch-ok" /><span>ok (#30d158)</span></div>
              <div className="token"><i className="swatch-warn" /><span>warn (#ff9f0a)</span></div>
              <div className="token"><i className="swatch-err" /><span>err (#ff453a)</span></div>
            </div>
          </div>

          {/* Feedback */}
          <div className="demo-block">
            <h2>Feedback &amp; Loading States</h2>
            <div className="demo-row">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => showToast('Design system toast notification')}
              >
                Trigger Interactive Toast
              </button>
              <div className="error-note error-note-m0">
                <Icon name="alert-triangle" size={16} />
                <span>Inline error notice</span>
              </div>
              <div style={{ width: 180 }}>
                <div className="skeleton" />
                <div className="skeleton mt-12" style={{ width: 120 }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
