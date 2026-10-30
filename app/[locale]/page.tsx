import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolCard } from '@/components/ToolCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Icon } from '@/lib/icons';
import { HeroSearch } from '@/components/HeroSearch';
import { HomePersonalization } from '@/components/HomePersonalization';
import { UseCasesSection } from '@/components/UseCasesSection';
import { FAQSection } from '@/components/FAQSection';
import { CalibGrid } from '@/components/CalibGrid';
import { LiveStatus } from '@/components/LiveStatus';
import { CountUp } from '@/components/CountUp';
import { Reveal } from '@/components/Reveal';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import {
  getLocalizedCategories,
  getLocalizedPopularTools,
  getLocalizedToolBySlug,
  t,
} from '@/lib/translations';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';

  const title = isPt
    ? 'Clouse Tools — 67 Ferramentas Online Gratuitas, Rápidas e Privativas'
    : 'Clouse Tools — 67 Free, Fast, Private Online Tools';

  const description = isPt
    ? '67 utilitários online 100% no seu navegador. Zero rastreamento, zero anúncios, zero necessidade de cadastro. Cálculos ultrarrápidos em seu computador ou celular.'
    : '67 free, private, client-side tools designed with the utmost craft. Zero tracking, zero telemetry, and 100% computed in your browser.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `https://clouse.app/${locale}`,
    },
    alternates: {
      canonical: `https://clouse.app/${locale}`,
      languages: {
        'pt-BR': 'https://clouse.app/pt-br',
        'en-US': 'https://clouse.app/en',
      },
    },
  };
}

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const categories = getLocalizedCategories(locale);
  const popular = getLocalizedPopularTools(locale, 8);

  // Chips in hero
  const chipSlugs = [
    { slug: 'percentage-calculator', icon: 'percentage' },
    { slug: 'json-formatter', icon: 'braces' },
    { slug: 'word-counter', icon: 'letter-case' },
    { slug: 'date-difference', icon: 'calendar-event' },
    { slug: 'unit-converter', icon: 'ruler-2' },
    { slug: 'qr-code-generator', icon: 'qrcode' },
    { slug: 'uuid-generator', icon: 'fingerprint' },
  ];

  const rawTitle = t('hero.title', locale);
  const titleLines = rawTitle
    .split(/,\s+/)
    .map((line, index, all) => (index < all.length - 1 ? `${line},` : line))
    .map((line) => line.trim())
    .filter(Boolean);

  const marqueeItems = [
    { icon: 'calculator', label: locale === 'pt-br' ? 'Calculadoras & Matemática' : 'Math & Calculators' },
    { icon: 'letter-case', label: locale === 'pt-br' ? 'Texto & Redação' : 'Text & Prose Transformers' },
    { icon: 'clock', label: locale === 'pt-br' ? 'Data, Hora & Fusos' : 'Date, Time & Clocks' },
    { icon: 'ruler-2', label: locale === 'pt-br' ? 'Conversores Universais' : 'Universal Unit Converters' },
    { icon: 'code', label: locale === 'pt-br' ? 'Ferramentas para Devs' : 'Developer Encoders & Parsers' },
    { icon: 'palette', label: locale === 'pt-br' ? 'Design & Cores' : 'Graphic & Color Tools' },
    { icon: 'shield-check', label: locale === 'pt-br' ? '100% no Navegador' : '100% In-Browser Computation' },
  ] as const;

  return (
    <>
      {/* ---------- HERO SECTION ---------- */}
      <section className="hero">
        <CalibGrid />
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-main">
              <Reveal className="eyebrow">
                <span className="dot" />
                <span>{t('hero.eyebrow', locale)}</span>
              </Reveal>

              <h1>
                {titleLines.map((line, i) => (
                  <span className="line-mask" key={line}>
                    <span style={{ '--d': `${0.1 + i * 0.09}s` } as React.CSSProperties}>{line}</span>
                  </span>
                ))}
              </h1>

              <Reveal as="p" className="lead hero-sub" delay={0.06}>
                {t('hero.sub', locale)}
              </Reveal>

              <Reveal delay={0.12}>
                <HeroSearch />
              </Reveal>

              <Reveal delay={0.16}>
                <HomePersonalization />
              </Reveal>

              <Reveal className="hero-chips" delay={0.2}>
                {chipSlugs.map((chip) => {
                  const tool = getLocalizedToolBySlug(chip.slug, locale);
                  if (!tool) return null;
                  return (
                    <Link key={chip.slug} href={`/${locale}/tool/${chip.slug}`} className="chip">
                      <Icon name={chip.icon} size={14} />
                      <span>{tool.name}</span>
                    </Link>
                  );
                })}
              </Reveal>
            </div>

            <LiveStatus locale={locale} />
          </div>

          <Reveal className="hero-stats" group>
            <div className="stat">
              <b>
                <CountUp value={67} suffix="+" />
              </b>
              <span>{t('hero.stat1', locale)}</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={100} suffix="%" />
              </b>
              <span>{t('hero.stat2', locale)}</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={0} />
              </b>
              <span>{t('hero.stat3', locale)}</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={0} suffix="ms" />
              </b>
              <span>{t('hero.stat4', locale)}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          {[0, 1].map((track) => (
            <div className="m-track" key={track}>
              {marqueeItems.map((item) => (
                <div className="m-item" key={item.label}>
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- POPULAR TOOLS ---------- */}
      <section className="section" id="popular">
        <div className="container">
          <div className="section-head split">
            <div>
              <div className="eyebrow">
                <span className="dot" />
                <span>{t('popular.eyebrow', locale)}</span>
              </div>
              <h2 className="h-d2">{t('popular.title', locale)}</h2>
              <p className="lead">{t('popular.desc', locale)}</p>
            </div>
            <Link href={`/${locale}/tools`} className="btn btn-secondary desktop-only">
              <span>{t('popular.viewAll', locale)}</span>
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>

          <div className="tools-grid" data-reveal-group>
            {popular.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} locale={locale} className="reveal-fade" />
            ))}
          </div>

          <div className="mobile-only mt-24 text-center">
            <Link href={`/${locale}/tools`} className="btn btn-secondary full-w">
              <span>{t('popular.viewAll', locale)}</span>
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- PRIVACY ARCHITECTURE BAND ---------- */}
      <section className="feature-band">
        <CalibGrid full />
        <div className="bg-orb" aria-hidden="true" />
        <div className="bg-orb orb-2" aria-hidden="true" />
        <div className="container">
          <div className="band-grid">
            <Reveal className="band-content">
              <div className="eyebrow">
                <span className="dot" />
                <span>{t('band.eyebrow', locale)}</span>
              </div>
              <h2>{t('band.title', locale)}</h2>
              <p className="lead">{t('band.lead', locale)}</p>
              <div className="band-chips">
                <span className="chip-glass">
                  <Icon name="bolt" size={14} />
                  <span>{t('band.chip1', locale)}</span>
                </span>
                <span className="chip-glass">
                  <Icon name="eye-off" size={14} />
                  <span>{t('band.chip2', locale)}</span>
                </span>
                <span className="chip-glass">
                  <Icon name="cpu" size={14} />
                  <span>{t('band.chip3', locale)}</span>
                </span>
                <span className="chip-glass">
                  <Icon name="copy" size={14} />
                  <span>{t('band.chip4', locale)}</span>
                </span>
              </div>
            </Reveal>

            <div className="band-cards" data-reveal-group>
              <Reveal variant="reveal-fade" className="b-card">
                <div className="tile-icn soft">
                  <Icon name="zap" size={24} />
                </div>
                <h3>{t('band.f1.title', locale)}</h3>
                <p>{t('band.f1.desc', locale)}</p>
              </Reveal>
              <Reveal variant="reveal-fade" className="b-card">
                <div className="tile-icn soft">
                  <Icon name="lock" size={24} />
                </div>
                <h3>{t('band.f2.title', locale)}</h3>
                <p>{t('band.f2.desc', locale)}</p>
              </Reveal>
              <Reveal variant="reveal-fade" className="b-card">
                <div className="tile-icn soft">
                  <Icon name="sparkles" size={24} />
                </div>
                <h3>{t('band.f3.title', locale)}</h3>
                <p>{t('band.f3.desc', locale)}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- USE CASES SECTION ---------- */}
      <UseCasesSection locale={locale} />

      {/* ---------- CATEGORIES ---------- */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">
              <span className="dot" />
              <span>{t('cat.eyebrow', locale)}</span>
            </div>
            <h2 className="h-d2">{t('cat.title', locale)}</h2>
            <p className="lead" style={{ maxWidth: 620, margin: '0 auto' }}>
              {t('cat.lead', locale)}
            </p>
          </div>

          <div className="cat-grid" data-reveal-group>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} className="reveal-fade" />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ SECTION ---------- */}
      <FAQSection locale={locale} />

      {/* ---------- CTA SECTION ---------- */}
      <section className="section cta-section">
        <div className="container">
          <Reveal variant="reveal-scale" className="cta-box">
            <div className="eyebrow">
              <span className="dot" />
              <span>{t('cta.eyebrow', locale)}</span>
            </div>
            <h2>{t('cta.title', locale)}</h2>
            <p className="lead">{t('cta.lead', locale)}</p>
            <div className="cta-actions">
              <Link href={`/${locale}/tools`} className="btn btn-primary btn-lg">
                <span>{t('cta.explore', locale)}</span>
                <Icon name="arrow-right" size={18} />
              </Link>
              <a
                href="https://github.com/ViictorN/clouse-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <Icon name="code" size={18} />
                <span>{t('cta.github', locale)}</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
