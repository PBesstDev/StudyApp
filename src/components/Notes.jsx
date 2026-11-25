import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, fuzzyMatch } from '../utils/storage'
import { isLoggedIn, getSubjects, downloadCards, uploadCards } from '../utils/api'

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
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadInitialSubjects()
  }, [])

  const loadInitialSubjects = async () => {
    const local = loadSubjects()
    setSubjects(local)
    if (isLoggedIn()) {
      try {
        const serverSubs = await getSubjects()
        const merged = { ...local }
        serverSubs.forEach(s => { if (!merged[s]) merged[s] = [] })
        setSubjects(merged)
      } catch (err) {
        console.warn('Could not load server subjects', err)
      }
    }
  }

  const loadCards = async (sub) => {
    let loaded = getSubjectCards(sub)
    if (isLoggedIn() && loaded.length === 0) {
      try {
        const serverCards = await downloadCards(sub)
        if (serverCards.length > 0) {
          saveSubjectCards(sub, serverCards)
          loaded = serverCards
          setStatus(`Loaded ${serverCards.length} cards from server`)
        }
      } catch (err) {
        console.warn('Could not download from server', err)
      }
    }
    setCards(loaded)
    setCurrentIndex(loaded.length > 0 ? 0 : -1)
    displayCard(loaded, loaded.length > 0 ? 0 : -1)
    setIsDirty(false)
  }

  const handleSetSubject = () => {
    const input = subjectInput.trim()
    if (!input) return
    try {
      const match = fuzzyMatch(input, subjects)
      if (match && match !== input) {
        setPopup({
          message: `Near-identical subject "${match}" exists. Use existing or create new?`,
          onYes: () => { setCurrentSubject(match); loadCards(match); setPopup(null) },
          onNo: () => { setCurrentSubject(input); loadCards(input); setPopup(null) }
        })
      } else {
        setCurrentSubject(input)
        loadCards(input)
      }
    } catch (err) {
      setStatus(`Subject error: ${err.message}`)
    }
  }

  const displayCard = (cardList, idx) => {
    if (idx >= 0 && idx < cardList.length) {
      setKeyword(cardList[idx].keyword || '')
      setNotes(cardList[idx].notes || '')
    } else {
      setKeyword('')
      setNotes('')
    }
  }

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

  const doNavigate = (change) => {
    let newIdx = currentIndex + change
    if (newIdx < 0) newIdx = 0
    if (newIdx >= cards.length) newIdx = cards.length - 1
    setCurrentIndex(newIdx)
    displayCard(cards, newIdx)
  }

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

  const addNew = () => {
    const newCards = [...cards, { keyword: '', notes: '' }]
    setCards(newCards)
    setCurrentIndex(newCards.length - 1)
    setKeyword('')
    setNotes('')
    setIsDirty(false)
  }

  const saveCurrent = async () => {
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

    // Also push to server if logged in
    if (isLoggedIn() && currentSubject) {
      try {
        await uploadCards(currentSubject, newCards)
        setStatus('Saved to server')
      } catch (err) {
        setStatus('Saved locally (server push failed: ' + err.message + ')')
      }
    }
  }

  return (
    <div>
      <h2>Take Notes</h2>
      {status && <div>{status}</div>}
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
