# Tori: Home Inventory

Household-shared inventory app. Sibling to [Whisk](https://trywhisk.netlify.app).

**Live frontend:** [https://torihome.netlify.app](https://torihome.netlify.app)

## Stack

- Frontend: React + TypeScript + Vite + Zustand + SCSS → **Netlify**
- Backend + Postgres: Express + Sequelize → **Heroku** + **Heroku Postgres**

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

## Deploy (Netlify + Heroku + Heroku Postgres)

Netlify = site. Heroku = API + database. No Supabase.

### 1. Heroku app + Postgres

```bash
cd backend
heroku login
heroku create YOUR-APP-NAME
heroku addons:create heroku-postgresql:essential-0
# DATABASE_URL is set automatically by the addon
```

(`essential-0` is the current small paid plan name; use whatever Mini/Essential plan Heroku shows if that slug differs.)

### 2. Heroku config vars

```bash
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://torihome.netlify.app
heroku config:set JWT_SECRET='paste-from-local-backend-.env'
heroku config:set JWT_REFRESH_SECRET='paste-from-local-backend-.env'
heroku config:set EMAILJS_SERVICE_ID='…'
heroku config:set EMAILJS_TEMPLATE_ID_RESET='…'
heroku config:set EMAILJS_PUBLIC_KEY='…'
heroku config:set EMAILJS_PRIVATE_KEY='…'
```

Do **not** set `DATABASE_URL` yourself; the Postgres addon already did.

### 3. Deploy API

From **repo root** (monorepo):

```bash
heroku git:remote -a YOUR-APP-NAME
git subtree push --prefix backend heroku main
```

Check: `https://YOUR-APP-NAME.herokuapp.com/api/health` → `{"ok":true}`  
(Tables are created on boot via Sequelize sync.)

### 4. Netlify

Build: `main`, empty base, `npm run build`, publish `dist`.

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-APP-NAME.herokuapp.com` |

Deploy / redeploy.
