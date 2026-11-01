'use client';
import React, { useRef, useEffect } from 'react';
import { Locale } from '@/lib/i18n';
import { prefersReducedMotion } from '@/lib/motion';

interface HeroPerspectiveCardProps {
  locale?: Locale;
}

export function HeroPerspectiveCard({ locale = 'en' }: HeroPerspectiveCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const isPt = locale === 'pt-br';

  const tools = [
    { icon: '%', label: isPt ? 'Cálculo' : 'Calculate' },
    { icon: '⇄', label: isPt ? 'Converter' : 'Convert' },
    { icon: 'A', label: isPt ? 'Texto' : 'Text' },
    { icon: '◷', label: isPt ? 'Datas' : 'Dates' },
    { icon: '{ }', label: isPt ? 'DevOps' : 'Develop' },
    { icon: '✦', label: isPt ? 'Design' : 'Design' },
  ];

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    const pill = pillRef.current;
    if (!container || !card || !pill) return;

    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      // Realistic 3D Tilt: clamped and subtle
      const rotateY = normX * 9 + 4; // base subtle perspective
      const rotateX = -normY * 7 - 3;
      const pillOffsetX = normX * 14;
      const pillOffsetY = normY * 10;

      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
      pill.style.transform = `translate3d(${pillOffsetX}px, ${pillOffsetY}px, 32px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1100px) rotateX(-2deg) rotateY(5deg) translateZ(0)';
      pill.style.transform = 'translate3d(0, 0, 24px)';
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-perspective-container" aria-hidden="true">
      {/* Decorative dark rounded frame with top subtitle */}
      <div className="hpc-frame-header">
        <span className="hpc-frame-badge">THE EVERYDAY COLLECTION / 001</span>
      </div>

      {/* Ribbon wave backdrop */}
      <div className="hpc-wave-bg">
        <svg viewBox="0 0 400 400" className="hpc-wave-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 50,300 C 120,180 280,120 350,220 C 400,280 280,360 160,330 C 80,310 10,240 50,150 C 90,60 220,40 320,100"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 80,320 C 150,200 300,140 370,240 C 420,300 300,380 180,350 C 100,330 30,260 70,170 C 110,80 240,60 340,120"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1.2"
          />
          <circle cx="200" cy="180" r="140" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />
        </svg>
      </div>

      {/* Floating 3D Perspective Card */}
      <div ref={cardRef} className="hpc-card-3d">
        <div className="hpc-card-header">
          <div className="hpc-card-logo">
            <span className="hpc-logo-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 3.5C14.5 1.5 11 1.8 8.8 4L4 8.8C1.8 11 1.5 14.5 3.5 17C5.5 19.5 9 19.2 11.2 17L16 12.2C18.2 10 18.5 6.5 16.5 4"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 14.5L19.5 19.5"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
              </svg>
            </span>
            <span className="hpc-logo-title">CLOUSE TOOLS</span>
          </div>
          <div className="hpc-card-dots">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="hpc-card-eyebrow">
          {isPt ? 'COM MENOS ESFORÇO' : 'A LITTLE LESS EFFORT'}
        </div>

        <h3 className="hpc-card-title">
          <span>{isPt ? 'Grandes ideias.' : 'Big ideas.'}</span>
          <br />
          <span>{isPt ? 'Ferramentas simples.' : 'Simple tools.'}</span>
        </h3>

        <div className="hpc-card-grid">
          {tools.map((item) => (
            <div
              key={item.label}
              className="hpc-tool-tile"
            >
              <span className="hpc-tile-icon">{item.icon}</span>
              <span className="hpc-tile-name">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Floating Glass Pill Badge with Parallax Offset */}
        <div ref={pillRef} className="hpc-floating-pill">
          <span className="hpc-sparkle">✦</span>
          <span>{isPt ? 'Menos atrito. Mais fluidez.' : 'Less friction. More flow.'}</span>
        </div>
      </div>
    </div>
  );
}
