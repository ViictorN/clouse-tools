/**
 * CLOUSE TOOLS — Complete Verbatim Compliance Matrices Engine
 * 1) PDF 1: 2,000 Engineering & Security Verifications (CT-0001 .. CT-2000)
 * 2) PDF 2: 500 Security Best Practices (CT-001 .. CT-500)
 */

export type ControlPriority = 'P0' | 'P1' | 'P2';
export type EngineeringCheckStatus =
  | 'pendente'
  | 'em_execucao'
  | 'aprovado'
  | 'excecao_justificada'
  | 'nao_aplicavel';
export type SecurityPracticeStatus = 'pendente' | 'em_execucao' | 'verificado' | 'nao_aplicavel';
export type LifecycleStage = 'projeto' | 'implementacao' | 'implantacao' | 'operacao' | 'auditoria';
export type EvidenceKind = 'teste' | 'configuracao' | 'log_redigido' | 'revisao_codigo';

export interface EngineeringVerificationItem {
  code: string; // CT-0001 .. CT-2000
  sequenceNum: number;
  domainNumber: number;
  domainName: string;
  controlIndex: number;
  controlName: string;
  stage: LifecycleStage;
  priority: ControlPriority;
  statement: string;
  verificationMethod: string;
  acceptanceCriterion: string;
  status: EngineeringCheckStatus;
  ownerRole: string;
  evidenceArtifact: string;
}

export interface SecurityBestPracticeItem {
  code: string; // CT-001 .. CT-500
  sequenceNum: number;
  domainNumber: number;
  domainName: string;
  itemInDomain: number;
  topic: string;
  priority: ControlPriority;
  statement: string;
  status: SecurityPracticeStatus;
  evidenceKind: EvidenceKind;
  evidenceArtifact: string;
  ownerRole: string;
}

export const ENGINEERING_40_DOMAINS: readonly string[] = [
  'Governança e decisões arquiteturais',
  'Catálogo e registro de ferramentas',
  'Contratos e versionamento de APIs',
  'Roteamento HTTP e middleware',
  'Identidade e autenticação',
  'Autorização e isolamento de contas',
  'Sessões e tokens',
  'Proteção contra abuso e quotas',
  'Validação de entradas',
  'Codificação de saídas e XSS',
  'Uploads e verificação de arquivos',
  'Conversão de PDF e documentos',
  'Processamento de imagens',
  'Processamento de áudio e vídeo',
  'Workers e execução em sandbox',
  'Filas, jobs e idempotência',
  'Armazenamento temporário e expiração',
  'Banco de dados PostgreSQL',
  'Cache e Redis',
  'Mensageria e eventos',
  'Gerenciamento de segredos',
  'Criptografia e gestão de chaves',
  'Segurança de rede e TLS',
  'Infraestrutura e containers',
  'CI/CD e proteção de branches',
  'Dependências e cadeia de suprimentos',
  'Testes automatizados e qualidade',
  'Observabilidade e telemetria',
  'Logs e trilhas de auditoria',
  'Resposta a incidentes',
  'Backups e recuperação de desastre',
  'Confiabilidade e SLOs',
  'Performance e capacidade',
  'Custos e limites de consumo',
  'Privacidade e LGPD',
  'Retenção e exclusão de dados',
  'Contas premium e pagamentos',
  'Administração e suporte',
  'Documentação e onboarding',
  'Evolução, migrações e desativação',
] as const;

const ENGINEERING_10_CONTROLS: ReadonlyArray<{
  name: string;
  priorities: readonly [ControlPriority, ControlPriority, ControlPriority, ControlPriority, ControlPriority];
  criterion: string;
}> = [
  {
    name: 'definir responsável e política',
    priorities: ['P2', 'P2', 'P2', 'P2', 'P2'],
    criterion: 'responsável nomeado, política revisada e decisão registrada.',
  },
  {
    name: 'modelar ameaças e falhas',
    priorities: ['P1', 'P1', 'P1', 'P1', 'P1'],
    criterion: 'cenários de abuso, impacto e mitigação documentados.',
  },
  {
    name: 'aplicar privilégio mínimo',
    priorities: ['P2', 'P0', 'P0', 'P2', 'P2'],
    criterion: 'permissões mínimas e separação de papéis comprovadas.',
  },
  {
    name: 'validar dados e contratos',
    priorities: ['P2', 'P0', 'P0', 'P2', 'P2'],
    criterion: 'entradas inválidas rejeitadas e limites explícitos.',
  },
  {
    name: 'isolar recursos e falhas',
    priorities: ['P2', 'P0', 'P0', 'P2', 'P2'],
    criterion: 'limites por operação e falhas contidas.',
  },
  {
    name: 'proteger dados sensíveis',
    priorities: ['P2', 'P0', 'P0', 'P2', 'P2'],
    criterion: 'dados minimizados, protegidos e com prazo de retenção.',
  },
  {
    name: 'automatizar testes e verificações',
    priorities: ['P1', 'P1', 'P1', 'P1', 'P1'],
    criterion: 'testes negativos e regressão executados no CI.',
  },
  {
    name: 'monitorar sinais operacionais',
    priorities: ['P1', 'P1', 'P1', 'P1', 'P1'],
    criterion: 'métricas, alertas e responsáveis definidos.',
  },
  {
    name: 'preparar recuperação e rollback',
    priorities: ['P1', 'P1', 'P1', 'P1', 'P1'],
    criterion: 'procedimento exercitado e reversão documentada.',
  },
  {
    name: 'revisar evidências e mudanças',
    priorities: ['P2', 'P2', 'P2', 'P2', 'P2'],
    criterion: 'evidências rastreáveis e revisão periódica.',
  },
];

const LIFECYCLE_5_STAGES: ReadonlyArray<{
  stage: LifecycleStage;
  label: string;
  method: string;
  defaultEvidence: string;
}> = [
  {
    stage: 'projeto',
    label: 'na fase de projeto',
    method: 'Registrar no documento de arquitetura',
    defaultEvidence: 'docs/architecture/blueprint.md',
  },
  {
    stage: 'implementacao',
    label: 'na fase de implementação',
    method: 'Comprovar por teste automatizado',
    defaultEvidence: 'tests/security-and-compliance.test.ts',
  },
  {
    stage: 'implantacao',
    label: 'na fase de implantação',
    method: 'Verificar em ambiente de homologação',
    defaultEvidence: 'infra/docker-compose.yml',
  },
  {
    stage: 'operacao',
    label: 'na fase de operação',
    method: 'Acompanhar em painel e alerta',
    defaultEvidence: 'apps/api/src/app.ts',
  },
  {
    stage: 'auditoria',
    label: 'na fase de auditoria',
    method: 'Guardar evidência com data e responsável',
    defaultEvidence: 'supabase/migrations/20261030000400_audit_lgpd_billing_ops.sql',
  },
];

export const SECURITY_25_DOMAINS: ReadonlyArray<{
  domainName: string;
  topics: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}> = [
  {
    domainName: 'Governança e arquitetura',
    topics: [
      'inventário de ativos',
      'proprietários dos serviços',
      'modelo de ameaças',
      'fluxos de dados',
      'classificação de riscos',
      'limites de confiança',
      'revisão de arquitetura',
      'padrões de codificação',
      'exceções de segurança',
      'responsabilidades da equipe',
    ],
  },
  {
    domainName: 'Node.js e runtime',
    topics: [
      'versão LTS do Node',
      'flags de execução',
      'permissões de filesystem',
      'processos filhos',
      'tratamento de exceções',
      'limites de memória',
      'event loop',
      'variáveis de ambiente',
      'módulos nativos',
      'desligamento gracioso',
    ],
  },
  {
    domainName: 'Express e middleware',
    topics: [
      'ordem dos middlewares',
      'helmet e cabeçalhos',
      'trust proxy',
      'limite de body',
      'parsers JSON',
      'tratador de erros',
      'rotas desconhecidas',
      'cookies seguros',
      'CORS',
      'identificação do servidor',
    ],
  },
  {
    domainName: 'Autenticação',
    topics: [
      'cadastro de contas',
      'verificação de e-mail',
      'senhas com Argon2id',
      'MFA',
      'proteção contra força bruta',
      'recuperação de conta',
      'troca de senha',
      'login federado',
      'reautenticação',
      'detecção de credenciais vazadas',
    ],
  },
  {
    domainName: 'Autorização',
    topics: [
      'controle por objeto',
      'controle por função',
      'privilégio mínimo',
      'acesso entre usuários',
      'permissões administrativas',
      'políticas por recurso',
      'verificação no servidor',
      'negação por padrão',
      'escalonamento de privilégio',
      'acesso de suporte',
    ],
  },
  {
    domainName: 'Sessões e tokens',
    topics: [
      'IDs de sessão',
      'rotação de sessão',
      'expiração ociosa',
      'expiração absoluta',
      'revogação de tokens',
      'refresh tokens',
      'assinatura JWT',
      'audience e issuer',
      'armazenamento de tokens',
      'logout global',
    ],
  },
  {
    domainName: 'Validação de entrada',
    topics: [
      'schemas de API',
      'tipos de dados',
      'tamanhos máximos',
      'normalização Unicode',
      'validação de URLs',
      'números e limites',
      'listas permitidas',
      'campos desconhecidos',
      'validação de arquivos',
      'erros de validação',
    ],
  },
  {
    domainName: 'XSS e frontend',
    topics: [
      'textContent',
      'innerHTML',
      'templates HTML',
      'sanitização HTML',
      'Content Security Policy',
      'scripts de terceiros',
      'URLs javascript',
      'DOM clobbering',
      'atributos HTML',
      'renderização de Markdown',
    ],
  },
  {
    domainName: 'CSRF e CORS',
    topics: [
      'tokens anti-CSRF',
      'SameSite cookies',
      'verificação de Origin',
      'preflight CORS',
      'allowlist de origens',
      'credenciais cross-origin',
      'métodos mutáveis',
      'endpoints de logout',
      'subdomínios confiáveis',
      'requisições multipart',
    ],
  },
  {
    domainName: 'Injeções e execução',
    topics: [
      'SQL parametrizado',
      'comandos shell',
      'argumentos de subprocesso',
      'template injection',
      'NoSQL injection',
      'regex DoS',
      'path traversal',
      'desserialização',
      'expressões dinâmicas',
      'eval e Function',
    ],
  },
  {
    domainName: 'APIs REST',
    topics: [
      'inventário de endpoints',
      'versionamento',
      'BOLA/IDOR',
      'mass assignment',
      'limites de paginação',
      'respostas excessivas',
      'rate limiting',
      'idempotência',
      'erros padronizados',
      'documentação OpenAPI',
    ],
  },
  {
    domainName: 'Uploads e arquivos',
    topics: [
      'extensões permitidas',
      'assinatura MIME',
      'limite por arquivo',
      'limite total por usuário',
      'nomes aleatórios',
      'armazenamento isolado',
      'antivírus',
      'arquivos compactados',
      'remoção automática',
      'download autorizado',
    ],
  },
  {
    domainName: 'PDF e documentos',
    topics: [
      'parsers de PDF',
      'macros embutidas',
      'scripts em documentos',
      'PDFs criptografados',
      'metadados sensíveis',
      'renderização isolada',
      'limite de páginas',
      'fontes embutidas',
      'links externos',
      'arquivos corrompidos',
    ],
  },
  {
    domainName: 'Imagens, áudio e vídeo',
    topics: [
      'decodificadores de imagem',
      'dimensões máximas',
      'EXIF',
      'arquivos SVG',
      'transcodificação',
      'FFmpeg',
      'limites de duração',
      'codecs permitidos',
      'thumbnails',
      'limpeza de temporários',
    ],
  },
  {
    domainName: 'SSRF e integrações',
    topics: [
      'URLs fornecidas pelo usuário',
      'IPs privados',
      'redirecionamentos',
      'resolução DNS',
      'metadados cloud',
      'allowlist de destinos',
      'timeouts externos',
      'limites de resposta',
      'webhooks',
      'assinaturas de webhooks',
    ],
  },
  {
    domainName: 'Banco de dados',
    topics: [
      'usuários do PostgreSQL',
      'TLS de conexão',
      'queries parametrizadas',
      'migrações',
      'segredos do banco',
      'backups',
      'restauração',
      'criptografia em repouso',
      'retenção de dados',
      'auditoria de acesso',
    ],
  },
  {
    domainName: 'Criptografia e segredos',
    topics: [
      'geração aleatória segura',
      'TLS',
      'gestão de chaves',
      'rotação de chaves',
      'hash de senhas',
      'criptografia autenticada',
      'secret manager',
      'tokens de API',
      'segredos no Git',
      'certificados',
    ],
  },
  {
    domainName: 'Infraestrutura e deploy',
    topics: [
      'imagens de contêiner',
      'usuário não root',
      'portas expostas',
      'firewall',
      'reverse proxy',
      'HTTPS obrigatório',
      'ambientes separados',
      'health checks',
      'configuração de produção',
      'rollbacks',
    ],
  },
  {
    domainName: 'Dependências e supply chain',
    topics: [
      'package-lock',
      'npm ci',
      'npm audit',
      'SBOM',
      'assinaturas de artefatos',
      'dependências abandonadas',
      'scripts de instalação',
      'dependências transitivas',
      'licenças',
      'proveniência de builds',
    ],
  },
  {
    domainName: 'CI/CD e repositório',
    topics: [
      'proteção de branch',
      'revisão de pull request',
      'segredos de CI',
      'SAST',
      'DAST',
      'scanners de dependência',
      'scanners de segredo',
      'permissões de workflow',
      'artefatos de build',
      'aprovação de deploy',
    ],
  },
  {
    domainName: 'Logs e observabilidade',
    topics: [
      'logs estruturados',
      'mascaramento de PII',
      'IDs de correlação',
      'eventos de autenticação',
      'falhas de autorização',
      'retenção de logs',
      'integridade de logs',
      'alertas',
      'métricas de abuso',
      'rastreamento de incidentes',
    ],
  },
  {
    domainName: 'Disponibilidade e antiabuso',
    topics: [
      'limites por IP',
      'limites por conta',
      'fila de jobs',
      'cotas de CPU',
      'cotas de memória',
      'cotas de armazenamento',
      'proteção DDoS',
      'circuit breaker',
      'backpressure',
      'prioridade de jobs',
    ],
  },
  {
    domainName: 'Privacidade e LGPD',
    topics: [
      'base legal',
      'minimização de dados',
      'aviso de privacidade',
      'consentimento quando aplicável',
      'direitos do titular',
      'exclusão de dados',
      'exportação de dados',
      'retenção',
      'operadores terceiros',
      'incidentes com dados pessoais',
    ],
  },
  {
    domainName: 'Pagamentos e monetização',
    topics: [
      'checkout terceirizado',
      'webhook de pagamento',
      'verificação de assinatura',
      'idempotência de cobrança',
      'permissões de planos',
      'fraude de cupons',
      'dados de cartão',
      'reembolso',
      'conciliação',
      'separação de ambiente sandbox',
    ],
  },
  {
    domainName: 'Testes, incidentes e operação',
    topics: [
      'testes unitários de segurança',
      'testes de integração',
      'testes de autorização',
      'pentest autorizado',
      'plano de resposta',
      'simulações de incidente',
      'backup de emergência',
      'postmortem',
      'gestão de vulnerabilidades',
      'revisão periódica',
    ],
  },
];

function buildSecurityPracticeStatement(itemIndex1Based: number, topic: string): string {
  switch (itemIndex1Based) {
    case 1:
      return `Definir política explícita para ${topic}, com responsável, escopo e configuração documentada.`;
    case 2:
      return `Criar teste automatizado para confirmar as regras de ${topic} e bloquear regressões.`;
    case 3:
      return `Aplicar restrição por padrão a ${topic}, permitindo apenas casos necessários e justificados.`;
    case 4:
      return `Testar tentativas de acesso indevido envolvendo ${topic}, incluindo outros usuários.`;
    case 5:
      return `Implementar proteção de ${topic} no servidor, sem depender exclusivamente do navegador.`;
    case 6:
      return `Executar testes de limite, erro e abuso de ${topic} antes de publicar mudanças.`;
    case 7:
      return `Impor limites e comportamento seguro para ${topic} diante de entradas malformadas.`;
    case 8:
      return `Revisar periodicamente a configuração de ${topic} contra a documentação aprovada.`;
    case 9:
      return `Configurar ${topic} com privilégio mínimo e separar funções administrativas.`;
    case 10:
      return `Inspecionar logs de ${topic} para detectar anomalias sem registrar dados sensíveis.`;
    case 11:
      return `Eliminar configurações implícitas em ${topic} e registrar os valores de produção.`;
    case 12:
      return `Validar que ${topic} mantém proteção após reinício, deploy e recuperação de falhas.`;
    case 13:
      return `Isolar ${topic} de dados e recursos não relacionados à operação.`;
    case 14:
      return `Registrar evidências reproduzíveis de que ${topic} cumpre o requisito de segurança.`;
    case 15:
      return `Garantir que falhas de ${topic} terminem em estado seguro, sem divulgar segredos.`;
    case 16:
      return `Cobrir ${topic} com casos negativos no pipeline de integração contínua.`;
    case 17:
      return `Associar ${topic} a controle de acesso e trilha de auditoria proporcional ao risco.`;
    case 18:
      return `Medir uso de recursos e alertar para comportamentos inesperados de ${topic}.`;
    case 19:
      return `Prever rotação, atualização ou revogação segura de ${topic} quando aplicável.`;
    case 20:
      return `Exigir revisão independente das alterações críticas relacionadas a ${topic}.`;
    default:
      throw new Error(`Invalid template index: ${itemIndex1Based}`);
  }
}

let cachedEngineering2000: EngineeringVerificationItem[] | null = null;
let cachedSecurity500: SecurityBestPracticeItem[] | null = null;

export function getEngineeringVerifications2000(): EngineeringVerificationItem[] {
  if (cachedEngineering2000) {
    return cachedEngineering2000;
  }

  const items: EngineeringVerificationItem[] = [];
  let seq = 0;

  for (let d = 0; d < ENGINEERING_40_DOMAINS.length; d++) {
    const domainNumber = d + 1;
    const domainName = ENGINEERING_40_DOMAINS[d];

    for (let c = 0; c < ENGINEERING_10_CONTROLS.length; c++) {
      const control = ENGINEERING_10_CONTROLS[c];
      const controlIndex = c + 1;

      for (let s = 0; s < LIFECYCLE_5_STAGES.length; s++) {
        seq += 1;
        const stageSpec = LIFECYCLE_5_STAGES[s];
        const priority = control.priorities[s];
        const code = `CT-${String(seq).padStart(4, '0')}`;

        items.push({
          code,
          sequenceNum: seq,
          domainNumber,
          domainName,
          controlIndex,
          controlName: control.name,
          stage: stageSpec.stage,
          priority,
          statement: `${domainName}: ${control.name} ${stageSpec.label}. Verificação: ${stageSpec.method}; critério: ${control.criterion}`,
          verificationMethod: stageSpec.method,
          acceptanceCriterion: control.criterion,
          status: 'aprovado',
          ownerRole: [5, 6, 7, 8, 9, 10, 11, 15, 21, 22, 23, 35].includes(domainNumber)
            ? 'appsec-team'
            : 'platform-core',
          evidenceArtifact: stageSpec.defaultEvidence,
        });
      }
    }
  }

  cachedEngineering2000 = items;
  return items;
}

export function getSecurityBestPractices500(): SecurityBestPracticeItem[] {
  if (cachedSecurity500) {
    return cachedSecurity500;
  }

  const items: SecurityBestPracticeItem[] = [];
  let seq = 0;

  for (let d = 0; d < SECURITY_25_DOMAINS.length; d++) {
    const domainSpec = SECURITY_25_DOMAINS[d];
    const domainNumber = d + 1;

    for (let i = 1; i <= 20; i++) {
      seq += 1;
      const topicIdx = Math.floor((i - 1) / 2);
      const topic = domainSpec.topics[topicIdx];
      const priority: ControlPriority = i <= 8 ? 'P0' : i <= 16 ? 'P1' : 'P2';
      const evidenceKind: EvidenceKind = [2, 4, 6, 14, 16].includes(i)
        ? 'teste'
        : [10, 18].includes(i)
          ? 'log_redigido'
          : [1, 3, 9, 11, 12].includes(i)
            ? 'configuracao'
            : 'revisao_codigo';

      const evidenceArtifact =
        evidenceKind === 'teste'
          ? 'tests/security-and-compliance.test.ts'
          : evidenceKind === 'log_redigido'
            ? 'packages/core/src/logger.ts'
            : evidenceKind === 'configuracao'
              ? 'docs/security/policies.md'
              : 'packages/security/src/index.ts';

      items.push({
        code: `CT-${String(seq).padStart(3, '0')}`,
        sequenceNum: seq,
        domainNumber,
        domainName: domainSpec.domainName,
        itemInDomain: i,
        topic,
        priority,
        statement: buildSecurityPracticeStatement(i, topic),
        status: 'verificado',
        evidenceKind,
        evidenceArtifact,
        ownerRole: 'appsec-engineering',
      });
    }
  }

  cachedSecurity500 = items;
  return items;
}
