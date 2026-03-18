# Capstone API (Express backend)

Replacement for Firebase: auth + user/folder/item data. Use this backend with the capstone-client by pointing the client at `http://localhost:3001` (or your `PORT`) and using the API below.

## Setup

```bash
cp .env.example .env
# Edit .env: set JWT_SECRET for production
npm install
npm run dev
```

Server runs at `http://localhost:3001` (or `PORT` from `.env`).

## Auth (replaces Firebase Auth)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ email, password, fullName }` | `{ user: { uid, email, displayName }, token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user: { uid, email, displayName }, token }` |
| GET | `/api/auth/me` | — | Header: `Authorization: Bearer <token>`. Returns `{ user: { uid, email, displayName } }` |

**Client usage:** After login/register, store `token` (e.g. localStorage). Send `Authorization: Bearer <token>` on every request. Use `GET /api/auth/me` on app load to restore `currentUser` (same shape as Firebase: `{ uid, email, displayName }`).

## Users (profile, replaces Firebase RTDB `users/:uid`)

All require `Authorization: Bearer <token>`. `:userId` must equal the authenticated user’s `uid`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/:userId` | Create/overwrite profile (e.g. after register). Body: `{ displayName?, created_at?, updated_at?, ... }` |
| GET | `/api/users/:userId` | Get user profile |
| PATCH | `/api/users/:userId` | Update profile |
| DELETE | `/api/users/:userId` | Delete user and data |

## Folders (replaces Firebase `users/:uid/folders`)

All require `Authorization: Bearer <token>` and `:userId` = auth uid.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:userId/folders` | List folders (array of `{ id, name, type, creationDate, customTag, created_at, updated_at }`) |
| POST | `/api/users/:userId/folders` | Create folder. Body: `{ name, type, creationDate?, customTag? }` |
| PATCH | `/api/users/:userId/folders/:folderId` | Update folder |
| DELETE | `/api/users/:userId/folders/:folderId` | Delete folder (and its items) |

## Items (replaces Firebase `users/:uid/items` and `users/:uid/folders/:fid/items`)

All require `Authorization: Bearer <token>` and `:userId` = auth uid.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:userId/items` | All items (root + in folders), same array shape as `firebaseService.fetchItems()` |
| POST | `/api/users/:userId/items` | Create item. Body: `{ name, location?, purchaseDate?, quantity?, expirationDate?, customTag?, folderId? }` |
| PATCH | `/api/users/:userId/items/:itemId` | Update item (and optionally move). Body: `{ folderId?, currentFolderId?, name?, ... }` |
| DELETE | `/api/users/:userId/items/:itemId?folderId=...` | Delete item. Use query `folderId` if item is inside a folder. |

## Mapping from Firebase client code

- **Auth:** Replace `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` with `POST /api/auth/register` and `POST /api/auth/login`. Store `token`; use `GET /api/auth/me` for “current user” (like `onAuthStateChanged`).
- **firebaseService.js:** Replace with a small API client that calls the routes above with `Authorization: Bearer <token>` and maps responses to the same shapes (e.g. `fetchUser` → `GET /api/users/:userId`, `fetchFolders` → `GET /api/users/:userId/folders`, etc.).
- **useFetchFolders real-time:** Firebase `onValue` is real-time; this API is request/response. Options: poll `GET /api/users/:userId/folders` on an interval, or add WebSockets/SSE later.

Data is stored in memory; restart clears it. Replace `server/src/store.js` with a real DB when ready.
