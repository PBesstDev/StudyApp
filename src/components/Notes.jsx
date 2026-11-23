import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, fuzzyMatch } from '../utils/storage'

export default function Notes() {
  const [subjects, setSubjects] = useState({})
  const [currentSubject, setCurrentSubject] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [keyword, setKeyword] = useState('')
  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  // Set the subject, with fuzzy matching to suggest existing subjects
  // Its a lot of try/catch blocks, but will hopefully lead to a cleaner user experience.
const handleSetSubject = () => {
  const input = subjectInput.trim()
  if (!input) return

  try {
    const match = fuzzyMatch(input, subjects)
    // If a near-identical subject exists, prompt user to choose between using the existing subject and creating a new one.
    if (match && match !== input) {
      setPopup({
        message: `Near-identical subject "${match}" exists. Use existing or create new?`,
        onYes: () => {
          try {
            setCurrentSubject(match)
            loadCards(match)
            setPopup(null)
          } catch (err) {
            console.error('Failed to load existing subject', err)
            setStatus(`Could not load "${match}": ${err.message || 'unknown error'}`)
            setPopup(null)
          }
        },
        onNo: () => {
          try {
            setCurrentSubject(input)
            loadCards(input)
            setPopup(null)
          } catch (err) {
            console.error('Failed to create subject', err)
            setStatus(`Could not create "${input}": ${err.message || 'unknown error'}`)
            setPopup(null)
          }
        }
      })
    // Else, if no near-identical subject exists, just set the current subject to the input and load its cards.
    } else {
      setCurrentSubject(input)
      loadCards(input)
    }
  } catch (err) {
    console.error('handleSetSubject failed', err)
    setStatus(`Subject error: ${err.message || 'unknown error'}`)
  }
}

  // Load the cards for the specified subject
  const loadCards = (sub) => {
    const loaded = getSubjectCards(sub)
    setCards(loaded)
    setCurrentIndex(loaded.length > 0 ? 0 : -1)
    displayCard(loaded, loaded.length > 0 ? 0 : -1)
    setIsDirty(false)
  }

  // Display the card at the specified index, else clear the fields if the index is out of bounds
  const displayCard = (cardList, idx) => {
    if (idx >= 0 && idx < cardList.length) {
      setKeyword(cardList[idx].keyword || '')
      setNotes(cardList[idx].notes || '')
    } else {
      setKeyword('')
      setNotes('')
    }
  }
  // Check for unsaved changes, and then navigate to the next or previous card
  const navigate = (change) => {
    if (isDirty) {
      setPopup({
        message: 'Unsaved changes. Save or discard?',
        onYes: () => { saveCurrent(); doNavigate(change); setPopup(null) },
        onNo: () => { setIsDirty(false); doNavigate(change); setPopup(null) }
      })
      return
    }
    doNavigate(change)
  }
  // Perform the actual navigation to the next or previous card
  const doNavigate = (change) => {
    let newIdx = currentIndex + change
    if (newIdx < 0) newIdx = 0
    if (newIdx >= cards.length) newIdx = cards.length - 1
    setCurrentIndex(newIdx)
    displayCard(cards, newIdx)
  }

  // Create a new card, prompting user to save if there are unsaved changes
  const createNew = () => {
    if (isDirty) {
      setPopup({
        message: 'Save before new card?',
        onYes: () => { saveCurrent(); addNew(); setPopup(null) },
        onNo: () => { setIsDirty(false); addNew(); setPopup(null) }
      })
      return
    }
    addNew()
  }

  // Add a new card to the list and reset the input fields
  const addNew = () => {
    const newCards = [...cards, { keyword: '', notes: '' }]
    setCards(newCards)
    setCurrentIndex(newCards.length - 1)
    setKeyword('')
    setNotes('')
    setIsDirty(false)
  }

  // Save current card, either updating an existing one or adding a new one, and persist the changes to storage
  const saveCurrent = () => {
    const newCards = [...cards]
    if (currentIndex >= 0 && currentIndex < newCards.length) {
      newCards[currentIndex] = { keyword, notes }
    } else {
      newCards.push({ keyword, notes })
      setCurrentIndex(newCards.length - 1)
    }
    setCards(newCards)
    saveSubjectCards(currentSubject, newCards)
    setIsDirty(false)
  }

  // Actual component rendering
  return (
    <div>
      <h2>Take Notes</h2>
      <div>
        <input
          value={subjectInput}
          onChange={e => setSubjectInput(e.target.value)}
          placeholder="Study subject (e.g. Math)"
        />
        <button onClick={handleSetSubject}>Set Subject</button>
        {Object.keys(subjects).length > 0 && (
          <select onChange={e => { if (e.target.value) { setCurrentSubject(e.target.value); setSubjectInput(e.target.value); loadCards(e.target.value) } }}>
            <option value="">-- Select existing --</option>
            {Object.keys(subjects).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {currentSubject && (
        <div>
          <div className="flashcard">
            <input value={keyword} onChange={e => { setKeyword(e.target.value); setIsDirty(true) }} placeholder="Keyword / Key Phrase" />
            <textarea value={notes} onChange={e => { setNotes(e.target.value); setIsDirty(true) }} placeholder="Associated notes" rows="5" />
          </div>
          <button onClick={() => navigate(-1)}>Prev</button>
          <button onClick={() => navigate(1)}>Next</button>
          <button onClick={createNew}>New Card</button>
          <button onClick={() => { setKeyword(''); setNotes(''); setIsDirty(true) }}>Clear</button>
          <button onClick={saveCurrent}>Save</button>
          <span>Card {currentIndex + 1} of {cards.length} | Subject: {currentSubject}</span>
        </div>
      )}
      {popup && (
        <div className="popup">
          <p>{popup.message}</p>
          <button onClick={popup.onYes}>Yes / Save</button>
          <button onClick={popup.onNo}>No / Discard</button>
          <button onClick={() => setPopup(null)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
