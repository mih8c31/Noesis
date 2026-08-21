# Roadmap de Implementação — Noesis

> **Última atualização:** 2026-08-20  
> **Regra:** Cada sprint é apresentada para revisão e aprovação antes de prosseguir.

---

## Visão Geral

```
Sprint 1  ████████░░░░░░░░░░░░░░░░  Fundação (Documentação) ✅
Sprint 2  ░░░░░░░░████████░░░░░░░░  Setup + Autenticação
Sprint 3  ░░░░░░░░░░░░░░░░████████  Banco de Dados + Migrations
Sprint 4  ░░░░░░░░░░░░░░░░░░░░████  Processamento + RAG
Sprint 5  ░░░░░░░░░░░░░░░░░░░░░░██  Leitor
Sprint 6  ░░░░░░░░░░░░░░░░░░░░░░░█  Chat IA + RAG
Sprint 7  ░░░░░░░░░░░░░░░░░░░░░░░░  Voz (STT + TTS)
Sprint 8  ░░░░░░░░░░░░░░░░░░░░░░░░  Leitor + Voz
Sprint 9  ░░░░░░░░░░░░░░░░░░░░░░░░  Anotações + Fichamentos
Sprint 10 ░░░░░░░░░░░░░░░░░░░░░░░░  Tradução
Sprint 11 ░░░░░░░░░░░░░░░░░░░░░░░░  Citações + Referências
Sprint 12 ░░░░░░░░░░░░░░░░░░░░░░░░  Testes
Sprint 13 ░░░░░░░░░░░░░░░░░░░░░░░░  Deploy + Documentação
```

---

## Sprint 1 — Fundação ✅ CONCLUÍDA

**Objetivo:** Fundação documental e técnica do projeto.

| Tarefa | Status |
|---|---|
| Revisão da arquitetura | ✅ Concluída |
| Definição de padrões de código | ✅ Concluída (`docs/CONVENTIONS.md`) |
| Convenções de nomenclatura | ✅ Concluídas (`docs/CONVENTIONS.md`) |
| Variáveis de ambiente | ✅ Definidas (`.env.example`) |
| Regras de segurança | ✅ Definidas (`docs/SECURITY.md`) |
| Estratégia de autenticação | ✅ Definida (`docs/CONVENTIONS.md`) |
| Estratégia de storage | ✅ Definida (`docs/CONVENTIONS.md`) |
| Estratégia de migrations | ✅ Definida (`docs/CONVENTIONS.md`) |
| Estratégia de tratamento de erros | ✅ Definida (`docs/CONVENTIONS.md`) |
| Estratégia de logs/auditoria | ✅ Definida (`docs/CONVENTIONS.md`) |
| Estratégia de testes | ✅ Definida (`docs/CONVENTIONS.md`) |
| Regras de documentação | ✅ Definidas (`docs/CONVENTIONS.md`) |
| `.gitignore` | ✅ Criado |
| Identificação de riscos | ✅ Concluída |
| Checklist de preparação Sprint 2 | ✅ Completo |

**Entregável:** Fundação documental completa.

**Próximo:** Sprint 2 — Setup do Projeto + Autenticação (aguardando aprovação).

---

## Sprint 2 — Setup do Projeto + Autenticação ✅ CONCLUÍDA

**Objetivo:** App funcional com autenticação e layout base.

| Tarefa | Status |
|---|---|
| Setup do projeto (Vite + React 19 + TypeScript + Tailwind CSS) | ✅ Concluída |
| ShadCN UI (button, card, input, skeleton) | ✅ Concluída |
| Supabase client com variáveis de ambiente | ✅ Concluída |
| Auth Provider com `useAuth` hook | ✅ Concluída |
| Login / Register com email/senha | ✅ Concluída |
| Recuperação de senha | ✅ Concluída |
| Protected Routes com redirect | ✅ Concluída |
| Layout base (Header, MainLayout, AuthLayout) | ✅ Concluída |
| Auth store (Zustand) | ✅ Concluída |
| ESLint + Prettier | ✅ Concluída |
| Testes unitários (13 testes) | ✅ Concluídos |
| Notificações com Sonner | ✅ Concluída |
| HashRouter para GitHub Pages | ✅ Concluída |

**Escopo excluído desta sprint:**
- OAuth Google (previsto para sprint futura)
- Migrations do banco (Sprint 3)
- Funcionalidades de negócio (Dashboard/Settings = placeholders)

**Entregável:** App com autenticação funcional, rotas protegidas e layout base.

**Aprovação necessária antes de iniciar Sprint 3.**

---

## Sprint 3 — Banco de Dados e Migrations ⚠️ IMPLEMENTAÇÃO CONCLUÍDA, EXECUÇÃO PENDENTE

**Objetivo:** Modelar e criar a estrutura inicial do banco de dados.

| Tarefa | Status |
|---|---|
| Modelagem revisada e corrigida (15 pontos) | ✅ Concluída |
| 7 migrations criadas | ✅ Criadas |
| 4 tabelas: profiles, libraries, documents, source_files | ✅ Definidas |
| TEXT + CHECK (não ENUMs) | ✅ Decidido |
| RLS completo (13 policies) | ✅ Implementado |
| Triggers de integridade (validate_document_library) | ✅ Criados |
| Triggers de updated_at | ✅ Criados |
| Trigger auto-create profile | ✅ Criado |
| 5 índices otimizados | ✅ Criados |
| Storage buckets (documents, avatars) | ✅ Criados |
| Storage policies (7 policies) | ✅ Implementadas |
| Validação SQL | ✅ Aprovada (0 erros críticos) |
| 3 correções aplicadas | ✅ Corrigidas |
| Execução real no Supabase | ⏳ **PENDENTE** |
| Testes funcionais | ⏳ **PENDENTE** |

**Escopo excluído desta sprint:**
- pgvector / embeddings (Sprint 4)
- document_chunks (Sprint 4)
- audit_logs (deferred)
- system_settings (deferred)
- Funcionalidades de frontend

**Entregável:** Migrations validadas, aguardando execução em Supabase real.

**Aprovação necessária antes de iniciar Sprint 4.**

---

## Sprint 4 — Processamento + RAG

**Objetivo:** Documentos processados com embeddings para busca semântica.

| Tarefa | Descrição |
|---|---|
| Edge Function: process-document | Extração de texto, chunking, embeddings |
| pdf-parse | Integração para extração de texto do PDF |
| Chunking | Divisão em trechos de ~500 tokens com overlap |
| Embeddings | Geração via OpenAI `text-embedding-3-small` |
| pgvector setup | Extensão pgvector + índice HNSW |
| Migrations | `document_chunks`, extensões PostgreSQL |

**Entregável:** Documentos processados e busca semântica funcional.

---

## Sprint 5 — Leitor

**Objetivo:** Leitor de PDF completo com progresso e marcadores.

| Tarefa | Descrição |
|---|---|
| PDF Viewer | react-pdf ou pdf.js para visualização |
| Progresso de leitura | Tracking de página atual e porcentagem |
| Marcadores | Bookmarks por página com labels |
| Sessões de leitura | Registro de sessões com duração e progresso |
| Migrations | `reading_sessions`, `session_bookmarks` |

**Entregável:** Leitor funcional com progresso e marcadores.

---

## Sprint 6 — Chat IA + RAG

**Objetivo:** Chat com IA integrado ao contexto do documento.

| Tarefa | Descrição |
|---|---|
| Edge Function: ai-proxy | Proxy para provedores de IA |
| Multi-provider adapter | Suporte a OpenAI, Anthropic, Groq, Google, Ollama |
| Chat contextual | Conversa sobre o documento atual |
| RAG integration | Busca semântica → contexto → LLM |
| Streaming | Respostas em streaming para UX |
| Context Manager | Preserva estado entre mensagens |
| Migrations | `conversations`, `messages`, `ai_providers` |

**Entregável:** Chat IA com RAG funcional e multi-provider.

---

## Sprint 7 — Voz (STT + TTS)

**Objetivo:** Interação por voz em chat e leitor.

| Tarefa | Descrição |
|---|---|
| Web Speech API (STT) | Speech-to-Text nativo do browser |
| OpenAI TTS via Edge Function | Text-to-Speech natural |
| Voice UI | Botão de microfone, visualizer de áudio |
| VoiceContext + VoiceStore | Estado global de voz |
| ModalityContext | Alternância voz/texto |
| Voice settings | Velocidade, voz, idioma |

**Entregável:** Chat por voz funcional com STT e TTS.

---

## Sprint 8 — Leitor + Voz (integração)

**Objetivo:** Leitura de PDF com interação multimodal completa.

| Tarefa | Descrição |
|---|---|
| TTS durante leitura | Leitura em voz alta do documento |
| Interrupção de leitura | Parar TTS para fazer pergunta por voz/texto |
| Retomada de leitura | Continuar de onde parou após resposta |
| InterruptionPanel | Componente de interrupção no leitor |
| Context Manager no Reader | Preserva posição + contexto durante interrupção |

**Entregável:** Leitura interrompível por voz/texto com manutenção de contexto.

---

## Sprint 9 — Anotações + Fichamentos

**Objetivo:** Anotações e fichamentos inteligentes.

| Tarefa | Descrição |
|---|---|
| Highlights e notes | Anotações no leitor com cores e tipos |
| Fichamentos AI-generated | Resumos e análises gerados por IA |
| Templates | Modelos de fichamento (resumo, mapa conceitual, etc.) |
| Fichamento hierárquico | Sub-fichamentos |
| Migrations | `annotations`, `fichamentos`, `fichamento_attachments` |

**Entregável:** Anotações e fichamentos completos.

---

## Sprint 10 — Tradução

**Objetivo:** Tradução de documentos com cache local.

| Tarefa | Descrição |
|---|---|
| Tradução via AI | Tradução contextual de documentos |
| Cache local | IndexedDB via Dexie.js (por documento) |
| Language selector | Seleção de idioma alvo |

**Entregável:** Tradução com cache local funcional.

---

## Sprint 11 — Citações + Referências

**Objetivo:** Gerador de citações e gestão de referências.

| Tarefa | Descrição |
|---|---|
| Gerador de citações | ABNT, APA, Chicago, IEEE, Vancouver |
| Referências | CRUD de referências bibliográficas |
| Import de BibTeX | Importação de arquivos BibTeX |
| Migrations | `citations`, `references` |

**Entregável:** Citações e referências completas.

---

## Sprint 12 — Testes

**Objetivo:** Suite de testes completa.

| Tarefa | Descrição |
|---|---|
| Unit tests | Vitest para hooks, services, lib |
| Integration tests | Testes de fluxos completos |
| E2E tests | Playwright para fluxos críticos |
| Coverage | Relatório de cobertura |

**Entregável:** Suite de testes com cobertura adequada.

---

## Sprint 13 — Deploy + Documentação

**Objetivo:** Produto em produção com documentação completa.

| Tarefa | Descrição |
|---|---|
| GitHub Pages deploy | Build e deploy automatizado |
| CI/CD | GitHub Actions (lint, test, deploy) |
| README completo | Instruções de instalação e uso |
| API documentation | Documentação de Edge Functions |
| Security audit | Revisão de segurança |
| Performance audit | Lighthouse e otimizações |

**Entregável:** Produto em produção.

---

## Notas

- Cada sprint tem duração estimada de 1-2 semanas
- Sprints 7 e 8 são dedicados à funcionalidade de voz (multimodal)
- A ordem dos sprints pode ser ajustada conforme necessidade
- Nenhum sprint é iniciado sem aprovação do anterior
- Sprint 1 (documentação) concluída ✅
- Sprint 2 (setup + autenticação) concluída ✅
- Sprint 3 (banco de dados + migrations) concluída ✅ — aguardando aprovação para Sprint 4
