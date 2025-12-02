# Minimal Password Manager

A simple local web app for managing passwords. Features user sign up, login, logout, and CRUD for credentials (site, username, password, notes). No external services or APIs. All data is stored locally using SQLite.

## Features
- User sign up, login, logout
- Add, view, edit, and delete credentials
- Each credential: site, username, password, optional notes
- Minimal UI, all local

## Stack
- Backend: Node.js, Express, SQLite
- Frontend: Plain React (no build step)

## Setup & Run

### 1. Install dependencies

Open a terminal in the `server` folder and run:

```
npm install
```

Open a terminal in the `client` folder and run:

```
npm install react react-dom serve
```

### 2. Start the backend

In the `server` folder:

```
npm start
```

This starts the API server at http://localhost:npm4000

### 3. Start the frontend

In the `client` folder:

```
npm start
```

This serves the UI at http://localhost:3000

### 4. Use the app

- Open http://localhost:3000 in your browser.
- Sign up for a new account, then log in.
- Add, edit, or delete credentials.

## Notes
- All data is stored locally in `server/db.sqlite`.
- No password recovery or advanced security features—this is a minimal demo.
- For local/demo use only.
