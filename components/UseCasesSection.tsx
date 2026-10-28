'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedToolBySlug } from '@/lib/translations';

interface CaseItem {
  role: string;
  badge: string;
  desc: string;
  icon: string;
  toolSlugs: string[];
}

const CASES_EN: CaseItem[] = [
  {
    role: 'Developers & DevOps Engineers',
    badge: 'Code & Security',
    icon: 'code',
    desc: 'Validate formatted JSON payloads, decode JWT tokens locally without exposing secrets, test regex patterns, and hash assets with SHA-256.',
    toolSlugs: ['json-formatter', 'jwt-decoder', 'regex-tester', 'hash-generator'],
  },
  {
    role: 'Designers & Front-End Teams',
    badge: 'Visual & UI',
    icon: 'palette',
    desc: 'Extract color palettes, solve aspect ratios for responsive video embeds, generate multi-layer box shadows, and craft smooth CSS gradients.',
    toolSlugs: ['aspect-ratio-calculator', 'gradient-generator', 'shadow-generator', 'color-converter'],
  },
  {
    role: 'Students, Analysts & Finance',
    badge: 'Math & Logic',
    icon: 'calculator',
    desc: 'Calculate three-way percentages, loan amortizations, average distributions, BMI scores, and numeric bases with zero formulas to memorize.',
    toolSlugs: ['percentage-calculator', 'loan-calculator', 'average-calculator', 'number-base-converter'],
  },
  {
    role: 'Remote Teams & Content Creators',
    badge: 'Time & Prose',
    icon: 'clock',
    desc: 'Coordinate worldwide meetings across timezones, count prose reading times, clean duplicate rows, and generate URL-friendly slugs.',
    toolSlugs: ['timezone-converter', 'word-counter', 'slug-generator', 'date-difference'],
  },
];

const CASES_PT: CaseItem[] = [
  {
    role: 'Desenvolvedores & Engenheiros DevOps',
    badge: 'Código & Segurança',
    icon: 'code',
    desc: 'Valide JSONs complexos, decodifique tokens JWT sem expor segredos na nuvem, teste regex em tempo real e gere hashes SHA-256 no browser.',
    toolSlugs: ['json-formatter', 'jwt-decoder', 'regex-tester', 'hash-generator'],
  },
  {
    role: 'Designers & Equipes de Front-End',
    badge: 'Visual & UI',
    icon: 'palette',
    desc: 'Extraia paletas de cores, calcule aspect ratios para vídeos responsivos, gere sombras CSS em camadas e crie gradientes modernos.',
    toolSlugs: ['aspect-ratio-calculator', 'gradient-generator', 'shadow-generator', 'color-converter'],
  },
  {
    role: 'Estudantes, Analistas & Finanças',
    badge: 'Matemática & Lógica',
    icon: 'calculator',
    desc: 'Calcule porcentagens em três vias, simule empréstimos com tabela Price, encontre médias estatísticas e converta bases numéricas sem fórmulas.',
    toolSlugs: ['percentage-calculator', 'loan-calculator', 'average-calculator', 'number-base-converter'],
  },
  {
    role: 'Equipes Remotas & Criadores de Conteúdo',
    badge: 'Tempo & Redação',
    icon: 'clock',
    desc: 'Coordene reuniões globais entre fusos, analise tempo de leitura de artigos, remova linhas duplicadas e gere slugs amigáveis para SEO.',
    toolSlugs: ['timezone-converter', 'word-counter', 'slug-generator', 'date-difference'],
  },
];

export function UseCasesSection({ locale: propLocale }: { locale?: Locale }) {
  const pathname = usePathname();
  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');

  const cases = locale === 'pt-br' ? CASES_PT : CASES_EN;

  const eyebrow = locale === 'pt-br' ? 'Casos de Uso & Perfis' : 'Targeted Workflows';
  const heading =
    locale === 'pt-br'
      ? 'Projetado para como profissionais modernos realmente trabalham.'
      : 'Tailored for the daily demands of modern builders.';
  const lead =
    locale === 'pt-br'
      ? 'Seja depurando uma API em produção ou calculando juros de um financiamento, o Clouse Tools entrega respostas sem anúncios, cadastro ou lentidão.'
      : 'Whether you are debugging production APIs or preparing quarterly financial models, Clouse delivers instant answers with zero friction.';

  return (
    <section className="section use-cases-section">
      <div className="container">
        <div className="section-head center">
          <div className="eyebrow">
            <span className="dot" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="h-d2">{heading}</h2>
          <p className="lead" style={{ maxWidth: 680, margin: '0 auto' }}>
            {lead}
          </p>
        </div>

        <div className="cases-grid">
          {cases.map((c) => (
            <div key={c.role} className="case-card">
              <div className="case-top">
                <div className="tile-icn soft">
                  <Icon name={c.icon} size={22} />
                </div>
                <span className="case-badge">{c.badge}</span>
              </div>

              <h3>{c.role}</h3>
              <p className="case-desc">{c.desc}</p>

              <div className="case-tools">
                <span className="case-tools-label">
                  {locale === 'pt-br' ? 'Ferramentas Recomendadas:' : 'Essential Utilities:'}
                </span>
                <div className="case-chips">
                  {c.toolSlugs.map((slug) => {
                    const tool = getLocalizedToolBySlug(slug, locale);
                    if (!tool) return null;
                    return (
                      <Link key={slug} href={`/${locale}/tool/${slug}`} className="chip-sm">
                        <Icon name={tool.icon} size={13} />
                        <span>{tool.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
