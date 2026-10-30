import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';
  const title = isPt ? 'Sobre o Clouse Tools' : 'About Clouse Tools';
  const description = isPt
    ? 'A história do Clouse Tools: 67 ferramentas online gratuitas, privativas e executadas no navegador para produtividade sem atrito.'
    : 'The story behind Clouse Tools: 67 free, private, client-side tools designed for everyday productivity without compromise.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `https://clouse.app/${locale}/about`,
    },
    alternates: {
      canonical: `https://clouse.app/${locale}/about`,
      languages: {
        'pt-BR': 'https://clouse.app/pt-br/about',
        'en-US': 'https://clouse.app/en/about',
      },
    },
  };
}

export default async function LocalizedAboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Sobre' : 'About'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Sobre Nós' : 'About Us'}</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Sobre o Clouse Tools' : 'About Clouse Tools'}</h1>
          <p className="lead">
            {isPt
              ? 'Ferramentas simples. Produtividade real. Grátis, para sempre, para todos.'
              : 'Simple tools. Real productivity. Free, forever, for everyone.'}
          </p>
          <div className="page-hero-cta">
            <Link href={`/${locale}/tools`} className="btn btn-primary">
              <span>{isPt ? 'Explorar 67 Ferramentas' : 'Explore 67 Tools'}</span>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <p>
            <strong>Clouse Tools</strong>{' '}
            {isPt
              ? 'é uma biblioteca de 67 utilitários online gratuitos concebidos em torno de um princípio essencial: a menor distância entre uma dúvida e a resposta. Sem barreiras de login, sem cookies de rastreamento, sem anúncios invasivos e sem cobranças — você abre a ferramenta, digita e obtém o resultado imediatamente.'
              : 'is a library of 67 free online utilities built around one simple principle: the shortest path from a question to an answer. No sign-up walls, no cookies, no tracking, and no upsells — you open a tool, you type, and you get your answer instantly.'}
          </p>

          <div className="card-note">
            <strong>{isPt ? 'Nossa promessa irrevogável:' : 'Our fundamental promise:'}</strong>{' '}
            {isPt
              ? 'cada ferramenta é executada 100% no seu navegador. Seus textos, datas, senhas, tokens e imagens são processados localmente no seu computador ou celular e nunca são transmitidos a servidores remotos.'
              : 'every tool runs 100% inside your browser. Your text, dates, passwords, tokens, and images are processed locally on your device and never uploaded to any remote server.'}
          </div>

          <h2>{isPt ? 'Por que criamos o Clouse' : 'Why we built it'}</h2>
          <p>
            {isPt
              ? 'A grande maioria dos "sites de ferramentas grátis" é sobrecarregada de anúncios poluídos, banners de consentimento de cookies, cadastros obrigatórios e upload silencioso dos dados do usuário. Nós construímos o oposto exato: um arsenal ultrarrápido, limpo e elegante com as ferramentas que as pessoas realmente usam no dia a dia.'
              : 'Most "free online tools" are weighed down with ads, cookie banners, mandatory registrations, and silently uploaded user files. We built the complete antithesis: a clean, lightning-fast toolbox with the everyday utilities people actually need — percentages, dates, text manipulation, units, image formatting, and essential developer helpers.'}
          </p>

          <h2>{isPt ? 'Princípios de Engenharia' : 'Core Engineering Principles'}</h2>
          <ul>
            <li>
              <strong>{isPt ? 'Instantâneo por padrão:' : 'Instant by default:'}</strong>{' '}
              {isPt
                ? 'Os cálculos atualizam conforme você digita, sem viagens de ida e volta a servidores na nuvem.'
                : 'Results update live as you type with zero calculation round-trips.'}
            </li>
            <li>
              <strong>{isPt ? 'Ergonomia de teclado:' : 'Keyboard-first ergonomics:'}</strong>{' '}
              {isPt
                ? 'Pressione Ctrl + K ou / em qualquer lugar para acionar a paleta global de comandos.'
                : 'Press Ctrl + K or / anywhere to trigger the global command palette.'}
            </li>
            <li>
              <strong>{isPt ? 'Privacidade nativa:' : 'Private by design:'}</strong>{' '}
              {isPt
                ? 'Imagens são manipuladas em memória via HTML5 Canvas; números aleatórios e hashes utilizam a Web Crypto API nativa do navegador.'
                : 'Media is handled via HTML5 Canvas in-memory; random numbers and cryptographic hashes utilize the native Web Crypto API.'}
            </li>
            <li>
              <strong>{isPt ? 'Acessibilidade & Design Apple:' : 'Accessible:'}</strong>{' '}
              {isPt
                ? 'HTML semântico, contraste balanceado (WCAG AA), foco visual nítido e respeito a reduced-motion.'
                : 'Semantic HTML, high contrast tokens, keyboard focus rings, and reduced-motion compliance.'}
            </li>
          </ul>

          <div className="author-box">
            <div className="author-avatar">VG</div>
            <div>
              <h3>Victor Gomes</h3>
              <p>
                {isPt
                  ? 'Engenheiro de Software & Designer. Criado para tornar utilitários online agradáveis, rápidos e éticos.'
                  : 'Software Engineer & Designer. Built to make web utilities respectful, delightful, and fast.'}
              </p>
              <div className="author-links">
                <a href="https://github.com/ViictorN" target="_blank" rel="noopener noreferrer">
                  GitHub Profile
                  <Icon name="arrow-up-right" size={13} />
                </a>
                <a href="https://github.com/ViictorN/clouse-tools" target="_blank" rel="noopener noreferrer">
                  Source Code
                  <Icon name="arrow-up-right" size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
