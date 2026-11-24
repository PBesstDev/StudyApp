# StudyApp Server

Lightweight modular PostgreSQL-backed server for StudyApp.

Matches the style of the React frontend: modular, minimal, good error handling.

## Features

- User registration and login (JWT)
- Upload/download notes as JSON or JSONL per subject
- Search keywords/phrases across cards, returns subject + card
- Per-user data isolation

## Setup

1. Create a PostgreSQL database
2. Copy `.env.example` to `.env` and set values
3. `npm install`
4. `npm start`

## API

- `POST /api/auth/register` `{username, password}` → `{token, user}`
- `POST /api/auth/login` `{username, password}` → `{token, user}`
- `POST /api/notes/upload` (Bearer token, multipart file or body `{subject, cards}`) 
- `GET /api/notes/download/:subject?format=json|jsonl` (auth)
- `GET /api/notes/subjects` (auth)
- `GET /api/notes/search?q=query` (auth) → array of `{subject, keyword, notes}`

## Structure

- `server.js` - entry
- `db/db.js` - pool + schema
- `middleware/auth.js` - JWT
- `routes/auth.js` - register/login
- `routes/notes.js` - upload/download/search

Data model mirrors frontend: subjects → cards[{keyword, notes}]
