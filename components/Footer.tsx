'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale } from '@/lib/i18n';
import { getLocalizedCategories, getLocalizedPopularTools, t } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';

export function Footer() {
  const pathname = usePathname();
  const locale: Locale =
    pathname?.startsWith('/pt-br') || pathname?.startsWith('/pt') ? 'pt-br' : 'en';

  const categories = getLocalizedCategories(locale);
  const popular = getLocalizedPopularTools(locale, 6);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href={`/${locale}`} className="nav-logo" aria-label="Clouse Tools Home">
              <span className="logo-mark" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span className="logo-text">CLOUSE TOOLS</span>
            </Link>
            <p>{t('footer.brand', locale)}</p>
          </div>

          <div>
            <h2>{t('footer.cats', locale)}</h2>
            <ul>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/${locale}/category/${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{t('footer.quick', locale)}</h2>
            <ul>
              {popular.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${locale}/tool/${tool.slug}`}>{tool.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{t('footer.legal', locale)}</h2>
            <ul>
              <li>
                <Link href={`/${locale}/about`}>
                  {locale === 'pt-br' ? 'Sobre o Clouse' : 'About Clouse'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/platform`}>
                  {locale === 'pt-br' ? 'Arquitetura & Segurança' : 'Architecture & Security'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`}>
                  {locale === 'pt-br' ? 'Contato & Suporte' : 'Contact & Support'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/components`}>
                  {locale === 'pt-br' ? 'Design System' : 'Design System'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`}>
                  {locale === 'pt-br' ? 'Política de Privacidade' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`}>
                  {locale === 'pt-br' ? 'Termos de Uso' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/ViictorN/clouse-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow"
                >
                  GitHub Repository
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Clouse Tools. Handcrafted by{' '}
            <a
              href="https://github.com/ViictorN"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, textDecoration: 'underline' }}
            >
              Victor Gomes
            </a>
            . {t('footer.allRights', locale)}
          </p>

          <div className="footer-actions">
            <LanguageSelector currentLocale={locale} />
            <div className="footer-social">
              <a
                href="https://github.com/ViictorN/clouse-tools"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                title="GitHub Repository"
              >
                <Icon name="code" size={18} />
              </a>
              <a
                href={`/${locale}/components`}
                aria-label="Design System"
                title="Design System"
              >
                <Icon name="palette" size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
