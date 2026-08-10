# Tori — Home Inventory

Household-shared inventory app. Sibling to [Whisk](https://trywhisk.netlify.app).

**Live frontend:** [https://torihome.netlify.app](https://torihome.netlify.app)

## Stack

- Frontend: React + TypeScript + Vite + Zustand + SCSS → **Netlify**
- Backend: Express + TypeScript + Sequelize → **Heroku** (same as Whisk)
- Database: PostgreSQL → **Supabase** (Postgres host only)

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

## Deploy (Netlify + Heroku + Supabase)

You need all three. Netlify alone cannot run the Express API.

### 1. Supabase (database)

1. Create a free project
2. Copy the Postgres URI → use as `DATABASE_URL` on Heroku

### 2. Heroku (API)

From a machine with Heroku CLI logged in:

```bash
cd backend
heroku create YOUR-APP-NAME
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://torihome.netlify.app
heroku config:set JWT_SECRET='paste-from-local-backend-.env'
heroku config:set JWT_REFRESH_SECRET='paste-from-local-backend-.env'
heroku config:set DATABASE_URL='paste-supabase-uri'
heroku config:set EMAILJS_SERVICE_ID='…'
heroku config:set EMAILJS_TEMPLATE_ID_RESET='…'
heroku config:set EMAILJS_PUBLIC_KEY='…'
heroku config:set EMAILJS_PRIVATE_KEY='…'
git push heroku main:main
```

If the Git repo root is the monorepo (not `backend/`), deploy with:

```bash
# from repo root
heroku git:remote -a YOUR-APP-NAME
git subtree push --prefix backend heroku main
```

API URL will be: `https://YOUR-APP-NAME.herokuapp.com`  
Check: `https://YOUR-APP-NAME.herokuapp.com/api/health` → `{"ok":true}`

### 3. Netlify (frontend)

Build settings: branch `main`, base empty, `npm run build`, publish `dist`.

Env var:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-APP-NAME.herokuapp.com` |

Then deploy / redeploy.
