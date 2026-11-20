export const STORAGE_KEY = 'studyAppData';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { subjects: {} };
  } catch {
    return { subjects: {} };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSubjects() {
  return Object.keys(loadData().subjects);
}

export function getCards(subject) {
  const data = loadData();
  return data.subjects[subject] || [];
}

export function setCards(subject, cards) {
  const data = loadData();
  if (!data.subjects) data.subjects = {};
  data.subjects[subject] = cards;
  saveData(data);
}

export function fuzzyFindSubject(input) {
  const data = loadData();
  const lower = input.toLowerCase().trim();
  for (const sub of Object.keys(data.subjects)) {
    if (sub.toLowerCase() === lower || sub.toLowerCase().includes(lower) || lower.includes(sub.toLowerCase())) {
      return sub;
    }
  }
  return null;
}

export function exportToJSONL(subject) {
  const cards = getCards(subject);
  return cards.map(c => JSON.stringify({ subject, keyword: c.keyword || '', notes: c.notes || '' })).join('\n');
}

export function parseJSONL(text) {
  const cards = [];
  text.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const obj = JSON.parse(trimmed);
      cards.push({ keyword: obj.keyword || '', notes: obj.notes || '' });
    } catch {}
  });
  return cards;
}
