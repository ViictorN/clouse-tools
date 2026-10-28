'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchTools, Tool } from '@/lib/data';
import { Icon } from '@/lib/icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Tool[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(searchTools('').slice(0, 8));
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const list = searchTools(query).slice(0, 10);
    setResults(list);
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or parent
          window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        }
      } else if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      } else if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(`/tool/${results[selectedIndex].slug}`);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="search-panel">
        <div className="search-row">
          <Icon name="search" size={22} />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search all 67 tools... (e.g. json, age, percentage)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="search-hint">ESC</span>
        </div>

        <div className="search-results">
          {results.length > 0 ? (
            results.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/tool/${tool.slug}`}
                className={`sr-item ${index === selectedIndex ? 'active' : ''}`}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="tile-icn soft">
                  <Icon name={tool.icon} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sr-name">{tool.name}</div>
                  <div className="sr-cat">{tool.cat.toUpperCase()} • {tool.desc}</div>
                </div>
                <Icon name="arrow-right" size={16} style={{ color: 'var(--ink-3)' }} />
              </Link>
            ))
          ) : (
            <div className="sr-empty">
              <b>No tools found</b>
              <span>Try searching for percentage, json, age, image, or uuid</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
