# ADRs — Registros de Decisão Arquitetural (ADR-0001 a ADR-0004)

## ADR-0001: Monólito Modular com Dual-Runtime (Next.js `/api/v1` + Express Standalone + Worker)
- **Status:** Aprovado (Out/2026)
- **Contexto:** O portal existente roda em Next.js 16 com 67 ferramentas client-side na Vercel, enquanto o blueprint exige gateway HTTP Express estruturado e workers isolados para cargas assíncronas.
- **Decisão:** Extrair toda a lógica de domínio para `packages/{core,security,tool-sdk,tools,data}` e os controladores HTTP para `apps/api/src/gateway-handlers.ts`, expondo-os tanto via servidor Express dedicado (`apps/api/src/app.ts`) quanto via bridge nativa `app/api/v1/[[...route]]/route.ts`, além do daemon isolado `apps/worker`.
- **Consequências:** Zero duplicação de regras de negócio, deploy contínuo compatível com Vercel e containers Docker endurecidos (`infra/`).

## ADR-0002: Supabase PostgreSQL (`luytwttrgosmsfyjlonc`) como Infraestrutura Durável + RLS Forçada
- **Status:** Aprovado (Out/2026)
- **Decisão:** Utilizar PostgreSQL do Supabase com `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY` em 100% das tabelas públicas, buckets privados no Supabase Storage com chaves UUIDv4 aleatórias, fila durável via `FOR UPDATE SKIP LOCKED` (`claim_next_job`) e adaptador plugável Upstash Redis com fallback transacional em banco/memória.

## ADR-0003: Inspeção Binária Zero-Trust e Subprocessos Sem Shell
- **Status:** Aprovado (Out/2026)
- **Decisão:** Validar todo upload por assinatura mágica binária (`%PDF-`, PNG, JPEG, GIF, WebP, ZIP, MP4, MP3, WAV, SVG), bloquear executáveis PE/ELF e EICAR, remover EXIF/metadados em binário, rejeitar PDFs criptografados ou com `/JavaScript`/`/Launch`, bloquear Zip-Slip/Zip-Bombs e invocar binários externos exclusivamente via `execFile` com `shell: false`, `-protocol_whitelist file` e ambiente limpo de segredos.

## ADR-0004: Trilha de Auditoria Encadeada por SHA-256 e Matrizes de 2.500 Controles no Código e Banco
- **Status:** Aprovado (Out/2026)
- **Decisão:** Implementar `public.audit_logs` append-only protegido por triggers PostgreSQL que calculam `entry_hash = sha256(prev_hash || ...)` e bloqueiam `UPDATE`/`DELETE`, além de materializar determinísticamente as 2.000 verificações (`CT-0001..CT-2000`) e 500 boas práticas (`CT-001..CT-500`) em SQL e TypeScript testados em CI.
