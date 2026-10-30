'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { CalibGrid } from '@/components/CalibGrid';
import type { Locale } from '@/lib/i18n';
import type {
  ControlPriority,
  EngineeringVerificationItem,
  SecurityBestPracticeItem,
} from '@clouse/core';
import type { ToolManifest } from '@clouse/tool-sdk';

export interface GovernanceSummaryView {
  supabaseProjectRef: string;
  liveSupabaseConnected: boolean;
  toolsCatalog: {
    totalTools: number;
    browserClientTools: number;
    serverSyncTools: number;
    workerAsyncTools: number;
    all10PublicationGatesPassed: boolean;
  };
  engineeringMatrix2000: {
    totalChecks: number;
    domainsCount: number;
    p0Count: number;
    p1Count: number;
    p2Count: number;
    approvedCount: number;
  };
  securityPractices500: {
    totalPractices: number;
    domainsCount: number;
    p0Count: number;
    p1Count: number;
    p2Count: number;
    verifiedCount: number;
  };
  auditChain: {
    valid: boolean;
    checkedEntries: number;
  };
}

interface MatrixPageResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface PlatformGovernanceClientProps {
  locale: Locale;
  initialSummary: GovernanceSummaryView;
  serverTools: ToolManifest[];
  initialEngineering: MatrixPageResult<EngineeringVerificationItem>;
  initialSecurity: MatrixPageResult<SecurityBestPracticeItem>;
}

const SERVER_TOOL_DESCRIPTIONS_PT: Record<string, string> = {
  'pdf-security-inspector':
    'Bloqueia scripts ativos em PDF, criptografia restritiva e excesso de páginas.',
  'image-sanitizer':
    'Confere dimensões reais de imagens e remove metadados de localização EXIF.',
  'archive-safety-auditor':
    'Verifica arquivos ZIP contra compressão excessiva e caminhos fora da pasta.',
  'url-ssrf-auditor':
    'Valida endereços HTTPS externos e bloqueia redes locais ou privadas.',
  'media-stream-inspector':
    'Inspeciona duração e fluxos de áudio e vídeo MP4, MP3 e WAV em fila isolada.',
  'markdown-html-sanitizer':
    'Remove scripts, eventos inline e links inseguros de trechos HTML e SVG.',
};

const STAGE_LABELS_EN: Record<string, string> = {
  projeto: 'Design',
  implementacao: 'Implementation',
  implantacao: 'Deployment',
  operacao: 'Operations',
  auditoria: 'Audit',
  Especificacao: 'Specification',
  Implementacao: 'Implementation',
  Teste_automatizado: 'Automated test',
  Observabilidade: 'Monitoring',
  Operacao_continua: 'Operations',
};

const STAGE_LABELS_PT: Record<string, string> = {
  projeto: 'Projeto',
  implementacao: 'Implementação',
  implantacao: 'Implantação',
  operacao: 'Operação',
  auditoria: 'Auditoria',
  Especificacao: 'Especificação',
  Implementacao: 'Implementação',
  Teste_automatizado: 'Teste automatizado',
  Observabilidade: 'Monitoramento',
  Operacao_continua: 'Operação contínua',
};

export function PlatformGovernanceClient({
  locale,
  initialSummary,
  serverTools,
  initialEngineering,
  initialSecurity,
}: PlatformGovernanceClientProps) {
  const isPt = locale === 'pt-br';

  const [summary] = useState<GovernanceSummaryView>(initialSummary);
  const [activeMatrix, setActiveMatrix] = useState<'engineering' | 'security'>('engineering');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ControlPriority>('ALL');
  const [visibleLimit, setVisibleLimit] = useState(12);

  const [engData, setEngData] = useState<MatrixPageResult<EngineeringVerificationItem>>(initialEngineering);
  const [secData, setSecData] = useState<MatrixPageResult<SecurityBestPracticeItem>>(initialSecurity);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Place Forms After Intent: sandbox tester opens only when the user clicks the primary CTA
  const [testerOpen, setTesterOpen] = useState(false);
  const [selectedTestTool, setSelectedTestTool] = useState<'markdown-html-sanitizer' | 'url-ssrf-auditor'>(
    'markdown-html-sanitizer'
  );
  const [htmlSample, setHtmlSample] = useState(
    '<h2>Relatório</h2><img src="x" onerror="alert(1)" /><script>steal()</script><a href="javascript:alert(1)">Link</a>'
  );
  const [urlSample, setUrlSample] = useState('https://127.0.0.1/internal-admin');
  const [testRunning, setTestRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testStatusOk, setTestStatusOk] = useState<boolean>(true);

  const fetchMatrixSlice = useCallback(
    async (matrix: 'engineering' | 'security', limit: number, q: string, prio: 'ALL' | ControlPriority) => {
      setLoadingMatrix(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: String(Math.min(100, limit)),
        });
        if (q.trim()) params.set('q', q.trim());
        if (prio !== 'ALL') params.set('priority', prio);

        const res = await fetch(`/api/v1/compliance/${matrix}?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (matrix === 'engineering') {
          setEngData(json);
        } else {
          setSecData(json);
        }
      } finally {
        setLoadingMatrix(false);
      }
    },
    []
  );

  useEffect(() => {
    const isInitialDefault =
      activeMatrix === 'engineering' &&
      visibleLimit === 12 &&
      searchQuery.trim() === '' &&
      priorityFilter === 'ALL';
    if (isInitialDefault) {
      setEngData(initialEngineering);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchMatrixSlice(activeMatrix, visibleLimit, searchQuery, priorityFilter);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeMatrix, visibleLimit, searchQuery, priorityFilter, fetchMatrixSlice, initialEngineering]);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestRunning(true);
    setTestOutput(null);
    try {
      const payload =
        selectedTestTool === 'markdown-html-sanitizer'
          ? { content: htmlSample, format: 'html' }
          : { url: urlSample, performLiveHeadCheck: false };

      const res = await fetch(`/api/v1/tools/${selectedTestTool}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setTestStatusOk(res.ok);
      setTestOutput(JSON.stringify(json, null, 2));
    } catch {
      setTestStatusOk(false);
      setTestOutput(
        isPt
          ? 'Não foi possível concluir a verificação agora. Tente novamente.'
          : 'Could not complete the security check right now. Please try again.'
      );
    } finally {
      setTestRunning(false);
    }
  };

  const currentMatrix = activeMatrix === 'engineering' ? engData : secData;
  const canLoadMore = currentMatrix.items.length < Math.min(100, currentMatrix.total);

  const renderPriorityBadge = (priority: ControlPriority) => {
    if (priority === 'P0') return <span className="badge b-red">P0</span>;
    if (priority === 'P1') return <span className="badge b-orange">P1</span>;
    return <span className="badge b-blue">P2</span>;
  };

  return (
    <>
      <section className="page-hero platform-page-hero">
        <CalibGrid />
        <div className="bg-orb" aria-hidden="true" />
        <div className="container platform-container">
          <nav className="crumbs" aria-label={isPt ? 'Navegação estrutural' : 'Breadcrumb'}>
            <Link href={`/${locale}`}>{isPt ? 'Início' : 'Home'}</Link>
            <Icon name="chevron-right" size={13} />
            <span>{isPt ? 'Arquitetura & Segurança' : 'Architecture & Security'}</span>
          </nav>
          <h1 className="h-d2 platform-hero-title">
            {isPt ? 'Arquitetura & Segurança' : 'Architecture & Security'}
          </h1>
          <p className="lead platform-hero-lead">
            {isPt
              ? 'Motores isolados no servidor e 2.500 controles verificados no Supabase.'
              : 'Isolated server engines and 2,500 verified controls on Supabase.'}
          </p>
          <div className="platform-hero-actions">
            <button
              type="button"
              className="platform-btn-fixed platform-btn-primary"
              onClick={() => {
                setTesterOpen((prev) => !prev);
                setTestOutput(null);
              }}
              aria-expanded={testerOpen}
              aria-controls="security-engine-tester"
            >
              <Icon name="shield-check" size={18} />
              <span>{isPt ? 'Testar motor' : 'Test engine'}</span>
            </button>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="platform-btn-fixed"
            >
              <span>{isPt ? 'Contrato OpenAPI' : 'OpenAPI contract'}</span>
              <Icon name="arrow-up-right" size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="section platform-main-section">
        <div className="container platform-container platform-stack">
          {/* 1. Metric Cards (Values lead labels; no uppercase captions; no middot chains) */}
          <div
            className="platform-kpi-grid"
            role="region"
            aria-label={isPt ? 'Indicadores da plataforma' : 'Platform metrics'}
          >
            <article className="platform-kpi-card">
              <div className="platform-kpi-value">{summary.toolsCatalog.totalTools}</div>
              <div className="platform-kpi-label">
                {isPt ? 'Ferramentas ativas' : 'Active tools'}
              </div>
              <p className="platform-kpi-meta">
                {isPt
                  ? `${summary.toolsCatalog.browserClientTools} no navegador e ${
                      summary.toolsCatalog.serverSyncTools + summary.toolsCatalog.workerAsyncTools
                    } no servidor`
                  : `${summary.toolsCatalog.browserClientTools} in browser and ${
                      summary.toolsCatalog.serverSyncTools + summary.toolsCatalog.workerAsyncTools
                    } on server`}
              </p>
            </article>

            <article className="platform-kpi-card">
              <div className="platform-kpi-value">
                {summary.engineeringMatrix2000.totalChecks.toLocaleString(isPt ? 'pt-BR' : 'en-US')}
              </div>
              <div className="platform-kpi-label">
                {isPt ? 'Verificações de engenharia' : 'Engineering checks'}
              </div>
              <p className="platform-kpi-meta">
                {isPt
                  ? `${summary.engineeringMatrix2000.domainsCount} domínios (${summary.engineeringMatrix2000.p0Count} bloqueantes P0)`
                  : `${summary.engineeringMatrix2000.domainsCount} domains (${summary.engineeringMatrix2000.p0Count} P0 blockers)`}
              </p>
            </article>

            <article className="platform-kpi-card">
              <div className="platform-kpi-value">{summary.securityPractices500.totalPractices}</div>
              <div className="platform-kpi-label">
                {isPt ? 'Práticas de segurança' : 'Security practices'}
              </div>
              <p className="platform-kpi-meta">
                {isPt
                  ? `${summary.securityPractices500.domainsCount} domínios (${summary.securityPractices500.p0Count} controles P0)`
                  : `${summary.securityPractices500.domainsCount} domains (${summary.securityPractices500.p0Count} P0 controls)`}
              </p>
            </article>

            <article className="platform-kpi-card">
              <div className="platform-kpi-value mono-ref">{summary.supabaseProjectRef}</div>
              <div className="platform-kpi-label">
                {isPt ? 'Banco Supabase' : 'Supabase database'}
              </div>
              <p className="platform-kpi-meta">
                {summary.auditChain.valid
                  ? isPt
                    ? 'Acesso por linha ativo e auditoria íntegra'
                    : 'Row access active and audit verified'
                  : isPt
                    ? 'Revisão de auditoria necessária'
                    : 'Audit review required'}
              </p>
            </article>
          </div>

          {/* 2. On-Demand Security Engine Tester */}
          {testerOpen && (
            <section
              id="security-engine-tester"
              className="platform-tester-panel"
              aria-labelledby="tester-heading"
            >
              <div className="platform-tester-head">
                <h2 id="tester-heading" className="h-d3">
                  {isPt ? 'Testar motor na API' : 'Test API engine'}
                </h2>
                <button
                  type="button"
                  className="platform-btn-fixed"
                  onClick={() => setTesterOpen(false)}
                >
                  <Icon name="x" size={16} />
                  <span>{isPt ? 'Fechar painel' : 'Close panel'}</span>
                </button>
              </div>

              <form className="platform-tester-form" onSubmit={handleRunTest}>
                <div className="platform-field-group">
                  <label htmlFor="test-tool-select" className="platform-label">
                    {isPt ? 'Motor de verificação' : 'Verification engine'}
                  </label>
                  <select
                    id="test-tool-select"
                    className="platform-select"
                    value={selectedTestTool}
                    onChange={(e) => {
                      setSelectedTestTool(
                        e.target.value as 'markdown-html-sanitizer' | 'url-ssrf-auditor'
                      );
                      setTestOutput(null);
                    }}
                  >
                    <option value="markdown-html-sanitizer">
                      {isPt
                        ? 'Limpador de HTML e SVG (markdown-html-sanitizer)'
                        : 'HTML & SVG Sanitizer (markdown-html-sanitizer)'}
                    </option>
                    <option value="url-ssrf-auditor">
                      {isPt
                        ? 'Protetor de links externos (url-ssrf-auditor)'
                        : 'External URL Guard (url-ssrf-auditor)'}
                    </option>
                  </select>
                </div>

                {selectedTestTool === 'markdown-html-sanitizer' ? (
                  <div className="platform-field-group">
                    <label htmlFor="test-html-input" className="platform-label">
                      {isPt ? 'Trecho HTML ou SVG' : 'HTML or SVG snippet'}
                    </label>
                    <textarea
                      id="test-html-input"
                      className="platform-textarea"
                      value={htmlSample}
                      onChange={(e) => setHtmlSample(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="platform-field-group">
                    <label htmlFor="test-url-input" className="platform-label">
                      {isPt ? 'Endereço HTTPS' : 'HTTPS address'}
                    </label>
                    <input
                      id="test-url-input"
                      type="text"
                      className="platform-input mono"
                      value={urlSample}
                      onChange={(e) => setUrlSample(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="platform-btn-fixed platform-btn-primary"
                    disabled={testRunning}
                  >
                    <Icon name="player-play" size={16} />
                    <span>
                      {testRunning
                        ? isPt
                          ? 'Verificando...'
                          : 'Checking...'
                        : isPt
                          ? 'Executar verificação'
                          : 'Run check'}
                    </span>
                  </button>
                </div>
              </form>

              {testOutput && (
                <div role="status" aria-live="polite">
                  <div className="mb-24">
                    <span className={`badge ${testStatusOk ? 'b-green' : 'b-red'}`}>
                      {testStatusOk
                        ? isPt
                          ? 'Entrada validada e limpa'
                          : 'Input validated and cleaned'
                        : isPt
                          ? 'Entrada bloqueada pela política de segurança'
                          : 'Input blocked by security policy'}
                    </span>
                  </div>
                  <pre className="out-box mt-0">{testOutput}</pre>
                </div>
              )}
            </section>
          )}

          {/* 3. Six Server & Worker Security Engines */}
          <div className="platform-section-block">
            <div className="platform-section-header">
              <h2>{isPt ? 'Motores isolados de servidor' : 'Isolated server engines'}</h2>
            </div>

            <div className="platform-engines-grid">
              {serverTools.map((tool) => (
                <article key={tool.slug} className="platform-engine-card">
                  <div className="platform-engine-body">
                    <div className="platform-engine-head">
                      <span className="badge b-blue">
                        {tool.executionMode === 'worker_async'
                          ? isPt
                            ? 'Fila isolada'
                            : 'Isolated queue'
                          : isPt
                            ? 'Resposta imediata'
                            : 'Direct response'}
                      </span>
                      <span className="platform-engine-slug">{tool.slug}</span>
                    </div>

                    <h3 className="platform-engine-title">{tool.name}</h3>
                    <p className="platform-engine-desc">
                      {isPt
                        ? SERVER_TOOL_DESCRIPTIONS_PT[tool.slug] ?? tool.summary
                        : tool.summary}
                    </p>
                  </div>

                  <div className="platform-engine-specs">
                    <span>{Math.max(1, Math.round(tool.maxInputBytes / (1024 * 1024)))} MB máx.</span>
                    <span>{tool.timeoutMs / 1000}s limite</span>
                    <span>{tool.rateLimitPerMinute}/min</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 4. Interactive 2,500-Control Compliance Explorer */}
          <div className="platform-section-block">
            <div className="platform-section-header">
              <h2>
                {isPt ? 'Matriz de 2.500 controles verificáveis' : '2,500 verifiable controls matrix'}
              </h2>
            </div>

            <div className="platform-matrix-card">
              <div className="platform-matrix-toolbar">
                <div
                  className="platform-matrix-tabs"
                  role="group"
                  aria-label={isPt ? 'Selecionar matriz de controles' : 'Select control matrix'}
                >
                  <button
                    type="button"
                    className={`platform-tab-btn ${activeMatrix === 'engineering' ? 'is-selected' : ''}`}
                    aria-pressed={activeMatrix === 'engineering'}
                    onClick={() => {
                      setActiveMatrix('engineering');
                      setVisibleLimit(12);
                    }}
                  >
                    {isPt ? '2.000 Engenharia' : '2,000 Engineering'}
                  </button>
                  <button
                    type="button"
                    className={`platform-tab-btn ${activeMatrix === 'security' ? 'is-selected' : ''}`}
                    aria-pressed={activeMatrix === 'security'}
                    onClick={() => {
                      setActiveMatrix('security');
                      setVisibleLimit(12);
                    }}
                  >
                    {isPt ? '500 Segurança' : '500 Security'}
                  </button>
                </div>

                <span className="platform-page-info">
                  {loadingMatrix
                    ? isPt
                      ? 'Atualizando...'
                      : 'Updating...'
                    : currentMatrix.total === 1
                      ? isPt
                        ? '1 controle'
                        : '1 control'
                      : isPt
                        ? `${currentMatrix.total.toLocaleString('pt-BR')} controles`
                        : `${currentMatrix.total.toLocaleString('en-US')} controls`}
                </span>
              </div>

              <div className="platform-filters-grid">
                <div className="platform-field-group">
                  <label htmlFor="matrix-search-input" className="platform-label">
                    {isPt ? 'Buscar controle' : 'Search control'}
                  </label>
                  <input
                    id="matrix-search-input"
                    type="search"
                    className="platform-input"
                    placeholder={isPt ? 'Código, domínio ou termo' : 'Code, domain, or keyword'}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleLimit(12);
                    }}
                  />
                </div>

                <div className="platform-field-group">
                  <label htmlFor="matrix-priority-select" className="platform-label">
                    {isPt ? 'Prioridade' : 'Priority'}
                  </label>
                  <select
                    id="matrix-priority-select"
                    className="platform-select"
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as 'ALL' | ControlPriority);
                      setVisibleLimit(12);
                    }}
                  >
                    <option value="ALL">{isPt ? 'Todas' : 'All'}</option>
                    <option value="P0">{isPt ? 'P0 — Bloqueante' : 'P0 — Blocker'}</option>
                    <option value="P1">{isPt ? 'P1 — Alta' : 'P1 — High'}</option>
                    <option value="P2">{isPt ? 'P2 — Padrão' : 'P2 — Standard'}</option>
                  </select>
                </div>
              </div>

              <div className="platform-records-list" aria-live="polite">
                {activeMatrix === 'engineering' ? (
                  engData.items.length === 0 ? (
                    <div className="empty-state">
                      <h3>{isPt ? 'Nenhum controle encontrado' : 'No controls found'}</h3>
                      <p>
                        {isPt
                          ? 'Limpe o campo de busca ou troque a prioridade selecionada.'
                          : 'Clear the search field or change the selected priority.'}
                      </p>
                      <button
                        type="button"
                        className="platform-btn-fixed"
                        onClick={() => {
                          setSearchQuery('');
                          setPriorityFilter('ALL');
                          setVisibleLimit(12);
                        }}
                      >
                        {isPt ? 'Limpar filtros' : 'Clear filters'}
                      </button>
                    </div>
                  ) : (
                    engData.items.map((item) => (
                      <div key={item.code} className="platform-record-row">
                        <div className="platform-record-code">{item.code}</div>
                        <div className="platform-record-domain">
                          <span>
                            {String(item.domainNumber).padStart(2, '0')}. {item.domainName}
                          </span>
                          <span>
                            {isPt
                              ? STAGE_LABELS_PT[item.stage] ?? item.stage
                              : STAGE_LABELS_EN[item.stage] ?? item.stage}
                          </span>
                        </div>
                        <div className="platform-record-statement">{item.statement}</div>
                        <div className="platform-record-badges">
                          {renderPriorityBadge(item.priority)}
                        </div>
                      </div>
                    ))
                  )
                ) : secData.items.length === 0 ? (
                  <div className="empty-state">
                    <h3>{isPt ? 'Nenhuma prática encontrada' : 'No practices found'}</h3>
                    <p>
                      {isPt
                        ? 'Limpe o campo de busca ou troque a prioridade selecionada.'
                        : 'Clear the search field or change the selected priority.'}
                    </p>
                    <button
                      type="button"
                      className="platform-btn-fixed"
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('ALL');
                        setVisibleLimit(12);
                      }}
                    >
                      {isPt ? 'Limpar filtros' : 'Clear filters'}
                    </button>
                  </div>
                ) : (
                  secData.items.map((item) => (
                    <div key={item.code} className="platform-record-row">
                      <div className="platform-record-code">{item.code}</div>
                      <div className="platform-record-domain">
                        <span>
                          {String(item.domainNumber).padStart(2, '0')}. {item.domainName}
                        </span>
                        <span>{item.topic}</span>
                      </div>
                      <div className="platform-record-statement">{item.statement}</div>
                      <div className="platform-record-badges">
                        {renderPriorityBadge(item.priority)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canLoadMore && (
                <div className="platform-pagination">
                  <span className="platform-page-info">
                    {isPt
                      ? `Exibindo ${currentMatrix.items.length} de ${currentMatrix.total.toLocaleString('pt-BR')}`
                      : `Showing ${currentMatrix.items.length} of ${currentMatrix.total.toLocaleString('en-US')}`}
                  </span>
                  <button
                    type="button"
                    className="platform-btn-fixed"
                    disabled={loadingMatrix}
                    onClick={() => setVisibleLimit((prev) => Math.min(100, prev + 24))}
                  >
                    {isPt ? 'Mostrar mais controles' : 'Show more controls'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
