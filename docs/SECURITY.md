# Diretrizes de Segurança — Noesis

> **Versão:** 1.0  
> **Última atualização:** 2026-08-20  
> **Responsável:** Security Specialist  
> **Status:** Aguardando aprovação

---

## Índice

1. [Princípios Fundamentais](#1-princípios-fundamentais)
2. [Autenticação](#2-autenticação)
3. [Autorização e Isolamento de Dados](#3-autorização-e-isolamento-de-dados)
4. [Proteção de Dados Sensíveis](#4-proteção-de-dados-sensíveis)
5. [Segurança de APIs](#5-segurança-de-apis)
6. [Segurança de Storage](#6-segurança-de-storage)
7. [Privacidade de Voz e Áudio](#7-privacidade-de-voz-e-áudio)
8. [Controle de Acesso a Recursos](#8-controle-de-acesso-a-recursos)
9. [Auditoria e Monitoramento](#9-auditoria-e-monitoramento)
10. [Proteção contra Vulnerabilidades](#10-proteção-contra-vulnerabilidades)
11. [LGPD e Privacidade](#11-lgpd-e-privacidade)
12. [Checklist de Segurança](#12-checklist-de-segurança)

---

## 1. Princípios Fundamentais

### Princípio do Privilégio Mínimo

Cada componente do sistema recebe **somente** as permissões necessárias para sua função:

| Componente | Permissões |
|---|---|
| **Frontend (browser)** | Apenas dados do usuário autenticado (via RLS) |
| **Supabase Anon Key** | Acesso público com RLS (nunca acesso total) |
| **Edge Functions** | Acesso ao banco via JWT do usuário (mantém RLS) |
| **AI Providers** | Apenas texto/mensagens (nunca dados de autenticação) |
| **Storage** | Upload/download apenas por caminhos autorizados |

### Defesa em Profundidade

Múltiplas camadas de proteção — se uma falha, as outras protegem:

```
Camada 1: Autenticação (Supabase Auth + JWT)
    ↓
Camada 2: Autorização (RLS em todas as tabelas)
    ↓
Camada 3: Validação de Input (Zod no frontend e Edge Functions)
    ↓
Camada 4: Sanitização (escaping de dados perigosos)
    ↓
Camada 5: Auditoria (logs de todas as operações)
```

---

## 2. Autenticação

### Supabase Auth

| Configuração | Valor |
|---|---|
| **Providers habilitados** | Email/Senha, Google OAuth |
| **JWT Expiry** | 1 hora (3600s) |
| **Refresh Token** | Automático pelo Supabase JS |
| **MFA (Multi-Factor Auth)** | Futuro (não no MVP) |
| **Rate Limiting** | Configurado no Supabase Dashboard |

### Regras de Sessão

- **Sessão** armazenada no cliente via Supabase JS (localStorage)
- **Refresh automático** antes da expiração
- **Logout** limpa tokens do cliente
- **Timeout** de inatividade: configurável (padrão 1 hora)

### OAuth Google

- **Redirect URL** configurada no Supabase Dashboard
- **Callback** processado pelo Supabase Auth
- **Dados obtidos:** email, nome, avatar (apenas)
- **Profile** criado automaticamente via trigger no banco

### Regras

| Regra | Descrição |
|---|---|
| NUNCA armazenar senhas no frontend | Senhas ficam apenas no Supabase Auth |
| NUNCA expor API keys no frontend | Chaves sensíveis só em Edge Functions |
| SEMPRE usar HTTPS | Supabase force HTTPS por padrão |
| SEMPRE validar JWT antes de processar | Edge Functions verificam Authorization header |

---

## 3. Autorização e Isolamento de Dados

### Row-Level Security (RLS)

**Todas** as tabelas de dados do usuário têm RLS habilitado:

```sql
-- Padrão obrigatório para todas as tabelas
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_only_access_own_data"
ON [tabela]
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Regras de Isolamento

| Regra | Descrição |
|---|---|
| **user_id em TODAS as tabelas** | Coluna obrigatória (NOT NULL) |
| **RLS em TODAS as tabelas** | Sem exceção |
| **Sem cross-tenant** | Usuário A NUNCA vê dados do Usuário B |
| **Edge Functions** | Herdam JWT do client → RLS mantido |
| **Service role** | NÃO utilizado no fluxo normal (só para migrações/admin) |

### Verificação de Isolamento

```sql
-- Teste: Usuário A tentando acessar dados do Usuário B
-- Resultado esperado: vazio (RLS filtra)
SET request.jwt.claims = '{"sub": "uuid-usuario-a"}';
SELECT * FROM documents; -- Retorna apenas documentos do usuário A
```

---

## 4. Proteção de Dados Sensíveis

### Classificação de Dados

| Categoria | Dados | Proteção |
|---|---|---|
| **Críticos** | Senhas, tokens de auth | Supabase Auth (nunca acessamos) |
| **Sensíveis** | API keys de IA | Edge Functions (nunca no frontend) |
| **Pessoais** | Nome, email, avatar | RLS +profile próprio |
| **Conteúdo** | PDFs, anotações, fichamentos | RLS + user_id |
| **Operacionais** | Logs, auditoria | RLS + somente leitura pelo dono |

### Regras de Armazenamento

| Dado | Onde é armazenado | Acesso |
|---|---|---|
| Senhas | Supabase Auth (Hash bcrypt) | Nunca acessamos diretamente |
| JWT | Cliente (localStorage) | Automático pelo Supabase JS |
| API Keys (OpenAI) | Environment Variables (Edge Functions) | Apenas Edge Functions |
| PDFs | Supabase Storage (bucket `documents`) | RLS por user_id |
| Dados do usuário | PostgreSQL (tabela `profiles`) | RLS por user_id |
| Traduções | IndexedDB (browser) | Apenas o dispositivo local |
| Áudio (TTS/STT) | NÃO persistido | Streaming only |

### NUNCA fazer

- ❌ Armazenar API keys no código-fonte
- ❌ Armazenar API keys em localStorage
- ❌ Expor dados de outros usuários
- ❌ Logar dados sensíveis (senhas, tokens)
- ❌ Retornar dados de outros usuários via API
- ❌ Desabilitar RLS em produção

---

## 5. Segurança de APIs

### Edge Functions

| Regra | Descrição |
|---|---|
| **Validação de input** | Zod schema em toda function |
| **Autenticação** | Verificar `Authorization` header (JWT) |
| **Rate limiting** | Configurar no Supabase Dashboard |
| **Timeout** | Máximo 30s por function |
| **Logging** | Erros logados em JSON estruturado |
| **Headers CORS** | Configurados para domínio do app |

### Supabase Client

| Regra | Descrição |
|---|---|
| **Anon key** | Segura para uso no frontend |
| **Service role** | NUNCA no frontend |
| **RLS** | Filtra automaticamente |
| **Prefer header** | Configurar para retornar representação atualizada |

### AI Providers (via Edge Functions)

| Regra | Descrição |
|---|---|
| **Proxy** | Chamadas passam pelo ai-proxy |
| **API keys** | No Edge Function, nunca no browser |
| **Rate limiting** | Por usuário e global |
| **Timeout** | 60s por request |
| **Retry** | Máximo 3 tentativas com backoff exponencial |
| **Fallback** | Se provedor primário falha, tenta alternativo |

---

## 6. Segurança de Storage

### Buckets

| Bucket | Acesso Leitura | Acesso Escrita | Tamanho Máx |
|---|---|---|---|
| `documents` | Apenas o dono (RLS) | Apenas o dono (RLS) | 50MB |
| `avatars` | Público (bucket policy) | Apenas o dono (RLS) | 5MB |

### Regras

| Regra | Descrição |
|---|---|
| **Caminho por usuário** | `{user_id}/{document_id}/arquivo.pdf` |
| **Sanitização** | Nomes de arquivo limpos (sem `../`, sem especiais) |
| **Validação de tipo** | Apenas `.pdf` no bucket `documents` |
| **Validação de tamanho** | Antes do upload (client-side) |
| **RLS no bucket** | Policies configuradas por caminho |
| **Download** | Apenas pelo dono do arquivo |

---

## 7. Privacidade de Voz e Áudio

### Regras de Áudio

| Regra | Descrição |
|---|---|
| **NÃO persistir áudio** | Gravações STT descartadas após transcrição |
| **NÃO salvar TTS** | Áudio gerado via streaming, não armazenado |
| **NÃO logar conteúdo** | Edge Functions não logam texto de áudio |
| **Streaming only** | Áudio transmitido em tempo real, sem cache |
| **Consentimento** | Usuário habilita microfone voluntariamente |
| **Permissão** | Browser solicita permissão antes de acessar microfone |

### Web Speech API

- **STT:** Processado pelo browser (não sai do dispositivo)
- **TTS (browser):** Processado localmente
- **TTS (OpenAI):** Áudio transmitido via streaming, não salvo

---

## 8. Controle de Acesso a Recursos

### Perfis de Usuário

| Perfil | Permissões | Implementação |
|---|---|---|
| **Usuário comum** | Apenas seus próprios dados | RLS padrão |
| **Admin** | Acesso a system_settings (futuro) | Policy separada (não no MVP) |

### Regras de Acesso

| Recurso | Quem pode acessar |
|---|---|
| **Próprios dados** | O usuário autenticado |
| **Outros dados** | Ninguém (RLS impede) |
| **system_settings públicos** | Qualquer um (is_public = true) |
| **system_settings privados** | Apenas admin (futuro) |
| **audit_logs próprios** | O próprio usuário (somente leitura) |
| **Edge Functions** | Qualquer um (mas com autenticação) |

---

## 9. Auditoria e Monitoramento

### O que é auditado

| Evento | Tabela | Dados registrados |
|---|---|---|
| **CRUD** | `audit_logs` | user_id, action, entity, old/new values, IP |
| **Login/Logout** | `audit_logs` | action, provider, IP, user_agent |
| **Upload** | `audit_logs` | file_size, document_id, status |
| **Download** | `audit_logs` | document_id, format |
| **Chamada à IA** | `ai_interactions` | provider, model, tokens, cost, latency |
| **Requisição de voz** | `ai_interactions` | interaction_type: tts/stt, provider |
| **Interrupção de leitura** | `audit_logs` | document_id, page, duration |
| **Erro no Edge Function** | Edge logs | error, stack, request |

### Retenção de Logs

| Tipo | Retenção | Ação após expirar |
|---|---|---|
| `audit_logs` | 90 dias | Partition drop (mensal) |
| `ai_interactions` | 90 dias | Delete em batch |
| Edge Function logs | 7 dias (Supabase default) | Auto-cleanup |

---

## 10. Proteção contra Vulnerabilidades

### OWASP Top 10 — Cobertura

| Vulnerabilidade | Mitigação |
|---|---|
| **Injection** | Zod validation + parametrized queries (Supabase) |
| **Broken Auth** | Supabase Auth + JWT + RLS |
| **Sensitive Data Exposure** | HTTPS + API keys em Edge Functions |
| **XML External Entities** | N/A (não usamos XML) |
| **Broken Access Control** | RLS em todas as tabelas |
| **Security Misconfiguration** | Defaults seguros + checklist |
| **XSS** | React escape automático + CSP headers |
| **Insecure Deserialization** | Zod validation em todo input |
| **Using Components with Known Vulnerabilities** | `npm audit` no CI |
| **Insufficient Logging** | audit_logs + ai_interactions |

### Dependências

- **`npm audit`** rodado antes de cada deploy
- **Dependabot** habilitado no GitHub (futuro)
- **Atualizações** regulares de dependências

---

## 11. LGPD e Privacidade

### Dados Pessoais Coletados

| Dado | Finalidade | Base Legal |
|---|---|---|
| Nome completo | Identificação do usuário | Execução de contrato |
| Email | Autenticação | Execução de contrato |
| Avatar (foto) | Personalização | Consentimento |
| Documentos (PDFs) | Funcionalidade principal | Execução de contrato |
| Anotações/fichamentos | Funcionalidade principal | Execução de contrato |
| Dados de voz | NÃO persistidos | — |

### Direitos do Usuário

| Direito | Implementação |
|---|---|
| **Acesso** | Usuário pode visualizar todos seus dados |
| **Retificação** | Usuário pode editar perfil e preferências |
| **Exclusão** | Soft delete (deleted_at) + exclusão futura |
| **Portabilidade** | Exportação de dados (futuro) |
| **Revogação** | Logout + exclusão de conta (futuro) |

### Dados NÃO coletados

- ❌ Dados de navegação (analytics) — não no MVP
- ❌ Cookies de rastreamento
- ❌ Dados de terceiros
- ❌ Áudio persistido

---

## 12. Checklist de Segurança

### Antes de cada deploy

- [ ] Todas as tabelas têm RLS habilitado
- [ ] Nenhuma API key está exposta no frontend
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] Variáveis de ambiente sensíveis não versionadas
- [ ] Edge Functions com autenticação obrigatória
- [ ] Storage buckets com policies corretas
- [ ] Input validation (Zod) em todas as Edge Functions
- [ ] CORS configurado para domínio correto
- [ ] Logs de auditoria funcionando
- [ ] Nenhum dado de outro usuário acessível

### Antes de cada feature

- [ ] RLS policy documentada e testada
- [ ] user_id em todas as queries de dados
- [ ] Validação de input no frontend e backend
- [ ] Tratamento de erros adequado
- [ ] Audit log configurado para a operação

---

## Validação

Esta documentação foi revisada e validada como parte das Sprints 1, 2 e 3.

**Status:** Atualizada na Sprint 3 (RLS implementado em 4 tabelas).
