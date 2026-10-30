'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedCategory, getLocalizedToolsByCategory } from '@/lib/translations';
import { useInView } from '@/hooks/use-in-view';

export function CategoryCard({ category, locale: propLocale, className = '' }: { category: Category; locale?: Locale; className?: string }) {
  const { ref: cardRef, inView } = useInView<HTMLAnchorElement>();
  const pathname = usePathname();

  const locale: Locale =
    propLocale || (pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en');
  const localizedCat = getLocalizedCategory(category, locale);
  const tools = getLocalizedToolsByCategory(category.id, locale);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const badgeText = locale === 'pt-br' ? `${tools.length} FERRAMENTAS` : `${tools.length} TOOLS`;
  const ariaLabel = locale === 'pt-br' ? `Explorar categoria ${localizedCat.name}` : `Browse ${localizedCat.name}`;

  return (
    <Link
      ref={cardRef}
      href={`/${locale}/category/${category.id}`}
      className={`cat-card ${className} ${inView ? 'is-in' : ''}`}
      onMouseMove={handleMouseMove}
      aria-label={ariaLabel}
    >
      <div className="cat-head">
        <div className="cat-icon-box">
          <Icon name={category.icon} size={22} />
        </div>
        <span className="cat-count">{badgeText}</span>
      </div>

      <div className="cat-body">
        <h3 className="cat-title">{localizedCat.name}</h3>
        <p className="cat-desc">{localizedCat.desc}</p>
      </div>

      <div className="cat-tags">
        {tools.slice(0, 4).map((tool) => (
          <span key={tool.slug}>{tool.name}</span>
        ))}
      </div>
    </Link>
  );
}
