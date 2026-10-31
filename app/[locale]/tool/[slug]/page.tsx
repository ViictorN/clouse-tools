import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS } from '@/lib/data';
import { ToolRenderer } from '@/components/ToolRenderer';
import { ToolStatusStrip } from '@/components/ToolStatusStrip';
import { ToolStartButton } from '@/components/ToolStartButton';
import { RelatedRail } from '@/components/RelatedRail';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';
import { Icon } from '@/lib/icons';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';
import {
  getLocalizedToolBySlug,
  getLocalizedCategoryById,
  getLocalizedToolsByCategory,
} from '@/lib/translations';

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const tool of TOOLS) {
      paths.push({
        locale,
        slug: tool.slug,
      });
    }
  }
  return paths;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) return {};

  const locale = rawLocale as Locale;
  const tool = getLocalizedToolBySlug(slug, locale);

  if (!tool) {
    return {
      title: locale === 'pt-br' ? 'Ferramenta Não Encontrada' : 'Tool Not Found',
    };
  }

  const isPt = locale === 'pt-br';
  const title = isPt ? `${tool.name} — Ferramenta Online Grátis` : `${tool.name} — Free Online Tool`;
  const description = isPt
    ? `${tool.desc} Gratuito, instantâneo e 100% privativo. Computado diretamente no seu navegador com zero latência.`
    : `${tool.desc} Free, instant, and 100% private. Computed directly in your browser with zero latency.`;

  return {
    title,
    description,
    keywords: tool.kw.split(/[ ,]+/).filter(Boolean),
    openGraph: {
      title: `${tool.name} · Clouse Tools`,
      description: tool.desc,
      type: 'website',
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `${SITE_URL}/${locale}/tool/${tool.slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/tool/${tool.slug}`,
      languages: {
        'pt-BR': `${SITE_URL}/pt-br/tool/${tool.slug}`,
        'en-US': `${SITE_URL}/en/tool/${tool.slug}`,
      },
    },
  };
}

export default async function LocalizedToolPage({ params }: ToolPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';
  const tool = getLocalizedToolBySlug(slug, locale);

  if (!tool) {
    notFound();
  }

  const category = getLocalizedCategoryById(tool.cat, locale);
  const related = getLocalizedToolsByCategory(tool.cat, locale)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.desc,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="page-hero tool-hero-pb">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <Link href={`/${locale}/tools`}>{isPt ? 'Ferramentas' : 'Tools'}</Link>
            {category && (
              <>
                <Icon name="chevron-right" size={13} />
                <Link href={`/${locale}/category/${category.id}`}>{category.name}</Link>
              </>
            )}
            <Icon name="chevron-right" size={13} />
            <span>{tool.name}</span>
          </nav>

          <Reveal className="tool-hero">
            <div className="tile-icn">
              <Icon name={tool.icon} size={34} />
            </div>
            <h1>{tool.name}</h1>
            <p className="lead">{tool.desc}</p>
            <ToolStatusStrip locale={locale} />
            <ToolStartButton locale={locale} />
          </Reveal>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <div className="tool-layout">
            <Reveal variant="reveal-scale">
              <ToolRenderer slug={tool.slug} />
            </Reveal>

            {/* About This Tool */}
            <Reveal className="about-tool">
              <h2>{isPt ? `Sobre ${tool.name}` : `About ${tool.name}`}</h2>
              <p>{tool.about}</p>
              <ul>
                <li>
                  <Icon name="bolt" size={18} />
                  <span>
                    <strong>{isPt ? 'Reatividade Instantânea:' : 'Instant Reactivity:'}</strong>{' '}
                    {isPt
                      ? 'Os resultados recalculam a cada tecla pressionada com zero atraso.'
                      : 'Outputs recompute on every keystroke with zero delay.'}
                  </span>
                </li>
                <li>
                  <Icon name="shield-check" size={18} />
                  <span>
                    <strong>{isPt ? '100% Privativo no Dispositivo:' : '100% Client-Side Privacy:'}</strong>{' '}
                    {isPt
                      ? 'Nenhum dado é transmitido a servidores ou terceiros.'
                      : 'Nothing is ever transmitted to a server or third party.'}
                  </span>
                </li>
                <li>
                  <Icon name="copy" size={18} />
                  <span>
                    <strong>{isPt ? 'Cópia em 1 Clique:' : 'One-Click Clipboard:'}</strong>{' '}
                    {isPt
                      ? 'Copie resultados, textos formatados ou arquivos gerados facilmente com confirmação visual.'
                      : 'Easily copy results, formatted code, or generated assets.'}
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Related Tools */}
            {related.length > 0 && (
              <Reveal className="related">
                <RelatedRail
                  tools={related}
                  title={isPt ? `Mais em ${category?.name || 'Ferramentas'}` : `Related ${category?.name || 'Tools'}`}
                  locale={locale}
                />
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
