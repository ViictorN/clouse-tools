'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'suggest-tool',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }
    // Pure client-side feedback state
    setSubmitted(true);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Icon name="chevron-right" size={13} />
            <span>Contact &amp; Feedback</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>Get In Touch</span>
          </div>
          <h1 className="h-d2">Contact &amp; Support</h1>
          <p className="lead">
            Have a suggestion, found a bug, or want a new tool added? We would love to hear from you.
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container" style={{ maxWidth: 840 }}>
          {submitted ? (
            /* Página de Obrigado / Thank You Card */
            <div
              className="demo-block"
              style={{
                textAlign: 'center',
                padding: '56px 32px',
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--sh-md)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(48, 209, 88, 0.14)',
                  color: 'var(--ok)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Icon name="check" size={32} />
              </div>
              <h2 className="h-d3">Obrigado pela sua mensagem!</h2>
              <p className="lead" style={{ maxWidth: 460, margin: '12px auto 24px' }}>
                Recebemos sua mensagem com sucesso.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: 'var(--pill)',
                  background: 'rgba(0, 113, 227, 0.08)',
                  color: 'var(--blue)',
                  fontWeight: 600,
                  fontSize: '14px',
                  marginBottom: '32px',
                }}
              >
                <Icon name="clock" size={16} />
                <span>Promessa de resposta: retornamos em até 24 horas úteis.</span>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'suggest-tool', message: '' });
                  }}
                >
                  <span>Enviar outra mensagem</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              {/* Form */}
              <div className="demo-block" style={{ margin: 0 }}>
                <h3>Envie sua mensagem</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label className="t-label" htmlFor="c-name">
                      Seu Nome
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      className="t-input"
                      placeholder="Ex: Victor Gomes"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="t-label" htmlFor="c-email">
                      Seu E-mail
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      className="t-input"
                      placeholder="seu@email.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="t-label" htmlFor="c-topic">
                      Assunto
                    </label>
                    <select
                      id="c-topic"
                      className="t-select"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    >
                      <option value="suggest-tool">Sugerir uma nova ferramenta</option>
                      <option value="report-bug">Reportar um bug ou erro</option>
                      <option value="feedback">Feedback de design e usabilidade</option>
                      <option value="partnership">Parceria ou contato geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="t-label" htmlFor="c-message">
                      Mensagem
                    </label>
                    <textarea
                      id="c-message"
                      className="t-area"
                      placeholder="Conte para nós como podemos melhorar o Clouse Tools..."
                      required
                      style={{ minHeight: '130px' }}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                    <button type="submit" className="btn btn-blue">
                      <Icon name="arrow-right" size={16} />
                      <span>Enviar Mensagem</span>
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>
                      🔒 Resposta garantida em até 24h
                    </span>
                  </div>
                </form>
              </div>

              {/* Direct Channels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="t-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="tile-icn soft" style={{ width: 40, height: 40 }}>
                      <Icon name="code" size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px' }}>GitHub Issues</h4>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>Comunidade Open Source</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', marginBottom: '14px' }}>
                    Acompanhe o roadmap, abra issues ou envie pull requests diretamente no repositório.
                  </p>
                  <a
                    href="https://github.com/ViictorN/clouse-tools/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    <span>Abrir issue no GitHub</span>
                    <Icon name="arrow-up-right" size={14} />
                  </a>
                </div>

                <div className="t-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="tile-icn soft" style={{ width: 40, height: 40 }}>
                      <Icon name="sparkles" size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px' }}>Suporte Direto</h4>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>E-mail oficial</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', marginBottom: '14px' }}>
                    Envie dúvidas ou sugestões para nossa caixa de entrada oficial.
                  </p>
                  <a
                    href="mailto:hello@clouse.tools"
                    className="link-arrow"
                  >
                    <span>hello@clouse.tools</span>
                    <Icon name="arrow-right" size={14} />
                  </a>
                </div>

                <div className="t-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="tile-icn soft" style={{ width: 40, height: 40, background: 'rgba(48, 209, 88, 0.12)', color: 'var(--ok)' }}>
                      <Icon name="check" size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px' }}>WhatsApp / Telegram</h4>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>Canal de Comunicação</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', marginBottom: '14px' }}>
                    Fale diretamente com os mantenedores do projeto para parcerias e integrações.
                  </p>
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20sobre%20o%20Clouse%20Tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    <span>Conversar no WhatsApp</span>
                    <Icon name="arrow-up-right" size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
