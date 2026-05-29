# Personal Finance — Frontend

React SPA built with **Vite**, **React Router**, and **Tailwind CSS**.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set VITE_API_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (no trailing slash), e.g. `http://localhost:5197` |
| `VITE_APP_URL` | App origin (optional) |
| `VITE_APP_NAME` | App title (optional) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and production build → `dist/` |
| `npm run preview` | Preview production build |

## Routing & i18n

- Routes are prefixed by locale: `/en/...`, `/vi/...`
- Translations: `react-i18next` (`src/i18n/en.json`, `vi.json`)
- Auth is handled on the client (`DashboardAuthGate`, `SessionManager`)
