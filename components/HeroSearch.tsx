'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

export function HeroSearch() {
  const [val, setVal] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(val.trim())}`);
    } else {
      window.dispatchEvent(new CustomEvent('open-command-palette'));
    }
  };

  const placeholder =
    locale === 'pt-br'
      ? 'Buscar 67 ferramentas (ex: json, idade, porcentagem, base64)...'
      : 'Search 67 tools (e.g. json, age, percentage, base64)...';

  const buttonText = locale === 'pt-br' ? 'Buscar' : 'Search';

  return (
    <form className="hero-search" onSubmit={handleSubmit} role="search">
      <Icon name="search" size={22} />
      <input
        type="search"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        aria-label={placeholder}
      />
      <button type="submit" className="btn btn-primary">
        <span>{buttonText}</span>
      </button>
    </form>
  );
}
