'use client';
import React, { useState, useEffect } from 'react';
import { ToastProvider } from './ToastContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { MobileActionDock } from './MobileActionDock';
import { SmoothScroll } from './SmoothScroll';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setSearchOpen(true);
    const handleToggle = () => setSearchOpen((prev) => !prev);

    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('toggle-command-palette', handleToggle);

    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('toggle-command-palette', handleToggle);
    };
  }, []);

  return (
    <ToastProvider>
      <SmoothScroll>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <MobileActionDock />
        <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </SmoothScroll>
      <div className="grain-layer" aria-hidden="true" />
    </ToastProvider>
  );
}
