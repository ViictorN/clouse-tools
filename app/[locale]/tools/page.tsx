import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { Icon } from '@/lib/icons';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';

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
      url: `https://clouse.app/${locale}/tools`,
    },
    alternates: {
      canonical: `https://clouse.app/${locale}/tools`,
      languages: {
        'pt-BR': 'https://clouse.app/pt-br/tools',
        'en-US': 'https://clouse.app/en/tools',
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

  return (
    <>
      <section className="page-hero">
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
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <h2 className="sr-only">{isPt ? 'Diretório de ferramentas' : 'Tools directory'}</h2>
          <ToolsDirectory />
        </div>
      </section>
    </>
  );
}
