import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryCard } from '@/components/CategoryCard';
import { Icon } from '@/lib/icons';
import { HeroSearch } from '@/components/HeroSearch';
import { HeroPerspectiveCard } from '@/components/HeroPerspectiveCard';
import { UseCasesSection } from '@/components/UseCasesSection';
import { FAQSection } from '@/components/FAQSection';
import { Reveal } from '@/components/Reveal';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import {
  getLocalizedCategories,
  getLocalizedPopularTools,
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
    ? 'Clouse Tools — Tudo o que você precisa. Em um só lugar.'
    : 'Clouse Tools — Everything you need. One place.';

  const description = isPt
    ? '67 ferramentas online rápidas, privativas e gratuitas. Zero cadastro, zero anúncios e zero rastreamento. Cálculos instantâneos no seu navegador.'
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
  const isPt = locale === 'pt-br';
  const prefix = isPt ? '/pt-br' : '/en';

  const categories = getLocalizedCategories(locale);

  return (
    <>
      {/* ============================================================
          1. HERO SECTION (EDITORIAL APPLE AESTHETIC)
          ============================================================ */}
      <section className="hero-editorial">
        <div className="container">
          <div className="hero-editorial-grid">
            {/* Left Content Column */}
            <div className="hero-editorial-left">
              <Reveal className="hero-editorial-eyebrow">
                <span className="eyebrow-bullet">•</span>
                <span>
                  {isPt
                    ? 'SEU KIT DE FERRAMENTAS DO DIA A DIA, REIMAGINADO'
                    : 'YOUR EVERYDAY TOOLKIT, REIMAGINED'}
                </span>
              </Reveal>

              <h1 className="hero-editorial-heading">
                <span className="heading-line-sans">
                  {isPt ? 'Tudo o que você precisa.' : 'Everything you need.'}
                </span>
                <span className="heading-line-serif">
                  {isPt ? 'Em um só lugar.' : 'One place.'}
                </span>
              </h1>

              <Reveal as="p" className="hero-editorial-sub" delay={0.06}>
                {isPt ? (
                  <>
                    Ferramentas online poderosas. Maravilhosamente simples.
                    <br />
                    Menos tempo tentando entender. Mais tempo fazendo acontecer.
                  </>
                ) : (
                  <>
                    Powerful online tools. Beautifully simple.
                    <br />
                    Less time figuring it out. More time getting it done.
                  </>
                )}
              </Reveal>

              <Reveal delay={0.12}>
                <HeroSearch />
              </Reveal>
            </div>

            {/* Right Visual Column (Floating 3D Perspective Card on Dark Slate) */}
            <div className="hero-editorial-right">
              <HeroPerspectiveCard locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. CATEGORIES SECTION ("A place for every task. 01 — 06")
          ============================================================ */}
      <section className="section-categories-strip" id="categories">
        <div className="container">
          <div className="categories-strip-header">
            <h2 className="categories-strip-title">
              {isPt ? 'Um lugar para cada tarefa.' : 'A place for every task.'}
            </h2>
            <span className="categories-strip-count">01 — 06</span>
          </div>

          <div className="categories-strip-grid" data-reveal-group>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} className="reveal-fade" />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURED ESSENTIALS ("Small tools. Big possibilities.")
          ============================================================ */}
      <section className="section-essentials" id="popular">
        <div className="container">
          <div className="essentials-header">
            <div>
              <div className="eyebrow-clean">
                {isPt ? 'OS ESSENCIAIS DO DIA A DIA' : 'THE EVERYDAY ESSENTIALS'}
              </div>
              <h2 className="essentials-title">
                {isPt ? 'Pequenas ferramentas. Grandes possibilidades.' : 'Small tools. Big possibilities.'}
              </h2>
              <p className="essentials-sub">
                {isPt
                  ? 'Algumas das favoritas para tornar o seu dia um pouco mais simples.'
                  : 'A few favorites to make your day a little easier.'}
              </p>
            </div>

            <div className="essentials-actions">
              <Link href={`${prefix}/tools`} className="essentials-view-all">
                <span>{isPt ? 'Ver todas as ferramentas' : 'View all tools'}</span>
                <span className="arr" aria-hidden="true">→</span>
              </Link>
              <div className="essentials-nav-arrows" aria-hidden="true">
                <button type="button" className="carousel-arrow" aria-label="Previous">‹</button>
                <button type="button" className="carousel-arrow" aria-label="Next">›</button>
              </div>
            </div>
          </div>

          {/* 3 Signature Cards: 1 Inverted Black + 2 Crisp White */}
          <div className="essentials-grid">
            {/* Card 1: Inverted Black Card */}
            <Link
              href={`${prefix}/tool/percentage-calculator`}
              className="essential-card card-inverted"
            >
              <div className="essential-card-top">
                <span className="essential-big-icon">%</span>
                <span className="essential-badge badge-dark">
                  {isPt ? 'Pronto para uso' : 'Ready to use'}
                </span>
              </div>
              <div className="essential-card-content">
                <h3 className="essential-card-title">
                  {isPt ? 'Calculadora de Porcentagem' : 'Percentage Calculator'}
                </h3>
                <p className="essential-card-desc">
                  {isPt
                    ? 'Porcentagens, aumentos e tudo entre eles.'
                    : 'Percentages, increases and everything in between.'}
                </p>
              </div>
              <div className="essential-card-bottom">
                <span className="essential-link">
                  <span>{isPt ? 'Abrir ferramenta' : 'Open tool'}</span>
                  <span className="arr" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>

            {/* Card 2: Crisp White Card (Word Counter) */}
            <Link
              href={`${prefix}/tool/word-counter`}
              className="essential-card card-white"
            >
              <div className="essential-card-top">
                <span className="essential-icon-box">
                  <Icon name="letter-case" size={24} />
                </span>
                <span className="essential-badge badge-light">
                  {isPt ? 'Pronto para uso' : 'Ready to use'}
                </span>
              </div>
              <div className="essential-card-content">
                <h3 className="essential-card-title">
                  {isPt ? 'Contador de Palavras' : 'Word Counter'}
                </h3>
                <p className="essential-card-desc">
                  {isPt
                    ? 'Uma perspectiva clara sobre cada palavra que você escreve.'
                    : 'A little perspective on every word you write.'}
                </p>
              </div>
              <div className="essential-card-bottom">
                <span className="essential-link">
                  <span>{isPt ? 'Abrir ferramenta' : 'Open tool'}</span>
                  <span className="arr" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>

            {/* Card 3: Crisp White Card (Image Resizer) */}
            <Link
              href={`${prefix}/tool/aspect-ratio-calculator`}
              className="essential-card card-white"
            >
              <div className="essential-card-top">
                <span className="essential-icon-box">
                  <Icon name="image" size={24} />
                </span>
                <span className="essential-badge badge-light">
                  {isPt ? 'Pronto para uso' : 'Ready to use'}
                </span>
              </div>
              <div className="essential-card-content">
                <h3 className="essential-card-title">
                  {isPt ? 'Calculadora de Aspect Ratio' : 'Aspect Ratio & Resizer'}
                </h3>
                <p className="essential-card-desc">
                  {isPt
                    ? 'As dimensões exatas para a sua próxima grande ideia.'
                    : 'The right dimensions for your next big idea.'}
                </p>
              </div>
              <div className="essential-card-bottom">
                <span className="essential-link">
                  <span>{isPt ? 'Ver detalhes' : 'View details'}</span>
                  <span className="arr" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. MINIMAL ADVERTISEMENT SLOT
          ============================================================ */}
      <section className="section-ad-slot">
        <div className="container">
          <div className="ad-minimal-box">
            <span className="ad-label">ADVERTISEMENT</span>
            <span className="ad-sub">
              {isPt
                ? 'Um pequeno espaço para manter ferramentas gratuitas.'
                : 'A little space to keep good tools free.'}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. BLACK FEATURE BANNER ("ALL TOOLS. ONE PLATFORM.")
          ============================================================ */}
      <section className="section-black-banner">
        <div className="container">
          <div className="black-banner-container">
            {/* Ambient Background Wave */}
            <div className="black-banner-ribbon" aria-hidden="true">
              <svg viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="banner-ribbon-svg">
                <path
                  d="M 50,160 C 150,60 300,260 450,160 C 520,110 580,180 620,160"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.8"
                />
                <path
                  d="M 80,190 C 180,90 330,290 480,190 C 550,140 610,210 650,190"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1.2"
                />
                <ellipse cx="480" cy="160" rx="90" ry="45" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <ellipse cx="380" cy="160" rx="90" ry="45" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              </svg>
            </div>

            <div className="black-banner-grid">
              <div className="black-banner-left">
                <span className="black-banner-eyebrow">
                  {isPt ? 'TODAS AS FERRAMENTAS. UMA PLATAFORMA.' : 'ALL TOOLS. ONE PLATFORM.'}
                </span>
                <h2 className="black-banner-title">
                  <span>{isPt ? 'Menos tarefas repetitivas.' : 'Less busywork.'}</span>
                  <br />
                  <span>{isPt ? 'Mais possibilidade.' : 'More possibility.'}</span>
                </h2>
                <p className="black-banner-sub">
                  {isPt
                    ? 'Para as pequenas tarefas entre as suas grandes ideias.'
                    : 'For the little tasks between your big ideas.'}
                </p>
                <div className="black-banner-cta">
                  <Link href={`${prefix}/tools`} className="banner-pill-btn">
                    <span>{isPt ? 'Explorar o kit de ferramentas' : 'Explore the toolkit'}</span>
                    <span className="arr" aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              <div className="black-banner-right" aria-hidden="true">
                <div className="banner-stat-block">
                  <div className="stat-infinity-row">
                    <span className="infinity-symbol">∞</span>
                    <span className="stat-number">67</span>
                  </div>
                  <span className="stat-caption">
                    {isPt ? 'ferramentas úteis. zero cadastros.' : 'useful tools. zero sign-ups.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. USE CASES SECTION (EXPANDED WORKFLOW SCENARIOS)
          ============================================================ */}
      <UseCasesSection locale={locale} />

      {/* ============================================================
          7. FAQ SECTION
          ============================================================ */}
      <FAQSection locale={locale} />
    </>
  );
}
