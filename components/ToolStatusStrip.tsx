import React from 'react';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

const ITEMS: { icon: string; en: string; pt: string }[] = [
  { icon: 'cpu', en: 'Computed on this device', pt: 'Computado no seu dispositivo' },
  { icon: 'bolt', en: 'Results as you type', pt: 'Resultados ao digitar' },
  { icon: 'shield-check', en: 'Nothing ever uploaded', pt: 'Nada é enviado para servidores' },
  { icon: 'lock', en: 'No account, free forever', pt: 'Sem cadastro, grátis para sempre' },
];

/**
 * Instrument strip under a tool hero: the four promises of the platform,
 * each with its own LED. Mirrors the hero panel language on tool pages.
 */
export function ToolStatusStrip({ locale = 'en' }: { locale?: Locale }) {
  return (
    <ul className="tool-strip" aria-label="Tool guarantees">
      {ITEMS.map((item) => (
        <li className="strip-item" key={item.en}>
          <span className="led-icon" aria-hidden="true">
            <Icon name={item.icon} size={13} />
          </span>
          <span className="led-label">{locale === 'pt-br' ? item.pt : item.en}</span>
          <span className="led-dot ok" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}
