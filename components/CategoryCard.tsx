import React from 'react';
import Link from 'next/link';
import { Category, toolsByCategory } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function CategoryCard({ category }: { category: Category }) {
  const tools = toolsByCategory(category.id);

  return (
    <Link
      href={`/category/${category.id}`}
      className="cat-card"
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
