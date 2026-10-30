'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n';

interface HeroPerspectiveCardProps {
  locale: Locale;
}

export function HeroPerspectiveCard({ locale }: HeroPerspectiveCardProps) {
  const isPt = locale === 'pt-br';
  const prefix = isPt ? '/pt-br' : '/en';
  const [hovered, setHovered] = useState(false);

  const tools = [
    { icon: '%', label: isPt ? 'Calcular' : 'Calculate', slug: 'percentage-calculator' },
    { icon: '⇄', label: isPt ? 'Converter' : 'Convert', slug: 'unit-converter' },
    { icon: 'A', label: isPt ? 'Texto' : 'Text', slug: 'word-counter' },
    { icon: '📅', label: isPt ? 'Datas' : 'Pick', slug: 'date-difference' },
    { icon: '{ }', label: isPt ? 'Dev' : 'Develop', slug: 'json-formatter' },
    { icon: '✦', label: isPt ? 'Design' : 'Design', slug: 'color-palette-generator' },
  ];

  return (
    <div className="hero-perspective-container" aria-hidden="true">
      {/* Decorative dark rounded frame with top subtitle */}
      <div className="hpc-frame-header">
        <span className="hpc-frame-badge">THE EVERYDAY COLLECTION / 001</span>
      </div>

      {/* Ribbon wave backdrop glow */}
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
      <div
        className={`hpc-card-3d ${hovered ? 'hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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

        {/* Floating Glass Pill Badge */}
        <div className="hpc-floating-pill">
          <span className="hpc-sparkle">✦</span>
          <span>{isPt ? 'Menos atrito. Mais fluidez.' : 'Less friction. More flow.'}</span>
        </div>
      </div>
    </div>
  );
}
