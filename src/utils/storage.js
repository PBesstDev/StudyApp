const STORAGE_KEY = 'studyAppSubjects';

// Load subjects from local storage, or return an empty object if loading fails
export function loadSubjects() {
  try {
    // Create a scoped constant containing the stored subjects
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    // Report the storage error and return an empty subject list
    console.error('Load error', e);
    return {};
  }
}

// Save subjects to local storage
export function saveSubjects(subjects) {
  // Serialize the subjects and save them to local storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

// Get cards for a specific subject from local storage
export function getSubjectCards(subject) {
  // Create scoped constants for the subjects and requested subject cards
  const subjects = loadSubjects();
  return subjects[subject] || [];
}

// Save cards for a specific subject to local storage
export function saveSubjectCards(subject, cards) {
  // Create a scoped constant for the current subjects, update the requested subject, and save
  const subjects = loadSubjects();
  subjects[subject] = cards;
  saveSubjects(subjects);
}

// Check subject input against existing subjects and return a near match
export function fuzzyMatch(subjectInput, subjects) {
  // Create a scoped constant for the normalized subject input
  const lower = subjectInput.toLowerCase().trim();
  for (const existing of Object.keys(subjects)) {
    if (existing.toLowerCase() === lower || existing.toLowerCase().includes(lower) || lower.includes(existing.toLowerCase())) {
      return existing;
    }
  }
  return null;
}

// Export cards in JSONL format
export function exportJSONL(subject) {
  const cards = getSubjectCards(subject);
  return cards.map(card => JSON.stringify({ subject, keyword: card.keyword, notes: card.notes })).join('\n');
}

// Import cards from JSONL format
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
