'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS_EN: FAQItem[] = [
  {
    q: 'Are my files, passwords, and data safe when using Clouse Tools?',
    a: 'Absolutely. Every tool executes 100% locally on your device within your browser window using HTML5 Canvas and native Web Crypto APIs. No files, passwords, tokens, or numbers are ever uploaded or transmitted to any server.',
  },
  {
    q: 'Is Clouse Tools completely free? Are there any hidden limits or premium tiers?',
    a: 'Clouse Tools is 100% free with zero paywalls, zero account registrations, and zero premium tiers. All 67 utilities are fully accessible without restriction.',
  },
  {
    q: 'Can I use these tools offline without an active internet connection?',
    a: 'Yes! Because the platform is built with client-side Next.js static generation, once a page is loaded in your browser, the computation logic executes locally on your CPU with zero external API calls.',
  },
  {
    q: 'How accurate are the conversion and mathematical calculations?',
    a: 'All algorithms are grounded in official international standards (including ISO-8601 for calendar calculations, NIST unit constants, RFC 4122 for UUIDs, and FIPS 180-4 for SHA cryptographic hashes) ensuring precise, dependable results.',
  },
  {
    q: 'How can I report a bug or request a new utility to be added?',
    a: 'Clouse Tools is an open-source project hosted on GitHub. You can open an issue, propose a new tool idea, or submit a pull request directly at github.com/ViictorN/clouse-tools, or send a message via our Contact page.',
  },
];

const FAQS_PT: FAQItem[] = [
  {
    q: 'Meus arquivos, senhas e dados confidenciais estão seguros?',
    a: 'Sim, com segurança absoluta. Cada ferramenta é executada 100% localmente no seu dispositivo através de Web APIs nativas e Web Crypto. Nenhuma senha, token JWT, número ou arquivo é enviado para servidores externos.',
  },
  {
    q: 'O Clouse Tools é totalmente gratuito? Há limites ou planos pagos?',
    a: 'O Clouse Tools é 100% gratuito, sem planos pagos, sem necessidade de cadastro e sem limitações diárias. Todos os 67 utilitários estão disponíveis para uso ilimitado.',
  },
  {
    q: 'Posso usar as ferramentas sem conexão ativa com a internet?',
    a: 'Sim! Uma vez que a página é carregada no seu navegador, todo o código de computação é estático e executado diretamente pelo processador do seu computador ou celular, sem requisições de rede.',
  },
  {
    q: 'Qual o nível de precisão dos cálculos e conversões?',
    a: 'Todas as fórmulas utilizam constantes e padrões internacionais certificados (ISO-8601 para datas, constantes NIST para unidades de medida, RFC 4122 para UUIDs e FIPS 180-4 para hashes criptográficos SHA-256).',
  },
  {
    q: 'Como posso sugerir uma nova ferramenta ou reportar um problema?',
    a: 'O projeto é de código aberto e mantido no GitHub. Você pode abrir uma issue, propor melhorias ou submeter pull requests diretamente em github.com/ViictorN/clouse-tools, ou usar nossa página de Contato.',
  },
];

export function FAQSection({ locale: propLocale }: { locale?: Locale }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const pathname = usePathname();

  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');

  const faqs = locale === 'pt-br' ? FAQS_PT : FAQS_EN;

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  const eyebrow = locale === 'pt-br' ? 'Dúvidas Frequentes' : 'Frequently Asked Questions';
  const heading =
    locale === 'pt-br'
      ? 'Respostas diretas sobre segurança e funcionamento.'
      : 'Everything you need to know about our privacy and architecture.';

  return (
    <section className="section" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="section-head center mb-24">
          <div className="eyebrow">
            <span className="dot" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="h-d2">{heading}</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <div className={`faq-chevron ${isOpen ? 'rotated' : ''}`}>
                    <Icon name="chevron-down" size={18} />
                  </div>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
