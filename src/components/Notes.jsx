import { useState, useEffect } from 'react'
import { loadSubjects, getSubjectCards, saveSubjectCards, fuzzyMatch } from '../utils/storage'
import { isLoggedIn, listSubjects, downloadSubject, uploadCards } from '../utils/api'

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
    async function load() {
      if (isLoggedIn()) {
        try {
          const serverSubs = await listSubjects()
          const subList = Array.isArray(serverSubs) ? serverSubs : serverSubs.subjects || []
          const subMap = {}
          for (const sub of subList) {
            try {
              const cards = await downloadSubject(sub)
              subMap[sub] = cards
              saveSubjectCards(sub, cards) // cache locally
            } catch {}
          }
          setSubjects(subMap)
        } catch {
          setSubjects(loadSubjects())
        }
      } else {
        setSubjects(loadSubjects())
      }
    }
    load()
  }, [])

  const handleSetSubject = () => {
    const input = subjectInput.trim()
    if (!input) return
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
  }

  const loadCards = (sub) => {
    const loaded = getSubjectCards(sub)
    setCards(loaded)
    setCurrentIndex(loaded.length > 0 ? 0 : -1)
    displayCard(loaded, loaded.length > 0 ? 0 : -1)
    setIsDirty(false)
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

  const navigate = (delta) => {
    if (isDirty) {
      setPopup({
        message: 'Unsaved changes. Save or discard?',
        onYes: () => { saveCurrent(); doNavigate(delta); setPopup(null) },
        onNo: () => { setIsDirty(false); doNavigate(delta); setPopup(null) }
      })
      return
    }
    doNavigate(delta)
  }

  const doNavigate = (delta) => {
    let newIdx = currentIndex + delta
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
    if (isLoggedIn() && currentSubject) {
      try {
        await uploadCards(currentSubject, newCards)
      } catch (err) {
        console.error('Failed to sync to server', err)
      }
    }
  }

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
