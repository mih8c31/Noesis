# Noesis

Plataforma de pesquisa cientifica com IA.

## Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **PDF Viewer:** pdf.js
- **PWA:** Service Worker + Manifest

## Como rodar

```bash
# Servidor local (qualquer servidor estatico)
npx serve public
# ou
python -m http.server 8000 --directory public
```

## Estrutura

```
Noesis/
├── public/               # App frontend (servido estaticamente)
│   ├── index.html        # Entry point
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   ├── css/              # Estilos
│   ├── js/               # Modulos JS
│   └── icons/            # Icones PWA
├── supabase/
│   └── migrations/       # SQL migrations
├── docs/                 # Documentacao
├── tests/                # Testes unitarios
└── package.json          # Dev dependencies (vitest)
```

## Desenvolvimento

```bash
npm install
npm test
```

## Deploy

A pasta `public/` pode ser servida por qualquer static host:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
