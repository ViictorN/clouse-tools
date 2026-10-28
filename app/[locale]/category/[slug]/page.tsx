import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Icon } from '@/lib/icons';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import {
  getLocalizedCategoryById,
  getLocalizedCategories,
  getLocalizedToolsByCategory,
} from '@/lib/translations';

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const cat of CATEGORIES) {
      paths.push({
        locale,
        slug: cat.id,
      });
    }
  }
  return paths;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) return {};

  const locale = rawLocale as Locale;
  const cat = getLocalizedCategoryById(slug, locale);

  if (!cat) {
    return {
      title: locale === 'pt-br' ? 'Categoria Não Encontrada' : 'Category Not Found',
    };
  }

  const isPt = locale === 'pt-br';
  const title = isPt ? `${cat.name} — Utilitários Online Gratuitos` : `${cat.name} — Free Online Utilities`;
  const description = `${cat.desc} ${cat.blurb}`;

  return {
    title,
    description,
    openGraph: {
      title: `${cat.name} · Clouse Tools`,
      description: cat.blurb,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `https://clouse.app/${locale}/category/${cat.id}`,
    },
    alternates: {
      canonical: `https://clouse.app/${locale}/category/${cat.id}`,
      languages: {
        'pt-BR': `https://clouse.app/pt-br/category/${cat.id}`,
        'en-US': `https://clouse.app/en/category/${cat.id}`,
      },
    },
  };
}

export default async function LocalizedCategoryPage({ params }: CategoryPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';
  const category = getLocalizedCategoryById(slug, locale);

  if (!category) {
    notFound();
  }

  const tools = getLocalizedToolsByCategory(category.id, locale);
  const otherCategories = getLocalizedCategories(locale).filter((c) => c.id !== category.id);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <Link href={`/${locale}/tools`}>{isPt ? 'Categorias' : 'Categories'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{category.name}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? `${tools.length} Utilitários Especializados` : `${tools.length} Dedicated Utilities`}</span>
          </div>
          <div className="hero-head-cat">
            <div className="tile-icn">
              <Icon name={category.icon} size={32} />
            </div>
            <h1 className="h-d2">{category.name}</h1>
          </div>
          <p className="lead">{category.blurb}</p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <div className="tools-grid">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} locale={locale} />
            ))}
          </div>

          {/* Explore Other Categories */}
          <div className="mt-80">
            <div className="section-head center">
              <div className="eyebrow">
                <span className="dot" />
                <span>{isPt ? 'Mais Categorias' : 'More Categories'}</span>
              </div>
              <h2 className="h-d2">{isPt ? 'Explore Outros Domínios' : 'Explore Other Toolkits'}</h2>
            </div>
            <div className="cat-grid">
              {otherCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} locale={locale} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
