# Tori — Home Inventory

Household-shared inventory app. Sibling to [Whisk](https://trywhisk.netlify.app).

## Stack

- Frontend: React + TypeScript + Vite + Zustand + SCSS
- Backend: Express + TypeScript + Sequelize + Postgres + Zod (`backend/`)
- Auth: JWT access + rotating refresh tokens

## Local setup

```bash
createdb tori
cd backend && cp .env.example .env && npm install && npm run db:sync && npm run dev
```

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Tests

```bash
npm test
cd backend && npm test
```

## Deploy

Production frontend: [https://torihome.netlify.app](https://torihome.netlify.app)

1. **Supabase** — Postgres only → `DATABASE_URL` on the API
2. **Render** — Web Service from `backend/` (`npm run build` / `npm start`); set JWT secrets, `FRONTEND_URL=https://torihome.netlify.app`, EmailJS + Cloudinary as needed; run `npm run db:sync` once
3. **Netlify** — this repo root (`netlify.toml`); set **`VITE_API_URL`** to the Render origin (no trailing slash) and redeploy when it changes. Optional: `VITE_WHISK_URL`
