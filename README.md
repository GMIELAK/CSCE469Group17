# CSCE469Group17 — Local Vault

This project is intended to run locally. The README defaults to PostgreSQL.

## 1) Backend — install dependencies

```powershell
cd local-vault/backend
npm install
```

## 2) Configure the DB (Postgres — recommended)

Create `local-vault/backend/.env` with this content (update user/password/host/port as needed):

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/local_vault?schema=public"
JWT_SECRET="a_key"
```

## 3) Database

 The backend uses a small file-backed JSON store by default so you don't need Postgres to develop.


## 4) Start the backend

```powershell
npm run dev
```

Open http://localhost:3000 to verify the server is running.

## 5) Frontend — install and start

In a new terminal:

```powershell
cd local-vault/frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Which would you like me to do next?
