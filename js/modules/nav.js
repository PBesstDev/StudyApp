// Isolated Top Navigation Module
import { showModule } from '../app.js';

export function initNav() {
    const nav = document.getElementById('top-nav');
    nav.innerHTML = `
        <button data-module="notes">Take Notes</button>
        <button data-module="io">Download/Upload Notes</button>
        <button data-module="study">Study</button>
    `;
    nav.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            showModule(btn.dataset.module);
            nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    // Default active
    nav.querySelector('[data-module="notes"]').classList.add('active');
}
