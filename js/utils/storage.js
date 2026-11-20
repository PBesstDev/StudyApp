// Shared storage utility - limited scope
const STORAGE_KEY = 'studyAppSubjects';

export function loadSubjects() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Load error', e);
        return {};
    }
}

export function saveSubjects(subjects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

export function getSubjectCards(subject) {
    const subjects = loadSubjects();
    return subjects[subject] || [];
}

export function saveSubjectCards(subject, cards) {
    const subjects = loadSubjects();
    subjects[subject] = cards;
    saveSubjects(subjects);
}

export function fuzzyMatch(subjectInput, subjects) {
    const lower = subjectInput.toLowerCase().trim();
    for (const existing of Object.keys(subjects)) {
        if (existing.toLowerCase() === lower || existing.toLowerCase().includes(lower) || lower.includes(existing.toLowerCase())) {
            return existing;
        }
    }
    return null;
}

export function exportJSONL(subject) {
    const cards = getSubjectCards(subject);
    return cards.map(card => JSON.stringify({ subject, keyword: card.keyword, notes: card.notes })).join('\n');
}

export function importJSONL(text) {
    const lines = text.trim().split('\n').filter(Boolean);
    const cards = [];
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.keyword !== undefined && parsed.notes !== undefined) {
                cards.push({ keyword: parsed.keyword, notes: parsed.notes });
            }
        } catch (e) {
            console.warn('Invalid line', line);
        }
    }
    return cards;
}
