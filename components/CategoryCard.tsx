'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedCategory } from '@/lib/translations';
import { useInView } from '@/hooks/use-in-view';

const SUBTITLES: Record<string, { en: string; 'pt-br': string }> = {
  math: {
    en: 'A little less mental math.',
    'pt-br': 'Menos esforço mental. Mais precisão.',
  },
  converter: {
    en: 'Different units. Same clarity.',
    'pt-br': 'Unidades diferentes. Mesma clareza.',
  },
  text: {
    en: 'Make every word count.',
    'pt-br': 'Faça cada palavra render.',
  },
  time: {
    en: 'Get time on your side.',
    'pt-br': 'Coloque o tempo a seu favor.',
  },
  dev: {
    en: 'Less friction. More flow.',
    'pt-br': 'Menos atrito. Mais fluxo.',
  },
  design: {
    en: 'Give your ideas room.',
    'pt-br': 'Dê espaço para as suas ideias.',
  },
};

export function CategoryCard({
  category,
  locale: propLocale,
  className = '',
}: {
  category: Category;
  locale?: Locale;
  className?: string;
}) {
  const { ref: cardRef, inView } = useInView<HTMLAnchorElement>();
  const pathname = usePathname();

  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');
  const localizedCat = getLocalizedCategory(category, locale);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const sub = SUBTITLES[category.id]?.[locale] || localizedCat.desc;
  const ariaLabel = locale === 'pt-br' ? `Explorar categoria ${localizedCat.name}` : `Browse ${localizedCat.name}`;

  return (
    <Link
      ref={cardRef}
      href={`/${locale}/category/${category.id}`}
      className={`cat-card-row ${className} ${inView ? 'is-in' : ''}`}
      onMouseMove={handleMouseMove}
      aria-label={ariaLabel}
    >
      <div className="cat-row-icon-box">
        <Icon name={category.icon} size={20} />
      </div>

      <div className="cat-row-content">
        <h3 className="cat-row-title">{localizedCat.name}</h3>
        <p className="cat-row-desc">{sub}</p>
      </div>

      <span className="cat-row-chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
