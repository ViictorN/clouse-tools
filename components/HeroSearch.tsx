'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';

export function HeroSearch() {
  const [val, setVal] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      router.push(`/search?q=${encodeURIComponent(val.trim())}`);
    } else {
      window.dispatchEvent(new CustomEvent('open-command-palette'));
    }
  };

  return (
    <form className="hero-search" onSubmit={handleSubmit} role="search">
      <Icon name="search" size={22} />
      <input
        type="search"
        placeholder="Search 67 tools (e.g. json, age, percentage, base64)..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        aria-label="Search tools"
      />
      <button type="submit" className="btn btn-primary">
        <span>Search</span>
      </button>
    </form>
  );
}
