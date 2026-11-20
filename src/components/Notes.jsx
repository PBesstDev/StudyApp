import { useState, useEffect } from 'react'
import { getSubjects, getCards, setCards, fuzzyFindSubject } from '../utils/storage.js'

export default function Notes() {
  const [subjectInput, setSubjectInput] = useState('')
  const [currentSubject, setCurrentSubject] = useState('')
  const [cards, setCardsState] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    if (currentSubject) {
      const loaded = getCards(currentSubject)
      setCardsState(loaded.length ? loaded : [{ keyword: '', notes: '' }])
      setCurrentIndex(0)
    }
  }, [currentSubject])

  useEffect(() => {
    if (cards.length > 0) {
      const card = cards[currentIndex] || { keyword: '', notes: '' }
      setKeyword(card.keyword)
      setNotes(card.notes)
      setIsDirty(false)
    }
  }, [currentIndex, cards])

  const handleSubject = () => {
    const input = subjectInput.trim()
    if (!input) return
    const existing = fuzzyFindSubject(input)
    if (existing && existing.toLowerCase() !== input.toLowerCase()) {
      setPopup({
        msg: `Similar subject "${existing}" exists. Use it or create new?`,
        onYes: () => { setCurrentSubject(existing); setPopup(null); },
        onNo: () => { setCurrentSubject(input); setPopup(null); }
      })
    } else {
      setCurrentSubject(existing || input)
    }
  }

  const saveCurrent = () => {
    if (!currentSubject) return
    const updated = [...cards]
    updated[currentIndex] = { keyword, notes }
    setCards(currentSubject, updated)
    setCardsState(updated)
    setIsDirty(false)
  }

  const navigate = (dir) => {
    if (isDirty) {
      setPopup({
        msg: 'Save changes before moving?',
        onYes: () => { saveCurrent(); doNav(dir); setPopup(null); },
        onNo: () => { setIsDirty(false); doNav(dir); setPopup(null); }
      })
      return
    }
    doNav(dir)
  }

  const doNav = (dir) => {
    setCurrentIndex(Math.max(0, Math.min(cards.length - 1, currentIndex + dir)))
  }

  const createNew = () => {
    if (isDirty) {
      setPopup({
        msg: 'Save before new card?',
        onYes: () => { saveCurrent(); addNew(); setPopup(null); },
        onNo: () => { setIsDirty(false); addNew(); setPopup(null); }
      })
      return
    }
    addNew()
  }

  const addNew = () => {
    const updated = [...cards, { keyword: '', notes: '' }]
    setCardsState(updated)
    setCurrentIndex(updated.length - 1)
    if (currentSubject) setCards(currentSubject, updated)
  }

  return (
    <div className="module">
      <h2>Take Notes</h2>
      <div>
        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject (Math, Biology...)" list="subjects" />
        <datalist id="subjects">{getSubjects().map(s => <option key={s} value={s} />)}</datalist>
        <button onClick={handleSubject}>Load / Create</button>
      </div>
      {currentSubject && (
        <div>
          <p>Subject: {currentSubject} | Card {currentIndex + 1} of {cards.length}</p>
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setIsDirty(true); }} placeholder="Keyword / Key phrase" />
          <textarea value={notes} onChange={e => { setNotes(e.target.value); setIsDirty(true); }} placeholder="Notes / definition" />
          <div>
            <button onClick={() => navigate(-1)}>Prev</button>
            <button onClick={() => navigate(1)}>Next</button>
            <button onClick={createNew}>New Card</button>
            <button onClick={saveCurrent}>Save</button>
            <button onClick={() => { setKeyword(''); setNotes(''); setIsDirty(true); }}>Clear</button>
          </div>
        </div>
      )}
      {popup && (
        <div className="non-intrusive-popup">
          <p>{popup.msg}</p>
          <button onClick={popup.onYes}>Yes / Save</button>
          <button onClick={popup.onNo}>No / Discard</button>
          <button onClick={() => setPopup(null)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
