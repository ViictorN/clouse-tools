import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import { Locale, isValidLocale, LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const isPt = locale === 'pt-br';
  const title = isPt ? 'Termos de Uso' : 'Terms of Use';
  const description = isPt
    ? 'Termos de uso do Clouse Tools: ferramentas online gratuitas, executadas no navegador e sem rastreamento.'
    : 'Terms of use for Clouse Tools: free, browser-based tools provided as-is without tracking.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isPt ? 'pt_BR' : 'en_US',
      url: `${SITE_URL}/${locale}/terms`,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/terms`,
      languages: {
        'pt-BR': `${SITE_URL}/pt-br/terms`,
        'en-US': `${SITE_URL}/en/terms`,
      },
    },
  };
}

export default async function LocalizedTermsPage({ params }: TermsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const isPt = locale === 'pt-br';

  return (
    <>
      <section className="page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Termos' : 'Terms'}</span>
          </nav>
          <div className="eyebrow">
            <span className="dot" />
            <span>{isPt ? 'Aviso Legal' : 'Legal Notice'}</span>
          </div>
          <h1 className="h-d2">{isPt ? 'Termos de Uso' : 'Terms of Use'}</h1>
          <div className="page-hero-cta">
            <Link href={`/${locale}/tools`} className="btn btn-primary">
              <span>{isPt ? 'Explorar 67 Ferramentas' : 'Explore 67 Tools'}</span>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
          <p className="lead">
            {isPt ? 'A versão resumida, compreensível e humana.' : 'The short, human-readable version.'}
          </p>
        </div>
      </section>

      <section className="section section-pt-0">
        <div className="container prose">
          <h2>{isPt ? '1. O serviço' : '1. The service'}</h2>
          <p>
            {isPt
              ? 'O Clouse Tools disponibiliza ferramentas gratuitas executadas diretamente no seu navegador, computando resultados localmente no seu dispositivo. O serviço é oferecido no estado em que se encontra ("as-is"), sem garantias expressas ou implícitas de qualquer natureza.'
              : 'Clouse Tools provides free, browser-based utilities that compute results locally on your device. The service is provided "as-is", without warranties of any kind, express or implied.'}
          </p>

          <h2>{isPt ? '2. Uso aceitável' : '2. Acceptable use'}</h2>
          <ul>
            <li>
              {isPt
                ? 'Utilize as ferramentas exclusivamente para propósitos lícitos.'
                : 'Use the tools for lawful purposes only.'}
            </li>
            <li>
              {isPt
                ? 'Não tente perturbar, sobrecarregar ou abusar do serviço.'
                : 'Do not attempt to disrupt or abuse the service.'}
            </li>
            <li>
              {isPt
                ? 'Você é integral e exclusivamente responsável pelo conteúdo que insere ou processa através das ferramentas.'
                : 'You remain exclusively responsible for any content you process with the tools.'}
            </li>
          </ul>

          <h2>{isPt ? '3. Resultados e precisão' : '3. Results and accuracy'}</h2>
          <p>
            {isPt
              ? 'Todas as ferramentas são calibradas e testadas rigorosamente contra algoritmos de referência da indústria. Entretanto, os cálculos são oferecidos sem garantia legal ou financeira. Para decisões de missão crítica — médicas, jurídicas ou engenharia aeroespacial/estrutural — sempre valide com as entidades técnicas competentes.'
              : 'Every tool is engineered for precision and tested against established reference algorithms. However, calculations are provided without legal or financial warranty. For mission-critical decisions — medical, legal, or specialized engineering — always verify results with standard accredited authorities.'}
          </p>

          <h2>{isPt ? '4. Propriedade intelectual' : '4. Intellectual property'}</h2>
          <p>
            {isPt
              ? 'O design da interface, componentes, arquitetura de código e marca Clouse Tools são de autoria de Victor Gomes e contribuidores. Seus dados, textos e arquivos processados pertencem 100% a você: nós nunca recebemos, retemos ou reivindicamos direitos sobre seus inputs ou outputs.'
              : 'The interface, component architecture, code, and branding of Clouse Tools are the property of Victor Gomes and contributors. Your inputs and outputs remain 100% yours: we never receive, store, or claim any ownership over your data.'}
          </p>

          <h2>{isPt ? '5. Limitação de responsabilidade' : '5. Limitation of liability'}</h2>
          <p>
            {isPt
              ? 'Na extensão máxima permitida pela legislação aplicável, o Clouse Tools e seus desenvolvedores não serão responsáveis por quaisquer danos diretos, indiretos ou consequenciais decorrentes do uso ou incapacidade de uso do serviço.'
              : 'To the maximum extent permitted by applicable law, Clouse Tools shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the service.'}
          </p>

          <h2>{isPt ? '6. Contato' : '6. Contact'}</h2>
          <p>
            {isPt ? 'Para dúvidas sobre estes termos: ' : 'Questions about these terms? Email: '}
            <strong>hello@clouse.app</strong>
          </p>
        </div>
      </section>
    </>
  );
}
