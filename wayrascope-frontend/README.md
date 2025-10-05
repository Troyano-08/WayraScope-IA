# WayraScope AI – Frontend

SPA construida con React 18, Vite y TypeScript para consumir el backend FastAPI de WayraScope AI.

## Requisitos
- Node.js 18+
- Backend corriendo en `http://127.0.0.1:8000`

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Producción
```bash
npm run build
```

## Lint
```bash
npm run lint
```

## Stack principal
- React 18 + Vite + TypeScript
- TailwindCSS
- Zustand
- Axios
- Recharts
- react-i18next + i18next
- react-leaflet + Leaflet
- date-fns
- lucide-react

Scripts utilizados para generar la base del proyecto:
```bash
npm create vite@latest wayrascope-frontend -- --template react-ts
npm install
npm install tailwindcss postcss autoprefixer clsx axios zustand recharts lucide-react date-fns react-i18next i18next react-leaflet leaflet
npx tailwindcss init -p
```

Configura `.env` (ver `.env.example`) con `VITE_API_BASE_URL` si necesitas apuntar a otra URL.
