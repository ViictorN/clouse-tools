'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

export default function LocalizedComponentsPage() {
  const { showToast } = useToast();
  const [rangeVal, setRangeVal] = useState(50);
  const [segActive, setSegActive] = useState('one');
  const [switchChecked, setSwitchChecked] = useState(true);

  const pathname = usePathname();
  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';
  const isPt = locale === 'pt-br';

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Componentes' : 'Components'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Design System</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Design System & Tokens' : 'Design System & Tokens'}</h1>
          <p className="lead">
            {isPt
              ? 'As primitivas fundamentais do Clouse Tools: tokens de cor, botões, inputs, superfícies em vidro e micro-interações.'
              : 'The foundational primitives of Clouse Tools: tokens, buttons, inputs, surfaces, and interactive feedback.'}
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container pb-40">
          {/* Buttons */}
          <div className="demo-block">
            <h2>{isPt ? 'Botões' : 'Buttons'}</h2>
            <div className="demo-row">
              <button type="button" className="btn btn-primary">
                {isPt ? 'Primário' : 'Primary'}
              </button>
              <button type="button" className="btn btn-blue">
                {isPt ? 'Azul' : 'Blue'}
              </button>
              <button type="button" className="btn btn-ghost">
                Ghost
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                {isPt ? 'Pequeno' : 'Small'}
              </button>
              <Link href={`/${locale}/tools`} className="link-arrow">
                <span>{isPt ? 'Link de texto' : 'Text link'}</span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </div>

          {/* Badges */}
          <div className="demo-block">
            <h2>Badges</h2>
            <div className="demo-row">
              <span className="badge b-blue">
                <span className="dot" />
                Popular
              </span>
              <span className="badge b-green">
                <span className="dot" />
                Online
              </span>
              <span className="badge b-gray">
                <span className="dot" />
                {isPt ? 'Rascunho' : 'Draft'}
              </span>
              <span className="badge b-orange">
                <span className="dot" />
                Beta
              </span>
              <span className="badge b-red">
                <span className="dot" />
                {isPt ? 'Erro' : 'Error'}
              </span>
            </div>
          </div>

          {/* Form controls */}
          <div className="demo-block">
            <h2>{isPt ? 'Controles de Formulário' : 'Form Controls'}</h2>
            <div className="demo-grid-2">
              <div className="fg">
                <label>{isPt ? 'Input de Texto' : 'Text Input'}</label>
                <input type="text" placeholder={isPt ? 'Digite algo...' : 'Type something...'} />
                <span className="hint">{isPt ? 'Dica ou texto de suporte' : 'Helper text beneath input'}</span>
              </div>
              <div className="fg">
                <label>{isPt ? 'Menu de Seleção' : 'Select Dropdown'}</label>
                <select defaultValue="2">
                  <option value="1">{isPt ? 'Opção 1' : 'Option 1'}</option>
                  <option value="2">{isPt ? 'Opção 2 (Padrão)' : 'Option 2 (Default)'}</option>
                  <option value="3">{isPt ? 'Opção 3' : 'Option 3'}</option>
                </select>
              </div>
            </div>

            <div className="fg mt-16">
              <label>{isPt ? `Controle Deslizante: ${rangeVal}%` : `Range Slider: ${rangeVal}%`}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={rangeVal}
                onChange={(e) => setRangeVal(Number(e.target.value))}
              />
            </div>

            <div className="demo-row mt-20">
              <div className="segmented">
                <button
                  type="button"
                  className={segActive === 'one' ? 'active' : ''}
                  onClick={() => setSegActive('one')}
                >
                  {isPt ? 'Opção A' : 'Option A'}
                </button>
                <button
                  type="button"
                  className={segActive === 'two' ? 'active' : ''}
                  onClick={() => setSegActive('two')}
                >
                  {isPt ? 'Opção B' : 'Option B'}
                </button>
                <button
                  type="button"
                  className={segActive === 'three' ? 'active' : ''}
                  onClick={() => setSegActive('three')}
                >
                  {isPt ? 'Opção C' : 'Option C'}
                </button>
              </div>

              <label className="switch-row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={switchChecked}
                  onChange={(e) => setSwitchChecked(e.target.checked)}
                />
                <span className="switch-slider" />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                  {switchChecked ? (isPt ? 'Ativado' : 'Enabled') : (isPt ? 'Desativado' : 'Disabled')}
                </span>
              </label>
            </div>
          </div>

          {/* Interactive toasts */}
          <div className="demo-block">
            <h2>{isPt ? 'Notificações Toast' : 'Toast Notifications'}</h2>
            <p className="lead" style={{ marginBottom: 16 }}>
              {isPt
                ? 'Feedback visual não intrusivo com auto-dismiss para cópias e ações rápidas.'
                : 'Lightweight feedback states with auto-dismiss.'}
            </p>
            <div className="demo-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  showToast(isPt ? 'Copiado para a área de transferência!' : 'Copied to clipboard!')
                }
              >
                {isPt ? 'Disparar Notificação' : 'Trigger Success Toast'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  showToast(isPt ? 'Aviso: Entrada ajustada automaticamente' : 'Warning: Input auto-adjusted')
                }
              >
                {isPt ? 'Disparar Alerta' : 'Trigger Warning Toast'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
