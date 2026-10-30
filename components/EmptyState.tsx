'use client';
import React from 'react';

interface EmptyStateProps {
  title: string;
  hint: string;
  actionLabel: string;
  onAction: () => void;
}

const COMPASS = (
  <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
    <circle cx="48" cy="48" r="31" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
    <circle cx="48" cy="48" r="22" stroke="currentColor" strokeWidth="1" opacity="0.18" />
    <path d="M48 21 L55 48 L48 75 L41 48 Z" fill="currentColor" opacity="0.5" />
    <path d="M48 21 L55 48 L41 48 Z" fill="currentColor" />
    <path d="M16 82 L26 72" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
    <path d="M80 82 L70 72" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
  </svg>
);

/**
 * Authored empty state: a quiet compass, one honest sentence, one way out.
 * Used by the directory and the search results when nothing matches.
 */
export function EmptyState({ title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-art">{COMPASS}</span>
      <h3>{title}</h3>
      <p>{hint}</p>
      <button type="button" className="btn btn-primary" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
