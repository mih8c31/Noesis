# Arquitetura — Noesis

## Visao Geral

Noesis e uma PWA (Progressive Web App) que funciona como leitor de PDF com interacao via IA. A aplicacao e 100% client-side, servida como arquivos estaticos, com backend no Supabase.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript vanilla |
| PDF Viewer | pdf.js (via CDN) |
| Auth | Supabase Auth (email/senha) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (bucket `documents`) |
| PWA | Service Worker + Web App Manifest |

## Fluxo de Dados

```
Usuario -> HTML/CSS/JS -> Supabase REST API -> PostgreSQL
                   |
                   +-> Supabase Storage (PDF files)
                   |
                   +-> pdf.js (rendering client-side)
```

## Arquitetura de Modulos JS

```
config.js        -> Constantes (URL Supabase, limits)
supabase.js      -> Client HTTP para Supabase (Auth + REST + Storage)
utils.js         -> Funcoes utilitarias (format, validation, DOM)
router.js        -> SPA router baseado em hash (#/path)
auth.js          -> Login/Register (UI + logica)
upload.js        -> Upload de PDF para Supabase
documents.js     -> Listagem e gestao de documentos
reader.js        -> Leitor PDF split-screen + chat
app.js           -> Inicializacao e wiring do router
```

## Telas

### 1. Auth (`#/login`)
- Login com email/senha
- Registro com nome/email/senha
- Redirect para dashboard apos auth

### 2. Dashboard (`#/dashboard`)
- Lista de documentos do usuario
- Upload via drag-and-drop ou file picker
- Clique no documento abre o leitor

### 3. Reader (`#/reader/:id`)
- Layout split-screen:
  - **Esquerda:** PDF viewer (pdf.js canvas)
  - **Direita:** Painel de interacao (respostas da IA)
  - **Rodape:** Chat flutuante (input + envio)
- Navegacao por paginas (setas, teclado)
- Zoom in/out

## Seguranca

- RLS (Row Level Security) em todas as tabelas
- Usuarios so veem/editam seus proprios dados
- Storage bucket privado por usuario (`userId/docId/file.pdf`)
- Anon key exposta no frontend (Supabase padrao)
- Service role key NUNCA no frontend
