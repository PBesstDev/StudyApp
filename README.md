# StudyApp (React)

Lightweight modular StudyApp converted to React (Vite).

## Features
- Persistent top navigation (isolated Nav component)
- Take Notes: subjects with fuzzy match, flashcards, dirty-state non-blocking popups
- Download/Upload: JSON / JSONL with validation and merge
- Study: random cards, flip, swipe left/right, draggable magnifier with timed BST search

## Run
```bash
npm install
npm run dev
```

Data stored in localStorage. Export/import via the Download/Upload module.

## Architecture
Separation of responsibility via React components and utils:
- `src/components/Nav.jsx`
- `src/components/Notes.jsx`
- `src/components/IO.jsx`
- `src/components/Study.jsx`
- `src/utils/storage.js`
- `src/utils/search.js`
- `src/App.jsx` orchestrator
