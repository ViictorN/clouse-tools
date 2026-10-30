# Políticas Explícitas de Segurança (25 Domínios — `CT-001` a `CT-500`) & Governança LGPD

**Responsável Executivo:** `appsec-engineering`  
**Ciclo de Revisão:** Trimestral e a cada mudança crítica com revisão independente obrigatória.

---

## 1. Políticas por Domínio Operacional (Domínios 01–25)

1. **Governança e Arquitetura:** Inventário completo mantido em `packages/tool-sdk` (73 ativos); exceções exigem aprovador distinto do solicitante em `public.security_exceptions` com prazo de expiração obrigatório.
2. **Node.js e Runtime:** Execução em Node LTS com `--max-old-space-size=512 --disallow-code-generation-from-strings`, zero módulos nativos não auditados e encerramento gracioso (`GracefulShutdownCoordinator`).
3. **Express e Middleware:** Ordem imutável de 11 camadas em `apps/api/src/app.ts`; `x-powered-by` desabilitado; `trust proxy` explícito; limite padrão de JSON em `64 KiB`.
4. **Autenticação:** Senhas com mínimo de 12 caracteres (maiúsculas, minúsculas, dígitos e símbolos), bloqueio de credenciais vazadas comuns, derivação `scrypt`/Argon2id com salt aleatório de 16 bytes + `PASSWORD_PEPPER` e comparação `timingSafeEqual`; MFA TOTP habilitado no Supabase Auth.
5. **Autorização:** Negação por padrão (`FORCE ROW LEVEL SECURITY`); verificação de propriedade por objeto (`assertObjectOwnership` anti-BOLA); papel `support` restrito a leitura diagnóstica sem permissão de mutação administrativa (`assertAdminMutationAccess`).
6. **Sessões e Tokens:** Expiração ociosa (`1800s`) e absoluta (`43200s`), rotação de refresh token no Supabase (`refresh_token_reuse_interval = 10`), verificação estrita de algoritmo `HS256`, `iss` e `aud`, e armazenamento de API tokens apenas como SHA-256 (`public.api_tokens`).
7. **Validação de Entrada:** Normalização Unicode `NFC`, remoção de caracteres de controle BiDi/nulos, bloqueio de `__proto__` e schemas `z.strictObject()` rejeitando campos desconhecidos.
8. **XSS e Frontend:** Proibido `innerHTML` com dados de usuário; CSP restritiva no gateway; sanitização server-side de HTML/Markdown e SVG (`sanitizeHtmlFragment`, `sanitizeSvgMarkup`).
9. **CSRF e CORS:** Cookies `HttpOnly; SameSite=Strict; Secure`; validação de `Origin`/`Referer` em métodos mutáveis (`verifyOriginGuard`) e allowlist explícita sem curinga `*` em produção.
10. **Injeções e Execução:** Queries 100% parametrizadas via PostgREST/RPC; zero `eval`/`new Function`; subprocessos exclusivamente via `execFile` (`shell: false`) com bloqueio de argumentos iniciados por `-`.
11. **APIs REST:** Prefixo versionado `/api/v1`, paginação limitada a `pageSize <= 100`, `Idempotency-Key` em jobs, erros padronizados `application/problem+json` (RFC 7807) e contrato OpenAPI 3.1 público.
12. **Uploads e Arquivos:** Validação cruzada extensão + MIME declarado + assinatura mágica binária; bloqueio de PE/ELF e EICAR; chaves aleatórias UUIDv4 em bucket privado; expiração automática em 15 minutos (`ARTIFACT_TTL_SECONDS=900`).
13. **PDF e Documentos:** Bloqueio de `/Encrypt`, `/JavaScript`, `/JS`, `/Launch`, `/OpenAction`, `/AA` e `/EmbeddedFiles`; limite de 200 páginas; remoção de metadados sensíveis (`/Author`, `/Creator`, `/Producer`, `/Title`).
14. **Imagens, Áudio e Vídeo:** Limite máximo de `8192px` / `36 MP`; remoção binária de chunks EXIF/XMP/IPTC/tEXt; duração máxima de mídia (`300s`), codecs permitidos (`h264`, `aac`, `mp3`, `pcm_s16le`, `vp9`, `opus`) e limpeza garantida de temporários.
15. **SSRF e Integrações:** Apenas `https:` nas portas padrão; bloqueio de credenciais em URL, `localhost`, RFC1918, CGNAT, loopback IPv6, IPv4-mapped IPv6 e metadados cloud (`169.254.169.254`, `fd00:ec2::254`, `metadata.google.internal`); `redirect: 'error'` e limite de `1 MiB` de resposta.
16. **Banco de Dados:** Conexão com `sslmode=require`; migrações versionadas em `supabase/migrations/`; funções `SECURITY DEFINER` com `SET search_path = public` e `REVOKE ALL FROM PUBLIC`.
17. **Criptografia e Segredos:** Entropia criptográfica via `node:crypto`; segredos validados no boot (`loadAppConfig`) sem exposição em mensagens de erro; `.env` bloqueado no `.gitignore` e escaneado no CI.
18. **Infraestrutura e Deploy:** Containers Alpine com `USER node`, filesystem raiz `read_only: true`, `/tmp` com `noexec,nosuid,nodev`, `cap_drop: ALL` e healthchecks ativos.
19. **Dependências e Supply Chain:** `package-lock.json` obrigatório, instalação determinística com `npm ci --ignore-scripts` e auditoria `npm audit` no pipeline.
20. **CI/CD e Repositório:** Workflow GitHub Actions com `permissions: contents: read`, checagem de segredos, typecheck estrito, suíte negativa de segurança e build de produção.
21. **Logs e Observabilidade:** Logs JSON estruturados com `correlationId`, mascaramento automático de e-mail/CPF/tokens/senhas (`redactPiiAndSecrets`) e trilha `audit_logs` imutável encadeada por SHA-256.
22. **Disponibilidade e Antiabuso:** Rate limiting por IP e ferramenta, quotas diárias de jobs/CPU/storage, fila priorizada por plano e `CircuitBreaker` de proteção.
23. **Privacidade e LGPD:** Minimização por design (67 ferramentas não enviam dados ao servidor; IPs transformados em HMAC); registro de consentimento (`public.lgpd_consents`) e atendimento imediato de exportação e eliminação (`/api/v1/lgpd/{export,delete}`).
24. **Pagamentos e Monetização:** Checkout 100% terceirizado (zero dados PAN/CVV trafegados ou armazenados), separação estrita `sandbox` vs `production` e verificação HMAC-SHA256 idempotente (`public.billing_webhook_events`).
25. **Testes, Incidentes e Operação:** Testes unitários, de autorização e negativos executados a cada push; plano formal de resposta a incidentes, backup/restauração e rollback documentados em `docs/runbooks/`.

---

## 2. Tabela de Retenção e Descarte Seguro (LGPD Art. 15 e 16)

| Ativo de Dado | Base Legal (LGPD) | Prazo de Retenção | Método de Descarte |
| :--- | :--- | :--- | :--- |
| Dados de ferramentas client-side (67 tools) | N/A (Processamento local no dispositivo) | **0 segundos** no servidor | Memória volátil do navegador |
| Arquivos em `uploads-quarantine` / `processed-artifacts` | Execução de contrato / procedimento preliminar | **15 minutos** (`900s`) | Remoção no Storage + `deleted_at` via `reap_expired_artifacts` |
| Metadados operacionais de `processing_jobs` | Execução de contrato / Legítimo interesse de segurança | **1 hora** (resultados) / expurgo imediato via `/lgpd/delete` | Limpeza de JSONB e desvinculação de titular |
| Logs de auditoria de segurança (`audit_logs`) | Cumprimento de obrigação legal / segurança (Art. 7 II / Marco Civil) | **365 dias** (sem PII em claro; apenas hashes HMAC) | Particionamento/arquivamento expirado após prazo legal |
