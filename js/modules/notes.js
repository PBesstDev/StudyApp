// Isolated Take Notes Module
import { loadSubjects, saveSubjectCards, getSubjectCards, fuzzyMatch } from '../utils/storage.js';
import { showModule } from '../app.js';

let currentSubject = '';
let cards = [];
let currentIndex = -1;
let isDirty = false;

export function initNotes() {
    const section = document.getElementById('notes-module');
    section.innerHTML = `
        <h2>Take Notes</h2>
        <div>
            <label>Study Subject:</label>
            <input type="text" id="subject-input" placeholder="e.g. Math or Biology">
            <button id="set-subject">Set Subject</button>
            <select id="subject-select" style="display:none;"></select>
        </div>
        <div id="card-editor" style="display:none;">
            <div class="flashcard">
                <input type="text" id="keyword" placeholder="Keyword / Key Phrase">
                <textarea id="notes" placeholder="Associated notes / text" rows="5"></textarea>
            </div>
            <button id="prev-card">Prev</button>
            <button id="next-card">Next</button>
            <button id="new-card">New Card</button>
            <button id="clear-card">Clear</button>
            <button id="save-card">Save</button>
            <span id="card-status"></span>
        </div>
    `;

    document.getElementById('set-subject').addEventListener('click', handleSetSubject);
    document.getElementById('prev-card').addEventListener('click', () => navigateCard(-1));
    document.getElementById('next-card').addEventListener('click', () => navigateCard(1));
    document.getElementById('new-card').addEventListener('click', createNewCard);
    document.getElementById('clear-card').addEventListener('click', clearCard);
    document.getElementById('save-card').addEventListener('click', saveCurrentCard);

    // Dirty tracking
    document.getElementById('keyword').addEventListener('input', () => isDirty = true);
    document.getElementById('notes').addEventListener('input', () => isDirty = true);

    loadExistingSubjects();
}

function loadExistingSubjects() {
    const subjects = loadSubjects();
    const select = document.getElementById('subject-select');
    if (Object.keys(subjects).length > 0) {
        select.style.display = 'inline';
        select.innerHTML = '<option value="">-- Select existing --</option>' + 
            Object.keys(subjects).map(s => `<option value="${s}">${s}</option>`).join('');
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                currentSubject = e.target.value;
                document.getElementById('subject-input').value = currentSubject;
                loadCards();
            }
        });
    }
}

function handleSetSubject() {
    const input = document.getElementById('subject-input').value.trim();
    if (!input) return;
    const subjects = loadSubjects();
    const match = fuzzyMatch(input, subjects);
    if (match && match !== input) {
        if (confirm(`Near-identical subject "${match}" exists. Use existing? (OK) or create new (Cancel)`)) {
            currentSubject = match;
        } else {
            currentSubject = input;
        }
    } else {
        currentSubject = input;
    }
    loadCards();
    document.getElementById('card-editor').style.display = 'block';
}

function loadCards() {
    cards = getSubjectCards(currentSubject);
    currentIndex = cards.length > 0 ? 0 : -1;
    isDirty = false;
    displayCard();
}

function displayCard() {
    if (currentIndex >= 0 && currentIndex < cards.length) {
        document.getElementById('keyword').value = cards[currentIndex].keyword || '';
        document.getElementById('notes').value = cards[currentIndex].notes || '';
        document.getElementById('card-status').textContent = `Card ${currentIndex + 1} of ${cards.length}`;
    } else {
        document.getElementById('keyword').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('card-status').textContent = 'New card';
    }
    isDirty = false;
}

function navigateCard(delta) {
    if (isDirty) {
        if (!confirm('Unsaved changes. Save? (OK) or Discard (Cancel)')) {
            // discard
        } else {
            saveCurrentCard();
        }
    }
    currentIndex += delta;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= cards.length) currentIndex = cards.length - 1;
    displayCard();
}

function createNewCard() {
    if (isDirty) {
        if (confirm('Save changes before new card?')) saveCurrentCard();
    }
    currentIndex = cards.length;
    cards.push({ keyword: '', notes: '' });
    displayCard();
}

function clearCard() {
    document.getElementById('keyword').value = '';
    document.getElementById('notes').value = '';
    isDirty = true;
}

function saveCurrentCard() {
    const keyword = document.getElementById('keyword').value.trim();
    const notes = document.getElementById('notes').value.trim();
    if (currentIndex >= 0 && currentIndex < cards.length) {
        cards[currentIndex] = { keyword, notes };
    } else {
        cards.push({ keyword, notes });
        currentIndex = cards.length - 1;
    }
    saveSubjectCards(currentSubject, cards);
    isDirty = false;
    document.getElementById('card-status').textContent = 'Saved!';
}
