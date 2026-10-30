# Runbooks Operacionais: Resposta a Incidentes, Backup/DR e Rollback

## 1. Resposta a Incidentes de Segurança e Dados Pessoais (`INC-YYYY-NNNN`)
1. **Detecção e Triagem (0–15 min):** Identificar alerta de SLO, `CircuitBreaker` aberto, pico de `401/403` ou falha na cadeia `verifyAuditChainIntegrity()`. Registrar incidente em `public.security_incidents` com `commander` designado.
2. **Contenção Imediata (15–30 min):**
   - Ferramenta vulnerável: desativar via `feature_flags` ou `UPDATE public.tool_manifests SET enabled = false WHERE slug = '<slug>';`.
   - Credencial comprometida: revogar sessão (`revoked_at = now()`, `global_logout_after = now()`) ou `api_tokens`, e rotacionar chaves no painel Supabase / Secret Manager.
3. **Avaliação LGPD / ANPD:** Caso `involves_personal_data = true` com risco ou dano relevante aos titulares, acionar o Encarregado (DPO) para comunicação à ANPD e aos titulares conforme Art. 48 da LGPD.
4. **Erradicação, Recuperação e Postmortem:** Validar correção com teste negativo de regressão em `tests/`, restaurar operação gradual (`rollout_percentage`) e anexar `postmortem_doc_path` sem culpabilização em até 5 dias úteis.

---

## 2. Backup, Restauração e Deploy no Supabase (`luytwttrgosmsfyjlonc`)

### Aplicação das Migrações
- **Via CLI Oficial:**
  ```bash
  npx supabase link --project-ref luytwttrgosmsfyjlonc
  npm run db:push
  ```
- **Via Bundle Único Idempotente (SQL Editor):**
  Executar o arquivo gerado `supabase/deploy_bundle.sql` diretamente no SQL Editor do projeto `luytwttrgosmsfyjlonc`. Todas as declarações usam `IF NOT EXISTS` / `CREATE OR REPLACE` / `ON CONFLICT` para segurança transacional.

### Procedimento de Backup de Emergência e Teste de Restauração
1. Antes de qualquer migração destrutiva, gerar dump lógico criptografado via `pg_dump --dbname="$DATABASE_URL" --format=custom --file=backup_$(date +%Y%m%d_%H%M).dump`.
2. Validar integridade em banco efêmero de homologação (`pg_restore --list` + execução de `SELECT count(*) FROM public.engineering_verifications;` = `2000` e `public.security_best_practices` = `500`).

---

## 3. Procedimento de Rollback Seguro
- **Aplicação Web / API:** Reverter imediatamente para o deployment imutável anterior na Vercel ou tag de imagem Docker anterior (`infra/docker-compose.yml`), validando `/api/v1/health` e `/api/v1/ready`.
- **Ferramenta Individual:** Restaurar `rollback_version` registrada no manifesto ou desligar `enabled = false` sem indisponibilizar as demais 72 ferramentas.
