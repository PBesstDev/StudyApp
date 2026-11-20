// Isolated Study Module
import { loadSubjects, getSubjectCards } from '../utils/storage.js';
import { buildBST } from '../utils/search.js';

let studyPile = [];
let currentCard = null;
let testMode = 'keywords'; // or 'definitions'
let isFlipped = false;

export function initStudy() {
    const section = document.getElementById('study-module');
    section.innerHTML = `
        <h2>Study</h2>
        <div>
            <select id="study-subject"></select>
            <label><input type="radio" name="mode" value="keywords" checked> Test Keywords</label>
            <label><input type="radio" name="mode" value="definitions"> Test Definitions</label>
            <button id="start-study">Start Study</button>
        </div>
        <div id="study-area" style="position: relative; min-height: 300px;">
            <div id="flashcard-display" class="flashcard" style="display:none;"></div>
            <div id="magnifier" class="magnifier">🔍</div>
        </div>
        <div id="search-popup" class="search-popup" style="display:none;">
            <input type="text" id="search-input" placeholder="Search keywords or notes">
            <button id="do-search">Search</button>
            <div id="search-result"></div>
            <div id="search-time"></div>
        </div>
    `;

    populateSubjects();
    document.getElementById('start-study').addEventListener('click', startStudySession);
    document.getElementById('flashcard-display').addEventListener('click', flipCard);
    // Swipe simulation with buttons for demo (full touch later)
    // Magnifier drag
    makeDraggable(document.getElementById('magnifier'));
    document.getElementById('magnifier').addEventListener('click', toggleSearch);
    document.getElementById('do-search').addEventListener('click', performSearch);
}

function populateSubjects() {
    const subjects = loadSubjects();
    const select = document.getElementById('study-subject');
    select.innerHTML = '<option value="">-- Select subject --</option>' +
        Object.keys(subjects).map(s => `<option value="${s}">${s}</option>`).join('');
}

function startStudySession() {
    const subject = document.getElementById('study-subject').value;
    if (!subject) return alert('Select subject');
    testMode = document.querySelector('input[name="mode"]:checked').value;
    studyPile = [...getSubjectCards(subject)];
    if (!studyPile.length) return alert('No cards');
    showNextCard();
    document.getElementById('flashcard-display').style.display = 'block';
}

function showNextCard() {
    if (!studyPile.length) {
        document.getElementById('flashcard-display').textContent = 'Study pile empty!';
        return;
    }
    const idx = Math.floor(Math.random() * studyPile.length);
    currentCard = studyPile[idx];
    isFlipped = false;
    displayCardContent();
}

function displayCardContent() {
    const display = document.getElementById('flashcard-display');
    if (testMode === 'keywords') {
        display.textContent = isFlipped ? currentCard.keyword : currentCard.notes;
    } else {
        display.textContent = isFlipped ? currentCard.notes : currentCard.keyword;
    }
}

function flipCard() {
    isFlipped = !isFlipped;
    displayCardContent();
}

// Simple swipe simulation - in real, use touch events
document.addEventListener('keydown', (e) => {
    if (document.getElementById('study-module').style.display === 'none') return;
    if (e.key === 'ArrowLeft') discardCard();
    if (e.key === 'ArrowRight') keepCard();
});

function discardCard() {
    studyPile = studyPile.filter(c => c !== currentCard);
    showNextCard();
}

function keepCard() {
    // Keep in pile, just next
    showNextCard();
}

function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function toggleSearch() {
    const popup = document.getElementById('search-popup');
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) return;
    const bst = buildBST(studyPile);
    const start = performance.now();
    const found = bst.search(query);
    const time = (performance.now() - start).toFixed(2);
    const resultDiv = document.getElementById('search-result');
    const timeDiv = document.getElementById('search-time');
    if (found) {
        resultDiv.textContent = `Found: ${found.keyword} - ${found.notes.substring(0, 50)}...`;
    } else {
        resultDiv.textContent = 'Nothing found';
    }
    timeDiv.textContent = `Binary tree search took ${time} ms`;
}
