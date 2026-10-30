'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';

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
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
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
          <div className="page-hero-cta">
            <Link href="/tools" className="btn btn-primary">
              <span>Explore 67 Tools</span>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container contact-wrap">
          {submitted ? (
            <Reveal variant="reveal-scale" className="demo-block thanks-card">
              <div className="thanks-icon">
                <Icon name="check" size={32} />
              </div>
              <h2 className="h-d3">Obrigado pela sua mensagem!</h2>
              <p className="lead">Recebemos sua mensagem com sucesso.</p>
              <div className="thanks-chip">
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
            </Reveal>
          ) : (
            <div className="contact-grid">
              {/* Form */}
              <Reveal className="demo-block contact-form-card">
                <h2>Envie sua mensagem</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-field">
                    <label className="t-label" htmlFor="c-name">
                      Seu Nome
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      className="t-input"
                      placeholder="Ex: Victor Gomes"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="t-label" htmlFor="c-email">
                      Seu E-mail
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      inputMode="email"
                      className="t-input"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="contact-field">
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

                  <div className="contact-field">
                    <label className="t-label" htmlFor="c-message">
                      Mensagem
                    </label>
                    <textarea
                      id="c-message"
                      className="t-area contact-textarea"
                      placeholder="Conte para nós como podemos melhorar o Clouse Tools..."
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div className="contact-actions">
                    <button type="submit" className="btn btn-blue">
                      <Icon name="arrow-right" size={16} />
                      <span>Enviar Mensagem</span>
                    </button>
                    <span className="contact-note">🔒 Resposta garantida em até 24h</span>
                  </div>
                </form>
              </Reveal>

              {/* Direct Channels */}
              <div className="contact-side" data-reveal-group>
                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft">
                      <Icon name="code" size={20} />
                    </div>
                    <div>
                      <h3>GitHub Issues</h3>
                      <span className="channel-meta">Comunidade Open Source</span>
                    </div>
                  </div>
                  <p className="channel-desc">
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
                </Reveal>

                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft">
                      <Icon name="sparkles" size={20} />
                    </div>
                    <div>
                      <h3>Suporte Direto</h3>
                      <span className="channel-meta">E-mail oficial</span>
                    </div>
                  </div>
                  <p className="channel-desc">
                    Envie dúvidas ou sugestões para nossa caixa de entrada oficial.
                  </p>
                  <a href="mailto:hello@clouse.tools" className="link-arrow">
                    <span>hello@clouse.tools</span>
                    <Icon name="arrow-right" size={14} />
                  </a>
                </Reveal>

                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft channel-ok">
                      <Icon name="check" size={20} />
                    </div>
                    <div>
                      <h3>WhatsApp / Telegram</h3>
                      <span className="channel-meta">Canal de Comunicação</span>
                    </div>
                  </div>
                  <p className="channel-desc">
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
                </Reveal>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
