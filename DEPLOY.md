# Deploy no Render — Castor Construtor

## URL da loja (produção)

O Static Site no Render foi criado com o nome **`https-castorconstrutor-onrender-com`**. A URL pública correta é:

**https://https-castorconstrutor-onrender-com.onrender.com**

> **Atenção:** `https://castorconstrutor-onrender-com.onrender.com` (sem o prefixo `https-`) **não existe** no Render e devolve **Not Found**.

Para um endereço mais limpo, use **Custom Domain** no painel do Static Site ou crie um novo Static Site com nome curto (ex. `castor-construtor`).

## Static Site (frontend)

| Campo | Valor |
|--------|--------|
| Build Command | `npm install && npm run build` |
| Publish directory | `dist` |
| Node | 22+ |

Variáveis de ambiente (opcional):

- `VITE_DEMO_DATA=true` — vitrine com dados de demonstração embutidos (sem depender da API para catálogo).
- `VITE_DEMO_DATA=false` — só dados reais; exige API + Postgres configurados.
- `VITE_API_BASE_URL` — URL pública do Web Service da API (sem `/` no final), se front e API estiverem em hosts diferentes.

### SPA (evitar 404 em rotas futuras)

No painel: **Redirects / Rewrites** → adicione:

| Action | Source | Destination |
|--------|--------|-------------|
| Rewrite | `/*` | `/index.html` |

## Web Service (API)

| Campo | Valor |
|--------|--------|
| Root Directory | `api` |
| Build | Docker ou `npm install` |
| Start | `npm start` (porta `3001` ou `PORT` do Render) |

Variáveis:

- `DATABASE_URL` — connection string do Postgres no Render.
- `DATABASE_SSL=true` — se o banco exigir SSL.

## Ligar front à API

**Opção A** — variável no Static Site:

```
VITE_API_BASE_URL=https://SEU-SERVICO-API.onrender.com
```

Redeploy com **Clear build cache**.

**Opção B** — rewrite no Static Site (sem variável no build):

| Action | Source | Destination |
|--------|--------|-------------|
| Rewrite | `/api/*` | `https://SEU-SERVICO-API.onrender.com/api/*` |

## Desenvolvimento local

```bash
npm run dev
```

Abre em **http://localhost:5173** (proxy `/api` → `http://127.0.0.1:3001`).
