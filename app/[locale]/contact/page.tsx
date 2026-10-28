'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';

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
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Contato & Feedback' : 'Contact & Feedback'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Fale Conosco' : 'Get In Touch'}</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Contato & Suporte' : 'Contact & Support'}</h1>
          <p className="lead">
            {isPt
              ? 'Tem uma sugestão de nova ferramenta, encontrou um bug ou quer colaborar? Adoraríamos ouvir você.'
              : 'Have a suggestion, found a bug, or want a new tool added? We would love to hear from you.'}
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container" style={{ maxWidth: 840 }}>
          {submitted ? (
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
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Icon name="check" size={32} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px' }}>
                {isPt ? 'Mensagem Recebida!' : 'Thank you for reaching out!'}
              </h2>
              <p style={{ color: 'var(--text-sub)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                {isPt
                  ? 'Agradecemos o seu contato. O Clouse Tools é um projeto aberto e evolui diretamente com as contribuições e sugestões da comunidade.'
                  : 'We have received your note. Because Clouse Tools is an open community-driven project, user feedback directly shapes our roadmap.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'suggest-tool', message: '' });
                  }}
                >
                  {isPt ? 'Enviar Outra Mensagem' : 'Send Another Message'}
                </button>
                <Link href={`/${locale}/tools`} className="btn btn-primary">
                  <span>{isPt ? 'Explorar Ferramentas' : 'Browse All Tools'}</span>
                  <Icon name="arrow-right" size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
              <div
                style={{
                  background: 'var(--surface)',
                  padding: '40px 32px',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--sh-sm)',
                }}
              >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        {isPt ? 'Seu Nome' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isPt ? 'Ex: Ana Silva' : 'e.g. Alex Morgan'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        {isPt ? 'Seu E-mail' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={isPt ? 'voce@exemplo.com' : 'you@example.com'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {isPt ? 'Assunto / Categoria' : 'Topic / Category'}
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                      }}
                    >
                      <option value="suggest-tool">
                        {isPt ? 'Sugerir Nova Ferramenta' : 'Suggest a New Tool'}
                      </option>
                      <option value="bug">
                        {isPt ? 'Reportar Problema Técnico / Bug' : 'Report a Bug'}
                      </option>
                      <option value="partnership">
                        {isPt ? 'Parceria ou Integração' : 'Partnership or Integration'}
                      </option>
                      <option value="other">
                        {isPt ? 'Outro Assunto' : 'Other Inquiries'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {isPt ? 'Sua Mensagem' : 'Your Message'}
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={
                        isPt
                          ? 'Descreva sua sugestão ou o problema detalhadamente...'
                          : 'Describe your suggestion, the bug you encountered, or how we can improve...'
                      }
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    <span>{isPt ? 'Enviar Mensagem' : 'Send Message'}</span>
                    <Icon name="arrow-right" size={16} />
                  </button>
                </form>
              </div>

              {/* GitHub Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface)',
                  padding: '24px 30px',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    {isPt ? 'Prefere o GitHub?' : 'Prefer GitHub?'}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                    {isPt
                      ? 'Abra uma issue ou pull request diretamente no repositório oficial.'
                      : 'Open an issue or submit a pull request directly in our repository.'}
                  </p>
                </div>
                <a
                  href="https://github.com/ViictorN/clouse-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <Icon name="code" size={16} />
                  <span>github.com/ViictorN/clouse-tools</span>
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
