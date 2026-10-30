# CLOUSE TOOLS — Blueprint de Arquitetura Modular & Governança

**Versão:** 1.0 (Outubro/2026)  
**Projeto Supabase Alvo:** `luytwttrgosmsfyjlonc` (`https://luytwttrgosmsfyjlonc.supabase.co`)  
**Proprietário de Arquitetura:** `platform-core` & `appsec-team`

---

## 1. Visão Geral e 6 Pilares Estruturais

O **CLOUSE TOOLS** opera em arquitetura híbrida **Privacy-First + Modular Monolith**, combinando **67 ferramentas 100% client-side** com **6 ferramentas server/worker em sandbox isolado** para arquivos e integrações não confiáveis:

| Pilar | Escopo | Implementação no Repositório | Proprietário |
| :--- | :--- | :--- | :--- |
| **1. Portal & API** | Frontend Next.js 16, Express Gateway, OpenAPI 3.1, Rate Limit & CORS | `app/`, `apps/api/`, `docs/api/openapi.json` | `platform-core` |
| **2. Núcleo Modular** | Registro versionado de 73 ferramentas, SDK, 10 gates de publicação, feature flags | `packages/tool-sdk/`, `packages/tools/*` | `platform-core` |
| **3. Processamento** | Fila durável `FOR UPDATE SKIP LOCKED`, workers isolados, `execFile` sem shell, quotas | `apps/worker/`, `supabase/migrations/*0003*` | `media-platform` |
| **4. Dados** | Supabase PostgreSQL 15+ com RLS forçada, Storage privado, cache TTL e expurgo | `packages/data/`, `supabase/migrations/*` | `data-platform` |
| **5. Segurança** | IAM/RBAC, BOLA/IDOR, validação Zod estrita, anti-SSRF DNS, mágica MIME, trilha hash-chain | `packages/security/`, `docs/security/*` | `appsec-team` |
| **6. Operação** | CI/CD hardened, logs JSON sem PII, SLOs/circuit-breaker, resposta a incidentes e DR | `.github/workflows/ci.yml`, `infra/`, `docs/runbooks/*` | `sre-operations` |

---

## 2. Fluxo de Dados e Limites de Confiança (Trust Boundaries)

```
[Navegador / Cliente Não Confiável]
        │  HTTPS / TLS 1.3 + Origin/CSRF + Bearer JWT
        ▼
[Limite de Confiança 1: API Gateway (Express / Next.js /api/v1)]
  1. Correlation ID + Telemetria SLO
  2. Helmet CSP/HSTS/NoSniff + Allowlist estrita de CORS
  3. Rate Limit por IP e Conta + Circuit Breaker
  4. Body Parser limitado (64 KiB JSON padrão) + Zod z.strictObject()
  5. Verificação de JWT (alg, assinatura, iss, aud, expiração ociosa/absoluta) + RBAC/BOLA
        │
        ├──► Execução Síncrona Leve (`server_sync`) ──► `packages/tools/*`
        │
        └──► Upload / Job Assíncrono (`worker_async`)
                │
                ▼
[Limite de Confiança 2: Camada de Dados Supabase (`luytwttrgosmsfyjlonc`)]
  - Buckets Privados (`uploads-quarantine`, `processed-artifacts`) com chaves UUIDv4
  - PostgreSQL com `FORCE ROW LEVEL SECURITY` e RPCs `SECURITY DEFINER` (`search_path = public`)
  - Ledger `audit_logs` imutável encadeado por SHA-256 (`prev_hash -> entry_hash`)
                │
                ▼
[Limite de Confiança 3: Sandbox Worker (`apps/worker`)]
  - Diretório temporário efêmero por job (`os.tmpdir()/clouse-sandbox-*`) removido em `finally`
  - `execFile(..., { shell: false })` com ambiente limpo (sem chaves de banco ou API)
  - Retentativas exponenciais limitadas, Dead-Letter Queue (DLQ) e Reaper automático de TTL (15 min)
```

---

## 3. Os 10 Gates Obrigatórios de Publicação de Ferramentas

Nenhuma ferramenta pode ter `enabled = true` no catálogo (`packages/tool-sdk` ou constraint SQL `chk_enabled_requires_10_gates` em `public.tool_manifests`) sem comprovar todos os 10 gates:

1. **`manifest_valid`**: Manifesto semântico versionado validado via `ToolManifestSchema`.
2. **`risk_review`**: Classificação de risco (`low`, `medium`, `high`, `critical`) revisada.
3. **`schemas_and_tests`**: Contratos `z.strictObject` de entrada/saída e testes negativos automatizados.
4. **`resource_evaluation`**: Orçamento explícito de bytes, páginas, duração, CPU, memória e custo.
5. **`isolation_verified`**: Execução isolada (client-only ou sandbox worker sem shell/rede arbitrária).
6. **`auth_and_limits`**: Papel mínimo (`minRole`) e `rateLimitPerMinute` configurados.
7. **`telemetry_ready`**: Emissão de latência, erros padronizados RFC 7807 e `correlationId`.
8. **`gradual_rollout`**: Suporte a `rolloutPercentage` e `feature_flags`.
9. **`monitoring_active`**: Cobertura por `SloTracker` e `CircuitBreaker`.
10. **`rollback_plan`**: Versão anterior (`rollbackVersion`) registrada para reversão imediata.
