import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';
  const title = isPt ? 'Política de Privacidade' : 'Privacy Policy';
  const description = isPt
    ? 'Política de privacidade do Clouse Tools: 100% de computação no navegador, sem coleta de dados e sem telemetria.'
    : 'Privacy policy for Clouse Tools: 100% client-side computation with zero data collection.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `https://clouse.app/${locale}/privacy`,
    },
    alternates: {
      canonical: `https://clouse.app/${locale}/privacy`,
      languages: {
        'pt-BR': 'https://clouse.app/pt-br/privacy',
        'en-US': 'https://clouse.app/en/privacy',
      },
    },
  };
}

export default async function LocalizedPrivacyPage({ params }: PrivacyPageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Privacidade' : 'Privacy'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Privacidade & Segurança' : 'Privacy & Security'}</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Política de Privacidade' : 'Privacy Policy'}</h1>
          <p className="lead">
            {isPt
              ? 'A política de privacidade mais transparente e direta que você lerá hoje.'
              : 'The shortest, clearest privacy policy you will read today.'}
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <div className="card-note">
            <strong>TL;DR:</strong>{' '}
            {isPt
              ? 'Nós não coletamos seus dados. Não temos acesso aos seus arquivos. Suas senhas, textos, números e cálculos ocorrem estritamente no seu navegador e nunca saem do seu computador ou celular.'
              : 'We do not collect your data. We cannot see your data. Your files, text, numbers, and generated results are processed entirely in your browser and never leave your device.'}
          </div>

          <h2>{isPt ? 'O que acontece quando você usa uma ferramenta' : 'What happens when you use a tool'}</h2>
          <p>
            {isPt
              ? 'Cada cálculo — de matemática percentual a formatação de JSON e manipulação de imagens — roda em JavaScript local na janela do seu navegador. Ao redimensionar uma imagem ou extrair uma paleta de cores, o arquivo é processado na memória RAM através de um elemento HTML5 canvas. Nenhum upload de arquivo é realizado.'
              : 'Every calculation — from percentage math to JSON formatting and image compression — runs as local JavaScript in your browser window. When you resize an image or extract a color palette, the file is read in-memory and rendered to an HTML5 canvas element. No file upload ever occurs.'}
          </p>

          <h2>{isPt ? 'O que nós NÃO possuímos' : 'What we do not have'}</h2>
          <ul>
            <li>
              {isPt
                ? 'Sem contas de usuário ou formulários de cadastro — não armazenamos nomes, e-mails ou credenciais.'
                : 'No user accounts, profiles, or sign-up forms — so we store no names, emails, or credentials.'}
            </li>
            <li>
              {isPt
                ? 'Sem rastreadores invasivos, redes de anúncios ou scripts de fingerprinting.'
                : 'No invasive trackers, advertising networks, or user fingerprinting scripts.'}
            </li>
            <li>
              {isPt
                ? 'Sem banco de dados armazenando seus inputs ou outputs — não há backend interceptando suas operações.'
                : 'No database storing your inputs or outputs — there is no backend server receiving your requests.'}
            </li>
            <li>
              {isPt
                ? 'Sem cookies de terceiros.'
                : 'No tracking cookies set on your browser.'}
            </li>
          </ul>

          <h2>{isPt ? 'Controle Total do Usuário' : 'Total User Control'}</h2>
          <p>
            {isPt
              ? 'Por ser uma execução estritamente client-side, ao fechar a aba do navegador todo o estado ativo de cálculo é descartado da memória RAM. Simplesmente não há nada em nenhum servidor remoto para vazar, invadir ou vender.'
              : 'Because execution is purely client-side, closing the browser tab completely clears your active calculation state. There is simply nothing on any remote server to leak, breach, or sell.'}
          </p>

          <p>
            {isPt ? 'Dúvidas ou auditorias de segurança?' : 'Questions?'} Contact:{' '}
            <strong>hello@clouse.app</strong>
          </p>
        </div>
      </section>
    </>
  );
}
