'use client';
import React, { useState } from 'react';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  locale?: Locale;
}

const FAQS_PT: FAQItem[] = [
  {
    q: 'As ferramentas são realmente gratuitas e sem limites?',
    a: 'Sim, 100% gratuitas. Não existem planos pagos, limites de uso diário ou bloqueios de recursos. Todas as 67 ferramentas operam de forma irrestrita.',
  },
  {
    q: 'Meus dados são enviados para algum servidor?',
    a: 'Não. Todos os cálculos, conversões, manipulações de texto e gerações de arquivos rodam 100% dentro do seu próprio navegador. Nenhum dado digitado ou arquivo carregado sai do seu dispositivo.',
  },
  {
    q: 'Preciso criar uma conta ou fazer login para usar?',
    a: 'Nenhum cadastro é necessário. Você abre a página da ferramenta desejada e já pode utilizá-la instantaneamente.',
  },
  {
    q: 'O site funciona no celular e em outros navegadores?',
    a: 'Sim. O Clouse Tools foi desenhado mobile-first e é compatível com Chrome, Safari, Firefox, Edge e qualquer navegador moderno em iOS, Android, macOS e Windows.',
  },
  {
    q: 'Posso usar as ferramentas em modo offline?',
    a: 'Sim. Graças à arquitetura client-side em Service Workers e cache local, após carregar uma ferramenta você pode continuar utilizando-a mesmo sem conexão com a internet.',
  },
];

const FAQS_EN: FAQItem[] = [
  {
    q: 'Are these tools truly free with no limits?',
    a: 'Yes, 100% free. There are no paid tiers, no daily calculation quotas, and no feature gates. All 67 tools are fully accessible without restriction.',
  },
  {
    q: 'Is my data transmitted to any remote server?',
    a: 'Never. All calculations, conversions, text modifications, and file parsers run 100% locally inside your browser sandbox. Nothing you type or upload ever leaves your machine.',
  },
  {
    q: 'Do I need an account or sign-up to use Clouse Tools?',
    a: 'Zero sign-ups required. Open any tool and use it immediately without email capture or friction.',
  },
  {
    q: 'Does it work seamlessly on mobile and across modern browsers?',
    a: 'Yes. Clouse Tools is built mobile-first and is strictly tested on Chrome, Safari, Firefox, Edge, iOS, Android, macOS, and Windows.',
  },
  {
    q: 'Can I use these utilities offline?',
    a: 'Yes. Because all 67 tools execute client-side, once cached in your browser you can run calculations and format code even without an active internet connection.',
  },
];

export function FAQSection({ locale = 'en' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = locale === 'pt-br' ? FAQS_PT : FAQS_EN;
  const heading = locale === 'pt-br' ? 'Perguntas Frequentes' : 'Frequently Asked Questions';
  const eyebrow = locale === 'pt-br' ? 'Tire suas dúvidas' : 'Common questions';

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
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
                  id={`faq-btn-${idx}`}
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                >
                  <span>{faq.q}</span>
                  <div className={`faq-chevron ${isOpen ? 'rotated' : ''}`}>
                    <Icon name="chevron-down" size={18} />
                  </div>
                </button>
                <div
                  id={`faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`faq-btn-${idx}`}
                  className={`faq-answer-wrapper ${isOpen ? 'open' : ''}`}
                  aria-hidden={!isOpen}
                >
                  <div className="faq-answer-inner">
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
