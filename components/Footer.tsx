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
              <span className="logo-mark">C</span>
              <span>Clouse Tools</span>
            </Link>
            <p>{t('footer.brand', locale)}</p>
          </div>

          <div>
            <h5>{t('footer.cats', locale)}</h5>
            <ul>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/${locale}/category/${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>{t('footer.quick', locale)}</h5>
            <ul>
              {popular.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${locale}/tool/${tool.slug}`}>{tool.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>{t('footer.legal', locale)}</h5>
            <ul>
              <li>
                <Link href={`/${locale}/about`}>
                  {locale === 'pt-br' ? 'Sobre o Clouse' : 'About Clouse'}
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
