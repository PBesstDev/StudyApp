# StudyApp (React Version)

Lightweight modular React flashcard study app.

## Features
- Persistent top navigation (Take Notes, Download/Upload Notes, Study)
- Isolated React components with separation of responsibility
- Subjects with fuzzy near-identical check
- Flashcards stored in localStorage, export/import as .json or .jsonl
- Non-blocking save/discard popups
- Study mode: random cards, click to flip, swipe buttons (left discard / right keep)
- Search with timing

## Setup
```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Structure
- src/components/Nav.jsx, Notes.jsx, IO.jsx, Study.jsx
- src/utils/storage.js
- src/App.jsx orchestrates module switching

Built with Vite + React. All client-side.
