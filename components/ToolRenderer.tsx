'use client';
import React, { useEffect, useRef } from 'react';
import { renderTool } from '@/lib/tool-engine';
import { useToast } from '@/components/ToastContext';
import { Icon } from '@/lib/icons';

interface ToolRendererProps {
  slug: string;
}

export function ToolRenderer({ slug }: ToolRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (containerRef.current) {
      // Clear container and mount tool
      containerRef.current.innerHTML = '';
      const ok = renderTool(slug, containerRef.current, showToast);
      if (!ok) {
        containerRef.current.innerHTML = `
          <div class="error-note">
            <span class="icon-wrapper">${Icon({ name: 'alert-triangle', size: 18 })}</span>
            <span>This tool could not be loaded. Please refresh the page.</span>
          </div>
        `;
      }
    }
  }, [slug, showToast]);

  return (
    <div className="tool-card">
      <div ref={containerRef} id="tool-container" />
    </div>
  );
}
