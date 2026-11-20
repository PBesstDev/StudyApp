import { useState, useEffect } from 'react'
import { getSubjects, getCards, setCards, fuzzyFindSubject } from '../utils/storage'

function Notes() {
  const [subjects, setSubjects] = useState([])
  const [currentSubject, setCurrentSubject] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [cards, setCardsState] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    setSubjects(getSubjects())
  }, [])

  const loadSubject = (sub) => {
    setCurrentSubject(sub)
    const loaded = getCards(sub)
    const cardList = loaded.length ? loaded : [{ keyword: '', notes: '' }]
    setCardsState(cardList)
    setCurrentIndex(0)
    setKeyword(cardList[0].keyword)
    setNotes(cardList[0].notes)
    setIsDirty(false)
  }

  const handleSubject = () => {
    const input = subjectInput.trim()
    if (!input) return
    const existing = fuzzyFindSubject(input)
    if (existing && existing.toLowerCase() !== input.toLowerCase()) {
      setPopup({
        message: `Near-identical subject "${existing}" exists. Use existing or create new?`,
        onYes: () => { loadSubject(existing); setPopup(null); },
        onNo: () => { loadSubject(input); setPopup(null); }
      })
    } else {
      loadSubject(existing || input)
    }
  }

  const updateUI = (idx = currentIndex, cardList = cards) => {
    const card = cardList[idx] || { keyword: '', notes: '' }
    setKeyword(card.keyword)
    setNotes(card.notes)
    setIsDirty(false)
  }

  const saveCard = () => {
    if (!currentSubject) return
    const newCards = [...cards]
    newCards[currentIndex] = { keyword, notes }
    setCards(currentSubject, newCards)
    setCardsState(newCards)
    setIsDirty(false)
  }

  const navigate = (dir) => {
    if (isDirty) {
      setPopup({
        message: 'Save changes before navigating?',
        onYes: () => { saveCard(); doNav(dir); setPopup(null); },
        onNo: () => { setIsDirty(false); doNav(dir); setPopup(null); }
      })
    } else {
      doNav(dir)
    }
  }

  const doNav = (dir) => {
    const newIdx = Math.max(0, Math.min(cards.length - 1, currentIndex + dir))
    setCurrentIndex(newIdx)
    updateUI(newIdx)
  }

  const createNew = () => {
    if (isDirty) {
      setPopup({
        message: 'Save before creating new card?',
        onYes: () => { saveCard(); addNew(); setPopup(null); },
        onNo: () => { setIsDirty(false); addNew(); setPopup(null); }
      })
    } else {
      addNew()
    }
  }

  const addNew = () => {
    const newCards = [...cards, { keyword: '', notes: '' }]
    setCards(currentSubject, newCards)
    setCardsState(newCards)
    setCurrentIndex(newCards.length - 1)
    updateUI(newCards.length - 1, newCards)
  }

  return (
    <div className="module">
      <h2>Take Notes</h2>
      <div>
        <input 
          value={subjectInput} 
          onChange={e => setSubjectInput(e.target.value)} 
          placeholder="Subject (e.g. Math)" 
          list="subjects"
        />
        <datalist id="subjects">
          {subjects.map(s => <option key={s} value={s} />)}
        </datalist>
        <button onClick={handleSubject}>Load / Create Subject</button>
      </div>
      {currentSubject && (
        <div>
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setIsDirty(true); }} placeholder="Keyword / Key phrase" />
          <textarea value={notes} onChange={e => { setNotes(e.target.value); setIsDirty(true); }} rows="5" placeholder="Notes / definition" />
          <div>
            <button onClick={() => navigate(-1)}>Prev</button>
            <button onClick={() => navigate(1)}>Next</button>
            <button onClick={createNew}>New Card</button>
            <button onClick={() => { setKeyword(''); setNotes(''); setIsDirty(true); }}>Clear</button>
            <button onClick={saveCard}>Save</button>
          </div>
          <p>Card {currentIndex + 1} of {cards.length} - {currentSubject}</p>
        </div>
      )}
      {popup && (
        <div className="non-intrusive-popup">
          <p>{popup.message}</p>
          <button onClick={popup.onYes}>Yes / Save</button>
          <button onClick={popup.onNo}>No / Discard</button>
          <button onClick={() => setPopup(null)}>Close</button>
        </div>
      )}
    </div>
  )
}

export default Notes
