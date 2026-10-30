import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS, getTool, getCategory, toolsByCategory } from '@/lib/data';
import { ToolRenderer } from '@/components/ToolRenderer';
import { ToolStatusStrip } from '@/components/ToolStatusStrip';
import { ToolStartButton } from '@/components/ToolStartButton';
import { RelatedRail } from '@/components/RelatedRail';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';
import { Icon } from '@/lib/icons';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  return {
    title: `${tool.name} — Free Online Tool`,
    description: `${tool.desc} Free, instant, and 100% private. Computed directly in your browser with zero latency.`,
    keywords: tool.kw.split(',').map((k) => k.trim()),
    openGraph: {
      title: `${tool.name} · Clouse Tools`,
      description: tool.desc,
      type: 'website',
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) {
    notFound();
  }

  const category = getCategory(tool.cat);
  const related = toolsByCategory(tool.cat)
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
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <Link href="/tools">Tools</Link>
            {category && (
              <>
                <Icon name="chevron-right" size={13} />
                <Link href={`/category/${category.id}`}>{category.name}</Link>
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
            <ToolStatusStrip />
            <ToolStartButton />
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
              <h2>About {tool.name}</h2>
              <p>{tool.about}</p>
              <ul>
                <li>
                  <Icon name="bolt" size={18} />
                  <span>
                    <strong>Instant Reactivity:</strong> Outputs recompute on every keystroke with zero delay.
                  </span>
                </li>
                <li>
                  <Icon name="shield-check" size={18} />
                  <span>
                    <strong>100% Client-Side Privacy:</strong> Nothing is ever transmitted to a server or third party.
                  </span>
                </li>
                <li>
                  <Icon name="copy" size={18} />
                  <span>
                    <strong>One-Click Clipboard:</strong> Easily copy results, formatted code, or generated assets.
                  </span>
                </li>
              </ul>
            </Reveal>

            {/* Related Tools */}
            {related.length > 0 && (
              <Reveal className="related">
                <RelatedRail tools={related} title={`Related ${category?.name || 'Tools'}`} />
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
