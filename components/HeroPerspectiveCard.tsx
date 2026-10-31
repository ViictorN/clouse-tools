'use client';
import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { Locale } from '@/lib/i18n';
import { GSAP_EASE, prefersReducedMotion } from '@/lib/motion';

interface HeroPerspectiveCardProps {
  locale: Locale;
}

export function HeroPerspectiveCard({ locale }: HeroPerspectiveCardProps) {
  const isPt = locale === 'pt-br';
  const prefix = isPt ? '/pt-br' : '/en';
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const tools = [
    { icon: '%', label: isPt ? 'Calcular' : 'Calculate', slug: 'percentage-calculator' },
    { icon: '⇄', label: isPt ? 'Converter' : 'Convert', slug: 'unit-converter' },
    { icon: 'A', label: isPt ? 'Texto' : 'Text', slug: 'word-counter' },
    { icon: '📅', label: isPt ? 'Datas' : 'Pick', slug: 'date-difference' },
    { icon: '{ }', label: isPt ? 'Dev' : 'Develop', slug: 'json-formatter' },
    { icon: '✦', label: isPt ? 'Design' : 'Design', slug: 'color-palette-generator' },
  ];

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current || !cardRef.current) return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const container = containerRef.current;
    const card = cardRef.current;
    const pill = pillRef.current;

    // Default resting transform values
    const rest = {
      rotY: -8,
      rotX: 6,
      rotZ: -2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(card, {
        rotateY: rest.rotY + x * 10,
        rotateX: rest.rotX - y * 8,
        rotateZ: rest.rotZ + x * 2,
        y: -y * 8,
        duration: 0.6,
        ease: GSAP_EASE.smooth,
        overwrite: 'auto',
      });

      if (pill) {
        gsap.to(pill, {
          x: x * 14,
          y: y * 12,
          duration: 0.8,
          ease: GSAP_EASE.smooth,
          overwrite: 'auto',
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateY: rest.rotY,
        rotateX: rest.rotX,
        rotateZ: rest.rotZ,
        y: 0,
        duration: 0.9,
        ease: GSAP_EASE.editorial,
        overwrite: 'auto',
      });

      if (pill) {
        gsap.to(pill, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: GSAP_EASE.editorial,
          overwrite: 'auto',
        });
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
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
            <span className="hpc-logo-icon">C</span>
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
            <Link
              key={item.label}
              href={`${prefix}/tool/${item.slug}`}
              className="hpc-tool-tile"
              tabIndex={-1}
            >
              <span className="hpc-tile-icon">{item.icon}</span>
              <span className="hpc-tile-name">{item.label}</span>
            </Link>
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
