'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { renderTool } from '@/lib/tool-engine';
import { useToast } from '@/components/ToastContext';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

interface ToolRendererProps {
  slug: string;
}

export function ToolRenderer({ slug }: ToolRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const { showToast } = useToast();
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  useEffect(() => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem('clouse-recent') || '[]');
      const filtered = recent.filter((s) => s !== slug);
      const updated = [slug, ...filtered].slice(0, 6);
      localStorage.setItem('clouse-recent', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('clouse-recent-updated', { detail: updated }));
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (containerRef.current) {
      setHasError(false);
      containerRef.current.innerHTML = '';
      const ok = renderTool(slug, containerRef.current, showToast, locale);
      if (!ok) {
        setHasError(true);
      }
    }
  }, [slug, showToast, locale]);

  return (
    <div className="tool-card">
      {hasError ? (
        <div className="error-note" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon name="alert-triangle" size={20} />
          <span>
            {locale === 'pt-br'
              ? 'Esta ferramenta não pôde ser carregada. Por favor, atualize a página.'
              : 'This tool could not be loaded. Please refresh the page.'}
          </span>
        </div>
      ) : (
        <div ref={containerRef} id="tool-container" />
      )}
    </div>
  );
}
