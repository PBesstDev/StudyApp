// Main app orchestrator
import { initNav } from './modules/nav.js';
import { initNotes } from './modules/notes.js';
import { initIO } from './modules/io.js';
import { initStudy } from './modules/study.js';

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initNotes();
    initIO();
    initStudy();
    // Default to notes
    showModule('notes');
});

export function showModule(name) {
    document.querySelectorAll('.module').forEach(m => m.style.display = 'none');
    const mod = document.getElementById(`${name}-module`);
    if (mod) mod.style.display = 'block';
    // Update nav active state handled in nav module
}
