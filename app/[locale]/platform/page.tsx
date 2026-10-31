import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, isValidLocale, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';
import { getPlatformDataStore } from '@clouse/data';
import { getUnifiedToolCatalog } from '@clouse/tool-sdk';
import { PlatformGovernanceClient } from '@/components/PlatformGovernanceClient';

interface PlatformPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PlatformPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';
  const title = isPt
    ? 'Arquitetura em Nuvem & Segurança — Clouse Tools'
    : 'Cloud Architecture & Security — Clouse Tools';
  const description = isPt
    ? 'Catálogo unificado de 73 ferramentas, 6 motores isolados no servidor, banco Supabase com controle por linha e 2.500 controles verificados.'
    : 'Unified catalog of 73 tools, 6 isolated server engines, Supabase database with row access control, and 2,500 verified controls.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `${SITE_URL}/${locale}/platform`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/platform`,
      languages: {
        'pt-BR': `${SITE_URL}/pt-br/platform`,
        'en-US': `${SITE_URL}/en/platform`,
      },
    },
  };
}

export default async function LocalizedPlatformPage({ params }: PlatformPageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const store = getPlatformDataStore();
  const initialSummary = store.getGovernanceSummary();
  const serverTools = getUnifiedToolCatalog().filter((tool) => tool.executionMode !== 'client');
  const initialEngineering = store.queryEngineeringMatrix({ page: 1, pageSize: 12 });
  const initialSecurity = store.querySecurityPractices({ page: 1, pageSize: 12 });

  return (
    <PlatformGovernanceClient
      locale={locale}
      initialSummary={initialSummary}
      serverTools={serverTools}
      initialEngineering={initialEngineering}
      initialSecurity={initialSecurity}
    />
  );
}
