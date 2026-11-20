// Isolated Download/Upload Notes Module
import { loadSubjects, getSubjectCards, saveSubjectCards, exportJSONL, importJSONL } from '../utils/storage.js';

export function initIO() {
    const section = document.getElementById('io-module');
    section.innerHTML = `
        <h2>Download / Upload Notes</h2>
        <div>
            <h3>Download</h3>
            <select id="download-subject"></select>
            <button id="download-json">Download as JSON</button>
            <button id="download-jsonl">Download as JSONL</button>
            <div id="preview-window" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        <div>
            <h3>Upload</h3>
            <input type="file" id="upload-file" accept=".json,.jsonl">
            <input type="text" id="upload-subject" placeholder="Study subject for upload">
            <button id="upload-btn">Upload</button>
            <div id="upload-status"></div>
        </div>
    `;

    populateDownloadSubjects();
    document.getElementById('download-subject').addEventListener('change', showPreview);
    document.getElementById('download-json').addEventListener('click', () => download('json'));
    document.getElementById('download-jsonl').addEventListener('click', () => download('jsonl'));
    document.getElementById('upload-btn').addEventListener('click', handleUpload);
}

function populateDownloadSubjects() {
    const subjects = loadSubjects();
    const select = document.getElementById('download-subject');
    select.innerHTML = '<option value="">-- Select subject --</option>' +
        Object.keys(subjects).map(s => `<option value="${s}">${s}</option>`).join('');
}

function showPreview() {
    const subject = document.getElementById('download-subject').value;
    const preview = document.getElementById('preview-window');
    if (!subject) {
        preview.innerHTML = '';
        return;
    }
    const cards = getSubjectCards(subject);
    preview.innerHTML = cards.map((c, i) => `<div class="preview-item" data-index="${i}">${c.keyword || '(empty)'}</div>`).join('');
    preview.querySelectorAll('.preview-item').forEach(item => {
        item.addEventListener('click', () => {
            // Switch to notes and load this card - simplified
            alert(`Selected: ${item.textContent} (would open in Take Notes for edit/delete)`);
        });
    });
}

function download(format) {
    const subject = document.getElementById('download-subject').value;
    if (!subject) return alert('Select a subject');
    const cards = getSubjectCards(subject);
    let content, filename, type;
    if (format === 'jsonl') {
        content = exportJSONL(subject);
        filename = `${subject}.jsonl`;
        type = 'application/jsonl';
    } else {
        content = JSON.stringify({ subject, cards }, null, 2);
        filename = `${subject}.json`;
        type = 'application/json';
    }
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

function handleUpload() {
    const fileInput = document.getElementById('upload-file');
    const subjectInput = document.getElementById('upload-subject').value.trim();
    const status = document.getElementById('upload-status');
    if (!fileInput.files.length || !subjectInput) {
        status.textContent = 'Select file and enter subject';
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let cards = [];
            if (file.name.endsWith('.jsonl')) {
                cards = importJSONL(e.target.result);
            } else if (file.name.endsWith('.json')) {
                const data = JSON.parse(e.target.result);
                cards = data.cards || [];
            } else {
                throw new Error('Invalid file type');
            }
            if (!cards.length) throw new Error('No valid cards found');
            const existing = getSubjectCards(subjectInput);
            if (existing.length > 0) {
                if (confirm(`Subject "${subjectInput}" exists. Merge cards?`)) {
                    cards = [...existing, ...cards];
                }
            }
            saveSubjectCards(subjectInput, cards);
            status.textContent = `Uploaded ${cards.length} cards successfully`;
            populateDownloadSubjects();
        } catch (err) {
            status.textContent = `Error: ${err.message}`;
        }
    };
    reader.readAsText(file);
}
