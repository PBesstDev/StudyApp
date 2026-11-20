# StudyApp
Lightweight modular flashcard study application.

## Features
- Persistent top navigation bar (Take Notes, Download/Upload Notes, Study)
- Isolated modules with separation of responsibility
- Subject management with near-identical detection
- Flashcards stored as .jsonl / localStorage
- Non-intrusive save prompts
- Study mode with random cards, flip, swipe left/right, draggable search magnifier with timed binary tree search

## Usage
Open `index.html` in a modern web browser. All functionality is client-side.

## Modules
- `js/modules/nav.js` - Persistent navigation
- `js/modules/notes.js` - Take Notes
- `js/modules/io.js` - Download/Upload
- `js/modules/study.js` - Study session
- `js/utils/storage.js` - Data persistence
- `js/utils/search.js` - Binary search tree implementation
