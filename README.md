# Noesis

> Plataforma inteligente de apoio à pesquisa científica, baseada em Inteligência Artificial.

## Visão do Produto

O Noesis transforma a leitura de artigos científicos, livros e documentos em uma experiência interativa e contínua. Funciona como um assistente pessoal do pesquisador, permitindo:

- **Importar PDFs** e analisar automaticamente a estrutura
- **Conversar com IA** por voz ou texto durante a leitura
- **Interromper a leitura** a qualquer momento para fazer perguntas, mantendo o contexto
- **Gerar fichamentos inteligentes** e citações em padrões como ABNT
- **Traduzir** documentos de forma contextual (cache local)
- **Buscar semanticamente** em toda a biblioteca do usuário

## Público-Alvo

Estudantes de graduação e pós-graduação, professores e pesquisadores.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Estado** | Zustand (global), React Context (modalidade/voz) |
| **Notificações** | Sonner |
| **Roteamento** | React Router 7 (HashRouter para GitHub Pages) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Banco de dados** | PostgreSQL + pgvector (busca semântica) |
| **IA** | Multi-provider (OpenAI, Anthropic, Groq, Google AI, Ollama) |
| **Voz** | OpenAI TTS (primário), Web Speech API (fallback) |
| **Cache local** | IndexedDB via Dexie.js (traduções) |
| **Testes** | Vitest + Testing Library |
| **Lint/Format** | ESLint + Prettier |
| **Deploy** | GitHub Pages (inicial), preparado para cloud |
| **Documentação** | Português BR |

## Estrutura do Projeto

```
noesis/
├── docs/                    # Documentação técnica
├── src/
│   ├── config/              # Configurações globais
│   ├── core/                # Funcionalidades transversais
│   │   ├── auth/            # Autenticação
│   │   ├── lib/             # Utilitários
│   │   ├── types/           # Tipos compartilhados
│   │   └── ui/              # Componentes base
│   ├── features/            # Módulos de funcionalidades
│   │   └── auth/            # Autenticação (login, register, etc.)
│   ├── routes/              # Definição de rotas
│   ├── store/               # Estado global (Zustand)
│   └── styles/              # Estilos globais
├── tests/                   # Testes unitários
└── supabase/                # Migrations (Sprint 3+)
```

## Funcionalidades Multimodais

O Noesis suporta interação **voz + texto** em toda a experiência:

- **Chat com IA:** texto ou voz, resposta em texto ou voz
- **Leitura de PDF:** interrompa a leitura TTS a qualquer momento para perguntar
- **Alternância sem perda de contexto:** mude entre voz e texto livremente
- **Tradução:** voz + texto com cache local (IndexedDB)

## Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Iniciar desenvolvimento
npm run dev

# Rodar testes
npm run test

# Build para produção
npm run build
```

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md) — Arquitetura completa do sistema
- [Banco de Dados](docs/DATABASE.md) — Modelagem conceitual do banco
- [Convenções](docs/CONVENTIONS.md) — Padrões de desenvolvimento
- [Segurança](docs/SECURITY.md) — Diretrizes de segurança
- [Roadmap](docs/ROADMAP.md) — Sprints e fases de implementação
- [Estado do Projeto](docs/PROJECT_STATE.md) — Status atual

## Status

**Sprint atual:** Sprint 5 — Leitor de PDF ✅

Leitor de PDF completo com pdfjs-dist (canvas rendering), progresso de leitura, bookmarks, sessões de tracking, tabela de conteúdo, zoom e navegação. Rota `/reader/:id` fullscreen.

**Aguardando aprovação para iniciar Sprint 6 (Chat IA + RAG).**

**Nenhuma implementação é iniciada sem aprovação prévia da fase correspondente.**

## Licença

Proprietário — Todos os direitos reservados.
