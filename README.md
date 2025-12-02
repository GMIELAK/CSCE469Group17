# Very Basic Password Manager (Local)

A minimal web app for storing website credentials locally on your machine. Includes sign up, log in, log out, and CRUD for credentials (site, username, password, notes). No external services.

## Features
- Sign up, log in, and log out (session-based)
- Single-page app after login
- List credentials in a table
- Add, edit (inline), and delete credentials
- Local, file-based persistence using `nedb-promises` (two files: `users.db`, `credentials.db`)

## Quick Start (Windows PowerShell)
1. Install Node.js (v18 or newer recommended): https://nodejs.org/
2. In a PowerShell terminal, run from the project root:

```powershell
npm install
npm start
```

3. Open http://localhost:3000 in your browser.

- Stop the server with `Ctrl + C` in the terminal.
- For live-reload during development:

```powershell
npm run dev
```

## Project Structure
- `server.js` – Express server, auth and CRUD APIs, static hosting
- `db.js` – Simple file-backed database using NeDB (users and credentials)
- `public/` – Frontend files
  - `index.html` – Login & sign up
  - `app.html` – Main credentials UI
  - `app.js` – Minimal frontend logic for fetching and inline edit/delete
  - `styles.css` – Minimal styling
- `data/` – Created at runtime for database files (`users.db`, `credentials.db`)

## Environment
- `PORT` – Optional. Default is `3000`.

Set it in PowerShell like this if desired:

```powershell
$env:PORT = 4000; npm start
```

## Notes & Limitations
- For demo/education use only. Not production-ready.
- Passwords are stored in plain text in the local database to keep the example simple.
  - Do NOT store real passwords.
  - A production app should encrypt secrets at rest and in transit.
- Sessions use in-memory store; logging out or server restarts will clear sessions.
- All data stays local on your machine; no external APIs/services.

## API Overview (for reference)
- `POST /api/signup` – body: `{ username, password }`
- `POST /api/login` – body: `{ username, password }`
- `POST /api/logout`
- `GET /api/credentials`
- `POST /api/credentials` – body: `{ site, username, password, notes? }`
- `PUT /api/credentials/:id` – body: `{ site, username, password, notes? }`
- `DELETE /api/credentials/:id`
