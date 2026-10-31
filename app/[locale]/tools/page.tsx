import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { PaletteCtaButton } from '@/components/PaletteCtaButton';
import { CalibGrid } from '@/components/CalibGrid';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/lib/icons';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ToolsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';
  const title = isPt ? 'Todas as 67 Ferramentas — Diretório Completo' : 'All 67 Tools — Directory';
  const description = isPt
    ? 'Explore todas as 67 ferramentas online gratuitas, rápidas e privativas para matemática, redação, datas, conversões de unidades, desenvolvimento e design.'
    : 'Browse all 67 free, fast, private online tools for mathematics, text editing, date calculation, unit conversion, developer formatting, and graphic design.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `${SITE_URL}/${locale}/tools`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/tools`,
      languages: {
        'pt-BR': `${SITE_URL}/pt-br/tools`,
        'en-US': `${SITE_URL}/en/tools`,
      },
    },
  };
}

export default async function LocalizedToolsPage({ params }: ToolsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';

  const marqueeItems = [
    { icon: 'calculator', label: isPt ? 'Calculadoras & Matemática' : 'Math & Calculators' },
    { icon: 'letter-case', label: isPt ? 'Texto & Redação' : 'Text & Prose Transformers' },
    { icon: 'clock', label: isPt ? 'Data, Hora & Fusos' : 'Date, Time & Clocks' },
    { icon: 'ruler-2', label: isPt ? 'Conversores Universais' : 'Universal Unit Converters' },
    { icon: 'code', label: isPt ? 'Ferramentas para Devs' : 'Developer Encoders & Parsers' },
    { icon: 'palette', label: isPt ? 'Design & Cores' : 'Graphic & Color Tools' },
    { icon: 'shield-check', label: isPt ? '100% no Navegador' : '100% In-Browser Computation' },
  ] as const;

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Ferramentas' : 'Tools'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Diretório Completo' : 'Complete Directory'}</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Todas as 67 Ferramentas Online' : 'All 67 Online Tools'}</h1>
          <p className="lead">
            {isPt
              ? 'Cada utilitário do Clouse Tools é executado diretamente no seu navegador. Sem chamadas a servidores, sem telemetria e com resposta instantânea.'
              : 'Every utility in Clouse Tools is built to run entirely inside your browser. No server calls, no telemetry, instant feedback.'}
          </p>
          <div className="page-hero-cta">
            <PaletteCtaButton locale={locale} />
          </div>

          <div className="hero-stats" data-reveal-group>
            <div className="stat">
              <b>
                <CountUp value={67} />
              </b>
              <span>{isPt ? 'Ferramentas' : 'Tools'}</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={6} />
              </b>
              <span>{isPt ? 'Categorias' : 'Categories'}</span>
            </div>
            <div className="stat">
              <b>
                <CountUp value={0} />
              </b>
              <span>{isPt ? 'Cadastros exigidos' : 'Sign-ups required'}</span>
            </div>
          </div>
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

      <section className="section section-pt-0">
        <div className="container">
          <ToolsDirectory />
        </div>
      </section>
    </>
  );
}
