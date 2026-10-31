import React from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export default function NotFound() {
  return (
    <section className="page-hero not-found">
      <span className="nf-art" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" focusable="false">
          <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="1.4" opacity="0.3" />
          <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="1.4" opacity="0.18" />
          <path d="M60 30 L68 60 L60 90 L52 60 Z" fill="currentColor" opacity="0.45" />
          <path d="M60 30 L68 60 L52 60 Z" fill="currentColor" />
          <circle cx="60" cy="60" r="3.4" fill="currentColor" />
        </svg>
      </span>

      <div className="eyebrow">
        <span className="dot" />
        <span>Erro 404 · Page Not Found</span>
      </div>
      <h1 className="h-display">Página não encontrada.</h1>
      <p className="lead nf-lead">
        A página ou ferramenta que você procurou não existe ou mudou de endereço.
        Todos os 67 utilitários continuam disponíveis e operantes a uma busca de distância.
      </p>
      <div className="cta-actions">
        <Link href="/pt-br" className="btn btn-primary">
          <Icon name="arrow-right" size={16} />
          <span>Início (PT-BR)</span>
        </Link>
        <Link href="/en" className="btn btn-secondary">
          <Icon name="world" size={16} />
          <span>Home (EN)</span>
        </Link>
        <Link href="/pt-br/tools" className="btn btn-ghost">
          <Icon name="search" size={16} />
          <span>Explorar 67 Ferramentas</span>
        </Link>
      </div>
    </section>
  );
}
