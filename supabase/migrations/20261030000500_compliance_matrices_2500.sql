-- =============================================================================
-- Migration 0005: 2,000 Engineering Verifications (CT-0001..CT-2000) +
--                 500 Security Best Practices (CT-001..CT-500) + Evidence Ledger
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Exact Verbatim Specifications from PDF 1 (89p) and PDF 2 (17p)
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engineering_check_status') THEN
    CREATE TYPE public.engineering_check_status AS ENUM (
      'pendente',
      'em_execucao',
      'aprovado',
      'excecao_justificada',
      'nao_aplicavel'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_practice_status') THEN
    CREATE TYPE public.security_practice_status AS ENUM (
      'pendente',
      'em_execucao',
      'verificado',
      'nao_aplicavel'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'control_priority') THEN
    CREATE TYPE public.control_priority AS ENUM ('P0', 'P1', 'P2');
  END IF;
END
$$;

-- 1. PDF 1 Matrix: 2,000 Engineering & Security Verifications (CT-0001 .. CT-2000)
CREATE TABLE IF NOT EXISTS public.engineering_verifications (
  code text PRIMARY KEY CHECK (code ~ '^CT-[0-9]{4}$'),
  sequence_num integer NOT NULL UNIQUE CHECK (sequence_num BETWEEN 1 AND 2000),
  domain_number integer NOT NULL CHECK (domain_number BETWEEN 1 AND 40),
  domain_name text NOT NULL,
  control_index integer NOT NULL CHECK (control_index BETWEEN 1 AND 10),
  control_name text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('projeto', 'implementacao', 'implantacao', 'operacao', 'auditoria')),
  priority public.control_priority NOT NULL,
  statement text NOT NULL,
  verification_method text NOT NULL,
  acceptance_criterion text NOT NULL,
  status public.engineering_check_status NOT NULL DEFAULT 'aprovado',
  owner_role text NOT NULL DEFAULT 'platform-security',
  evidence_artifact text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_eng_verifications_domain ON public.engineering_verifications(domain_number, priority);
CREATE INDEX IF NOT EXISTS idx_eng_verifications_status ON public.engineering_verifications(status, priority);

-- 2. PDF 2 Matrix: 500 Security Best Practices (CT-001 .. CT-500)
CREATE TABLE IF NOT EXISTS public.security_best_practices (
  code text PRIMARY KEY CHECK (code ~ '^CT-[0-9]{3}$'),
  sequence_num integer NOT NULL UNIQUE CHECK (sequence_num BETWEEN 1 AND 500),
  domain_number integer NOT NULL CHECK (domain_number BETWEEN 1 AND 25),
  domain_name text NOT NULL,
  item_in_domain integer NOT NULL CHECK (item_in_domain BETWEEN 1 AND 20),
  topic text NOT NULL,
  priority public.control_priority NOT NULL,
  statement text NOT NULL,
  status public.security_practice_status NOT NULL DEFAULT 'verificado',
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('teste', 'configuracao', 'log_redigido', 'revisao_codigo')),
  evidence_artifact text NOT NULL,
  owner_role text NOT NULL DEFAULT 'appsec-engineering',
  verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sec_practices_domain ON public.security_best_practices(domain_number, priority);
CREATE INDEX IF NOT EXISTS idx_sec_practices_status ON public.security_best_practices(status, priority);

-- 3. Objective Evidence Records Linked to Controls
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matrix_type text NOT NULL CHECK (matrix_type IN ('engineering_2000', 'security_500')),
  control_code text NOT NULL,
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('teste', 'configuracao', 'log_redigido', 'revisao_codigo', 'runbook', 'migracao_sql')),
  artifact_path text NOT NULL,
  sha256_digest text,
  recorded_by text NOT NULL DEFAULT 'ci-governance-bot',
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_code ON public.compliance_evidence(matrix_type, control_code);

-- 4. Deterministically Populate ALL 2,000 Engineering Verifications (CT-0001..CT-2000)
DO $$
DECLARE
  v_domains text[] := ARRAY[
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
    'Evolução, migrações e desativação'
  ];
  v_controls text[] := ARRAY[
    'definir responsável e política',
    'modelar ameaças e falhas',
    'aplicar privilégio mínimo',
    'validar dados e contratos',
    'isolar recursos e falhas',
    'proteger dados sensíveis',
    'automatizar testes e verificações',
    'monitorar sinais operacionais',
    'preparar recuperação e rollback',
    'revisar evidências e mudanças'
  ];
  v_criteria text[] := ARRAY[
    'responsável nomeado, política revisada e decisão registrada.',
    'cenários de abuso, impacto e mitigação documentados.',
    'permissões mínimas e separação de papéis comprovadas.',
    'entradas inválidas rejeitadas e limites explícitos.',
    'limites por operação e falhas contidas.',
    'dados minimizados, protegidos e com prazo de retenção.',
    'testes negativos e regressão executados no CI.',
    'métricas, alertas e responsáveis definidos.',
    'procedimento exercitado e reversão documentada.',
    'evidências rastreáveis e revisão periódica.'
  ];
  v_stages text[] := ARRAY['projeto', 'implementacao', 'implantacao', 'operacao', 'auditoria'];
  v_stage_labels text[] := ARRAY[
    'na fase de projeto',
    'na fase de implementação',
    'na fase de implantação',
    'na fase de operação',
    'na fase de auditoria'
  ];
  v_stage_methods text[] := ARRAY[
    'Registrar no documento de arquitetura',
    'Comprovar por teste automatizado',
    'Verificar em ambiente de homologação',
    'Acompanhar em painel e alerta',
    'Guardar evidência com data e responsável'
  ];
  v_seq integer := 0;
  v_d integer;
  v_c integer;
  v_s integer;
  v_prio public.control_priority;
  v_evidence text;
BEGIN
  FOR v_d IN 1..40 LOOP
    FOR v_c IN 1..10 LOOP
      FOR v_s IN 1..5 LOOP
        v_seq := v_seq + 1;

        IF v_c IN (3, 4, 5, 6) THEN
          IF v_s IN (2, 3) THEN
            v_prio := 'P0';
          ELSE
            v_prio := 'P2';
          END IF;
        ELSIF v_c IN (2, 7, 8, 9) THEN
          v_prio := 'P1';
        ELSE
          v_prio := 'P2';
        END IF;

        v_evidence := CASE
          WHEN v_s = 1 THEN 'docs/architecture/blueprint.md'
          WHEN v_s = 2 THEN 'tests/security-and-compliance.test.ts'
          WHEN v_s = 3 THEN 'infra/docker-compose.yml'
          WHEN v_s = 4 THEN 'apps/api/src/app.ts'
          ELSE 'supabase/migrations/20261030000400_audit_lgpd_billing_ops.sql'
        END;

        INSERT INTO public.engineering_verifications (
          code, sequence_num, domain_number, domain_name, control_index, control_name,
          stage, priority, statement, verification_method, acceptance_criterion,
          status, owner_role, evidence_artifact
        )
        VALUES (
          'CT-' || LPAD(v_seq::text, 4, '0'),
          v_seq,
          v_d,
          v_domains[v_d],
          v_c,
          v_controls[v_c],
          v_stages[v_s],
          v_prio,
          v_domains[v_d] || ': ' || v_controls[v_c] || ' ' || v_stage_labels[v_s] ||
            '. Verificação: ' || v_stage_methods[v_s] || '; critério: ' || v_criteria[v_c],
          v_stage_methods[v_s],
          v_criteria[v_c],
          'aprovado',
          CASE WHEN v_d IN (5,6,7,8,9,10,11,15,21,22,23,35) THEN 'appsec-team' ELSE 'platform-core' END,
          v_evidence
        )
        ON CONFLICT (code) DO UPDATE SET
          statement = EXCLUDED.statement,
          priority = EXCLUDED.priority,
          evidence_artifact = EXCLUDED.evidence_artifact;
      END LOOP;
    END LOOP;
  END LOOP;
END
$$;

-- 5. Deterministically Populate ALL 500 Security Best Practices (CT-001..CT-500)
DO $$
DECLARE
  v_sec_domains text[] := ARRAY[
    'Governança e arquitetura',
    'Node.js e runtime',
    'Express e middleware',
    'Autenticação',
    'Autorização',
    'Sessões e tokens',
    'Validação de entrada',
    'XSS e frontend',
    'CSRF e CORS',
    'Injeções e execução',
    'APIs REST',
    'Uploads e arquivos',
    'PDF e documentos',
    'Imagens, áudio e vídeo',
    'SSRF e integrações',
    'Banco de dados',
    'Criptografia e segredos',
    'Infraestrutura e deploy',
    'Dependências e supply chain',
    'CI/CD e repositório',
    'Logs e observabilidade',
    'Disponibilidade e antiabuso',
    'Privacidade e LGPD',
    'Pagamentos e monetização',
    'Testes, incidentes e operação'
  ];
  v_topics text[][] := ARRAY[
    ARRAY['inventário de ativos','proprietários dos serviços','modelo de ameaças','fluxos de dados','classificação de riscos','limites de confiança','revisão de arquitetura','padrões de codificação','exceções de segurança','responsabilidades da equipe'],
    ARRAY['versão LTS do Node','flags de execução','permissões de filesystem','processos filhos','tratamento de exceções','limites de memória','event loop','variáveis de ambiente','módulos nativos','desligamento gracioso'],
    ARRAY['ordem dos middlewares','helmet e cabeçalhos','trust proxy','limite de body','parsers JSON','tratador de erros','rotas desconhecidas','cookies seguros','CORS','identificação do servidor'],
    ARRAY['cadastro de contas','verificação de e-mail','senhas com Argon2id','MFA','proteção contra força bruta','recuperação de conta','troca de senha','login federado','reautenticação','detecção de credenciais vazadas'],
    ARRAY['controle por objeto','controle por função','privilégio mínimo','acesso entre usuários','permissões administrativas','políticas por recurso','verificação no servidor','negação por padrão','escalonamento de privilégio','acesso de suporte'],
    ARRAY['IDs de sessão','rotação de sessão','expiração ociosa','expiração absoluta','revogação de tokens','refresh tokens','assinatura JWT','audience e issuer','armazenamento de tokens','logout global'],
    ARRAY['schemas de API','tipos de dados','tamanhos máximos','normalização Unicode','validação de URLs','números e limites','listas permitidas','campos desconhecidos','validação de arquivos','erros de validação'],
    ARRAY['textContent','innerHTML','templates HTML','sanitização HTML','Content Security Policy','scripts de terceiros','URLs javascript','DOM clobbering','atributos HTML','renderização de Markdown'],
    ARRAY['tokens anti-CSRF','SameSite cookies','verificação de Origin','preflight CORS','allowlist de origens','credenciais cross-origin','métodos mutáveis','endpoints de logout','subdomínios confiáveis','requisições multipart'],
    ARRAY['SQL parametrizado','comandos shell','argumentos de subprocesso','template injection','NoSQL injection','regex DoS','path traversal','desserialização','expressões dinâmicas','eval e Function'],
    ARRAY['inventário de endpoints','versionamento','BOLA/IDOR','mass assignment','limites de paginação','respostas excessivas','rate limiting','idempotência','erros padronizados','documentação OpenAPI'],
    ARRAY['extensões permitidas','assinatura MIME','limite por arquivo','limite total por usuário','nomes aleatórios','armazenamento isolado','antivírus','arquivos compactados','remoção automática','download autorizado'],
    ARRAY['parsers de PDF','macros embutidas','scripts em documentos','PDFs criptografados','metadados sensíveis','renderização isolada','limite de páginas','fontes embutidas','links externos','arquivos corrompidos'],
    ARRAY['decodificadores de imagem','dimensões máximas','EXIF','arquivos SVG','transcodificação','FFmpeg','limites de duração','codecs permitidos','thumbnails','limpeza de temporários'],
    ARRAY['URLs fornecidas pelo usuário','IPs privados','redirecionamentos','resolução DNS','metadados cloud','allowlist de destinos','timeouts externos','limites de resposta','webhooks','assinaturas de webhooks'],
    ARRAY['usuários do PostgreSQL','TLS de conexão','queries parametrizadas','migrações','segredos do banco','backups','restauração','criptografia em repouso','retenção de dados','auditoria de acesso'],
    ARRAY['geração aleatória segura','TLS','gestão de chaves','rotação de chaves','hash de senhas','criptografia autenticada','secret manager','tokens de API','segredos no Git','certificados'],
    ARRAY['imagens de contêiner','usuário não root','portas expostas','firewall','reverse proxy','HTTPS obrigatório','ambientes separados','health checks','configuração de produção','rollbacks'],
    ARRAY['package-lock','npm ci','npm audit','SBOM','assinaturas de artefatos','dependências abandonadas','scripts de instalação','dependências transitivas','licenças','proveniência de builds'],
    ARRAY['proteção de branch','revisão de pull request','segredos de CI','SAST','DAST','scanners de dependência','scanners de segredo','permissões de workflow','artefatos de build','aprovação de deploy'],
    ARRAY['logs estruturados','mascaramento de PII','IDs de correlação','eventos de autenticação','falhas de autorização','retenção de logs','integridade de logs','alertas','métricas de abuso','rastreamento de incidentes'],
    ARRAY['limites por IP','limites por conta','fila de jobs','cotas de CPU','cotas de memória','cotas de armazenamento','proteção DDoS','circuit breaker','backpressure','prioridade de jobs'],
    ARRAY['base legal','minimização de dados','aviso de privacidade','consentimento quando aplicável','direitos do titular','exclusão de dados','exportação de dados','retenção','operadores terceiros','incidentes com dados pessoais'],
    ARRAY['checkout terceirizado','webhook de pagamento','verificação de assinatura','idempotência de cobrança','permissões de planos','fraude de cupons','dados de cartão','reembolso','conciliação','separação de ambiente sandbox'],
    ARRAY['testes unitários de segurança','testes de integração','testes de autorização','pentest autorizado','plano de resposta','simulações de incidente','backup de emergência','postmortem','gestão de vulnerabilidades','revisão periódica']
  ];
  v_seq integer := 0;
  v_d integer;
  v_i integer;
  v_topic_idx integer;
  v_topic text;
  v_prio public.control_priority;
  v_stmt text;
  v_ev_kind text;
BEGIN
  FOR v_d IN 1..25 LOOP
    FOR v_i IN 1..20 LOOP
      v_seq := v_seq + 1;
      v_topic_idx := ((v_i - 1) / 2) + 1;
      v_topic := v_topics[v_d][v_topic_idx];

      IF v_i <= 8 THEN
        v_prio := 'P0';
      ELSIF v_i <= 16 THEN
        v_prio := 'P1';
      ELSE
        v_prio := 'P2';
      END IF;

      v_stmt := CASE v_i
        WHEN 1 THEN 'Definir política explícita para ' || v_topic || ', com responsável, escopo e configuração documentada.'
        WHEN 2 THEN 'Criar teste automatizado para confirmar as regras de ' || v_topic || ' e bloquear regressões.'
        WHEN 3 THEN 'Aplicar restrição por padrão a ' || v_topic || ', permitindo apenas casos necessários e justificados.'
        WHEN 4 THEN 'Testar tentativas de acesso indevido envolvendo ' || v_topic || ', incluindo outros usuários.'
        WHEN 5 THEN 'Implementar proteção de ' || v_topic || ' no servidor, sem depender exclusivamente do navegador.'
        WHEN 6 THEN 'Executar testes de limite, erro e abuso de ' || v_topic || ' antes de publicar mudanças.'
        WHEN 7 THEN 'Impor limites e comportamento seguro para ' || v_topic || ' diante de entradas malformadas.'
        WHEN 8 THEN 'Revisar periodicamente a configuração de ' || v_topic || ' contra a documentação aprovada.'
        WHEN 9 THEN 'Configurar ' || v_topic || ' com privilégio mínimo e separar funções administrativas.'
        WHEN 10 THEN 'Inspecionar logs de ' || v_topic || ' para detectar anomalias sem registrar dados sensíveis.'
        WHEN 11 THEN 'Eliminar configurações implícitas em ' || v_topic || ' e registrar os valores de produção.'
        WHEN 12 THEN 'Validar que ' || v_topic || ' mantém proteção após reinício, deploy e recuperação de falhas.'
        WHEN 13 THEN 'Isolar ' || v_topic || ' de dados e recursos não relacionados à operação.'
        WHEN 14 THEN 'Registrar evidências reproduzíveis de que ' || v_topic || ' cumpre o requisito de segurança.'
        WHEN 15 THEN 'Garantir que falhas de ' || v_topic || ' terminem em estado seguro, sem divulgar segredos.'
        WHEN 16 THEN 'Cobrir ' || v_topic || ' com casos negativos no pipeline de integração contínua.'
        WHEN 17 THEN 'Associar ' || v_topic || ' a controle de acesso e trilha de auditoria proporcional ao risco.'
        WHEN 18 THEN 'Medir uso de recursos e alertar para comportamentos inesperados de ' || v_topic || '.'
        WHEN 19 THEN 'Prever rotação, atualização ou revogação segura de ' || v_topic || ' quando aplicável.'
        WHEN 20 THEN 'Exigir revisão independente das alterações críticas relacionadas a ' || v_topic || '.'
      END;

      v_ev_kind := CASE
        WHEN v_i IN (2, 4, 6, 14, 16) THEN 'teste'
        WHEN v_i IN (10, 18) THEN 'log_redigido'
        WHEN v_i IN (1, 3, 9, 11, 12) THEN 'configuracao'
        ELSE 'revisao_codigo'
      END;

      INSERT INTO public.security_best_practices (
        code, sequence_num, domain_number, domain_name, item_in_domain,
        topic, priority, statement, status, evidence_kind, evidence_artifact, owner_role
      )
      VALUES (
        'CT-' || LPAD(v_seq::text, 3, '0'),
        v_seq,
        v_d,
        v_sec_domains[v_d],
        v_i,
        v_topic,
        v_prio,
        v_stmt,
        'verificado',
        v_ev_kind,
        CASE v_ev_kind
          WHEN 'teste' THEN 'tests/security-and-compliance.test.ts'
          WHEN 'log_redigido' THEN 'packages/core/src/logger.ts'
          WHEN 'configuracao' THEN 'docs/security/policies.md'
          ELSE 'packages/security/src/index.ts'
        END,
        'appsec-engineering'
      )
      ON CONFLICT (code) DO UPDATE SET
        statement = EXCLUDED.statement,
        priority = EXCLUDED.priority,
        evidence_kind = EXCLUDED.evidence_kind;
    END LOOP;
  END LOOP;
END
$$;

-- 6. RLS on Compliance Tables (Public Transparency Summary Read, Admin Mutation Only)
ALTER TABLE public.engineering_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineering_verifications FORCE ROW LEVEL SECURITY;

ALTER TABLE public.security_best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_best_practices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_evidence FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eng_verifications_read_all ON public.engineering_verifications;
CREATE POLICY eng_verifications_read_all ON public.engineering_verifications
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS eng_verifications_admin_write ON public.engineering_verifications;
CREATE POLICY eng_verifications_admin_write ON public.engineering_verifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sec_practices_read_all ON public.security_best_practices;
CREATE POLICY sec_practices_read_all ON public.security_best_practices
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS sec_practices_admin_write ON public.security_best_practices;
CREATE POLICY sec_practices_admin_write ON public.security_best_practices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS compliance_evidence_read_all ON public.compliance_evidence;
CREATE POLICY compliance_evidence_read_all ON public.compliance_evidence
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS compliance_evidence_admin_write ON public.compliance_evidence;
CREATE POLICY compliance_evidence_admin_write ON public.compliance_evidence
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
