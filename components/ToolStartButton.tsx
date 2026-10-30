'use client';
import React from 'react';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

/**
 * Primary action on a tool page: scrolls the first field of the tool into
 * view and focuses it, so keyboard users land straight on the input.
 */
export function ToolStartButton({ locale = 'en' }: { locale?: Locale }) {
  const jump = () => {
    const el = document.querySelector<HTMLElement>(
      '#tool-container input, #tool-container textarea, #tool-container select, #tool-container button',
    );
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.focus({ preventScroll: true }), 340);
  };

  return (
    <div className="tool-hero-cta">
      <button type="button" className="btn btn-blue" onClick={jump}>
        <Icon name="terminal-2" size={16} />
        <span>{locale === 'pt-br' ? 'Ir para a ferramenta' : 'Jump to the tool'}</span>
      </button>
    </div>
  );
}
