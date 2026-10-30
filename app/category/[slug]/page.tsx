import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES, getCategory, toolsByCategory } from '@/lib/data';
import { ToolCard } from '@/components/ToolCard';
import { CalibGrid } from '@/components/CalibGrid';
import { Icon } from '@/lib/icons';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.id,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);

  if (!cat) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${cat.name} — Free Online Utilities`,
    description: `${cat.desc} ${cat.blurb}`,
    openGraph: {
      title: `${cat.name} · Clouse Tools`,
      description: cat.blurb,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const tools = toolsByCategory(category.id);
  const otherCategories = CATEGORIES.filter((c) => c.id !== category.id);

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <Link href="/tools">Categories</Link>
            <Icon name="chevron-right" size={13} />
            <span>{category.name}</span>
          </nav>

          <div className="eyebrow">
            <Icon name={category.icon} size={14} />
            <span>Domain Collection</span>
          </div>

          <h1 className="h-d2">{category.name}</h1>
          <p className="lead">{category.blurb}</p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container">
          <div className="section-head-row">
            <div className="result-count">
              Showing {tools.length} utilities in {category.name}
            </div>
            <Link href="/tools" className="link-arrow">
              <span>View all 67 tools</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>

          <h2 className="sr-only">Tools in {category.name}</h2>
          <div className="tools-grid" data-reveal-group>
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} className="reveal-fade" />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Other Categories */}
      <section className="section section-pt-0">
        <div className="container">
          <div className="section-head mb-24">
            <div className="eyebrow">
              <span className="dot" />
              <span>Explore More</span>
            </div>
            <h2 className="h-d3 mt-12">Other Categories</h2>
          </div>

          <div className="cat-grid" data-reveal-group>
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="cat-card reveal-fade"
              >
                <div className="cat-head">
                  <div className="tile-icn soft">
                    <Icon name={cat.icon} size={24} />
                  </div>
                  <span className="cat-count">
                    {toolsByCategory(cat.id).length} TOOLS
                  </span>
                </div>
                <h3>{cat.name}</h3>
                <p>{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
