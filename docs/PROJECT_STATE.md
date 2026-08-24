# Estado do Projeto — Noesis

> **Ultima atualizacao:** 2026-08-23
> **Status geral:** v1.0 — PWA funcional com upload, listagem e leitor de PDF.

---

## Resumo

| Item | Status |
|------|--------|
| PWA responsiva (HTML/CSS/JS) | ✅ Implementada |
| Auth (login/register) | ✅ Implementada |
| Upload de PDF | ✅ Implementado |
| Listagem de documentos | ✅ Implementada |
| Leitor PDF (split-screen) | ✅ Implementado |
| Chat flutuante | ✅ Implementado (placeholder) |
| Migrations | ✅ Aplicada |
| Testes unitarios | ✅ Criados |
| Documentacao | ✅ Criada |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript vanilla |
| PDF | pdf.js (CDN) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PWA | Service Worker + Manifest |

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `public/index.html` | Entry point |
| `public/css/main.css` | Estilos (tema escuro) |
| `public/js/config.js` | Configuracoes |
| `public/js/supabase.js` | Client Supabase |
| `public/js/utils.js` | Utilitarios |
| `public/js/router.js` | SPA router |
| `public/js/auth.js` | Autenticacao |
| `public/js/upload.js` | Upload de PDF |
| `public/js/documents.js` | Listagem de docs |
| `public/js/reader.js` | Leitor PDF |
| `public/js/app.js` | App entry |
| `public/sw.js` | Service Worker |
| `public/manifest.json` | PWA manifest |
| `supabase/migrations/00001_initial_schema.sql` | Schema do banco |
| `docs/ARCHITECTURE.md` | Arquitetura |
| `docs/DATABASE.md` | Schema documentado |
| `tests/unit/*.test.js` | Testes unitarios |

## Migrations

| # | Arquivo | Conteudo |
|---|---------|----------|
| 00001 | `initial_schema.sql` | profiles, documents, RLS, triggers, storage |

## Proximo Passo

- Integracao com IA (Edge Functions + LLM)
- Extracao de texto do PDF
- RAG (embeddings + busca semantica)
