'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { t } from '@/lib/translations';
import { TOOLS } from '@/lib/data';

interface LedRow {
  key: string;
  value: string;
  tone: 'ok' | 'blue';
  icon: 'cpu' | 'lock' | 'stopwatch' | 'bolt';
}

const LEDS: LedRow[] = [
  { key: 'hero.panel.tools', value: '67', tone: 'ok', icon: 'bolt' },
  { key: 'hero.panel.local', value: '100%', tone: 'ok', icon: 'cpu' },
  { key: 'hero.panel.upload', value: '0 KB', tone: 'blue', icon: 'lock' },
  { key: 'hero.panel.latency', value: '0 ms', tone: 'ok', icon: 'stopwatch' },
];

/**
 * Instrument panel beside the hero command line: a live local clock plus the
 * four status LEDs that make the zero-backend promise legible. Decorative
 * waveform bars hint at local compute without pretending to measure it.
 */
export function LiveStatus({ locale }: { locale: Locale }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const tag = locale === 'pt-br' ? 'pt-BR' : 'en-US';
  const time = now
    ? now.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';
  const date = now
    ? now.toLocaleDateString(tag, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const zone = now
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
    : '';

  return (
    <aside className="hero-panel glass-card reveal reveal-scale" aria-label={t('hero.panel.title', locale)}>
      <div className="hp-head">
        <span className="hp-eyebrow">
          <span className="dot" />
          {t('hero.panel.title', locale)}
        </span>
        <span className={`hp-pulse ${now ? '' : 'idle'}`} aria-hidden="true">
          <Icon name="heartbeat" size={14} />
        </span>
      </div>

      <div className="hp-clock">
        <span className="hp-time mono">{time}</span>
        <span className="hp-date">
          {date}
          {zone ? <span className="hp-zone mono"> {zone}</span> : null}
        </span>
      </div>

      <div className="hp-leds">
        {LEDS.map((led) => (
          <div className="hp-led" key={led.key}>
            <span className="led-icon" aria-hidden="true">
              <Icon name={led.icon} size={13} />
            </span>
            <span className="led-label">{t(led.key, locale)}</span>
            <span className={`led-value mono ${led.tone}`}>{led.value}</span>
            <span className={`led-dot ${led.tone}`} aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="hp-foot">
        <span className="hp-wave" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </span>
        <span className="hp-nominal">
          <Icon name="shield-check" size={13} />
          {t('hero.panel.nominal', locale)}
        </span>
      </div>

      <p className="hp-sub">{t('hero.panel.sub', locale)}</p>
      <span className="sr-only">
        {TOOLS.length} {t('hero.panel.tools', locale)}
      </span>
    </aside>
  );
}
