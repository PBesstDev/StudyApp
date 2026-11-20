# StudyApp

Lightweight modular study application for taking notes (flashcards), downloading/uploading subjects as JSON/JSONL, and studying with swipe and search.

## Features
- Persistent top navigation
- Take Notes: subjects with fuzzy match, flashcards, dirty state handling
- Download/Upload: JSON/JSONL with validation and merge
- Study: random cards, flip, swipe left/right, draggable search with timed BST

## Run
Open `index.html` in a modern browser. Data stored in localStorage. Export/import via the Download/Upload module.

## Architecture
Separation of responsibility:
- `js/modules/nav.js`
- `js/modules/notes.js`
- `js/modules/io.js`
- `js/modules/study.js`
- `js/utils/storage.js`
- `js/utils/search.js`
- `js/app.js` orchestrator

Limited scope per module.
