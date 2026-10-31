'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { CalibGrid } from '@/components/CalibGrid';
import { Reveal } from '@/components/Reveal';

export default function LocalizedContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'suggest-tool',
    message: '',
  });

  const pathname = usePathname();
  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';
  const isPt = locale === 'pt-br';

  const copy = {
    breadcrumb: isPt ? 'Contato & Feedback' : 'Contact & Feedback',
    eyebrow: isPt ? 'Fale Conosco' : 'Get In Touch',
    title: isPt ? 'Contato & Suporte' : 'Contact & Support',
    lead: isPt
      ? 'Tem uma sugestão de nova ferramenta, encontrou um bug ou quer colaborar? Adoraríamos ouvir você.'
      : 'Have a suggestion, found a bug, or want a new tool added? We would love to hear from you.',
    formTitle: isPt ? 'Envie sua mensagem' : 'Send your message',
    name: isPt ? 'Seu Nome' : 'Your Name',
    namePh: isPt ? 'Ex: Ana Silva' : 'e.g. Alex Morgan',
    email: isPt ? 'Seu E-mail' : 'Email Address',
    emailPh: isPt ? 'voce@exemplo.com' : 'you@example.com',
    topic: isPt ? 'Assunto / Categoria' : 'Topic / Category',
    topics: isPt
      ? ['Sugerir Nova Ferramenta', 'Reportar Problema Técnico / Bug', 'Parceria ou Integração', 'Outro Assunto']
      : ['Suggest a New Tool', 'Report a Bug', 'Partnership or Integration', 'Other Inquiries'],
    message: isPt ? 'Sua Mensagem' : 'Your Message',
    messagePh: isPt
      ? 'Descreva sua sugestão ou o problema detalhadamente...'
      : 'Describe your suggestion, the bug you encountered, or how we can improve...',
    submit: isPt ? 'Enviar Mensagem' : 'Send Message',
    thanksTitle: isPt ? 'Mensagem Recebida!' : 'Thank you for reaching out!',
    thanksBody: isPt
      ? 'Agradecemos o seu contato. O Clouse Tools é um projeto aberto e evolui diretamente com as contribuições e sugestões da comunidade.'
      : 'We have received your note. Because Clouse Tools is an open community-driven project, user feedback directly shapes our roadmap.',
    again: isPt ? 'Enviar Outra Mensagem' : 'Send Another Message',
    browse: isPt ? 'Explorar Ferramentas' : 'Browse All Tools',
    githubTitle: isPt ? 'GitHub Issues' : 'GitHub Issues',
    githubMeta: isPt ? 'Comunidade Open Source' : 'Open Source Community',
    githubBody: isPt
      ? 'Acompanhe o roadmap, abra issues ou envie pull requests diretamente no repositório.'
      : 'Track roadmap, submit issues, or open pull requests in our repository.',
    emailTitle: isPt ? 'Suporte Direto' : 'Direct Email',
    emailMeta: isPt ? 'Canal Oficial' : 'Official Inbox',
    emailBody: isPt
      ? 'Envie dúvidas técnicas ou propostas para nossa caixa de entrada.'
      : 'Send technical questions or partnership proposals directly to us.',
    whatsappTitle: isPt ? 'WhatsApp & Chat' : 'WhatsApp & Chat',
    whatsappMeta: isPt ? 'Comunicação Rápida' : 'Direct Instant Chat',
    whatsappBody: isPt
      ? 'Fale diretamente com os mantenedores do projeto para dúvidas e parcerias.'
      : 'Chat directly with project maintainers for instant questions and feedback.',
    whatsappCta: isPt ? 'Conversar no WhatsApp' : 'Chat on WhatsApp',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{copy.breadcrumb}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{copy.eyebrow}</span>
          </div>
          <h1 className="h-d2">{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="page-hero-cta">
            <Link href={`/${locale}/tools`} className="btn btn-primary">
              <span>{isPt ? 'Explorar 67 Ferramentas' : 'Explore 67 Tools'}</span>
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
              <h2 className="h-d3">{copy.thanksTitle}</h2>
              <p className="lead">{copy.thanksBody}</p>
              <div className="thanks-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'suggest-tool', message: '' });
                  }}
                >
                  {copy.again}
                </button>
                <Link href={`/${locale}/tools`} className="btn btn-primary">
                  <span>{copy.browse}</span>
                  <Icon name="arrow-right" size={16} />
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="contact-grid">
              <Reveal className="demo-block contact-form-card">
                <h2>{copy.formTitle}</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-row">
                    <div className="contact-field">
                      <label className="t-label" htmlFor="c-name">
                        {copy.name}
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        className="t-input"
                        placeholder={copy.namePh}
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="contact-field">
                      <label className="t-label" htmlFor="c-email">
                        {copy.email}
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        inputMode="email"
                        className="t-input"
                        placeholder={copy.emailPh}
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="contact-field">
                    <label className="t-label" htmlFor="c-topic">
                      {copy.topic}
                    </label>
                    <select
                      id="c-topic"
                      className="t-select"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    >
                      {copy.topics.map((label, index) => (
                        <option key={label} value={['suggest-tool', 'bug', 'partnership', 'other'][index]}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="contact-field">
                    <label className="t-label" htmlFor="c-message">
                      {copy.message}
                    </label>
                    <textarea
                      id="c-message"
                      className="t-area contact-textarea"
                      rows={5}
                      placeholder={copy.messagePh}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {/* Bot protection honeypot */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <input type="text" name="website_url_hp" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="contact-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-3)', marginBottom: '16px' }}>
                      <Icon name="clock" size={15} />
                      <span>{isPt ? 'Promessa de resposta: respondemos em até 24 horas úteis.' : 'Response SLA: we respond to inquiries within 24 business hours.'}</span>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <span>{copy.submit}</span>
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                </form>
              </Reveal>

              <div className="contact-side" data-reveal-group>
                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft">
                      <Icon name="code" size={20} />
                    </div>
                    <div>
                      <h3>{copy.githubTitle}</h3>
                      <span className="channel-meta">{copy.githubMeta}</span>
                    </div>
                  </div>
                  <p className="channel-desc">{copy.githubBody}</p>
                  <a
                    href="https://github.com/ViictorN/clouse-tools/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    <span>github.com/ViictorN/clouse-tools</span>
                    <Icon name="arrow-up-right" size={14} />
                  </a>
                </Reveal>

                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft">
                      <Icon name="mail" size={20} />
                    </div>
                    <div>
                      <h3>{copy.emailTitle}</h3>
                      <span className="channel-meta">{copy.emailMeta}</span>
                    </div>
                  </div>
                  <p className="channel-desc">{copy.emailBody}</p>
                  <a href="mailto:hello@clouse.tools" className="link-arrow">
                    <span>hello@clouse.tools</span>
                    <Icon name="arrow-right" size={14} />
                  </a>
                </Reveal>

                <Reveal className="t-card channel-card">
                  <div className="channel-head">
                    <div className="tile-icn soft channel-ok">
                      <Icon name="brand-whatsapp" size={20} />
                    </div>
                    <div>
                      <h3>{copy.whatsappTitle}</h3>
                      <span className="channel-meta">{copy.whatsappMeta}</span>
                    </div>
                  </div>
                  <p className="channel-desc">{copy.whatsappBody}</p>
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20conversar%20sobre%20o%20Clouse%20Tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    <span>{copy.whatsappCta}</span>
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
