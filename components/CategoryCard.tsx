'use client';
import React, { useRef } from 'react';
import Link from 'next/link';
import { Category, toolsByCategory } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function CategoryCard({ category }: { category: Category }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const tools = toolsByCategory(category.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <Link
      ref={cardRef}
      href={`/category/${category.id}`}
      className="cat-card"
      onMouseMove={handleMouseMove}
      aria-label={`Browse ${category.name}`}
    >
      <div className="cat-head">
        <div className="tile-icn">
          <Icon name={category.icon} size={26} />
        </div>
        <span className="cat-count">{tools.length} TOOLS</span>
      </div>

      <div>
        <h3>{category.name}</h3>
      </div>
      <p>{category.desc}</p>

      <div className="cat-tags">
        {tools.slice(0, 3).map((tool) => (
          <span key={tool.slug}>{tool.name}</span>
        ))}
      </div>
    </Link>
  );
}
