# Arquitetura Completa — Noesis

> **Versão:** 1.1  
> **Status:** Aprovada conceitualmente  
> **Última atualização:** 2026-08-20

---

## Índice

1. [Visão Geral da Solução](#1-visão-geral-da-solução)
2. [Módulos do Sistema](#2-módulos-do-sistema)
3. [Interação Multimodal](#3-interação-multimodal)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Fluxo de Autenticação](#5-fluxo-de-autenticação)
6. [Fluxo de Upload e Processamento de PDFs](#6-fluxo-de-upload-e-processamento-de-pdfs)
7. [Fluxo de Comunicação Front ↔ Back ↔ IA](#7-fluxo-de-comunicação-front--back--ia)
8. [Estratégia Multi-Provider de IA](#8-estratégia-multi-provider-de-ia)
9. [Estratégia RAG com pgvector](#9-estratégia-rag-com-pgvector)
10. [Isolamento de Dados Multi-Tenant](#10-isolamento-de-dados-multi-tenant)
11. [Segurança](#11-segurança)
12. [Cache](#12-cache)
13. [Logs e Auditoria](#13-logs-e-auditoria)
14. [Tratamento de Erros](#14-tratamento-de-erros)
15. [Roadmap de Implementação](#15-roadmap-de-implementação)
16. [Organização da Documentação](#16-organização-da-documentação)

---

## 1. Visão Geral da Solução

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React 19 + Vite + TS                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
│  │  │  Auth     │ │ Library  │ │ Reader   │ │  AI Chat       │  │  │
│  │  │  Module   │ │ Module   │ │ Module   │ │  Module        │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘  │  │
│  │       │             │            │                │           │  │
│  │  ┌────┴─────────────┴────────────┴────────────────┴────────┐  │  │
│  │  │              Supabase Client SDK (@supabase/supabase-js)│  │  │
│  │  └──────────────────────┬──────────────────────────────────┘  │  │
│  └─────────────────────────┼─────────────────────────────────────┘  │
│                            │                                        │
│  ┌─────────────────────────┼─────────────────────────────────────┐  │
│  │        Dexie.js (IndexedDB) — Cache Local                    │  │
│  │        Traduções, preferências offline, drafts               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS (REST + WebSocket)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Cloud BaaS)                          │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │  Auth     │ │PostgreSQL│ │ Storage  │ │  Edge Functions      │  │
│  │  (JWT)    │ │ + RLS    │ │ (S3)     │ │  (Deno Runtime)      │  │
│  │           │ │ + pgvec  │ │          │ │  - Processamento PDF │  │
│  │  - Email  │ │          │ │  - docs  │ │  - Webhooks IA       │  │
│  │  - Google │ │          │ │  - avatars│ │  - Cron jobs         │  │
│  │  - GitHub │ │          │ │          │ │  - Validações server  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Realtime (WebSocket)                      │   │
│  │                    - Status de processamento                 │   │
│  │                    - Notificações                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌──────────────────┐    ┌──────────────────────┐
        │   AI Providers   │    │  Cloud Storage        │
        │   (APIs Externas)│    │  (GitHub Pages CDN)   │
        │                  │    │                        │
        │  - OpenAI        │    │  - Assets estáticos   │
        │  - Anthropic     │    │  - Build do frontend  │
        │  - Google AI     │    │                        │
        │  - Groq          │    └──────────────────────┘
        │  - Ollama (local)│
        └──────────────────┘
```

---

## 2. Módulos do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                      NOESIS MODULES                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   AUTH     │  │  LIBRARY   │  │  DOCUMENT  │            │
│  │            │  │            │  │            │            │
│  │ - Login    │  │ - CRUD Lib │  │ - Upload   │            │
│  │ - Register │  │ - List     │  │ - Process  │            │
│  │ - OAuth    │  │ - Search   │  │ - Parse    │            │
│  │ - Session  │  │ - Filter   │  │ - Chunks   │            │
│  │ - RLS      │  │ - Sort     │  │ - Embedding│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  READER    │  │  AI CHAT   │  │ FICHAMENTO │            │
│  │            │  │            │  │            │            │
│  │ - PDF View │  │ - Multi-   │  │ - Summary  │            │
│  │ - Progress │  │   Provider │  │ - Concepts │            │
│  │ - Bookmarks│  │ - Streaming│  │ - Quotes   │            │
│  │ - TTS      │  │ - Context  │  │ - Export   │            │
│  │ - Search   │  │ - RAG      │  │ - Templates│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ ANNOTATION │  │ CITATION   │  │ SETTINGS   │            │
│  │            │  │            │  │            │            │
│  │ - Highlight│  │ - ABNT     │  │ - Profile  │            │
│  │ - Notes    │  │ - APA      │  │ - AI Prefs │            │
│  │ - Questions│  │ - Chicago  │  │ - Theme    │            │
│  │ - Colors   │  │ - IEEE     │  │ - Language │            │
│  │ - AI Gen   │  │ - BibTeX   │  │ - TTS      │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │   ADMIN    │  │ MULTIMODAL │  │   VOICE / SPEECH      │ │
│  │            │  │ INTERACTION│  │                       │ │
│  │ - Logs     │  │            │  │ - STT (Speech-to-Text)│ │
│  │ - Audit    │  │ - Context  │  │ - TTS (Text-to-Speech)│ │
│  │ - Usage    │  │   Manager  │  │ - Streaming duplex    │ │
│  │ - Health   │  │ - Modal    │  │ - Interruptions       │ │
│  │            │  │   Switcher │  │ - Voice profiles      │ │
│  │            │  │ - Session  │  │ - Wake word (future)  │ │
│  │            │  │   State    │  │                       │ │
│  └────────────┘  └────────────┘  └───────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Interação Multimodal

> **Princípio fundamental:** O usuário pode alternar entre voz e texto a qualquer momento, em qualquer tela, sem perder o contexto da conversa ou da leitura.

### 3.1 Visão Geral do Fluxo Multimodal

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERAÇÃO MULTIMODAL                              │
│                                                                     │
│  USUÁRIO PODE:                                                      │
│  ├── Digitar mensagem → IA responde por texto                       │
│  ├── Falar mensagem → IA responde por texto                         │
│  ├── Digitar mensagem → IA responde por voz                         │
│  ├── Falar mensagem → IA responde por voz                           │
│  ├── Interromper leitura TTS → fazer pergunta → retomar leitura     │
│  ├── Interromper leitura TTS → fazer pergunta → IA responde voz     │
│  └── Alternar entre voz/texto a qualquer momento                    │
│                                                                     │
│  CONTEXTO É PRESERVADO EM TODOS OS CASOS:                          │
│  ├── Histórico da conversa (mensagens anteriores)                   │
│  ├── Posição no documento (página, parágrafo, trecho selecionado)  │
│  ├── Sessão de leitura ativa                                       │
│  └── Documento de referência atual                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Arquitetura de Voz

```
┌─────────────────────────────────────────────────────────────────────┐
│                       VOICE ARCHITECTURE                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    CAMADA DE ENTRADA (STT)                    │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ Web Speech API      │  │ OpenAI Whisper API           │   │  │
│  │  │ (navegador nativo)  │  │ (via Edge Function)          │   │  │
│  │  │                     │  │                               │   │  │
│  │  │ - Gratuito          │  │ - Maior precisão             │   │  │
│  │  │ - Latência baixa    │  │ - Suporte multi-idioma       │   │  │
│  │  │ - Funciona offline  │  │ - Requer upload de áudio     │   │  │
│  │  │ - Limitado em PT-BR │  │ - Custo por minuto           │   │  │
│  │  │                     │  │                               │   │  │
│  │  │ PRIORIDADE: 1       │  │ FALLBACK: 2                   │   │  │
│  │  └─────────┬───────────┘  └──────────────┬────────────────┘   │  │
│  │            │                              │                    │  │
│  │            ▼                              ▼                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │           speechRecognizer (padronizado)                │  │  │
│  │  │           Input: AudioStream ou AudioBlob               │  │  │
│  │  │           Output: { text, language, confidence }        │  │  │
│  │  └─────────────────────────┬───────────────────────────────┘  │  │
│  └────────────────────────────┼──────────────────────────────────┘  │
│                               │                                     │
│                               ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              CONTEXT MANAGER (preserva estado)                │  │
│  │                                                               │  │
│  │  Input: texto transcrito + contexto atual                    │  │
│  │                                                               │  │
│  │  Estado mantido:                                             │  │
│  │  ├── documentId        (documento ativo)                     │  │
│  │  ├── readingSessionId  (sessão de leitura)                   │  │
│  │  ├── pageNumber        (página atual)                        │  │
│  │  ├── selectedText      (trecho selecionado, se houver)       │  │
│  │  ├── conversationId    (ID da conversa ativa)                │  │
│  │  ├── modality          ('voice' | 'text')                    │  │
│  │  └── ttsState          (tocando / pausado / parado)          │  │
│  │                                                               │  │
│  │  Output: mensagem enriquecida com contexto                   │  │
│  └─────────────────────────┬─────────────────────────────────────┘  │
│                            │                                        │
│                            ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              AI SERVICE LAYER (Edge Function)                 │  │
│  │                                                               │  │
│  │  Input: { messages[], provider, model, modality }            │  │
│  │                                                               │  │
│  │  → Envia ao LLM com contexto completo                        │  │
│  │  → LLM responde (texto)                                      │  │
│  │  → Se modality = 'voice': gera TTS                           │  │
│  │  → Se modality = 'text': retorna texto                       │  │
│  └─────────────────────────┬─────────────────────────────────────┘  │
│                            │                                        │
│                            ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    CAMADA DE SAÍDA (TTS)                      │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ Web Speech API      │  │ OpenAI TTS API               │   │  │
│  │  │ (speechSynthesis)   │  │ (via Edge Function)          │   │  │
│  │  │                     │  │                               │   │  │
│  │  │ - Gratuito          │  │ - Vozes naturais             │   │  │
│  │  │ - Latência baixa    │  │ - Streaming de áudio         │   │  │
│  │  │ - Vozes genéricas   │  │ - Múltiplas vozes            │   │  │
│  │  │ - Sem controle fino │  │ - Controle de velocidade     │   │  │
│  │  │                     │  │ - Custo por caractere        │   │  │
│  │  │ FALLBACK: 2         │  │ PRIORIDADE: 1                 │   │  │
│  │  └─────────────────────┘  └─────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │        ttsPlayer (padronizado)                          │  │  │
│  │  │        Input: texto + voz + velocidade                  │  │  │
│  │  │        Output: AudioStream (play, pause, stop)          │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Fluxo de Interrupção de Leitura

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  React   │     │ Supabase │     │   AI     │
│  Browser │     │  App     │     │ Edge Fn  │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  1. TTS está lendo documento    │                 │
     │  (audio stream ativo)           │                 │
     │                │                 │                 │
     │  2. Usuário fala ou digita      │                 │
     │  "Pausar. O que é epistemologia?"│                 │
     │───────────────►│                 │                 │
     │                │                 │                 │
     │  3. Para TTS  │                 │                 │
     │  Salva posição│                 │                 │
     │  currentChunk │                 │                 │
     │  currentPage  │                 │                 │
     │                │                 │                 │
     │  4. Monta msg │                 │                 │
     │  com contexto:│                 │                 │
     │  - "Estava    │                 │                 │
     │    lendo pg 5,│                 │                 │
     │    trecho:    │                 │                 │
     │    [chunk]"   │                 │                 │
     │  - "Pergunta: │                 │                 │
     │    O que é    │                 │                 │
     │    epistemol.?"│                │                 │
     │                │────────────────►│                 │
     │                │                 │  5. RAG busca  │
     │                │                 │  contexto doc  │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  6. Resposta   │
     │                │                 │◄────────────────│
     │                │                 │                 │
     │  7. Exibe     │                 │                 │
     │  resposta     │                 │                 │
     │  em texto +   │                 │                 │
     │  inicia TTS   │                 │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
     │  8. Após      │                 │                 │
     │  resposta,    │                 │                 │
     │  pergunta:    │                 │                 │
     │  "Deseja      │                 │                 │
     │  continuar    │                 │                 │
     │  lendo?"      │                 │                 │
     │                │                 │                 │
     │  9. Usuário:  │                 │                 │
     │  "Sim"        │                 │                 │
     │───────────────►│                 │                 │
     │                │                 │                 │
     │  10. Retoma   │                 │                 │
     │  TTS de onde  │                 │                 │
     │  parou (pg 5, │                 │                 │
     │  chunk N)     │                 │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
```

### 3.4 Alternância de Modalidade (Voz ↔ Texto)

```
┌─────────────────────────────────────────────────────────────────────┐
│              MODALITY SWITCHER — PRESERVAÇÃO DE CONTEXTO            │
│                                                                     │
│  ESTADO COMPARTILHADO (Context Manager):                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  {                                                            │  │
│  │    conversationId: "uuid-da-conversa",                       │  │
│  │    messages: [                                                 │  │
│  │      { role: "user", content: "Explique RAG", modality: "text" }│
│  │      { role: "assistant", content: "RAG é...", modality: "text" }│
│  │      { role: "user", content: "Como funciona na prática?",    │  │
│  │        modality: "voice" }                                     │
│  │      { role: "assistant", content: "Na prática...",           │  │
│  │        modality: "voice" }                                     │  │
│  │    ],                                                          │  │
│  │    currentDocument: { id: "uuid", page: 5, chunk: 3 },       │  │
│  │    activeModality: "voice",                                   │  │
│  │    ttsState: "playing"                                        │  │
│  │  }                                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  REGRAS DE ALTERNÂNCIA:                                             │
│  1. Mensagens anteriores são preservadas INDEPENDENTE da modalidade│
│  2. O LLM recebe TODO o histórico (texto + metadata de modalidade) │
│  3. Resposta pode ser em modalidade DIFERENTE da pergunta          │
│  4. Usuário pode forçar modalidade de resposta (toggle)           │
│  5. TTS state é independente do conversation state                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.5 Decisões de Interação Multimodal

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **Web Speech API como STT primário** | Whisper exclusivo | Gratuito, latência zero, funciona offline; Whisper como fallback para qualidade |
| **OpenAI TTS como primário** | Web Speech API TTS | Vozes naturais (alloy, echo, nova); streaming; controle de velocidade |
| **Context Manager no client** | Server-side session | SPA sem backend; estado no React; persiste via Supabase conversations |
| **Interrupção via state** | WebRTC duplex | Simplificidade; state machine clara; sem complexidade de áudio bidirecional |
| **Modalidade na mensagem** | Só no header | Permite ao LLM entender o contexto de como a mensagem foi enviada |
| **TTS streaming** | Audio completo | Percepção de resposta mais rápida; menor uso de memória |

### 3.6 Dependências de Voz

| Pacote | Uso | Obrigatório |
|---|---|---|
| `@supabase/supabase-js` | Cliente Supabase | Sim |
| `dexie` | Cache local (IndexedDB) | Sim |
| `react-pdf` ou `@react-pdf-viewer/core` | Visualização de PDF | Sim |
| `pdfjs-dist` | Parse de PDF no client | Sim |
| `zod` | Validação de schemas | Sim |
| `lucide-react` | Ícones | Sim |

**Nota:** Web Speech API é nativa do browser — não requer pacote adicional. OpenAI TTS/Whisper são chamadas HTTP via Edge Function.

---

## 4. Estrutura de Pastas

```
noesis/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test
│       └── deploy.yml                # Build + Deploy GitHub Pages
│
├── docs/
│   ├── ARCHITECTURE.md               # Este documento
│   ├── DATABASE.md                   # Modelagem do banco
│   ├── ROADMAP.md                    # Roadmap de sprints
│   ├── PROJECT_STATE.md              # Estado atual do projeto
│   ├── SECURITY.md                   # Diretrizes de segurança
│   ├── API.md                        # Documentação de APIs
│   └── DECISIONS.md                  # Registro de decisões (ADR)
│
├── supabase/
│   ├── config.toml                   # Configuração do Supabase
│   ├── seed.sql                      # Dados iniciais
│   └── migrations/
│       ├── 00001_enable_extensions.sql
│       ├── 00002_create_enums.sql
│       ├── 00003_create_profiles.sql
│       ├── 00004_create_auth_tables.sql
│       ├── 00005_create_libraries.sql
│       ├── 00006_create_documents.sql
│       ├── 00007_create_source_files.sql
│       ├── 00008_create_document_chunks.sql
│       ├── 00009_create_reading_sessions.sql
│       ├── 00010_create_conversations.sql
│       ├── 00011_create_messages.sql
│       ├── 00012_create_fichamentos.sql
│       ├── 00013_create_annotations.sql
│       ├── 00014_create_citations_references.sql
│       ├── 00015_create_ai_interactions.sql
│       ├── 00016_create_audit_logs.sql
│       ├── 00017_create_system_settings.sql
│       ├── 00018_create_rls_policies.sql
│       ├── 00019_create_functions.sql
│       └── 00020_create_indexes.sql
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png
│
├── src/
│   ├── main.tsx                      # Entry point React
│   ├── App.tsx                       # Root component + Router
│   ├── vite-env.d.ts                 # Vite types
│   │
│   ├── assets/                       # Estáticos (imagens, icones)
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── config/                       # Configurações globais
│   │   ├── supabase.ts               # Supabase client init
│   │   ├── ai-providers.ts           # Config de provedores IA
│   │   └── constants.ts              # Constantes da aplicação
│   │
│   ├── core/                         # Funcionalidades transversais
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx       # Context de autenticação
│   │   │   ├── ProtectedRoute.tsx     # Guard de rotas
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts        # Hook de autenticação
│   │   │   │   └── useSession.ts     # Hook de sessão
│   │   │   └── services/
│   │   │       └── auth.service.ts   # Operações de auth
│   │   │
│   │   ├── database/
│   │   │   ├── types.ts              # Tipos gerados do Supabase
│   │   │   ├── client.ts             # Supabase DB client
│   │   │   └── queries/
│   │   │       ├── documents.ts      # Queries de documentos
│   │   │       ├── fichamentos.ts    # Queries de fichamentos
│   │   │       ├── conversations.ts  # Queries de conversas
│   │   │       └── ...
│   │   │
│   │   ├── storage/
│   │   │   └── storage.service.ts    # Upload/download de arquivos
│   │   │
│   │   ├── cache/
│   │   │   ├── dexie.ts              # Dexie DB (IndexedDB)
│   │   │   ├── translation.cache.ts  # Cache de traduções
│   │   │   └── preferences.cache.ts  # Cache de preferências
│   │   │
│   │   ├── hooks/                    # Hooks globais reutilizáveis
│   │   │   ├── useDebounce.ts
│   │   │   ├── useInfiniteScroll.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useMediaQuery.ts
│   │   │
│   │   ├── lib/                      # Utilitários e helpers
│   │   │   ├── cn.ts                 # Class name merger (shadcn)
│   │   │   ├── formatters.ts         # Formatação de dados
│   │   │   ├── validators.ts         # Validações com Zod
│   │   │   ├── pdf-parser.ts         # Extração de texto de PDF
│   │   │   └── errors.ts             # Tratamento padronizado
│   │   │
│   │   ├── types/                    # Tipos compartilhados
│   │   │   ├── database.ts           # Tipos do banco
│   │   │   ├── api.ts                # Tipos de request/response
│   │   │   └── common.ts             # Tipos genéricos
│   │   │
│   │   └── ui/                       # Componentes base (shadcn)
│   │       ├── ui/
│   │       │   ├── button.tsx
│   │       │   ├── card.tsx
│   │       │   ├── dialog.tsx
│   │       │   ├── input.tsx
│   │       │   ├── dropdown-menu.tsx
│   │       │   ├── toast.tsx
│   │       │   ├── skeleton.tsx
│   │       │   └── ...
│   │       ├── layout/
│   │       │   ├── Sidebar.tsx
│   │       │   ├── Header.tsx
│   │       │   ├── Footer.tsx
│   │       │   ├── MainLayout.tsx
│   │       │   └── AuthLayout.tsx
│   │       └── shared/
│   │           ├── LoadingSpinner.tsx
│   │           ├── EmptyState.tsx
│   │           ├── ErrorBoundary.tsx
│   │           └── ConfirmDialog.tsx
│   │
│   ├── features/                     # Módulos de funcionalidades
│   │   │
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── OAuthButtons.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── library/
│   │   │   ├── pages/
│   │   │   │   └── LibraryPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── LibraryList.tsx
│   │   │   │   ├── LibraryCard.tsx
│   │   │   │   ├── LibraryForm.tsx
│   │   │   │   └── LibraryFilter.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLibraries.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── pages/
│   │   │   │   └── DocumentsPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentCard.tsx
│   │   │   │   ├── DocumentGrid.tsx
│   │   │   │   ├── DocumentDetail.tsx
│   │   │   │   ├── DocumentSearch.tsx
│   │   │   │   └── ProcessingStatus.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDocuments.ts
│   │   │   │   └── useDocumentUpload.ts
│   │   │   ├── services/
│   │   │   │   └── document.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── reader/
│   │   │   ├── pages/
│   │   │   │   └── ReaderPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── PDFViewer.tsx
│   │   │   │   ├── ReadingProgress.tsx
│   │   │   │   ├── BookmarksList.tsx
│   │   │   │   ├── TTSPlayer.tsx
│   │   │   │   ├── TextSelection.tsx
│   │   │   │   ├── ReadingSidebar.tsx
│   │   │   │   ├── InterruptionPanel.tsx
│   │   │   │   └── VoiceInput.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useReadingSession.ts
│   │   │   │   ├── usePDFViewer.ts
│   │   │   │   ├── useTTS.ts
│   │   │   │   └── useInterruption.ts
│   │   │   ├── services/
│   │   │   │   └── tts.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── pages/
│   │   │   │   └── ChatPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ProviderSelector.tsx
│   │   │   │   ├── ModelSelector.tsx
│   │   │   │   ├── VoiceToggle.tsx
│   │   │   │   └── ModalityIndicator.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useConversations.ts
│   │   │   │   ├── useAIProvider.ts
│   │   │   │   └── useVoiceChat.ts
│   │   │   ├── services/
│   │   │   │   └── chat.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── fichamentos/
│   │   │   ├── pages/
│   │   │   │   ├── FichamentosPage.tsx
│   │   │   │   └── FichamentoDetailPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── FichamentoList.tsx
│   │   │   │   ├── FichamentoCard.tsx
│   │   │   │   ├── FichamentoEditor.tsx
│   │   │   │   ├── FichamentoTemplates.tsx
│   │   │   │   └── FichamentoExport.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useFichamentos.ts
│   │   │   ├── services/
│   │   │   │   └── fichamento.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── annotations/
│   │   │   ├── components/
│   │   │   │   ├── AnnotationPanel.tsx
│   │   │   │   ├── Highlight.tsx
│   │   │   │   ├── AnnotationForm.tsx
│   │   │   │   └── AnnotationList.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAnnotations.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── citations/
│   │   │   ├── components/
│   │   │   │   ├── CitationGenerator.tsx
│   │   │   │   ├── CitationFormat.tsx
│   │   │   │   ├── ReferenceList.tsx
│   │   │   │   └── ReferenceForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCitations.ts
│   │   │   │   └── useReferences.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── translations/
│   │   │   ├── components/
│   │   │   │   ├── TranslationPanel.tsx
│   │   │   │   └── LanguageSelector.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useTranslation.ts
│   │   │   ├── services/
│   │   │   │   └── translation.service.ts
│   │   │   ├── cache/
│   │   │   │   └── translation.cache.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── voice/                     # Módulo de voz (STT/TTS)
│   │   │   ├── components/
│   │   │   │   ├── VoiceButton.tsx
│   │   │   │   ├── VoiceVisualizer.tsx
│   │   │   │   ├── VoiceSettings.tsx
│   │   │   │   └── VoiceStatus.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSTT.ts          # Speech-to-Text
│   │   │   │   ├── useTTS.ts          # Text-to-Speech
│   │   │   │   ├── useVoiceRecorder.ts
│   │   │   │   └── useVoiceSettings.ts
│   │   │   ├── services/
│   │   │   │   ├── stt.service.ts     # STT providers
│   │   │   │   └── tts.service.ts     # TTS providers
│   │   │   ├── lib/
│   │   │   │   ├── speech-recognition.ts  # Wrapper Web Speech API
│   │   │   │   ├── speech-synthesis.ts    # Wrapper Web Speech API
│   │   │   │   └── audio-utils.ts         # Utilitários de áudio
│   │   │   └── index.ts
│   │   │
│   │   └── settings/
│   │       ├── pages/
│   │       │   └── SettingsPage.tsx
│   │       ├── components/
│   │       │   ├── ProfileForm.tsx
│   │       │   ├── AIPreferences.tsx
│   │       │   ├── ThemeSettings.tsx
│   │       │   ├── LanguageSettings.tsx
│   │       │   └── TTSSettings.tsx
│   │       └── index.ts
│   │
│   ├── shared/                       # Contextos e providers compartilhados
│   │   ├── contexts/
│   │   │   ├── ModalityContext.tsx     # Contexto de modalidade (voz/texto)
│   │   │   ├── VoiceContext.tsx        # Contexto global de voz
│   │   │   └── ReadingContext.tsx      # Contexto de sessão de leitura
│   │   ├── providers/
│   │   │   ├── ModalityProvider.tsx
│   │   │   └── VoiceProvider.tsx
│   │   └── state-machine/
│   │       ├── voiceMachine.ts         # Máquina de estados de voz
│   │       └── modalityMachine.ts      # Máquina de estados de modalidade
│   │
│   ├── routes/                       # Definição de rotas
│   │   ├── index.tsx                 # Route config
│   │   ├── public.routes.tsx         # Rotas públicas
│   │   └── protected.routes.tsx      # Rotas protegidas
│   │
│   ├── store/                        # Estado global (Zustand)
│   │   ├── authStore.ts              # Estado de autenticação
│   │   ├── documentStore.ts          # Estado de documentos
│   │   ├── chatStore.ts              # Estado de chat
│   │   ├── readerStore.ts            # Estado do leitor
│   │   ├── voiceStore.ts             # Estado de voz
│   │   ├── modalityStore.ts          # Estado de modalidade
│   │   └── settingsStore.ts          # Estado de configurações
│   │
│   └── styles/
│       ├── globals.css               # Estilos globais + Tailwind
│       └── variables.css             # CSS custom properties
│
├── supabase/
│   └── functions/                    # Edge Functions (Deno)
│       ├── process-document/
│       │   └── index.ts              # Processamento de PDF
│       ├── generate-embedding/
│       │   └── index.ts              # Geração de embeddings
│       ├── ai-proxy/
│       │   └── index.ts              # Proxy para provedores IA
│       ├── tts-proxy/
│       │   └── index.ts              # Proxy TTS (OpenAI TTS)
│       ├── stt-proxy/
│       │   └── index.ts              # Proxy STT (OpenAI Whisper)
│       └── webhook-processing/
│           └── index.ts              # Webhooks assíncronos
│
├── tests/
│   ├── unit/                         # Testes unitários
│   │   ├── hooks/
│   │   ├── services/
│   │   └── lib/
│   ├── integration/                  # Testes de integração
│   │   ├── auth.test.ts
│   │   ├── documents.test.ts
│   │   └── fichamentos.test.ts
│   └── e2e/                          # Testes E2E
│       ├── auth.spec.ts
│       └── upload.spec.ts
│
├── .env.example                      # Variáveis de ambiente
├── .env.local                        # Env local (gitignore)
├── .eslintrc.cjs                     # Config ESLint
├── .prettierrc                       # Config Prettier
├── components.json                   # Config ShadCN
├── index.html                        # HTML entry point
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 5. Fluxo de Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  React   │     │ Supabase │     │ Provider │
│  Browser │     │  App     │     │  Auth    │     │ (Google) │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  1. Clica "Login com Google"    │                 │
     │───────────────►│                 │                 │
     │                │                 │                 │
     │                │  2. signInWithOAuth({             │
     │                │     provider: 'google'           │
     │                │  })                               │
     │                │───────────────►│                 │
     │                │                 │                 │
     │                │                 │  3. Redireciona │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  4. Callback    │
     │                │                 │◄────────────────│
     │                │                 │                 │
     │                │  5. Session     │                 │
     │                │◄───────────────│                 │
     │                │  (JWT + User)   │                 │
     │                │                 │                 │
     │  6. Rota protegida             │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
     │                │  7. Todas as queries Supabase     │
     │                │  incluem Bearer token JWT         │
     │                │  → RLS filtra automaticamente     │
     │                │───────────────►│                 │
     │                │                 │                 │
```

### Decisões de Auth

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **Supabase Auth** | Firebase Auth, Auth0, Clerk | Integrado ao Supabase; RLS nativo; custo zero no free tier |
| **JWT no client** | Sessions server-side | SPA sem backend; JWT válido por 1h; refresh automático |
| **OAuth (Google)** | Só email/senha | Reduz fricção; menos senhas = menos risco |
| **AuthProvider no React** | Context + useReducer | Padrão React; reatividade; limpeza automática |
| **ProtectedRoute** | Middleware no server | SPA; verificação client-side; redirect automático |

---

## 6. Fluxo de Upload e Processamento de PDFs

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  React   │     │ Supabase │     │  Edge    │
│  Browser │     │  App     │     │ Storage  │     │ Function │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  1. Seleciona  │                 │                 │
     │  PDF (.pdf)    │                 │                 │
     │───────────────►│                 │                 │
     │                │                 │                 │
     │  2. Validação  │                 │                 │
     │  client-side   │                 │                 │
     │  (tipo, tamanho│                 │                 │
     │   máx 50MB)    │                 │                 │
     │                │                 │                 │
     │  3. Upload     │                 │                 │
     │  supabase      │                 │                 │
     │  .storage      │                 │                 │
     │  .from('docs') │                 │                 │
     │  .upload(path) │                 │                 │
     │                │────────────────►│                 │
     │                │                 │                 │
     │  4. Retorna    │                 │                 │
     │  file_path     │                 │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
     │  5. INSERT     │                 │                 │
     │  documento     │                 │                 │
     │  status:       │                 │                 │
     │  "uploading"   │                 │                 │
     │                │───────────────►│                 │
     │                │                 │                 │
     │  6. Trigger    │                 │                 │
     │  pg_notify     │                 │                 │
     │  "doc_uploaded"│                 │                 │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  7. process-    │
     │                │                 │  document()     │
     │                │                 │                 │
     │                │                 │  a) Download PDF│
     │                │                 │  b) pdf-parse   │
     │                │                 │  c) Extrair texto│
     │                │                 │  d) Chunkar     │
     │                │                 │  e) Gerar       │
     │                │                 │     embeddings  │
     │                │                 │  f) Salvar      │
     │                │                 │     chunks +    │
     │                │                 │     embeddings  │
     │                │                 │  g) Atualizar   │
     │                │                 │     status para │
     │                │                 │     "ready"     │
     │                │                 │                 │
     │  8. Realtime   │                 │                 │
     │  update        │                 │                 │
     │◄───────────────│                 │                 │
     │  (status:      │                 │                 │
     │   "ready")     │                 │                 │
     │                │                 │                 │
```

### Pipeline de Processamento

| Etapa | Ferramenta | Descrição |
|---|---|---|
| **1. Extração** | `pdf-parse` (npm) ou Edge Function com Deno | Extrair texto bruto do PDF |
| **2. Limpeza** | Regex + normalização | Remover headers/footers, normalizar espaços |
| **3. Chunking** | Lógica customizada | Dividir em trechos de ~500 tokens com overlap |
| **4. Embeddings** | OpenAI `text-embedding-3-small` | Vetorizar cada chunk (1536 dimensões) |
| **5. Armazenamento** | Supabase DB + Storage | Chunks+embeddings em `document_chunks`; PDF em Storage |
| **6. Notificação** | Supabase Realtime | Atualizar status do documento em tempo real |

### Decisões de Upload

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **Client-side upload** | Server-side upload | Direto do browser ao Storage; menor latência; menos custo de servidor |
| **Edge Function pós-upload** | Webhook externo | Mesmo runtime Supabase; sem custo adicional; acesso ao banco |
| **pg_notify trigger** | Polling | Real-time; baixa latência; menos carga no client |
| **Chunking fixo (~500 tokens)** | Dynamic chunking | Simples; previsível; bom para embeddings consistentes |

---

## 7. Fluxo de Comunicação Front ↔ Back ↔ IA

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │     │ Supabase │     │  Edge    │     │   AI     │
│  App     │     │    DB    │     │ Function │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │  ──── USO DIRETO (RLS) ────     │                 │
     │                │                 │                 │
     │  1. CRUD docs, libs, annotations │                 │
     │  2. Supabase client queries     │                 │
     │  3. RLS filtra automaticamente  │                 │
     │───────────────►│                 │                 │
     │                │                 │                 │
     │  ──── VIA EDGE FUNCTION ────    │                 │
     │                │                 │                 │
     │  4. Chat com IA                 │                 │
     │  5. supabase.functions          │                 │
     │  .invoke('ai-proxy', {          │                 │
     │    body: { messages, provider } │                 │
     │  })                             │                 │
     │                │────────────────►│                 │
     │                │                 │  6. Valida JWT  │
     │                │                 │  7. Monta req   │
     │                │                 │  8. Chama API   │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  9. Response    │
     │                │                 │◄────────────────│
     │                │                 │                 │
     │                │  10. Salva     │                 │
     │                │  interaction   │                 │
     │                │  log           │                 │
     │                │◄────────────────│                 │
     │                │                 │                 │
     │  11. Stream/Response            │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
     │  ──── VIA CACHE LOCAL ────      │                 │
     │                │                 │                 │
     │  12. Tradução  │                 │                 │
     │  13. Dexie.js  │                 │                 │
     │  (IndexedDB)   │                 │                 │
     │  cache hit?    │                 │                 │
     │  ├── sim: return cached          │                 │
     │  └── não: call ai-proxy          │                 │
     │                │────────────────►│                 │
     │                │                 │  14. AI API     │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  15. Response   │
     │                │                 │◄────────────────│
     │                │                 │                 │
     │  16. Salva no │                 │                 │
     │  Dexie.js     │                 │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
     │  ──── VIA EDGE FUNCTION (VOZ) ──│                 │
     │                │                 │                 │
     │  17. TTS      │                 │                 │
     │  18. supabase.functions          │                 │
     │  .invoke('tts-proxy', {          │                 │
     │    body: { text, voice, speed }  │                 │
     │  })                             │                 │
     │                │────────────────►│                 │
     │                │                 │  19. OpenAI TTS │
     │                │                 │────────────────►│
     │                │                 │                 │
     │                │                 │  20. Audio      │
     │                │                 │  stream         │
     │                │                 │◄────────────────│
     │                │                 │                 │
     │  21. Stream   │                 │                 │
     │  de áudio     │                 │                 │
     │◄───────────────│                 │                 │
     │                │                 │                 │
```

### Canais de Comunicação

| Canal | Quando usar | Exemplo |
|---|---|---|
| **Supabase Client (direto)** | CRUD simples com RLS | Criar biblioteca, listar documentos, salvar anotação |
| **Edge Function** | Lógica server-side, segredos | Chat IA, processamento PDF, TTS, STT, embeddings |
| **IndexedDB (Dexie)** | Dados locais, cache, offline | Traduções, preferências offline, drafts |
| **Supabase Realtime** | Atualizações em tempo real | Status de processamento, notificações |

---

## 8. Estratégia Multi-Provider de IA

```
┌──────────────────────────────────────────────────────────────┐
│                  AI SERVICE LAYER                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              ai-proxy (Edge Function)                   │  │
│  │                                                        │  │
│  │  Input: { provider, model, messages, options }         │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ OpenAI   │  │ Anthropic│  │ Groq     │            │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Google   │  │ Ollama   │  │ Custom   │            │  │
│  │  │ AI       │  │ (local)  │  │ Provider │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                        │  │
│  │  Output: { content, tokens, model, latency }          │  │
│  │                                                        │  │
│  │  + Log ai_interactions (audit)                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              tts-proxy (Edge Function)                  │  │
│  │                                                        │  │
│  │  Input: { text, voice, speed, provider }               │  │
│  │  Output: AudioStream (chunked)                         │  │
│  │                                                        │  │
│  │  Providers:                                            │  │
│  │  - OpenAI TTS (alloy, echo, fable, onyx, nova, shimmer)│ │
│  │  - ElevenLabs (future)                                 │  │
│  │  - Browser TTS (fallback)                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              stt-proxy (Edge Function)                  │  │
│  │                                                        │  │
│  │  Input: { audio, language, provider }                  │  │
│  │  Output: { text, confidence, language }                │  │
│  │                                                        │  │
│  │  Providers:                                            │  │
│  │  - OpenAI Whisper (via API)                            │  │
│  │  - Browser STT (Web Speech API, fallback)              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Interface do Adapter

```typescript
// Pseudocódigo — não implementar ainda
interface AIProviderAdapter {
  name: string;
  chat(messages, model, options): Promise<AIResponse>;
  embed(text): Promise<number[]>;
}

interface TTSProviderAdapter {
  name: string;
  synthesize(text, voice, speed): Promise<ReadableStream>;
  getVoices(): Promise<Voice[]>;
}

interface STTProviderAdapter {
  name: string;
  transcribe(audio: Blob, language: string): Promise<TranscriptionResult>;
}
```

### Decisões Multi-Provider

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **Adapter Pattern** | Switch/case no código | Adicionar provedor = nova classe; sem alterar código existente |
| **Edge Function como proxy** | Chamar API direto do browser | Protege API keys; rate limiting server-side; logs centralizados |
| **Fallback automático** | Só provedor primário | Se OpenAI cai, usa Anthropic; maior disponibilidade |
| **User selectable** | Provider fixo | Usuário escolhe melhor custo/benefício |

---

## 9. Estratégia RAG com pgvector

```
┌──────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                               │
│                                                              │
│  PERGUNTA DO USUÁRIO                                        │
│  (texto ou voz — STT converte para texto primeiro)          │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────┐                                   │
│  │  1. Embedding da     │                                   │
│  │  pergunta (OpenAI)   │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  2. Busca vetorial   │                                   │
│  │  no PostgreSQL       │                                   │
│  │                      │                                   │
│  │  SELECT content      │                                   │
│  │  FROM doc_chunks     │                                   │
│  │  WHERE user_id = uid │                                   │
│  │  ORDER BY embedding  │                                   │
│  │  <=> query_vector    │                                   │
│  │  LIMIT 10            │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  3. Busca lexical    │                                   │
│  │  (FTS + pg_trgm)     │                                   │
│  │  para complementar   │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  4. Merge + Rerank   │                                   │
│  │  (combina vetorial   │                                   │
│  │   + lexical)         │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  5. Monta contexto   │                                   │
│  │  com trechos relevantes│                                 │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  6. Envia ao LLM     │                                   │
│  │  com system prompt + │                                   │
│  │  contexto + pergunta │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  RESPOSTA COM FONTES CITADAS                                │
│  (texto, e/ou voz via TTS)                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Decisões RAG

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **pgvector** | Pinecone, Weaviate, Qdrant | Sem serviço externo; mesmo PostgreSQL; RLS nativo |
| **HNSW index** | IVFFlat | Melhor performance em busca; mais estável |
| **Hybrid search (vetorial + FTS)** | Só vetorial | Complementa semântica com lexical; melhor recall |
| **Chunks no banco** | Chunks em cache | Persistência; RLS; busca semântica nativa |
| **Embedding model: text-embedding-3-small** | text-embedding-ada-002 | 60% mais barato; melhor performance |

---

## 10. Isolamento de Dados Multi-Tenant

```
┌──────────────────────────────────────────────────────────────┐
│              MULTI-TENANT VIA RLS (Row Level Security)       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TODAS as tabelas de dados têm:                        │  │
│  │                                                        │  │
│  │  1. Coluna user_id (UUID, NOT NULL)                    │  │
│  │  2. RLS habilitado (ALTER TABLE ... ENABLE ROW LEVEL   │  │
│  │     SECURITY)                                          │  │
│  │  3. Policy: USING (user_id = auth.uid())               │  │
│  │  4. WITH CHECK (user_id = auth.uid())                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  FLUXO:                                                      │
│                                                              │
│  Request → JWT (auth.uid()) → PostgreSQL → RLS Policy        │
│                                          → Retorna SOMENTE   │
│                                            dados do usuário  │
│                                                              │
│  EXEMPLO:                                                    │
│  SELECT * FROM documents;                                    │
│  → RLS filtra: WHERE user_id = auth.uid()                    │
│  → Usuário A NUNCA vê documentos do Usuário B               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Decisões Multi-Tenant

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **RLS (Row-Level Security)** | Schema per tenant; DB per tenant | Mais simples; custo zero; escala horizontal natural |
| **user_id em todas as tabelas** | Soft isolation via application | Garante isolamento mesmo com bugs no código |
| **auth.uid() no RLS** | Custom claims | Nativo do Supabase; sem configuração extra |
| **Edge Functions com JWT** | Service role key | Edge Functions herdam JWT do client; mantêm RLS |

---

## 11. Segurança

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                            │
│                                                              │
│  CAMADA 1: AUTENTicação                                     │
│  ├── Supabase Auth (JWT)                                    │
│  ├── Token refresh automático                               │
│  ├── Sessão expira em 1h (configurável)                     │
│  └── OAuth (Google) — senhas nunca no app                    │
│                                                              │
│  CAMADA 2: AUTORIZAÇÃO                                      │
│  ├── RLS em TODAS as tabelas                                │
│  ├── user_id em TODA query                                  │
│  ├── Edge Functions validam JWT antes de processar          │
│  └── Storage buckets com policies por usuário               │
│                                                              │
│  CAMADA 3: PROTEÇÃO DE DADOS                                │
│  ├── HTTPS obrigatório (Supabase default)                   │
│  ├── API keys NUNCA no frontend (só via Edge Functions)     │
│  ├── Dados sensíveis em Environment Variables               │
│  └── Sanitização de inputs (Zod validation)                 │
│                                                              │
│  CAMADA 4: AUDITORIA                                        │
│  ├── audit_logs em TODAS as operações escrita               │
│  ├── ai_interactions log (tokens, custo, latency)           │
│  ├── Login/logout tracked                                   │
│  └── IP + User-Agent em logs                                │
│                                                              │
│  CAMADA 5: MONITORAMENTO                                    │
│  ├── Supabase Dashboard (métricas)                          │
│  ├── Edge Function logs                                     │
│  ├── Error tracking (Sentry future)                         │
│  └── Rate limiting no ai-proxy                              │
│                                                              │
│  CAMADA 6: PRIVACIDADE DE VOZ                               │
│  ├── Áudio NÃO é persistido (streaming only)                │
│  ├── Gravações STT descartadas após transcrição             │
│  ├── TTS gerado via streaming, não salvo                    │
│  ├── Edge Functions não logam conteúdo de áudio             │
│  └── Usuário pode desabilitar voz a qualquer momento        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Decisões de Segurança

| Decisão | Alternativa | Justificativa |
|---|---|---|
| **RLS em todas as tabelas** | Só em tabelas sensíveis | Isolamento completo; defesa em profundidade |
| **API keys em Edge Functions** | No client via env vars | Keys ficam no server; jamais expostas ao browser |
| **Zod validation** | Yup, Joi | Tipagem TypeScript nativa; performance; type inference |
| **audit_logs com partitioning** | Tabela simples | Performance em escala; facilita cleanup antigo |
| **Rate limiting no proxy** | No client | Proteção real; client-side é bypassável |
| **Áudio não persistido** | Salvar temporariamente | Privacidade; LGPD; sem risco de vazamento |

---

## 12. Cache

```
┌──────────────────────────────────────────────────────────────┐
│                    CACHE STRATEGY                             │
│                                                              │
│  NÍVEL 1: CLIENTE (IndexedDB / Dexie.js)                    │
│  ├── Traduções por documento                                 │
│  ├── Preferências do usuário                                 │
│  ├── Drafts de fichamentos                                   │
│  └── Dados offline-first                                    │
│                                                              │
│  NÍVEL 2: SUPABASE (PostgreSQL Query Cache)                 │
│  ├── Queries frequentes (documentos, bibliotecas)           │
│  ├── PostgREST prepared statements                          │
│  └── Connections pooling (PgBouncer)                         │
│                                                              │
│  NÍVEL 3: CDN (Vercel / GitHub Pages)                       │
│  ├── Assets estáticos (JS, CSS, imagens)                    │
│  ├── Cache-Control headers                                  │
│  └── Immutable caching para bundles                         │
│                                                              │
│  NÃO-USO:                                                    │
│  ├── Redis (desnecessário no MVP)                           │
│  ├── Memcached (Supabase já gerencia connections)           │
│  └── Service Worker (complexidade demais no MVP)            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 13. Logs e Auditoria

| Evento | Tabela | O que loga |
|---|---|---|
| **CRUD qualquer** | `audit_logs` | user_id, action, entity, old/new values, IP, user_agent |
| **Login/Logout** | `audit_logs` | action: login/logout, provider, IP |
| **Chamada à IA** | `ai_interactions` | provider, model, tokens, latency, cost, status |
| **Upload de PDF** | `audit_logs` | action: upload, file_size, document_id |
| **Exportação** | `audit_logs` | action: export, format, fichamento_id |
| **Erro no Edge Function** | Edge Function logs | error message, stack, request body |
| **Requisição de voz** | `ai_interactions` | interaction_type: 'tts' ou 'stt', provider, latency |
| **Interrupção de leitura** | `audit_logs` | action: reading_interruption, document_id, page |

---

## 14. Tratamento de Erros

```
┌──────────────────────────────────────────────────────────────┐
│                 ERROR HANDLING STRATEGY                       │
│                                                              │
│  CLIENTE (React):                                           │
│  ├── Error Boundary por feature                             │
│  ├── Toast notifications (não intrusivas)                   │
│  ├── Fallback UI para estados de erro                       │
│  ├── Retry automático para requests de rede                 │
│  ├── Fallback de voz: se STT falha, oferece input de texto  │
│  ├── Fallback de TTS: se TTS falha, exibe só texto          │
│  └── Logging no console (dev) / Sentry (prod future)       │
│                                                              │
│  SUPABASE (RLS/DB):                                         │
│  ├── Erros retornam HTTP 403/404 genéricos (não expor schema)│
│  ├── RLS errors retornam "permission denied"                │
│  ├── Connection pool errors → retry com backoff             │
│  └── Query timeouts → 30s default                           │
│                                                              │
│  EDGE FUNCTIONS:                                            │
│  ├── Try/catch em toda function                             │
│  ├── Retornam { error: string, code: string }               │
│  ├── Logging estruturado (JSON)                             │
│  └── Timeout de 30s por function                            │
│                                                              │
│  AI PROVIDERS:                                              │
│  ├── Fallback entre provedores                              │
│  ├── Retry com exponential backoff (3 tentativas)           │
│  ├── Rate limit handling (429 → wait + retry)               │
│  └── Timeout de 60s por request                             │
│                                                              │
│  VOZ:                                                       │
│  ├── STT: se Web Speech API falha → Whisper API             │
│  ├── STT: se Whisper falha → input de texto                 │
│  ├── TTS: se OpenAI TTS falha → Web Speech API              │
│  ├── TTS: se Web Speech API falha → exibe só texto          │
│  ├── Gravação: se microfone negado → aviso + alternativa    │
│  └── Streaming: se conexão cai → reconecta automaticamente  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 15. Roadmap de Implementação

```
┌──────────────────────────────────────────────────────────────┐
│                   IMPLEMENTATION ROADMAP                      │
│                                                              │
│  SPRINT 1: FUNDAÇÃO                                         │
│  ├── Setup Vite + React 19 + TypeScript + Tailwind          │
│  ├── Configurar ShadCN UI                                   │
│  ├── Supabase client setup                                  │
│  ├── Auth (login, register, OAuth Google)                   │
│  ├── Protected routes                                       │
│  ├── Layout base (sidebar, header)                          │
│  ├── Migrations: profiles, auth, system_settings            │
│  └── ✅ Entrega: App com auth funcional                     │
│                                                              │
│  SPRINT 2: BIBLIOTECA + DOCUMENTOS                          │
│  ├── CRUD Bibliotecas                                       │
│  ├── Upload de PDFs (Supabase Storage)                      │
│  ├── Listagem e busca de documentos                         │
│  ├── Status de processamento                                │
│  ├── Migrations: libraries, documents, source_files         │
│  └── ✅ Entrega: Upload e gestão de documentos              │
│                                                              │
│  SPRINT 3: PROCESSAMENTO + RAG                              │
│  ├── Edge Function: process-document                        │
│  ├── Extração de texto do PDF                               │
│  ├── Chunking de documentos                                 │
│  ├── Geração de embeddings (OpenAI)                         │
│  ├── pgvector setup + HNSW index                            │
│  ├── Migrations: document_chunks, extensions                │
│  └── ✅ Entrega: Documentos processados e busca semântica   │
│                                                              │
│  SPRINT 4: LEITOR                                            │
│  ├── PDF Viewer (react-pdf ou pdf.js)                       │
│  ├── Progresso de leitura                                   │
│  ├── Marcadores (bookmarks)                                 │
│  ├── Sessões de leitura                                     │
│  ├── Migrations: reading_sessions, session_bookmarks        │
│  └── ✅ Entrega: Leitor funcional com progresso             │
│                                                              │
│  SPRINT 5: CHAT IA + RAG                                    │
│  ├── Edge Function: ai-proxy                                │
│  ├── Multi-provider adapter                                 │
│  ├── Chat contextual ao documento                           │
│  ├── RAG integration (busca semântica → contexto → LLM)     │
│  ├── Streaming de respostas                                 │
│  ├── Context Manager (preserva estado entre modalidades)    │
│  ├── Migrations: conversations, messages, ai_providers      │
│  └── ✅ Entrega: Chat IA com RAG funcional                  │
│                                                              │
│  SPRINT 6: VOZ (STT + TTS)                                  │
│  ├── Web Speech API integration (STT)                       │
│  ├── OpenAI TTS via Edge Function (tts-proxy)               │
│  ├── Voice UI (botão de microfone, visualizer)              │
│  ├── VoiceContext + VoiceStore                               │
│  ├── ModalityContext (alternância voz/texto)                 │
│  ├── Voice settings (velocidade, voz, idioma)               │
│  ├── Migrations: ai_providers (atualização)                 │
│  └── ✅ Entrega: Chat por voz funcional                     │
│                                                              │
│  SPRINT 7: LEITOR + VOZ (integração)                        │
│  ├── TTS durante leitura de PDF                              │
│  ├── Interrupção de leitura por voz/texto                    │
│  ├── Retomada de leitura após resposta                       │
│  ├── Integração InterruptionPanel no ReaderPage             │
│  ├── Context Manager no Reader                              │
│  ├── Edge Function: tts-proxy                               │
│  ├── Edge Function: stt-proxy                               │
│  └── ✅ Entrega: Leitura interrompível por voz/texto        │
│                                                              │
│  SPRINT 8: ANOTAÇÕES + FICHAMENTOS                          │
│  ├── Highlights e notes no leitor                           │
│  ├── Fichamentos inteligentes (AI-generated)                │
│  ├── Templates de fichamento                                │
│  ├── Fichamento hierárquico (sub-itens)                     │
│  ├── Migrations: annotations, fichamentos, attachments      │
│  └── ✅ Entrega: Anotações e fichamentos completos          │
│                                                              │
│  SPRINT 9: TRADUÇÃO                                          │
│  ├── Tradução via AI (streaming)                            │
│  ├── Cache local (Dexie.js)                                 │
│  ├── Migrations: nenhuma (cache local)                      │
│  └── ✅ Entrega: Tradução com cache local                   │
│                                                              │
│  SPRINT 10: CITAÇÕES + REFERÊNCIAS                          │
│  ├── Gerador de citações (ABNT, APA, etc.)                  │
│  ├── Gestão de referências bibliográficas                   │
│  ├── Import de BibTeX                                       │
│  ├── Migrations: citations, references                      │
│  └── ✅ Entrega: Citações e referências completas           │
│                                                              │
│  SPRINT 11: TESTES                                          │
│  ├── Unit tests (Vitest)                                    │
│  ├── Integration tests                                      │
│  ├── E2E tests (Playwright)                                 │
│  ├── Coverage report                                        │
│  └── ✅ Entrega: Suite de testes completa                   │
│                                                              │
│  SPRINT 12: DEPLOY + DOC                                    │
│  ├── GitHub Pages deploy                                    │
│  ├── CI/CD (GitHub Actions)                                 │
│  ├── README completo                                        │
│  ├── API documentation                                      │
│  ├── Security audit                                         │
│  ├── Performance audit (Lighthouse)                         │
│  └── ✅ Entrega: Produto em produção                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 16. Organização da Documentação

```
docs/
├── ARCHITECTURE.md          # Arquitetura geral (este documento)
├── DATABASE.md              # Modelagem do banco de dados
├── ROADMAP.md               # Roadmap de sprints
├── PROJECT_STATE.md         # Estado atual do projeto
├── SECURITY.md              # Diretrizes de segurança
├── API.md                   # Documentação de APIs/Edge Functions
├── DECISIONS.md             # Architecture Decision Records (ADR)
├── DEPLOY.md                # Guia de deploy e CI/CD
└── CONTRIBUTING.md          # Guia de contribuição
```

---

## Validação

> **Status:** Atualizada nas Sprints 1, 2 e 3  
> **Sprint 3:** Banco de dados e migrations implementados  
> **Cada sprint será apresentada para revisão antes de prosseguir**
