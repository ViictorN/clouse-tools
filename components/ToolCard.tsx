import React from 'react';
import Link from 'next/link';
import { Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${tool.slug}`}
      className={`t-card ${tool.popular ? 'popular' : ''}`}
      aria-label={`Open ${tool.name}`}
    >
      <div className="tile-icn soft">
        <Icon name={tool.icon} size={26} />
      </div>
      <div>
        <h3>{tool.name}</h3>
      </div>
      <p>{tool.desc}</p>
      <div className="t-foot">
        <span className="t-cat">{tool.cat}</span>
        <span className="t-go" aria-hidden="true">
          <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </Link>
  );
}
