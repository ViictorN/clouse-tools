'use client';
import React from 'react';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

/**
 * Above-the-fold action on the directory pages: opens the global command
 * palette, which is the fastest path to any of the 67 tools.
 */
export function PaletteCtaButton({ locale = 'en' }: { locale?: Locale }) {
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
    >
      <Icon name="search" size={16} />
      <span>{locale === 'pt-br' ? 'Buscar com ⌘K' : 'Search with ⌘K'}</span>
    </button>
  );
}
